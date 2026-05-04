import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import type { FileNode } from "samplekick-io";
import { SimpleExportReporter } from "../../src/exporters/simple_export_reporter";

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

const createReporter = (): { reporter: SimpleExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new SimpleExportReporter(stream);
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createQuietReporter = (): { reporter: SimpleExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new SimpleExportReporter(stream, true);
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createPackReporter = (): { reporter: SimpleExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new SimpleExportReporter(stream, false, "my-pack.zip");
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

describe("SimpleExportReporter", () => {
  describe("onInfo", () => {
    it("writes the message on its own line", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onInfo("Reading: /path/to/pack.zip");
      expect(getOutput()).toBe("Reading: /path/to/pack.zip\n");
    });
  });

  describe("onDebug", () => {
    it("writes the message on its own line", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onDebug("Reading: /path/to/pack.zip");
      expect(getOutput()).toBe("Reading: /path/to/pack.zip\n");
    });
  });

  describe("onError", () => {
    it("writes 'error: ...' on its own line", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onError("Could not convert kick.wav: ffmpeg error");
      expect(getOutput()).toBe("error: Could not convert kick.wav: ffmpeg error\n");
    });
  });

  describe("onBeforeWrite", () => {
    it("writes 'Exporting\u2026' on the first call", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav");
      expect(getOutput()).toBe("Exporting\u2026\n");
    });

    it("only writes the header once", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onBeforeWrite(createEntry("snare.wav"), "snare.wav");
      expect(getOutput()).toBe("Exporting\u2026\n");
    });

    it("includes the pack name when provided", () => {
      const { reporter, getOutput } = createPackReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      expect(getOutput()).toBe("Exporting my-pack.zip\u2026\n");
    });
  });

  describe("onAfterWrite", () => {
    it("writes the destination path on success", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav");
      expect(getOutput()).toBe("success: loops/my-pack/kick.wav\n");
    });

    it("writes a failed message with the error on failure", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav", new Error("disk full"));
      expect(getOutput()).toBe("failed: loops/my-pack/kick.wav: disk full\n");
    });
  });

  describe("onReject", () => {
    it("writes 'rejected: {path}: {reason}'", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onReject(createEntry("Drums/kick.wav"), "Missing sampleType and packageName");
      expect(getOutput()).toBe("rejected: Drums/kick.wav: Missing sampleType and packageName\n");
    });
  });

  describe("onSkip", () => {
    it("writes 'skipped: {path}'", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("Drums/kick.wav"));
      expect(getOutput()).toBe("skipped: Drums/kick.wav\n");
    });
  });

  describe("onComplete", () => {
    it("writes 'Exported to <dirPath>' when there are no errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onComplete("/output/dir");
      expect(getOutput()).toBe("Exported 0 files to /output/dir\n");
    });

    it("includes singular error count when there is 1 error", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(getOutput()).toContain("Exported 1 file to /output/dir (1 error)\n");
    });

    it("includes plural error count when there are multiple errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(getOutput()).toContain("Exported 2 files to /output/dir (2 errors)\n");
    });
  });

  describe("quiet mode", () => {
    it("still writes the Exporting header on first onBeforeWrite", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      expect(getOutput()).toBe("Exporting\u2026\n");
    });

    it("suppresses success lines in onAfterWrite", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      expect(getOutput()).toBe("");
    });

    it("still writes error lines", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav", new Error("disk full"));
      expect(getOutput()).toBe("failed: kick.wav: disk full\n");
    });

    it("still writes complete line", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onComplete("/output/dir");
      expect(getOutput()).toBe("Exported 1 file to /output/dir\n");
    });
  });

  describe("onPreview", () => {
    it("writes 'Would export N files' with no counts", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview(3, 0, 0);
      expect(getOutput()).toBe("Would export 3 files\n");
    });

    it("uses singular 'file' when count is 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview(1, 0, 0);
      expect(getOutput()).toBe("Would export 1 file\n");
    });

    it("includes reject count when rejections > 0", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview(2, 1, 0);
      expect(getOutput()).toBe("Would export 2 files (1 entry rejected)\n");
    });

    it("uses plural 'entries' when reject count > 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview(2, 3, 0);
      expect(getOutput()).toBe("Would export 2 files (3 entries rejected)\n");
    });

    it("includes skip count when skips > 0", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview(2, 0, 1);
      expect(getOutput()).toBe("Would export 2 files (1 entry skipped)\n");
    });

    it("uses plural 'records' when skip count > 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview(2, 0, 3);
      expect(getOutput()).toBe("Would export 2 files (3 entries skipped)\n");
    });

    it("includes both reject and skip counts", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onPreview(2, 1, 2);
      expect(getOutput()).toBe("Would export 2 files (1 entry rejected, 2 entries skipped)\n");
    });
  });
});
