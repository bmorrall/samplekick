import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

// Matches en dash (–), em dash (—), horizontal bar (―), figure dash (‒),
// small em dash (﹘), and fullwidth hyphen-minus (－).
const DASH_RE = /[–—―‒﹘－]/gv;

const normaliseDashes: StringTransformer = (name: string): string =>
  name.replace(DASH_RE, "-");

const _singleton: Transform = createSanitiseNameTransformer(normaliseDashes);
export const createNormaliseDashesTransformer = (): Transform => _singleton;
