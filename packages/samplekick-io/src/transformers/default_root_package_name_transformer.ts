import type { Transform } from "../types";

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getParentNode() !== undefined) return;
      const name = entry.getName();
      if (name === "") return;
      const dotIdx = name.lastIndexOf(".");
      if (dotIdx > 0 && entry.getOwnPackageName() === undefined) {
        entry.setPackageName(name.substring(0, dotIdx));
      }
      if (entry.getOwnSampleType() === undefined) {
        entry.setSampleType("Packs");
      }
    });
  },
};
export const createDefaultRootPackageNameTransformer = (): Transform =>
  _singleton;
