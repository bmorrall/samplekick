import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const GHOSTHACK_PREFIX_RE = /^Ghosthack[\s_]*-?[\s_]*(?!x\s)(?=\S)/iv;

const normaliseGhosthackPrefix: StringTransformer = (name: string): string =>
  name.replace(GHOSTHACK_PREFIX_RE, "Ghosthack - ");

export const createGhosthackNameTransformer : Transform = createSanitiseNameTransformer(normaliseGhosthackPrefix);
