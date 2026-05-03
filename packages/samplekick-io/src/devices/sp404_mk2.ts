import type { DevicePreset } from "../types";
import { SP404Mk2NameTransformer } from "../transformers/sp404_mk2_name_transformer";
import { BIT_DEPTH_16, SAMPLE_RATE_48000 } from "../audio_format";

export const SP404Mk2Preset: DevicePreset = {
  displayName: "Roland SP-404MKII",
  transforms: [SP404Mk2NameTransformer],
  targetBitDepth: BIT_DEPTH_16,
  targetSampleRate: SAMPLE_RATE_48000,
};
