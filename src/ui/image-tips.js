// @ts-check
import { infoDialog } from './dialogs.js'

/**
 * After a student adds a picture, show a short CSS cheat-sheet: how to resize,
 * center and frame it. Built from DOM nodes (not innerHTML) so the file path
 * can be dropped in safely.
 */

/**
 * @param {string} path  the image path that was just added, e.g. "images/cat.jpg"
 * @param {number} count how many pictures were added in this batch
 */
export function showImageTips(path, count = 1) {
  const body = document.createElement('div')
  body.className = 'tips'

  const intro = document.createElement('p')
  intro.append(
    count > 1 ? `Your pictures are in the images folder. ` : `Your picture is saved as `,
  )
  if (count === 1) { const c = document.createElement('code'); c.textContent = path; intro.append(c, '. ') }
  intro.append('Put it on a page with this HTML, then style it in css/style.css:')
  body.appendChild(intro)
  body.appendChild(codeBlock(`<img src="${path}" alt="Describe the picture" class="photo" />`))

  body.appendChild(tip('Resize it', 'Set a width and let the height follow so it never stretches.',
`.photo {
  width: 300px;       /* how wide, in pixels (or try 50%) */
  height: auto;       /* keeps the picture's shape */
  max-width: 100%;    /* never wider than the page */
}`))

  body.appendChild(tip('Center it', 'Pictures sit in a line of text by default. Make it a block, then use auto margins.',
`.photo {
  display: block;
  margin: 0 auto;     /* "auto" on left and right = centered */
}`))

  body.appendChild(tip('Add a border', 'Thickness, style and color — then optionally round the corners.',
`.photo {
  border: 4px solid gold;
  border-radius: 12px;  /* rounded corners (optional) */
  padding: 4px;         /* gap between picture and border (optional) */
}`))

  const note = document.createElement('p')
  note.className = 'tips-note'
  note.append('Tip: ', el('code', '.photo'), ' only styles pictures with ', el('code', 'class="photo"'),
    '. Use ', el('code', 'img'), ' instead of ', el('code', '.photo'), ' to style every picture on your site.')
  body.appendChild(note)

  return infoDialog({ title: count > 1 ? 'Pictures added! Here’s how to style them' : 'Picture added! Here’s how to style it', body })
}

function tip(heading, text, code) {
  const wrap = document.createElement('section')
  wrap.className = 'tip'
  const h = document.createElement('h3'); h.textContent = heading
  const p = document.createElement('p'); p.textContent = text
  wrap.append(h, p, codeBlock(code))
  return wrap
}

function codeBlock(text) {
  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.textContent = text
  pre.appendChild(code)
  return pre
}

function el(tag, text) { const e = document.createElement(tag); e.textContent = text; return e }
