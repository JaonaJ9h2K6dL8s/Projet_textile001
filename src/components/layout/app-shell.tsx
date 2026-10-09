'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import type { ReactNode } from 'react';
import { useUiStore } from '@/store/ui-store';
import SidebarContent from './sidebar-content';
import TopBar, { DRAWER_WIDTH } from './top-bar';

/**
 * Coquille applicative : barre latérale responsive
 * (permanente sur grand écran, tiroir sur mobile),
 * barre supérieure et zone de contenu principale.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const closeMobileNav = useUiStore((state) => state.closeMobileNav);

  return (
    <Box className="flex min-h-screen">
      <TopBar />
      <Box
        component="nav"
        aria-label="Modules"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileNavOpen}
          onClose={closeMobileNav}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          <SidebarContent />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      </Box>
      <Box component="main" className="min-w-0 flex-1">
        <Toolbar />
        <Box className="jo-fade-in p-4 md:p-6">{children}</Box>
      </Box>
    </Box>
  );
}
