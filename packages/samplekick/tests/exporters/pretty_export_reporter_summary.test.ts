import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { Chalk } from "chalk";
import type { FileNode } from "samplekick-io";
import { PrettyExportReporter } from "../../src/exporters/pretty_export_reporter";

const chalk1 = new Chalk({ level: 1 });

const ESC = String.fromCharCode(0x1b);
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, "gv");
const stripAnsi = (s: string): string => s.replace(ANSI_RE, "");

const createEntryWithMeta = (
  path: string,
  packageName: string,
  sampleType: string,
): FileNode => ({
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

const createOrganisedReporter = (): {
  reporter: PrettyExportReporter;
  getOutput: () => string;
} => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => {
    chunks.push(chunk.toString());
  });
  const reporter = new PrettyExportReporter(stream, chalk1, {
    organised: true,
  });
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

const createNonOrganisedReporter = (): {
  reporter: PrettyExportReporter;
  getOutput: () => string;
} => {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on("data", (chunk: Buffer) => {
    chunks.push(chunk.toString());
  });
  const reporter = new PrettyExportReporter(stream, chalk1, {
    organised: false,
  });
  const getOutput = (): string => chunks.join("");
  return { reporter, getOutput };
};

describe("PrettyExportReporter organised summary", () => {
  it("prints package total and sampleType breakdown after onComplete", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/snare.wav", "my-pack", "Drums"),
      "Drums/my-pack/snare.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Synths/my-pack/synth.wav", "my-pack", "Synths"),
      "Synths/my-pack/synth.wav",
    );
    reporter.onComplete("/output");
    const output = stripAnsi(getOutput());
    expect(output).toContain("my-pack: 3 samples\n");
    expect(output).toContain("  Drums: 2 samples\n");
    expect(output).toContain("  Synths: 1 sample\n");
  });

  it("colours packageName with greenBright and sampleType with cyan", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onComplete("/output");
    const raw = getOutput();
    expect(raw).toContain("\x1B[92m"); // greenBright — package name
    expect(raw).toContain("\x1B[36m"); // cyan — sampleType
  });

  it("sorts packages and sampleTypes alphabetically", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Synths/zebra/s.wav", "zebra", "Synths"),
      "Synths/zebra/s.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/alpha/k.wav", "alpha", "Drums"),
      "Drums/alpha/k.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Bass/zebra/b.wav", "zebra", "Bass"),
      "Bass/zebra/b.wav",
    );
    reporter.onComplete("/output");
    const output = stripAnsi(getOutput());
    expect(output.indexOf("alpha:")).toBeLessThan(output.indexOf("zebra:"));
    expect(output.indexOf("  Bass:")).toBeLessThan(output.indexOf("  Synths:"));
  });

  it("does not print summary when organised is false", () => {
    const { reporter, getOutput } = createNonOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onComplete("/output");
    expect(stripAnsi(getOutput())).not.toContain("my-pack:");
  });

  it("prints summary from onPreview in organised mode", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onPreview();
    expect(stripAnsi(getOutput())).toContain("my-pack: 1 sample\n");
    expect(stripAnsi(getOutput())).toContain("  Drums: 1 sample\n");
  });

  it("does not count error writes in the summary", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
      new Error("fail"),
    );
    reporter.onComplete("/output");
    expect(stripAnsi(getOutput())).not.toContain("my-pack:");
  });

  it("shows 0 samples and singular file count when package has only non-audio files", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch.nki",
    );
    reporter.onComplete("/output");
    expect(stripAnsi(getOutput())).toContain("my-pack: 0 samples, 1 file\n");
  });

  it("shows non-audio files count when package has non-audio files alongside samples", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch.nki",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch2.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch2.nki",
    );
    reporter.onComplete("/output");
    const output = stripAnsi(getOutput());
    expect(output).toContain("my-pack: 1 sample, 2 files\n");
  });

  it("uses singular 'file' when non-audio count is 1", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch.nki",
    );
    reporter.onComplete("/output");
    const output = stripAnsi(getOutput());
    expect(output).toContain("my-pack: 1 sample, 1 file\n");
  });

  it("shows non-audio file count on the type line when files exist for that type", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch.nki",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch2.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch2.nki",
    );
    reporter.onComplete("/output");
    expect(stripAnsi(getOutput())).toContain("  Drums: 1 sample, 2 files\n");
  });

  it("uses singular 'file' on type line when non-audio count is 1", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch.nki",
    );
    reporter.onComplete("/output");
    expect(stripAnsi(getOutput())).toContain("  Drums: 1 sample, 1 file\n");
  });

  it("omits file count on type line when no non-audio files for that type", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onComplete("/output");
    expect(stripAnsi(getOutput())).toContain("  Drums: 1 sample\n");
  });

  it("shows correct file count per type when non-audio files span multiple types", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/kick.wav", "my-pack", "Drums"),
      "Drums/my-pack/kick.wav",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch.nki",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Synths/my-pack/synth.wav", "my-pack", "Synths"),
      "Synths/my-pack/synth.wav",
    );
    reporter.onComplete("/output");
    const output = stripAnsi(getOutput());
    expect(output).toContain("  Drums: 1 sample, 1 file\n");
    expect(output).toContain("  Synths: 1 sample\n");
  });

  it("shows 0 samples and file count when package has no audio files", () => {
    const { reporter, getOutput } = createOrganisedReporter();
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch.nki",
    );
    reporter.onAfterWrite(
      createEntryWithMeta("Drums/my-pack/patch2.nki", "my-pack", "Drums"),
      "Drums/my-pack/patch2.nki",
    );
    reporter.onComplete("/output");
    const output = stripAnsi(getOutput());
    expect(output).toContain("my-pack: 0 samples, 2 files\n");
  });
});
