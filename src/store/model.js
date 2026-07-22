// @ts-check
import { languageOf, isBinary } from '../util/paths.js'

/**
 * @typedef {Object} FileRecord
 * @property {string} path      normalized project-relative path, e.g. "css/style.css"
 * @property {string|Blob} content  text for code files, Blob for binary assets
 * @property {string} language  'html' | 'css' | 'javascript' | 'image' | 'text'
 */

/**
 * @typedef {Object} ProjectData
 * @property {string} id
 * @property {string} name
 * @property {Record<string, FileRecord>} files  keyed by path
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/** Make a FileRecord, inferring language from the path. */
export function makeFile(path, content) {
  return { path, content, language: languageOf(path) }
}

/** A short, non-random id (Math.random is unavailable in some sandboxes). */
let idCounter = 0
export function makeId() {
  idCounter += 1
  return 'p' + Date.now().toString(36) + '-' + idCounter.toString(36)
}

/** Files for a fresh project — a tiny working indie-web page. */
export function starterFiles() {
  // A very simple starter page: one heading, one paragraph, one image.
  // Every line has a comment explaining what it does.
  const html = `<!DOCTYPE html>
<!-- Tells the browser this is a modern (HTML5) web page. -->
<html lang="en">
  <!-- <head> holds information about the page that you don't see directly. -->
  <head>
    <!-- Lets the page use any letter, symbol or emoji. -->
    <meta charset="UTF-8" />
    <!-- Makes the page look right on phones as well as computers. -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- The words shown in the browser tab. -->
    <title>My Web Page</title>
    <!-- Connects this page to the stylesheet that gives it its colors. -->
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <!-- <body> holds everything you can actually see on the page. -->
  <body>
    <!-- A big heading at the top of the page. -->
    <h1>Welcome to My Web Page</h1>
    <!-- A paragraph of text. Change these words and watch the preview update! -->
    <p>This is my very own corner of the web. I made it by hand.</p>
    <!-- An image. "src" is which file to show; "alt" describes it in words. -->
    <img src="images/sample.svg" alt="A colorful drawing of a sun over green hills" />
  </body>
</html>
`
  // The stylesheet. We start with named CSS colors (like "gold") instead of
  // color codes, and a bold background + text color to make the page pop.
  const css = `/* This file controls how your page looks. */

/* "body" styles the whole visible page. */
body {
  background-color: midnightblue; /* A bold, deep blue background (a named color!). */
  color: gold;                    /* Bright gold text so it stands out. */
  font-family: sans-serif;        /* A clean, easy-to-read font. */
  max-width: 40rem;               /* Keeps lines of text from getting too wide. */
  margin: 2rem auto;              /* Centers the page with space above and below. */
  padding: 0 1rem;                /* A little breathing room on the sides. */
  line-height: 1.6;               /* Extra space between lines for easier reading. */
}

/* "h1" styles the big heading. */
h1 {
  color: gold; /* Keep the heading gold to match the rest of the text. */
}

/* "img" styles the pictures on your page. */
img {
  max-width: 100%;        /* Makes sure the image never spills off the page. */
  border: 4px solid gold; /* A gold frame around the picture. */
}
`
  // A sample image lives in the images/ folder so the page has something to
  // show. It's an SVG drawing so it stays small and can be tweaked later.
  const sampleImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="skyblue" />
  <circle cx="320" cy="70" r="45" fill="gold" />
  <polygon points="0,300 140,150 280,300" fill="seagreen" />
  <polygon points="150,300 300,130 450,300" fill="forestgreen" />
</svg>
`
  return {
    'index.html': makeFile('index.html', html),
    'css/style.css': makeFile('css/style.css', css),
    'images/sample.svg': makeFile('images/sample.svg', sampleImage),
  }
}

/** Build a brand-new project object. */
export function newProject(name = 'my-site') {
  const now = Date.now()
  return {
    id: makeId(),
    name,
    files: starterFiles(),
    createdAt: now,
    updatedAt: now,
  }
}

export { isBinary }
