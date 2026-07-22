// @ts-check
import { zipSync, strToU8 } from 'fflate'
import { store } from '../store/project-store.js'
import { basename, mimeOf } from '../util/paths.js'

/**
 * Export the whole site as a .zip that drops straight into a static web server
 * uploader, and single-file download for one file at a time.
 */

async function toBytes(content, path) {
  if (content instanceof Blob) return new Uint8Array(await content.arrayBuffer())
  return strToU8(String(content))
}

/** Zip the current project and trigger a download. */
export async function exportProjectZip() {
  if (!store.project) return
  /** @type {Record<string, Uint8Array>} */
  const entries = {}
  for (const [path, file] of Object.entries(store.files())) {
    entries[path] = await toBytes(file.content, path)
  }
  const zipped = zipSync(entries, { level: 6 })
  const name = (store.name || 'my-site').replace(/[^a-z0-9._-]/gi, '-')
  // zipSync returns a Uint8Array; copy into a fresh ArrayBuffer for the Blob.
  triggerDownload(new Blob([zipped.slice()], { type: 'application/zip' }), name + '.zip')
}

/** Download a single file as-is. */
export async function downloadFile(path) {
  const file = store.getFile(path)
  if (!file) return
  const blob = file.content instanceof Blob
    ? file.content
    : new Blob([String(file.content)], { type: mimeOf(path) })
  triggerDownload(blob, basename(path))
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
