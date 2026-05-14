import { describe, expect, it, vi } from "vitest";
import { Registry } from "../../src";
import type { DigestEntry, FileEntry, Validate } from "../../src";
import { createFileEntry, createFileSource } from "../support";

const createCopyableEntry = (path: string): FileEntry => ({
  ...createFileEntry({ path }),
  copyToPath: vi.fn<(path: string) => Promise<void>>(),
});

const createPassingValidator = (): Validate =>
  vi.fn<Validate>().mockReturnValue(undefined);

const createFailingValidator = (reason: string): Validate =>
  vi.fn<Validate>().mockReturnValue(reason);

describe("Registry.addValidator", () => {
  it("calls copyToPath when validator passes", async () => {
    const entry = createCopyableEntry("a.wav");
    const validator = createPassingValidator();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addValidator(validator);

    await registry.exportToDirectory("/output", {});

    expect(entry.copyToPath).toHaveBeenCalledOnce();
  });

  it("calls onReject with the reason when a validator fails", async () => {
    const entry = createCopyableEntry("a.wav");
    const validator = createFailingValidator(
      "path too long: 256 characters (max 255)",
    );
    const onReject = vi.fn<(entry: DigestEntry, reason: string) => void>();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addValidator(validator);

    await registry.exportToDirectory("/output", { onReject });

    expect(onReject).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({ getPath: expect.any(Function) as unknown }),
      "path too long: 256 characters (max 255)",
    );
  });

  it("does not call copyToPath when a validator fails", async () => {
    const entry = createCopyableEntry("a.wav");
    const validator = createFailingValidator(
      "path too long: 256 characters (max 255)",
    );
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addValidator(validator);

    await registry.exportToDirectory("/output", {});

    expect(entry.copyToPath).not.toHaveBeenCalled();
  });

  it("does not call onBeforeWrite or onAfterWrite when a validator fails", async () => {
    const entry = createCopyableEntry("a.wav");
    const validator = createFailingValidator(
      "path too long: 256 characters (max 255)",
    );
    const onBeforeWrite = vi.fn<(entry: DigestEntry, path: string) => void>();
    const onAfterWrite =
      vi.fn<(entry: DigestEntry, path: string, error?: Error) => void>();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addValidator(validator);

    await registry.exportToDirectory("/output", {
      onBeforeWrite,
      onAfterWrite,
    });

    expect(onBeforeWrite).not.toHaveBeenCalled();
    expect(onAfterWrite).not.toHaveBeenCalled();
  });

  it("short-circuits on the first failing validator", async () => {
    const entry = createCopyableEntry("a.wav");
    const first = createFailingValidator("first failure");
    const second = createFailingValidator("second failure");
    const onReject = vi.fn<(entry: DigestEntry, reason: string) => void>();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addValidator(first);
    registry.addValidator(second);

    await registry.exportToDirectory("/output", { onReject });

    expect(onReject).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledWith(expect.anything(), "first failure");
    expect(second).not.toHaveBeenCalled();
  });

  it("runs validators in dry-run mode (dirPath undefined)", async () => {
    const entry = createCopyableEntry("a.wav");
    const validator = createFailingValidator(
      "path too long: 256 characters (max 255)",
    );
    const onReject = vi.fn<(entry: DigestEntry, reason: string) => void>();
    const registry = new Registry(createFileSource("root", [entry]));
    registry.addValidator(validator);

    await registry.exportToDirectory(undefined, { onReject });

    expect(onReject).toHaveBeenCalledOnce();
    expect(entry.copyToPath).not.toHaveBeenCalled();
  });
});
