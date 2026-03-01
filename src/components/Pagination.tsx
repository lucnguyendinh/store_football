interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  // Build page number list with ellipsis
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('ellipsis')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      <p className="text-sm text-gray-500">
        {from}–{to} / {total} mục
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-2 text-gray-400 text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[34px] px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${p === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  )
}
