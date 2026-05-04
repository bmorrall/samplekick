import type { Transform } from "../types";

const expandCamelCase = (name: string): string => {
  if (name.includes(" ") || !/[a-z][A-Z]/v.test(name)) return name;
  return name
    .replaceAll(/(?<upper>[A-Z]+)(?<next>[A-Z][a-z])/gv, "$<upper> $<next>")
    .replaceAll(/(?<lower>[a-z\d])(?<upper>[A-Z])/gv, "$<lower> $<upper>")
    .replaceAll(/(?<=[a-zA-Z])-/gv, " - ");
};

export const ExpandRootPackageNameTransformer: Transform = (source) => {
  source.eachTransformEntry((entry) => {
    if (entry.getParentNode() !== undefined) return;
    const packageName = entry.getPackageName();
    if (packageName === undefined) return;
    const expanded = expandCamelCase(packageName);
    if (expanded !== packageName) entry.setPackageName(expanded);
  });
};
