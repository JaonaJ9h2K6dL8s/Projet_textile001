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
import { MODULES } from '@/lib/modules';

/**
 * Contenu de la barre latérale : identité de l'application
 * puis liste des modules prévus (désactivés tant que les
 * fonctionnalités métier ne sont pas développées).
 */
export default function SidebarContent() {
  return (
    <Box className="flex h-full flex-col">
      <Toolbar className="items-start">
        <Box className="py-1">
          <Typography variant="h6" color="primary" component="p">
            JO Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gestion intégrée de l’entreprise
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List dense className="flex-1 overflow-y-auto">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <ListItem
              key={module.key}
              disablePadding
              secondaryAction={
                <Chip label="À venir" size="small" variant="outlined" />
              }
            >
              <ListItemButton disabled aria-label={module.label}>
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={module.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
