// @ts-check
import { rewriteRuntimeError } from '../lint/js-runtime.js'
import { getMessage } from '../lint/messages.js'
import { messageNode } from '../lint/render.js'

/**
 * Shows console.log output and friendly runtime errors from the preview.
 */

let bodyEl /** @type {HTMLElement | null} */ = null
let countEl /** @type {HTMLElement | null} */ = null
let count = 0
let errorCount = 0

export function initConsolePanel(el, badgeEl, onActivate) {
  bodyEl = el
  countEl = badgeEl
  /** activate callback lets the console flash the tab when an error arrives */
  consolePanelActivate = onActivate || (() => {})
}

let consolePanelActivate = () => {}

function bump(isError) {
  count++
  if (isError) errorCount++
  if (countEl) {
    countEl.textContent = String(count)
    countEl.style.background = errorCount ? 'var(--danger)' : ''
  }
}

function ensureBody() {
  if (bodyEl && bodyEl.querySelector('.panel-empty')) bodyEl.innerHTML = ''
}

/** A console.log/info/warn/error line from student code. */
export function addLog(entry) {
  if (!bodyEl) return
  ensureBody()
  const row = document.createElement('div')
  const cls = entry.method === 'error' ? 'log-error' : entry.method === 'warn' ? 'log-warn' : ''
  row.className = `log-row ${cls}`
  row.textContent = entry.text
  bodyEl.appendChild(row)
  bodyEl.scrollTop = bodyEl.scrollHeight
  bump(entry.method === 'error')
}

/** A thrown runtime error — rewritten into a friendly message. */
export function addError(payload) {
  if (!bodyEl) return
  ensureBody()
  const { ruleId, ctx } = rewriteRuntimeError(payload)
  const msg = getMessage(ruleId, ctx)
  const row = document.createElement('div')
  row.className = 'log-row log-error'
  row.appendChild(messageNode(msg))
  if (payload.message) {
    const raw = document.createElement('div')
    raw.className = 'log-raw'
    raw.textContent = payload.message
    row.appendChild(raw)
  }
  bodyEl.appendChild(row)
  bodyEl.scrollTop = bodyEl.scrollHeight
  bump(true)
  consolePanelActivate()
}

/** Clear everything and reset counts (also called on each preview rebuild). */
export function clearConsole() {
  if (!bodyEl) return
  bodyEl.innerHTML = '<div class="panel-empty">Console output from your JavaScript shows up here.</div>'
  count = 0
  errorCount = 0
  if (countEl) { countEl.textContent = '0'; countEl.style.background = '' }
}
