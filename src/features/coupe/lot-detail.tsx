'use client';

import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useState } from 'react';
import { apiPatch, apiPost } from '@/services/api-client';
import {
  LOT_STATUS_LABELS,
  type LotDetailDTO,
  type RollDTO,
} from '@/types/coupe';
import { useCoupeData } from './use-coupe';
import TaskCard from './task-card';
import TransferPanel from './transfer-panel';
import LotExtras from './lot-extras';

/** Fiche complète d'un lot : statuts, tâches, transfert, paquets, déchets. */
export default function LotDetail({ lotId }: { lotId: number }) {
  const { data, loading, error, refresh, setError } = useCoupeData<LotDetailDTO>(
    `/api/coupe/lots/${lotId}`,
  );
  const rolls = useCoupeData<RollDTO[]>('/api/coupe/rolls?status=');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskMandatory, setTaskMandatory] = useState(true);
  const [taskRollIds, setTaskRollIds] = useState<number[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [reasonAction, setReasonAction] = useState<'block' | 'cancel' | null>(null);
  const [reasonText, setReasonText] = useState('');

  if (loading && !data) {
    return (
      <Stack alignItems="center" className="py-10">
        <CircularProgress />
      </Stack>
    );
  }
  if (error && !data) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!data) {
    return <Alert severity="error">Lot introuvable.</Alert>;
  }

  const lot = data;
  const locked = lot.status === 'transfere' || lot.status === 'annule';

  async function runStatus(action: string, reason: string | null, success: string) {
    setBusy(true);
    setError(null);
    try {
      await apiPatch(`/api/coupe/lots/${lot.id}`, { action, reason: reason ?? undefined });
      setInfo(success);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  function submitReason() {
    const action = reasonAction;
    setReasonAction(null);
    if (!action || !reasonText.trim()) return;
    const success =
      action === 'block' ? 'Lot bloqué.' : 'Lot annulé.';
    void runStatus(action, reasonText.trim(), success);
    setReasonText('');
  }

  async function createTask() {
    setBusy(true);
    setTaskError(null);
    try {
      await apiPost(`/api/coupe/lots/${lot.id}/tasks`, {
        description: taskDescription,
        isMandatory: taskMandatory,
        rollIds: taskRollIds,
      });
      setInfo('Tâche créée.');
      setTaskOpen(false);
      setTaskDescription('');
      setTaskMandatory(true);
      setTaskRollIds([]);
      await refresh();
    } catch (cause) {
      setTaskError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Link href="/coupe/lots">
          <Button size="small" startIcon={<ArrowBackIcon />}>
            Retour aux lots
          </Button>
        </Link>
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
      {info ? (
        <Alert severity="success" onClose={() => setInfo(null)}>
          {info}
        </Alert>
      ) : null}

      <Paper variant="outlined" className="p-4">
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
            <Typography variant="h6">Lot {lot.code}</Typography>
            <Chip
              size="small"
              label={LOT_STATUS_LABELS[lot.status] ?? lot.status}
              color={
                lot.status === 'transfere'
                  ? 'success'
                  : lot.status === 'bloque'
                    ? 'error'
                    : 'default'
              }
            />
          </Stack>
          <Typography variant="body2">
            {lot.productNom} — couleur {lot.colorNom} — quantité prévue :{' '}
            {lot.totalPlannedQty} pièces
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Responsable : {lot.responsableNom ?? '—'}
            {lot.startedAt ? ` — Démarré le ${lot.startedAt}` : ''}
            {lot.finishedAt ? ` — Terminé le ${lot.finishedAt}` : ''}
          </Typography>
          {lot.lastStatusReason ? (
            <Alert severity={lot.status === 'bloque' ? 'error' : 'warning'}>
              {lot.lastStatusReason.action === 'LOT_CANCEL' ? 'Motif de l’annulation' : 'Motif du blocage'}
              {' : '}
              {lot.lastStatusReason.reason} — par {lot.lastStatusReason.by ?? '—'} le{' '}
              {lot.lastStatusReason.at}
            </Alert>
          ) : null}
          {!locked ? (
            <Stack direction="row" spacing={1} useFlexGap className="flex-wrap">
              {lot.status === 'brouillon' ? (
                <Button size="small" variant="contained" disabled={busy} onClick={() => runStatus('start', null, 'Coupe démarrée.')}>
                  Démarrer la coupe
                </Button>
              ) : null}
              {lot.status === 'en_cours' ? (
                <Button size="small" disabled={busy} onClick={() => runStatus('set_attente', null, 'Lot en attente de validation.')}>
                  Mettre en attente
                </Button>
              ) : null}
              {lot.status === 'attente_validation' ? (
                <Button size="small" disabled={busy} onClick={() => runStatus('resume', null, 'Lot repris.')}>
                  Reprendre
                </Button>
              ) : null}
              {lot.status === 'bloque' ? (
                <Button size="small" disabled={busy} onClick={() => runStatus('unblock', null, 'Lot débloqué.')}>
                  Débloquer
                </Button>
              ) : null}
              {['en_cours', 'attente_validation', 'pret_transfert'].includes(lot.status) ? (
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() => {
                    setReasonText('');
                    setReasonAction('block');
                  }}
                >
                  Bloquer
                </Button>
              ) : null}
              <Button
                size="small"
                color="error"
                disabled={busy}
                onClick={() => {
                  setReasonText('');
                  setReasonAction('cancel');
                }}
              >
                Annuler le lot
              </Button>
            </Stack>
          ) : (
            <Alert severity="info">
              Lot {LOT_STATUS_LABELS[lot.status].toLowerCase()} : consultation seule.
            </Alert>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" className="p-4">
        <Typography variant="h6" gutterBottom>
          Transfert vers la couture
        </Typography>
        <TransferPanel lotId={lot.id} onChanged={refresh} />
      </Paper>

      <Paper variant="outlined" className="p-4">
        <Stack direction="row" justifyContent="space-between" alignItems="center" className="mb-1">
          <Typography variant="h6">Tâches de coupe</Typography>
          {!locked ? (
            <Button size="small" variant="contained" onClick={() => setTaskOpen(true)}>
              Nouvelle tâche
            </Button>
          ) : null}
        </Stack>
        <Stack spacing={2}>
          {lot.tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune tâche créée. Le transfert exigera au moins une tâche validée.
            </Typography>
          ) : (
            lot.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                lotSizes={lot.sizes}
                rolls={rolls.data ?? []}
                onChanged={refresh}
              />
            ))
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" className="p-4">
        <LotExtras lot={lot} onChanged={refresh} />
      </Paper>

      <Divider />

      <Button
        onClick={() => {
          void navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
        }}
        size="small"
        className="self-start"
      >
        Copier le lien de la fiche
      </Button>

      <Dialog open={taskOpen} onClose={() => setTaskOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle tâche de coupe</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-1">
            {taskError ? <Alert severity="error">{taskError}</Alert> : null}
            <TextField
              label="Description"
              required
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
            />
            <FormControl size="small">
              <InputLabel>Caractère de la tâche</InputLabel>
              <Select
                value={taskMandatory ? 'mandatory' : 'optional'}
                label="Caractère de la tâche"
                onChange={(event) => setTaskMandatory(event.target.value === 'mandatory')}
              >
                <MenuItem value="mandatory">Obligatoire (bloque le transfert)</MenuItem>
                <MenuItem value="optional">Facultative</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Rouleaux à affecter (facultatif)</InputLabel>
              <Select
                multiple
                value={taskRollIds.map(String)}
                label="Rouleaux à affecter (facultatif)"
                onChange={(event) =>
                  setTaskRollIds(
                    String(event.target.value)
                      .split(',')
                      .filter(Boolean)
                      .map(Number),
                  )
                }
                renderValue={(selected) =>
                  (selected as string[])
                    .map((id) => (rolls.data ?? []).find((roll) => roll.id === Number(id))?.code ?? id)
                    .join(', ')
                }
              >
                {(rolls.data ?? [])
                  .filter((roll) => ['disponible', 'en_utilisation'].includes(roll.status))
                  .map((roll) => (
                    <MenuItem key={roll.id} value={roll.id}>
                      {roll.code} — {roll.fabricRef}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskOpen(false)} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={createTask} variant="contained" disabled={busy || !taskDescription}>
            {busy ? 'Création…' : 'Créer la tâche'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reasonAction !== null} onClose={() => setReasonAction(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reasonAction === 'block' ? 'Motif du blocage du lot' : 'Motif de l’annulation du lot'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-1">
            <Typography variant="body2" color="text.secondary">
              Le motif est obligatoire et sera enregistré dans l’historique du lot.
            </Typography>
            <TextField
              label="Motif"
              required
              autoFocus
              multiline
              minRows={2}
              value={reasonText}
              onChange={(event) => setReasonText(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonAction(null)} disabled={busy}>
            Annuler
          </Button>
          <Button
            onClick={submitReason}
            variant="contained"
            color={reasonAction === 'cancel' ? 'error' : 'primary'}
            disabled={busy || !reasonText.trim()}
          >
            {busy ? 'Traitement…' : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
