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
  onReject: vi.fn<(entry: ConfigEntry, reason: string) => void>(),
  onComplete: vi.fn<(dirPath: string) => void>(),
  onPreview: vi.fn<(successCount: number, rejectCount: number) => void>(),
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

  it("flush replays successes before rejections", () => {
    const inner = createInner();
    const order: string[] = [];
    vi.mocked(inner.onAfterWrite).mockImplementation((_, p) => { order.push(`success:${p}`); });
    vi.mocked(inner.onReject).mockImplementation((e) => { order.push(`reject:${e.getPath()}`); });
    const dryRun = new DryRunReporter(inner);

    dryRun.onReject(createEntry("a.wav"), "Missing packageName");
    dryRun.onAfterWrite(createEntry("b.wav"), "b.wav");
    dryRun.flush();

    expect(order).toEqual(["success:b.wav", "reject:a.wav"]);
  });

  it("flush replays rejections sorted by entry path", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onReject(createEntry("z.wav"), "reason");
    dryRun.onReject(createEntry("a.wav"), "reason");
    dryRun.onReject(createEntry("m.wav"), "reason");
    dryRun.flush();

    const rejectPaths = vi.mocked(inner.onReject).mock.calls.map(([e]) => e.getPath());
    expect(rejectPaths).toEqual(["a.wav", "m.wav", "z.wav"]);
  });

  it("flush calls onPreview with success and reject counts", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav");
    dryRun.onAfterWrite(createEntry("b.wav"), "b.wav");
    dryRun.onReject(createEntry("c.wav"), "Missing packageName");
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

  it("does not include errors in the success count passed to onPreview", () => {
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
