// @ts-check

/**
 * Tiny promise-based modal dialogs. Kept dependency-free and simple.
 */

function makeBackdrop() {
  const backdrop = document.createElement('div')
  backdrop.className = 'dialog-backdrop'
  return backdrop
}

/**
 * Ask for a line of text with live validation.
 * @param {{title:string, message?:string, initial?:string, placeholder?:string,
 *          confirmLabel?:string, validate?:(v:string)=>string}} opts
 * @returns {Promise<string|null>} trimmed value, or null if cancelled
 */
export function promptText(opts) {
  return new Promise((resolve) => {
    const backdrop = makeBackdrop()
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2></h2>
        <p></p>
        <input type="text" />
        <div class="dialog-error"></div>
        <div class="dialog-buttons">
          <button class="cancel">Cancel</button>
          <button class="primary confirm"></button>
        </div>
      </div>`
    const dlg = backdrop.querySelector('.dialog')
    dlg.querySelector('h2').textContent = opts.title
    const msg = dlg.querySelector('p')
    if (opts.message) msg.textContent = opts.message; else msg.remove()
    const input = /** @type {HTMLInputElement} */ (dlg.querySelector('input'))
    input.value = opts.initial || ''
    input.placeholder = opts.placeholder || ''
    const errEl = dlg.querySelector('.dialog-error')
    const confirmBtn = /** @type {HTMLButtonElement} */ (dlg.querySelector('.confirm'))
    confirmBtn.textContent = opts.confirmLabel || 'OK'

    function validate() {
      const v = input.value.trim()
      const err = opts.validate ? opts.validate(v) : (v ? '' : 'Required.')
      errEl.textContent = err
      confirmBtn.disabled = !!err
      return !err
    }
    function close(result) { backdrop.remove(); document.removeEventListener('keydown', onKey); resolve(result) }
    function onKey(e) {
      if (e.key === 'Escape') close(null)
      if (e.key === 'Enter' && validate()) close(input.value.trim())
    }

    input.addEventListener('input', validate)
    dlg.querySelector('.cancel').addEventListener('click', () => close(null))
    confirmBtn.addEventListener('click', () => { if (validate()) close(input.value.trim()) })
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(null) })
    document.addEventListener('keydown', onKey)

    document.body.appendChild(backdrop)
    validate()
    input.focus()
    input.select()
  })
}

/**
 * Confirm / cancel dialog.
 * @param {{title:string, message?:string, confirmLabel?:string, danger?:boolean}} opts
 * @returns {Promise<boolean>}
 */
export function confirmDialog(opts) {
  return new Promise((resolve) => {
    const backdrop = makeBackdrop()
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2></h2>
        <p></p>
        <div class="dialog-buttons">
          <button class="cancel">Cancel</button>
          <button class="primary confirm"></button>
        </div>
      </div>`
    const dlg = backdrop.querySelector('.dialog')
    dlg.querySelector('h2').textContent = opts.title
    const msg = dlg.querySelector('p')
    if (opts.message) msg.textContent = opts.message; else msg.remove()
    const confirmBtn = /** @type {HTMLButtonElement} */ (dlg.querySelector('.confirm'))
    confirmBtn.textContent = opts.confirmLabel || 'OK'
    if (opts.danger) confirmBtn.style.background = 'var(--danger)'
    function close(result) { backdrop.remove(); document.removeEventListener('keydown', onKey); resolve(result) }
    function onKey(e) { if (e.key === 'Escape') close(false); if (e.key === 'Enter') close(true) }
    dlg.querySelector('.cancel').addEventListener('click', () => close(false))
    confirmBtn.addEventListener('click', () => close(true))
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(false) })
    document.addEventListener('keydown', onKey)
    document.body.appendChild(backdrop)
    confirmBtn.focus()
  })
}

/**
 * Show a message that may include rich content (headings, code samples).
 * `body` is a DOM node we built ourselves — never raw student text.
 * @param {{title:string, body:HTMLElement, confirmLabel?:string}} opts
 * @returns {Promise<void>}
 */
