import type { Transform } from "../types";
import { FL_STUDIO_PROJECTS } from "./folder_lookup";

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      const children = entry.getChildNodes();
      if (children.length === 0) return;

      const hasFlp = children.some((child) =>
        child.getName().toLowerCase().endsWith(".flp"),
      );

      if (hasFlp) {
        entry.setSampleType(FL_STUDIO_PROJECTS);
        entry.setKeepStructure(true);
      }
    });
  },
};
/**
 * FLStudioProjectTransformer
 * Detects FL Studio project folders by looking for a child with a ".flp"
 * extension, then marks the directory with sampleType "FL Studio Projects"
 * and keepStructure.
 */
export const createFLStudioProjectTransformer = (): Transform => _singleton;
