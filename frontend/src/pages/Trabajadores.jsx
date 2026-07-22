import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import DataTable from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Button } from '#components/ui/button.jsx';
import { Card, CardContent } from '#components/ui/card.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '#components/ui/dialog.jsx';
import { Skeleton } from '#components/ui/skeleton.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import { RefreshCw, Search, Eye, Monitor, Users, UserX, UserCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';

const statCards = [
  { key: 'total', label: 'Total', icon: Users, color: 'text-blue-600' },
  { key: 'con_equipos', label: 'Con equipos', icon: Monitor, color: 'text-emerald-600' },
  { key: 'sin_equipos', label: 'Sin equipos', icon: UserX, color: 'text-muted-foreground' },
];

export default function Trabajadores() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [areaFiltro, setAreaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const areasQuery = useQuery({
    queryKey: ['trabajadores-areas'],
    queryFn: api.trabajadores.areas,
  });
  const areas = areasQuery.data;

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['trabajadores', search, areaFiltro, page, pageSize],
    queryFn: () => api.trabajadores.search({ search, area: areaFiltro, page, pageSize }),
    placeholderData: (prev) => prev,
  });

  const statsQuery = useQuery({
    queryKey: ['trabajadores-stats'],
    queryFn: api.trabajadores.stats,
  });

  const { data: equiposExpandido, isLoading: loadingEquipos } = useQuery({
    queryKey: ['trabajador-equipos', expandedId],
    queryFn: () => api.asignaciones.activasTrabajador(expandedId),
    enabled: !!expandedId,
  });

  const stats = statsQuery.data;
  const statsError = statsQuery.isError;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Trabajadores" description="Directorio de personal" />
        <div className="rounded-lg border border-destructive/30 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <div>
              <h2 className="font-semibold">No se pudieron cargar los trabajadores</h2>
              <p className="mt-1 text-sm text-muted-foreground">{error?.message || 'Ocurrió un error inesperado'}</p>
            </div>
          </div>
          <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['trabajadores'] })}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Trabajadores" description="Directorio de personal">
        <Button disabled={syncing} onClick={async () => {
          setSyncing(true);
          try {
            await api.trabajadores.sync();
            Swal.fire({ icon: 'success', title: 'Sincronizado', text: 'Trabajadores sincronizados correctamente', timer: 2000, showConfirmButton: false });
            queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
            queryClient.invalidateQueries({ queryKey: ['trabajadores-areas'] });
            queryClient.invalidateQueries({ queryKey: ['trabajadores-stats'] });
          } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error al sincronizar', text: e.message });
          } finally {
            setSyncing(false);
          }
        }}>
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </PageHeader>

      {statsError ? (
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((c) => (
            <Card key={c.key} className="border-destructive/30">
              <CardContent className="p-4 flex items-center justify-center h-24">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Error al cargar
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(({ key, label, icon: Icon, color }) => (
            <Card key={key} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold mt-1">{stats[key] ?? 0}</p>
                  </div>
                  <Icon className={`w-8 h-8 opacity-40 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((c) => <Skeleton key={c.key} className="h-24 rounded-xl" />)}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por DNI o nombre..."
            aria-label="Buscar trabajadores"
            className="h-8 w-full sm:w-64 rounded-lg border border-input bg-transparent pl-9 pr-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={areaFiltro} onValueChange={(v) => { setAreaFiltro(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-full sm:w-[340px]" title={areaFiltro || 'Todas las áreas'} aria-label="Filtrar por área">
              <SelectValue placeholder="Todas las áreas" className="line-clamp-none">
                {areaFiltro || null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72 w-[340px] overflow-y-auto" align="start">
              <SelectItem value="">Todas las áreas</SelectItem>
              {areas?.map((a) => (
                <SelectItem key={a.Area} value={a.Area}>
                  <span className="block truncate" title={a.Area}>{a.Area}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {areasQuery.isError && (
            <Button variant="ghost" size="icon-sm" onClick={() => areasQuery.refetch()} title="Reintentar cargar áreas">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      {areasQuery.isError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          No se pudieron cargar las áreas. El filtro podría estar incompleto.
        </p>
      )}

      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
          Actualizando…
        </div>
      )}

      <DataTable
        columns={[
          {
            key: 'Trabajador',
            label: 'Nombres y Apellidos',
            render: (row) => (
              <span className="inline-flex items-center gap-2 max-w-[280px]">
                <span className={`w-2 h-2 rounded-full shrink-0 ${row.ConEquipos ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  title={row.ConEquipos ? 'Con equipos asignados' : 'Sin equipos asignados'} />
                <span className="truncate" title={row.Trabajador}>{row.Trabajador}</span>
              </span>
            ),
          },
          { key: 'DOI', label: 'DNI', sortable: false },
          { key: 'Ocupacion', label: 'Cargo', sortable: false },
          { key: 'Area', label: 'Área', sortable: false },
          {
            key: 'acciones',
            label: '',
            sortable: false,
            render: (row) => (
              <Button
                variant={expandedId === row.IdTrabajador ? 'default' : 'ghost'}
                size="icon-sm"
                aria-label={`Ver equipos de ${row.Trabajador}`}
                title="Ver equipos asignados"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(expandedId === row.IdTrabajador ? null : row.IdTrabajador);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            ),
          },
        ]}
        data={data?.rows}
        onRowClick={(row) => navigate(`/trabajadores/${row.IdTrabajador}`)}
        searchable={false}
        loading={isLoading}
        emptyMessage="No se encontraron trabajadores"
        paginationMode="server"
        page={data?.page ?? 1}
        serverPageSize={pageSize}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(1); }}
      />

      <Dialog open={!!expandedId} onOpenChange={(v) => { if (!v) setExpandedId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Equipos asignados</DialogTitle>
            <DialogDescription>
              {(() => {
                const row = data?.rows?.find((r) => r.IdTrabajador === expandedId);
                return row ? `${row.Trabajador} — ${row.DOI}` : '';
              })()}
            </DialogDescription>
          </DialogHeader>
          {loadingEquipos ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : equiposExpandido?.length > 0 ? (
            <div className="space-y-2 py-2">
              {equiposExpandido.map((eq) => (
                <div key={eq.IdMovEquipoAsignacion}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => { setExpandedId(null); navigate(`/equipos/${eq.IdMaeEquipo}`); }}
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{eq.CodEquipo} {eq.DesTipodeEquipo ? `- ${eq.DesTipodeEquipo}` : ''}</p>
                      <p className="text-xs text-muted-foreground">Desde {formatDate(eq.FecAsignacion)}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    eq.Estado === 'VIGENTE' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                  }`}>
                    {eq.Estado}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
              <UserCheck className="w-5 h-5" />
              <span>Sin equipos asignados</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
