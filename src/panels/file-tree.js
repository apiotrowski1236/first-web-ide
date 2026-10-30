// @ts-check
import { store } from '../store/project-store.js'
import { promptText, confirmDialog, promptNewFile } from '../ui/dialogs.js'
import { validateFilename, validateFoldername, validateBasename, dirname, basename, languageOf } from '../util/paths.js'
import { forgetFile, renameCached } from '../editor/editor.js'

/**
 * Renders the file list grouped by folder, with rename/delete actions and
 * lowercase/no-space guardrails on names.
 */

let rootEl /** @type {HTMLElement | null} */ = null

export function initFileTree(el) {
  rootEl = el
  store.on('files:change', render)
  store.on('active:change', render)
  store.on('project:load', render)
  store.on('dirty:change', render)
  render()
}

function render() {
  if (!rootEl) return
  rootEl.innerHTML = ''
  const paths = store.paths()

  // Group by directory so css/ and assets/ read as folders.
  /** @type {Map<string, string[]>} */
  const groups = new Map()
  for (const p of paths) {
    const dir = dirname(p)
    if (!groups.has(dir)) groups.set(dir, [])
    groups.get(dir).push(p)
  }
  const dirs = [...groups.keys()].sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)))

  for (const dir of dirs) {
    if (dir !== '') {
      const folder = document.createElement('li')
      folder.className = 'is-folder'
      folder.textContent = '📁 ' + dir
      rootEl.appendChild(folder)
    }
    for (const path of groups.get(dir)) {
      rootEl.appendChild(fileRow(path, dir !== ''))
    }
  }
}

function fileRow(path, indented) {
  const li = document.createElement('li')
  li.className = 'file' + (path === store.activePath ? ' is-active' : '')
  if (indented) li.style.paddingLeft = '34px'

  const dot = store.isDirty(path) ? ' •' : ''
  const name = document.createElement('span')
  name.textContent = iconFor(path) + ' ' + basename(path) + dot
  li.appendChild(name)

  const actions = document.createElement('span')
  actions.className = 'file-actions'
  const renameBtn = document.createElement('button')
  renameBtn.textContent = '✎'
  renameBtn.title = 'Rename'
  renameBtn.addEventListener('click', (e) => { e.stopPropagation(); doRename(path) })
  const delBtn = document.createElement('button')
  delBtn.textContent = '🗑'
  delBtn.title = 'Delete'
  delBtn.addEventListener('click', (e) => { e.stopPropagation(); doDelete(path) })
  actions.append(renameBtn, delBtn)
  li.appendChild(actions)

  li.addEventListener('click', () => store.setActive(path))
  return li
}

function iconFor(path) {
  const lang = languageOf(path)
  return lang === 'html' ? '📄' : lang === 'css' ? '🎨' : lang === 'javascript' ? '⚙️' : lang === 'image' ? '🖼' : lang === 'audio' ? '🎵' : '📃'
}

/** Every folder that currently holds a file, sorted (no "" for top level). */
function existingFolders() {
  const dirs = new Set()
  for (const p of store.paths()) {
    // Include parent folders too, so "images/icons" also offers "images".
    const parts = dirname(p).split('/').filter(Boolean)
    for (let i = 1; i <= parts.length; i++) dirs.add(parts.slice(0, i).join('/'))
  }
  return [...dirs].sort()
}

/** Ask which folder a new file belongs in and what to call it, then create it. */
export async function newFile() {
  const path = await promptNewFile({
    folders: existingFolders(),
    validateFolder: validateFoldername,
    validateName: validateBasename,
    exists: (p) => !!store.getFile(p),
  })
  if (!path) return
  const content = starterContentFor(path)
  store.addFile(path, content)
  store.setActive(path)
}

function starterContentFor(path) {
  const lang = languageOf(path)
  if (lang === 'html') {
    const title = basename(path).replace(/\.[^.]+$/, '')
    // Pages inside a folder need "../" to reach css/ at the top level.
    const depth = dirname(path) ? dirname(path).split('/').length : 0
    const up = '../'.repeat(depth)
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="${up}css/style.css" />
  </head>
  <body>
    <h1>${title}</h1>
  </body>
</html>
`
  }
  if (lang === 'css') return '/* Styles for your site */\n'
  if (lang === 'javascript') return '// JavaScript for your site\n'
  return ''
}

async function doRename(path) {
  const next = await promptText({
    title: 'Rename file',
    initial: path,
    confirmLabel: 'Rename',
    validate: (v) => {
      const err = validateFilename(v)
      if (err) return err
      if (v !== path && store.getFile(v)) return 'A file with that name already exists.'
      return ''
    },
  })
  if (!next || next === path) return
  try {
    store.renameFile(path, next)
    renameCached(path, next)
  } catch (e) {
    await confirmDialog({ title: 'Could not rename', message: String(e.message || e), confirmLabel: 'OK' })
  }
}

async function doDelete(path) {
  const ok = await confirmDialog({
    title: `Delete ${basename(path)}?`,
    message: 'This removes the file from your site. You can’t undo this.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  store.removeFile(path)
  forgetFile(path)
}
