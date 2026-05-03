export const BIT_DEPTH_16 = 16;
export const BIT_DEPTH_24 = 24;
export const BIT_DEPTH_32 = 32;

export const SAMPLE_RATE_44100 = 44100;
export const SAMPLE_RATE_48000 = 48000;
export const SAMPLE_RATE_96000 = 96000;

const HERTZ_PER_KHZ = 1000;

export const formatSampleRate = (hz: number): string => {
  const khz = hz / HERTZ_PER_KHZ;
  return `${khz} kHz`;
};

export const formatBitDepth = (bits: number): string => `${bits}-bit`;
