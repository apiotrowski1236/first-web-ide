// @ts-check
import { store } from '../store/project-store.js'
import { basename, isBinary } from '../util/paths.js'

/**
 * Open-file tabs above the editor. A file opens a tab when it becomes active;
 * closing a tab falls back to the neighbouring tab.
 */

let rootEl /** @type {HTMLElement | null} */ = null
/** @type {string[]} order of open tabs */
let open = []

export function initTabs(el) {
  rootEl = el
  store.on('active:change', (path) => { ensureOpen(path); render() })
  store.on('files:change', () => { pruneClosed(); render() })
  store.on('project:load', () => { open = []; render() })
  store.on('dirty:change', render)
}

function ensureOpen(path) {
  if (path && !isBinary(path) && !open.includes(path)) open.push(path)
}

function pruneClosed() {
  open = open.filter((p) => store.getFile(p))
}

function render() {
  if (!rootEl) return
  rootEl.innerHTML = ''
  for (const path of open) {
    const tab = document.createElement('button')
    tab.className = 'tab' + (path === store.activePath ? ' is-active' : '')
    const label = document.createElement('span')
    label.textContent = basename(path)
    tab.appendChild(label)
    if (store.isDirty(path)) {
      const dot = document.createElement('span')
      dot.className = 'tab-dot'
      dot.textContent = '•'
      tab.appendChild(dot)
    }
    const close = document.createElement('span')
    close.className = 'tab-dot'
    close.textContent = ' ×'
    close.title = 'Close tab'
    close.addEventListener('click', (e) => { e.stopPropagation(); closeTab(path) })
    tab.appendChild(close)
    tab.addEventListener('click', () => store.setActive(path))
    rootEl.appendChild(tab)
  }
}

function closeTab(path) {
  const idx = open.indexOf(path)
  open = open.filter((p) => p !== path)
  if (store.activePath === path) {
    const next = open[idx] || open[idx - 1] || null
    if (next) store.setActive(next)
  }
  render()
}
