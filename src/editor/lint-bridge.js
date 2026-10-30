// @ts-check
import { computeDiagnostics } from '../lint/index.js'
import { messageNode, messageText } from '../lint/render.js'

/**
 * Adapts our friendly diagnostics into CodeMirror's lint format, and notifies
 * a listener (the Problems panel) with the same list each time linting runs.
 */

let onDiagnostics = () => {}
/** @param {(list: import('../lint/index.js').EnrichedDiagnostic[]) => void} cb */
export function setOnDiagnostics(cb) { onDiagnostics = cb }

/** CodeMirror lint source. */
export function cmLintSource(view) {
  const enriched = computeDiagnostics(view)
  try { onDiagnostics(enriched) } catch { /* panel not ready */ }
  return enriched.map((d) => ({
    from: d.from,
    to: d.to,
    severity: d.severity,
    message: messageText(d),
    renderMessage: () => messageNode(d),
    source: 'Website Maker',
  }))
}
