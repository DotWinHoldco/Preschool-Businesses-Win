// @anchor: brand.a11y.skip-link
// Accessible skip-to-content link — rendered at the top of every page.
// Invisible until focused (via keyboard tab), then overlays the page.
// Styles defined in globals.css `.skip-to-content`.

export function SkipToContent() {
  return (
    <a href="#main-content" className="skip-to-content">
      Skip to main content
    </a>
  )
}
