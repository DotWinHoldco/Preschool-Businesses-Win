// @anchor: cca.auth.login
// Portal login page — email/password + magic link.
// Next.js 16: this is a Server Component wrapper with a client form.

import { LoginForm } from './login-form'

export const metadata = {
  title: 'Sign In — Portal',
  description: 'Sign in to your preschool management portal.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-foreground)',
            }}
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Sign in to access your portal
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
