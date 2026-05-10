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

const createEntryWithMeta = (path: string, packageName: string, sampleType: string): FileNode => ({
  getPath: () => path,
  getName: () => path.split("/").pop() ?? path,
  getPackageName: () => packageName,
  getSampleType: () => sampleType,
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

const createQuietPackReporter = (): { reporter: SimpleExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new SimpleExportReporter(stream, true, "my-pack.zip");
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createOrganisedReporter = (): { reporter: SimpleExportReporter; getOutput: () => string } => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => { chunks.push(chunk.toString()); });
  const reporter = new SimpleExportReporter(stream, false, "", true);
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

  describe("onStart", () => {
    it("writes 'filename:' when a pack name is set", () => {
      const { reporter, getOutput } = createPackReporter();
      reporter.onStart("my-pack.zip");
      expect(getOutput()).toBe("my-pack.zip:\n");
    });

    it("writes nothing when pack name is empty", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onStart("");
      expect(getOutput()).toBe("");
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

    it("includes singular entry count when one entry is skipped", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onComplete("/output/dir");
      expect(getOutput()).toContain("Exported 0 files to /output/dir (1 entry skipped)\n");
    });

    it("includes plural entry count when multiple entries are skipped", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onSkip(createEntry("cover.jpg"));
      reporter.onSkip(createEntry("notes.txt"));
      reporter.onComplete("/output/dir");
      expect(getOutput()).toContain("Exported 0 files to /output/dir (3 entries skipped)\n");
    });
  });

  describe("quiet mode", () => {
    it("still writes 'filename:' in quiet mode", () => {
      const { reporter, getOutput } = createQuietPackReporter();
      reporter.onStart("my-pack.zip");
      expect(getOutput()).toBe("my-pack.zip:\n");
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
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      reporter.onPreview(2, 1, 0);
      expect(getOutput()).toContain("Would export 2 files (1 sample rejected)\n");
    });

    it("uses plural 'samples' when reject count > 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      reporter.onReject(createEntry("snare.wav"), "Missing sampleType");
      reporter.onReject(createEntry("hat.wav"), "Missing sampleType");
      reporter.onPreview(2, 3, 0);
      expect(getOutput()).toContain("Would export 2 files (3 samples rejected)\n");
    });

    it("includes skip count when skips > 0", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onPreview(2, 0, 1);
      expect(getOutput()).toContain("Would export 2 files (1 sample skipped)\n");
    });

    it("uses plural 'samples' when skip count > 1", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onSkip(createEntry("kick.wav"));
      reporter.onSkip(createEntry("snare.wav"));
      reporter.onSkip(createEntry("hat.wav"));
      reporter.onPreview(2, 0, 3);
      expect(getOutput()).toContain("Would export 2 files (3 samples skipped)\n");
    });

    it("includes both reject and skip counts", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onReject(createEntry("kick.wav"), "Missing sampleType");
      reporter.onSkip(createEntry("snare.wav"));
      reporter.onSkip(createEntry("hat.wav"));
      reporter.onPreview(2, 1, 2);
      expect(getOutput()).toContain("Would export 2 files (1 sample rejected, 2 samples skipped)\n");
    });
  });

  describe("organised summary", () => {
    it("prints package total and sampleType breakdown after onComplete", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/snare.wav", "my-pack", "Drums"), "Drums/my-pack/snare.wav");
      reporter.onAfterWrite(createEntryWithMeta("Synths/my-pack/synth.wav", "my-pack", "Synths"), "Synths/my-pack/synth.wav");
      reporter.onComplete("/output");
      const output = getOutput();
      expect(output).toContain("my-pack: 3 samples\n");
      expect(output).toContain("  Drums: 2 samples\n");
      expect(output).toContain("  Synths: 1 sample\n");
    });

    it("sorts packages and sampleTypes alphabetically", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Synths/zebra/s.wav", "zebra", "Synths"), "Synths/zebra/s.wav");
      reporter.onAfterWrite(createEntryWithMeta("Drums/alpha/k.wav", "alpha", "Drums"), "Drums/alpha/k.wav");
      reporter.onAfterWrite(createEntryWithMeta("Bass/zebra/b.wav", "zebra", "Bass"), "Bass/zebra/b.wav");
      reporter.onComplete("/output");
      const output = getOutput();
      expect(output.indexOf("alpha:")).toBeLessThan(output.indexOf("zebra:"));
      expect(output.indexOf("  Bass:")).toBeLessThan(output.indexOf("  Synths:"));
    });

    it("does not print summary when organised is false", () => {
      const { reporter, getOutput } = createReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onComplete("/output");
      expect(getOutput()).not.toContain("sample");
    });

    it("prints summary from onPreview in organised mode", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onPreview(1, 0, 0);
      expect(getOutput()).toContain("my-pack: 1 sample\n");
      expect(getOutput()).toContain("  Drums: 1 sample\n");
    });

    it("does not count error writes in the summary", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav", new Error("fail"));
      reporter.onComplete("/output");
      expect(getOutput()).not.toContain("sample");
    });

    it("shows 0 samples and singular file count when package has only non-audio files", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"), "Drums/my-pack/patch.nki");
      reporter.onComplete("/output");
      expect(getOutput()).toContain("my-pack: 0 samples, 1 file\n");
    });

    it("shows non-audio files count when package has non-audio files alongside samples", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"), "Drums/my-pack/patch.nki");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch2.nki", "my-pack", "Drums"), "Drums/my-pack/patch2.nki");
      reporter.onComplete("/output");
      const output = getOutput();
      expect(output).toContain("my-pack: 1 sample, 2 files\n");
    });

    it("uses singular 'file' when non-audio count is 1", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"), "Drums/my-pack/patch.nki");
      reporter.onComplete("/output");
      expect(getOutput()).toContain("my-pack: 1 sample, 1 file\n");
    });

    it("shows non-audio file count on the type line when files exist for that type", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"), "Drums/my-pack/patch.nki");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch2.nki", "my-pack", "Drums"), "Drums/my-pack/patch2.nki");
      reporter.onComplete("/output");
      expect(getOutput()).toContain("  Drums: 1 sample, 2 files\n");
    });

    it("uses singular 'file' on type line when non-audio count is 1", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"), "Drums/my-pack/patch.nki");
      reporter.onComplete("/output");
      expect(getOutput()).toContain("  Drums: 1 sample, 1 file\n");
    });

    it("omits file count on type line when no non-audio files for that type", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onComplete("/output");
      expect(getOutput()).toContain("  Drums: 1 sample\n");
    });

    it("shows correct file count per type when non-audio files span multiple types", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"), "Drums/my-pack/kick.wav");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"), "Drums/my-pack/patch.nki");
      reporter.onAfterWrite(createEntryWithMeta("Synths/my-pack/synth.wav", "my-pack", "Synths"), "Synths/my-pack/synth.wav");
      reporter.onComplete("/output");
      const output = getOutput();
      expect(output).toContain("  Drums: 1 sample, 1 file\n");
      expect(output).toContain("  Synths: 1 sample\n");
    });

    it("shows 0 samples and file count when package has no audio files", () => {
      const { reporter, getOutput } = createOrganisedReporter();
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"), "Drums/my-pack/patch.nki");
      reporter.onAfterWrite(createEntryWithMeta("Drums/my-pack/patch2.nki", "my-pack", "Drums"), "Drums/my-pack/patch2.nki");
      reporter.onComplete("/output");
      expect(getOutput()).toContain("my-pack: 0 samples, 2 files\n");
    });
  });
});
