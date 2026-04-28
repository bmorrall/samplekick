import { zipSync, strToU8 } from "fflate";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Registry, ZipDataSource, OrganisedPathStrategy } from "../../../src";

const makeZipBlob = (files: Record<string, string>): Blob => {
  const entries = Object.fromEntries(
    Object.entries(files).map(([path, content]) => [path, strToU8(content)]),
  );
  return new Blob([Buffer.from(zipSync(entries))]);
};

describe("ZIP I/O", () => {
  it("loads zip file entries into the registry through the FileSource interface", async () => {
    const blob = makeZipBlob({
      "jazz/": "",
      "jazz/bebop/track01.wav": "track01",
      "jazz/bebop/track02.wav": "track02",
      "rock/track01.wav": "track01",
    });
    const dataSource = await ZipDataSource.fromBlob(blob);
    const registry = new Registry("library");

    registry.load(dataSource);

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
    const dataSource = await ZipDataSource.fromBlob(
      makeZipBlob({ "a/b.wav": "data" }),
    );
    const registry = new Registry("library");
    registry.load(dataSource);

    const entry = registry.getEntry("a/b.wav");
    expect(entry?.getPackageName()).toBeUndefined();
    expect(entry?.getSampleType()).toBeUndefined();
    expect(entry?.isSkipped()).toBeUndefined();
    expect(entry?.isKeepStructure()).toBeUndefined();
  });

  it("exports all entries to a directory via exportToDirectory", async () => {
    const dataSource = await ZipDataSource.fromBlob(
      makeZipBlob({
        "jazz/bebop/track01.wav": "track01-data",
        "jazz/bebop/track02.wav": "track02-data",
      }),
    );
    const registry = new Registry("library");
    registry.load(dataSource);
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
