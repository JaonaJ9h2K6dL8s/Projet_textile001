'use client';

import MenuIcon from '@mui/icons-material/Menu';
import Logout from '@mui/icons-material/Logout';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUiStore } from '@/store/ui-store';
import type { SessionUser } from '@/types/auth';
import { apiPost } from '@/services/api-client';

export const DRAWER_WIDTH = 280;

/**
 * Barre supérieure : navigation mobile, identité de l'utilisateur
 * connecté (nom + rôle) et bouton de déconnexion.
 */
export default function TopBar({ user }: { user: SessionUser }) {
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiPost('/api/auth/logout', {});
    } catch {
      // La session est invalidée côté serveur ; on retourne à la connexion.
    }
    router.replace('/login');
  }

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
      }}
    >
      <Toolbar className="gap-2">
        <IconButton
          aria-label="Ouvrir la navigation"
          edge="start"
          onClick={toggleMobileNav}
          sx={{ display: { md: 'none' }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="h1" noWrap className="flex-1">
          {user.roleLabel}
        </Typography>
        <Box className="hidden items-center gap-2 sm:flex">
          <Box className="text-right leading-tight">
            <Typography variant="body2" noWrap>
              {user.prenom ? `${user.prenom} ${user.nom}` : user.nom}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.roleLabel}
            </Typography>
          </Box>
          <Avatar
            alt={user.nom}
            sx={{
              width: 36,
              height: 36,
              fontSize: 14,
              fontWeight: 700,
              bgcolor: 'transparent',
              color: '#fff',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              boxShadow: '0 3px 8px rgba(236,72,153,.35)',
            }}
          >
            {(user.prenom?.[0] ?? user.nom[0] ?? '?').toUpperCase()}
          </Avatar>
        </Box>
        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          startIcon={<Logout />}
          color="inherit"
        >
          Déconnexion
        </Button>
      </Toolbar>
    </AppBar>
  );
}
