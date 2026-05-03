import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseSpaces: StringTransformer = (name: string): string =>
  name.replaceAll(/ {2,}/gv, " ");

export const NormaliseSpacesTransformer: Transform = createSanitiseNameTransformer(normaliseSpaces);
