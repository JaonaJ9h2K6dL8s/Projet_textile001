'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_BY_ROLE } from '@/lib/permissions';
import type { RoleCode } from '@/lib/roles';
import NavIcon from './nav-icon';

/**
 * Contenu de la barre latérale : identité de l'application, puis
 * navigation filtrée selon le rôle. Le filtrage visuel complète mais
 * ne remplace jamais les vérifications côté serveur.
 */
export default function SidebarContent({ roleCode }: { roleCode: RoleCode }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[roleCode];

  return (
    <Box className="flex h-full flex-col">
      <Toolbar className="items-center">
        <Box className="flex items-center gap-2 py-1">
          <Box
            aria-hidden
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              boxShadow: '0 4px 10px rgba(236,72,153,.35)',
            }}
          >
            JO
          </Box>
          <Box>
            <Typography variant="subtitle1" component="p" className="leading-tight">
              JO Management
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gestion intégrée de l’entreprise
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List dense className="flex-1 overflow-y-auto">
        {items.map((item) => {
          const selected = item.href !== undefined && pathname.startsWith(item.href);
          return (
            <ListItem key={item.label} disablePadding
              secondaryAction={
                item.enabled ? undefined : (
                  <Chip label="À venir" size="small" variant="outlined" />
                )
              }
            >
              {item.enabled && item.href ? (
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={selected}
                  aria-label={item.label}
                >
                  <ListItemIcon>
                    <NavIcon iconKey={item.iconKey} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ) : (
                <ListItemButton disabled aria-label={item.label}>
                  <ListItemIcon>
                    <NavIcon iconKey={item.iconKey} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
