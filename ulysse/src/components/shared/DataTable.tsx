import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, FileX } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  pageSize?: number
  searchable?: boolean
  searchKeys?: (keyof T)[]
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, emptyMessage = 'Aucune donnée disponible', pageSize = 20, searchable = true, searchKeys = [],
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!query) return data
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k]).toLowerCase().includes(query.toLowerCase()))
    )
  }, [data, query, searchKeys])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof T], bv = b[sortKey as keyof T]
      const cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const pages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="flex flex-col gap-3">
      {searchable && searchKeys.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0) }}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[14px] border border-[#E4E4E7] bg-[#FAFAFA] focus:border-[#FFCB00] focus:shadow-[0_0_0_3px_rgba(255,203,0,0.30)] outline-none transition-all duration-75"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#E4E4E7]">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F4F4F5]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && toggleSort(String(col.key))}
                  className={cn(
                    'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 select-none',
                    col.sortable && 'cursor-pointer hover:text-zinc-700',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === String(col.key) && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <FileX size={32} className="text-zinc-300 mx-auto mb-3" />
                  <p className="text-[13px] text-zinc-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={i} className={cn('border-t border-[#E4E4E7] hover:bg-[#FAFAFA] transition-colors duration-75', i % 2 === 1 && 'bg-zinc-50/50')}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className={cn('px-4 py-3 text-[14px] text-zinc-700', col.align === 'right' && 'text-right font-mono', col.className)}>
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-zinc-500">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} sur {sorted.length}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Page précédente" className="p-1.5 rounded-lg border border-[#E4E4E7] text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-75">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} aria-label="Page suivante" className="p-1.5 rounded-lg border border-[#E4E4E7] text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-75">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
