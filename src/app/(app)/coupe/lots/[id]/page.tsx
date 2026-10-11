import LotDetail from '@/features/coupe/lot-detail';
import { requirePageRole } from '@/server/auth/guards';

export const metadata = { title: 'Fiche du lot — Coupe' };

export default async function CoupeLotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole('chef_coupe');
  const { id } = await params;
  return <LotDetail lotId={Number(id)} />;
}
