import type { PathStrategy, FileNode } from "../types";

// Walk up from the leaf, collecting names while keepStructure is true and node is not root
const structuredPathFor = (leaf: FileNode): string => {
  const nodes: string[] = [];
  let current: FileNode | undefined = leaf;
  while (current?.getParentNode() !== undefined) {
    if (current.isKeepStructure() === true) {
      nodes.unshift(current.getName());
    } else {
      break;
    }
    current = current.getParentNode();
  }
  if (nodes.length > 0) {
    return nodes.join("/");
  }
  return leaf.getName();
};

export const OrganisedPathStrategy: PathStrategy = {
  destinationPathFor: (node: FileNode): string | undefined => {
    const sampleType = node.getSampleType();
    const packageName = node.getPackageName();
    if (sampleType === undefined || packageName === undefined) {
      return undefined;
    }
    return `${sampleType}/${packageName}/${structuredPathFor(node)}`;
  },
};
