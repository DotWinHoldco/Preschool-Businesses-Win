'use client'

// @anchor: cca.auth.login-form
// Client login form — email/password + magic link toggle.
// Uses react-hook-form + zod for validation.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const passwordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})
type PasswordForm = z.infer<typeof passwordSchema>

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
})
type MagicLinkForm = z.infer<typeof magicLinkSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [serverError, setServerError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  })

  // Magic link form
  const magicForm = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  })

  async function handlePasswordLogin(values: PasswordForm) {
    setServerError(null)
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setServerError(
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message,
      )
      return
    }

    startTransition(() => {
      router.push('/portal')
      router.refresh()
    })
  }

  async function handleMagicLink(values: MagicLinkForm) {
    setServerError(null)
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal/login/callback`,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    setMagicLinkSent(true)
  }

  if (magicLinkSent) {
    return (
      <div
        className="rounded-[var(--radius)] border p-8 text-center"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          <Mail size={24} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Check your email
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          We sent a sign-in link to <strong>{magicForm.getValues('email')}</strong>. Click the link
          to sign in.
        </p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setMagicLinkSent(false)}>
          Use a different method
        </Button>
      </div>
    )
  }

  return (
    <div
      className="rounded-[var(--radius)] border p-8"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Mode toggle tabs */}
      <div
        className="mb-6 flex rounded-lg overflow-hidden border"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          type="button"
          onClick={() => {
            setMode('password')
            setServerError(null)
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: mode === 'password' ? 'var(--color-primary)' : 'transparent',
            color:
              mode === 'password'
                ? 'var(--color-primary-foreground)'
                : 'var(--color-muted-foreground)',
          }}
        >
          <Lock size={14} />
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('magic')
            setServerError(null)
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: mode === 'magic' ? 'var(--color-primary)' : 'transparent',
            color:
              mode === 'magic'
                ? 'var(--color-primary-foreground)'
                : 'var(--color-muted-foreground)',
          }}
        >
          <Sparkles size={14} />
          Magic Link
        </button>
      </div>

      {/* Error banner */}
      {serverError && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          role="alert"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
            color: 'var(--color-destructive)',
          }}
        >
          {serverError}
        </div>
      )}

      {/* Password form */}
      {mode === 'password' && (
        <form
          onSubmit={passwordForm.handleSubmit(handlePasswordLogin)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <label
              htmlFor="pw-email"
              className="text-sm font-medium"
              style={{ color: 'var(--color-foreground)' }}
            >
              Email
            </label>
            <Input
              id="pw-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={!!passwordForm.formState.errors.email}
              {...passwordForm.register('email')}
            />
            {passwordForm.formState.errors.email && (
              <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
                {passwordForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="pw-password"
                className="text-sm font-medium"
                style={{ color: 'var(--color-foreground)' }}
              >
                Password
              </label>
              <Link
                href="/portal/login/forgot"
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="pw-password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              error={!!passwordForm.formState.errors.password}
              {...passwordForm.register('password')}
            />
            {passwordForm.formState.errors.password && (
              <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
                {passwordForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={passwordForm.formState.isSubmitting || isPending}
          >
            Sign in
          </Button>
        </form>
      )}

      {/* Magic link form */}
      {mode === 'magic' && (
        <form onSubmit={magicForm.handleSubmit(handleMagicLink)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="ml-email"
              className="text-sm font-medium"
              style={{ color: 'var(--color-foreground)' }}
            >
              Email
            </label>
            <Input
              id="ml-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={!!magicForm.formState.errors.email}
              {...magicForm.register('email')}
            />
            {magicForm.formState.errors.email && (
              <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
                {magicForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={magicForm.formState.isSubmitting}>
            Send magic link
          </Button>

          <p className="text-center text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            We will send a one-time sign-in link to your email. No password needed.
          </p>
        </form>
      )}
    </div>
  )
}
