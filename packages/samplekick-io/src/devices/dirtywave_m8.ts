import type { DevicePreset } from "../types";
import { BIT_DEPTH_16, SAMPLE_RATE_44100 } from "../audio_format";

export const DirtywaveM8Preset: DevicePreset = {
  displayName: "Dirtywave M8",
  transforms: [],
  targetBitDepth: BIT_DEPTH_16,
  targetSampleRate: SAMPLE_RATE_44100,
};
