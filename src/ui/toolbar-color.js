// @ts-check
import { promptColors } from './dialogs.js'

/**
 * Let students pick colors for parts of the IDE by typing hex codes — a small,
 * real use of the color codes they learn in CSS. There are three "zones", each
 * with its own saved color and its own pair of custom properties
 * (--<zone>-bg and --<zone>-text; the text color is chosen automatically so it
 * stays readable):
 *
 *   toolbar  the horizontal bars (menu bar, preview toolbar, Problems/Console tabs)
 *   sidebar  the Files sidebar
 *   panel    the Problems / Console area
 *
 * index.html applies the saved values before first paint; this module owns the
 * dialog and the live update.
 */

/** @typedef {{ id: string, label: string, hint: string, storageKey: string }} ColorZone */

/** @type {ColorZone[]} */
export const ZONES = [
  { id: 'toolbar', label: 'Horizontal bars', hint: 'The menu bar and the bars above the preview and the Problems/Console area.', storageKey: 'iwide-toolbar-color' },
  { id: 'sidebar', label: 'Files sidebar', hint: 'The list of files on the left.', storageKey: 'iwide-sidebar-color' },
  { id: 'panel', label: 'Problems & Console', hint: 'The area at the bottom where messages show up.', storageKey: 'iwide-panel-color' },
]

/** Kept for existing imports; the toolbar zone's key. */
export const STORAGE_KEY = 'iwide-toolbar-color'

/** "#abc" or "#aabbcc" (case-insensitive). */
export function isHexColor(v) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim())
}

/** Expand "#abc" → "#aabbcc", lowercase. */
export function normalizeHex(v) {
  let h = v.trim().toLowerCase()
  if (h.length === 4) h = '#' + [...h.slice(1)].map((c) => c + c).join('')
  return h
}

/** Black or white, whichever reads better on the given background. */
export function readableTextColor(hex) {
  const h = normalizeHex(hex).slice(1)
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  // Relative luminance (sRGB → linear) per WCAG.
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.4 ? '#1c2530' : '#ffffff'
}

/** The saved color for a zone, or "" if the student hasn't chosen one. */
export function savedZoneColor(zoneId) {
  const zone = ZONES.find((z) => z.id === zoneId)
  if (!zone) return ''
  try { return localStorage.getItem(zone.storageKey) || '' } catch { return '' }
}

/**
 * Apply a hex color to one zone (or clear it back to the theme default).
 * @param {string} zoneId  'toolbar' | 'sidebar' | 'panel'
 * @param {string} hex     "" to clear
 * @param {boolean} [save] false to only preview (no localStorage write)
 */
export function applyZoneColor(zoneId, hex, save = true) {
  const zone = ZONES.find((z) => z.id === zoneId)
  if (!zone) return
  const root = document.documentElement
  const bgVar = `--${zone.id}-bg`, textVar = `--${zone.id}-text`
  if (!hex) {
    root.style.removeProperty(bgVar)
    root.style.removeProperty(textVar)
    if (save) try { localStorage.removeItem(zone.storageKey) } catch { /* ignore */ }
    return
  }
  const color = normalizeHex(hex)
  root.style.setProperty(bgVar, color)
  root.style.setProperty(textVar, readableTextColor(color))
  if (save) try { localStorage.setItem(zone.storageKey, color) } catch { /* private mode — this session only */ }
}

/** Backwards-compatible alias for the toolbar zone. */
export function applyToolbarColor(hex) { applyZoneColor('toolbar', hex) }

function validateHex(v) {
  if (!v) return ''
  if (!v.startsWith('#')) return 'Hex codes start with a # sign.'
  if (!isHexColor(v)) return 'Use 3 or 6 characters from 0-9 and a-f after the #, like #ff6600.'
  return ''
}

/** Open the dialog, preview as they type, then save (or undo on cancel). */
export async function openColorDialog() {
  const before = Object.fromEntries(ZONES.map((z) => [z.id, savedZoneColor(z.id)]))
  const values = await promptColors({
    title: 'IDE colors',
    message: 'Type a hex color code like #ff6600 or #0a3 for each part. Leave one blank to use the normal color.',
    fields: ZONES.map((z) => ({ id: z.id, label: z.label, hint: z.hint, initial: before[z.id], placeholder: '#ff6600' })),
    confirmLabel: 'Apply',
    validate: validateHex,
    // Live preview: show the color while typing, but only if it's a valid code.
    onChange: (id, v) => { if (!validateHex(v)) applyZoneColor(id, v, false) },
  })
  if (values === null) {
    // Cancelled: put everything back the way it was saved.
    for (const z of ZONES) applyZoneColor(z.id, before[z.id], false)
    return
  }
  for (const z of ZONES) applyZoneColor(z.id, values[z.id] || '')
}

/** @deprecated use openColorDialog */
export const openToolbarColorDialog = openColorDialog

/** @param {HTMLElement|null} btn */
export function initToolbarColor(btn) {
  if (!btn) return
  btn.addEventListener('click', openColorDialog)
}
