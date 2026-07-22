import type { Transform } from "../types";

// Matches a leading "Cymatics" prefix in its various raw forms
// (e.g. "Cymatics-", "Cymatics -", "Cymatics_", "Cymatics "), but not a
// "Cymatics x <collab>" cross-brand collaboration name.
const CYMATICS_PREFIX_RE = /^Cymatics[\s_]*-?[\s_]*(?!x\s)(?=\S)/iv;

// Matches a packageName that is (or inherits from an ancestor) a Cymatics pack.
const CYMATICS_PACKAGE_RE = /^cymatics\b/iv;

const stripCymaticsPrefix = (name: string): string =>
  name.replace(CYMATICS_PREFIX_RE, "");

const _singleton: Transform = {
  transform: (source) => {
    // Pass 1: find directories whose packageName (own or inherited from a
    // parent directory) identifies them as a Cymatics pack.
    const cymaticsDirectoryPaths = new Set<string>();
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;

      const packageName = entry.getPackageName();
      if (packageName === undefined) return;
      if (!CYMATICS_PACKAGE_RE.test(packageName)) return;

      cymaticsDirectoryPaths.add(entry.getPath());
    });

    // Pass 2: strip the prefix from file names (always) and from directory
    // names (only when tagged as Cymatics in pass 1).
    source.eachTransformModification((entry) => {
      if (!entry.isFile() && !cymaticsDirectoryPaths.has(entry.getPath())) {
        return;
      }

      const name = entry.getName();
      if (!CYMATICS_PREFIX_RE.test(name)) return;

      entry.setName(stripCymaticsPrefix(name));
    });
  },
};

/**
 * StripCymaticsPrefixTransformer
 * Removes a leading "Cymatics" prefix (in any raw form: "Cymatics-",
 * "Cymatics -", "Cymatics_", "Cymatics ") from file names.
 * Also strips the prefix from a directory's own name, but only when that
 * directory's packageName identifies it as a Cymatics pack — either
 * directly (its own packageName) or inherited from a parent directory.
 * packageName and sampleType themselves are left untouched.
 * "Cymatics x <collab>" names are left unchanged, since that denotes a
 * cross-brand collaboration rather than a plain prefix.
 */
export const createStripCymaticsPrefixTransformer = (): Transform => _singleton;
