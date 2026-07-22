// @ts-check
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/**
 * Editor chrome theme. Colors reference the page's CSS custom properties, so
 * the editor follows the same light/dark palette as the rest of the app
 * automatically — no separate dark theme to maintain.
 */
export const editorTheme = EditorView.theme({
  '&': {
    color: 'var(--text)',
    backgroundColor: 'var(--bg)',
    height: '100%',
    fontSize: '13px',
  },
  '.cm-content': { caretColor: 'var(--accent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--cm-selection)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--cm-active-line)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--cm-active-line)' },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-sunken)',
    color: 'var(--text-dim)',
    border: 'none',
    borderRight: '1px solid var(--border)',
  },
  '.cm-lint-marker-error': { content: '""' },
  '.cm-tooltip': {
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '6px',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent-soft)',
    color: 'var(--accent)',
  },
})

/** Token colors, also driven by CSS variables. */
export const highlightStyle = HighlightStyle.define([
  { tag: [t.tagName, t.heading], color: 'var(--syn-tag)' },
  { tag: [t.attributeName, t.propertyName], color: 'var(--syn-attr)' },
  { tag: [t.string, t.attributeValue], color: 'var(--syn-string)' },
  { tag: [t.keyword, t.modifier, t.operatorKeyword], color: 'var(--syn-keyword)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.number, t.bool, t.null, t.color, t.atom], color: 'var(--syn-number)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--syn-func)' },
  { tag: [t.definitionKeyword, t.controlKeyword], color: 'var(--syn-keyword)' },
])

export const themeExtensions = [editorTheme, syntaxHighlighting(highlightStyle)]
