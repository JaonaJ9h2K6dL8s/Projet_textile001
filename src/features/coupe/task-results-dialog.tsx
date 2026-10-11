'use client';

import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useMemo, useState } from 'react';
import { apiPatch } from '@/services/api-client';
import type { TaskDTO } from '@/types/coupe';

/**
 * Saisie des résultats réels d'une tâche, par taille (pièces coupées,
 * utilisables, en anomalie, déchets) et consommations de tissu.
 * Une correction sur une tâche validée exige un motif et invalide
 * l'approbation précédente (vérifié côté serveur).
 */
export default function TaskResultsDialog({
  task,
  lotSizes,
  open,
  onClose,
  onSaved,
}: {
  task: TaskDTO | null;
  lotSizes: { sizeId: number; sizeLabel: string; plannedQty: number }[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<Record<number, { cut: string; usable: string; anomaly: string; waste: string }>>({});
  const [consumptions, setConsumptions] = useState<Record<number, string>>({});
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState<number | null>(null);

  const rollIds = useMemo(() => task?.rolls ?? [], [task]);

  if (task && initialized !== task.id) {
    setInitialized(task.id);
    const initial: typeof rows = {};
    for (const size of lotSizes) {
      const existing = task.results.find((row) => row.sizeId === size.sizeId);
      initial[size.sizeId] = {
        cut: existing ? String(existing.cutQty) : '',
        usable: existing ? String(existing.usableQty) : '',
        anomaly: existing ? String(existing.anomalyQty) : '0',
        waste: existing ? String(existing.wasteQty) : '0',
      };
    }
    setRows(initial);
    const initialConsumptions: Record<number, string> = {};
    for (const roll of rollIds) {
      initialConsumptions[roll.rollId] = roll.weightUsed === null ? '' : String(roll.weightUsed);
    }
    setConsumptions(initialConsumptions);
    setReason('');
    setError(null);
  }

  function updateRow(sizeId: number, field: 'cut' | 'usable' | 'anomaly' | 'waste', value: string) {
    setRows((prev) => ({
      ...prev,
      [sizeId]: { ...prev[sizeId], [field]: value },
    }));
  }

  async function handleSubmit() {
    if (!task) return;
    setSaving(true);
    setError(null);
    try {
      const results = lotSizes
        .filter((size) => rows[size.sizeId]?.cut !== undefined && rows[size.sizeId]?.cut !== '')
        .map((size) => ({
          sizeId: size.sizeId,
          cutQty: rows[size.sizeId].cut,
          usableQty: rows[size.sizeId].usable || '0',
          anomalyQty: rows[size.sizeId].anomaly || '0',
          wasteQty: rows[size.sizeId].waste || '0',
        }));
      if (results.length === 0) {
        throw new Error('Saisissez au moins une quantité coupée.');
      }
      const consumptionList = rollIds
        .filter((roll) => consumptions[roll.rollId])
        .map((roll) => ({
          rollId: roll.rollId,
          weightUsed: consumptions[roll.rollId],
        }));
      await apiPatch(`/api/coupe/tasks/${task.id}`, {
        action: 'set_results',
        results,
        consumptions: consumptionList,
        reason: reason || undefined,
      });
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Résultats réels — {task?.code ?? ''}
        {task?.status === 'validee'
          ? ' (correction : nouvelle validation requise)'
          : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} className="pt-1">
          {error ? <Alert severity="error">{error}</Alert> : null}
          {lotSizes.map((size) => (
            <Stack key={size.sizeId} spacing={1}>
              <Typography variant="subtitle2">
                {size.sizeLabel} — prévu : {size.plannedQty} pièces
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  size="small"
                  type="number"
                  inputProps={{ min: 0 }}
                  label="Coupées"
                  value={rows[size.sizeId]?.cut ?? ''}
                  onChange={(event) => updateRow(size.sizeId, 'cut', event.target.value)}
                  className="flex-1"
                />
                <TextField
                  size="small"
                  type="number"
                  inputProps={{ min: 0 }}
                  label="Utilisables"
                  value={rows[size.sizeId]?.usable ?? ''}
                  onChange={(event) => updateRow(size.sizeId, 'usable', event.target.value)}
                  className="flex-1"
                />
                <TextField
                  size="small"
                  type="number"
                  inputProps={{ min: 0 }}
                  label="Anomalies"
                  value={rows[size.sizeId]?.anomaly ?? ''}
                  onChange={(event) => updateRow(size.sizeId, 'anomaly', event.target.value)}
                  className="flex-1"
                />
                <TextField
                  size="small"
                  type="number"
                  inputProps={{ min: 0 }}
                  label="Déchets (pièces)"
                  value={rows[size.sizeId]?.waste ?? ''}
                  onChange={(event) => updateRow(size.sizeId, 'waste', event.target.value)}
                  className="flex-1"
                />
              </Stack>
            </Stack>
          ))}
          {rollIds.length > 0 ? (
            <>
              <Typography variant="subtitle2">
                Consommation de tissu (kg) — refusée si supérieure au disponible
              </Typography>
              {rollIds.map((roll) => (
                <Stack key={roll.rollId} direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" className="w-40">
                    {roll.rollCode}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: '0.01' }}
                    label="Kg consommés"
                    value={consumptions[roll.rollId] ?? ''}
                    onChange={(event) =>
                      setConsumptions((prev) => ({ ...prev, [roll.rollId]: event.target.value }))
                    }
                  />
                </Stack>
              ))}
            </>
          ) : null}
          {task?.status === 'validee' ? (
            <TextField
              label="Motif de la correction (obligatoire)"
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              helperText="L'ancienne valeur est conservée dans l'historique et la validation est invalidée."
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer les résultats'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
