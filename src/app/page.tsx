import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DatabaseStatus from '@/components/home/database-status';
import ModulesOverview from '@/components/home/modules-overview';

export default function HomePage() {
  return (
    <Stack spacing={4}>
      <Paper variant="outlined" className="p-6">
        <Stack spacing={2}>
          <div>
            <Typography variant="h5" component="h2" gutterBottom>
              JO Management
            </Typography>
            <Typography color="text.secondary">
              Gestion intégrée de l’entreprise — plateforme de gestion pour
              l’entreprise textile. Les modules métier seront intégrés
              progressivement.
            </Typography>
          </div>
          <DatabaseStatus />
        </Stack>
      </Paper>
      <ModulesOverview />
    </Stack>
  );
}
