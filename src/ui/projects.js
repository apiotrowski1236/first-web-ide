// @ts-check
import { store } from '../store/project-store.js'
import { newProject } from '../store/model.js'
import { listProjects, loadProject, deleteProject, saveProject, setLastOpened } from '../store/db.js'
import { promptText, confirmDialog } from './dialogs.js'

/**
 * The "Projects" picker: switch between saved sites, or start a new one.
 * No accounts — everything is local to this browser.
 */

/** Save the current project, then load another by id. */
export async function switchToProject(id) {
  if (store.project) await saveProject(store.project)
  const proj = await loadProject(id)
  if (!proj) return
  store.load(proj)
  await setLastOpened(id)
}

/** Create and open a fresh starter project. */
export async function createProject() {
  const name = await promptText({
    title: 'New site',
    message: 'Give your site a short name (lowercase, hyphens for spaces).',
    initial: 'my-site',
    confirmLabel: 'Create',
    validate: (v) => (/^[a-z0-9][a-z0-9-]*$/.test(v) ? '' : 'Use lowercase letters, numbers and hyphens.'),
  })
  if (!name) return
  if (store.project) await saveProject(store.project)
  const proj = newProject(name)
  await saveProject(proj)
  store.load(proj)
  await setLastOpened(proj.id)
}

/** Open the projects dialog. */
export async function openProjectsDialog() {
  const projects = await listProjects()
  const backdrop = document.createElement('div')
  backdrop.className = 'dialog-backdrop'
  backdrop.innerHTML = `
    <div class="dialog" role="dialog" aria-modal="true">
      <h2>Your sites</h2>
      <p>Switch between the sites saved in this browser, or start a new one.</p>
      <ul class="project-list"></ul>
      <div class="dialog-buttons">
        <button class="new-project">+ New site</button>
        <button class="primary close">Done</button>
      </div>
    </div>`
  const listEl = backdrop.querySelector('.project-list')

  function close() { backdrop.remove() }

  for (const p of projects) {
    const li = document.createElement('li')
    if (store.project && p.id === store.project.id) li.className = 'is-current'
    const name = document.createElement('span')
    name.className = 'proj-name'
    const when = new Date(p.updatedAt)
    name.textContent = `${p.name}  ·  ${p.fileCount} files`
    name.title = 'Open this site'
    name.addEventListener('click', async () => { close(); await switchToProject(p.id) })
    li.appendChild(name)

    const del = document.createElement('button')
    del.textContent = '🗑'
    del.title = 'Delete this site'
    del.addEventListener('click', async (e) => {
      e.stopPropagation()
      const ok = await confirmDialog({
        title: `Delete "${p.name}"?`,
        message: 'This permanently removes the site from this browser. Export it first if you want to keep it.',
        confirmLabel: 'Delete',
        danger: true,
      })
      if (!ok) return
      await deleteProject(p.id)
      li.remove()
      // If we deleted the open project, load another or make a fresh one.
      if (store.project && store.project.id === p.id) {
        const rest = await listProjects()
        if (rest.length) await switchToProject(rest[0].id)
        else { close(); await createProject() }
      }
    })
    li.appendChild(del)
    listEl.appendChild(li)
  }

  if (!projects.length) {
    const empty = document.createElement('li')
    empty.textContent = 'No saved sites yet.'
    listEl.appendChild(empty)
  }

  backdrop.querySelector('.new-project').addEventListener('click', async () => { close(); await createProject() })
  backdrop.querySelector('.close').addEventListener('click', close)
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close() })
  document.body.appendChild(backdrop)
}
