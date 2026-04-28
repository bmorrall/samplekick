import { describe, expect, it, vi } from "vitest";
import { Registry, OrganisedPathStrategy } from "../../src";
import type { FileEntry } from "../../src";
import { createFileEntry, loadRegistry } from "../support";

const createCopyableEntry = (path: string): FileEntry => ({
  ...createFileEntry({ path }),
  copyToPath: vi.fn<(path: string) => Promise<void>>(),
});

describe("Registry.exportToDirectory", () => {
  it("calls copyToPath on each leaf node with the destination path", async () => {
    const registry = new Registry("root");
    registry.setPathStrategy(OrganisedPathStrategy);
    const entryA = createCopyableEntry("a.wav");
    const entryB = createCopyableEntry("b.wav");
    loadRegistry(registry, [entryA, entryB]);
    registry.setPackageName("my-pack");
    registry.setSampleType("loops");

    await registry.exportToDirectory("/output");

    expect(entryA.copyToPath).toHaveBeenCalledWith(
      "/output/loops/my-pack/a.wav",
    );
    expect(entryB.copyToPath).toHaveBeenCalledWith(
      "/output/loops/my-pack/b.wav",
    );
  });

  it("skips entries where pathStrategy returns undefined", async () => {
    const registry = new Registry("root");
    const entry = createCopyableEntry("a.wav");
    loadRegistry(registry, [entry]);
    // no packageName or sampleType → OrganisedPathStrategy returns undefined, SourcePathStrategy returns the name
    // use a custom strategy that always returns undefined
    registry.setPathStrategy({ destinationPathFor: () => undefined });

    await registry.exportToDirectory("/output");

    expect(entry.copyToPath).not.toHaveBeenCalled();
  });

  it("skips entries where isSkipped is true", async () => {
    const registry = new Registry("root");
    registry.setPathStrategy(OrganisedPathStrategy);
    const entry = createCopyableEntry("a.wav");
    loadRegistry(registry, [entry]);
    registry.setSkipped("a.wav", true);
    registry.setPackageName("my-pack");
    registry.setSampleType("loops");

    await registry.exportToDirectory("/output");

    expect(entry.copyToPath).not.toHaveBeenCalled();
  });

  it("exports entries from nested directories", async () => {
    const registry = new Registry("root");
    registry.setPathStrategy(OrganisedPathStrategy);
    const entryA = createCopyableEntry("pack/drums/kick.wav");
    const entryB = createCopyableEntry("pack/drums/snare.wav");
    loadRegistry(registry, [entryA, entryB]);
    registry.setPackageName("my-pack");
    registry.setSampleType("drums");

    await registry.exportToDirectory("/output");

    expect(entryA.copyToPath).toHaveBeenCalledWith(
      "/output/drums/my-pack/kick.wav",
    );
    expect(entryB.copyToPath).toHaveBeenCalledWith(
      "/output/drums/my-pack/snare.wav",
    );
  });
});
