import type { Transform } from "../types";
import {
  FOLDER_LOOKUP,
  lookupPrefix,
  lookupStandalone,
  LOOP_LABELS,
  ONE_SHOT_LABELS,
  stripIgnoredSuffix,
} from "./folder_lookup";

const DASH_SEP = " - ";
const MIN_SEGMENT_WORDS = 2;
// Longest FOLDER_LOOKUP key by word count (e.g. "drum and bass", "drum n bass").
const MAX_KEY_WORDS = 3;

function resolveStandaloneType(nameLower: string): string | undefined {
  const standalone = lookupStandalone(nameLower);
  if (standalone !== undefined) return standalone;
  const loopSuffix = LOOP_LABELS.map((l) => ` ${l}`).find((s) =>
    nameLower.endsWith(s),
  );
  if (loopSuffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -loopSuffix.length));
    if (prefix !== undefined) return `${prefix} Loops`;
  }
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) =>
    nameLower.endsWith(s),
  );
  if (suffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -suffix.length));
    if (prefix !== undefined) return `${prefix} One Shots`;
  }
  return undefined;
}

function resolveCompoundType(nameLower: string): string | undefined {
  const sep = nameLower.includes(" and ")
    ? " and "
    : nameLower.includes(" & ")
      ? " & "
      : undefined;
  if (sep === undefined) return undefined;
  const resolved = nameLower.split(sep).map(lookupStandalone);
  if (resolved.every((r): r is string => r !== undefined)) {
    return resolved.join(" and ");
  }
  return undefined;
}

// Finds the leading word(s) of `nameLower` that match a known FOLDER_LOOKUP key,
// ignoring any unresolved trailing words that follow it (e.g. "ambience fx" →
// "Ambience", ignoring the trailing "fx" rather than letting it later resolve
// "fx" alone to "Sound FX"). Prefers the longest key match at the start (e.g.
// "sound fx" over "fx"), and extends a matched key with an immediately
// following Loop/One Shot label (e.g. "vocal loops" → "Vocal Loops").
function resolveLeadingKeyType(nameLower: string): string | undefined {
  const words = nameLower.split(" ").filter((w) => w.length > 0);
  for (let len = Math.min(MAX_KEY_WORDS, words.length); len >= 1; len -= 1) {
    const entry = FOLDER_LOOKUP.get(words.slice(0, len).join(" "));
    if (entry === undefined) continue;
    const { prefix, standalone } = entry;
    const hasNextWord = len < words.length;
    if (prefix !== undefined && hasNextWord) {
      const [nextWord] = words.slice(len);
      if ((LOOP_LABELS as readonly string[]).includes(nextWord)) {
        return `${prefix} Loops`;
      }
      if ((ONE_SHOT_LABELS as readonly string[]).includes(nextWord)) {
        return `${prefix} One Shots`;
      }
    }
    return standalone;
  }
  return undefined;
}

function resolveAnyType(nameLower: string): string | undefined {
  return (
    resolveStandaloneType(nameLower) ??
    resolveCompoundType(nameLower) ??
    resolveLeadingKeyType(nameLower)
  );
}

// Strips leading words from a segment one at a time and resolves the remainder.
// Noise suffixes (e.g. "collection", "bundle") are stripped from the segment first.
// Empty words (from double spaces) are filtered out before processing.
// Requires the first (prefix) word to be purely alphabetic — this rejects segments
// where normalisation has left punctuation in a word (e.g. "Kicks, Snares" → "kicks,").
// e.g. "Phoenix Vocal Loops" → "Vocal Loops".
// e.g. "Tonal Ambience & Textures" → "Ambience & Textures" → "Ambience and Textures".
// e.g. "Cyclone Ultimate Bass Collection" → strip noise → "Cyclone Ultimate Bass" → "Bass".
// e.g. "Tonal Ambience FX" → "Ambience FX" → leading key "Ambience" (trailing "FX" ignored).
// Returns undefined if no suffix of the segment resolves to a known type.
const ALPHA_RE = /^[a-z]+$/v;
function resolveSegmentSuffix(segment: string): string | undefined {
  const cleaned = stripIgnoredSuffix(segment);
  const words = cleaned.split(" ").filter((w) => w.length > 0);
  if (words.length < MIN_SEGMENT_WORDS) return undefined;
  if (!ALPHA_RE.test(words[0])) return undefined;
  for (let i = 1; i < words.length; i += 1) {
    const type = resolveAnyType(words.slice(i).join(" "));
    if (type !== undefined) return type;
  }
  return undefined;
}

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getOwnSampleType() !== undefined) return;
      if (entry.getChildNodes().length === 0) return;

      const nameLower = entry.getName().toLowerCase();
      const parts = nameLower.includes(DASH_SEP)
        ? nameLower.split(DASH_SEP)
        : [nameLower];
      const matches = parts
        .map(resolveSegmentSuffix)
        .filter((t): t is string => t !== undefined);
      if (matches.length !== 1) return;
      const [sampleType] = matches;
      entry.setSampleType(sampleType);
    });
  },
};
/**
 * DirectorySegmentSuffixTransformer
 * Last-ditch fallback for directories that have not been assigned a sampleType
 * by any earlier transformer. Splits the directory name by ' - ' (treating the
 * whole name as one segment when there is no separator) and checks each segment
 * for a known-type suffix by progressively stripping leading words. If exactly
 * one segment yields a unique match, the directory is tagged with that type.
 * e.g. "Cymatics - Phoenix Vocal Loops" → segment "Phoenix Vocal Loops"
 *      → strip "Phoenix" → "Vocal Loops" → tags as "Vocal Loops".
 * e.g. "Wet Percussion" → strip "Wet" → "Percussion" → tags as "Percussion".
 * Each remaining window is resolved in this priority order: (1) an exact
 * standalone/Loop/One-Shot match for the whole window, (2) an "X & Y"/"X and Y"
 * compound where both sides resolve, (3) a leading-key fallback that matches
 * just the window's first word(s) against a known FOLDER_LOOKUP key and
 * ignores unresolved trailing words — e.g. "Tonal Ambience FX" → window
 * "Ambience FX" → leading key "Ambience" wins instead of overshooting to the
 * trailing "FX" resolving alone to "Sound FX".
 * Must run after all other directory transformers.
 */
export const createDirectorySegmentSuffixTransformer = (): Transform =>
  _singleton;
