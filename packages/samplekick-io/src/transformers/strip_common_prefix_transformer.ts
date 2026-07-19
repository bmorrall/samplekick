import type { Transform } from "../types";
import { AUDIO_EXTENSIONS } from "../audio_format";

const MIN_AUDIO_FILES = 2;
const MIN_PREFIX_LENGTH = 2;

function longestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return "";
  const [first, ...rest] = strings;
  let prefix = first;
  for (const s of rest) {
    let j = 0;
    while (j < prefix.length && j < s.length && prefix[j] === s[j]) {
      j += 1;
    }
    prefix = prefix.slice(0, j);
    if (prefix.length === 0) return "";
  }
  return prefix;
}

function trimToWordBoundary(prefix: string): string | undefined {
  for (let i = prefix.length - 1; i >= 0; i -= 1) {
    const { [i]: ch } = prefix;
    if (ch === " " || ch === "_" || ch === "-") {
      const trimmed = prefix.slice(0, i + 1);
      if (trimmed.length >= MIN_PREFIX_LENGTH) return trimmed;
      return undefined;
    }
  }
  return undefined;
}

function isAudioName(name: string): boolean {
  return AUDIO_EXTENSIONS.has(name.slice(name.lastIndexOf(".")).toLowerCase());
}

const _singleton: Transform = {
  transform: (source) => {
    const prefixByParentPath = new Map<string, string>();

    // Pass 1: find common prefix for each non-root directory's audio children
    source.eachTransformEntry((entry) => {
      if (entry.getParentNode() === undefined) return; // root handled by FlatPackPrefixTransformer
      if (entry.isFile()) return;

      const audioChildren = entry
        .getChildNodes()
        .filter((c) => c.isFile() && isAudioName(c.getName()));
      if (audioChildren.length < MIN_AUDIO_FILES) return;

      const rawPrefix = longestCommonPrefix(
        audioChildren.map((c) => c.getName()),
      );
      const prefix = trimToWordBoundary(rawPrefix);
      if (prefix === undefined) return;

      prefixByParentPath.set(entry.getPath(), prefix);
    });

    // Pass 2: strip the prefix from each matching child
    source.eachTransformModification((entry) => {
      const parent = entry.getParentNode();
      if (parent === undefined) return;

      const prefix = prefixByParentPath.get(parent.getPath());
      if (prefix === undefined) return;

      const name = entry.getName();
      if (name.startsWith(prefix)) {
        entry.setName(name.slice(prefix.length));
      }
    });
  },
};

/**
 * StripCommonPrefixTransformer
 * For each non-root directory, inspects all immediate audio file children.
 * If at least two audio files share a name prefix that ends at a word boundary
 * (space, underscore, or hyphen), that prefix is stripped from every child
 * whose name starts with it.
 *
 * e.g. in a kit directory:
 *   "Ghosthack - OSS Kit Aftershock Bass Loop Gmin 140bpm.wav"
 *   "Ghosthack - OSS Kit Aftershock Chords Loop Gmin 140bpm.wav"
 *   "Ghosthack - OSS Kit Aftershock Pad Loop Gmin 140bpm.wav"
 * share the prefix "Ghosthack - OSS Kit Aftershock " → stripped to:
 *   "Bass Loop Gmin 140bpm.wav"
 *   "Chords Loop Gmin 140bpm.wav"
 *   "Pad Loop Gmin 140bpm.wav"
 *
 * Does not act on the root node (flat packs are handled by FlatPackPrefixTransformer).
 */
export const createStripCommonPrefixTransformer = (): Transform => _singleton;
