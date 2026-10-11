'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
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
import { apiPost } from '@/services/api-client';
import {
  WASTE_TYPE_LABELS,
  type LotDetailDTO,
  type WasteType,
} from '@/types/coupe';

/**
 * Extras du lot : paquets de pièces (codes + QR), déclaration de
 * déchets et chutes, identifiant QR du lot.
 */
export default function LotExtras({
  lot,
  onChanged,
}: {
  lot: LotDetailDTO;
  onChanged: () => void;
}) {
  const [bundleSize, setBundleSize] = useState('');
  const [bundleQty, setBundleQty] = useState('');
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [wasteType, setWasteType] = useState<WasteType>('chute');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteUnit, setWasteUnit] = useState('kg');
  const [wasteReason, setWasteReason] = useState('');
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locked = lot.status === 'transfere' || lot.status === 'annule';

  async function createBundle() {
    setBusy(true);
    setBundleError(null);
    try {
      await apiPost('/api/coupe/bundles', {
        lotId: lot.id,
        sizeId: bundleSize,
        qty: bundleQty,
      });
      setInfo('Paquet créé avec son code et son QR.');
      setBundleSize('');
      setBundleQty('');
      onChanged();
    } catch (cause) {
      setBundleError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  async function declareWaste() {
    setBusy(true);
    setWasteError(null);
    try {
      await apiPost('/api/coupe/waste', {
        lotId: lot.id,
        wasteType,
        qty: wasteQty,
        unit: wasteUnit,
        reason: wasteReason || undefined,
      });
      setInfo('Déchet déclaré et historisé.');
      setWasteQty('');
      setWasteReason('');
      onChanged();
    } catch (cause) {
      setWasteError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      {info ? (
        <Alert severity="success" onClose={() => setInfo(null)}>
          {info}
        </Alert>
      ) : null}

      {lot.identifier ? (
        <Stack direction="row" spacing={2} alignItems="center">
          {/* QR du lot — identifiant stable, réimpression possible depuis /coupe/codes */}
          <Typography variant="subtitle2">Identifiant du lot : {lot.identifier.code}</Typography>
        </Stack>
      ) : null}

      <Divider />
      <Typography variant="subtitle1">Paquets de pièces coupées</Typography>
      {!locked ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <FormControl size="small" className="min-w-40">
            <InputLabel>Taille</InputLabel>
            <Select
              value={bundleSize}
              label="Taille"
              onChange={(event) => setBundleSize(event.target.value)}
            >
              {lot.sizes.map((size) => (
                <MenuItem key={size.sizeId} value={size.sizeId}>
                  {size.sizeLabel}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 1 }}
            label="Pièces dans le paquet"
            value={bundleQty}
            onChange={(event) => setBundleQty(event.target.value)}
            className="w-56"
          />
          <Button
            size="small"
            variant="contained"
            disabled={busy || !bundleSize || !bundleQty}
            onClick={createBundle}
          >
            Créer le paquet
          </Button>
        </Stack>
      ) : (
        <Alert severity="info">
          Lot {lot.status === 'transfere' ? 'transféré' : 'annulé'} : les paquets
          ne sont plus modifiables.
        </Alert>
      )}
      {bundleError ? <Alert severity="error">{bundleError}</Alert> : null}
      {lot.bundles.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Taille</TableCell>
              <TableCell align="right">Quantité</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lot.bundles.map((bundle) => (
              <TableRow key={bundle.id}>
                <TableCell>{bundle.code ?? '—'}</TableCell>
                <TableCell>{bundle.sizeLabel}</TableCell>
                <TableCell align="right">{bundle.qty}</TableCell>
                <TableCell>{bundle.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Aucun paquet créé pour ce lot.
        </Typography>
      )}

      <Divider />
      <Typography variant="subtitle1">Déchets et chutes du lot</Typography>
      {!locked ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <FormControl size="small" className="min-w-36">
            <InputLabel>Type</InputLabel>
            <Select
              value={wasteType}
              label="Type"
              onChange={(event) => setWasteType(event.target.value as WasteType)}
            >
              {Object.entries(WASTE_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            label="Quantité"
            value={wasteQty}
            onChange={(event) => setWasteQty(event.target.value)}
            className="w-36"
          />
          <TextField
            size="small"
            label="Unité"
            value={wasteUnit}
            onChange={(event) => setWasteUnit(event.target.value)}
            className="w-24"
          />
          <TextField
            size="small"
            label="Motif / observations"
            value={wasteReason}
            onChange={(event) => setWasteReason(event.target.value)}
            className="flex-1"
          />
          <Button
            size="small"
            variant="contained"
            disabled={busy || !wasteQty}
            onClick={declareWaste}
          >
            Déclarer
          </Button>
        </Stack>
      ) : null}
      {wasteError ? <Alert severity="error">{wasteError}</Alert> : null}
      {lot.waste.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell align="right">Quantité</TableCell>
              <TableCell>Motif</TableCell>
              <TableCell>Par</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lot.waste.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{WASTE_TYPE_LABELS[entry.wasteType] ?? entry.wasteType}</TableCell>
                <TableCell align="right">
                  {entry.qty} {entry.unit}
                </TableCell>
                <TableCell>{entry.reason ?? entry.observations ?? '—'}</TableCell>
                <TableCell>{entry.userName ?? '—'}</TableCell>
                <TableCell>{entry.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Aucun déchet déclaré sur ce lot.
        </Typography>
      )}
    </Stack>
  );
}
