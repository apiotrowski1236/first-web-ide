// @ts-check
import runtimeSource from './preview-runtime.js?raw'
import { resolveRef, mimeOf, languageOf } from '../util/paths.js'

/**
 * Assemble the in-browser project into a single self-contained HTML document
 * for the preview iframe's `srcdoc`.
 *
 * Why srcdoc + inline/data: URLs (not blob: subresources): the preview frame is
 * sandboxed WITHOUT `allow-same-origin`, so it has an opaque origin. Such a
 * frame is not allowed to load `blob:` subresources created by the app's
 * origin. `data:` URLs and inline content, by contrast, load fine — so CSS is
 * inlined as <style>, scripts become `data:` URLs (which keep per-file line
 * numbers for error reporting), and images become `data:` URLs.
 *
 * Links to other local pages become intercepted navigation events (handled by
 * preview-runtime.js), avoiding cross-page origin issues entirely.
 *
 * @param {Record<string, import('../store/model.js').FileRecord>} files
 * @param {string} entryPath
 * @returns {Promise<{ html: string }>}
 */
export async function buildPreview(files, entryPath) {
  // 1. Asset (image/text) data URLs, keyed by path.
  /** @type {Map<string, string>} */
  const assetUrls = new Map()
  for (const [path, file] of Object.entries(files)) {
    const lang = languageOf(path)
    if (lang === 'image' || lang === 'text') {
      assetUrls.set(path, await toDataUrl(file.content, mimeOf(path)))
    }
  }

  const has = (p) => Object.prototype.hasOwnProperty.call(files, p)

  const entry = files[entryPath]
  if (!entry) {
    return {
      html: `<!DOCTYPE html><meta charset="utf-8"><body style="font-family:sans-serif;padding:2rem;color:#555">
        <p>No page called <code>${escapeHtml(entryPath)}</code> to preview yet.</p></body>`,
    }
  }

  const doc = new DOMParser().parseFromString(String(entry.content), 'text/html')

  // Suppress the preview's favicon request (avoids a stray 404).
  const favicon = doc.createElement('link')
  favicon.setAttribute('rel', 'icon')
  favicon.setAttribute('href', 'data:,')

  // 2. Inline stylesheets: <link rel=stylesheet href=css/x.css> → <style>…</style>
  doc.querySelectorAll('link[rel~="stylesheet"][href]').forEach((el) => {
    const target = resolveRef(entryPath, el.getAttribute('href') || '')
    if (target && has(target) && languageOf(target) === 'css') {
      const style = doc.createElement('style')
      style.textContent = rewriteCssUrls(String(files[target].content), target, assetUrls)
      el.replaceWith(style)
    }
  })

  // 3. Scripts: <script src=script.js> → data: URL (keeps line numbers).
  doc.querySelectorAll('script[src]').forEach((el) => {
    const target = resolveRef(entryPath, el.getAttribute('src') || '')
    if (target && has(target) && languageOf(target) === 'javascript') {
      el.setAttribute('src', jsDataUrl(String(files[target].content)))
    }
  })

  // 4. Media: <img>/<source>/<video>/<audio> src → asset data URLs.
  doc.querySelectorAll('img[src], source[src], video[src], audio[src]').forEach((el) => {
    const target = resolveRef(entryPath, el.getAttribute('src') || '')
    if (target && assetUrls.has(target)) el.setAttribute('src', assetUrls.get(target))
  })

  // 5. Links to other local pages → intercepted navigation.
  doc.querySelectorAll('a[href]').forEach((el) => {
    const raw = el.getAttribute('href') || ''
    const target = resolveRef(entryPath, raw)
    if (target && has(target) && /\.html?$/.test(target)) {
      el.setAttribute('data-iwide-nav', target)
      el.setAttribute('href', '#')
    }
  })

  // 6. Inject the console/error runtime as the very first thing in <head>.
  const runtime = doc.createElement('script')
  runtime.textContent = runtimeSource
  const head = doc.head || doc.documentElement
  head.insertBefore(runtime, head.firstChild)
  head.insertBefore(favicon, head.firstChild)

  const html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
  return { html }
}

/** Encode JS source as a data: URL that still reports correct line numbers. */
function jsDataUrl(source) {
  return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(source)
}

/** Content → data URL. Blobs use base64; text uses percent-encoding. */
function toDataUrl(content, mime) {
  if (content instanceof Blob) {
    return new Promise((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = () => resolve('data:,')
      r.readAsDataURL(content)
    })
  }
  return Promise.resolve(`data:${mime};charset=utf-8,` + encodeURIComponent(String(content)))
}

/** Rewrite url(...) references inside CSS to asset data URLs. */
function rewriteCssUrls(css, cssPath, assetUrls) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, _q, ref) => {
    const target = resolveRef(cssPath, ref)
    if (target && assetUrls.has(target)) return `url(${assetUrls.get(target)})`
    return whole
  })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}
