// This script is injected as the FIRST thing in the preview page so it can
// catch console output and errors from student code that runs after it.
// It is imported as a raw string and inlined — it does not run in the app.
(function () {
  function send(kind, payload) {
    try {
      parent.postMessage({ __iwide: true, kind: kind, payload: payload }, '*')
    } catch (e) { /* ignore */ }
  }

  function serializeArg(a) {
    try {
      if (a instanceof Error) return a.name + ': ' + a.message
      if (a === null) return 'null'
      if (a === undefined) return 'undefined'
      if (typeof a === 'object') return JSON.stringify(a)
      return String(a)
    } catch (e) { return String(a) }
  }

  var methods = ['log', 'info', 'warn', 'error', 'debug']
  methods.forEach(function (m) {
    var orig = console[m]
    console[m] = function () {
      var args = Array.prototype.slice.call(arguments)
      send('console', { method: m, text: args.map(serializeArg).join(' ') })
      if (orig) orig.apply(console, arguments)
    }
  })

  window.addEventListener('error', function (e) {
    send('error', {
      message: e.message || 'Script error',
      source: e.filename || '',
      line: e.lineno || 0,
      column: e.colno || 0,
      stack: (e.error && e.error.stack) ? String(e.error.stack) : '',
    })
  })

  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason
    var msg = (r && r.message) ? r.message : String(r)
    send('error', { message: 'Unhandled promise rejection: ' + msg, line: 0 })
  })

  // Intercept clicks on links to other local pages so preview navigation works
  // without cross-origin blob navigation (which Safari's sandbox blocks).
  document.addEventListener('click', function (e) {
    var el = e.target
    while (el && el.tagName !== 'A') el = el.parentElement
    if (el && el.hasAttribute('data-iwide-nav')) {
      e.preventDefault()
      send('navigate', { path: el.getAttribute('data-iwide-nav') })
    }
  }, true)
})();
