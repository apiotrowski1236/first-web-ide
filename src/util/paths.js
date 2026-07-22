// @ts-check

/**
 * Path helpers for the in-browser virtual site. Paths are POSIX-style,
 * relative to the project root, with no leading slash (e.g. "css/style.css").
 */

/** Language id we use for a file, based on its extension. */
export function languageOf(path) {
  const ext = extname(path).toLowerCase()
  if (ext === '.html' || ext === '.htm') return 'html'
  if (ext === '.css') return 'css'
  if (ext === '.js' || ext === '.mjs') return 'javascript'
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.avif'].includes(ext)) return 'image'
  return 'text'
}

/** True when the file is binary (stored as a Blob, not a string). */
export function isBinary(path) {
  return languageOf(path) === 'image'
}

/** ".css" including the dot, or "" if none. */
export function extname(path) {
  const base = basename(path)
  const i = base.lastIndexOf('.')
  return i <= 0 ? '' : base.slice(i)
}

/** Last path segment. */
export function basename(path) {
  const clean = path.replace(/\/+$/, '')
  const i = clean.lastIndexOf('/')
  return i < 0 ? clean : clean.slice(i + 1)
}

/** Directory portion, or "" for a root-level file. */
export function dirname(path) {
  const i = path.lastIndexOf('/')
  return i < 0 ? '' : path.slice(0, i)
}

/**
 * Resolve `ref` (a relative or root-relative URL from an HTML/CSS file located
 * at `fromPath`) into a normalized project path. Returns null for external/data
 * URLs, anchors, or anything that escapes the project root.
 * @param {string} fromPath  path of the file containing the reference
 * @param {string} ref       the href/src value
 */
export function resolveRef(fromPath, ref) {
  if (!ref) return null
  const trimmed = ref.trim()
  // Skip absolute URLs, protocol-relative, data:, mailto:, tel:, #anchors, empty.
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#|data:|mailto:|tel:)/i.test(trimmed)) return null
  // Strip query string and hash — the virtual file has no query.
  const noHash = trimmed.split('#')[0].split('?')[0]
  if (!noHash) return null

  const baseDir = trimmed.startsWith('/') ? '' : dirname(fromPath)
  const startSegments = trimmed.startsWith('/') ? [] : baseDir ? baseDir.split('/') : []
  const parts = noHash.replace(/^\//, '').split('/')
  const stack = [...startSegments]
  for (const part of parts) {
    if (part === '' || part === '.') continue
    if (part === '..') { stack.pop(); continue }
    stack.push(part)
  }
  return stack.join('/')
}

/** Best-effort MIME type for building blob URLs. */
export function mimeOf(path) {
  const ext = extname(path).toLowerCase()
  const map = {
    '.html': 'text/html', '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.avif': 'image/avif',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.txt': 'text/plain',
  }
  return map[ext] || 'application/octet-stream'
}

/**
 * Validate a filename the way the class teaches: lowercase, no spaces,
 * hyphens for gaps. Returns an error string, or "" when valid.
 * Folders (slashes) are allowed so students can make css/ and assets/.
 */
export function validateFilename(name) {
  if (!name || !name.trim()) return 'Give your file a name.'
  const n = name.trim()
  if (n.startsWith('/') || n.endsWith('/')) return "Don't start or end the name with a slash."
  if (/\s/.test(n)) return 'No spaces — use a hyphen instead, like my-page.html.'
  if (/[A-Z]/.test(n)) return 'Use lowercase letters only (the web is picky about this).'
  if (!/^[a-z0-9._/-]+$/.test(n)) return 'Use only letters, numbers, hyphens, dots and slashes.'
  if (/\.\./.test(n)) return "Names can't contain “..”."
  if (!extname(n)) return 'Add a file type, like .html, .css or .js.'
  return ''
}
