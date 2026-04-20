'use client'

// @anchor: cca.family.list-client
// Client-side search filter over server-fetched family data.

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

export interface FamilyRow {
  id: string
  family_name: string
  billing_email: string | null
  billing_phone: string | null
  mailing_city: string | null
  mailing_state: string | null
}

export interface FamilyListClientProps {
  families: FamilyRow[]
  memberCountMap: Record<string, number>
  studentCountMap: Record<string, number>
  serverQuery?: string
}

export function FamilyListClient({
  families,
  memberCountMap,
  studentCountMap,
  serverQuery,
}: FamilyListClientProps) {
  const [filterQuery, setFilterQuery] = useState('')

  const q = filterQuery.toLowerCase().trim()
  const filtered = q
    ? families.filter((f) => f.family_name.toLowerCase().includes(q))
    : families

  return (
    <>
      {/* Client-side search input */}
      <div className="relative max-w-md">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <Input
          type="search"
          inputSize="sm"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter families..."
          className="pl-10"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {filtered.length} of {families.length} famil{families.length !== 1 ? 'ies' : 'y'}{' '}
        {filterQuery && `matching "${filterQuery}"`}
      </p>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Family</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-[var(--color-muted-foreground)]"
              >
                {filterQuery
                  ? `No families matching "${filterQuery}"`
                  : serverQuery
                    ? `No families matching "${serverQuery}"`
                    : 'No families found'}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((family) => (
              <TableRow key={family.id}>
                <TableCell>
                  <Link
                    href={`/portal/admin/families/${family.id}`}
                    className="font-medium text-[var(--color-foreground)] hover:underline"
                  >
                    {family.family_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" size="sm">
                    {memberCountMap[family.id] ?? 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" size="sm">
                    {studentCountMap[family.id] ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                  {family.billing_email || family.billing_phone || '\u2014'}
                </TableCell>
                <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                  {family.mailing_city && family.mailing_state
                    ? `${family.mailing_city}, ${family.mailing_state}`
                    : '\u2014'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  )
}
