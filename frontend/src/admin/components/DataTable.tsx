import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  columns: any[]
  data: T[]
  searchPlaceholder?: string
  searchable?: boolean
  selectable?: boolean
  actions?: React.ReactNode
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ columns, data, searchPlaceholder, searchable = true, selectable, actions, onRowClick }: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  const filteredData = data.filter((row) => {
    if (!search) return true
    return JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
  })

  const pageSize = 10
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredData.length)
  const currentPageData = filteredData.slice(startIndex, endIndex)

  const handleSelectAll = () => {
    if (selectedRows.size === currentPageData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(currentPageData.map((_, i) => startIndex + i)))
    }
  }

  const handleSelectRow = (index: number) => {
    const rowIndex = startIndex + index
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex)
    } else {
      newSelected.add(rowIndex)
    }
    setSelectedRows(newSelected)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {(searchable && (searchPlaceholder || actions)) && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          {searchable && searchPlaceholder && (
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          )}
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}

      <div className="overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.size > 0 && selectedRows.size === currentPageData.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {currentPageData.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer',
                  onRowClick && 'transition-colors'
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {selectable && (
                  <td className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(startIndex + i)}
                      onChange={() => handleSelectRow(i)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map((col: any, j: number) => (
                  <td key={j} className="px-4 py-3">
                    {col.cell({ row: { original: row }, getValue: () => (row as any)[col.accessor || col.id] })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {currentPageData.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No data found
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1} to {endIndex} of {filteredData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
