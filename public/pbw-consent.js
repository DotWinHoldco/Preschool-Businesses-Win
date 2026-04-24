/*! Preschool Businesses Win — Consent Banner
 *  Paired with pbw-analytics.js. Shows a TDPSA-compliant banner until the
 *  visitor makes a choice. Stores the decision in a 365-day cookie.
 *  Paste AFTER pbw-analytics.js in the same page.
 */
(function () {
  'use strict'
  var s = document.currentScript
  var PRIVACY_URL = (s && s.getAttribute('data-privacy-url')) || '/privacy'
  var ACCENT = (s && s.getAttribute('data-accent')) || '#1d4ed8'
  var TEXT_COLOR = (s && s.getAttribute('data-text')) || '#0f172a'
  var BG = (s && s.getAttribute('data-bg')) || '#ffffff'
  var CONSENT_COOKIE = '_pbwa_consent'

  function cookieVal(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : null
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function hasChoice() {
    var v = cookieVal(CONSENT_COOKIE)
    return v === 'granted' || v === 'denied'
  }

  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1'
  var gpc = !!navigator.globalPrivacyControl
  if (dnt || gpc) {
    // Honor browser-level opt-out silently; don't show banner.
    if (window.pbwa && window.pbwa.setConsent) window.pbwa.setConsent('denied')
    exposeManage(true)
    return
  }

  if (hasChoice()) { exposeManage(true); return }

  ready(function () {
    var banner = document.createElement('div')
    banner.setAttribute('role', 'dialog')
    banner.setAttribute('aria-label', 'Tracking consent')
    banner.style.cssText = [
      'position:fixed','left:16px','right:16px','bottom:16px','z-index:2147483646',
      'max-width:640px','margin:0 auto','padding:16px 18px','border-radius:14px',
      'background:' + BG,'color:' + TEXT_COLOR,
      'box-shadow:0 10px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
      'font-size:14px','line-height:1.45',
    ].join(';')

    banner.innerHTML =
      '<div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:220px">' +
          '<div style="font-weight:600;margin-bottom:4px">We use cookies to improve your experience.</div>' +
          '<div style="color:#475569">' +
            'We collect anonymous analytics to understand how visitors use our site and to measure our marketing. ' +
            'You can opt out at any time. <a href="' + PRIVACY_URL + '" style="color:' + ACCENT + ';text-decoration:underline">Privacy policy</a>.' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" data-pbwa-deny style="padding:10px 16px;border-radius:10px;border:1px solid #cbd5e1;background:transparent;color:' + TEXT_COLOR + ';font-weight:500;cursor:pointer">Opt out</button>' +
          '<button type="button" data-pbwa-accept style="padding:10px 16px;border-radius:10px;border:0;background:' + ACCENT + ';color:#fff;font-weight:600;cursor:pointer">Accept</button>' +
        '</div>' +
      '</div>'

    function decide(status) {
      if (window.pbwa && window.pbwa.setConsent) window.pbwa.setConsent(status)
      banner.remove()
      exposeManage(true)
    }
    banner.querySelector('[data-pbwa-accept]').addEventListener('click', function () { decide('granted') })
    banner.querySelector('[data-pbwa-deny]').addEventListener('click', function () { decide('denied') })

    document.body.appendChild(banner)
  })

  function exposeManage(showLink) {
    if (!showLink) return
    window.pbwaManageConsent = function () {
      try { document.cookie = CONSENT_COOKIE + '=; Max-Age=0; path=/' } catch (_e) {}
      location.reload()
    }
  }
})()
