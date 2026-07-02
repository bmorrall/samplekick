import type { EntryNode } from "./entry_node";

export function prettyPrint(node: EntryNode, verbose = false): string {
  return printNode(node, "", true, verbose);
}

function hasEnabledDescendant(node: EntryNode): boolean {
  if (node.isFile()) return node.isEnabled();
  return node.getChildNodes().some(hasEnabledDescendant);
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

  if (!node.isFile() && children.length > 0 && !hasEnabledDescendant(node)) {
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
    const childEnabled = !child.isFile() && child.isEnabled();
    const childPrefix = prefix
      .replace(/├── /gv, "│   ")
      .replace(/└── /gv, "    ")
      .replace(/┣━━ /gv, "┃   ")
      .replace(/┗━━ /gv, "    ");
    const connector = childEnabled
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
  return (
    !node.isRootNode() &&
    node.getOwnName() !== undefined &&
    node.getOwnName() !== node.getEntryName()
  );
}

function isMissingRequired(node: EntryNode): boolean {
  return (
    node.isFile() &&
    node.getChildNodes().length === 0 &&
    (node.getPackageName() === undefined || node.getSampleType() === undefined)
  );
}

function buildTags(
  node: EntryNode,
  showInherited: boolean,
  verbose: boolean,
): string[] {
  const packageName = showInherited
    ? node.getPackageName()
    : node.getOwnPackageName();
  const sampleType = showInherited
    ? node.getSampleType()
    : node.getOwnSampleType();
  const isRenamed = isNodeRenamed(node);
  const tags: string[] = [];
  if (isRenamed) tags.push("renamed");
  if (packageName !== undefined) tags.push(`pkg:${packageName}`);
  if (sampleType !== undefined) tags.push(`type:${sampleType}`);
  if (!node.isEnabled()) tags.push("skipped");
  if (verbose && isRenamed) tags.push(`orig:${node.getEntryName()}`);
  return tags;
}

function formatTags(
  node: EntryNode,
  showInherited: boolean,
  verbose: boolean,
): string {
  const tags = buildTags(node, showInherited, verbose);
  const tagStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";
  return isMissingRequired(node) ? ` [?]${tagStr}` : tagStr;
}
