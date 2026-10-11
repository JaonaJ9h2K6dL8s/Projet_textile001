import { createTheme, alpha } from '@mui/material/styles';

/**
 * Thème visuel JO Management — style « dashboard carte » : fond gris-lavande
 * clair, cartes blanches arrondies avec ombres douces, en-têtes de tableaux
 * sombres, boutons et champs arrondis. La logique métier n'est pas affectée.
 */
const primaryMain = '#155e75';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
      light: '#0e7490',
      dark: '#164e63',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#b45309',
      light: '#d97706',
      dark: '#92400e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f6fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#5b6472',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      '"Segoe UI", "Helvetica Neue", Arial, "Liberation Sans", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f5f6fa' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #eef0f5',
          boxShadow:
            '0 1px 2px rgba(16,24,40,.04), 0 6px 20px rgba(16,24,40,.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(16,24,40,.12)' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${primaryMain}, #0e7490)`,
          '&:hover': { background: `linear-gradient(135deg, #164e63, ${primaryMain})` },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#fff' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#eef0f5' },
        head: {
          backgroundColor: '#1e293b',
          color: '#ffffff',
          fontWeight: 600,
          borderColor: '#1e293b',
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 8,
          paddingBlock: 6,
          width: 'auto',
          '&:hover': { backgroundColor: alpha(primaryMain, 0.05) },
        },
        selected: {
          backgroundColor: alpha(primaryMain, 0.1),
          color: primaryMain,
          '& .MuiListItemIcon-root': { color: primaryMain },
          '&:hover': { backgroundColor: alpha(primaryMain, 0.14) },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 6, height: 6 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 14 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, alignItems: 'center' },
      },
    },
  },
});
