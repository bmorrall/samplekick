import { describe, expect, it, vi } from "vitest";
import { Registry, OrganisedPathStrategy, SkipResult } from "../../src";
import type { ConfigEntry, FileEntry } from "../../src";
import { createFileEntry, createFileSource } from "../support";

const createCopyableEntry = (path: string): FileEntry => ({
  ...createFileEntry({ path }),
  copyToPath: vi.fn<(path: string) => Promise<void>>(),
});

describe("Registry.exportToDirectory", () => {
  it("calls copyToPath on each leaf node with the destination path", async () => {
    const entryA = createCopyableEntry("a.wav");
    const entryB = createCopyableEntry("b.wav");
    const registry = new Registry(createFileSource("root", [entryA, entryB]));
    registry.setPathStrategy(OrganisedPathStrategy);
    registry.setPackageName("my-pack");
    registry.setSampleType("loops");

    await registry.exportToDirectory("/output", {});

    expect(entryA.copyToPath).toHaveBeenCalledWith(
      "/output/loops/my-pack/a.wav",
    );
    expect(entryB.copyToPath).toHaveBeenCalledWith(
      "/output/loops/my-pack/b.wav",
    );
  });

  it("skips entries where pathStrategy returns skip", async () => {
    const entry = createCopyableEntry("a.wav");
    const registry = new Registry(createFileSource("root", [entry]));
    // use a custom strategy that always returns skip
    registry.setPathStrategy({ destinationPathFor: () => new SkipResult("test") });

    await registry.exportToDirectory("/output", {});

    expect(entry.copyToPath).not.toHaveBeenCalled();
  });

  it("calls onReject when pathStrategy returns skip", async () => {
    const entry = createCopyableEntry("a.wav");
    const registry = new Registry(createFileSource("root", [entry]));
    registry.setPathStrategy({ destinationPathFor: () => new SkipResult("test") });
    const onReject = vi.fn<(entry: ConfigEntry, reason: string) => void>();

    await registry.exportToDirectory("/output", { onReject });

    expect(onReject).toHaveBeenCalledOnce();
  });

  it("uses skipReasonFor message in onReject when available", async () => {
    const entry = createCopyableEntry("a.wav");
    const registry = new Registry(createFileSource("root", [entry]));
    registry.setPathStrategy(OrganisedPathStrategy);
    // no packageName or sampleType set → OrganisedPathStrategy returns undefined
    const onReject = vi.fn<(entry: ConfigEntry, reason: string) => void>();

    await registry.exportToDirectory("/output", { onReject });

    expect(onReject).toHaveBeenCalledWith(expect.anything(), "Missing sampleType and packageName");
  });

  it("does not call onReject when isSkipped is true", async () => {
    const entry = createCopyableEntry("a.wav");
    const registry = new Registry(createFileSource("root", [entry]));
    registry.setPathStrategy(OrganisedPathStrategy);
    registry.setSkipped("a.wav", true);
    registry.setPackageName("my-pack");
    registry.setSampleType("loops");
    const onReject = vi.fn<(entry: ConfigEntry, reason: string) => void>();

    await registry.exportToDirectory("/output", { onReject });

    expect(onReject).not.toHaveBeenCalled();
  });

  it("skips entries where isSkipped is true", async () => {
    const entry = createCopyableEntry("a.wav");
    const registry = new Registry(createFileSource("root", [entry]));
    registry.setPathStrategy(OrganisedPathStrategy);
    registry.setSkipped("a.wav", true);
    registry.setPackageName("my-pack");
    registry.setSampleType("loops");

    await registry.exportToDirectory("/output", {});

    expect(entry.copyToPath).not.toHaveBeenCalled();
  });

  it("calls onDebug with the entry path when isSkipped is true", async () => {
    const entry = createCopyableEntry("a.wav");
    const registry = new Registry(createFileSource("root", [entry]));
    registry.setSkipped("a.wav", true);
    const onDebug = vi.fn<(message: string) => void>();

    await registry.exportToDirectory("/output", { onDebug });

    expect(onDebug).toHaveBeenCalledWith("skipped: a.wav");
  });

  it("continues processing all entries when one throws, then throws AggregateError", async () => {
    const entryA = createCopyableEntry("a.wav");
    const entryB = createCopyableEntry("b.wav");
    const entryC = createCopyableEntry("c.wav");
    const error = new Error("copy failed");
    vi.mocked(entryB.copyToPath).mockRejectedValue(error);
    const registry = new Registry(createFileSource("root", [entryA, entryB, entryC]));

    await expect(registry.exportToDirectory("/output", {})).rejects.toThrow(AggregateError);

    expect(entryA.copyToPath).toHaveBeenCalled();
    expect(entryB.copyToPath).toHaveBeenCalled();
    expect(entryC.copyToPath).toHaveBeenCalled();
  });

  it("exports entries from nested directories", async () => {
    const entryA = createCopyableEntry("pack/drums/kick.wav");
    const entryB = createCopyableEntry("pack/drums/snare.wav");
    const registry = new Registry(createFileSource("root", [entryA, entryB]));
    registry.setPathStrategy(OrganisedPathStrategy);
    registry.setPackageName("my-pack");
    registry.setSampleType("drums");

    await registry.exportToDirectory("/output", {});

    expect(entryA.copyToPath).toHaveBeenCalledWith(
      "/output/drums/my-pack/kick.wav",
    );
    expect(entryB.copyToPath).toHaveBeenCalledWith(
      "/output/drums/my-pack/snare.wav",
    );
  });

  it("skips entries with a duplicate destination path", async () => {
    const entryA = createCopyableEntry("pack-a/kick.wav");
    const entryB = createCopyableEntry("pack-b/kick.wav");
    const registry = new Registry(createFileSource("root", [entryA, entryB]));
    registry.setPathStrategy(OrganisedPathStrategy);
    registry.setPackageName("my-pack");
    registry.setSampleType("drums");

    await registry.exportToDirectory("/output", {});

    const aWritten = vi.mocked(entryA.copyToPath).mock.calls.length > 0;
    const bWritten = vi.mocked(entryB.copyToPath).mock.calls.length > 0;
    expect(aWritten !== bWritten).toBe(true);
  });

  it("calls onReject with a duplicate destination reason when paths collide", async () => {
    const entryA = createCopyableEntry("pack-a/kick.wav");
    const entryB = createCopyableEntry("pack-b/kick.wav");
    const registry = new Registry(createFileSource("root", [entryA, entryB]));
    registry.setPathStrategy(OrganisedPathStrategy);
    registry.setPackageName("my-pack");
    registry.setSampleType("drums");
    const onReject = vi.fn<(entry: ConfigEntry, reason: string) => void>();

    await registry.exportToDirectory("/output", { onReject });

    expect(onReject).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledWith(expect.anything(), expect.stringContaining("duplicate destination"));
  });

  describe("dry-run (dirPath: undefined)", () => {
    it("does not call copyToPath", async () => {
      const entry = createCopyableEntry("a.wav");
      const registry = new Registry(createFileSource("root", [entry]));
      registry.setPathStrategy(OrganisedPathStrategy);
      registry.setPackageName("my-pack");
      registry.setSampleType("loops");

      await registry.exportToDirectory(undefined, {});

      expect(entry.copyToPath).not.toHaveBeenCalled();
    });

    it("calls onBeforeWrite and onAfterWrite without error for each entry", async () => {
      const entryA = createCopyableEntry("a.wav");
      const entryB = createCopyableEntry("b.wav");
      const registry = new Registry(createFileSource("root", [entryA, entryB]));
      registry.setPathStrategy(OrganisedPathStrategy);
      registry.setPackageName("my-pack");
      registry.setSampleType("loops");
      const onBeforeWrite = vi.fn<(entry: ConfigEntry, destRelPath: string) => void>();
      const onAfterWrite = vi.fn<(entry: ConfigEntry, destRelPath: string, error?: Error) => void>();

      await registry.exportToDirectory(undefined, { onBeforeWrite, onAfterWrite });

      expect(onBeforeWrite).toHaveBeenCalledTimes(2);
      expect(onAfterWrite).toHaveBeenCalledTimes(2);
      expect(onAfterWrite).not.toHaveBeenCalledWith(expect.anything(), expect.any(String), expect.any(Error));
    });

    it("still calls onReject when path strategy returns skip", async () => {
      const entry = createCopyableEntry("a.wav");
      const registry = new Registry(createFileSource("root", [entry]));
      registry.setPathStrategy({ destinationPathFor: () => new SkipResult("test") });
      const onReject = vi.fn<(entry: ConfigEntry, reason: string) => void>();

      await registry.exportToDirectory(undefined, { onReject });

      expect(onReject).toHaveBeenCalledOnce();
    });
  });
});
