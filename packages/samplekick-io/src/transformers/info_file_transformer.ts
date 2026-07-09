import type { Transform } from "../types";

const INFO_FILE_EXTENSIONS = [".txt", ".url", ".pdf"] as const;

const isInfoFile = (name: string): boolean =>
  INFO_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));

const _singleton: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (!entry.isFile()) return;
      if (entry.isReadOnly() === true) return;
      if (!isInfoFile(entry.getName().toLowerCase())) return;
      entry.setEnabled(false);
    });
  },
};

/**
 * InfoFileTransformer
 * Sets enabled: false for .txt, .url, and .pdf files unless the entry is
 * read-only. These files are typically documentation bundled with sample packs
 * and do not need to be included in exports.
 */
export const createInfoFileTransformer = (): Transform => _singleton;
