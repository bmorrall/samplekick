import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const trimName: StringTransformer = (name: string): string => name.trim();

export const TrimNameTransformer: Transform = createSanitiseNameTransformer(trimName);
