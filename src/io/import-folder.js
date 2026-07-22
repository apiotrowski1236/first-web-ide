// @ts-check
import { makeFile, makeId } from '../store/model.js'
import { isBinary, basename } from '../util/paths.js'

/**
 * Import a site folder from the student's computer into a new in-browser
 * project. Two entry points: a folder <input> (webkitdirectory) and drag-drop.
 */

const SKIP = /(^|\/)(\.DS_Store|Thumbs\.db|\.git(\/|$))/

/** Read one File into a FileRecord at `path`. */
async function fileToRecord(path, file) {
  if (isBinary(path)) {
    return makeFile(path, file) // File is a Blob; store as-is
  }
  const text = await file.text()
  return makeFile(path, text)
}

/** Build a project object from a map of path -> File. */
async function buildProject(name, fileMap) {
  /** @type {Record<string, any>} */
  const files = {}
  for (const [path, file] of fileMap) {
    if (SKIP.test(path)) continue
    files[path] = await fileToRecord(path, file)
  }
  const now = Date.now()
  return { id: makeId(), name: name || 'imported-site', files, createdAt: now, updatedAt: now }
}

/**
 * Import from a folder <input type="file" webkitdirectory>.
 * @param {FileList} fileList
 * @returns {Promise<object|null>} the new project, or null if empty
 */
export async function importFromFileList(fileList) {
  const files = Array.from(fileList)
  if (!files.length) return null
  // webkitRelativePath looks like "my-site/css/style.css" — strip the top folder.
  let topFolder = ''
  const rel = files[0].webkitRelativePath
  if (rel && rel.includes('/')) topFolder = rel.split('/')[0]

  const map = new Map()
  for (const f of files) {
    const full = f.webkitRelativePath || f.name
    const path = topFolder && full.startsWith(topFolder + '/') ? full.slice(topFolder.length + 1) : full
    if (path) map.set(path, f)
  }
  return buildProject(topFolder || 'imported-site', map)
}

/**
 * Import from a drag-and-drop of a folder or files.
 * @param {DataTransferItemList} items
 */
export async function importFromDataTransfer(items) {
  /** @type {Map<string, File>} */
  const map = new Map()
  const entries = []
  for (const item of items) {
    const entry = item.webkitGetAsEntry && item.webkitGetAsEntry()
    if (entry) entries.push(entry)
  }
  let topFolder = entries.length === 1 && entries[0].isDirectory ? entries[0].name : ''
  for (const entry of entries) {
    await walkEntry(entry, '', map, topFolder)
  }
  if (!map.size) return null
  return buildProject(topFolder || 'imported-site', map)
}

/** Recursively collect files from a dropped directory entry. */
function walkEntry(entry, prefix, map, topFolder) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        let path = prefix ? prefix + '/' + entry.name : entry.name
        if (topFolder && path.startsWith(topFolder + '/')) path = path.slice(topFolder.length + 1)
        else if (topFolder && path === topFolder) { resolve(); return }
        map.set(path, file)
        resolve()
      }, () => resolve())
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const all = []
      const readBatch = () => reader.readEntries(async (batch) => {
        if (!batch.length) {
          await Promise.all(all.map((e) => walkEntry(e, prefix ? prefix + '/' + entry.name : entry.name, map, topFolder)))
          resolve()
        } else {
          all.push(...batch)
          readBatch()
        }
      }, () => resolve())
      readBatch()
    } else {
      resolve()
    }
  })
}
