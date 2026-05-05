import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseCommaSpacing: StringTransformer = (name: string): string =>
  name.replaceAll(/[\s_]+,[\s_]*|[\s_]*,[\s_]+/gv, (match) =>
    match.includes("_") && !match.includes(" ") ? ",_" : ", "
  );

export const NormaliseCommaSpacingTransformer: Transform = createSanitiseNameTransformer(normaliseCommaSpacing);
