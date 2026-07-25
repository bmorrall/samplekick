import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SourcePathStrategy, OrganisedPathStrategy } from "../../src";
import { EXPORT_MANIFEST_DIR } from "../../src/io/export_manifest";
import { createZipRegistry } from "../support";

const fingerprintFor = (name: string): string =>
  createHash("sha256").update(name).digest("hex");

describe("Registry.exportToDirectory export manifest", () => {
  it("records originalPath/outputPath entries in a manifest keyed by fingerprint", async () => {
    const registry = await createZipRegistry("pack.zip", {
      "kick.wav": "kick-data",
      "snare.wav": "snare-data",
    });
    registry.setPathStrategy(SourcePathStrategy);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-io-manifest-"));
    try {
      await registry.exportToDirectory(tmpDir, {});

      const manifestPath = join(
        tmpDir,
        EXPORT_MANIFEST_DIR,
        fingerprintFor("pack.zip"),
      );
      const contents = await readFile(manifestPath, "utf8");
      expect(contents).toBe(
        [
          "originalPath,outputPath",
          "kick.wav,kick.wav",
          "snare.wav,snare.wav",
        ].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("cleans up the stale output file when re-exporting after a rename", async () => {
    const registry = await createZipRegistry("pack.zip", {
      "kick.wav": "kick-data",
    });
    registry.setPathStrategy(SourcePathStrategy);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-io-manifest-"));
    try {
      await registry.exportToDirectory(tmpDir, {});
      expect(await readFile(join(tmpDir, "kick.wav"), "utf8")).toBe(
        "kick-data",
      );

      registry.setName("kick.wav", "renamed-kick.wav");
      await registry.exportToDirectory(tmpDir, {});

      const files = await readdir(tmpDir);
      expect(files.sort()).toStrictEqual([
        EXPORT_MANIFEST_DIR,
        "renamed-kick.wav",
      ]);
      expect(await readFile(join(tmpDir, "renamed-kick.wav"), "utf8")).toBe(
        "kick-data",
      );

      const manifestPath = join(
        tmpDir,
        EXPORT_MANIFEST_DIR,
        fingerprintFor("pack.zip"),
      );
      expect(await readFile(manifestPath, "utf8")).toBe(
        ["originalPath,outputPath", "kick.wav,renamed-kick.wav"].join("\n"),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("tracks a different archive's exports in its own manifest file, without touching the other", async () => {
    const registryA = await createZipRegistry("pack-a.zip", {
      "kick.wav": "a-data",
    });
    registryA.setPathStrategy(SourcePathStrategy);
    const registryB = await createZipRegistry("pack-b.zip", {
      "kick.wav": "b-data",
    });
    registryB.setPathStrategy(OrganisedPathStrategy);
    registryB.setPackageName("pack-b");
    registryB.setSampleType("loops");

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-io-manifest-"));
    try {
      await registryA.exportToDirectory(tmpDir, {});
      await registryB.exportToDirectory(tmpDir, {});

      const manifestDir = join(tmpDir, EXPORT_MANIFEST_DIR);
      const manifestFiles = await readdir(manifestDir);
      expect(manifestFiles.sort()).toStrictEqual(
        [fingerprintFor("pack-a.zip"), fingerprintFor("pack-b.zip")].sort(),
      );

      expect(
        await readFile(join(manifestDir, fingerprintFor("pack-a.zip")), "utf8"),
      ).toBe(["originalPath,outputPath", "kick.wav,kick.wav"].join("\n"));
      expect(
        await readFile(join(manifestDir, fingerprintFor("pack-b.zip")), "utf8"),
      ).toBe(
        ["originalPath,outputPath", "kick.wav,loops/pack-b/kick.wav"].join(
          "\n",
        ),
      );
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it("does not create an export manifest directory during a dry run", async () => {
    const registry = await createZipRegistry("pack.zip", {
      "kick.wav": "kick-data",
    });
    registry.setPathStrategy(SourcePathStrategy);

    await registry.exportToDirectory(undefined, {});
    // No directory was ever created for a dry run — nothing to assert on disk,
    // this just confirms exportToDirectory(undefined, ...) doesn't throw trying
    // to read/write a manifest with no destination directory.
  });

  it("keeps the manifest stable when re-exporting without any changes", async () => {
    const registry = await createZipRegistry("pack.zip", {
      "kick.wav": "kick-data",
    });
    registry.setPathStrategy(SourcePathStrategy);

    const tmpDir = await mkdtemp(join(tmpdir(), "samplekick-io-manifest-"));
    try {
      const manifestPath = join(
        tmpDir,
        EXPORT_MANIFEST_DIR,
        fingerprintFor("pack.zip"),
      );

      await registry.exportToDirectory(tmpDir, {});
      const firstRun = await readFile(manifestPath, "utf8");
      expect(firstRun).toBe(
        ["originalPath,outputPath", "kick.wav,kick.wav"].join("\n"),
      );

      await registry.exportToDirectory(tmpDir, {});
      const secondRun = await readFile(manifestPath, "utf8");
      expect(secondRun).toBe(firstRun);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