export function infoDialog(opts) {
  return new Promise((resolve) => {
    const backdrop = makeBackdrop()
    backdrop.innerHTML = `
      <div class="dialog dialog-wide" role="dialog" aria-modal="true">
        <h2></h2>
        <div class="dialog-body"></div>
        <div class="dialog-buttons">
          <button class="primary confirm"></button>
        </div>
      </div>`
    const dlg = backdrop.querySelector('.dialog')
    dlg.querySelector('h2').textContent = opts.title
    dlg.querySelector('.dialog-body').appendChild(opts.body)
    const confirmBtn = /** @type {HTMLButtonElement} */ (dlg.querySelector('.confirm'))
    confirmBtn.textContent = opts.confirmLabel || 'Got it'
    function close() { backdrop.remove(); document.removeEventListener('keydown', onKey); resolve() }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter') close() }
    confirmBtn.addEventListener('click', close)
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close() })
    document.addEventListener('keydown', onKey)
    document.body.appendChild(backdrop)
    confirmBtn.focus()
  })
}

const NEW_FOLDER = '__new__'
const TOP_LEVEL = '__root__'

/**
 * Ask where a new file goes (an existing folder, a brand-new folder, or the
 * top level) and what to call it.
 * @param {{folders:string[], validateFolder:(v:string)=>string,
 *          validateName:(v:string)=>string, exists:(path:string)=>boolean}} opts
 * @returns {Promise<string|null>} the full path like "css/style.css", or null
 */
