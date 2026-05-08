import type { DevicePreset } from "../types";
import { BIT_DEPTH_16, SAMPLE_RATE_44100 } from "../audio_format";
import { createPathLengthValidator } from "../validators";

const MAX_PATH_LENGTH = 127;

export const DirtywaveM8Preset: DevicePreset = {
  displayName: "Dirtywave M8",
  transforms: [],
  validators: [
    createPathLengthValidator(MAX_PATH_LENGTH),
  ],
  targetBitDepth: BIT_DEPTH_16,
  targetSampleRate: SAMPLE_RATE_44100,
};
