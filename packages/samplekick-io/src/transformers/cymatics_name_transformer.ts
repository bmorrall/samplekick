import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const CYMATICS_PREFIX_RE = /^Cymatics[\s_]*-?[\s_]*(?!x\s)(?=\S)/iv;

const normaliseCymaticsPrefix: StringTransformer = (name: string): string =>
  name.replace(CYMATICS_PREFIX_RE, "Cymatics - ");

const _singleton: Transform = createSanitiseNameTransformer(
  normaliseCymaticsPrefix,
);
export const createCymaticsNameTransformer = (): Transform => _singleton;
