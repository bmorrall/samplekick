import type { Transform } from '../types';

/**
 * ArchiveFileTransformer
 * Detects embedded archive files (e.g. nested .zip files) by extension and
 * sets sampleType to "Archive" with keepStructure enabled so their contents
 * are preserved as-is.
 */
export const createArchiveFileTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getSampleType() !== undefined) return;
    if (entry.getParentNode() === undefined) return; // skip the root archive

    const name = entry.getName().toLowerCase();
    const path = entry.getPath().toLowerCase();

    if (name.endsWith('.zip') || path.endsWith('.zip')) {
      entry.setSampleType('Archive');
      entry.setKeepStructure(true);
    }
  });
};
