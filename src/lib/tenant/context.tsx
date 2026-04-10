'use client'

import { createContext, useContext } from 'react'
import type { Surface } from './resolve'

export interface TenantContextValue {
  tenantId: string
  tenantSlug: string
  surface: Surface
}

export const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContextValue
  children: React.ReactNode
}) {
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  )
}

/**
 * Access the current tenant context from a client component.
 * Throws if used outside a TenantProvider.
 */
export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant() must be used within a <TenantProvider>')
  }
  return ctx
}
