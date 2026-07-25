import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

// Matches a bracket pair starting at the very beginning of the name, e.g.
// "(Counter).wav" or "(Creep) - D#.wav", but not "REESE Fuzzy (C).wav" since
// the bracket isn't at position 0.
const LEADING_BRACKET_RE = /^\((?<inner>[^\)]*)\)/v;

export const stripLeadingBracket: StringTransformer = (name: string): string =>
  name.replace(LEADING_BRACKET_RE, "$<inner>");

const _singleton: Transform =
  createSanitiseNameTransformer(stripLeadingBracket);
export const createStripLeadingBracketTransformer = (): Transform => _singleton;

/**
 * StripLeadingBracketTransformer
 * Removes a bracket pair that wraps the very start of a name, which is left
 * behind after a shared word (e.g. "Snare", "Kick") is stripped as a common
 * prefix from files like "Snare (Counter).wav" -> "(Counter).wav".
 * e.g. "(Counter).wav" -> "Counter.wav"
 *      "(Creep) - D#.wav" -> "Creep - D#.wav"
 * Brackets elsewhere in the name (not at position 0) are left untouched,
 * e.g. "REESE Fuzzy (C).wav" is unaffected.
 */
