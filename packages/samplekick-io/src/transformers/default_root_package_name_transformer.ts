import type { Transform } from '../types';

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getParentNode() !== undefined) return;
      const name = entry.getName();
      if (name === '') return;
      const dotIdx = name.lastIndexOf('.');
      if (dotIdx > 0) {
        entry.setPackageName(name.substring(0, dotIdx));
      }
    });
  },
};
export const createDefaultRootPackageNameTransformer = (): Transform => _singleton;
