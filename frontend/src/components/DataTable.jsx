import { useState, useMemo, useEffect, useRef } from 'react';
import {
  flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '#lib/utils.js';
import { Button } from '#components/ui/button.jsx';

function DebouncedInput({ value, onChange, placeholder, className }) {
  const [local, setLocal] = useState(value || '');
  const timeout = useRef(null);

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        value={local}
        onChange={handleChange}
        placeholder={placeholder || 'Buscar...'}
        className={cn(
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent pl-8 pr-2.5 py-1 text-sm transition-colors outline-none',
          'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          className,
        )}
      />
    </div>
  );
}

export default function DataTable({
  columns,
  data = [],
  onRowClick,
  searchable = true,
  searchPlaceholder,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  emptyMessage = 'No hay datos disponibles',
  loading,
  paginationMode = 'client',
  page: serverPage,
  serverPageSize,
  total: serverTotal,
  totalPages: serverTotalPages,
  onPageChange,
  onPageSizeChange,
}) {
  const currentPageSize = serverPageSize || defaultPageSize;
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: defaultPageSize });

  const isServer = paginationMode === 'server';

  const tableColumns = useMemo(() => columns.map((col) => ({
    accessorKey: col.key,
    header: col.label,
    enableSorting: col.sortable !== false && !isServer,
    cell: col.render ? ({ row }) => col.render(row.original) : ({ getValue }) => getValue() ?? '-',
    ...(col.meta ? { meta: col.meta } : {}),
  })), [columns, isServer]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: isServer
      ? { globalFilter }
      : { globalFilter, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: isServer ? undefined : setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isServer ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServer ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isServer ? undefined : getPaginationRowModel(),
    pageCount: isServer ? (serverTotalPages ?? 1) : undefined,
    manualPagination: isServer,
    manualSorting: isServer,
    globalFilterFn: 'includesString',
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 flex gap-4">
            {columns.map((col, i) => (
              <div key={i} className="h-4 bg-muted-foreground/10 rounded animate-pulse flex-1" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, r) => (
            <div key={r} className="px-4 py-3 flex gap-4 border-t border-border">
              {columns.map((_, c) => (
                <div key={c} className="h-4 bg-muted-foreground/10 rounded animate-pulse flex-1" style={{ opacity: 1 - c * 0.1 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center gap-4">
          <DebouncedInput
            value={globalFilter}
            onChange={setGlobalFilter}
            placeholder={searchPlaceholder || 'Buscar en toda la tabla...'}
            className="max-w-sm"
          />
          <span className="text-xs text-muted-foreground ml-auto">
            {table.getRowCount()} registros
          </span>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:bg-muted',
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="inline-flex flex-col -space-y-1.5">
                            <ChevronUp className={cn('w-3 h-3', header.column.getIsSorted() === 'asc' ? 'text-foreground' : 'text-muted-foreground/40')} />
                            <ChevronDown className={cn('w-3 h-3', header.column.getIsSorted() === 'desc' ? 'text-foreground' : 'text-muted-foreground/40')} />
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-6 h-6 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      'transition-colors',
                      onRowClick ? 'cursor-pointer hover:bg-accent/50' : 'hover:bg-muted/30',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isServer ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mostrar</span>
            <select
              value={currentPageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="border border-input rounded-lg px-2 py-1 text-sm bg-transparent"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>{(() => { const start = serverTotal === 0 ? 0 : (serverPage - 1) * currentPageSize + 1; const end = Math.min(serverPage * currentPageSize, serverTotal); return `${start}–${end} de ${serverTotal} registros`; })()}</span>
          </div>
          {(serverTotalPages > 1 || serverTotal > currentPageSize) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {serverPage} de {serverTotalPages || 1}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onPageChange?.(serverPage - 1)}
                  disabled={serverPage <= 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onPageChange?.(serverPage + 1)}
                  disabled={serverPage >= serverTotalPages}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : !isServer && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mostrar</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => setPagination({ ...pagination, pageSize: Number(e.target.value), pageIndex: 0 })}
              className="border border-input rounded-lg px-2 py-1 text-sm bg-transparent"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>de {table.getRowCount()} registros</span>
          </div>
          {table.getPageCount() > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
