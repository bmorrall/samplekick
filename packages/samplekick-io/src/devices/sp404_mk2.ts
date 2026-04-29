import type { DevicePreset } from "../types";
import { SP404Mk2NameTransformer } from "../transformers/sp404_mk2_name_transformer";

export const SP404Mk2Preset: DevicePreset = {
  displayName: "Roland SP-404MKII",
  transforms: [SP404Mk2NameTransformer],
};
