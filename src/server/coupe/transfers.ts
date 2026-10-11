import { ServiceError } from '@/server/api/service-error';
import { sessionsDb } from '@/server/auth/sessions';
import type { Actor } from '@/server/users/users-service';
import type {
  LotStatus,
  TransferDTO,
  TransferEligibilityDTO,
} from '@/types/coupe';
import { LOT_STATUS_LABELS } from '@/types/coupe';
import { addHistory, requireCoupe, requireId } from './common';
import { computeCompleteness } from './lot-queries';

/**
 * Transferts vers la Couture.
 * Règle absolue : aucun lot ne peut être transféré tant que toutes ses
 * tâches obligatoires ne sont pas terminées, validées et conformes.
 * Toutes les vérifications sont refaites à l'intérieur de la transaction
 * de confirmation ; aucun contournement n'est possible, même pour un admin.
 */

const TRANSFERABLE_STATUSES: LotStatus[] = [
  'en_cours',
  'attente_validation',
  'pret_transfert',
];

function buildReasons(
  db: ReturnType<typeof sessionsDb>,
  lotId: number,
  lotStatus: LotStatus,
): string[] {
  const reasons: string[] = [];
  if (!TRANSFERABLE_STATUSES.includes(lotStatus)) {
    reasons.push(
      `Le statut actuel du lot (« ${LOT_STATUS_LABELS[lotStatus]} ») n'autorise pas le transfert.`,
    );
  }
  const taskCount = db
    .prepare('SELECT COUNT(*) AS n FROM coupe_tasks WHERE lot_id = ?')
    .get(lotId) as { n: number };
  if (taskCount.n === 0) {
    reasons.push('Aucune tâche n’a été créée pour ce lot.');
  }
  const completeness = computeCompleteness(db, lotId);
  if (completeness.totalMandatory === 0 && taskCount.n > 0) {
    const optionalDone = db
      .prepare(
        `SELECT COUNT(*) AS n FROM coupe_tasks
         WHERE lot_id = ? AND is_mandatory = 0 AND status = 'validee'`,
      )
      .get(lotId) as { n: number };
    if (optionalDone.n === 0) {
      reasons.push(
        'Le lot ne comporte aucune tâche obligatoire validée : au moins une tâche validée est requise.',
      );
    }
  }
  for (const blocking of completeness.blockingTasks) {
    reasons.push(
      `Tâche ${blocking.code} (« ${blocking.description} ») non validée (statut : ${blocking.status}).`,
    );
  }
  const badRolls = db
    .prepare(
      `SELECT DISTINCT r.code, r.status
       FROM coupe_task_rolls tr
       JOIN coupe_rolls r ON r.id = tr.roll_id
       JOIN coupe_tasks t ON t.id = tr.task_id
       WHERE t.lot_id = ? AND r.status IN ('bloque', 'defectueux')`,
    )
    .all(lotId) as Array<{ code: string; status: string }>;
  for (const roll of badRolls) {
    reasons.push(
      `Le rouleau ${roll.code} est ${roll.status === 'bloque' ? 'bloqué' : 'défectueux'} : résolvez son statut avant le transfert.`,
    );
  }
  const badWeights = db
    .prepare(
      `SELECT DISTINCT r.code
       FROM coupe_task_rolls tr
       JOIN coupe_rolls r ON r.id = tr.roll_id
       JOIN coupe_tasks t ON t.id = tr.task_id
       WHERE t.lot_id = ? AND (r.initial_weight_kg < 9 OR r.initial_weight_kg > 30)`,
    )
    .all(lotId) as Array<{ code: string }>;
  for (const roll of badWeights) {
    reasons.push(
      `Le poids initial du rouleau ${roll.code} est hors de la plage 9–30 kg : vérifiez-le.`,
    );
  }
  return reasons;
}

function buildEligibility(
  db: ReturnType<typeof sessionsDb>,
  lotId: number,
): TransferEligibilityDTO {
  const lot = db
    .prepare('SELECT status FROM coupe_lots WHERE id = ?')
    .get(lotId) as { status: LotStatus } | undefined;
  if (!lot) throw new ServiceError('Lot introuvable.', 404);
  const existing = db
    .prepare('SELECT id FROM coupe_transfers WHERE lot_id = ?')
    .get(lotId) as { id: number } | undefined;
  const completeness = computeCompleteness(db, lotId);
  const reasons = existing
    ? ['Ce lot a déjà fait l’objet d’un transfert confirmé.']
    : buildReasons(db, lotId, lot.status);
  return {
    eligible: reasons.length === 0,
    transferred: Boolean(existing),
    lotStatus: lot.status,
    completeness,
    reasons,
  };
}

export function getEligibility(
  actor: Actor,
  rawLotId: unknown,
): TransferEligibilityDTO {
  requireCoupe(actor);
  const lotId = requireId(rawLotId, 'Identifiant du lot');
  return buildEligibility(sessionsDb(), lotId);
}

/** Attribue le statut « prêt pour transfert » si toutes les conditions passent. */
export function markLotReady(actor: Actor, rawLotId: unknown): void {
  requireCoupe(actor);
  const lotId = requireId(rawLotId, 'Identifiant du lot');
  const db = sessionsDb();
  const apply = db.transaction(() => {
    const eligibility = buildEligibility(db, lotId);
    if (eligibility.transferred) {
      throw new ServiceError('Ce lot est déjà transféré.', 409);
    }
    if (!eligibility.eligible) {
      throw new ServiceError(
        `Transfert impossible : ${eligibility.reasons.join(' ')}`,
        409,
      );
    }
    db.prepare(
      "UPDATE coupe_lots SET status = 'pret_transfert', updated_at = datetime('now') WHERE id = ?",
    ).run(lotId);
    addHistory(db, {
      action: 'LOT_READY_FOR_TRANSFER',
      entityType: 'lot',
      entityId: lotId,
      actorId: actor.id,
    });
  });
  apply();
}

