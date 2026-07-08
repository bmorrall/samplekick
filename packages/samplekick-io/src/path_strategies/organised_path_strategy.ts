import type { PathStrategy, LeafNode, FileNode } from "../types";
import { PathResult, SkipResult } from "../types";

// Walk up from the leaf's parent toward the root.
// Collect only directories explicitly set to enabled=true.
// Directories with enabled=false or enabled=undefined are skipped but do not
// stop the walk — ancestors further up can still contribute to the path.
const structuredPathFor = (leaf: FileNode): string => {
  const keptParts: string[] = [];
  let current: FileNode | undefined = leaf.getParentNode();
  while (current?.getParentNode() !== undefined) {
    if (current.isEnabled()) keptParts.unshift(current.getName());
    current = current.getParentNode();
  }
  return [...keptParts, leaf.getName()].join("/");
};

export const OrganisedPathStrategy: PathStrategy = {
  destinationPathFor: (node: LeafNode): PathResult | SkipResult => {
    const sampleType = node.getSampleType();
    const packageName = node.getPackageName();
    if (sampleType === undefined && packageName === undefined) {
      return new SkipResult("Missing sampleType and packageName");
    }
    if (sampleType === undefined) {
      return new SkipResult("Missing sampleType");
    }
    if (packageName === undefined) {
      return new SkipResult("Missing packageName");
    }
    return new PathResult(
      `${sampleType}/${packageName}/${structuredPathFor(node)}`,
    );
  },
};
