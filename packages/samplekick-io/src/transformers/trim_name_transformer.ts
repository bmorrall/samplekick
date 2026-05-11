import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const trimName: StringTransformer = (name: string): string => name.trim();

const _singleton: Transform = createSanitiseNameTransformer(trimName);
export const createTrimNameTransformer = (): Transform => _singleton;
