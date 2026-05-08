import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const SQUASH_RE = /[\-\s_]+/v;

const squashToCamelCase: StringTransformer = (name: string): string => {
  const words = name.split(SQUASH_RE).filter(Boolean);
  return words
    .map((word, i) => i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

export const createSquashNameTransformer : Transform = createSanitiseNameTransformer(squashToCamelCase);
