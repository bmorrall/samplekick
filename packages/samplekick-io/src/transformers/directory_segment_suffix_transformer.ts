import type { Transform } from '../types';
import { lookupPrefix, lookupStandalone, ONE_SHOT_LABELS } from './folder_lookup';

const DASH_SEP = ' - ';

function resolveStandaloneType(nameLower: string): string | undefined {
  const standalone = lookupStandalone(nameLower);
  if (standalone !== undefined) return standalone;
  if (nameLower.endsWith(' loops')) {
    const prefix = lookupPrefix(nameLower.slice(0, -' loops'.length));
    if (prefix !== undefined) return `${prefix} Loops`;
  }
  const suffix = ONE_SHOT_LABELS.map((l) => ` ${l}`).find((s) => nameLower.endsWith(s));
  if (suffix !== undefined) {
    const prefix = lookupPrefix(nameLower.slice(0, -suffix.length));
    if (prefix !== undefined) return `${prefix} One Shots`;
  }
  return undefined;
}

function resolveCompoundType(nameLower: string): string | undefined {
  const sep = nameLower.includes(' and ') ? ' and ' : nameLower.includes(' & ') ? ' & ' : undefined;
  if (sep === undefined) return undefined;
  const resolved = nameLower.split(sep).map(lookupStandalone);
  if (resolved.every((r): r is string => r !== undefined)) return resolved.join(' and ');
  return undefined;
}

function resolveAnyType(nameLower: string): string | undefined {
  return resolveStandaloneType(nameLower) ?? resolveCompoundType(nameLower);
}

// Strips leading words from a segment one at a time and resolves the remainder.
// e.g. "Phoenix Vocal Loops" → "Vocal Loops".
// e.g. "Tonal Ambience & Textures" → "Ambience & Textures" → "Ambience and Textures".
// Returns undefined if no suffix of the segment resolves to a known type.
function resolveSegmentSuffix(segment: string): string | undefined {
  const words = segment.split(' ');
  for (let i = 1; i < words.length; i += 1) {
    const type = resolveAnyType(words.slice(i).join(' '));
    if (type !== undefined) return type;
  }
  return undefined;
}

/**
 * DirectorySegmentSuffixTransformer
 * For directories that have not yet been assigned a sampleType, splits the
 * directory name by ' - ' and checks each segment for a known-type suffix
 * by progressively stripping leading words. If exactly one segment yields a
 * unique match, the directory is tagged with that type.
 * e.g. "Cymatics - Phoenix Vocal Loops" → segment "Phoenix Vocal Loops"
 *      → strip "Phoenix" → "Vocal Loops" → tags as "Vocal Loops".
 * Must run after createDirectoryChildNameTransformer.
 */
export const createDirectorySegmentSuffixTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getOwnSampleType() !== undefined) return;
    if (entry.getChildNodes().length === 0) return;

    const nameLower = entry.getName().toLowerCase();
    if (!nameLower.includes(DASH_SEP)) return;

    const parts = nameLower.split(DASH_SEP);
    const matches = parts.map(resolveSegmentSuffix).filter((t): t is string => t !== undefined);
    if (matches.length !== 1) return;
    const [sampleType] = matches;
    entry.setSampleType(sampleType);
  });
};
