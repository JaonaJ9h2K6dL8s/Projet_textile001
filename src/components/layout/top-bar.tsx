'use client';

import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useUiStore } from '@/store/ui-store';

export const DRAWER_WIDTH = 280;

/**
 * Barre supérieure : bouton de navigation mobile et titre de section.
 */
export default function TopBar() {
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);

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
      <Toolbar>
        <IconButton
          aria-label="Ouvrir la navigation"
          edge="start"
          onClick={toggleMobileNav}
          sx={{ display: { md: 'none' }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="h1" noWrap>
          Accueil
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
