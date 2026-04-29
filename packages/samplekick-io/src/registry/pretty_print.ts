import type { EntryNode } from "./entry_node";

export function prettyPrint(node: EntryNode): string {
  return printNode(node, "", true);
}

function printNode(
  node: EntryNode,
  prefix: string,
  showInherited: boolean,
): string {
  const children = node.getChildNodes();
  const tagStr = formatTags(node, showInherited);
  const displayName = node.getName();
  let output = `${prefix}${displayName}${tagStr}\n`;

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
    output += printNode(child, `${childPrefix}${connector}`, false);
  }

  return output;
}

function formatTags(node: EntryNode, showInherited: boolean): string {
  const tags: string[] = [];
  const packageName = showInherited
    ? node.getPackageName()
    : node.getOwnPackageName();
  const sampleType = showInherited
    ? node.getSampleType()
    : node.getOwnSampleType();
  if (packageName !== undefined) tags.push(`pkg:${packageName}`);
  if (sampleType !== undefined) tags.push(`type:${sampleType}`);
  if (node.isSkipped() === true) tags.push("skipped");
  const entryName = node.getEntryName();
  if (!node.isRootNode() && node.getOwnName() !== undefined && node.getOwnName() !== entryName) {
    tags.push(`orig:${entryName}`);
  }
  return tags.length > 0 ? ` [${tags.join(", ")}]` : "";
}
