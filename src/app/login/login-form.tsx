'use client';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { apiPost } from '@/services/api-client';
import type { LoginResponse } from '@/types/auth';
import SetupFields from './setup-fields';

/**
 * Page de connexion JO Management — présentation deux panneaux avec
 * bascule « Connexion / Créer le compte administrateur ». Un seul
 * compte admin peut être créé : le serveur refuse les suivants (409).
 * Les messages d'erreur sont génériques : ils ne révèlent ni si
 * l'identifiant ni si le mot de passe est incorrect.
 */

const GREEN_DARK = '#0a5c3c';
const GREEN = '#0f7a4d';
const GREEN_SOFT = '#e6f4ec';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 999,
    backgroundColor: GREEN_SOFT,
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: '#bcd9c8' },
    '&.Mui-focused fieldset': { borderColor: GREEN },
  },
} as const;

type Mode = 'login' | 'setup';

function BrandBadge({ size = 64 }: { size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
      }}
    >
      <Typography
        sx={{ color: GREEN, fontWeight: 800, fontSize: size * 0.34, letterSpacing: 1 }}
      >
        JO
      </Typography>
    </Box>
  );
}

export default function LoginForm({ adminExists }: { adminExists: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }
    setLoading(true);
    try {
      const result = await apiPost<LoginResponse>('/api/auth/login', {
        username: username.trim(),
        password,
      });
      if (!('redirectTo' in result) || !result.redirectTo) {
        setError(
          'status' in result && 'message' in result
            ? result.message
            : 'Échec de la connexion.',
        );
        setLoading(false);
        return;
      }
      router.replace(result.redirectTo);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Échec de la connexion. Vérifiez vos identifiants.',
      );
      setLoading(false);
    }
  }

  const loginFields = (
    <>
      {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
      <TextField
        label="Identifiant"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoComplete="username"
        required
        fullWidth
        disabled={loading}
        sx={inputSx}
      />
      <TextField
        label="Mot de passe"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
        fullWidth
        disabled={loading}
        sx={inputSx}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  onClick={() => setShowPassword((value) => !value)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </>
  );

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        width: '100%',
        maxWidth: 940,
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: '0 18px 50px rgba(0,0,0,0.22)',
      }}
    >
      {/* Panneau gauche : marque */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: 370,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          background: `radial-gradient(circle at 85% 12%, ${GREEN} 0%, ${GREEN_DARK} 55%)`,
          p: 5,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -110,
            left: -110,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -140,
            right: -90,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <BrandBadge />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
          JO Management
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Gestion intégrée de l’entreprise
        </Typography>
        <Typography variant="h5" sx={{ mt: 6, fontWeight: 700 }}>
          Welcome Back!
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.8)' }}>
          Pour rester connecté, renseignez vos informations personnelles.
        </Typography>
        {mode === 'login' ? (
          <Button
            type="submit"
            form="login-form"
            disabled={loading}
            variant="outlined"
            sx={{
              mt: 4,
              borderRadius: 999,
              px: 5,
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.7)',
              '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        ) : null}
      </Box>

      {/* Bandeau mobile : marque */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          py: 4,
          color: '#fff',
          background: `radial-gradient(circle at 50% 0%, ${GREEN} 0%, ${GREEN_DARK} 70%)`,
        }}
      >
        <BrandBadge size={52} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          JO Management
        </Typography>
      </Box>

      {/* Panneau droit : connexion ou création du compte admin */}
      <Box
        sx={{
          flex: 1,
          px: { xs: 3, sm: 6 },
          py: { xs: 4, md: 5 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {mode === 'login' ? (
          <>
            <Typography
              variant="h4"
              sx={{ color: GREEN, fontWeight: 800, textTransform: 'capitalize' }}
            >
              Bienvenue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Connectez-vous à votre compte pour continuer.
            </Typography>
            <Stack
              id="login-form"
              spacing={2.5}
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 4 }}
            >
              {loginFields}
              <Button
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{
                  mt: 1,
                  borderRadius: 999,
                  py: 1.2,
                  backgroundColor: GREEN,
                  '&:hover': { backgroundColor: GREEN_DARK },
                }}
                variant="contained"
              >
                {loading ? 'Connexion…' : 'Connexion'}
              </Button>
            </Stack>
          </>
        ) : (
          <>
            <Typography
              variant="h4"
              sx={{ color: GREEN, fontWeight: 800, fontSize: { xs: 28, md: 34 } }}
            >
              Créer le compte admin
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Première installation : un seul compte administrateur peut être créé.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <SetupFields adminExists={adminExists} />
            </Box>
          </>
        )}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => {
              setMode((current) => (current === 'login' ? 'setup' : 'login'));
              setError(null);
            }}
          >
            {mode === 'login'
              ? 'Première installation ? Créer le compte administrateur'
              : 'Retour à la connexion'}
          </Link>
        </Box>
      </Box>
    </Stack>
  );
}
