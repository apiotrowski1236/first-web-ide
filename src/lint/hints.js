// @ts-check
import { closest } from '../util/levenshtein.js'
import { HTML_TAGS, NAMED_COLORS, CSS_PROPERTIES } from './dictionaries.js'

/**
 * "Did you mean…?" helpers. Each returns a suggested correct spelling, or null.
 */

export function suggestTag(name) {
  return closest(name, [...HTML_TAGS], 2)
}

export function suggestProperty(name) {
  return closest(name, CSS_PROPERTIES, 2)
}

export function suggestColor(value) {
  return closest(value, [...NAMED_COLORS], 2)
}

/**
 * Suggest a correction for an unknown identifier against names actually used
 * in the file plus common globals.
 * @param {string} name
 * @param {string[]} knownNames
 */
export function suggestIdentifier(name, knownNames) {
  return closest(name, knownNames, 2)
}
