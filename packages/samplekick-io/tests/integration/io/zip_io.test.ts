import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OrganisedPathStrategy } from "../../../src";
import { createZipRegistry } from "../../support";

describe("ZIP I/O", () => {
  it("loads zip file entries into the registry through the FileSource interface", async () => {
    const registry = await createZipRegistry("example.zip", {
      "jazz/": "",
      "jazz/bebop/track01.wav": "track01",
      "jazz/bebop/track02.wav": "track02",
      "rock/track01.wav": "track01",
    });

    const paths: string[] = [];
    registry.eachFileEntry((entry) => {
      paths.push(entry.getPath());
    });

    expect(paths).toEqual([
      "jazz/bebop/track01.wav",
      "jazz/bebop/track02.wav",
      "rock/track01.wav",
    ]);
  });

  it("zip entries expose no metadata by default", async () => {
    const registry = await createZipRegistry("example.zip", { "a/b.wav": "data" });

    const entry = registry.getEntry("a/b.wav");
    expect(entry?.getPackageName()).toBeUndefined();
    expect(entry?.getSampleType()).toBeUndefined();
    expect(entry?.isSkipped()).toBeUndefined();
    expect(entry?.isKeepStructure()).toBeUndefined();
  });

  it("exports all entries to a directory via exportToDirectory", async () => {
    const registry = await createZipRegistry("example.zip", {
      "jazz/bebop/track01.wav": "track01-data",
      "jazz/bebop/track02.wav": "track02-data",
    });
    registry.setPathStrategy(OrganisedPathStrategy);
    registry.setPackageName("jazz-pack");
    registry.setSampleType("loops");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-io-"));
    try {
      await registry.exportToDirectory(tmpDir);
      expect(
        await readFile(join(tmpDir, "loops/jazz-pack/track01.wav"), "utf8"),
      ).toBe("track01-data");
      expect(
        await readFile(join(tmpDir, "loops/jazz-pack/track02.wav"), "utf8"),
      ).toBe("track02-data");
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