export function promptNewFile(opts) {
  return new Promise((resolve) => {
    const backdrop = makeBackdrop()
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2>New file</h2>
        <p>First pick a folder for the file, then name it.</p>
        <label class="dialog-label">Folder
          <select class="folder"></select>
        </label>
        <input type="text" class="new-folder" placeholder="new folder name, like pages" hidden />
        <label class="dialog-label">File name
          <input type="text" class="file" placeholder="about.html" />
        </label>
        <div class="dialog-error"></div>
        <div class="dialog-buttons">
          <button class="cancel">Cancel</button>
          <button class="primary confirm">Create</button>
        </div>
      </div>`
    const dlg = backdrop.querySelector('.dialog')
    const select = /** @type {HTMLSelectElement} */ (dlg.querySelector('select.folder'))
    const folderInput = /** @type {HTMLInputElement} */ (dlg.querySelector('input.new-folder'))
    const nameInput = /** @type {HTMLInputElement} */ (dlg.querySelector('input.file'))
    const errEl = dlg.querySelector('.dialog-error')
    const confirmBtn = /** @type {HTMLButtonElement} */ (dlg.querySelector('.confirm'))

    const addOpt = (value, label) => {
      const o = document.createElement('option'); o.value = value; o.textContent = label; select.appendChild(o)
    }
    addOpt(NEW_FOLDER, '＋ Make a new folder…')
    for (const f of opts.folders) addOpt(f, '📁 ' + f)
    addOpt(TOP_LEVEL, 'Top level (next to index.html)')
    // Default to the first real folder so students build a tidy site.
    select.value = opts.folders[0] || NEW_FOLDER

    function folder() {
      if (select.value === NEW_FOLDER) return folderInput.value.trim().replace(/^\/+|\/+$/g, '')
      if (select.value === TOP_LEVEL) return ''
      return select.value
    }
    function fullPath() {
      const dir = folder()
      const name = nameInput.value.trim()
      return dir ? `${dir}/${name}` : name
    }
    function validate() {
      folderInput.hidden = select.value !== NEW_FOLDER
      let err = ''
      if (select.value === NEW_FOLDER) err = opts.validateFolder(folderInput.value.trim())
      if (!err) err = opts.validateName(nameInput.value.trim())
      if (!err && opts.exists(fullPath())) err = 'A file with that name already exists in that folder.'
      errEl.textContent = err
      confirmBtn.disabled = !!err
      return !err
    }
    function close(result) { backdrop.remove(); document.removeEventListener('keydown', onKey); resolve(result) }
    function onKey(e) {
      if (e.key === 'Escape') close(null)
      if (e.key === 'Enter' && validate()) close(fullPath())
    }

    select.addEventListener('change', () => {
      validate()
      if (select.value === NEW_FOLDER) folderInput.focus()
    })
    folderInput.addEventListener('input', validate)
    nameInput.addEventListener('input', validate)
    dlg.querySelector('.cancel').addEventListener('click', () => close(null))
    confirmBtn.addEventListener('click', () => { if (validate()) close(fullPath()) })
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(null) })
    document.addEventListener('keydown', onKey)

    document.body.appendChild(backdrop)
    validate()
    if (select.value === NEW_FOLDER) folderInput.focus(); else nameInput.focus()
  })
}

/**
 * Ask for several short text values at once (used for the IDE color picker).
 * Each field is validated on its own; Apply is disabled while any is invalid.
 * @param {{title:string, message?:string, confirmLabel?:string,
 *          fields: Array<{id:string, label:string, hint?:string, initial?:string, placeholder?:string}>,
 *          validate?:(v:string)=>string,
 *          onChange?:(id:string, v:string)=>void}} opts
 * @returns {Promise<Record<string,string>|null>} trimmed values by field id, or null if cancelled
 */
export function promptColors(opts) {
  return new Promise((resolve) => {
    const backdrop = makeBackdrop()
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2></h2>
        <p></p>
        <div class="dialog-fields"></div>
        <div class="dialog-error"></div>
        <div class="dialog-buttons">
          <button class="cancel">Cancel</button>
          <button class="primary confirm"></button>
        </div>
      </div>`
    const dlg = backdrop.querySelector('.dialog')
    dlg.querySelector('h2').textContent = opts.title
    const msg = dlg.querySelector('p')
    if (opts.message) msg.textContent = opts.message; else msg.remove()
    const fieldsEl = dlg.querySelector('.dialog-fields')
    const errEl = dlg.querySelector('.dialog-error')
    const confirmBtn = /** @type {HTMLButtonElement} */ (dlg.querySelector('.confirm'))
    confirmBtn.textContent = opts.confirmLabel || 'OK'

    /** @type {Map<string, HTMLInputElement>} */
    const inputs = new Map()
    for (const f of opts.fields) {
      const label = document.createElement('label')
      label.className = 'dialog-label'
      label.textContent = f.label
      const input = document.createElement('input')
      input.type = 'text'
      input.value = f.initial || ''
      input.placeholder = f.placeholder || ''
      if (f.hint) input.title = f.hint
      label.appendChild(input)
      fieldsEl.appendChild(label)
      inputs.set(f.id, input)
      input.addEventListener('input', () => {
        validate()
        if (opts.onChange) opts.onChange(f.id, input.value.trim())
      })
    }

    function values() {
      /** @type {Record<string,string>} */ const out = {}
      for (const [id, input] of inputs) out[id] = input.value.trim()
      return out
    }
    function validate() {
      let err = ''
      for (const f of opts.fields) {
        const v = inputs.get(f.id).value.trim()
        const e = opts.validate ? opts.validate(v) : ''
        if (e) { err = `${f.label}: ${e}`; break }
      }
      errEl.textContent = err
      confirmBtn.disabled = !!err
      return !err
    }
    function close(result) { backdrop.remove(); document.removeEventListener('keydown', onKey); resolve(result) }
    function onKey(e) {
      if (e.key === 'Escape') close(null)
      if (e.key === 'Enter' && validate()) close(values())
    }

    dlg.querySelector('.cancel').addEventListener('click', () => close(null))
    confirmBtn.addEventListener('click', () => { if (validate()) close(values()) })
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(null) })
    document.addEventListener('keydown', onKey)

    document.body.appendChild(backdrop)
    validate()
    const first = inputs.values().next().value
    if (first) { first.focus(); first.select() }
  })
}
