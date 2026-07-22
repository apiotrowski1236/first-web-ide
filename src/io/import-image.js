// @ts-check
import { store } from '../store/project-store.js'
import { basename, extname, languageOf } from '../util/paths.js'

/**
 * Import individual image files from the student's computer into the CURRENT
 * project's images/ folder. Unlike import-folder.js (which opens a whole new
 * site), this adds pictures to the site the student is already working on.
 *
 * Each picture is stored as a Blob (see model.js FileRecord). Names are
 * cleaned up to follow the class rules: lowercase, no spaces, hyphens for gaps.
 */

const IMAGE_FOLDER = 'images'

/** Pictures bigger than this are fine, but worth a gentle heads-up. */
export const LARGE_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB

/** "1.8 MB" from a byte count, for friendly messages. */
export function formatBytes(n) {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB'
  if (n >= 1024) return Math.round(n / 1024) + ' KB'
  return n + ' bytes'
}

/** Fallback extension when a file has none, based on its MIME type. */
const MIME_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/avif': '.avif',
}

/**
 * Turn a computer filename like "My Vacation Photo.JPG" into a safe,
 * class-style asset name like "my-vacation-photo.jpg".
 * @param {string} rawName
 * @param {string} [mimeType]
 */
export function sanitizeImageName(rawName, mimeType = '') {
  const base = basename(rawName || '')
  let ext = extname(base).toLowerCase()
  let stem = ext ? base.slice(0, base.length - ext.length) : base
  // If the extension isn't a known image type, try to recover one from the MIME.
  if (languageOf('x' + ext) !== 'image') {
    ext = MIME_EXT[mimeType] || ext || '.png'
  }
  stem = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // spaces & punctuation → hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
  if (!stem) stem = 'image'
  return stem + ext
}

/** Pick a path in images/ that doesn't collide, adding -2, -3, … if needed. */
function uniqueImagePath(name) {
  const ext = extname(name)
  const stem = name.slice(0, name.length - ext.length)
  let candidate = `${IMAGE_FOLDER}/${name}`
  let n = 2
  while (store.getFile(candidate)) {
    candidate = `${IMAGE_FOLDER}/${stem}-${n}${ext}`
    n += 1
  }
  return candidate
}

/**
 * Add image File objects into the current project's images/ folder.
 * @param {FileList | File[]} fileList
 * @returns {Promise<{ added: string[], skipped: string[], large: {path: string, size: number}[] }>}
 */
export async function importImageFiles(fileList) {
  /** @type {string[]} */ const added = []
  /** @type {string[]} */ const skipped = []
  /** @type {{path: string, size: number}[]} */ const large = []
  for (const file of Array.from(fileList)) {
    const name = sanitizeImageName(file.name, file.type)
    if (languageOf(name) !== 'image') {
      skipped.push(file.name)
      continue
    }
    const path = uniqueImagePath(name)
    store.addFile(path, file) // a File is a Blob; stored as a binary asset
    added.push(path)
    if (file.size > LARGE_IMAGE_BYTES) large.push({ path, size: file.size })
  }
  return { added, skipped, large }
}
