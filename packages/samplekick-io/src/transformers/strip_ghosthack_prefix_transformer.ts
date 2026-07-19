import type { Transform } from "../types";

// Matches a leading "Ghosthack" prefix in its various raw forms
// (e.g. "Ghosthack-", "Ghosthack -", "Ghosthack_", "Ghosthack "), but not a
// "Ghosthack x <collab>" cross-brand collaboration name.
const GHOSTHACK_PREFIX_RE = /^Ghosthack[\s_]*-?[\s_]*(?!x\s)(?=\S)/iv;

// Matches a packageName that is (or inherits from an ancestor) a Ghosthack pack.
const GHOSTHACK_PACKAGE_RE = /^ghosthack\b/iv;

const stripGhosthackPrefix = (name: string): string =>
  name.replace(GHOSTHACK_PREFIX_RE, "");

const _singleton: Transform = {
  transform: (source) => {
    // Pass 1: find directories whose packageName (own or inherited from a
    // parent directory) identifies them as a Ghosthack pack.
    const ghosthackDirectoryPaths = new Set<string>();
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;

      const packageName = entry.getPackageName();
      if (packageName === undefined) return;
      if (!GHOSTHACK_PACKAGE_RE.test(packageName)) return;

      ghosthackDirectoryPaths.add(entry.getPath());
    });

    // Pass 2: strip the prefix from file names (always) and from directory
    // names (only when tagged as Ghosthack in pass 1).
    source.eachTransformModification((entry) => {
      if (!entry.isFile() && !ghosthackDirectoryPaths.has(entry.getPath())) {
        return;
      }

      const name = entry.getName();
      if (!GHOSTHACK_PREFIX_RE.test(name)) return;

      entry.setName(stripGhosthackPrefix(name));
    });
  },
};

/**
 * StripGhosthackPrefixTransformer
 * Removes a leading "Ghosthack" prefix (in any raw form: "Ghosthack-",
 * "Ghosthack -", "Ghosthack_", "Ghosthack ") from file names.
 * Also strips the prefix from a directory's own name, but only when that
 * directory's packageName identifies it as a Ghosthack pack — either
 * directly (its own packageName) or inherited from a parent directory.
 * packageName and sampleType themselves are left untouched.
 * "Ghosthack x <collab>" names are left unchanged, since that denotes a
 * cross-brand collaboration rather than a plain prefix.
 */
export const createStripGhosthackPrefixTransformer = (): Transform =>
  _singleton;
