import type { Transform } from "../types";

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      entry.setKeepStructure(true);
    });
  },
};

/**
 * KeepPathsTransformer
 * Marks every entry as keepStructure=true so the full source-relative
 * hierarchy is preserved when exported via organised paths.
 */
export const createKeepPathsTransformer = (): Transform => _singleton;
