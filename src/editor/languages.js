// @ts-check
import { html, autoCloseTags } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'

/**
 * Language extensions per file type. The lang packages bring *structural*
 * completion only — real HTML tags/attributes and real CSS properties — which
 * is exactly the "help me type" behaviour we want, and explicitly NOT AI or
 * free-form word guessing. `autoCloseTags` closes tags as students type them.
 * @param {string} language
 */
export function languageExtensions(language) {
  switch (language) {
    case 'html':
      return [html(), autoCloseTags]
    case 'css':
      return [css()]
    case 'javascript':
      return [javascript()]
    default:
      return []
  }
}
