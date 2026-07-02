import type { Transform } from "../types";

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (!entry.isFile()) {
        entry.setEnabled(true);
      }
      entry.setReadOnly(true);
    });
  },
};

/**
 * KeepPathsTransformer
 * Marks every directory as enabled so the full source-relative hierarchy is
 * preserved when exported via organised paths, and marks every entry as
 * readonly so names are not modified by subsequent transforms.
 */
export const createKeepPathsTransformer = (): Transform => _singleton;
