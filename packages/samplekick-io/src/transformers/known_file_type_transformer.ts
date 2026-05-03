import type { Transform } from '../types';

/**
 * KnownFileTypeTransformer
 * Sets sampleType based on the file extension when it has not already been set.
 * - ".mid" (case-insensitive) → "MIDI"
 * - ".fxp" (case-insensitive) → "Serum Presets"
 */
export const KnownFileTypeTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getSampleType() !== undefined) {
      return;
    }

    const name = entry.getName().toLowerCase();
    const path = entry.getPath().toLowerCase();

    if (name.endsWith('.mid') || path.endsWith('.mid')) {
      entry.setSampleType('MIDI');
      entry.setKeepStructure(true);
    } else if (name.endsWith('.fxp') || path.endsWith('.fxp')) {
      entry.setSampleType('Serum Presets');
      entry.setKeepStructure(true);
    }
  });
};
