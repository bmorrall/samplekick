import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ExportManifest,
  EXPORT_MANIFEST_DIR,
} from "../../../src/io/export_manifest";

describe("ExportManifest", () => {
  let tmpDir = "";

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "samplekick-io-manifest-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("returns an empty manifest when the file does not exist", async () => {
    const manifest = await ExportManifest.load(join(tmpDir, "missing"));

    expect(manifest.get("a.wav")).toBeUndefined();
  });

  it("rethrows non-ENOENT errors", async () => {
    // Reading a directory as if it were a file triggers EISDIR, not ENOENT.
    await expect(ExportManifest.load(tmpDir)).rejects.toThrow();
  });

  it("stores and retrieves entries", async () => {
    const manifest = await ExportManifest.load(join(tmpDir, "missing"));
    manifest.set("kick.wav", "loops/pack/kick.wav");

    expect(manifest.get("kick.wav")).toBe("loops/pack/kick.wav");
  });

  it("deletes entries", async () => {
    const manifest = await ExportManifest.load(join(tmpDir, "missing"));
    manifest.set("kick.wav", "loops/pack/kick.wav");
    manifest.delete("kick.wav");

    expect(manifest.get("kick.wav")).toBeUndefined();
  });

  it("round-trips entries through save and load, creating the parent directory", async () => {
    const manifestPath = join(tmpDir, EXPORT_MANIFEST_DIR, "abc123");
    const manifest = await ExportManifest.load(manifestPath);
    manifest.set("kick.wav", "loops/pack/kick.wav");
    manifest.set("snare.mp3", "loops/pack/snare.wav");

    await manifest.save(manifestPath);

    const reloaded = await ExportManifest.load(manifestPath);
    expect(reloaded.get("kick.wav")).toBe("loops/pack/kick.wav");
    expect(reloaded.get("snare.mp3")).toBe("loops/pack/snare.wav");
  });

  it("writes a CSV header and sorted rows", async () => {
    const manifestPath = join(tmpDir, EXPORT_MANIFEST_DIR, "abc123");
    const manifest = await ExportManifest.load(manifestPath);
    manifest.set("b.wav", "loops/pack/b.wav");
    manifest.set("a.wav", "loops/pack/a.wav");

    await manifest.save(manifestPath);

    const contents = await readFile(manifestPath, "utf8");
    expect(contents).toBe(
      [
        "originalPath,outputPath",
        "a.wav,loops/pack/a.wav",
        "b.wav,loops/pack/b.wav",
      ].join("\n"),
    );
  });

  it("quotes fields containing commas or quotes", async () => {
    const manifestPath = join(tmpDir, EXPORT_MANIFEST_DIR, "abc123");
    const manifest = await ExportManifest.load(manifestPath);
    manifest.set('weird, "name".wav', "loops/pack/weird.wav");

    await manifest.save(manifestPath);

    const reloaded = await ExportManifest.load(manifestPath);
    expect(reloaded.get('weird, "name".wav')).toBe("loops/pack/weird.wav");
  });
});
