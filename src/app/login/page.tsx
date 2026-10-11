import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import ServerStatusBadge from '@/components/layout/server-status-badge';
import { getCurrentUser } from '@/server/auth/current-user';
import { homePathForRole } from '@/lib/permissions';
import { hasAnyAdmin } from '@/server/users/users-service';

export const metadata = { title: 'Connexion' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(
      user.mustChangePassword ? '/change-password' : homePathForRole(user.roleCode),
    );
  }

  return (
    <Box
      className="flex min-h-screen items-center justify-center p-4"
      sx={{
        backgroundColor: '#e3e7e6',
      }}
    >
      <LoginForm adminExists={hasAnyAdmin()} />
      <ServerStatusBadge />
      <Typography
        variant="caption"
        color="text.secondary"
        className="fixed bottom-3"
      >
        JO Management — Gestion intégrée de l’entreprise
      </Typography>
    </Box>
  );
}
