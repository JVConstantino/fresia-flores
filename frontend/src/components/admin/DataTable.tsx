import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Edit2 } from 'lucide-react'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
}

interface Filter {
  label: string
  element: React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  onEdit?: (item: T) => void
  onDelete?: (items: T[]) => void | Promise<void>
  title?: string
  searchPlaceholder?: string
  filters?: Filter[]
  onNewClick?: () => void
  newLabel?: string
  loading?: boolean
  enableSelection?: boolean
  bulkActions?: {
    label: string
    onClick: (items: T[]) => void | Promise<void>
    variant?: 'default' | 'outline' | 'destructive'
  }[]
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  pageSize = 10,
  onEdit,
  onDelete,
  title,
  searchPlaceholder,
  filters,
  onNewClick,
  newLabel = 'Novo',
  loading = false,
  enableSelection,
  bulkActions = []
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDesc, setSortDesc] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [bulkLoadingLabel, setBulkLoadingLabel] = useState<string | null>(null)
  const isSelectable = enableSelection ?? Boolean(onDelete)

  const filtered = useMemo(() => {
    if (!search) return data
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key]
        return String(value).toLowerCase().includes(search.toLowerCase())
      })
    )
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDesc ? bVal - aVal : aVal - bVal
      }
      return sortDesc
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal))
    })
    return sorted
  }, [filtered, sortKey, sortDesc])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  const totalPages = Math.ceil(sorted.length / pageSize)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const colSpan = columns.length + (isSelectable ? 1 : 0) + ((onEdit || onDelete) ? 1 : 0)

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(sorted.map(item => item.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }, [sorted])

  const toggleSelect = useCallback((id: number | string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (!onDelete || selectedIds.size === 0) return
    setDeleteConfirm(true)
  }, [onDelete, selectedIds.size])

  const confirmDelete = useCallback(async () => {
    if (!onDelete) return
    setDeleteLoading(true)
    try {
      const itemsToDelete = sorted.filter(item => selectedIds.has(item.id))
      await onDelete(itemsToDelete)
      setSelectedIds(new Set())
    } finally {
      setDeleteLoading(false)
      setDeleteConfirm(false)
    }
  }, [onDelete, sorted, selectedIds])

  const allSelected = useMemo(() => {
    return paged.length > 0 && paged.every(item => selectedIds.has(item.id))
  }, [paged, selectedIds])

  const selectedItems = useMemo(() => {
    return sorted.filter(item => selectedIds.has(item.id))
  }, [sorted, selectedIds])

  const runBulkAction = useCallback(async (action: { label: string; onClick: (items: T[]) => void | Promise<void> }) => {
    if (selectedItems.length === 0) return
    setBulkLoadingLabel(action.label)
    try {
      await action.onClick(selectedItems)
      setSelectedIds(new Set())
    } finally {
      setBulkLoadingLabel(null)
    }
  }, [selectedItems])

  return (
    <div className="space-y-4">
      {(title || filters || searchPlaceholder || onNewClick) && (
        <div className="flex justify-between items-center gap-3 flex-wrap min-w-0">
          <div>
            {title && <h2 className="text-xl font-bold text-ink-800">{title}</h2>}
          </div>
          <div className="flex items-center gap-2 flex-wrap ml-auto min-w-0">
            {onNewClick && (
              <Button onClick={onNewClick} className="bg-lilac-500 hover:bg-lilac-600 text-white">
                + {newLabel}
              </Button>
            )}
            {searchPlaceholder && (
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full sm:w-48"
              />
            )}
          </div>
        </div>
      )}

      {filters && filters.length > 0 && (
        <div className="flex gap-2 sm:flex-wrap overflow-x-auto bg-white p-3 rounded-lg whitespace-nowrap">
          {filters.map((filter, idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              {filter.element}
            </div>
          ))}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="bg-lilac-50 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 sm:justify-between">
          <span className="text-sm font-medium text-lilac-700">
            {selectedIds.size} item(ns) selecionado(s)
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant || 'outline'}
                onClick={() => runBulkAction(action)}
                disabled={Boolean(bulkLoadingLabel) || deleteLoading}
              >
                {bulkLoadingLabel === action.label ? 'Processando...' : action.label}
              </Button>
            ))}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={deleteLoading || Boolean(bulkLoadingLabel)}
              >
                {deleteLoading ? 'Deletando...' : 'Excluir selecionados'}
              </Button>
            )}
          </div>
        </div>
      )}

      <Card className="overflow-hidden min-w-0 border-0 shadow-none rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-ink-50">
              <tr>
                {isSelectable && (
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                      className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-ink-700 cursor-pointer hover:bg-ink-100"
                    onClick={() => col.sortable && (sortKey === col.key ? setSortDesc(!sortDesc) : (setSortKey(col.key), setSortDesc(false)))}
                  >
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="ml-2">{sortDesc ? '▼' : '▲'}</span>
                    )}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-6 py-3 text-left text-sm font-semibold text-ink-700">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <tr key={i} className="border-b border-ink-100">
                    {isSelectable && (
                      <td className="px-4 py-3.5"><Skeleton className="w-4 h-4 rounded" /></td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 sm:px-6 py-3.5">
                        <Skeleton className="h-4 w-full max-w-[180px]" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-3.5"><Skeleton className="h-4 w-16" /></td>
                    )}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-8 text-center text-ink-500">
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                paged.map(row => (
                  <tr key={row.id} className="border-b border-ink-100 hover:bg-ink-50">
                    {isSelectable && (
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-left">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={(checked) => toggleSelect(row.id, checked as boolean)}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={String(col.key)} className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-ink-700">
                        {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            title="Editar"
                            className="p-1.5 hover:bg-lilac-100 rounded-md transition-colors"
                          >
                            <Edit2 size={16} className="text-lilac-600" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={async () => {
                              if (confirm('Tem certeza?')) {
                                setDeleteLoading(true)
                                try {
                                  await onDelete([row])
                                } finally {
                                  setDeleteLoading(false)
                                }
                              }
                            }}
                            title="Deletar"
                            className="p-1.5 hover:bg-petal-100 rounded-md transition-colors"
                          >
                            <Trash2 size={16} className="text-petal-400" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <span className="text-sm text-ink-600">
          Mostrando {paged.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} de {sorted.length} resultados
        </span>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} variant="outline" size="sm">
              ← Anterior
            </Button>
            <span className="text-sm text-ink-600">Página {page} de {totalPages}</span>
            <Button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} variant="outline" size="sm">
              Próxima →
            </Button>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-800">Confirmar exclusão</h2>
              <p className="text-sm text-ink-600 mt-1">
                Tem certeza que deseja excluir {selectedIds.size} item(ns)? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={confirmDelete}
                disabled={deleteLoading}
                variant="destructive"
                className="flex-1"
              >
                {deleteLoading ? 'Deletando...' : 'Excluir'}
              </Button>
              <Button
                onClick={() => setDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
