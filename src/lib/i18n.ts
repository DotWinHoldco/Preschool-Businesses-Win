// @anchor: platform.i18n
// i18n helper — wired for future translation (Spanish priority)
// For v1, returns the English string as-is.
// In v2, this will connect to next-intl for Spanish translations.

const _translations: Record<string, Record<string, string>> = {
  en: {}, // English is the default — strings pass through
}

/**
 * Translation helper. Wired for future i18n support.
 * Usage: t('Check in your child') → "Check in your child"
 * In v2: t('Check in your child') → "Registrar a su hijo" (es)
 */
export function t(key: string, _locale?: string): string {
  // v1: pass-through (English only)
  return key
}

/**
 * Template string translation with interpolation
 * Usage: tpl('Hello {name}', { name: 'Jane' }) → "Hello Jane"
 */
export function tpl(
  template: string,
  vars: Record<string, string | number>,
  _locale?: string,
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(`{${key}}`, String(value))
  }
  return result
}
