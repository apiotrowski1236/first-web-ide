// @ts-check
import { openDB } from 'idb'

/**
 * IndexedDB persistence. One object store keyed by project id; the whole
 * project (including file blobs) is stored as a single record. Simple and
 * robust — good enough for classroom-sized sites.
 */

const DB_NAME = 'indie-web-ide'
const DB_VERSION = 1
const STORE = 'projects'
const META = 'meta'

let dbPromise = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(META)) {
          database.createObjectStore(META)
        }
      },
    })
  }
  return dbPromise
}

/** Save (or overwrite) a whole project. */
export async function saveProject(project) {
  const record = {
    id: project.id,
    name: project.name,
    files: project.files,
    createdAt: project.createdAt,
    updatedAt: Date.now(),
  }
  await (await db()).put(STORE, record)
  return record.updatedAt
}

/** Load one project by id, or undefined. */
export async function loadProject(id) {
  return (await db()).get(STORE, id)
}

/** List projects as lightweight summaries (no file contents), newest first. */
export async function listProjects() {
  const all = await (await db()).getAll(STORE)
  return all
    .map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, fileCount: Object.keys(p.files || {}).length }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function deleteProject(id) {
  await (await db()).delete(STORE, id)
}

/** Remember which project was open last, so we can reopen it. */
export async function setLastOpened(id) {
  await (await db()).put(META, id, 'lastOpened')
}
export async function getLastOpened() {
  return (await db()).get(META, 'lastOpened')
}
