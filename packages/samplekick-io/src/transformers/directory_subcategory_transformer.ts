import type { Transform, TransformEntry } from '../types';
import { isKnownTypeFolderName } from './folder_lookup';

const STRIP_MIDI_STEMS_RE = / (?:&|and) (?:midi|stems?)$/iv;

// Folder names ending with these suffixes should never be treated as a subcategory.
// e.g. "Latin Stems", "Loop Steps", or bare "MIDI" under a known-type parent are excluded.
// MIDI directories are always transparent: the MidiFileTransformer computes the correct
// sampleType from the ancestor context, avoiding "Melodies - MIDI" → "MIDI - Melodies - MIDI".
const SUBCATEGORY_EXCLUDED_SUFFIX_RE = /(?:^| )(?:stems?|steps?|midi)$/iv;

function trySetSubcategory(entry: TransformEntry): boolean {
  const parent = entry.getParentNode();
  if (parent === undefined) return false;
  const parentSampleType = parent.getSampleType();
  if (parentSampleType === undefined) return false;
  if (!isKnownTypeFolderName(parentSampleType)) return false;
  const displayName = entry.getName().replace(STRIP_MIDI_STEMS_RE, '');
  if (SUBCATEGORY_EXCLUDED_SUFFIX_RE.test(displayName)) return false;
  if (displayName.includes(' - ')) return false;
  entry.setSampleType(`${parentSampleType} - ${displayName}`);
  return true;
}

/**
 * DirectorySubcategoryTransformer
 * For directories that have not yet been assigned a sampleType, checks whether
 * their parent directory has a known sampleType and, if so, tags the child as a
 * subcategory using the "ParentType - ChildName" convention.
 * e.g. "Latin" under "Drum Loops" → "Drum Loops - Latin".
 * Must run after createDirectorySampleTypeTransformer.
 */
export const createDirectorySubcategoryTransformer: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getOwnSampleType() !== undefined) return;
      if (entry.getChildNodes().length === 0) return;
      trySetSubcategory(entry);
    });
  },
};
