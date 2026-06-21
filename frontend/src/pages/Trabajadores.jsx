import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
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
        <h1 className="text-2xl font-bold text-gray-800">Trabajadores</h1>
        <button
          onClick={async () => {
            try {
              await api.trabajadores.sync();
              alert('Trabajadores sincronizados correctamente');
            } catch (e) {
              alert('Error al sincronizar: ' + e.message);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sincronizar
        </button>
      </div>

      <div className="flex gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por DNI o nombre..." />
        <select
          value={areaFiltro}
          onChange={(e) => { setAreaFiltro(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todas las áreas</option>
          {areas?.map((a) => (
            <option key={a.Area} value={a.Area}>{a.Area}</option>
          ))}
        </select>
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
