import type { Transform } from "../types";

const MIDI_PREFIX = "MIDI";

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.isReadOnly() === true) return;

      const name = entry.getName().toLowerCase();
      const path = entry.getPath().toLowerCase();

      if (name.endsWith(".mid") || path.endsWith(".mid")) {
        entry.setSampleType(MIDI_PREFIX);
        entry.setReadOnly(true);
      }
    });
  },
};
/**
 * MidiFileTransformer
 * Detects MIDI files by the ".mid" extension and sets sampleType to "MIDI"
 * with keepStructure enabled, regardless of any inherited sampleType from a
 * parent directory (e.g. "Drum Loops") — MIDI files never get a subcategory
 * suffix. Entries with keepStructure already set are skipped.
 */
export const createMidiFileTransformer = (): Transform => _singleton;
