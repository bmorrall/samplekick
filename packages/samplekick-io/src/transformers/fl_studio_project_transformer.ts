import type { Transform } from "../types";
import { FL_STUDIO_PROJECTS } from "./folder_lookup";

/**
 * FLStudioProjectTransformer
 * Detects FL Studio project folders by looking for a child with a ".flp"
 * extension, then marks the directory with sampleType "FL Studio Projects"
 * and keepStructure.
 * Pass `{ tagSampleType: false }` to lock the folder structure without tagging.
 */
export const createFLStudioProjectTransformer = ({
  tagSampleType = true,
}: { tagSampleType?: boolean } = {}): Transform => ({
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      const children = entry.getChildNodes();
      if (children.length === 0) return;

      const hasFlp = children.some((child) =>
        child.getName().toLowerCase().endsWith(".flp"),
      );

      if (hasFlp) {
        if (tagSampleType) entry.setSampleType(FL_STUDIO_PROJECTS);
        entry.setKeepStructure(true);
      }
    });
  },
});
