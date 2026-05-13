import type { Transform } from "../types";

const KIT_RE = /kit/iv;

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getChildNodes().length === 0) return;
      if (entry.getOwnPackageName() !== undefined) return;
      const name = entry.getName();
      if (!name.includes(" - ")) return;
      const parent = entry.getParentNode();
      const parentHasDash = parent?.getName().includes(" - ") === true;
      if (parentHasDash && !KIT_RE.test(name)) return;
      entry.setPackageName(name);
    });
  },
};
export const createMultiPackNameTransformer = (): Transform => _singleton;
