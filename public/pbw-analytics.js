/*! Preschool Businesses Win — Analytics Snippet
 *  Paste on tenant marketing site via:
 *    <script src="https://preschool.businesses.win/pbw-analytics.js"
 *            data-site-key="pk_xxx"
 *            async></script>
 */
(function () {
  'use strict'
  var LOG = true
  function log() {
    if (!LOG || !window.console) return
    try { console.log.apply(console, ['[pbwa]'].concat([].slice.call(arguments))) } catch (_e) {}
  }
  log('boot v2', new Date().toISOString())
  // document.currentScript is null for async scripts AND for scripts injected
  // by host platforms (Wix, Squarespace, etc.) that move the tag through
  // innerHTML. Find our own tag by src match instead.
  var currentScript = document.currentScript
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script')
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i]
      if (s.src && s.src.indexOf('pbw-analytics') !== -1) {
        currentScript = s
        break
      }
    }
  }
  if (!currentScript) {
    // Last-ditch fallback so the snippet still works when we can't locate our
    // own tag: derive config from window.__pbwa_config if present.
    currentScript = { getAttribute: function () { return null } }
  }
  function attr(name) {
    if (currentScript && typeof currentScript.getAttribute === 'function') {
      var v = currentScript.getAttribute(name)
      if (v !== null && v !== undefined) return v
    }
    var cfg = window.__pbwa_config || {}
    var key = name.replace(/^data-/, '').replace(/-([a-z])/g, function (_m, c) { return c.toUpperCase() })
    return cfg[key] || null
  }
  var SITE_KEY = attr('data-site-key')
  if (!SITE_KEY) { console.warn('[pbwa] missing data-site-key'); return }
  log('site-key:', SITE_KEY)
  // Default the collector to /api/collect on whatever host served this
  // script. That way the snippet always posts back to a domain that
  // actually exists, regardless of which PBW host the tenant uses.
  var scriptSrc = (currentScript && currentScript.src) || ''
  var derivedCollect
  try {
    var u = new URL(scriptSrc, window.location.href)
    derivedCollect = u.protocol + '//' + u.host + '/api/collect'
  } catch (_e) {
    derivedCollect = null
  }
  var COLLECT_URL = attr('data-collect') || derivedCollect || '/api/collect'
  log('collect-url:', COLLECT_URL)
  // TDPSA + most US states use an opt-out model, not opt-in. Events fire by
  // default; DNT/GPC browser signals silently opt out, and an explicit
  // "denied" consent cookie (set by the opt-out button on the banner, if
  // pasted) also stops events. Set data-consent="required" only if you want
  // the stricter opt-in flow where visitors must click Accept first.
  var CONSENT_REQUIRED = attr('data-consent') === 'required' || attr('data-consent') === 'on'
  var AUTO_ENROLL_MATCH = attr('data-auto-enroll-match') !== 'off'
  var COOKIE_DOMAIN = attr('data-cookie-domain') || ''

  var VISITOR_COOKIE = '_pbwa_vid'
  var CONSENT_COOKIE = '_pbwa_consent'
  var ATTR_COOKIE = '_pbwa_attr'
  var SESSION_KEY = '_pbwa_sid'
  var SESSION_LAST_KEY = '_pbwa_sid_last'
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes inactivity = new session
  var FLUSH_INTERVAL_MS = 5000
  var FLUSH_BATCH_SIZE = 10

  // ---- Consent ----------------------------------------------------------
  var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1'
  var gpc = !!navigator.globalPrivacyControl
  var storedConsent = getCookie(CONSENT_COOKIE) // 'granted' | 'denied' | null

  function consentGranted() {
    if (dnt || gpc) return false
    if (storedConsent === 'denied') return false
    if (!CONSENT_REQUIRED) return true
    return storedConsent === 'granted'
  }

  // ---- Visitor + session IDs --------------------------------------------
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID()
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function getCookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : null
  }
  function setCookie(n, v, days) {
    var d = new Date(); d.setTime(d.getTime() + days * 86400000)
    var parts = [n + '=' + encodeURIComponent(v), 'expires=' + d.toUTCString(), 'path=/', 'SameSite=Lax']
    if (location.protocol === 'https:') parts.push('Secure')
    if (COOKIE_DOMAIN) parts.push('domain=' + COOKIE_DOMAIN)
    document.cookie = parts.join('; ')
  }

  var visitorId = getCookie(VISITOR_COOKIE)
  var isNewVisitor = false
  if (!visitorId) { visitorId = uuid(); isNewVisitor = true }
  if (consentGranted()) setCookie(VISITOR_COOKIE, visitorId, 365)

  var now = Date.now()
  var sessionId = sessionStorage.getItem(SESSION_KEY)
  var sessionLast = parseInt(sessionStorage.getItem(SESSION_LAST_KEY) || '0', 10)
  var isNewSession = false
  if (!sessionId || !sessionLast || now - sessionLast > SESSION_TIMEOUT_MS) {
    sessionId = uuid()
    isNewSession = true
  }
  sessionStorage.setItem(SESSION_KEY, sessionId)
  sessionStorage.setItem(SESSION_LAST_KEY, String(now))

  function touchSession() {
    sessionStorage.setItem(SESSION_LAST_KEY, String(Date.now()))
  }

  // ---- Attribution (UTM + click IDs) persisted for 30d ------------------
  function parseUrlParams() {
    var p = new URLSearchParams(location.search)
    return {
      utm_source: p.get('utm_source'),
      utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
      utm_content: p.get('utm_content'),
      utm_term: p.get('utm_term'),
      fbclid: p.get('fbclid'),
      gclid: p.get('gclid'),
      ttclid: p.get('ttclid'),
    }
  }

  var urlAttr = parseUrlParams()
  var hasFreshAttr = !!(urlAttr.utm_source || urlAttr.utm_medium || urlAttr.utm_campaign || urlAttr.fbclid || urlAttr.gclid || urlAttr.ttclid)

  var attr
  try {
    attr = JSON.parse(getCookie(ATTR_COOKIE) || 'null')
  } catch (_e) { attr = null }
  if (hasFreshAttr) {
    attr = urlAttr
    if (consentGranted()) setCookie(ATTR_COOKIE, JSON.stringify(attr), 30)
  } else if (!attr) {
    attr = urlAttr
  }

  // ---- Event queue ------------------------------------------------------
  var queue = []
  var flushTimer = null

  function scheduleFlush() {
    if (flushTimer) return
    flushTimer = setTimeout(function () { flushTimer = null; flush() }, FLUSH_INTERVAL_MS)
    if (queue.length >= FLUSH_BATCH_SIZE) {
      clearTimeout(flushTimer); flushTimer = null; flush()
    }
  }

  function buildEvent(type, name, props) {
    return {
      event_id: uuid(),
      event_type: type,
      event_name: name,
      visitor_id: visitorId,
      session_id: sessionId,
      client_ts: Date.now(),
      page_url: location.href.slice(0, 2000),
      page_path: location.pathname + location.search,
      page_title: document.title ? document.title.slice(0, 500) : null,
      referrer: document.referrer ? document.referrer.slice(0, 2000) : null,
      utm_source: attr && attr.utm_source,
      utm_medium: attr && attr.utm_medium,
      utm_campaign: attr && attr.utm_campaign,
      utm_content: attr && attr.utm_content,
      utm_term: attr && attr.utm_term,
      fbclid: attr && attr.fbclid,
      gclid: attr && attr.gclid,
      ttclid: attr && attr.ttclid,
      screen_width: screen.width,
      screen_height: screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      language: navigator.language,
      properties: props || {},
    }
  }

  function track(type, name, props) {
    if (!consentGranted()) return
    queue.push(buildEvent(type, name, props))
    touchSession()
    scheduleFlush()
  }

  function flush(sync) {
    if (!queue.length) return
    var events = queue.splice(0, queue.length)
    var payload = JSON.stringify({ site_key: SITE_KEY, events: events })
    log('flush', events.length, 'events →', COLLECT_URL, 'sync:', !!sync)
    try {
      if (sync && navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' })
        var ok = navigator.sendBeacon(COLLECT_URL, blob)
        log('sendBeacon returned', ok)
        return
      }
      fetch(COLLECT_URL, {
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: payload,
      })
        .then(function (r) { log('POST status:', r.status) })
        .catch(function (e) { log('POST error:', e && e.message) })
    } catch (e) { log('flush threw:', e && e.message) }
  }

  function sendConsent(status) {
    try {
      var payload = JSON.stringify({
        site_key: SITE_KEY,
        visitor_id: visitorId,
        status: status,
        page_url: location.href.slice(0, 2000),
      })
      fetch(COLLECT_URL, {
        method: 'PUT',
        credentials: 'omit',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: payload,
      }).catch(function (_e) {})
    } catch (_e) {}
  }

  // ---- Auto-capture: page_view + session_start --------------------------
  log('consent:', { dnt: dnt, gpc: gpc, stored: storedConsent, required: CONSENT_REQUIRED, granted: consentGranted() })
  if (consentGranted()) {
    if (isNewSession) queue.push(buildEvent('session_start', 'session_start', { new_visitor: isNewVisitor }))
    queue.push(buildEvent('page_view', 'page_view', {}))
    scheduleFlush()
  } else {
    log('events blocked by consent gate')
  }

  // ---- Auto-capture: clicks ---------------------------------------------
  function findClickable(start) {
    var el = start
    while (el && el !== document.body && el.nodeType === 1) {
      if (el.hasAttribute && el.hasAttribute('data-track')) return el
      var tag = el.tagName
      if (tag === 'A' || tag === 'BUTTON') return el
      var role = el.getAttribute && el.getAttribute('role')
      if (role === 'button' || role === 'link') return el
      // Wix often renders interactive things as div/span with onclick
      if (el.onclick) return el
      try {
        var cs = window.getComputedStyle(el)
        if (cs && cs.cursor === 'pointer') return el
      } catch (_e) {}
      el = el.parentElement
    }
    return start
  }

  function findHref(el) {
    var cur = el
    for (var i = 0; i < 6 && cur; i++) {
      if (cur.tagName === 'A' && cur.getAttribute('href')) return cur.getAttribute('href')
      cur = cur.parentElement
    }
    var a = el.querySelector && el.querySelector('a[href]')
    return (a && a.getAttribute('href')) || ''
  }

  function clickText(el) {
    var txt = ''
    try {
      txt = (el.innerText || el.textContent || '').trim()
    } catch (_e) {}
    return txt.slice(0, 200)
  }

  document.addEventListener('click', function (ev) {
    if (!consentGranted()) return
    var t = ev.target
    if (!(t instanceof Element)) return
    var el = findClickable(t)
    if (!el) return

    var explicit = el.getAttribute && el.getAttribute('data-track')
    if (explicit) {
      var props = {}
      Array.prototype.forEach.call(el.attributes || [], function (a) {
        if (a.name.indexOf('data-track-') === 0) props[a.name.slice(11)] = a.value
      })
      var isConv = /enroll|conversion|apply/i.test(explicit)
      track(isConv ? 'conversion' : 'click', explicit, props)
      flush(true)
      return
    }

    if (!AUTO_ENROLL_MATCH) return
    var href = findHref(el)
    var txt = clickText(el)
    var isEnrollUrl = /enroll|apply|application|tour|schedule-a-tour/i.test(href)
    var isEnrollText = /^(enroll|apply|start application|begin enrollment|schedule a tour|apply now|enroll now)/i.test(txt)
    if (isEnrollUrl || isEnrollText) {
      track('conversion', 'enrollment_click', { href: (href || '').slice(0, 500), text: txt })
      // Flush immediately — page is about to navigate.
      flush(true)
    } else if (href && /^https?:/i.test(href) && href.indexOf(location.hostname) === -1) {
      track('click', 'outbound_click', { href: href.slice(0, 500) })
      flush(true)
    }
  }, true)

  // ---- Auto-rewrite outbound enrollment links with _av stitch -----------
  function stitchEnrollmentLinks() {
    if (!AUTO_ENROLL_MATCH) return
    var anchors = document.querySelectorAll('a[href]')
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i]
      var href = a.getAttribute('href')
      if (!href) continue
      if (a.getAttribute('data-pbwa-stitched') === '1') continue
      if (/preschool\.businesses\.win|crandallchristianacademy\.com\/enroll|\/enrollment/i.test(href)) {
        try {
          var u = new URL(href, location.href)
          if (!u.searchParams.has('_av')) {
            u.searchParams.set('_av', visitorId)
            a.setAttribute('href', u.toString())
            a.setAttribute('data-pbwa-stitched', '1')
          }
        } catch (_e) { /* ignore invalid URL */ }
      }
    }
  }
  stitchEnrollmentLinks()
  var observer = new MutationObserver(function () { stitchEnrollmentLinks() })
  observer.observe(document.documentElement, { childList: true, subtree: true })

  // ---- Unload handling --------------------------------------------------
  function onHidden() {
    if (document.visibilityState === 'hidden') {
      if (consentGranted()) queue.push(buildEvent('session_end', 'session_end', {}))
      flush(true)
    }
  }
  document.addEventListener('visibilitychange', onHidden)
  window.addEventListener('pagehide', function () {
    if (consentGranted()) queue.push(buildEvent('session_end', 'session_end', {}))
    flush(true)
  })

  // ---- Public API -------------------------------------------------------
  window.pbwa = {
    track: function (name, props) { track('custom', String(name).slice(0, 64), props || {}) },
    conversion: function (name, props) { track('conversion', String(name).slice(0, 64), props || {}) },
    pageView: function (props) { track('page_view', 'page_view', props || {}) },
    setConsent: function (status) {
      if (status !== 'granted' && status !== 'denied' && status !== 'withdrawn') return
      storedConsent = status === 'withdrawn' ? 'denied' : status
      setCookie(CONSENT_COOKIE, storedConsent, 365)
      sendConsent(status)
      if (status === 'granted') {
        setCookie(VISITOR_COOKIE, visitorId, 365)
        if (!queue.length) queue.push(buildEvent('page_view', 'page_view', { from: 'consent_grant' }))
        scheduleFlush()
      }
    },
    getVisitorId: function () { return visitorId },
    getSessionId: function () { return sessionId },
  }
})()
