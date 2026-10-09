import { createTheme } from '@mui/material/styles';

/**
 * Thème visuel JO Management.
 * Palette sobre et professionnelle adaptée à un contexte industriel textile.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#155e75',
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
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily:
      '"Segoe UI", "Helvetica Neue", Arial, "Liberation Sans", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f4f6f8' },
      },
    },
  },
});
