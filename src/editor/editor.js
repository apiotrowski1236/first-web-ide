// @ts-check
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view'
import { history, historyKeymap, defaultKeymap, indentWithTab } from '@codemirror/commands'
import { indentOnInput, bracketMatching, foldGutter } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { linter, lintGutter, lintKeymap } from '@codemirror/lint'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { languageExtensions } from './languages.js'
import { themeExtensions } from './theme.js'
import { store } from '../store/project-store.js'
import { isBinary, mimeOf, languageOf } from '../util/paths.js'

/**
 * Owns a single CodeMirror view. We keep one EditorView and swap EditorState
 * when switching files, caching each file's state so undo history and cursor
 * survive tab switches.
 */

let view /** @type {EditorView | null} */ = null
let hostEl /** @type {HTMLElement | null} */ = null
/** @type {Map<string, EditorState>} */
const stateCache = new Map()
let currentPath = null
let swapping = false

const langCompartment = new Compartment()

/** Pluggable lint source, injected by main once the lint engine exists. */
let lintProvider = null
/** @param {(view: EditorView) => any[]} fn */
export function setLintProvider(fn) { lintProvider = fn }

/** Base extensions shared by every file. */
function baseExtensions() {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    foldGutter(),
    drawSelection(),
    history(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    // Structural completion only (real tags / attributes / properties).
    autocompletion({ activateOnTyping: true, icons: false }),
    highlightActiveLine(),
    highlightSelectionMatches(),
    lintGutter(),
    linter((v) => (lintProvider ? lintProvider(v) : []), { delay: 300 }),
    themeExtensions,
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...completionKeymap,
      ...lintKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (swapping) return
      if (update.docChanged && currentPath) {
        store.setContent(currentPath, update.state.doc.toString())
      }
    }),
  ]
}

/** @param {HTMLElement} el */
export function initEditor(el) {
  hostEl = el
  view = new EditorView({ parent: el })
  renderEmpty()
}

function renderEmpty() {
  if (!hostEl) return
  hostEl.querySelector('.empty-editor')?.remove()
  const div = document.createElement('div')
  div.className = 'empty-editor'
  div.textContent = 'Select a file on the left to start editing.'
  hostEl.appendChild(div)
  if (view) view.dom.style.display = 'none'
}

function buildState(path, content) {
  const language = store.getFile(path)?.language || 'text'
  return EditorState.create({
    doc: content,
    extensions: [
      baseExtensions(),
      langCompartment.of(languageExtensions(language)),
    ],
  })
}

/**
 * Show a file in the editor. Binary assets can't be edited as text.
 * @param {string} path
 */
export function openFile(path) {
  if (!view || !path) return
  if (isBinary(path)) { showBinaryNotice(path); return }
  hostEl?.querySelector('.empty-editor')?.remove()
  hostEl?.querySelector('.binary-notice')?.remove()
  clearImagePreview()
  view.dom.style.display = ''

  // Save the outgoing file's state so its undo history survives.
  if (currentPath && view.state) stateCache.set(currentPath, view.state)

  const file = store.getFile(path)
  if (!file) return
  const content = typeof file.content === 'string' ? file.content : ''

  swapping = true
  let state = stateCache.get(path)
  if (!state || state.doc.toString() !== content) {
    state = buildState(path, content)
  }
  view.setState(state)
  swapping = false
  currentPath = path
  view.focus()
}

// Object URL for the image currently shown in the binary notice, so we can
// revoke it when we switch away (and avoid leaking blobs).
let imagePreviewUrl = null
function clearImagePreview() {
  if (imagePreviewUrl) { URL.revokeObjectURL(imagePreviewUrl); imagePreviewUrl = null }
}

/** Build a displayable src for an image FileRecord (Blob or SVG string). */
function imagePreviewSrc(path, content) {
  if (content instanceof Blob) {
    imagePreviewUrl = URL.createObjectURL(content)
    return imagePreviewUrl
  }
  if (typeof content === 'string') {
    return `data:${mimeOf(path)};charset=utf-8,` + encodeURIComponent(content)
  }
  return ''
}

function showBinaryNotice(path) {
  if (!hostEl || !view) return
  clearImagePreview()
  view.dom.style.display = 'none'
  hostEl.querySelector('.empty-editor')?.remove()
  hostEl.querySelector('.binary-notice')?.remove()

  const div = document.createElement('div')
  div.className = 'empty-editor binary-notice'

  const isAudio = languageOf(path) === 'audio'
  const src = imagePreviewSrc(path, store.getFile(path)?.content)
  if (src && isAudio) {
    const audio = document.createElement('audio')
    audio.className = 'binary-preview'
    audio.controls = true
    audio.src = src
    div.appendChild(audio)
  } else if (src) {
    const img = document.createElement('img')
    img.className = 'binary-preview'
    img.src = src
    img.alt = path
    div.appendChild(img)
  }

  const caption = document.createElement('p')
  caption.className = 'binary-caption'
  caption.textContent = isAudio
    ? `${path} is a sound. Play it on a page with <audio controls src="${path}"></audio> — there's nothing to type here.`
    : `${path} is a picture. Use it in your HTML with <img src="${path}" alt="…" /> — there's nothing to type here.`
  div.appendChild(caption)

  hostEl.appendChild(div)
}

/** Drop cached state for a path (after rename/delete). */
export function forgetFile(path) { stateCache.delete(path) }

/** Re-key cached state when a file is renamed. */
export function renameCached(oldPath, newPath) {
  const s = stateCache.get(oldPath)
  if (s) { stateCache.delete(oldPath); stateCache.set(newPath, s) }
  if (currentPath === oldPath) currentPath = newPath
}

/** Jump the cursor to a 1-based line/column (used by the Problems panel). */
export function goToLine(line, col = 1) {
  if (!view) return
  const lineInfo = view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines)))
  const pos = Math.min(lineInfo.from + (col - 1), lineInfo.to)
  view.dispatch({ selection: { anchor: pos }, scrollIntoView: true })
  view.focus()
}

export function getView() { return view }
