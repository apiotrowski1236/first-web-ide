// @ts-check
import { store } from './project-store.js'
import { saveProject, setLastOpened } from './db.js'
import { debounce } from '../util/debounce.js'

/**
 * Write-behind autosave. Any change to the project (content, structure) marks
 * it dirty; we coalesce writes and flush to IndexedDB after a short quiet
 * period. The IndexedDB copy — never a lone in-memory variable — is the record
 * students rely on, so we also flush on page hide.
 *
 * @param {(status: 'saving'|'saved') => void} onStatus
 */
export function installAutosave(onStatus) {
  let saving = false
  let pendingAgain = false

  async function flush() {
    if (!store.project) return
    if (saving) { pendingAgain = true; return }
    saving = true
    onStatus('saving')
    try {
      await saveProject(store.project)
      await setLastOpened(store.project.id)
      store.markSaved()
    } catch (err) {
      console.error('Autosave failed', err)
    } finally {
      saving = false
      onStatus('saved')
      if (pendingAgain) { pendingAgain = false; scheduleFlush() }
    }
  }

  const scheduleFlush = debounce(flush, 800)

  // Any structural or content change schedules a save.
  store.on('file:change', scheduleFlush)
  store.on('files:change', scheduleFlush)

  // Best-effort flush when the tab is hidden or closed (Safari-friendly).
  const flushNow = () => { if (store.anyDirty()) flush() }
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushNow()
  })
  window.addEventListener('pagehide', flushNow)

  return { flush }
}

/**
 * Ask the browser to keep our storage from being evicted. Safari grants this
 * inconsistently; we surface the result so the UI can warn students to export.
 * @returns {Promise<'persisted'|'not-persisted'|'unsupported'>}
 */
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) return 'unsupported'
  try {
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false
    const granted = already || (await navigator.storage.persist())
    return granted ? 'persisted' : 'not-persisted'
  } catch {
    return 'unsupported'
  }
}
