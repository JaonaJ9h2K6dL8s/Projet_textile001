'use client';

import Add from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Link from '@mui/material/Link';
import { useEffect, useState } from 'react';
import { apiPost } from '@/services/api-client';
import ProductSelect from '@/components/common/product-select';
import { LOT_STATUS_LABELS, type LotDTO, type LotStatus } from '@/types/coupe';
import { useCoupeData } from './use-coupe';

interface ReferenceOption {
  id: number;
  nom: string;
}

interface SizeRow {
  sizeId: string;
  plannedQty: string;
}

/** Liste des lots de coupe : filtres, création avec tailles variables. */
export default function LotsManager() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const query = `/api/coupe/lots?search=${encodeURIComponent(search)}&status=${status === 'all' ? '' : status}`;
  const { data, loading, error, refresh, setError } = useCoupeData<LotDTO[]>(query);
  const references = useCoupeData<{ colors: ReferenceOption[]; products: ReferenceOption[]; sizes: ReferenceOption[] }>(
    '/api/coupe/references',
  );
  const [openCreate, setOpenCreate] = useState(false);
  const [code, setCode] = useState('');
  const [productId, setProductId] = useState('');
  const [colorId, setColorId] = useState('');
  const [notes, setNotes] = useState('');
  const [sizes, setSizes] = useState<SizeRow[]>([{ sizeId: '', plannedQty: '' }]);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [search, status]);

  const lots = data ?? [];

  function resetForm() {
    setCode('');
    setProductId('');
    setColorId('');
    setNotes('');
    setSizes([{ sizeId: '', plannedQty: '' }]);
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/coupe/lots', {
        code: code || undefined,
        productId,
        colorId,
        notes,
        sizes: sizes
          .filter((row) => row.sizeId && row.plannedQty)
          .map((row) => ({ sizeId: Number(row.sizeId), plannedQty: row.plannedQty })),
      });
      setInfo('Lot créé en brouillon. Ouvrez-le pour préparer les tâches.');
      setOpenCreate(false);
      resetForm();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Rechercher un lot ou un produit…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1"
          size="small"
        />
        <FormControl size="small" className="min-w-40">
          <InputLabel>Statut</InputLabel>
          <Select value={status} label="Statut" onChange={(event) => setStatus(event.target.value)}>
            <MenuItem value="all">Tous</MenuItem>
            {Object.entries(LOT_STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
          Nouveau lot
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {info ? (
        <Alert severity="success" onClose={() => setInfo(null)}>
          {info}
        </Alert>
      ) : null}

      <TableContainer component="div" className="overflow-x-auto rounded border">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Produit</TableCell>
              <TableCell>Couleur</TableCell>
              <TableCell align="right">Qté prévue</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Détail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : lots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center">
                  Aucun lot enregistré. Créez votre premier lot de coupe.
                </TableCell>
              </TableRow>
            ) : (
              lots
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((lot) => (
                  <TableRow key={lot.id} hover>
                    <TableCell>{lot.code}</TableCell>
                    <TableCell>{lot.productNom}</TableCell>
                    <TableCell>{lot.colorNom}</TableCell>
                    <TableCell align="right">{lot.totalPlannedQty}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={LOT_STATUS_LABELS[lot.status as LotStatus] ?? lot.status}
                        color={
                          lot.status === 'transfere'
                            ? 'success'
                            : lot.status === 'bloque'
                              ? 'error'
                              : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Link href={`/coupe/lots/${lot.id}`}>Ouvrir</Link>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={lots.length}
          page={page}
          onPageChange={(_, value) => setPage(value)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Lignes par page"
        />
      </TableContainer>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau lot de coupe</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-1">
            <TextField
              label="Code lot (facultatif — généré sinon)"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <ProductSelect
              label="Produit"
              value={productId}
              onChange={(id) => setProductId(id)}
              required
            />
            <FormControl size="small" required>
              <InputLabel>Couleur</InputLabel>
              <Select
                value={colorId}
                label="Couleur"
                onChange={(event) => setColorId(event.target.value)}
              >
                {(references.data?.colors ?? []).map((color) => (
                  <MenuItem key={color.id} value={color.id}>
                    {color.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Tailles et quantités prévues (au moins une)
              </Typography>
              {sizes.map((row, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" className="flex-1">
                    <InputLabel>Taille</InputLabel>
                    <Select
                      value={row.sizeId}
                      label="Taille"
                      onChange={(event) =>
                        setSizes((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, sizeId: event.target.value } : item,
                          ),
                        )
                      }
                    >
                      {(references.data?.sizes ?? []).map((size) => (
                        <MenuItem key={size.id} value={size.id}>
                          {size.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Qté prévue"
                    type="number"
                    inputProps={{ min: 1 }}
                    value={row.plannedQty}
                    onChange={(event) =>
                      setSizes((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, plannedQty: event.target.value } : item,
                        ),
                      )
                    }
                    className="w-36"
                  />
                  <IconButton
                    size="small"
                    aria-label="Supprimer la ligne"
                    disabled={sizes.length === 1}
                    onClick={() =>
                      setSizes((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                onClick={() => setSizes((prev) => [...prev, { sizeId: '', plannedQty: '' }])}
              >
                Ajouter une taille
              </Button>
            </Stack>
            <TextField
              label="Observations"
              multiline
              minRows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={saving}>
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={saving || !productId || !colorId}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
