import type { Transform } from '../types';

/**
 * SkipJunkTransformer
 * Marks entries as skipped if their name is "__MACOSX" or starts with ".".
 */
export const SkipJunkTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    const name = entry.getName();
    if (name === '__MACOSX' || name.startsWith('.')) {
      entry.setSkipped(true);
    }
  });
};
