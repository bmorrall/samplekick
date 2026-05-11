import type { Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseQuotes = (name: string): string =>
  name
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201C", '"')
    .replaceAll("\u201D", '"');

const _singleton: Transform = createSanitiseNameTransformer(normaliseQuotes);
export const createNormaliseQuotesTransformer = (): Transform => _singleton;
