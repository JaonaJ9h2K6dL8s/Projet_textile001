'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/services/api-client';
import type { TransferDTO, TransferEligibilityDTO } from '@/types/coupe';

/**
 * Panneau de transfert vers la Couture : suivi de complétude,
 * motif de blocage et confirmation transactionnelle. Le transfert
 * est refusé tant que toutes les tâches obligatoires ne sont pas
 * terminées, validées et conformes.
 */
export default function TransferPanel({
  lotId,
  onChanged,
}: {
  lotId: number;
  onChanged: () => void;
}) {
  const [eligibility, setEligibility] = useState<TransferEligibilityDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [transfer, setTransfer] = useState<TransferDTO | null>(null);
  const [busy, setBusy] = useState(false);

  async function refreshEligibility() {
    setLoading(true);
    setError(null);
    try {
      const body = (await apiGet<{ item: TransferEligibilityDTO }>(
        `/api/coupe/lots/${lotId}/transfer`,
      )) as { item: TransferEligibilityDTO };
      setEligibility(body.item);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  async function markReady() {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/coupe/lots/${lotId}/transfer`, { action: 'ready' });
      setInfo('Lot marqué « prêt pour transfert ».');
      await refreshEligibility();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const body = (await apiPost<{ item: TransferDTO }>(
        `/api/coupe/lots/${lotId}/transfer`,
        { notes: notes || undefined },
      )) as { item: TransferDTO };
      setTransfer(body.item);
      setConfirmOpen(false);
      setInfo('Transfert confirmé : les pièces sont maintenant disponibles en couture.');
      await refreshEligibility();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  const c = eligibility?.completeness;

  return (
    <Box>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Stack spacing={2}>
          {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
          {info ? (
            <Alert severity="success" onClose={() => setInfo(null)}>
              {info}
            </Alert>
          ) : null}
          {transfer ? (
            <Alert severity="success">
              Transfert {transfer.code} confirmé le {transfer.confirmedAt}.
              {transfer.lines
                .map((line) => ` ${line.sizeLabel} : ${line.qty} pièces`)
                .join(' · ')}
            </Alert>
          ) : null}

          {c ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Complétude des tâches obligatoires : {c.validated}/{c.totalMandatory} validées
                ({c.percent} %)
              </Typography>
              <LinearProgress variant="determinate" value={c.percent} />
              <Typography variant="caption" color="text.secondary">
                Terminées : {c.done} — En cours : {c.inProgress} — En attente/bloquées :{' '}
                {c.pendingOrBlocked} — Restant à valider : {c.remainingToValidate}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Le pourcentage est informatif : même à 100 %, le transfert reste
                refusé si une condition obligatoire manque.
              </Typography>
            </Stack>
          ) : null}

          {eligibility?.reasons.length ? (
            <Alert severity="warning">
              <Typography variant="subtitle2" gutterBottom>
                Conditions non remplies :
              </Typography>
              <List dense>
                {eligibility.reasons.map((reason) => (
                  <ListItem key={reason} disableGutters>
                    <ListItemText primary={reason} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          ) : null}

          {eligibility?.transferred ? (
            <Alert severity="info">Ce lot a déjà été transféré vers la couture.</Alert>
          ) : null}

          <Divider />
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled={busy || !eligibility?.eligible || eligibility.transferred}
              onClick={markReady}
            >
              Marquer prêt pour transfert
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={busy || !eligibility?.eligible || eligibility.transferred}
              onClick={() => {
                setNotes('');
                setConfirmOpen(true);
              }}
            >
              Confirmer le transfert vers la couture
            </Button>
          </Stack>
        </Stack>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmer le transfert du lot</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-1">
            <Typography variant="body2">
              Toutes les conditions obligatoires sont remplies. Le transfert est
              définitif et enregistré dans une transaction : en cas d&apos;erreur,
              aucune écriture partielle n&apos;est conservée.
            </Typography>
            <TextField
              label="Notes (facultatif)"
              multiline
              minRows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={confirm} variant="contained" color="success" disabled={busy}>
            {busy ? 'Transfert en cours…' : 'Confirmer le transfert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
