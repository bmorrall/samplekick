import type { FileNode, Transform } from "../types";
import { AUDIO_EXTENSIONS } from "../audio_format";

const KITS_RE = /\bkits\b/iv;
const KIT_RE = /\bkit\b/iv;
const PATH_SEPARATOR = "/";
const MIN_KIT_FILES = 2;
const MIN_KIT_SIBLINGS = 2;
const MIN_PREFIX_LENGTH = 2;
const MIDI_EXTENSION = ".mid";

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

function isKitFileName(name: string): boolean {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return AUDIO_EXTENSIONS.has(ext) || ext === MIDI_EXTENSION;
}

function collectKitFileNames(node: FileNode): string[] {
  const names: string[] = [];
  for (const child of node.getChildNodes()) {
    if (child.isFile()) {
      if (isKitFileName(child.getName())) names.push(child.getName());
    } else {
      names.push(...collectKitFileNames(child));
    }
  }
  return names;
}

const _singleton: Transform = {
  transform: (source) => {
    const kitRootPaths = new Set<string>();

    // Pass 1: find kit root paths.
    // A directory is treated as a kits container either when its own name
    // contains "kits" (e.g. "Construction Kits"), or when it directly holds
    // 2+ child directories whose names contain "kit" (e.g. numbered kit
    // folders sitting at a pack's top level with no "Kits" wrapper folder).
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;

      const children = entry.getChildNodes();
      const kitChildren = children.filter(
        (child) => !child.isFile() && KIT_RE.test(child.getName()),
      );

      const isExplicitKitsContainer = KITS_RE.test(entry.getName());
      const looksLikeKitsContainer =
        isExplicitKitsContainer || kitChildren.length >= MIN_KIT_SIBLINGS;
      if (!looksLikeKitsContainer) return;

      for (const child of kitChildren) {
        kitRootPaths.add(child.getPath());
      }
    });

    if (kitRootPaths.size === 0) return;

    // Pass 2: compute a common prefix from all audio/midi files in each kit root
    const prefixByKitRoot = new Map<string, string>();
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;
      if (!kitRootPaths.has(entry.getPath())) return;

      const names = collectKitFileNames(entry);
      if (names.length < MIN_KIT_FILES) return;

      const rawPrefix = longestCommonPrefix(names);
      const prefix = trimToWordBoundary(rawPrefix);
      if (prefix !== undefined) prefixByKitRoot.set(entry.getPath(), prefix);
    });

    // Pass 3: strip kit prefix from all matching files — must run before readOnly is set
    const prefixStrippedPaths = new Set<string>();
    if (prefixByKitRoot.size > 0) {
      source.eachTransformModification((entry) => {
        // Walk up the ancestor chain to find the kit root
        let ancestor = entry.getParentNode();
        let kitRootPath: string | undefined = undefined;
        while (ancestor !== undefined) {
          const path = ancestor.getPath();
          if (kitRootPaths.has(path)) {
            kitRootPath = path;
            break;
          }
          ancestor = ancestor.getParentNode();
        }
        if (kitRootPath === undefined) return;

        const prefix = prefixByKitRoot.get(kitRootPath);
        if (prefix === undefined) return;

        const name = entry.getName();
        if (name.startsWith(prefix)) {
          entry.setName(name.slice(prefix.length));
          prefixStrippedPaths.add(entry.getPath());
        }
      });
    }

    // Pass 4: compute per-directory prefix from current (already-stripped) names
    const perDirPrefix = new Map<string, string>();
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;
      const path = entry.getPath();
      const isInsideKit = [...kitRootPaths].some(
        (rootPath) =>
          path === rootPath || path.startsWith(`${rootPath}${PATH_SEPARATOR}`),
      );
      if (!isInsideKit) return;

      const kitChildren = entry
        .getChildNodes()
        .filter((c) => c.isFile() && isKitFileName(c.getName()));
      if (kitChildren.length < MIN_KIT_FILES) return;

      const rawPrefix = longestCommonPrefix(
        kitChildren.map((c) => c.getName()),
      );
      const prefix = trimToWordBoundary(rawPrefix);
      if (prefix !== undefined) perDirPrefix.set(path, prefix);
    });

    // Pass 5: strip per-directory prefix
    if (perDirPrefix.size > 0) {
      source.eachTransformModification((entry) => {
        const parent = entry.getParentNode();
        if (parent === undefined) return;

        const prefix = perDirPrefix.get(parent.getPath());
        if (prefix === undefined) return;

        const name = entry.getName();
        if (name.startsWith(prefix)) {
          entry.setName(name.slice(prefix.length));
          prefixStrippedPaths.add(entry.getPath());
        }
      });
    }

    // Pass 6: strip key/BPM tags from file names that had a prefix stripped —
    // they're captured in the kit directory name. Files without a shared
    // prefix are left to the standard name-normalisation pipeline.
    source.eachTransformModification((entry) => {
      if (!entry.isFile()) return;
      if (!prefixStrippedPaths.has(entry.getPath())) return;

      const name = entry.getName();
      const dotIdx = name.lastIndexOf(".");
      const stem = dotIdx > 0 ? name.slice(0, dotIdx) : name;
      const ext = dotIdx > 0 ? name.slice(dotIdx) : "";

      const newStem = ` ${stem} `
        .replace(/\b[A-G][#b]?(?:min|maj)\b/giv, " ")
        .replace(/\b\d+bpm\b/giv, " ")
        .replace(/\s+/gv, " ")
        .trim();

      if (newStem.length > 0 && newStem !== stem) {
        entry.setName(newStem + ext);
      }
    });

    // Pass 7: mark kit directories as keep-path roots (readOnly)
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;

      const path = entry.getPath();
      for (const rootPath of kitRootPaths) {
        const isKitRoot = path === rootPath;
        const isKitDescendant = path.startsWith(`${rootPath}${PATH_SEPARATOR}`);
        if (isKitRoot || isKitDescendant) {
          entry.setEnabled(true);
          entry.setReadOnly(true);
          if (isKitDescendant) {
            entry.setPackageName(undefined);
            entry.setSampleType(undefined);
          }
          break;
        }
      }
    });
  },
};

/**
 * ConstructionKitTransformer
 * Under any directory containing "kits", or any directory that directly
 * holds 2+ child directories containing "kit" (e.g. numbered kit folders
 * sitting at a pack's top level with no "Kits" wrapper folder), marks those
 * matching child directories as keep-path roots and enables readonly
 * structure preservation for those roots and all their descendant
 * directories. Descendant directories also have packageName and sampleType
 * cleared.
 *
 * Additionally strips any common name prefix shared by audio files within
 * each kit subdirectory, provided the prefix ends at a word boundary.
 */
export const createConstructionKitTransformer = (): Transform => _singleton;
