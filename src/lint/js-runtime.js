// @ts-check
import { suggestIdentifier } from './hints.js'
import { JS_GLOBALS } from './dictionaries.js'
import { store } from '../store/project-store.js'

/**
 * Turn a raw runtime error (from the preview iframe) into a friendly message
 * id + context. Keys on BOTH Safari and Chromium phrasings, since Safari words
 * several errors differently.
 *
 * @param {{message:string, line?:number, column?:number, stack?:string}} payload
 * @returns {{ruleId:string, ctx:object}}
 */
export function rewriteRuntimeError(payload) {
  const message = payload.message || ''
  const line = payload.line || 0
  const knownNames = collectIdentifiers()

  // ReferenceError — "X is not defined" (Chromium) / "Can't find variable: X" (Safari)
  let m = message.match(/(?:can't find variable:\s*|referenceerror:\s*)?([A-Za-z_$][\w$]*)\s+is not defined/i)
    || message.match(/can't find variable:\s*([A-Za-z_$][\w$]*)/i)
  if (m) {
    const name = m[1]
    return { ruleId: 'js-reference-error', ctx: { name, line, suggestion: suggestIdentifier(name, knownNames) } }
  }

  // Null / undefined property access
  // Chromium: "Cannot read properties of null (reading 'addEventListener')"
  //           "Cannot read property 'x' of null"
  // Safari:   "null is not an object (evaluating 'btn.addEventListener')"
  if (/null is not an object|undefined is not an object|cannot read propert/i.test(message)) {
    let member = ''
    const rm = message.match(/reading '([^']+)'/i) || message.match(/property '([^']+)'/i)
      || message.match(/evaluating '[^']*?\.([\w$]+)'/i)
    if (rm) member = rm[1]
    return { ruleId: 'js-null-property', ctx: { member, line } }
  }

  // "X is not a function"
  m = message.match(/([\w$.]+)\s+is not a function/i)
    || message.match(/(?:'([^']+)'|([\w$.]+)) is not a function/i)
  if (m) {
    const name = m[1] || m[2] || ''
    return { ruleId: 'js-not-a-function', ctx: { name, line } }
  }

  // Syntax errors surfaced at load time
  if (/syntaxerror/i.test(message)) {
    return { ruleId: 'js-syntax-runtime', ctx: { raw: message, line } }
  }

  return { ruleId: 'js-generic', ctx: { raw: message, name: leadingName(message), line } }
}

function leadingName(message) {
  const m = message.match(/^([A-Za-z]+Error)\b/)
  return m ? m[1] : ''
}

/** Identifiers declared or referenced in the project's JS, plus globals. */
function collectIdentifiers() {
  const names = new Set(JS_GLOBALS)
  for (const [path, file] of Object.entries(store.files())) {
    if (file.language !== 'javascript') continue
    const text = String(file.content)
    const re = /\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g
    let m
    while ((m = re.exec(text))) names.add(m[1])
    // also parameter-ish and assigned names
    const re2 = /\b([A-Za-z_$][\w$]*)\s*=/g
    while ((m = re2.exec(text))) names.add(m[1])
  }
  return [...names]
}
