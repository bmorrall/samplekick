import type { EntryNode } from "./entry_node";

export function prettyPrint(node: EntryNode, verbose = false): string {
  return printNode(node, "", true, verbose);
}

function printNode(
  node: EntryNode,
  prefix: string,
  showInherited: boolean,
  verbose: boolean,
): string {
  const children = node.getChildNodes();
  const tagStr = formatTags(node, showInherited, verbose);
  const displayName = node.getName();
  let output = `${prefix}${displayName}${tagStr}\n`;

  if (node.isSkipped() === true && children.length > 0) {
    const childPrefix = prefix
      .replace(/├── /gv, "│   ")
      .replace(/└── /gv, "    ")
      .replace(/┣━━ /gv, "┃   ")
      .replace(/┗━━ /gv, "    ");
    output += `${childPrefix}└── ...\n`;
    return output;
  }

  const lastIndex = children.length - 1;
  for (const [i, child] of children.entries()) {
    const isLast = i === lastIndex;
    const keepStructure = child.getOwnKeepStructure() === true;
    const childPrefix = prefix
      .replace(/├── /gv, "│   ")
      .replace(/└── /gv, "    ")
      .replace(/┣━━ /gv, "┃   ")
      .replace(/┗━━ /gv, "    ");
    const connector = keepStructure
      ? isLast
        ? "┗━━ "
        : "┣━━ "
      : isLast
        ? "└── "
        : "├── ";
    output += printNode(child, `${childPrefix}${connector}`, verbose, verbose);
  }

  return output;
}

function isNodeRenamed(node: EntryNode): boolean {
  return !node.isRootNode() && node.getOwnName() !== undefined && node.getOwnName() !== node.getEntryName();
}

function formatTags(node: EntryNode, showInherited: boolean, verbose: boolean): string {
  const tags: string[] = [];
  const packageName = showInherited
    ? node.getPackageName()
    : node.getOwnPackageName();
  const sampleType = showInherited
    ? node.getSampleType()
    : node.getOwnSampleType();
  const isRenamed = isNodeRenamed(node);
  if (isRenamed) tags.push("renamed");
  if (packageName !== undefined) tags.push(`pkg:${packageName}`);
  if (sampleType !== undefined) tags.push(`type:${sampleType}`);
  if (node.isSkipped() === true) tags.push("skipped");
  if (verbose && isRenamed) {
    tags.push(`orig:${node.getEntryName()}`);
  }
  return tags.length > 0 ? ` [${tags.join(", ")}]` : "";
}
