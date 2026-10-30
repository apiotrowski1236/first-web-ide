// @ts-check
import { languageOf, isBinary } from '../util/paths.js'

/**
 * @typedef {Object} FileRecord
 * @property {string} path      normalized project-relative path, e.g. "css/style.css"
 * @property {string|Blob} content  text for code files, Blob for binary assets
 * @property {string} language  'html' | 'css' | 'javascript' | 'image' | 'audio' | 'text'
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

/** Files for a fresh project — a tiny working page with a stylesheet and a script. */
export function starterFiles() {
  // A very simple starter page: one heading, one paragraph, one button that
  // calls a function in js/script.js, one image, one sound.
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
    <!-- A button. "onclick" says which JavaScript function to run when it is clicked. -->
    <button onclick="haveConvo()">Click me</button>
    <!-- An image. "src" is which file to show; "alt" describes it in words. -->
    <img src="images/sample.svg" alt="A colorful drawing of a sun over green hills" />
    <!-- A sound. "controls" adds a play button; "src" is which sound file to play. -->
    <audio controls src="audio/sample.wav"></audio>
    <!-- Connects this page to the JavaScript file. It goes at the end of <body>
         so the page is fully built before the script runs. -->
    <script src="js/script.js"></script>
  </body>
</html>
`
  // The stylesheet. We start with named CSS colors (like "aliceblue") instead
  // of color codes so students can read what each one means.
  const css = `/* This file controls how your page looks. */

/* "body" styles the whole visible page. */
body {
  background-color: aliceblue; /* A pale blue background (a named color!). */
  color: midnightblue;         /* Deep blue text that is easy to read on it. */
  font-family: sans-serif;     /* A clean, easy-to-read font. */
  max-width: 40rem;            /* Keeps lines of text from getting too wide. */
  margin: 2rem auto;           /* Centers the page with space above and below. */
  padding: 0 1rem;             /* A little breathing room on the sides. */
  line-height: 1.6;            /* Extra space between lines for easier reading. */
}

/* "h1" styles the big heading. */
h1 {
  color: steelblue; /* A slightly brighter blue for the heading. */
}

/* "button" styles the button on the page. */
button {
  font-size: 1.2rem;              /* Big enough to read and tap easily. */
  padding: 0.5rem 1.5rem;         /* Space inside the button around the words. */
  background-color: steelblue;    /* Matches the heading. */
  color: white;                   /* White words on the blue button. */
  border: none;                   /* No outline around the button. */
  border-radius: 0.5rem;          /* Rounded corners. */
  cursor: pointer;                /* Shows a hand pointer when you hover over it. */
}

/* "img" styles the pictures on your page. */
img {
  display: block;              /* Puts the picture on its own line. */
  max-width: 100%;             /* Makes sure the image never spills off the page. */
  margin-top: 1rem;            /* A little space above the picture. */
  border: 4px solid steelblue; /* A blue frame around the picture. */
}
`
  // The JavaScript file. One small function that the button on the page calls.
  const js = `// This file makes your page do things when people interact with it.

// A "function" is a named set of instructions. This one runs when the
// button on the page is clicked (see onclick="haveConvo()" in index.html).
function haveConvo() {
  // alert() pops up a small message box in the browser.
  window.alert("Hello from JavaScript!");
  // prompt() opens up the same message box, but this time the user can respond
  // and if the programmer uses a variable, the programmer can store their response.
  let feeling = window.prompt("How have you been feeling lately?");
  let explanation = window.prompt("What's been making you feel " + feeling + "?");
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
    'js/script.js': makeFile('js/script.js', js),
    'images/sample.svg': makeFile('images/sample.svg', sampleImage),
    // A tiny sample sound lives in audio/ so the folder exists from day one.
    'audio/sample.wav': makeFile('audio/sample.wav', makeSampleSound()),
  }
}

/**
 * Build a very short "ding" as a WAV file in memory (mono, 8-bit, 8000 Hz,
 * about 0.4 s, ~3 KB). Generating it here means no binary file has to be
 * committed to the repo. Returns a Blob, which is how binary assets are stored.
 */
export function makeSampleSound() {
  const sampleRate = 8000
  const seconds = 0.4
  const n = Math.round(sampleRate * seconds)
  const bytes = new Uint8Array(44 + n)
  const view = new DataView(bytes.buffer)
  const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) bytes[off + i] = str.charCodeAt(i) }

  // RIFF/WAVE header (44 bytes, little-endian).
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + n, true)       // file size minus the first 8 bytes
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)          // fmt chunk size
  view.setUint16(20, 1, true)           // PCM
  view.setUint16(22, 1, true)           // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)  // byte rate = sampleRate * 1 channel * 1 byte
  view.setUint16(32, 1, true)           // block align
  view.setUint16(34, 8, true)           // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, n, true)

  // Samples: a soft A5 (880 Hz) tone that fades out, centred on 128 (8-bit unsigned).
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const fade = Math.exp(-6 * t)
    bytes[44 + i] = Math.round(128 + 100 * fade * Math.sin(2 * Math.PI * 880 * t))
  }
  return new Blob([bytes], { type: 'audio/wav' })
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
