import type { TenantBranding } from '@/lib/tenant/branding'

interface TenantThemeProviderProps {
  branding: TenantBranding | null
  children: React.ReactNode
}

/**
 * Server component that injects tenant branding as CSS custom properties.
 * Wraps children in a div with inline style variables.
 * When branding is null (platform surface), falls through to :root CSS defaults.
 */
export function TenantThemeProvider({
  branding,
  children,
}: TenantThemeProviderProps) {
  if (!branding) {
    return <>{children}</>
  }

  const cssVars: Record<string, string> = {
    // Colors
    '--color-primary': branding.color_primary,
    '--color-primary-foreground': branding.color_primary_foreground,
    '--color-secondary': branding.color_secondary,
    '--color-secondary-foreground': branding.color_secondary_foreground,
    '--color-accent': branding.color_accent,
    '--color-accent-foreground': branding.color_accent_foreground,
    '--color-background': branding.color_background,
    '--color-foreground': branding.color_foreground,
    '--color-muted': branding.color_muted,
    '--color-muted-foreground': branding.color_muted_foreground,
    '--color-card': branding.color_card,
    '--color-card-foreground': branding.color_card_foreground,
    '--color-border': branding.color_border,
    '--color-destructive': branding.color_destructive,
    '--color-destructive-foreground': branding.color_destructive_foreground,
    '--color-success': branding.color_success,
    '--color-warning': branding.color_warning,
    // Typography
    '--font-heading': branding.font_heading,
    '--font-body': branding.font_body,
    '--font-mono': branding.font_mono,
    // Shape
    '--radius': branding.border_radius,
  }

  return (
    <div style={cssVars as React.CSSProperties} className="contents">
      {children}
    </div>
  )
}
