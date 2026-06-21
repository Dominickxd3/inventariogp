import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import { Button } from '#components/ui/button.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '#components/ui/select.jsx';
import { useNavigate } from 'react-router-dom';

const columns = [
  { key: 'DOI', label: 'DNI' },
  { key: 'Trabajador', label: 'Nombres y Apellidos' },
  { key: 'Ocupacion', label: 'Cargo' },
  { key: 'Area', label: 'Área' },
];

export default function Trabajadores() {
  const [search, setSearch] = useState('');
  const [areaFiltro, setAreaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['trabajadores', search, areaFiltro, page, pageSize],
    queryFn: () => api.trabajadores.search({ search, area: areaFiltro, page, pageSize }),
  });

  const { data: areas } = useQuery({
    queryKey: ['trabajadores-areas'],
    queryFn: () => api.trabajadores.areas(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Trabajadores</h1>
        <Button
          onClick={async () => {
            try {
              await api.trabajadores.sync();
              alert('Trabajadores sincronizados correctamente');
            } catch (e) {
              alert('Error al sincronizar: ' + e.message);
            }
          }}
        >
          Sincronizar
        </Button>
      </div>

      <div className="flex gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por DNI o nombre..." />
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
        columns={columns}
        data={data?.rows}
        onRowClick={(row) => navigate(`/trabajadores/${row.IdTrabajador}`)}
        pagination={data ? {
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
          onPageChange: setPage,
          onPageSizeChange: (size) => { setPageSize(size); setPage(1); },
        } : undefined}
      />
    </div>
  );
}
