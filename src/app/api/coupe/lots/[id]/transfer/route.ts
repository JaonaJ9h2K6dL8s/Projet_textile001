import { NextResponse } from 'next/server';
import {
  confirmTransfer,
  getEligibility,
  markLotReady,
} from '@/server/coupe/transfers';
import {
  errorResponse,
  readJsonBody,
  rejectCrossOrigin,
  requireCoupeGuard,
} from '@/server/coupe/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Suivi de complétude + éligibilité au transfert d'un lot. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const guard = await requireCoupeGuard();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await context.params;
    const eligibility = getEligibility(guard.actor, id);
    return NextResponse.json({ status: 'ok', item: eligibility });
  } catch (error) {
    return errorResponse(error, 'Erreur lors du contrôle du transfert.');
  }
}

/**
 * Confirmation du transfert vers la Couture. Toutes les conditions sont
 * revérifiées dans la transaction : aucune écriture partielle possible.
 * POST { action: 'ready' } attribue « prêt pour transfert » si éligible.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const guard = await requireCoupeGuard();
  if (!guard.ok) return guard.response;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request);
    if (String(body.action ?? '') === 'ready') {
      markLotReady(guard.actor, id);
      return NextResponse.json({ status: 'ok' });
    }
    const transfer = confirmTransfer(guard.actor, id, body);
    return NextResponse.json({ status: 'ok', item: transfer }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Erreur lors du transfert du lot.');
  }
}
