// @ts-check
import { store } from '../store/project-store.js'
import { goToLine } from '../editor/editor.js'
import { messageNode } from '../lint/render.js'
import { basename } from '../util/paths.js'

/**
 * Lists the diagnostics for the active file. Clicking a row jumps the cursor
 * to that spot in the editor.
 */

let bodyEl /** @type {HTMLElement | null} */ = null
let countEl /** @type {HTMLElement | null} */ = null

export function initProblemsPanel(el, badgeEl) {
  bodyEl = el
  countEl = badgeEl
}

/** @param {import('../lint/index.js').EnrichedDiagnostic[]} list */
export function renderProblems(list) {
  if (!bodyEl) return
  bodyEl.innerHTML = ''
  const errors = list.filter((d) => d.severity === 'error').length
  if (countEl) {
    countEl.textContent = String(list.length)
    countEl.style.background = errors ? 'var(--danger)' : list.length ? 'var(--warn)' : ''
  }

  if (!list.length) {
    const empty = document.createElement('div')
    empty.className = 'panel-empty'
    empty.textContent = store.activePath
      ? `No problems in ${basename(store.activePath)} — nice work! 🎉`
      : 'No file open.'
    bodyEl.appendChild(empty)
    return
  }

  const sorted = [...list].sort((a, b) => a.from - b.from)
  for (const d of sorted) {
    const row = document.createElement('button')
    row.className = `diag-row sev-${d.severity}`
    const loc = document.createElement('span')
    loc.className = 'diag-loc'
    loc.textContent = `${basename(store.activePath || '')}:${d.line}  `
    row.appendChild(loc)
    row.appendChild(messageNode(d))
    row.addEventListener('click', () => goToLine(d.line))
    bodyEl.appendChild(row)
  }
}
