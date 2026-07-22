// @ts-check
import * as csstree from 'css-tree'
import { suggestProperty, suggestColor } from './hints.js'

/**
 * Lint CSS with css-tree: collect parse errors (missing `;`/`}`), then walk the
 * AST for unknown properties and invalid values.
 * @param {string} text
 * @returns {Array<{ruleId:string, ctx:object, severity:string, from:number, to:number}>}
 */
export function lintCss(text) {
  const out = []

  let ast
  try {
    ast = csstree.parse(text, {
      positions: true,
      onParseError(err) {
        const offset = typeof err.offset === 'number' ? err.offset : 0
        const msg = err.rawMessage || err.message || 'Parse error'
        let ruleId = 'css-parse'
        if (/semicolon/i.test(msg)) ruleId = 'css-missing-semicolon'
        else if (/[}{]/.test(msg) || /curly|brace/i.test(msg)) ruleId = 'css-missing-brace'
        out.push({ ruleId, ctx: { reason: msg }, severity: 'error', from: offset, to: offset + 1 })
      },
    })
  } catch {
    return out
  }

  csstree.walk(ast, {
    visit: 'Declaration',
    enter(node) {
      const prop = node.property
      if (!prop || prop.startsWith('--') || prop.startsWith('-')) return // custom / vendor
      const loc = node.loc
      const from = loc ? loc.start.offset : 0
      const to = loc ? loc.end.offset : from + 1

      const known = Object.prototype.hasOwnProperty.call(csstree.lexer.properties, prop)
      if (!known) {
        out.push({
          ruleId: 'css-unknown-property',
          ctx: { property: prop, suggestion: suggestProperty(prop) },
          severity: 'warning',
          from,
          to,
        })
        return
      }

      // Property is real — check the value against css-tree's grammar.
      let matchResult
      try {
        matchResult = csstree.lexer.matchProperty(prop, node.value)
      } catch {
        return
      }
      if (matchResult && matchResult.error) {
        let value = ''
        try { value = csstree.generate(node.value).trim() } catch { value = '' }
        const isColor = /color/i.test(prop)
        out.push({
          ruleId: 'css-bad-value',
          ctx: { property: prop, value, suggestion: isColor ? suggestColor(value) : null },
          severity: 'warning',
          from,
          to,
        })
      }
    },
  })

  return out
}
