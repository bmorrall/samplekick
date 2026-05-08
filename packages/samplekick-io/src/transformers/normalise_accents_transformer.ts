import type { Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseAccents = (name: string): string =>
  name.normalize("NFD").replaceAll(/[\u0300-\u036f]/gv, "");

export const createNormaliseAccentsTransformer: Transform = createSanitiseNameTransformer(normaliseAccents);
