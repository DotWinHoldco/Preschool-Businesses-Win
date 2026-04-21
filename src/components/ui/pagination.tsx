// @anchor: ui.pagination
// Server-compatible pagination component for admin list pages.
// Renders prev/next links with page info — no client JS required.

export interface PaginationProps {
  page: number
  perPage: number
  total: number
  basePath: string
}

export function Pagination({ page, perPage, total, basePath }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const separator = basePath.includes('?') ? '&' : '?'

  function buildHref(targetPage: number) {
    return `${basePath}${separator}page=${targetPage}&per_page=${perPage}`
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        Page {page} of {totalPages}
        {total > 0 && (
          <span className="ml-2">({total} total)</span>
        )}
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <a
            href={buildHref(page - 1)}
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Previous
          </a>
        ) : (
          <span
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)', opacity: 0.5 }}
            aria-disabled="true"
          >
            Previous
          </span>
        )}
        {hasNext ? (
          <a
            href={buildHref(page + 1)}
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Next
          </a>
        ) : (
          <span
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)', opacity: 0.5 }}
            aria-disabled="true"
          >
            Next
          </span>
        )}
      </div>
    </div>
  )
}
