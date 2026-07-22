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
