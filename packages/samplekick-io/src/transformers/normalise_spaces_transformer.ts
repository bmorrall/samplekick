import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseSpaces: StringTransformer = (name: string): string => {
  const hasSpace = name.includes(" ");
  return name
    .replaceAll(/ {2,}/gv, " ")
    .replaceAll(/_{2,}/gv, "_")
    .replaceAll(/_/gv, hasSpace ? " " : "_");
};

export const NormaliseSpacesTransformer: Transform = createSanitiseNameTransformer(normaliseSpaces);
