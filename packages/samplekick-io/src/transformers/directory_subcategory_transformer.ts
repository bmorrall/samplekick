import type { Transform, TransformEntry } from "../types";
import {
  isKnownTypeFolderName,
  resolveOneShotPrefixType,
} from "./folder_lookup";

const STRIP_MIDI_STEMS_RE = / (?:&|and) (?:midi|stems?)$/iv;

// Folder names ending with these suffixes should never be treated as a subcategory.
// e.g. "Latin Stems", "Loop Steps", or bare "MIDI" under a known-type parent are excluded.
// MIDI directories are always transparent: the MidiFileTransformer computes the correct
// sampleType from the ancestor context, avoiding "Melodies - MIDI" → "MIDI - Melodies - MIDI".
const SUBCATEGORY_EXCLUDED_SUFFIX_RE = /(?:^| )(?:stems?|steps?|midi|kits?)$/iv;

function tryEnableSubcategory(entry: TransformEntry): boolean {
  const parent = entry.getParentNode();
  if (parent === undefined) return false;
  const parentSampleType = parent.getSampleType();
  if (parentSampleType === undefined) return false;
  if (!isKnownTypeFolderName(parentSampleType)) return false;
  const displayName = entry.getName().replace(STRIP_MIDI_STEMS_RE, "");
  if (SUBCATEGORY_EXCLUDED_SUFFIX_RE.test(displayName)) return false;
  if (displayName.includes(" - ")) return false;
  if (displayName !== entry.getName()) entry.setName(displayName);
  entry.setEnabled(true);
  return true;
}

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      const ownType = entry.getOwnSampleType();
      if (ownType !== undefined) {
        const resolved = resolveOneShotPrefixType(ownType);
        if (resolved !== undefined) entry.setSampleType(resolved);
      }
      if (entry.getOwnSampleType() !== undefined) return;
      if (entry.getChildNodes().length === 0) return;
      tryEnableSubcategory(entry);
    });
  },
};
/**
 * DirectorySubcategoryTransformer
 * For directories that have not yet been assigned a sampleType, checks whether
 * their parent directory has a known sampleType and, if so, keeps the child
 * directory in the organised path (via `setEnabled(true)`) instead of tagging
 * it with a "ParentType - ChildName" sampleType suffix. If the folder name has
 * a "& MIDI"/"& Stems" suffix stripped for the eligibility check, the entry is
 * renamed to that stripped display name (via `setName`).
 * e.g. "Latin" under "Drum Loops" keeps the "Latin" folder nested under
 * "Drum Loops" rather than becoming sampleType "Drum Loops - Latin".
 * Must run after createDirectorySampleTypeTransformer.
 */
export const createDirectorySubcategoryTransformer = (): Transform =>
  _singleton;
