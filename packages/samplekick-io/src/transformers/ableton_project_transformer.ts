import type { Transform } from "../types";
import { ABLETON_PROJECTS } from "./folder_lookup";

/**
 * AbletonProjectTransformer
 * Detects Ableton Live project folders by looking for a child with a ".als"
 * extension, then marks the directory with sampleType "Ableton Projects",
 * sets it enabled (path preserved) and readonly (names locked).
 * All descendant directories are also enabled. Readonly inherits automatically.
 * Pass `{ tagSampleType: false }` to lock the folder structure without tagging.
 */
export const createAbletonProjectTransformer = ({
  tagSampleType = true,
}: { tagSampleType?: boolean } = {}): Transform => ({
  transform: (source) => {
    const projectPaths = new Set<string>();

    source.eachTransformEntry((entry) => {
      const children = entry.getChildNodes();
      if (children.length === 0) return;

      const hasAls = children.some((child) =>
        child.getName().toLowerCase().endsWith(".als"),
      );

      const hasAbletonFolderInfo = children.some(
        (child) => child.getName() === "Ableton Folder Info",
      );

      if (hasAls || hasAbletonFolderInfo) {
        if (tagSampleType) entry.setSampleType(ABLETON_PROJECTS);
        entry.setEnabled(true);
        entry.setReadOnly(true);
        projectPaths.add(entry.getPath());
      }
    });

    if (projectPaths.size === 0) return;

    source.eachTransformEntry((entry) => {
      if (entry.isFile()) return;
      const path = entry.getPath();
      for (const projectPath of projectPaths) {
        if (path.startsWith(`${projectPath}/`)) {
          entry.setEnabled(true);
          entry.setReadOnly(true);
          break;
        }
      }
    });
  },
});
