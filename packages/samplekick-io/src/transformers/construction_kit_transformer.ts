import type { FileNode, Transform } from "../types";
import { AUDIO_EXTENSIONS } from "../audio_format";
import { getPathName } from "../path_utils";
import {
  longestCommonPrefix,
  prefixMatches,
  trimToWordBoundary,
} from "./common_prefix";
import { stripLeadingBracket } from "./strip_leading_bracket_transformer";

const KITS_RE = /\bkits\b/iv;
const KIT_RE = /\bkit\b/iv;
const STEMS_RE = /\bstems?\b/iv;
const PATH_SEPARATOR = "/";
const MIN_KIT_FILES = 2;
const MIN_KIT_SIBLINGS = 2;
const MIDI_EXTENSION = ".mid";

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
    //
    // A directory whose own name contains "stem"/"stems" (e.g. "Loop Stems",
    // "Loop Stems & MIDI") is treated as a stems container: unlike kits
    // containers, every direct child directory is a stem root regardless of
    // its name, since stems containers exclusively hold per-loop stem groups.
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;

      const children = entry.getChildNodes();
      const directoryChildren = children.filter((child) => !child.isFile());
      const kitChildren = directoryChildren.filter((child) =>
        KIT_RE.test(child.getName()),
      );

      if (STEMS_RE.test(entry.getName())) {
        for (const child of directoryChildren) {
          kitRootPaths.add(child.getPath());
        }
      }

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
        if (prefixMatches(name, prefix)) {
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
        if (prefixMatches(name, prefix)) {
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

    // Pass 6b: strip a leading bracket pair left behind by prefix stripping
    // (e.g. "Snare (Counter).wav" -> "(Counter).wav" -> "Counter.wav") —
    // must also run before readOnly is set in Pass 7.
    source.eachTransformModification((entry) => {
      if (!entry.isFile()) return;
      if (!prefixStrippedPaths.has(entry.getPath())) return;

      const name = entry.getName();
      const stripped = stripLeadingBracket(name);
      if (stripped !== name) entry.setName(stripped);
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
            // An earlier pass (e.g. DirectorySampleTypeTransformer's dash-
            // separated split, "Hihats - Open" -> name "Open" + sampleType
            // "Hihats") may have renamed this directory specifically because
            // it assigned it a more specific sampleType. Since that
            // sampleType is about to be cleared below (the whole kit is
            // tagged uniformly instead), re-join the two halves back into
            // the name (e.g. "Hihats - Open") rather than dropping the type
            // context entirely. Rebuilding from the CURRENT sampleType/name
            // (not the raw pre-pipeline entry name from getPath()) keeps any
            // earlier cosmetic normalisation already applied to either half
            // (trimming, dash/quote normalisation, spacing fixes, etc.)
            // instead of discarding it along with the split.
            const ownSampleType = entry.getOwnSampleType();
            const wasSplitRenamed =
              ownSampleType !== undefined &&
              entry.getName() !== getPathName(path);
            if (wasSplitRenamed) {
              entry.setName(`${ownSampleType} - ${entry.getName()}`);
            }
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
 * cleared, so the whole kit is tagged uniformly by the kit root's own type
 * instead of fragmenting into per-subfolder sampleTypes. If an earlier pass
 * had renamed a descendant directory as a side effect of assigning it that
 * now-cleared sampleType (e.g. DirectorySampleTypeTransformer's dash-
 * separated split, "Hihats - Open" -> name "Open" + sampleType "Hihats"),
 * the two halves are re-joined back into the name ("Hihats - Open") instead
 * of just discarding the type context, since the shortened name only made
 * sense together with the type it named.
 *
 * Also treats any directory containing "stem"/"stems" (e.g. "Loop Stems",
 * "Loop Stems & MIDI") as a stems container: every direct child directory is
 * marked as a stem root and given the same treatment, regardless of the
 * child's own name, since a stems container exclusively holds per-loop stem
 * groups (e.g. "Apple Drum Loop - 102bpm" containing Kick.wav, Snare.wav,
 * Shaker.wav).
 *
 * Additionally strips any common name prefix shared by audio files within
 * each kit subdirectory, provided the prefix ends at a word boundary.
 */
export const createConstructionKitTransformer = (): Transform => _singleton;
