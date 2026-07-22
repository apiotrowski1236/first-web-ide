// @ts-check
import { HTMLHint } from 'htmlhint'
import { HTML_TAGS } from './dictionaries.js'
import { suggestTag } from './hints.js'

/** HTMLHint rules tuned for beginners; ids map to templates in messages.js. */
const RULESET = {
  'tag-pair': true,
  'tagname-lowercase': true,
  'attr-lowercase': true,
  'attr-value-double-quotes': true,
  'doctype-first': true,
  'alt-require': true,
  'id-unique': true,
  'src-not-empty': true,
  'spec-char-escape': true,
}

/** SVG tags we shouldn't flag as "unknown HTML". */
const SVG_TAGS = new Set(['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'defs', 'use', 'text', 'tspan', 'linearGradient', 'stop'])

/** Pull the first `[ token ]` out of an HTMLHint message. */
function bracketToken(message, index = 0) {
  const matches = String(message).match(/\[\s*([^\]]+?)\s*\]/g)
  if (!matches || !matches[index]) return ''
  return matches[index].replace(/^\[\s*|\s*\]$/g, '')
}

function tagFromToken(token) {
  const m = String(token).match(/[a-zA-Z][a-zA-Z0-9]*/)
  return m ? m[0].toLowerCase() : ''
}

/**
 * @param {string} text
 * @param {{ posOf:(line:number,col?:number)=>number, lineEnd:(line:number)=>number }} pos
 */
export function lintHtml(text, pos) {
  /** @type {Array<{ruleId:string, ctx:object, severity:string, from:number, to:number}>} */
  const out = []

  let messages = []
  try {
    messages = HTMLHint.verify(text, RULESET)
  } catch { /* HTMLHint threw — fall back to just the typo scan */ }

  for (const m of messages) {
    const id = m.rule?.id || 'html'
    const from = pos.posOf(m.line, m.col)
    const to = pos.lineEnd(m.line)
    const ctx = { raw: m.message }
    if (id === 'tag-pair') ctx.tag = tagFromToken(bracketToken(m.message, 0)) || 'tag'
    else if (id === 'tagname-lowercase') ctx.tag = tagFromToken(bracketToken(m.message, 0))
    else if (id === 'attr-lowercase') ctx.attr = bracketToken(m.message, 0).toLowerCase()
    else if (id === 'id-unique') ctx.id = bracketToken(m.message, 0)
    out.push({ ruleId: id, ctx, severity: m.type === 'warning' ? 'warning' : 'error', from, to })
  }

  // Custom scan: opening tags whose name isn't a real HTML (or SVG) tag.
  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)\b/g
  let match
  while ((match = tagRe.exec(text))) {
    const name = match[1]
    const lower = name.toLowerCase()
    if (HTML_TAGS.has(lower) || SVG_TAGS.has(name) || SVG_TAGS.has(lower)) continue
    if (name.includes('-')) continue // custom elements / web components
    const from = match.index + 1
    out.push({
      ruleId: 'unknown-tag',
      ctx: { tag: lower, suggestion: suggestTag(lower) },
      severity: 'warning',
      from,
      to: from + name.length,
    })
  }

  return out
}
