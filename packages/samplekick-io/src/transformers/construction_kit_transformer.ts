import type { Transform } from "../types";

const KITS_RE = /\bkits\b/iv;
const KIT_RE = /\bkit\b/iv;
const PATH_SEPARATOR = "/";

const _singleton: Transform = {
  transform: (source) => {
    const kitRootPaths = new Set<string>();

    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;

      if (!KITS_RE.test(entry.getName())) return;

      const children = entry.getChildNodes();
      for (const child of children) {
        if (child.isFile()) continue;
        if (!KIT_RE.test(child.getName())) continue;
        kitRootPaths.add(child.getPath());
      }
    });

    if (kitRootPaths.size === 0) return;

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
 * Under any directory containing "kits", marks direct child directories
 * containing "kit" as keep-path roots and enables readonly structure
 * preservation for those roots and all their descendant directories.
 * Descendant directories also have packageName and sampleType cleared.
 */
export const createConstructionKitTransformer = (): Transform => _singleton;
