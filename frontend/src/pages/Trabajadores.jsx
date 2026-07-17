import { useState } from 'react';
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
import { RefreshCw, Search, Eye, Monitor, Users, UserX, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';

const statCards = [
  { key: 'total', label: 'Total', icon: Users, color: 'text-blue-600' },
  { key: 'con_equipos', label: 'Con equipos', icon: Monitor, color: 'text-emerald-600' },
  { key: 'sin_equipos', label: 'Sin equipos', icon: UserX, color: 'text-muted-foreground' },
];

export default function Trabajadores() {
  const [search, setSearch] = useState('');
  const [areaFiltro, setAreaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trabajadores', search, areaFiltro, page, pageSize],
    queryFn: () => api.trabajadores.search({ search, area: areaFiltro, page, pageSize }),
  });

  const { data: areas } = useQuery({
    queryKey: ['trabajadores-areas'],
    queryFn: api.trabajadores.areas,
  });

  const { data: stats } = useQuery({
    queryKey: ['trabajadores-stats'],
    queryFn: api.trabajadores.stats,
  });

  const { data: equiposExpandido, isLoading: loadingEquipos } = useQuery({
    queryKey: ['trabajador-equipos', expandedId],
    queryFn: () => api.asignaciones.activasTrabajador(expandedId),
    enabled: !!expandedId,
  });

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

      {stats ? (
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
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por DNI o nombre..."
            className="h-8 w-64 rounded-lg border border-input bg-transparent pl-9 pr-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
          />
        </div>
        <Select value={areaFiltro} onValueChange={(v) => { setAreaFiltro(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las áreas">
              {areaFiltro || null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las áreas</SelectItem>
            {areas?.map((a) => (
              <SelectItem key={a.Area} value={a.Area}>{a.Area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          {
            key: 'Trabajador',
            label: 'Nombres y Apellidos',
            render: (row) => (
              <span className="inline-flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${row.ConEquipos ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  title={row.ConEquipos ? 'Con equipos asignados' : 'Sin equipos asignados'} />
                <span>{row.Trabajador}</span>
              </span>
            ),
          },
          { key: 'DOI', label: 'DNI' },
          { key: 'Ocupacion', label: 'Cargo' },
          { key: 'Area', label: 'Área' },
          {
            key: 'acciones',
            label: '',
            sortable: false,
            render: (row) => (
              <Button
                variant={expandedId === row.IdTrabajador ? 'default' : 'ghost'}
                size="icon-sm"
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
