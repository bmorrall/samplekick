import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseHyphenSpacing: StringTransformer = (name: string): string =>
  name.replaceAll(/(?:\s|_)+-[\s_]*|[\s_]*-(?:\s|_)+/gv, (match) =>
    match.includes("_") && !match.includes(" ") ? "_-_" : " - "
  );

export const NormaliseHyphenTransformer: Transform = createSanitiseNameTransformer(normaliseHyphenSpacing);
