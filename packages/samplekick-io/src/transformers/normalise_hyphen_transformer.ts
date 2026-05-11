import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseHyphenSpacing: StringTransformer = (name: string): string =>
  name.replaceAll(/(?:\s|_)+-[\s_]*|[\s_]*-(?:\s|_)+/gv, (match) =>
    match.includes("_") && !match.includes(" ") ? "_-_" : " - ",
  );

const _singleton: Transform = createSanitiseNameTransformer(
  normaliseHyphenSpacing,
);
export const createNormaliseHyphenSpacingTransformer = (): Transform =>
  _singleton;
