import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const GHOSTHACK_PREFIX_RE = /^Ghosthack[\s_]*-?[\s_]*(?=\S)/iv;

const normaliseGhosthackPrefix: StringTransformer = (name: string): string =>
  name.replace(GHOSTHACK_PREFIX_RE, "Ghosthack - ");

export const GhosthackNameTransformer: Transform = createSanitiseNameTransformer(normaliseGhosthackPrefix);
