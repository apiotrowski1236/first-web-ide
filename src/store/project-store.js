// @ts-check
import { makeFile, isBinary } from './model.js'
import { basename } from '../util/paths.js'

/**
 * The single source of truth for the open project. Everything else (editor,
 * preview, panels) is a view that listens for events and reads from here.
 *
 * Events: 'project:load', 'files:change' (structure add/remove/rename),
 * 'file:change' (content of one file), 'active:change', 'dirty:change'.
 */
class ProjectStore {
  constructor() {
    /** @type {import('./model.js').ProjectData | null} */
    this.project = null
    /** @type {string | null} */
    this.activePath = null
    /** @type {Set<string>} paths with unsaved-to-DB edits */
    this.dirty = new Set()
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map()
  }

  /** @param {string} event @param {Function} fn */
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event).add(fn)
    return () => this._listeners.get(event)?.delete(fn)
  }

  /** @param {string} event @param {any} [payload] */
  emit(event, payload) {
    this._listeners.get(event)?.forEach((fn) => fn(payload))
  }

  /** Replace the whole project and announce it. */
  load(project) {
    this.project = project
    this.dirty.clear()
    const first = this.htmlPages()[0] || Object.keys(project.files)[0] || null
    this.activePath = first
    this.emit('project:load', project)
    this.emit('active:change', this.activePath)
  }

  get name() { return this.project?.name || 'untitled' }

  /** All file paths, folders-first-ish sorted for display. */
  paths() {
    return Object.keys(this.project?.files || {}).sort()
  }

  /** Only the editable html pages, index.html first if present. */
  htmlPages() {
    const pages = this.paths().filter((p) => p.endsWith('.html') || p.endsWith('.htm'))
    pages.sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))
    return pages
  }

  getFile(path) { return this.project?.files[path] }
  files() { return this.project?.files || {} }

  /** Update text content of an existing file (from the editor). */
  setContent(path, content) {
    const f = this.getFile(path)
    if (!f || isBinary(path)) return
    if (f.content === content) return
    f.content = content
    this.dirty.add(path)
    this.emit('file:change', path)
    this.emit('dirty:change')
  }

  isDirty(path) { return this.dirty.has(path) }
  anyDirty() { return this.dirty.size > 0 }
  markSaved() { this.dirty.clear(); this.emit('dirty:change') }

  /** Add a new file. Returns the created path or throws if it exists. */
  addFile(path, content = '') {
    if (!this.project) throw new Error('No project open')
    if (this.project.files[path]) throw new Error('A file with that name already exists.')
    this.project.files[path] = makeFile(path, content)
    this.dirty.add(path)
    this.emit('files:change')
    this.emit('dirty:change')
    return path
  }

  removeFile(path) {
    if (!this.project?.files[path]) return
    delete this.project.files[path]
    this.dirty.add('*deleted*')
    if (this.activePath === path) {
      this.activePath = this.htmlPages()[0] || this.paths()[0] || null
      this.emit('active:change', this.activePath)
    }
    this.emit('files:change')
    this.emit('dirty:change')
  }

  /** Rename/move a file to a new path. */
  renameFile(oldPath, newPath) {
    if (!this.project?.files[oldPath]) return
    if (this.project.files[newPath]) throw new Error('A file with that name already exists.')
    const rec = this.project.files[oldPath]
    delete this.project.files[oldPath]
    rec.path = newPath
    rec.language = makeFile(newPath, '').language
    this.project.files[newPath] = rec
    this.dirty.add(newPath)
    if (this.activePath === oldPath) this.activePath = newPath
    this.emit('files:change')
    this.emit('active:change', this.activePath)
    this.emit('dirty:change')
  }

  setActive(path) {
    if (path === this.activePath) return
    if (!this.project?.files[path]) return
    this.activePath = path
    this.emit('active:change', path)
  }

  /** Human label for a path (just the basename). */
  label(path) { return basename(path) }
}

export const store = new ProjectStore()
