import type { Transform } from '../types';

/**
 * MidiFileTransformer
 * Detects MIDI files by the ".mid" extension and sets sampleType to "MIDI"
 * with keepStructure enabled so they are preserved in their folder hierarchy.
 */
export const createMidiFileTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getSampleType() !== undefined) return;

    const name = entry.getName().toLowerCase();
    const path = entry.getPath().toLowerCase();

    if (name.endsWith('.mid') || path.endsWith('.mid')) {
      entry.setSampleType('MIDI');
      entry.setKeepStructure(true);
    }
  });
};
