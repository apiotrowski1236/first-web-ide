// @ts-check

/**
 * Collapsible Files sidebar and Problems/Console panel.
 *
 * Collapsing is done purely with classes on `<html>` (`sidebar-collapsed`,
 * `panel-collapsed`) that styles.css reacts to; this module flips the classes,
 * keeps the toggle buttons' labels in sync, and remembers the choice so the
 * layout comes back the same way next visit. The inline script in index.html
 * applies the saved classes before first paint so nothing jumps.
 */

const ZONES = {
  sidebar: { cls: 'sidebar-collapsed', key: 'iwide-sidebar-collapsed', name: 'Files sidebar' },
  panel: { cls: 'panel-collapsed', key: 'iwide-panel-collapsed', name: 'Problems/Console panel' },
}

/** @param {keyof typeof ZONES} zone */
function isCollapsed(zone) {
  return document.documentElement.classList.contains(ZONES[zone].cls)
}

/**
 * @param {keyof typeof ZONES} zone
 * @param {boolean} collapsed
 */
export function setCollapsed(zone, collapsed) {
  document.documentElement.classList.toggle(ZONES[zone].cls, collapsed)
  try { localStorage.setItem(ZONES[zone].key, collapsed ? '1' : '0') } catch { /* private mode */ }
  paintButtons(zone)
  // The editor and preview change width/height; let anything listening re-measure.
  window.dispatchEvent(new Event('resize'))
}

/** @param {keyof typeof ZONES} zone */
function paintButtons(zone) {
  const collapsed = isCollapsed(zone)
  document.querySelectorAll(`[data-collapse="${zone}"]`).forEach((btn) => {
    btn.setAttribute('aria-expanded', String(!collapsed))
    btn.setAttribute('title', `${collapsed ? 'Show' : 'Hide'} the ${ZONES[zone].name}`)
    if (zone === 'sidebar') btn.textContent = collapsed ? '▸' : '◂'
    else btn.textContent = collapsed ? '▴' : '▾'
  })
}

/** Wire every `[data-collapse]` button and paint its initial state. */
export function initCollapsibles() {
  for (const zone of /** @type {(keyof typeof ZONES)[]} */ (Object.keys(ZONES))) {
    document.querySelectorAll(`[data-collapse="${zone}"]`).forEach((btn) => {
      btn.addEventListener('click', () => setCollapsed(zone, !isCollapsed(zone)))
    })
    paintButtons(zone)
  }
}
