// @ts-check
import './styles.css'

import { store } from './store/project-store.js'
import { newProject } from './store/model.js'
import { saveProject, loadProject, getLastOpened, listProjects, setLastOpened } from './store/db.js'
import { installAutosave, requestPersistence } from './store/autosave.js'

import { initEditor, openFile, setLintProvider, getView } from './editor/editor.js'
import { cmLintSource, setOnDiagnostics } from './editor/lint-bridge.js'

import { initFileTree, newFile } from './panels/file-tree.js'
import { initTabs } from './panels/tabs.js'
import { initProblemsPanel, renderProblems } from './panels/problems-panel.js'
import { initConsolePanel, addLog, addError, clearConsole } from './panels/console-panel.js'

import { initPreview, setPage, onBeforeRebuild } from './preview/preview.js'
import { initConsoleBridge } from './preview/console-bridge.js'

import { importFromFileList, importFromDataTransfer } from './io/import-folder.js'
import { importImageFiles, formatBytes } from './io/import-image.js'
import { exportProjectZip } from './io/export-zip.js'
import { openProjectsDialog } from './ui/projects.js'
import { confirmDialog } from './ui/dialogs.js'
import { initThemeToggle } from './ui/theme.js'

const $ = (sel) => /** @type {HTMLElement} */ (document.querySelector(sel))

async function boot() {
  // ---- Editor + lint wiring ----
  initEditor($('#editor-host'))
  setLintProvider(cmLintSource)
  setOnDiagnostics(renderProblems)

  // ---- Panels ----
  initFileTree($('#file-tree'))
  initTabs($('#tabs'))
  initProblemsPanel($('#problems-panel'), $('#problems-count'))
  initConsolePanel($('#console-panel'), $('#console-count'), () => activateBottom('console'))
  clearConsole()

  // ---- Preview + console bridge ----
  initPreview($('#preview-frame'), $('#preview-page'), $('#btn-refresh-preview'))
  onBeforeRebuild(clearConsole)
  initConsoleBridge({
    onLog: addLog,
    onError: addError,
    onNavigate: (path) => setPage(path),
  })

  // The editor shows whichever file is active.
  store.on('active:change', (path) => { if (path) openFile(path) })

  // ---- Autosave + save status ----
  const saveStatus = $('#save-status')
  installAutosave((status) => {
    saveStatus.textContent = status === 'saving' ? 'Saving…' : 'Saved'
    saveStatus.classList.toggle('is-saving', status === 'saving')
  })

  wireMenu()
  wireBottomTabs()
  wireDragAndDrop()

  // ---- Load last project, or start a fresh one ----
  await openInitialProject()

  // ---- Ask to keep storage; warn if the browser won't ----
  const persistence = await requestPersistence()
  updatePersistBadge(persistence)

  // Dev-only hook used by the smoke test to drive the real editor.
  if (import.meta.env.DEV) {
    // @ts-ignore
    window.__ide = { store, getView, setDoc(text) {
      const v = getView()
      if (v) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } })
    } }
  }
}

async function openInitialProject() {
  let proj = null
  try {
    const lastId = await getLastOpened()
    if (lastId) proj = await loadProject(lastId)
    if (!proj) {
      const all = await listProjects()
      if (all.length) proj = await loadProject(all[0].id)
    }
  } catch { /* fall through to a new project */ }

  if (!proj) {
    proj = newProject('my-site')
    await saveProject(proj)
    await setLastOpened(proj.id)
  }
  store.load(proj)
}

function wireMenu() {
  $('#btn-new-file').addEventListener('click', () => newFile())
  $('#btn-add-image').addEventListener('click', triggerImageImport)
  $('#btn-export').addEventListener('click', () => exportProjectZip())
  $('#btn-projects').addEventListener('click', () => openProjectsDialog())
  $('#btn-import').addEventListener('click', triggerImport)
  initThemeToggle($('#btn-theme'))
}

/** Pick one or more pictures from the computer and add them to images/. */
function triggerImageImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.style.display = 'none'
  input.addEventListener('change', async () => {
    if (input.files && input.files.length) {
      const { added, skipped, large } = await importImageFiles(input.files)
      // Select the last picture added so the student sees it right away.
      if (added.length) store.setActive(added[added.length - 1])
      if (skipped.length) {
        await confirmDialog({
          title: 'Some files were skipped',
          message: `These weren't pictures I could add: ${skipped.join(', ')}. Try a .png, .jpg, .gif, .webp or .svg image.`,
          confirmLabel: 'OK',
        })
      }
      // Gentle heads-up (not a block): big pictures slow the page and eat storage.
      if (large.length) {
        const list = large.map((f) => `${f.path} (${formatBytes(f.size)})`).join(', ')
        await confirmDialog({
          title: large.length === 1 ? 'That picture is a bit large' : 'Some pictures are a bit large',
          message: `${list}. It's added and will work, but large images make your page load slowly and use up saved space. If you can, resize it smaller (under 2 MB) before using it.`,
          confirmLabel: 'Got it',
        })
      }
    }
    input.remove()
  })
  document.body.appendChild(input)
  input.click()
}

function triggerImport() {
  const input = document.createElement('input')
  input.type = 'file'
  // @ts-ignore — non-standard but widely supported folder picker
  input.webkitdirectory = true
  input.multiple = true
  input.style.display = 'none'
  input.addEventListener('change', async () => {
    if (!input.files || !input.files.length) return
    const proj = await importFromFileList(input.files)
    if (proj) await adoptImportedProject(proj)
    input.remove()
  })
  document.body.appendChild(input)
  input.click()
}

async function adoptImportedProject(proj) {
  const ok = await confirmDialog({
    title: `Open "${proj.name}"?`,
    message: `This imports ${Object.keys(proj.files).length} files as a new site in this browser.`,
    confirmLabel: 'Import',
  })
  if (!ok) return
  if (store.project) await saveProject(store.project)
  await saveProject(proj)
  await setLastOpened(proj.id)
  store.load(proj)
}

function wireBottomTabs() {
  document.querySelectorAll('.bottom-tab').forEach((btn) => {
    btn.addEventListener('click', () => activateBottom(btn.getAttribute('data-panel')))
  })
  $('#btn-clear-console').addEventListener('click', clearConsole)
}

function activateBottom(name) {
  document.querySelectorAll('.bottom-tab').forEach((b) =>
    b.classList.toggle('is-active', b.getAttribute('data-panel') === name))
  $('#problems-panel').classList.toggle('is-active', name === 'problems')
  $('#console-panel').classList.toggle('is-active', name === 'console')
}

function wireDragAndDrop() {
  const app = $('#app')
  const over = (e) => { e.preventDefault(); app.classList.add('drag-over') }
  const leave = () => app.classList.remove('drag-over')
  app.addEventListener('dragover', over)
  app.addEventListener('dragleave', leave)
  app.addEventListener('drop', async (e) => {
    e.preventDefault()
    leave()
    const items = e.dataTransfer?.items
    if (!items || !items.length) return
    const proj = await importFromDataTransfer(items)
    if (proj) await adoptImportedProject(proj)
  })
}

function updatePersistBadge(status) {
  const badge = $('#persist-badge')
  if (status === 'not-persisted') {
    badge.hidden = false
    badge.textContent = '⚠ Export often to keep your work safe'
    badge.title = "This browser may clear saved work if you don't visit for a while. Use Export .zip to keep a copy."
  } else {
    badge.hidden = true
  }
}

boot()
