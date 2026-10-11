'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { apiPatch } from '@/services/api-client';
import {
  TASK_STATUS_LABELS,
  type RollDTO,
  type TaskDTO,
  type TaskStatus,
} from '@/types/coupe';
import TaskResultsDialog from './task-results-dialog';

/**
 * Carte d'une tâche de coupe : exécution, affectation des rouleaux,
 * saisie des résultats, validation par le responsable autorisé
 * (auto-validation permise) et refus motivé.
 */
export default function TaskCard({
  task,
  lotSizes,
  rolls,
  onChanged,
}: {
  task: TaskDTO;
  lotSizes: { id?: number; sizeId: number; sizeLabel: string; plannedQty: number }[];
  rolls: RollDTO[];
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [rollIds, setRollIds] = useState<number[]>(task.rolls.map((roll) => roll.rollId));
  const [validationNotes, setValidationNotes] = useState('');

  async function run(action: string, extra: Record<string, unknown> = {}, success = 'Tâche mise à jour.') {
    setBusy(true);
    setError(null);
    try {
      await apiPatch(`/api/coupe/tasks/${task.id}`, { action, ...extra });
      setInfo(success);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  function confirmThen(action: string, question: string, success: string) {
    if (window.confirm(question)) {
      void run(action, {}, success);
    }
  }

  const totalCut = task.results.reduce((sum, row) => sum + row.cutQty, 0);
  const totalUsable = task.results.reduce((sum, row) => sum + row.usableQty, 0);

  return (
    <Paper variant="outlined" className="p-3">
      <Stack spacing={1}>
        {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
        {info ? <Alert severity="success" onClose={() => setInfo(null)}>{info}</Alert> : null}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" component="strong">
              {task.code}
            </Typography>
            <Chip
              size="small"
              label={TASK_STATUS_LABELS[task.status as TaskStatus] ?? task.status}
              color={
                task.status === 'validee'
                  ? 'success'
                  : task.status === 'bloquee'
                    ? 'error'
                    : task.status === 'terminee'
                      ? 'info'
                      : 'default'
              }
            />
            {task.isMandatory ? (
              <Chip size="small" label="Obligatoire" variant="outlined" />
            ) : (
              <Chip size="small" label="Facultative" variant="outlined" />
            )}
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap>
            {['a_faire', 'en_attente'].includes(task.status) ? (
              <Button size="small" variant="contained" disabled={busy} onClick={() => run('start', {}, 'Tâche démarrée.')}>
                Démarrer
              </Button>
            ) : null}
            {task.status === 'en_cours' ? (
              <Button size="small" variant="contained" disabled={busy} onClick={() => run('finish', {}, 'Tâche terminée.')}>
                Terminer
              </Button>
            ) : null}
            {['terminee', 'a_verifier'].includes(task.status) ? (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={busy}
                  onClick={() => run('validate', { notes: validationNotes || undefined }, 'Tâche validée.')}
                >
                  Valider
                </Button>
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() => {
                    const reason = window.prompt('Motif du refus de validation :');
                    if (reason) void run('refuse', { reason }, 'Validation refusée.');
                  }}
                >
                  Refuser
                </Button>
              </>
            ) : null}
            {!['validee', 'annulee', 'transfere'].includes(task.status) && task.status !== 'bloquee' ? (
              <Button
                size="small"
                disabled={busy}
                onClick={() =>
                  confirmThen('block', 'Bloquer cette tâche ? Un motif sera demandé.', 'Tâche bloquée.')
                }
              >
                Bloquer
              </Button>
            ) : null}
            {task.status === 'bloquee' ? (
              <Button size="small" disabled={busy} onClick={() => run('unblock', {}, 'Tâche débloquée.')}>
                Débloquer
              </Button>
            ) : null}
            {!['validee', 'annulee'].includes(task.status) ? (
              <Button
                size="small"
                color="error"
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt('Motif de l’annulation de la tâche :');
                  if (reason) void run('cancel', { reason }, 'Tâche annulée.');
                }}
              >
                Annuler
              </Button>
            ) : null}
          </Stack>
        </Stack>

        <Typography variant="body2">{task.description}</Typography>
        <Typography variant="caption" color="text.secondary">
          Responsable : {task.responsableNom ?? '—'}
          {task.validatedByName
            ? ` — Validée par ${task.validatedByName} le ${task.validatedAt}`
            : ' — Non validée'}
        </Typography>

        <Divider />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <FormControl size="small" className="flex-1">
            <InputLabel>Rouleaux affectés</InputLabel>
            <Select
              multiple
              value={rollIds.map(String)}
              label="Rouleaux affectés"
              onChange={(event) =>
                setRollIds(
                  String(event.target.value)
                    .split(',')
                    .filter(Boolean)
                    .map(Number),
                )
              }
              renderValue={(selected) =>
                (selected as string[])
                  .map((id) => rolls.find((roll) => roll.id === Number(id))?.code ?? id)
                  .join(', ')
              }
            >
              {rolls
                .filter((roll) => ['disponible', 'en_utilisation'].includes(roll.status))
                .map((roll) => (
                  <MenuItem key={roll.id} value={roll.id}>
                    <ListItemText primary={`${roll.code} — ${roll.fabricRef}`} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button size="small" disabled={busy} onClick={() => run('set_rolls', { rollIds }, 'Rouleaux affectés.')}>
            Enregistrer l&apos;affectation
          </Button>
          <Button size="small" variant="contained" onClick={() => setResultsOpen(true)}>
            Saisir les résultats
          </Button>
        </Stack>

        {['terminee', 'a_verifier'].includes(task.status) ? (
          <TextField
            size="small"
            label="Notes de validation (facultatif)"
            value={validationNotes}
            onChange={(event) => setValidationNotes(event.target.value)}
          />
        ) : null}

        {task.results.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Taille</TableCell>
                <TableCell align="right">Prévu</TableCell>
                <TableCell align="right">Coupé</TableCell>
                <TableCell align="right">Utilisable</TableCell>
                <TableCell align="right">Anomalie</TableCell>
                <TableCell align="right">Déchets</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {task.results.map((row) => (
                <TableRow key={row.sizeId}>
                  <TableCell>{row.sizeLabel}</TableCell>
                  <TableCell align="right">{row.plannedQty}</TableCell>
                  <TableCell align="right">{row.cutQty}</TableCell>
                  <TableCell align="right">{row.usableQty}</TableCell>
                  <TableCell align="right">{row.anomalyQty}</TableCell>
                  <TableCell align="right">{row.wasteQty}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <strong>Total</strong>
                </TableCell>
                <TableCell align="right">{task.results.reduce((sum, row) => sum + row.plannedQty, 0)}</TableCell>
                <TableCell align="right">
                  <strong>{totalCut}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{totalUsable}</strong>
                </TableCell>
                <TableCell align="right">
                  {task.results.reduce((sum, row) => sum + row.anomalyQty, 0)}
                </TableCell>
                <TableCell align="right">
                  {task.results.reduce((sum, row) => sum + row.wasteQty, 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucun résultat saisi pour cette tâche.
          </Typography>
        )}
      </Stack>

      <TaskResultsDialog
        task={resultsOpen ? task : null}
        lotSizes={lotSizes}
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        onSaved={() => {
          setInfo('Résultats enregistrés.');
          onChanged();
        }}
      />
    </Paper>
  );
}
