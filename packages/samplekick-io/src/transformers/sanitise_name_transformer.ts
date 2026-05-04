import type { StringTransformer, Transform } from "../types";

export const createSanitiseNameTransformer = (sanitize: StringTransformer): Transform => (source) => {
  source.eachTransformModification((entry) => {
    if (entry.isKeepStructure() === true) return;
    if (entry.isSkipped() === true) return;
    entry.setName(sanitize(entry.getName()));
    const packageName = entry.getPackageName();
    if (packageName !== undefined) entry.setPackageName(sanitize(packageName));
    const sampleType = entry.getSampleType();
    if (sampleType !== undefined) entry.setSampleType(sanitize(sampleType));
  });
};
