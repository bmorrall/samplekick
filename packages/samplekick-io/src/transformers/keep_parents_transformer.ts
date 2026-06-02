import type { FileNode, Transform } from "../types";

/**
 * KeepParentsTransformer
 * For every directory that directly contains at least one file, sets
 * keepStructure to true so the folder appears in the output path.
 * With levels > 1, ancestor directories up to that many levels above a
 * file-containing directory are also kept.
 * Applied when the --keep-parents CLI flag is set.
 */
export const createKeepParentsTransformer = (levels = 1): Transform => ({
  transform: (source) => {
    const pathsToKeep = new Set<string>();

    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;
      if (entry.getParentNode() === undefined) return;
      const hasFileChild = entry
        .getChildNodes()
        .some((child) => child.isFile());
      if (!hasFileChild) return;

      pathsToKeep.add(entry.getPath());

      let ancestor: FileNode | undefined = entry.getParentNode();
      for (let i = 1; i < levels; i += 1) {
        if (ancestor?.getParentNode() === undefined) {
          break;
        }
        pathsToKeep.add(ancestor.getPath());
        ancestor = ancestor.getParentNode();
      }
    });

    if (pathsToKeep.size > 0) {
      source.eachTransformEntry((entry) => {
        if (pathsToKeep.has(entry.getPath())) {
          entry.setKeepStructure(true);
        }
      });
    }
  },
});
