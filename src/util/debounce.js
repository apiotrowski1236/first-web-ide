// @ts-check

/**
 * Return a debounced version of `fn` that runs after `wait` ms of quiet.
 * @param {(...args: any[]) => void} fn
 * @param {number} wait
 */
export function debounce(fn, wait) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let t
  const wrapped = (/** @type {any[]} */ ...args) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
  wrapped.cancel = () => { if (t) clearTimeout(t) }
  return wrapped
}
