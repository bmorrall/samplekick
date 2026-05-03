import type { StringTransformer, Transform } from "../types";
import { createSanitiseNameTransformer } from "./sanitise_name_transformer";

const normaliseBracketSpacing: StringTransformer = (name: string): string =>
  name
    .replaceAll(/(?<open>\(|\[|\{) +/gv, "$<open>")
    .replaceAll(/ +(?<close>\)|\]|\})/gv, "$<close>")
    .replaceAll(/(?<before>\S)(?<open>\(|\[|\{)/gv, "$<before> $<open>")
    .replaceAll(/(?<close>\)|\]|\})(?<after>\w|\(|\[|\{)/gv, "$<close> $<after>");

export const NormaliseBracketSpacingTransformer: Transform = createSanitiseNameTransformer(normaliseBracketSpacing);
