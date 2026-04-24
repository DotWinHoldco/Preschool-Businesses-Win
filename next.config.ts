import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/book-online',
        destination: '/contact',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        // Analytics snippets are served to arbitrary marketing sites and must
        // always be fresh — any stale cached copy silently breaks tracking.
        source: '/:file(pbw-analytics\\.js|pbw-consent\\.js)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  tunnelRoute: '/monitoring',
})
