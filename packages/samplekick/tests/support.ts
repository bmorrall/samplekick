/**
 * Build a minimal valid PCM WAV buffer with the given bit depth.
 * Layout: standard 44-byte RIFF/WAV header + one silent sample.
 * The bitsPerSample field lives at offset 34 (little-endian uint16).
 */
export const makeWav = (bitsPerSample: number): Buffer => {
  const numChannels = 1;
  const sampleRate = 44100;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = blockAlign; // one silent sample
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);           // PCM
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  return buf;
};
