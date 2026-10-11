import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LotsManager from '@/features/coupe/lots-manager';
import { requirePageRole } from '@/server/auth/guards';

export const metadata = { title: 'Lots de coupe' };

export default async function CoupeLotsPage() {
  await requirePageRole('chef_coupe');
  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Lots de coupe
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Création et suivi des lots. Ouvrez un lot pour gérer ses tâches, ses
        résultats, ses paquets et son transfert vers la couture.
      </Typography>
      <LotsManager />
    </Stack>
  );
}
