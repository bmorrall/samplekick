import type { Transform } from "../types";
import { SAMPLE_TYPE_PACKS } from "../sample_types";

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getParentNode() !== undefined) return;
      if (entry.getOwnSampleType() === undefined) {
        entry.setSampleType(SAMPLE_TYPE_PACKS);
      }
    });
  },
};
export const createDefaultRootSampleTypeTransformer = (): Transform =>
  _singleton;
