import { describe, it, expect } from "vitest";
import { Registry } from "samplekick-io";
import { applyAnalysisPipeline } from "../src/pipeline.js";

const makeRegistry = (paths: string[]): Registry =>
  new Registry({
    getName: () => "test-pack",
    getFingerprint: () => "",
    eachFileEntry: (fn) => {
      for (const path of paths) {
        const name = path.split("/").at(-1) ?? path;
        fn({
          getPath: () => path,
          getName: () => name,
          // eslint-disable-next-line @typescript-eslint/require-await -- test stub, never called
          copyToPath: async (_dest: string): Promise<void> => {
            throw new Error("not implemented");
          },
        });
      }
    },
  });

describe("applyAnalysisPipeline", () => {
  it("leaves .wav files enabled", () => {
    const registry = makeRegistry(["Drums/kick.wav"]);
    applyAnalysisPipeline(registry);
    expect(registry.getEntry("Drums/kick.wav")?.isEnabled()).toBe(true);
  });

  it("disables .txt info files", () => {
    const registry = makeRegistry(["readme.txt", "Drums/kick.wav"]);
    applyAnalysisPipeline(registry);
    expect(registry.getEntry("readme.txt")?.isEnabled()).toBe(false);
  });

  it("disables .DS_Store junk files by default", () => {
    const registry = makeRegistry([".DS_Store", "Drums/kick.wav"]);
    applyAnalysisPipeline(registry);
    expect(registry.getEntry(".DS_Store")?.isEnabled()).toBe(false);
  });

  it("leaves .DS_Store enabled when allowJunk is true", () => {
    const registry = makeRegistry([".DS_Store", "Drums/kick.wav"]);
    applyAnalysisPipeline(registry, { allowJunk: true });
    expect(registry.getEntry(".DS_Store")?.isEnabled()).toBe(true);
  });

  it("tags directories with ' - ' as packageName when multiPack is true", () => {
    const registry = makeRegistry(["Artist - Pack Name/kick.wav"]);
    applyAnalysisPipeline(registry, { multiPack: true });
    expect(registry.getEntry("Artist - Pack Name")?.getPackageName()).toBe(
      "Artist - Pack Name",
    );
  });

  it("does not tag ' - ' directories with packageName by default", () => {
    const registry = makeRegistry(["Artist - Pack Name/kick.wav"]);
    applyAnalysisPipeline(registry);
    expect(
      registry.getEntry("Artist - Pack Name")?.getPackageName(),
    ).toBeUndefined();
  });
});
