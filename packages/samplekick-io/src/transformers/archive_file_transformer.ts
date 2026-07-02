import type { Transform } from "../types";
import {
  ABLETON_PROJECTS,
  FL_STUDIO_PROJECTS,
  PHASE_PLANT_PRESETS,
  SERUM_PRESETS,
} from "./folder_lookup";

const ARCHIVE_TYPE = "Archive";

const PATH_TYPE_MAP = new Map<string, string>([
  ["ableton", ABLETON_PROJECTS],
  ["fl studio", FL_STUDIO_PROJECTS],
  ["phase plant", PHASE_PLANT_PRESETS],
  ["serum", SERUM_PRESETS],
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
 * Detects embedded archive files (e.g. nested .zip files) by extension,
 * marks them readonly (names preserved) and enables their parent directory
 * in the output path. If the path contains exactly one recognised keyword
 * (e.g. "Ableton", "FL Studio"), a more specific sampleType is used instead.
 * Pass `{ tagSampleType: false }` to lock the folder structure without tagging.
 */
export const createArchiveFileTransformer = ({
  tagSampleType = true,
}: { tagSampleType?: boolean } = {}): Transform => ({
  transform: (source) => {
    const parentPathsToEnable = new Set<string>();

    source.eachTransformEntry((entry) => {
      if (entry.getParentNode() === undefined) return; // skip the root archive

      const path = entry.getPath().toLowerCase();

      if (path.endsWith(".zip")) {
        if (tagSampleType && entry.getSampleType() === undefined) {
          entry.setSampleType(resolveArchiveSampleType(entry.getPath()));
        }
        entry.setReadOnly(true);
        const parent = entry.getParentNode();
        if (parent !== undefined) {
          parentPathsToEnable.add(parent.getPath());
        }
      }
    });

    if (parentPathsToEnable.size === 0) return;

    source.eachTransformEntry((entry) => {
      if (parentPathsToEnable.has(entry.getPath())) {
        entry.setEnabled(true);
        entry.setReadOnly(true);
      }
    });
  },
});
