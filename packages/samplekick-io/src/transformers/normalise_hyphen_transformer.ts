import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseHyphenSpacing: StringTransformer = (name: string): string =>
  name
    .replaceAll(/(?<before>\S)- /gv, "$<before> - ")
    .replaceAll(/ -(?<after>\S)/gv, " - $<after>");

export const NormaliseHyphenTransformer: Transform = createSanitiseNameTransformer(normaliseHyphenSpacing);
