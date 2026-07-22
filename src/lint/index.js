// @ts-check
import { store } from '../store/project-store.js'
import { lintHtml } from './html-lint.js'
import { lintCss } from './css-lint.js'
import { lintJs } from './js-lint.js'
import { getMessage } from './messages.js'

/**
 * @typedef {Object} EnrichedDiagnostic
 * @property {number} from
 * @property {number} to
 * @property {number} line     1-based line for display
 * @property {string} severity 'error' | 'warning'
 * @property {string} ruleId
 * @property {string} title
 * @property {string} body
 * @property {string} fix
 */

/**
 * Compute diagnostics for the file currently shown in the editor.
 * @param {import('@codemirror/view').EditorView} view
 * @returns {EnrichedDiagnostic[]}
 */
export function computeDiagnostics(view) {
  const path = store.activePath
  const file = path ? store.getFile(path) : null
  if (!file) return []
  const doc = view.state.doc
  const text = doc.toString()

  const posOf = (line, col = 1) => {
    const L = Math.max(1, Math.min(line, doc.lines))
    const li = doc.line(L)
    return Math.min(li.from + Math.max(0, col - 1), li.to)
  }
  const lineEnd = (line) => {
    const L = Math.max(1, Math.min(line, doc.lines))
    return doc.line(L).to
  }

  /** @type {Array<{ruleId:string, ctx:object, severity:string, from:number, to:number}>} */
  let raw = []
  try {
    if (file.language === 'html') raw = lintHtml(text, { posOf, lineEnd })
    else if (file.language === 'css') raw = lintCss(text)
    else if (file.language === 'javascript') raw = lintJs(text)
  } catch (err) {
    console.error('Lint error', err)
    return []
  }

  return raw.map((d) => {
    const msg = getMessage(d.ruleId, d.ctx)
    const from = clamp(d.from, 0, text.length)
    const to = clamp(Math.max(d.to, d.from + 1), 0, text.length)
    return {
      from,
      to,
      line: doc.lineAt(from).number,
      severity: d.severity === 'warning' ? 'warning' : 'error',
      ruleId: d.ruleId,
      title: msg.title,
      body: msg.body,
      fix: msg.fix,
    }
  })
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(n, hi)) }
