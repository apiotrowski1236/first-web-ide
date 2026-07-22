// @ts-check
import * as csstree from 'css-tree'

/**
 * Word lists used for "did you mean…?" suggestions. The CSS property list is
 * borrowed from css-tree itself so it stays complete without hand-maintenance.
 */

export const HTML_TAGS = new Set([
  'html', 'head', 'title', 'base', 'link', 'meta', 'style', 'body',
  'article', 'section', 'nav', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'footer', 'address', 'main', 'p', 'hr', 'pre', 'blockquote',
  'ol', 'ul', 'li', 'dl', 'dt', 'dd', 'figure', 'figcaption', 'div',
  'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'ruby',
  'data', 'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b',
  'u', 'mark', 'bdi', 'bdo', 'span', 'br', 'wbr', 'ins', 'del', 'picture',
  'source', 'img', 'iframe', 'embed', 'object', 'param', 'video', 'audio',
  'track', 'map', 'area', 'table', 'caption', 'colgroup', 'col', 'tbody',
  'thead', 'tfoot', 'tr', 'td', 'th', 'form', 'label', 'input', 'button',
  'select', 'datalist', 'optgroup', 'option', 'textarea', 'output',
  'progress', 'meter', 'fieldset', 'legend', 'details', 'summary', 'dialog',
  'script', 'noscript', 'template', 'slot', 'canvas',
])

/** Common named CSS colors (enough for beginner "did you mean" hints). */
export const NAMED_COLORS = new Set([
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'olive', 'maroon', 'silver', 'gold', 'coral', 'salmon', 'indigo',
  'violet', 'turquoise', 'tan', 'beige', 'ivory', 'khaki', 'crimson',
  'tomato', 'orchid', 'plum', 'lavender', 'skyblue', 'seagreen',
  'transparent', 'currentcolor', 'rebeccapurple', 'aqua', 'fuchsia',
])

/** Full list of real CSS properties, from css-tree's dictionary. */
export const CSS_PROPERTIES = (() => {
  try {
    return Object.keys(csstree.lexer.properties)
  } catch {
    return ['color', 'background', 'background-color', 'font-size', 'margin', 'padding', 'display']
  }
})()

/** Globals students commonly use, so we don't flag them as "undefined". */
export const JS_GLOBALS = new Set([
  'window', 'document', 'console', 'alert', 'prompt', 'confirm', 'Math',
  'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'localStorage',
  'sessionStorage', 'fetch', 'Promise', 'parseInt', 'parseFloat', 'isNaN',
  'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
])
