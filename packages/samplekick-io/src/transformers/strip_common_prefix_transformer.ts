import type { Transform } from "../types";
import { AUDIO_EXTENSIONS } from "../audio_format";
import {
  longestCommonPrefix,
  prefixMatches,
  trimToWordBoundary,
} from "./common_prefix";

const MIN_AUDIO_FILES = 2;

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
      if (prefixMatches(name, prefix)) {
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
