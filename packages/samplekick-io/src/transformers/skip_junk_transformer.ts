import type { Transform } from "../types";

/**
 * SkipJunkTransformer
 * Marks entries as skipped if their name is "__MACOSX" or starts with ".".
 */
const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      const name = entry.getName();
      if (name === "__MACOSX" || name.startsWith(".")) {
        entry.setSkipped(true);
      }
    });
  },
};
export const createSkipJunkTransformer = (): Transform => _singleton;
