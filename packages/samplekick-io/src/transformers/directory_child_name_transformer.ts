import type { FileNode, Transform, TransformEntry } from '../types';
import { lookupStandalone } from './folder_lookup';

const DASH_SEP = ' - ';

// Strip the file extension from a name segment (e.g. "Coin Drop 3.wav" → "Coin Drop 3").
const stripExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};

function getSegments(child: FileNode): Set<string> {
  const name = child.getName();
  if (!name.includes(DASH_SEP)) return new Set();
  const parts = name.toLowerCase().split(DASH_SEP);
  const lastIdx = parts.length - 1;
  parts[lastIdx] = stripExtension(parts[lastIdx]);
  return new Set(parts.map((p) => p.trim()));
}

function findCommonKnownType(entry: TransformEntry): string | undefined {
  const fileChildren = entry.getChildNodes().filter((c) => c.isFile());
  const qualifying = fileChildren.filter((c) => c.getName().includes(DASH_SEP));
  if (qualifying.length === 0) return undefined;

  const [first, ...rest] = qualifying.map(getSegments);
  const common = new Set([...first].filter((seg) => rest.every((set) => set.has(seg))));

  const knownMatches = [...common]
    .map(lookupStandalone)
    .filter((t): t is string => t !== undefined);
  if (knownMatches.length !== 1) return undefined;
  return knownMatches[0];
}

/**
 * DirectoryChildNameTransformer
 * For directories that have not yet been assigned a sampleType, inspects the
 * names of their immediate file children. If those file names all share a common
 * " - "-delimited segment that resolves to a known standalone sampleType, the
 * directory is tagged with that type.
 * e.g. children named "Brand - Foley - Coin Drop.wav" and "Brand - Foley - Hit.wav"
 * share the segment "Foley" → directory is tagged "Foley".
 * Works with a single child file (no intersection required for uniqueness).
 * Must run after createDirectorySampleTypeTransformer.
 */
export const createDirectoryChildNameTransformer: Transform = {
  transform: (source) => {
    source.eachTransformEntry((entry) => {
      if (entry.getOwnSampleType() !== undefined) return;
      if (entry.getChildNodes().length === 0) return;
      const sampleType = findCommonKnownType(entry);
      if (sampleType === undefined) return;
      entry.setSampleType(sampleType);
    });
  },
};
