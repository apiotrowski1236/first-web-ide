// @ts-check
import { javascriptLanguage } from '@codemirror/lang-javascript'

/**
 * Light static checks for JavaScript: real syntax errors (from the same Lezer
 * parser the editor uses) plus a heuristic for `=` used where `===` is meant.
 * Deeper feedback comes at runtime via the console bridge.
 * @param {string} text
 * @returns {Array<{ruleId:string, ctx:object, severity:string, from:number, to:number}>}
 */
export function lintJs(text) {
  const out = []

  // --- Syntax errors from the parse tree ---
  try {
    const tree = javascriptLanguage.parser.parse(text)
    const cursor = tree.cursor()
    let count = 0
    do {
      if (cursor.type.isError && cursor.to > cursor.from) {
        out.push({
          ruleId: 'js-syntax',
          ctx: {},
          severity: 'error',
          from: cursor.from,
          to: Math.min(cursor.to, cursor.from + 1),
        })
        count++
        if (count > 20) break
      }
    } while (cursor.next())
  } catch { /* ignore parser failures */ }

  // --- `=` vs `===` inside an if(...) condition ---
  const ifRe = /\bif\s*\(([^()]*)\)/g
  let m
  while ((m = ifRe.exec(text))) {
    const condition = m[1]
    // A lone `=` not part of ==, ===, !=, <=, >=.
    const assignRe = /[^=!<>]=[^=]/
    const rel = assignRe.exec(condition)
    if (rel) {
      // Position of the `=` within the whole text.
      const condStart = m.index + m[0].indexOf(condition)
      const eq = condStart + rel.index + 1
      out.push({ ruleId: 'js-assign-in-if', ctx: {}, severity: 'warning', from: eq, to: eq + 1 })
    }
  }

  return out
}
