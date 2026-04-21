// @anchor: platform.pagination
// Shared pagination helper for server-side list pages.

export interface PaginationParams {
  page: number
  perPage: number
  offset: number
  limit: number
}

/**
 * Parse `page` and `per_page` from Next.js searchParams.
 * Defaults: page=1, per_page=25. Clamps per_page to [1, 100].
 */
export function parsePagination(
  searchParams: Record<string, string | string[] | undefined>,
): PaginationParams {
  const rawPage = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : NaN
  const rawPerPage = typeof searchParams.per_page === 'string' ? parseInt(searchParams.per_page, 10) : NaN

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1
  const perPage = Number.isFinite(rawPerPage) ? Math.min(Math.max(rawPerPage, 1), 100) : 25

  const offset = (page - 1) * perPage

  return { page, perPage, offset, limit: perPage }
}
