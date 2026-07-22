// @ts-check

/**
 * Classic Levenshtein edit distance. Small inputs only (identifier/keyword
 * length), so the simple O(n*m) DP is plenty fast.
 * @param {string} a
 * @param {string} b
 */
export function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let cur = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[b.length]
}

/**
 * Return the closest candidate to `word` within a small edit distance,
 * or null if nothing is close enough. Used for "did you mean…?" hints.
 * @param {string} word
 * @param {string[]} candidates
 * @param {number} [maxDistance]
 */
export function closest(word, candidates, maxDistance = 2) {
  if (!word) return null
  const w = word.toLowerCase()
  let best = null
  let bestDist = Infinity
  for (const c of candidates) {
    if (c === w) return null // exact match: nothing to suggest
    const d = levenshtein(w, c.toLowerCase())
    if (d < bestDist) { bestDist = d; best = c }
  }
  // Scale the tolerance a little for longer words but keep it tight.
  const limit = Math.min(maxDistance, Math.max(1, Math.floor(w.length / 3)))
  return best !== null && bestDist <= limit ? best : null
}
