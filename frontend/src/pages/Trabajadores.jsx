import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import DataTable from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { Button } from '#components/ui/button.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import { RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Trabajadores() {
  const [search, setSearch] = useState('');
  const [areaFiltro, setAreaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [syncing, setSyncing] = useState(false);
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
          <SelectTrigger className="w-48"><SelectValue placeholder="Todas las áreas" /></SelectTrigger>
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
          { key: 'DOI', label: 'DNI' },
          { key: 'Trabajador', label: 'Nombres y Apellidos' },
          { key: 'Ocupacion', label: 'Cargo' },
          { key: 'Area', label: 'Área' },
        ]}
        data={data?.rows}
        onRowClick={(row) => navigate(`/trabajadores/${row.IdTrabajador}`)}
        searchable={false}
        loading={isLoading}
        emptyMessage="No se encontraron trabajadores"
      />
    </div>
  );
}
