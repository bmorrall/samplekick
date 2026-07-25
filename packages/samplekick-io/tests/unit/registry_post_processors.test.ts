import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Registry } from "../../src";
import type { FileEntry, PostProcessor } from "../../src";
import { createFileEntry, createFileSource } from "../support";

const createCopyableEntry = (path: string): FileEntry => ({
  ...createFileEntry({ path }),
  copyToPath: vi.fn<(path: string) => Promise<void>>(),
});

const createPostProcessor = (): PostProcessor => ({
  processFile: vi.fn<PostProcessor["processFile"]>(),
});

let outputDir = "";

beforeEach(async () => {
  outputDir = await mkdtemp(join(tmpdir(), "samplekick-io-export-"));
});

afterEach(async () => {
  await rm(outputDir, { recursive: true });
});

describe("Registry.addPostProcessor", () => {
  it("calls processFile with the full destination path and entry", async () => {
    const entry = createCopyableEntry("a.wav");
    const processor = createPostProcessor();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processor);

    await registry.exportToDirectory(outputDir, {});

    expect(processor.processFile).toHaveBeenCalledWith(
      join(outputDir, "a.wav"),
      expect.objectContaining({ getPath: expect.any(Function) as unknown }),
    );
  });

  it("calls each processor in order for each file", async () => {
    const entry = createCopyableEntry("a.wav");
    const calls: string[] = [];
    const processorA: PostProcessor = {
      processFile: vi.fn(() => {
        calls.push("A");
        return undefined;
      }),
    };
    const processorB: PostProcessor = {
      processFile: vi.fn(() => {
        calls.push("B");
        return undefined;
      }),
    };
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processorA);
    registry.addPostProcessor(processorB);

    await registry.exportToDirectory(outputDir, {});

    expect(calls).toStrictEqual(["A", "B"]);
  });

  it("passes the renamed path from one processor on to the next processor", async () => {
    const entry = createCopyableEntry("a.mp3");
    const processorA: PostProcessor = {
      processFile: vi.fn(() => join(outputDir, "a.wav")),
    };
    const processorB: PostProcessor = {
      processFile: vi.fn(),
    };
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processorA);
    registry.addPostProcessor(processorB);

    await registry.exportToDirectory(outputDir, {});

    expect(processorA.processFile).toHaveBeenCalledWith(
      join(outputDir, "a.mp3"),
      expect.objectContaining({ getPath: expect.any(Function) as unknown }),
    );
    expect(processorB.processFile).toHaveBeenCalledWith(
      join(outputDir, "a.wav"),
      expect.objectContaining({ getPath: expect.any(Function) as unknown }),
    );
  });

  it("calls processFile after copyToPath", async () => {
    const entry = createCopyableEntry("a.wav");
    const callOrder: string[] = [];
    vi.mocked(entry.copyToPath).mockImplementation(async () => {
      callOrder.push("copy");
      await Promise.resolve();
    });
    const processor: PostProcessor = {
      processFile: vi.fn(() => {
        callOrder.push("process");
        return undefined;
      }),
    };
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processor);

    await registry.exportToDirectory(outputDir, {});

    expect(callOrder).toStrictEqual(["copy", "process"]);
  });

  it("throws AggregateError when a processor throws", async () => {
    const entry = createCopyableEntry("a.wav");
    const processor: PostProcessor = {
      processFile: vi.fn().mockRejectedValue(new Error("process failed")),
    };
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processor);

    await expect(registry.exportToDirectory(outputDir, {})).rejects.toThrow(
      AggregateError,
    );
  });

  it("does not call processFile for skipped entries", async () => {
    const entry = createCopyableEntry("a.wav");
    const processor = createPostProcessor();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.setEnabled("a.wav", false);
    registry.addPostProcessor(processor);

    await registry.exportToDirectory(outputDir, {});

    expect(processor.processFile).not.toHaveBeenCalled();
  });
});

describe("Registry.clearPostProcessors", () => {
  it("removes previously added post-processors", async () => {
    const entry = createCopyableEntry("a.wav");
    const processor = createPostProcessor();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processor);
    registry.clearPostProcessors();

    await registry.exportToDirectory(outputDir, {});

    expect(processor.processFile).not.toHaveBeenCalled();
  });

  it("allows re-adding post-processors after clearing", async () => {
    const entry = createCopyableEntry("a.wav");
    const processorA = createPostProcessor();
    const processorB = createPostProcessor();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processorA);
    registry.clearPostProcessors();
    registry.addPostProcessor(processorB);

    await registry.exportToDirectory(outputDir, {});

    expect(processorA.processFile).not.toHaveBeenCalled();
    expect(processorB.processFile).toHaveBeenCalledOnce();
  });
});
