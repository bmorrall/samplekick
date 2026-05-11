import type { Transform } from '../types';
import { ABLETON_PROJECTS } from './folder_lookup';

/**
 * AbletonProjectTransformer
 * Detects Ableton Live project folders by looking for a child with a ".als"
 * extension, then marks the directory with sampleType "Ableton Projects"
 * and keepStructure.
 */
export const createAbletonProjectTransformer :  Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      const children = entry.getChildNodes();
      if (children.length === 0) return;

      const hasAls = children.some((child) =>
        child.getName().toLowerCase().endsWith('.als'),
      );

      const hasAbletonFolderInfo = children.some(
        (child) => child.getName() === 'Ableton Folder Info',
      );

      if (hasAls || hasAbletonFolderInfo) {
        entry.setSampleType(ABLETON_PROJECTS);
        entry.setKeepStructure(true);
      }
    });
  },
};
