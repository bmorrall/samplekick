import type { PathStrategy, LeafNode, FileNode } from "../types";
import { PathResult } from "../types";

export const SourcePathStrategy: PathStrategy = {
  destinationPathFor: (node: LeafNode): PathResult => {
    const parts: string[] = [node.getName()];
    let current: FileNode = node.getParentNode();
    let parent: FileNode | undefined = current.getParentNode();
    while (parent !== undefined) {
      parts.unshift(current.getName());
      current = parent;
      parent = current.getParentNode();
    }
    return new PathResult(parts.join("/"));
  },
};
