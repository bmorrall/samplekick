import type { DevicePreset } from "../types";
import { createSP404Mk2NameTransformer } from "../transformers/sp404_mk2_name_transformer";
import { createTruncateNameTransformer } from "../transformers/truncate_name_transformer";
import { BIT_DEPTH_16, SAMPLE_RATE_48000 } from "../audio_format";
import { PathLengthValidator } from "../validators";

const MAX_NAME_LENGTH = 80;
const MAX_PATH_LENGTH = 255;

export const SP404Mk2Preset: DevicePreset = {
  displayName: "Roland SP-404MKII",
  transforms: [
    createSP404Mk2NameTransformer,
    createTruncateNameTransformer(MAX_NAME_LENGTH),
  ],
  validators: [
    new PathLengthValidator(MAX_PATH_LENGTH),
  ],
  targetBitDepth: BIT_DEPTH_16,
  targetSampleRate: SAMPLE_RATE_48000,
};
