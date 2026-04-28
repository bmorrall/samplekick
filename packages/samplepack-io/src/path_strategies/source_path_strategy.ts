import type { PathStrategy, FileNode } from "../types";

export const SourcePathStrategy: PathStrategy = {
  destinationPathFor: (node: FileNode): string | undefined => {
    const parts: string[] = [];
    let current: FileNode | undefined = node;
    while (current?.getParentNode() !== undefined) {
      parts.unshift(current.getName());
      current = current.getParentNode();
    }
    if (parts.length === 0) return undefined;
    return parts.join("/");
  },
};
