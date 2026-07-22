// @ts-check

/**
 * Light/dark theme toggle for the IDE chrome.
 *
 * The whole app is styled with CSS custom properties (see styles.css); the dark
 * palette is applied via `<html data-theme="dark">`. An inline script in
 * index.html sets that attribute before first paint (saved choice, else the OS
 * preference), so all this module does is flip it and remember the choice.
 */

const STORAGE_KEY = 'iwide-theme'

/** The theme currently showing, read from the <html> element. */
function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

/** Apply a theme and remember it for next time. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* private mode — this session only */ }
}

/** Update the button to show the mode it will switch to. */
function paintButton(btn) {
  const isDark = currentTheme() === 'dark'
  btn.textContent = isDark ? '☀ Light' : '☾ Dark'
  btn.setAttribute('aria-pressed', String(isDark))
  btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode'
}

/**
 * Wire up the theme toggle button.
 * @param {HTMLElement|null} btn
 */
export function initThemeToggle(btn) {
  if (!btn) return
  paintButton(btn)
  btn.addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark')
    paintButton(btn)
  })
}
