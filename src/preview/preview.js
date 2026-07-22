// @ts-check
import { store } from '../store/project-store.js'
import { buildPreview } from './resolve.js'
import { debounce } from '../util/debounce.js'

/**
 * Owns the preview iframe: rebuilds it (debounced) whenever the project
 * changes, manages the "which page" selector, and revokes old blob URLs.
 */

let frame /** @type {HTMLIFrameElement | null} */ = null
let pageSelect /** @type {HTMLSelectElement | null} */ = null
let currentPage = 'index.html'
let buildToken = 0
let beforeRebuild = () => {}

/** Register a callback run just before each preview rebuild (e.g. clear console). */
export function onBeforeRebuild(cb) { beforeRebuild = cb }

export function initPreview(frameEl, pageSelectEl, refreshBtn) {
  frame = frameEl
  pageSelect = pageSelectEl

  store.on('project:load', () => { pickInitialPage(); refreshPageList(); rebuildNow() })
  store.on('files:change', () => { refreshPageList(); scheduleRebuild() })
  store.on('file:change', scheduleRebuild)

  pageSelect?.addEventListener('change', () => { currentPage = pageSelect.value; rebuildNow() })
  refreshBtn?.addEventListener('click', rebuildNow)
}

function pickInitialPage() {
  const pages = store.htmlPages()
  currentPage = pages.includes('index.html') ? 'index.html' : pages[0] || 'index.html'
}

function refreshPageList() {
  if (!pageSelect) return
  const pages = store.htmlPages()
  if (!pages.includes(currentPage)) currentPage = pages[0] || 'index.html'
  pageSelect.innerHTML = ''
  for (const p of pages) {
    const opt = document.createElement('option')
    opt.value = p
    opt.textContent = p
    if (p === currentPage) opt.selected = true
    pageSelect.appendChild(opt)
  }
}

/** Switch the previewed page (called on nav-link clicks inside the preview). */
export function setPage(path) {
  if (!store.getFile(path)) return
  currentPage = path
  if (pageSelect) pageSelect.value = path
  rebuildNow()
}

async function rebuildNow() {
  if (!frame) return
  try { beforeRebuild() } catch { /* ignore */ }
  const token = ++buildToken
  const { html } = await buildPreview(store.files(), currentPage)
  // A newer rebuild may have started while we awaited assets — drop stale ones.
  if (token !== buildToken || !frame) return
  frame.srcdoc = html
}

const scheduleRebuild = debounce(rebuildNow, 350)
