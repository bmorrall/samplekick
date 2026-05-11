import type { Transform } from '../types';

const MIDI_PREFIX = 'MIDI';

/**
 * MidiFileTransformer
 * Detects MIDI files by the ".mid" extension and sets sampleType to "MIDI"
 * with keepStructure enabled. If the entry already has an inherited sampleType
 * (e.g. "Drum Loops" from a parent directory), the type is prefixed:
 * "MIDI - Drum Loops". Entries with keepStructure already set are skipped.
 */
export const createMidiFileTransformer: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.isKeepStructure() === true) return;

      const name = entry.getName().toLowerCase();
      const path = entry.getPath().toLowerCase();

      if (name.endsWith('.mid') || path.endsWith('.mid')) {
        const existingType = entry.getSampleType();
        const sampleType = existingType === undefined ? MIDI_PREFIX : `${MIDI_PREFIX} - ${existingType}`;
        entry.setSampleType(sampleType);
        entry.setKeepStructure(true);
      }
    });
  },
};
