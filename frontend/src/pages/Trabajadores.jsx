import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import DataTable from '../components/DataTable';
import SearchInput from '../components/SearchInput';
import { useNavigate } from 'react-router-dom';

const columns = [
  { key: 'DNI', label: 'DNI' },
  { key: 'CodEmpleado', label: 'Código' },
  {
    key: 'NombreCompleto',
    label: 'Nombres y Apellidos',
    render: (r) => `${r.APaterno} ${r.AMaterno}, ${r.Nombres}`,
  },
  { key: 'NomCargo', label: 'Cargo' },
  { key: 'AreaName', label: 'Área' },
  { key: 'NomGerencia', label: 'Gerencia' },
];

export default function Trabajadores() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['trabajadores', search],
    queryFn: () => api.trabajadores.search({ search }),
    enabled: search.length > 0,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Trabajadores</h1>
      <p className="text-sm text-gray-500">Busca trabajadores desde SIGA_ASISTENCIA por DNI, código o nombre</p>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por DNI, código o nombre..." />

      {!search && (
        <div className="text-center py-12 text-gray-400">
          Ingresa un término de búsqueda para encontrar trabajadores
        </div>
      )}

      {search && (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => navigate(`/trabajadores/${row.PersonalId}`)}
        />
      )}
    </div>
  );
}
