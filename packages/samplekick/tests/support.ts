/** Minimal valid PCM WAV: mono, 24-bit, 44100 Hz, 1 sample of silence */
export const makeMinimalWav = (): Uint8Array => {
  const buf = Buffer.alloc(47);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(39, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);      // PCM
  buf.writeUInt16LE(1, 22);      // mono
  buf.writeUInt32LE(44100, 24);  // sample rate
  buf.writeUInt32LE(132300, 28); // byte rate (44100 * 3)
  buf.writeUInt16LE(3, 32);      // block align (1 ch * 24-bit / 8)
  buf.writeUInt16LE(24, 34);     // bits per sample
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(3, 40);      // data size (1 sample * 3 bytes)
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
};
