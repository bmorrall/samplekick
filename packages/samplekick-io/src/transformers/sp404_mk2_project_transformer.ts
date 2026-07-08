import type { Transform } from "../types";
import { SP404_MK2_PROJECTS } from "./folder_lookup";

const SP404_SMPL_FOLDER = "SMPL";
const SP404_PTN_FOLDER = "PTN";

export const createSP404Mk2ProjectTransformer = ({
  tagSampleType = true,
}: { tagSampleType?: boolean } = {}): Transform => ({
  transform: (source) => {
    const projectPaths = new Set<string>();

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
        if (tagSampleType) entry.setSampleType(SP404_MK2_PROJECTS);
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
