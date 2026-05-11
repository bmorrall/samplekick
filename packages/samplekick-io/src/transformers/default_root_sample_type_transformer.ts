import type { Transform } from "../types";

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getParentNode() !== undefined) return;
      if (entry.getOwnSampleType() === undefined) {
        entry.setSampleType("Packs");
      }
    });
  },
};
export const createDefaultRootSampleTypeTransformer = (): Transform =>
  _singleton;
