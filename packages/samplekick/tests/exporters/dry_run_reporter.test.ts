import { describe, expect, it, vi } from "vitest";
import type { DigestEntry, FileNode } from "samplekick-io";
import type { ExportReporter } from "../../src/exporters/export_reporter";
import { DryRunReporter } from "../../src/exporters/dry_run_reporter";

const createEntry = (path: string): FileNode => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
  isFile: () => true,
  getParentNode: () => undefined,
  getChildNodes: () => [],
});

const createInner = (): ExportReporter => ({
  onStart: vi.fn<(packName: string) => void>(),
  onInfo: vi.fn<(message: string) => void>(),
  onDebug: vi.fn<(message: string) => void>(),
  onError: vi.fn<(message: string) => void>(),
  onBeforeWrite: vi.fn<(entry: DigestEntry, destRelPath: string) => void>(),
  onAfterWrite:
    vi.fn<(entry: DigestEntry, destRelPath: string, error?: Error) => void>(),
  onReject: vi.fn<(entry: DigestEntry, reason: string) => void>(),
  onSkip: vi.fn<(entry: FileNode) => void>(),
  onComplete: vi.fn<(dirPath: string) => void>(),
  onPreview: vi.fn<() => void>(),
});

describe("DryRunReporter", () => {
  it("flush replays successes sorted by destRelPath", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("z.wav"), "z.wav");
    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav");
    dryRun.onAfterWrite(createEntry("m.wav"), "m.wav");
    dryRun.flush();

    expect(inner.onAfterWrite).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      "a.wav",
    );
    expect(inner.onAfterWrite).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "m.wav",
    );
    expect(inner.onAfterWrite).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      "z.wav",
    );
  });

  it("flush replays skips before successes before rejections", () => {
    const inner = createInner();
    const order: string[] = [];
    vi.mocked(inner.onAfterWrite).mockImplementation((_, p) => {
      order.push(`success:${p}`);
    });
    vi.mocked(inner.onReject).mockImplementation((e) => {
      order.push(`reject:${e.getPath()}`);
    });
    vi.mocked(inner.onSkip).mockImplementation((e) => {
      order.push(`skip:${e.getPath()}`);
    });
    const dryRun = new DryRunReporter(inner);

    dryRun.onReject(createEntry("a.wav"), "Missing packageName");
    dryRun.onAfterWrite(createEntry("b.wav"), "b.wav");
    dryRun.onSkip(createEntry("c.wav"));
    dryRun.flush();

    expect(order).toEqual(["skip:c.wav", "success:b.wav", "reject:a.wav"]);
  });

  it("flush replays rejections sorted by entry path", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onReject(createEntry("z.wav"), "reason");
    dryRun.onReject(createEntry("a.wav"), "reason");
    dryRun.onReject(createEntry("m.wav"), "reason");
    dryRun.flush();

    const rejectPaths = vi
      .mocked(inner.onReject)
      .mock.calls.map(([e]) => e.getPath());
    expect(rejectPaths).toEqual(["a.wav", "m.wav", "z.wav"]);
  });

  it("flush calls onPreview", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav");
    dryRun.onAfterWrite(createEntry("b.wav"), "b.wav");
    dryRun.onReject(createEntry("c.wav"), "Missing packageName");
    dryRun.flush();

    expect(inner.onPreview).toHaveBeenCalled();
  });

  it("flush calls onPreview when nothing was collected", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);
    dryRun.flush();
    expect(inner.onPreview).toHaveBeenCalled();
  });

  it("forwards errors to inner.onError immediately without buffering", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(
      createEntry("a.wav"),
      "a.wav",
      new Error("copy failed"),
    );

    expect(inner.onError).toHaveBeenCalledWith("a.wav: copy failed");
    expect(inner.onAfterWrite).not.toHaveBeenCalled();
  });

  it("does not include errors in the onAfterWrite replay", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
    dryRun.flush();

    expect(inner.onPreview).toHaveBeenCalled();
  });

  it("flush replays config-skips sorted by entry path", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onSkip(createEntry("z.wav"));
    dryRun.onSkip(createEntry("a.wav"));
    dryRun.onSkip(createEntry("m.wav"));
    dryRun.flush();

    const skipPaths = vi
      .mocked(inner.onSkip)
      .mock.calls.map(([e]) => e.getPath());
    expect(skipPaths).toEqual(["a.wav", "m.wav", "z.wav"]);
  });

  it("flush calls onPreview after replaying skips", () => {
    const inner = createInner();
    const dryRun = new DryRunReporter(inner);

    dryRun.onAfterWrite(createEntry("a.wav"), "a.wav");
    dryRun.onSkip(createEntry("b.wav"));
    dryRun.onSkip(createEntry("c.wav"));
    dryRun.flush();

    expect(inner.onPreview).toHaveBeenCalled();
  });
});
