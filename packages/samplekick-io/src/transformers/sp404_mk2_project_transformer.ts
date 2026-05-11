import type { Transform } from '../types';
import { SP404_MK2_PROJECTS } from './folder_lookup';

const SP404_SMPL_FOLDER = 'SMPL';
const SP404_PTN_FOLDER = 'PTN';

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      const children = entry.getChildNodes();
      if (children.length === 0) return;

      const hasSMPLFolder = children.some(
        (child) => child.getName().toUpperCase() === SP404_SMPL_FOLDER,
      );

      const hasPTNFolder = children.some(
        (child) => child.getName().toUpperCase() === SP404_PTN_FOLDER,
      );

      if (hasSMPLFolder || hasPTNFolder) {
        entry.setSampleType(SP404_MK2_PROJECTS);
        entry.setKeepStructure(true);
      }
    });
  },
};export const createSP404Mk2ProjectTransformer = (): Transform => _singleton;
