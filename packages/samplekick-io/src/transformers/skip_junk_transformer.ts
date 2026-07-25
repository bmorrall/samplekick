import type { FileNode, Transform } from "../types";

const isJunkName = (name: string): boolean =>
  name === "__MACOSX" || name.startsWith(".");

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (isJunkName(entry.getName())) {
        entry.setEnabled(false);
        entry.setReadOnly(true);
        return;
      }
      if (!entry.isFile()) return;
      let current: FileNode | undefined = entry.getParentNode();
      while (current !== undefined) {
        if (isJunkName(current.getName())) {
          entry.setEnabled(false);
          entry.setReadOnly(true);
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
 * "__MACOSX" or starts with ".". Disabled files are not exported. Also marks
 * matching entries (and files beneath a junk ancestor) as readOnly so later
 * rename transforms leave their names untouched.
 */
export const createSkipJunkTransformer = (): Transform => _singleton;
