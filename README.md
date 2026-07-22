# Indie Web IDE

A simple, Safari-friendly HTML / CSS / JavaScript editor for beginning high-school frontend devlopers. 
## What it does

- **Edit** HTML, CSS, and basic JavaScript with syntax highlighting and
  *structural* completion (auto-closes tags, suggests real tag/property names —
  no AI, no word-guessing).
- **Live preview** updates as you type. Multi-page sites work: `index.html`,
  `about.html`, `css/style.css`, `script.js`, and images in `assets/` all resolve,
  and links between pages navigate inside the preview.
- **Friendly errors** appear inline (underlines + gutter marks) and in a
  **Problems** panel — unclosed tags, missing `alt`, missing `<!DOCTYPE>`, CSS
  typos and bad values, and JavaScript runtime errors (with "did you mean…?"
  spelling hints and correct line numbers) in the **Console** panel.
- **Saves automatically** in the browser (IndexedDB) — work survives closing the
  tab. Multiple named sites via the **Projects** menu.
- **Import** an existing site folder; **Export** the whole site as a `.zip` that
  drops straight into a static web serveruploader.

## Built for Safari on Macs

Safari does not support the File System Access API that Phoenix Code uses to save
to a real folder, so this tool never touches it. Instead, projects live in the
browser's IndexedDB and move in/out via folder-import and zip-export. The same
code path works in Chrome, Edge, and Firefox too.

> **Keep student work safe:** browser storage can be cleared if a site is unused
> for a long time (Safari is stricter here). The app asks to keep storage
> persistent and warns if the browser declines. Teach students to **Export .zip**
> regularly — that's the real backup.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview  # preview the production build
```

Requires Node 18+.

## Deploy (static hosting)

`npm run build` produces a fully static site in `dist/`. 
`vite.config.js` sets `base: './'`
so it works from a sub-path.

## How it's built

- **Vanilla JS + ES modules** (JSDoc types, no framework) for longevity.
- **CodeMirror 6** editor.
- **css-tree** + **HTMLHint** power the linters; **fflate** zips exports;
  **idb** wraps IndexedDB.
- The preview assembles a self-contained document (inline CSS, `data:`-URL
  scripts/images) rendered via the iframe's `srcdoc`, sandboxed without
  `allow-same-origin` so student code stays isolated.

### Where things live

| Area | Files |
|---|---|
| Friendly messages (edit these to change wording) | `src/lint/messages.js` |
| Linters | `src/lint/html-lint.js`, `css-lint.js`, `js-lint.js`, `js-runtime.js` |
| Preview assembly | `src/preview/resolve.js`, `preview.js` |
| Project store + autosave | `src/store/` |
| Editor | `src/editor/` |
| Panels / UI | `src/panels/`, `src/ui/` |

## Editing the error messages

All student-facing wording lives in one file: **`src/lint/messages.js`**. Each
entry returns a `{ title, body, fix }`; wrap code in `` `backticks` `` to get code
chips. Reword anything there without touching the linting logic.
