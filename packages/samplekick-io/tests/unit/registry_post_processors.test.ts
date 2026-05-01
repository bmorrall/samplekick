import { describe, expect, it, vi } from "vitest";
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

describe("Registry.addPostProcessor", () => {
  it("calls processFile with the full destination path and entry", async () => {
    const entry = createCopyableEntry("a.wav");
    const processor = createPostProcessor();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processor);

    await registry.exportToDirectory("/output");

    expect(processor.processFile).toHaveBeenCalledWith("/output/a.wav", expect.objectContaining({ getPath: expect.any(Function) as unknown }));
  });

  it("calls each processor in order for each file", async () => {
    const entry = createCopyableEntry("a.wav");
    const calls: string[] = [];
    const processorA: PostProcessor = { processFile: vi.fn(() => { calls.push("A"); }) };
    const processorB: PostProcessor = { processFile: vi.fn(() => { calls.push("B"); }) };
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processorA);
    registry.addPostProcessor(processorB);

    await registry.exportToDirectory("/output");

    expect(calls).toStrictEqual(["A", "B"]);
  });

  it("calls processFile after copyToPath", async () => {
    const entry = createCopyableEntry("a.wav");
    const callOrder: string[] = [];
    vi.mocked(entry.copyToPath).mockImplementation(async () => { callOrder.push("copy"); await Promise.resolve(); });
    const processor: PostProcessor = { processFile: vi.fn(() => { callOrder.push("process"); }) };
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processor);

    await registry.exportToDirectory("/output");

    expect(callOrder).toStrictEqual(["copy", "process"]);
  });

  it("throws AggregateError when a processor throws", async () => {
    const entry = createCopyableEntry("a.wav");
    const processor: PostProcessor = { processFile: vi.fn().mockRejectedValue(new Error("process failed")) };
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addPostProcessor(processor);

    await expect(registry.exportToDirectory("/output")).rejects.toThrow(AggregateError);
  });

  it("does not call processFile for skipped entries", async () => {
    const entry = createCopyableEntry("a.wav");
    const processor = createPostProcessor();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.setSkipped("a.wav", true);
    registry.addPostProcessor(processor);

    await registry.exportToDirectory("/output");

    expect(processor.processFile).not.toHaveBeenCalled();
  });
});
