import type { Transform } from "../types";

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
/**
 * SkipJunkTransformer
 * Marks entries as skipped if their name is "__MACOSX" or starts with ".".
 */
export const createSkipJunkTransformer = (): Transform => _singleton;
