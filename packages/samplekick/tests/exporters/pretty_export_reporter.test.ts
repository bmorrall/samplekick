import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chalk } from "chalk";
import type { ConfigEntry } from "samplekick-io";
import { PrettyExportReporter } from "../../src/exporters/pretty_export_reporter";

// Force level 1 (ANSI 16 colors) so chalk always emits escape codes in tests
const chalk1 = new Chalk({ level: 1 });

const ESC = String.fromCharCode(0x1B);
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, "gv");
const stripAnsi = (s: string): string => s.replace(ANSI_RE, "");

const createEntry = (path: string): ConfigEntry => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => undefined,
  getSampleType: () => undefined,
  isSkipped: () => undefined,
  isKeepStructure: () => undefined,
});

const createReporter = (): { reporter: PrettyExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new PrettyExportReporter(stream, chalk1);
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createTTYReporter = (): { reporter: PrettyExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  Object.assign(stream, { isTTY: true });
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new PrettyExportReporter(stream, chalk1, { packName: "my-pack.zip" });
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

describe("PrettyExportReporter", () => {
  describe("onInfo", () => {
    it("writes the message dimmed without dot or indent", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onInfo("Reading: /path/to/pack.zip");
      const raw = getOutput();
      expect(raw).toContain("\x1B[");
      expect(stripAnsi(raw)).toBe("Reading: /path/to/pack.zip\n");
    });
  });

  describe("onDebug", () => {
    it("writes the message in grey", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onDebug("Reading: /path/to/pack.zip");
      const raw = getOutput();
      expect(raw).toContain("\x1B[");
      expect(stripAnsi(raw)).toBe("  · Reading: /path/to/pack.zip\n");
    });
  });

  describe("onError", () => {
    it("writes '! {message}' in red with indent", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onError("Could not convert kick.wav: ffmpeg error");
      const raw = getOutput();
      expect(raw).toContain("\x1B[31m");
      expect(stripAnsi(raw)).toBe("  ! Could not convert kick.wav: ffmpeg error\n");
    });
  });

  describe("onBeforeWrite", () => {
    it("writes nothing on non-TTY", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onBeforeWrite(createEntry("drums/kick.wav"), "loops/my-pack/kick.wav");
      expect(getOutput()).toBe("");
    });
  });

  describe("onAfterWrite (success)", () => {
    it("writes '✓ {filename}  {dir}/' with green symbol and dimmed directory", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/kick.wav");
      const raw = getOutput();
      expect(raw).toContain("\x1B[32m");
      expect(stripAnsi(raw)).toBe("  ✓ kick.wav  loops/my-pack/\n");
    });

    it("omits directory suffix when file is at root of output dir", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      expect(stripAnsi(getOutput())).toBe("  ✓ kick.wav\n");
    });
  });

  describe("onAfterWrite (error)", () => {
    it("writes '✗ {destRelPath}: {message}' in red", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/kick.wav", new Error("disk full"));
      const raw = getOutput();
      expect(raw).toContain("\x1B[31m");
      expect(stripAnsi(raw)).toBe("  ✗ loops/my-pack/kick.wav: disk full\n");
    });
  });

  describe("onSkip", () => {
    it("writes '? {path}: {reason}' with magenta symbol", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"), "Missing sampleType");
      const raw = getOutput();
      expect(raw).toContain("\x1B[35m");
      expect(stripAnsi(raw)).toBe("  ? kick.wav: Missing sampleType\n");
    });

    it("does not increment totalCount", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("a.wav"), "Missing packageName");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported 1 file to /output/dir");
    });
  });

  describe("onComplete", () => {
    it("writes 'Exported 0 files to <dirPath>' when there are no errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toBe("Exported 0 files to /output/dir\n");
    });

    it("includes singular error count in red when there is 1 error", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      const raw = getOutput();
      expect(stripAnsi(raw)).toContain("Exported 1 file to /output/dir (1 error)\n");
      expect(raw).toContain("\x1B[31m");
    });

    it("includes plural error count when there are multiple errors", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav", new Error("fail"));
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported 2 files to /output/dir (2 errors)\n");
    });

    it("includes skip count when entries were skipped", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("a.wav"), "Missing sampleType");
      reporter.onAfterWrite(createEntry("b.wav"), "b.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported 1 file to /output/dir (1 skipped)\n");
    });

    it("includes both error and skip counts when both occur", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("a.wav"), "a.wav", new Error("fail"));
      reporter.onSkip(createEntry("b.wav"), "Missing packageName");
      reporter.onAfterWrite(createEntry("c.wav"), "c.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported 2 files to /output/dir (1 error, 1 skipped)\n");
    });
  });

  describe("quiet mode", () => {
    const createQuietReporter = (): { reporter: PrettyExportReporter; getOutput: () => string } => {
      const stream = new PassThrough();
      const chunks: string[] = [];
      stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
      const reporter = new PrettyExportReporter(stream, chalk1, { quiet: true });
      const getOutput = (): string => chunks.join("");
      return { reporter, getOutput };
    };

    it("suppresses onBeforeWrite", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      expect(getOutput()).toBe("");
    });

    it("suppresses success lines in onAfterWrite", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      expect(getOutput()).toBe("");
    });

    it("suppresses skip lines in onSkip", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onSkip(createEntry("kick.wav"), "Missing sampleType");
      expect(getOutput()).toBe("");
    });

    it("still writes error lines", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav", new Error("disk full"));
      expect(stripAnsi(getOutput())).toBe("  ✗ kick.wav: disk full\n");
    });

    it("still writes complete line", () => {
      const { reporter, getOutput } = createQuietReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toBe("Exported 1 file to /output/dir\n");
    });
  });

  describe("organised path colouring", () => {
    const createOrganisedReporter = (): { reporter: PrettyExportReporter; getOutput: () => string } => {
      const stream = new PassThrough();
      const chunks: string[] = [];
      stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
      const reporter = new PrettyExportReporter(stream, chalk1, { organised: true });
      const getOutput = (): string => chunks.join("");
      return { reporter, getOutput };
    };

    it("colours sampleType (folder 1) with greenBright and packageName (folder 2) with cyan", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/kick.wav");
      const raw = getOutput();
      expect(stripAnsi(raw)).toBe("  ✓ kick.wav  loops/my-pack/\n");
      expect(raw).toContain("\x1B[36m"); // cyan — sampleType
      expect(raw).toContain("\x1B[34m"); // blue — packageName
    });

    it("colours extra subfolder segments gray", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/sub/kick.wav");
      const raw = getOutput();
      expect(stripAnsi(raw)).toBe("  ✓ kick.wav  loops/my-pack/sub/\n");
      expect(raw).toContain("\x1B[36m"); // cyan — sampleType
      expect(raw).toContain("\x1B[34m"); // blue — packageName
    });

    it("does not apply organised colouring when organised is false", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntry("kick.wav"), "loops/my-pack/kick.wav");
      const raw = getOutput();
      expect(raw).not.toContain("\x1B[36m"); // no cyan
      expect(raw).not.toContain("\x1B[34m"); // no blue
    });
  });

  describe("TTY mode", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("draws spinner on first onBeforeWrite", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onComplete("/output/dir");
      const raw = getOutput();
      expect(raw).toContain("\x1b[2K\r");
      expect(stripAnsi(raw)).toContain("Exporting my-pack.zip\u2026 (0 done)");
    });

    it("clears spinner and logs above it on onDebug", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      const { length: afterSpinner } = getOutput();
      reporter.onDebug("debug message");
      const debugOutput = getOutput().slice(afterSpinner);
      expect(debugOutput.startsWith("\x1b[2K\r")).toBe(true);
      expect(stripAnsi(debugOutput)).toContain("· debug message\n");
      expect(stripAnsi(debugOutput)).toContain("Exporting my-pack.zip\u2026 (0 done)");
      reporter.onComplete("/output/dir");
    });

    it("clears spinner and logs above it on onAfterWrite success", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      const { length: afterSpinner } = getOutput();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav");
      const writeOutput = getOutput().slice(afterSpinner);
      expect(writeOutput.startsWith("\x1b[2K\r")).toBe(true);
      expect(stripAnsi(writeOutput)).toContain("  \u2713 kick.wav\n");
      reporter.onComplete("/output/dir");
    });

    it("clears spinner and logs above it on onAfterWrite error", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      const { length: afterSpinner } = getOutput();
      reporter.onAfterWrite(createEntry("kick.wav"), "kick.wav", new Error("disk full"));
      const writeOutput = getOutput().slice(afterSpinner);
      expect(writeOutput.startsWith("\x1b[2K\r")).toBe(true);
      expect(stripAnsi(writeOutput)).toContain("\u2717 kick.wav: disk full\n");
      reporter.onComplete("/output/dir");
    });

    it("clears spinner line on onComplete", () => {
      vi.useFakeTimers();
      const { reporter, getOutput } = createTTYReporter();
      reporter.onBeforeWrite(createEntry("kick.wav"), "kick.wav");
      reporter.onComplete("/output/dir");
      expect(stripAnsi(getOutput())).toContain("Exported 0 files to /output/dir\n");
    });
  });
});
