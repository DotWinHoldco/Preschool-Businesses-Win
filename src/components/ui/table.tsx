import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  striped?: boolean
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ striped = false, className, ...props }, ref) => (
    <div className="w-full overflow-x-auto -mx-px">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-sm border-collapse',
          striped && '[&_tbody_tr:nth-child(even)]:bg-[var(--color-muted)]/50',
          className,
        )}
        {...props}
      />
    </div>
  ),
)
Table.displayName = 'Table'

// ---------------------------------------------------------------------------
// TableHeader
// ---------------------------------------------------------------------------

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('border-b border-[var(--color-border)]', className)}
      {...props}
    />
  ),
)
TableHeader.displayName = 'TableHeader'

// ---------------------------------------------------------------------------
// TableBody
// ---------------------------------------------------------------------------

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  ),
)
TableBody.displayName = 'TableBody'

// ---------------------------------------------------------------------------
// TableRow
// ---------------------------------------------------------------------------

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-muted)]/50',
      className,
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

// ---------------------------------------------------------------------------
// TableHead
// ---------------------------------------------------------------------------

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ sortable = false, sortDirection, onSort, className, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]',
        sortable && 'cursor-pointer select-none hover:text-[var(--color-foreground)]',
        className,
      )}
      aria-sort={
        sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : undefined
      }
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'shrink-0 transition-transform',
              sortDirection === 'asc' && 'rotate-180',
              !sortDirection && 'opacity-40',
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </span>
    </th>
  ),
)
TableHead.displayName = 'TableHead'

// ---------------------------------------------------------------------------
// TableCell
// ---------------------------------------------------------------------------

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('px-4 py-3 align-middle text-[var(--color-foreground)]', className)}
      {...props}
    />
  ),
)
TableCell.displayName = 'TableCell'

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
