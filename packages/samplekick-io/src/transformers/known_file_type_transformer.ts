import type { Transform } from "../types";
import {
  DIGITONE_PROJECTS,
  DIGITONE_SOUNDS,
  PHASE_PLANT_PRESETS,
  SERUM_PRESETS,
} from "./folder_lookup";

const EXTENSION_SAMPLE_TYPES: ReadonlyMap<string, string> = new Map([
  [".dnprj", DIGITONE_PROJECTS],
  [".dnsnd", DIGITONE_SOUNDS],
  [".fxp", SERUM_PRESETS],
  [".phaseplant", PHASE_PLANT_PRESETS],
]);

const matchedSampleType = (name: string, path: string): string | undefined => {
  for (const [ext, sampleType] of EXTENSION_SAMPLE_TYPES) {
    if (name.endsWith(ext) || path.endsWith(ext)) return sampleType;
  }
  return undefined;
};

/**
 * KnownFileTypeTransformer
 * Sets sampleType based on the file extension when it has not already been set.
 * - ".dnprj" (case-insensitive) → "Digitone Projects"
 * - ".dnsnd" (case-insensitive) → "Digitone Sounds"
 * - ".fxp" (case-insensitive) → "Serum Presets"
 * - ".phaseplant" (case-insensitive) → "Phase Plant Presets"
 * Pass `{ tagSampleType: false }` to lock the folder structure without tagging.
 */
export const createKnownFileTypeTransformer = ({
  tagSampleType = true,
}: { tagSampleType?: boolean } = {}): Transform => ({
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      const name = entry.getName().toLowerCase();
      const path = entry.getPath().toLowerCase();
      const sampleType = matchedSampleType(name, path);

      if (sampleType === undefined) return;

      if (tagSampleType && entry.getSampleType() === undefined) {
        entry.setSampleType(sampleType);
      }
      entry.setReadOnly(true);
    });
  },
});
