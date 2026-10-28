// @ts-check

/* ------------------------------------------------------------------------- *
 *  FRIENDLY ERROR MESSAGES  —  the teacher-editable file
 * ------------------------------------------------------------------------- *
 *  Every entry maps a rule id to a function that returns a friendly message:
 *      { title, body, fix }
 *  - `title` is the short headline shown in bold.
 *  - `body`  explains what's wrong in plain language.
 *  - `fix`   is a concrete "try this" suggestion (optional).
 *
 *  Wrap code in `backticks` — they render as little code chips.
 *  The `ctx` object carries details pulled from the error (tag name, property,
 *  a spelling suggestion, the line number, etc). You can reword any message
 *  here without touching the linting logic.
 * ------------------------------------------------------------------------- */

export const MESSAGES = {
  // ---------------- HTML ----------------
  'tag-pair': (ctx) => ({
    title: `Your \`<${ctx.tag}>\` tag was never closed`,
    body: `Every \`<${ctx.tag}>\` needs a matching \`</${ctx.tag}>\` to show where it ends.`,
    fix: `Add \`</${ctx.tag}>\` where this element should finish.`,
  }),
  'unknown-tag': (ctx) => ({
    title: `\`<${ctx.tag}>\` isn't a real HTML tag`,
    body: ctx.suggestion
      ? `The browser won't know what \`<${ctx.tag}>\` means.`
      : `The browser will ignore \`<${ctx.tag}>\` because it isn't a standard tag.`,
    fix: ctx.suggestion ? `Did you mean \`<${ctx.suggestion}>\`?` : `Check the spelling of the tag name.`,
  }),
  'tagname-lowercase': (ctx) => ({
    title: `Write tag names in lowercase`,
    body: `HTML tags should be lowercase, so use \`<${ctx.tag}>\`, not capitals.`,
    fix: `Change it to \`<${ctx.tag}>\`.`,
  }),
  'attr-lowercase': (ctx) => ({
    title: `Write attribute names in lowercase`,
    body: `Attributes like \`${ctx.attr}\` should be all lowercase.`,
    fix: `Use \`${ctx.attr}\`.`,
  }),
  'attr-value-double-quotes': () => ({
    title: `Put quotes around this attribute value`,
    body: `Attribute values need to be wrapped in double quotes.`,
    fix: `Write it like \`href="about.html"\`.`,
  }),
  'doctype-first': () => ({
    title: `Your page is missing \`<!DOCTYPE html>\``,
    body: `The very first line tells the browser to use modern HTML rules.`,
    fix: `Make the first line \`<!DOCTYPE html>\`.`,
  }),
  'alt-require': () => ({
    title: `This image is missing its \`alt\` text`,
    body: `\`alt\` describes the picture for screen readers, and shows if the image fails to load.`,
    fix: `Add a description, like \`<img src="cat.jpg" alt="my orange cat asleep">\`.`,
  }),
  'id-unique': (ctx) => ({
    title: `The id \`${ctx.id}\` is used more than once`,
    body: `Each \`id\` must be unique on a page — two elements can't share one.`,
    fix: `Give one of them a different \`id\`, or use a \`class\` instead.`,
  }),
  'src-not-empty': () => ({
    title: `This \`src\` is empty`,
    body: `An \`<img>\` or \`<script>\` needs a real file path in its \`src\`.`,
    fix: `Point it at a file, like \`src="assets/photo.jpg"\`.`,
  }),
  'spec-char-escape': () => ({
    title: `A special character needs escaping`,
    body: `Raw \`<\` or \`>\` inside text can confuse the browser.`,
    fix: `Write \`&lt;\` for \`<\` and \`&gt;\` for \`>\`.`,
  }),
  'inline-style-disabled': (ctx) => ({
    title: `Keep your styling in your CSS file`,
    body: ctx.attr
      ? `\`${ctx.attr}\` only changes this one tag, and it's hard to find and update later. Your page is already linked to \`css/style.css\`.`
      : `A \`style\` attribute only changes this one tag, and it's hard to find and update later. Your page is already linked to \`css/style.css\`.`,
    fix: `Give the tag a \`class\`, like \`<p class="intro">\`, then write a rule in \`css/style.css\`: \`.intro { color: red; }\`.`,
  }),
  'style-disabled': () => ({
    title: `Move this \`<style>\` block into \`css/style.css\``,
    body: `Your page already loads \`css/style.css\` with the \`<link>\` tag, so CSS belongs there, not inside the HTML.`,
    fix: `Cut the rules out of \`<style>\`, paste them into \`css/style.css\`, and delete the empty \`<style></style>\` tags.`,
  }),

  // ---------------- CSS ----------------
  'css-missing-semicolon': () => ({
    title: `Looks like a missing \`;\``,
    body: `In CSS, each line inside \`{ }\` ends with a semicolon.`,
    fix: `Add \`;\` at the end of the line, like \`color: red;\`.`,
  }),
  'css-missing-brace': () => ({
    title: `A curly brace \`{ }\` doesn't match up`,
    body: `Every CSS rule opens with \`{\` and closes with \`}\`. One is missing.`,
    fix: `Check that each \`{\` has a matching \`}\`.`,
  }),
  'css-unknown-property': (ctx) => ({
    title: `\`${ctx.property}\` isn't a CSS property`,
    body: ctx.suggestion
      ? `The browser won't recognise \`${ctx.property}\`.`
      : `Double-check the property name — the browser will skip \`${ctx.property}\`.`,
    fix: ctx.suggestion ? `Did you mean \`${ctx.suggestion}\`?` : `Check the spelling.`,
  }),
  'css-bad-value': (ctx) => ({
    title: `\`${ctx.value}\` isn't a valid value for \`${ctx.property}\``,
    body: `The browser will ignore this line because it can't understand the value.`,
    fix: ctx.suggestion
      ? `Did you mean \`${ctx.suggestion}\`?`
      : ctx.property === 'color' || /color/.test(ctx.property)
        ? `Try a color name like \`blue\`, or a hex code like \`#0000ff\`.`
        : `Check the value — it may need units like \`px\` or \`%\`.`,
  }),
  'css-parse': (ctx) => ({
    title: `Something in your CSS confused the browser`,
    body: ctx.reason || `There's a small syntax problem near here.`,
    fix: `Check for a missing \`;\`, \`}\`, or \`:\` nearby.`,
  }),

  // ---------------- JavaScript (static) ----------------
  'js-syntax': (ctx) => ({
    title: `JavaScript syntax problem`,
    body: ctx.reason || `The browser can't finish reading your code here.`,
    fix: `Check for a missing \`)\`, \`}\`, \`]\` or quote just before this spot.`,
  }),
  'js-assign-in-if': () => ({
    title: `You used \`=\` where you probably meant \`===\``,
    body: `A single \`=\` *sets* a value; to *compare* two values, use \`===\`.`,
    fix: `Change it to \`===\`, like \`if (score === 10)\`.`,
  }),

  // ---------------- JavaScript (runtime) ----------------
  'js-reference-error': (ctx) => ({
    title: `\`${ctx.name}\` hasn't been created`,
    body: `The browser reached \`${ctx.name}\`${ctx.line ? ` on line ${ctx.line}` : ''} but nothing with that name exists yet.`,
    fix: ctx.suggestion
      ? `Did you mean \`${ctx.suggestion}\`? Check the spelling, and that you declared it with \`let\` or \`const\`.`
      : `Check the spelling, and make sure you created it with \`let\` or \`const\` first.`,
  }),
  'js-null-property': (ctx) => ({
    title: `\`${ctx.member ? '.' + ctx.member : 'that'}\` was used on something empty (\`null\`)`,
    body: `\`document.querySelector(...)\`${ctx.line ? ` on line ${ctx.line}` : ''} didn't find a matching element, so it gave back \`null\`.`,
    fix: `Check that your HTML has an element matching the selector, and that your \`<script>\` runs after it (put it at the end of \`<body>\`).`,
  }),
  'js-not-a-function': (ctx) => ({
    title: `\`${ctx.name || 'That'}\` isn't a function`,
    body: `You tried to call \`${ctx.name || 'it'}()\`${ctx.line ? ` on line ${ctx.line}` : ''}, but it isn't a function.`,
    fix: `Check the spelling of the function name, and that you defined it.`,
  }),
  'js-syntax-runtime': (ctx) => ({
    title: `JavaScript syntax error`,
    body: ctx.raw || `The browser couldn't finish reading your JavaScript.`,
    fix: `Look for a missing bracket, brace or quote${ctx.line ? ` near line ${ctx.line}` : ''}.`,
  }),
  'js-generic': (ctx) => ({
    title: ctx.name ? `${ctx.name}` : `Something went wrong while your page ran`,
    body: ctx.raw || '',
    fix: '',
  }),
}

/**
 * Look up a friendly message, falling back to the raw text if a rule has no
 * template yet.
 * @param {string} ruleId
 * @param {Record<string, any>} ctx
 * @returns {{title:string, body:string, fix:string}}
 */
export function getMessage(ruleId, ctx = {}) {
  const fn = MESSAGES[ruleId]
  if (fn) {
    const m = fn(ctx)
    return { title: m.title || '', body: m.body || '', fix: m.fix || '' }
  }
  return { title: ctx.raw || 'Problem', body: '', fix: '' }
}
