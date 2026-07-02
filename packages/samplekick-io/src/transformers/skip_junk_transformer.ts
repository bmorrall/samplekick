import type { FileNode, Transform } from "../types";

const isJunkName = (name: string): boolean =>
  name === "__MACOSX" || name.startsWith(".");

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (isJunkName(entry.getName())) {
        entry.setEnabled(false);
        return;
      }
      if (!entry.isFile()) return;
      let current: FileNode | undefined = entry.getParentNode();
      while (current !== undefined) {
        if (isJunkName(current.getName())) {
          entry.setEnabled(false);
          break;
        }
        current = current.getParentNode();
      }
    });
  },
};
/**
 * SkipJunkTransformer
 * Disables file entries whose name (or any ancestor directory name) is
 * "__MACOSX" or starts with ".". Disabled files are not exported.
 */
export const createSkipJunkTransformer = (): Transform => _singleton;
