import type { DevicePreset } from "../types";
import { createStripAccentsTransform } from "../transformers/strip_accents_transformer";
import { createAllowedCharactersTransform } from "../transformers/allowed_characters_transformer";
import { createTruncateNameTransformer } from "../transformers/truncate_name_transformer";
import { BIT_DEPTH_16, SAMPLE_RATE_48000 } from "../audio_format";
import { createPathLengthValidator } from "../validators";

const MAX_NAME_LENGTH = 80;
const MAX_PATH_LENGTH = 255;

const SP404_ALLOWED_PUNCTUATION = new Set([
  " ",
  "-",
  "_",
  "!",
  "&",
  "(",
  ")",
  "+",
  ",",
  "=",
  "@",
  "[",
  "]",
  "{",
  "}",
  "'",
]);

export const SP404Mk2Preset: DevicePreset = {
  displayName: "Roland SP-404MKII",
  transforms: [
    createStripAccentsTransform,
    createAllowedCharactersTransform(SP404_ALLOWED_PUNCTUATION),
    createTruncateNameTransformer(MAX_NAME_LENGTH),
  ],
  validators: [
    createPathLengthValidator(MAX_PATH_LENGTH),
  ],
  targetBitDepth: BIT_DEPTH_16,
  targetSampleRate: SAMPLE_RATE_48000,
};
