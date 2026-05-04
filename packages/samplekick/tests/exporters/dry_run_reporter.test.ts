import { describe, expect, it, vi } from "vitest";
import type { ConfigEntry } from "samplekick-io";
import type { ExportReporter } from "../../src/exporters/export_reporter";
import { DryRunReporter } from "../../src/exporters/dry_run_reporter";

const createEntry = (path: string): ConfigEntry => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
});

const createInner = (): ExportReporter => ({
  onInfo: vi.fn<(message: string) => void>(),
  onDebug: vi.fn<(message: string) => void>(),
  onError: vi.fn<(message: string) => void>(),
  onBeforeWrite: vi.fn<(entry: ConfigEntry, destRelPath: string) => void>(),
  onAfterWrite: vi.fn<(entry: ConfigEntry, destRelPath: string, error?: Error) => void>(),
  onSkip: vi.fn<(entry: ConfigEntry, reason: string) => void>(),
  onComplete: vi.fn<(dirPath: string) => void>(),
  onPreview: vi.fn<(successCount: number, skipCount: number) => void>(),
});

describe("DryRunReporter", () => {
  it("flush replays successes sorted by destRelPath", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("z.wav"), "z.wav");
    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav");
    dryRun.onAfterWrite(createEntry("m.wav"), "m.wav");
    dryRun.flush();

    expect(inner.onAfterWrite).toHaveBeenNthCalledWith(1, expect.anything(), "a.wav");
    expect(inner.onAfterWrite).toHaveBeenNthCalledWith(2, expect.anything(), "m.wav");
    expect(inner.onAfterWrite).toHaveBeenNthCalledWith(3, expect.anything(), "z.wav");
  });

  it("flush replays successes before skips", () => {
    const inner = createInner();
    const order: string[] = [];
    vi.mocked(inner.onAfterWrite).mockImplementation((_, p) => { order.push(`success:${p}`); });
    vi.mocked(inner.onSkip).mockImplementation((e) => { order.push(`skip:${e.getPath()}`); });
    const dryRun = new DryRunReporter(inner);

    dryRun.onSkip(createEntry("a.wav"), "Missing packageName");
    dryRun.onAfterWrite(createEntry("b.wav"), "b.wav");
    dryRun.flush();

    expect(order).toEqual(["success:b.wav", "skip:a.wav"]);
  });

  it("flush replays skips sorted by entry path", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onSkip(createEntry("z.wav"), "reason");
    dryRun.onSkip(createEntry("a.wav"), "reason");
    dryRun.onSkip(createEntry("m.wav"), "reason");
    dryRun.flush();

    const skipPaths = vi.mocked(inner.onSkip).mock.calls.map(([e]) => e.getPath());
    expect(skipPaths).toEqual(["a.wav", "m.wav", "z.wav"]);
  });

  it("flush calls onPreview with success and skip counts", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav");
    dryRun.onAfterWrite(createEntry("b.wav"), "b.wav");
    dryRun.onSkip(createEntry("c.wav"), "Missing packageName");
    dryRun.flush();

    expect(inner.onPreview).toHaveBeenCalledWith(2, 1);
  });

  it("flush calls onPreview with zero counts when nothing was collected", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);
    dryRun.flush();
    expect(inner.onPreview).toHaveBeenCalledWith(0, 0);
  });

  it("forwards errors to inner.onError immediately without buffering", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("copy failed"));

    expect(inner.onError).toHaveBeenCalledWith("a.wav: copy failed");
    expect(inner.onAfterWrite).not.toHaveBeenCalled();
  });

  it("does not include errors in success count passed to onPreview", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
    dryRun.flush();

    expect(inner.onPreview).toHaveBeenCalledWith(0, 0);
  });

  it("onBeforeWrite is a no-op and does not forward to inner", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onBeforeWrite(createEntry("a.wav"), "a.wav");

    expect(inner.onBeforeWrite).not.toHaveBeenCalled();
  });
});
