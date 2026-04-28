import type { Transform } from '../types';

/**
 * DefaultPackageNameTransformer
 * If the entry is the root (no parents), sets the name to the filename without extension.
 */
export const DefaultPackageNameTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getParentNode() !== undefined) return;
    const name = entry.getName();
    if (name === '') return;
    const dotIdx = name.lastIndexOf('.');
    if (dotIdx > 0) {
      entry.setPackageName(name.substring(0, dotIdx));
    }
  });
};
