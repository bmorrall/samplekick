import type { Transform } from '../types';
import { PHASE_PLANT_PRESETS, SERUM_PRESETS } from './folder_lookup';

/**
 * KnownFileTypeTransformer
 * Sets sampleType based on the file extension when it has not already been set.
 * - ".fxp" (case-insensitive) → "Serum Presets"
 * - ".phaseplant" (case-insensitive) → "Phase Plant Presets"
 */
export const createKnownFileTypeTransformer :  Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getSampleType() !== undefined) {
      return;
    }

    const name = entry.getName().toLowerCase();
    const path = entry.getPath().toLowerCase();

    if (name.endsWith('.fxp') || path.endsWith('.fxp')) {
      entry.setSampleType(SERUM_PRESETS);
      entry.setKeepStructure(true);
    } else if (name.endsWith('.phaseplant') || path.endsWith('.phaseplant')) {
      entry.setSampleType(PHASE_PLANT_PRESETS);
      entry.setKeepStructure(true);
    }
  });
};
