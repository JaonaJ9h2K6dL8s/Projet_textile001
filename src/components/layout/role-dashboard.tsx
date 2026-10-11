import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import NavIcon from './nav-icon';
import type { NavIconKey } from '@/lib/permissions';

/**
 * Tableau de bord générique d'un espace métier : message d'accueil
 * personnalisé et raccourcis autorisés selon le rôle, présentés en
 * cartes dégradées colorées. Aucune donnée de production n'est simulée.
 */

export interface DashboardShortcut {
  label: string;
  description: string;
  iconKey: NavIconKey;
  href?: string;
  enabled?: boolean;
}

const GRADIENTS = [
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
  'linear-gradient(135deg, #155e75, #0e7490)',
];

export default function RoleDashboard({
  greeting,
  roleLabel,
  subtitle,
  shortcuts,
}: {
  greeting: string;
  roleLabel: string;
  subtitle: string;
  shortcuts: DashboardShortcut[];
}) {
  return (
    <Stack spacing={3}>
      <Paper className="p-6">
        <Stack direction="row" spacing={2} alignItems="center" useFlexGap>
          <Box
            aria-hidden
            sx={{
              width: 46,
              height: 46,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              color: '#fff',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              boxShadow: '0 4px 10px rgba(236,72,153,.3)',
            }}
          >
            {roleLabel.charAt(0)}
          </Box>
          <Box>
            <Typography variant="h5" component="h2">
              {greeting}
            </Typography>
            <Stack direction="row" spacing={1} className="mt-1" useFlexGap>
              <Chip label={roleLabel} color="primary" size="small" />
            </Stack>
            <Typography color="text.secondary" className="mt-1">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Typography variant="h6" component="h3">
        Raccourcis autorisés
      </Typography>
      <Grid container spacing={2}>
        {shortcuts.map((shortcut, index) => {
          const enabled = shortcut.enabled && shortcut.href;
          const content = (
            <Paper
              className="h-full p-3"
              sx={{
                borderRadius: 3,
                border: 'none',
                color: '#fff',
                background: GRADIENTS[index % GRADIENTS.length],
                transition: 'transform .18s, box-shadow .18s',
                ...(enabled
                  ? {
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 10px 24px rgba(16,24,40,.18)',
                      },
                    }
                  : { opacity: 0.55 }),
              }}
            >
              <Stack spacing={1.5}>
                <Box
                  aria-hidden
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,.22)',
                    color: '#fff',
                  }}
                >
                  <NavIcon iconKey={shortcut.iconKey} fontSize="small" />
                </Box>
                <Typography variant="subtitle1" component="h4" className="leading-tight">
                  {shortcut.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.85)' }}>
                  {shortcut.description}
                </Typography>
                {enabled ? null : (
                  <Chip
                    label="À venir"
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      bgcolor: 'rgba(255,255,255,.25)',
                      color: '#fff',
                    }}
                  />
                )}
              </Stack>
            </Paper>
          );
          return (
            <Grid key={shortcut.label} size={{ xs: 12, sm: 6, md: 4 }}>
              {enabled ? (
                <Link href={shortcut.href as string} underline="none" color="inherit">
                  {content}
                </Link>
              ) : (
                content
              )}
            </Grid>
          );
        })}
      </Grid>

      <Paper className="p-4">
        <Typography variant="body2" color="text.secondary">
          Les fonctionnalités métier de ce module seront activées
          progressivement dans les prochaines étapes du projet.
        </Typography>
      </Paper>
    </Stack>
  );
}
