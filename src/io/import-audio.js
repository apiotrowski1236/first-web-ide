// @ts-check
import { store } from '../store/project-store.js'
import { basename, extname, languageOf } from '../util/paths.js'

/**
 * Add small sound files from the student's computer into the CURRENT project's
 * audio/ folder. Mirrors import-image.js: each clip is stored as a Blob and
 * named by the class rules (lowercase, hyphens, no spaces).
 *
 * Sounds are kept deliberately small: everything lives in the browser's
 * storage and in the exported zip, and big clips make pages slow.
 */

const AUDIO_FOLDER = 'audio'

/** Hard limit — clips above this are refused with a friendly message. */
export const MAX_AUDIO_BYTES = 3 * 1024 * 1024 // 3 MB

/** Fallback extension when a file has none, based on its MIME type. */
const MIME_EXT = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/flac': '.flac',
  'audio/webm': '.weba',
}

/** "My Song (final).MP3" → "my-song-final.mp3" */
export function sanitizeAudioName(rawName, mimeType = '') {
  const base = basename(rawName || '')
  let ext = extname(base).toLowerCase()
  let stem = ext ? base.slice(0, base.length - ext.length) : base
  if (languageOf('x' + ext) !== 'audio') ext = MIME_EXT[mimeType] || ext || '.mp3'
  stem = stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (!stem) stem = 'sound'
  return stem + ext
}

/** Pick a path in audio/ that doesn't collide, adding -2, -3, … if needed. */
function uniqueAudioPath(name) {
  const ext = extname(name)
  const stem = name.slice(0, name.length - ext.length)
  let candidate = `${AUDIO_FOLDER}/${name}`
  let n = 2
  while (store.getFile(candidate)) {
    candidate = `${AUDIO_FOLDER}/${stem}-${n}${ext}`
    n += 1
  }
  return candidate
}

/**
 * Add audio File objects into the current project's audio/ folder.
 * @param {FileList | File[]} fileList
 * @returns {Promise<{ added: string[], skipped: string[], tooBig: {name: string, size: number}[] }>}
 */
export async function importAudioFiles(fileList) {
  /** @type {string[]} */ const added = []
  /** @type {string[]} */ const skipped = []
  /** @type {{name: string, size: number}[]} */ const tooBig = []
  for (const file of Array.from(fileList)) {
    const name = sanitizeAudioName(file.name, file.type)
    if (languageOf(name) !== 'audio') { skipped.push(file.name); continue }
    if (file.size > MAX_AUDIO_BYTES) { tooBig.push({ name: file.name, size: file.size }); continue }
    const path = uniqueAudioPath(name)
    store.addFile(path, file) // a File is a Blob; stored as a binary asset
    added.push(path)
  }
  return { added, skipped, tooBig }
}
