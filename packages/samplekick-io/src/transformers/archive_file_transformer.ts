import type { Transform } from '../types';
import { ABLETON_PROJECTS, FL_STUDIO_PROJECTS, PHASE_PLANT_PRESETS, SERUM_PRESETS } from './folder_lookup';

const ARCHIVE_TYPE = 'Archive';

const PATH_TYPE_MAP = new Map<string, string>([
  ['ableton', ABLETON_PROJECTS],
  ['fl studio', FL_STUDIO_PROJECTS],
  ['phase plant', PHASE_PLANT_PRESETS],
  ['serum', SERUM_PRESETS],
]);

function resolveArchiveSampleType(path: string): string {
  const pathLower = path.toLowerCase();
  const matches: string[] = [];
  for (const [key, type] of PATH_TYPE_MAP) {
    if (pathLower.includes(key)) matches.push(type);
  }
  if (matches.length !== 1) return ARCHIVE_TYPE;
  const [sampleType] = matches;
  return sampleType;
}

/**
 * ArchiveFileTransformer
 * Detects embedded archive files (e.g. nested .zip files) by extension and
 * sets sampleType to "Archive" with keepStructure enabled so their contents
 * are preserved as-is. If the path contains exactly one recognised keyword
 * (e.g. "Ableton", "FL Studio"), a more specific sampleType is used instead.
 */
const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getSampleType() !== undefined) return;
      if (entry.getParentNode() === undefined) return; // skip the root archive

      const path = entry.getPath().toLowerCase();

      if (path.endsWith('.zip')) {
        entry.setSampleType(resolveArchiveSampleType(entry.getPath()));
        entry.setKeepStructure(true);
      }
    });
  },
};
export const createArchiveFileTransformer = (): Transform => _singleton;
