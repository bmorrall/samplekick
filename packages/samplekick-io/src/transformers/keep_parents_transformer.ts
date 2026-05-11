import type { Transform } from "../types";

/**
 * KeepParentsTransformer
 * For every directory that directly contains at least one file, sets
 * keepStructure to true so the folder appears in the output path.
 * Ancestor directories that only contain subdirectories are left unset so
 * they appear individually in the saved config and can be toggled independently.
 * Applied when the --keep-parents CLI flag is set.
 */
const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;
      if (entry.getParentNode() === undefined) return;
      const hasFileChild = entry
        .getChildNodes()
        .some((child) => child.isFile());
      if (!hasFileChild) return;
      entry.setKeepStructure(true);
    });
  },
};

export const createKeepParentsTransformer = (): Transform => _singleton;
