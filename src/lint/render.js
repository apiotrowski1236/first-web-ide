// @ts-check

/** Escape HTML-special characters. */
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

/**
 * Convert our lightweight message markup (`backticks` → code chips) into safe
 * HTML. Everything else is escaped.
 * @param {string} text
 */
export function inlineToHtml(text) {
  if (!text) return ''
  const parts = String(text).split('`')
  // Odd indices are inside backticks.
  return parts
    .map((part, i) => (i % 2 === 1 ? `<code>${escapeHtml(part)}</code>` : escapeHtml(part)))
    .join('')
}

/**
 * Build a DOM node for a friendly message (title + body + fix).
 * @param {{title:string, body:string, fix:string}} msg
 */
export function messageNode(msg) {
  const wrap = document.createElement('div')
  wrap.className = 'cm-diagnostic-friendly'
  if (msg.title) {
    const strong = document.createElement('strong')
    strong.innerHTML = inlineToHtml(msg.title)
    wrap.appendChild(strong)
  }
  if (msg.body) {
    const p = document.createElement('div')
    p.innerHTML = inlineToHtml(msg.body)
    wrap.appendChild(p)
  }
  if (msg.fix) {
    const fix = document.createElement('div')
    fix.className = 'diag-fix'
    fix.innerHTML = '💡 ' + inlineToHtml(msg.fix)
    wrap.appendChild(fix)
  }
  return wrap
}

/** Plain-text version of a message (for the CM `message` field fallback). */
export function messageText(msg) {
  return [msg.title, msg.body, msg.fix ? 'Try this: ' + msg.fix : '']
    .filter(Boolean)
    .join('\n')
    .replace(/`/g, '')
}
