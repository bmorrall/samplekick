import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { ZipDataSource } from "../../../src";

describe("ZipDataSource.fromFile", () => {
  it("loads entries and computes a fingerprint from file contents", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "samplekick-io-zip-"));
    const zipPath = join(tempDir, "example.zip");
    const zipBytes = Buffer.from(
      zipSync({
        "folder/": new Uint8Array(),
        "folder/kick.wav": strToU8("kick"),
        "snare.wav": strToU8("snare"),
      }),
    );

    await writeFile(zipPath, zipBytes);

    try {
      const dataSource = await ZipDataSource.fromFile(zipPath);

      const paths: string[] = [];
      dataSource.eachFileEntry((entry) => {
        paths.push(entry.getPath());
      });

      expect(dataSource.getName()).toBe("example.zip");
      expect(dataSource.getFingerprint()).toBe(
        createHash("sha256").update(zipBytes).digest("hex"),
      );
      expect(paths).toEqual(["folder/kick.wav", "snare.wav"]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