/** Quantités utilisables validées par taille (base des lignes de transfert). */
function collectValidatedQuantities(
  db: ReturnType<typeof sessionsDb>,
  lotId: number,
): Array<{ sizeId: number; qty: number }> {
  return db
    .prepare(
      `SELECT r.size_id AS sizeId, SUM(r.usable_qty) AS qty
       FROM coupe_results r
       JOIN coupe_tasks t ON t.id = r.task_id
       WHERE t.lot_id = ? AND t.status = 'validee'
       GROUP BY r.size_id
       ORDER BY r.size_id`,
    )
    .all(lotId) as Array<{ sizeId: number; qty: number }>;
}

export function confirmTransfer(
  actor: Actor,
  rawLotId: unknown,
  input: Record<string, unknown>,
): TransferDTO {
  requireCoupe(actor);
  const lotId = requireId(rawLotId, 'Identifiant du lot');
  const db = sessionsDb();
  const notes = typeof input.notes === 'string' ? input.notes.trim().slice(0, 300) : null;
  const run = db.transaction((): number => {
    // 1. Relecture complète de l'état du lot dans la transaction.
    const eligibility = buildEligibility(db, lotId);
    if (eligibility.transferred) {
      throw new ServiceError(
        'Ce lot a déjà été transféré : double transfert refusé.',
        409,
      );
    }
    if (!eligibility.eligible) {
      throw new ServiceError(
        `Transfert refusé : ${eligibility.reasons.join(' ')}`,
        409,
      );
    }
    const lot = db
      .prepare(
        `SELECT l.id, l.code, l.product_id, l.color_id FROM coupe_lots l WHERE l.id = ?`,
      )
      .get(lotId) as
      | { id: number; code: string; product_id: number; color_id: number }
      | undefined;
    if (!lot) throw new ServiceError('Lot introuvable.', 404);
    const quantities = collectValidatedQuantities(db, lotId).filter(
      (row) => row.qty > 0,
    );
    if (quantities.length === 0) {
      throw new ServiceError(
        'Transfert refusé : aucune quantité utilisable validée à transférer.',
        409,
      );
    }
    // 2. Écritures : transfert, lignes, statuts, paquets, historique.
    const transferCode = `TRF-${lot.code}`;
    const result = db
      .prepare(
        `INSERT INTO coupe_transfers (lot_id, code, performed_by, notes)
         VALUES (?, ?, ?, ?)`,
      )
      .run(lotId, transferCode, actor.id, notes);
    const transferId = Number(result.lastInsertRowid);
    for (const row of quantities) {
      db.prepare(
        `INSERT INTO coupe_transfer_lines
           (transfer_id, product_id, color_id, size_id, qty)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(transferId, lot.product_id, lot.color_id, row.sizeId, row.qty);
    }
    db.prepare(
      "UPDATE coupe_lots SET status = 'transfere', finished_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    ).run(lotId);
    db.prepare(
      "UPDATE coupe_bundles SET status = 'transfere', updated_at = datetime('now') WHERE lot_id = ?",
    ).run(lotId);
    addHistory(db, {
      action: 'TRANSFER_CONFIRMED',
      entityType: 'lot',
      entityId: lotId,
      actorId: actor.id,
      newValue: { transferCode, quantities },
    });
    return transferId;
  });
  const transferId = run();
  return getTransfer(actor, transferId);
}

export function getTransfer(actor: Actor, transferId: number): TransferDTO {
  requireCoupe(actor);
  const db = sessionsDb();
  const row = db
    .prepare(
      `SELECT t.id, t.lot_id, l.code AS lot_code, t.code, t.confirmed_at, t.notes,
              u.nom || ' ' || u.prenom AS performed_by
       FROM coupe_transfers t
       JOIN coupe_lots l ON l.id = t.lot_id
       JOIN users u ON u.id = t.performed_by
       WHERE t.id = ?`,
    )
    .get(transferId) as
    | {
        id: number;
        lot_id: number;
        lot_code: string;
        code: string;
        confirmed_at: string;
        notes: string | null;
        performed_by: string | null;
      }
    | undefined;
  if (!row) throw new ServiceError('Transfert introuvable.', 404);
  const lines = db
    .prepare(
      `SELECT tl.product_id, p.nom AS product_nom, c.nom AS color_nom,
              tl.size_id, s.nom AS size_label, tl.qty
       FROM coupe_transfer_lines tl
       JOIN products p ON p.id = tl.product_id
       JOIN colors c ON c.id = tl.color_id
       JOIN sizes s ON s.id = tl.size_id
       WHERE tl.transfer_id = ? ORDER BY tl.id`,
    )
    .all(transferId) as TransferDTO['lines'];
  return {
    id: row.id,
    lotId: row.lot_id,
    lotCode: row.lot_code,
    code: row.code,
    performedBy: row.performed_by,
    confirmedAt: row.confirmed_at,
    notes: row.notes,
    lines,
  };
}

export function listTransfers(actor: Actor): TransferDTO[] {
  requireCoupe(actor);
  const db = sessionsDb();
  const ids = db
    .prepare('SELECT id FROM coupe_transfers ORDER BY id DESC')
    .all() as Array<{ id: number }>;
  return ids.map((row) => getTransfer(actor, row.id));
}
