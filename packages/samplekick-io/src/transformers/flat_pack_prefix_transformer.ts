import type { Transform } from '../types';
import { AUDIO_EXTENSIONS } from '../audio_format';

const SEPARATOR = ' - ';
const NOT_FOUND = -1;
const MIN_AUDIO_FILES = 2;

function longestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  const [first, ...rest] = strings;
  let prefix = first;
  for (const s of rest) {
    let j = 0;
    while (j < prefix.length && j < s.length && prefix[j] === s[j]) { j += 1; }
    prefix = prefix.slice(0, j);
    if (prefix.length === 0) return '';
  }
  return prefix;
}

function trimToLastSeparator(prefix: string): string | undefined {
  const idx = prefix.lastIndexOf(SEPARATOR);
  if (idx === NOT_FOUND) return undefined;
  return prefix.slice(0, idx);
}

function isAudioPath(path: string): boolean {
  const lower = path.toLowerCase();
  for (const ext of AUDIO_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

/**
 * FlatPackPrefixTransformer
 * Detects a flat directory (only file children, no sub-directories) where audio
 * files share a common name prefix containing at least one " - " separator.
 *
 * When detected:
 * - Sets packageName on the directory to the trimmed prefix.
 * - Sets sampleType to "Packs".
 * - Strips "prefix - " from the start of all children that carry it
 *   (audio and non-audio alike, e.g. licence PDFs), skipping keepStructure entries.
 */
export const createFlatPackPrefixTransformer: Transform = (source) => {
  // Map from parent path → strip prefix, populated in the first pass and consumed
  // in the second pass where we have TransformEntry objects with setName.
  const stripPrefixByParentPath = new Map<string, string>();

  source.eachTransformEntry((entry) => {
    if (entry.getOwnSampleType() !== undefined) return;
    if (entry.getParentNode() !== undefined) return; // root node only

    const children = entry.getChildNodes();
    if (children.length === 0) return;

    // Must be a flat pack — no sub-directories.
    if (children.some((child) => child.getChildNodes().length > 0)) return;

    const audioChildren = children.filter((child) => isAudioPath(child.getPath()));
    if (audioChildren.length < MIN_AUDIO_FILES) return;

    const rawPrefix = longestCommonPrefix(audioChildren.map((child) => child.getName()));
    const prefix = trimToLastSeparator(rawPrefix);
    if (prefix === undefined || prefix.length === 0) return;

    entry.setPackageName(prefix);
    entry.setSampleType('Packs');

    stripPrefixByParentPath.set(entry.getPath(), `${prefix}${SEPARATOR}`);
  });

  // Second pass: rename children using TransformEntry objects (which expose setName).
  source.eachTransformModification((entry) => {
    const parent = entry.getParentNode();
    if (parent === undefined) return;

    const stripPrefix = stripPrefixByParentPath.get(parent.getPath());
    if (stripPrefix === undefined) return;

    const name = entry.getName();
    if (name.startsWith(stripPrefix)) {
      entry.setName(name.slice(stripPrefix.length));
    }
  });
};
