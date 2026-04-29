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
  const isRenamed = !node.isRootNode() && node.getOwnName() !== undefined && node.getOwnName() !== node.getEntryName();
  const displayName = node.getName() + (!verbose && isRenamed ? "*" : "");
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
    output += printNode(child, `${childPrefix}${connector}`, verbose, verbose);
  }

  return output;
}

function formatTags(node: EntryNode, showInherited: boolean, verbose: boolean): string {
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
  if (verbose) {
    const entryName = node.getEntryName();
    if (!node.isRootNode() && node.getOwnName() !== undefined && node.getOwnName() !== entryName) {
      tags.push(`orig:${entryName}`);
    }
  }
  return tags.length > 0 ? ` [${tags.join(", ")}]` : "";
}
