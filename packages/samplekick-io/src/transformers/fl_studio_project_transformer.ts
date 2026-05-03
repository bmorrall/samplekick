import type { Transform } from '../types';

/**
 * FLStudioProjectTransformer
 * Detects FL Studio project folders by looking for a child with a ".flp"
 * extension, then marks the directory with sampleType "FL Studio Projects"
 * and keepStructure.
 */
export const FLStudioProjectTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    const children = entry.getChildNodes();
    if (children.length === 0) return;

    const hasFlp = children.some((child) =>
      child.getName().toLowerCase().endsWith('.flp'),
    );

    if (hasFlp) {
      entry.setSampleType('FL Studio Projects');
      entry.setKeepStructure(true);
    }
  });
};
