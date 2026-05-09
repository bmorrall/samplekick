import type { Transform, TransformEntry } from '../types';

const DRUM_KEYS = ['drum', 'drums'] as const;
const DASH_SEP = ' - ';

// Maps bare subcategory keywords (singular and plural) to their canonical label.
const SUBCATEGORY_MAP = new Map<string, string>([
  ['fill',   'Fills'],
  ['fills',  'Fills'],
  ['break',  'Breaks'],
  ['breaks', 'Breaks'],
]);

function hasDrumAncestor(entry: TransformEntry): boolean {
  let ancestor = entry.getParentNode();
  while (ancestor !== undefined) {
    const name = ancestor.getName().toLowerCase();
    if (name === 'drum' || name === 'drums') return true;
    ancestor = ancestor.getParentNode();
  }
  return false;
}

/**
 * DrumSubcategoryTransformer
 * Recognises drum-specific subcategory folders (Fills, Breaks) and sets their
 * sampleType to the canonical "Drum Fills" / "Drum Breaks" form. Handles:
 *   - Bare folder names ("Fills", "Breaks") under a Drum / Drums ancestor.
 *   - Space-prefixed forms ("Drum Fills", "Drums Fill").
 *   - Dash-separated forms ("Drum - Fills", "Drums - Breaks").
 * Case-insensitive. Does not overwrite an existing sampleType.
 */
export const createDrumSubcategoryTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getOwnSampleType() !== undefined) return;
    if (entry.getChildNodes().length === 0) return;

    const nameLower = entry.getName().toLowerCase();

    // "Fills" / "Breaks" directly under a Drum(s) folder
    const bareLabel = SUBCATEGORY_MAP.get(nameLower);
    if (bareLabel !== undefined && hasDrumAncestor(entry)) {
      entry.setSampleType(`Drum ${bareLabel}`);
      return;
    }

    // "Drum Fills", "Drums Fill", "Drum - Fills", "Drums - Breaks" etc.
    for (const drumKey of DRUM_KEYS) {
      const spacePrefix = `${drumKey} `;
      if (nameLower.startsWith(spacePrefix)) {
        const rest = nameLower.slice(spacePrefix.length);
        const label = SUBCATEGORY_MAP.get(rest);
        if (label !== undefined) {
          entry.setSampleType(`Drum ${label}`);
          return;
        }
      }

      const dashPrefix = `${drumKey}${DASH_SEP}`;
      if (nameLower.startsWith(dashPrefix)) {
        const rest = nameLower.slice(dashPrefix.length);
        const label = SUBCATEGORY_MAP.get(rest);
        if (label !== undefined) {
          entry.setSampleType(`Drum ${label}`);
          return;
        }
      }
    }
  });
};
