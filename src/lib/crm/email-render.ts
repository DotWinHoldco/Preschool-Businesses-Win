// @anchor: cca.crm.email-render
// Turns a TipTap-authored email into a sendable HTML payload:
// - Inlines styles via juice for email-client compatibility
// - Wraps content in a polished email shell
// - Resolves merge tags
// - Rewrites every <a href> through /api/email/click/{token}
// - Injects an open-tracking pixel + CAN-SPAM footer + unsubscribe

import juice from 'juice'
import { htmlToText } from 'html-to-text'
import { renderMergeTags, type MergeContext } from './merge-tags'

const SHELL = (body: string, brand: { primaryColor: string }) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf9f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141413;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f5;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
<tr><td style="font-size:16px;line-height:1.6;color:#141413;">
${body}
</td></tr>
</table>
__FOOTER__
</td></tr></table>
<style>
a { color: ${brand.primaryColor}; text-decoration: underline; }
h1 { font-size: 28px; line-height: 1.2; margin: 16px 0 8px; font-weight: 700; }
h2 { font-size: 22px; line-height: 1.25; margin: 14px 0 8px; font-weight: 700; }
h3 { font-size: 18px; line-height: 1.3; margin: 12px 0 6px; font-weight: 600; }
p { margin: 0 0 14px; }
ul, ol { padding-left: 22px; margin: 0 0 14px; }
img { max-width: 100%; height: auto; border-radius: 8px; }
hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
blockquote { border-left: 3px solid ${brand.primaryColor}; padding-left: 14px; color: #4b5563; margin: 14px 0; }
.cca-button { display:inline-block; background: ${brand.primaryColor}; color:#ffffff !important; text-decoration:none; font-weight:600; padding:12px 24px; border-radius:9999px; }
</style>
</body></html>`

const FOOTER_TEMPLATE = (opts: {
  schoolName: string
  mailingAddress: string
  unsubscribeUrl: string
  preferencesUrl: string
}) => `<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;margin-top:16px;">
<tr><td style="padding:16px;font-size:12px;line-height:1.5;color:#6b6b78;text-align:center;">
You're receiving this email because you're connected with ${escapeHtml(opts.schoolName)}.<br>
<a href="${opts.unsubscribeUrl}" style="color:#3b70b0;">${'Unsubscribe'}</a>
${opts.preferencesUrl !== opts.unsubscribeUrl ? ` &nbsp;·&nbsp; <a href="${opts.preferencesUrl}" style="color:#3b70b0;">Update preferences</a>` : ''}
<br><br>
${escapeHtml(opts.schoolName)}<br>
${escapeHtml(opts.mailingAddress)}
</td></tr></table>`

export interface RenderOptions {
  bodyHtml: string // raw HTML from TipTap
  subject: string
  preheader?: string
  ctx: MergeContext
  brandColor?: string
  collectorBase: string // e.g. https://crandallchristian.cc
  send: { id: string; openToken: string; trackedLinks: { token: string; url: string }[] }
  schoolName: string
  mailingAddress: string // CAN-SPAM required
}

export interface RenderResult {
  html: string
  text: string
  subject: string
  preheader: string
}

/**
 * Pure-function pipeline. Caller supplies the send_id + tokens (after
 * inserting the email_send row) so links + tracking pixel embed cleanly.
 */
export function renderEmail(opts: RenderOptions): RenderResult {
  const subject = renderMergeTags(opts.subject, opts.ctx)
  const preheader = renderMergeTags(opts.preheader ?? '', opts.ctx)

  // 1. Resolve merge tags in body.
  let body = renderMergeTags(opts.bodyHtml, opts.ctx)

  // 2. Rewrite every external link through the click tracker.
  body = body.replace(/href="(https?:\/\/[^"]+)"/g, (m, url) => {
    const tracked = opts.send.trackedLinks.find((l) => l.url === url)
    if (!tracked) return m
    return `href="${opts.collectorBase}/api/email/click/${tracked.token}"`
  })

  // 3. Append open-tracking pixel + CAN-SPAM footer.
  const pixel = `<img src="${opts.collectorBase}/api/email/open/${opts.send.openToken}.gif" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">`
  const footer = FOOTER_TEMPLATE({
    schoolName: opts.schoolName,
    mailingAddress: opts.mailingAddress,
    unsubscribeUrl: opts.ctx.unsubscribeUrl,
    preferencesUrl: opts.ctx.preferencesUrl ?? opts.ctx.unsubscribeUrl,
  })

  // 4. Wrap in shell + inline styles.
  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(preheader)}</div>`
    : ''
  const shellHtml = SHELL(preheaderBlock + body + pixel, {
    primaryColor: opts.brandColor ?? '#3b70b0',
  }).replace('__FOOTER__', footer)

  const inlined = juice(shellHtml, { applyStyleTags: true, removeStyleTags: true })

  // 5. Plain-text version.
  const text = htmlToText(inlined, {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: false } },
      { selector: 'img', format: 'skip' },
    ],
  })

  return { html: inlined, text, subject, preheader }
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function extractLinks(html: string): string[] {
  const out: string[] = []
  const re = /href="(https?:\/\/[^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out.push(m[1])
  return Array.from(new Set(out))
}
