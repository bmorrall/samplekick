#!/usr/bin/env node
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { dirname, extname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { JsonConfigWriter, Registry, SkipJunkTransformer, SourcePathStrategy, ZipDataSource, SP404Mk2Preset } from "samplekick-io";
import { loadConfig } from "./config_loader";
import type { DevicePreset, FileEntry } from "samplekick-io";
import { SimpleExportReporter, PrettyExportReporter } from "./exporters";
import { CONVERTIBLE_EXTENSIONS, convertToSixteenBit } from "./audio_converter";
import chalk from "chalk";
import type { ExportReporter } from "./exporters";
import packageJson from "../package.json" with { type: "json" };

const CLI_ARG_START = 2;
const DEVICE_ALIAS_PAD_WIDTH = 24;

const DEVICE_PRESETS: Record<string, DevicePreset> = {
  sp404mk2: SP404Mk2Preset,
  sp404: SP404Mk2Preset,
  "404": SP404Mk2Preset,
};

const buildHelpText = (): string => {
  const seen = new Set<DevicePreset>();
  const deviceLines: string[] = [];
  for (const preset of Object.values(DEVICE_PRESETS)) {
    if (!seen.has(preset)) seen.add(preset);
  }
  const sorted = [...seen].sort((a, b) => a.displayName.localeCompare(b.displayName));
  for (const preset of sorted) {
    const aliases = Object.entries(DEVICE_PRESETS)
      .filter(([, p]) => p === preset)
      .map(([key]) => key)
      .sort((a, b) => b.length - a.length)
      .join(", ");
    deviceLines.push(`  ${aliases.padEnd(DEVICE_ALIAS_PAD_WIDTH)}${preset.displayName}`);
  }

  return `\
samplekick/${packageJson.version}

Usage: samplekick <zip-file> [-o <output-dir>]

Arguments:
  <zip-file>              Path to the input ZIP file

Options:
  -o, --output <path>     Export samples to a directory
                          (omit to dump JSON config to stdout)
  -c, --config <path>     Load a JSON config file to apply to the pack
  -w, --write <path>      Write the pack config as JSON to a file
  -d, --device <name>     Apply a device preset
      --convert           Convert audio files to 16-bit (WAV/AIFF only)
      --allow-junk        Keep junk entries (e.g. __MACOSX, hidden files)
      --debug             Print pack string representation to stdout
                          without writing any files
      --verbose           Show inherited tags on all nodes in debug output
  -v, --version           Show version number
  -h, --help              Show this help message

Devices:
${deviceLines.join("\n")}
`;
};

const { values, positionals } = parseArgs({
  args: process.argv.slice(CLI_ARG_START),
  options: {
    config: { type: "string", short: "c" },
    device: { type: "string", short: "d" },
    output: { type: "string", short: "o" },
    write: { type: "string", short: "w" },
    convert: { type: "boolean" },
    "allow-junk": { type: "boolean" },
    debug: { type: "boolean" },
    verbose: { type: "boolean" },
    version: { type: "boolean", short: "v" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: true,
});

if (values.version === true) {
  console.log(packageJson.version);
  process.exit(0);
}

if (values.help === true || process.argv.slice(CLI_ARG_START).length === 0) {
  console.log(buildHelpText());
  process.exit(0);
}

if (positionals.length === 0) {
  console.error("Error: missing required argument <zip-file>\n");
  console.error(buildHelpText());
  process.exit(1);
}

const devicePreset =
  values.device === undefined ? undefined : DEVICE_PRESETS[values.device];
if (values.device !== undefined && devicePreset === undefined) {
  console.error(
    `Error: unknown device "${values.device}". Valid devices: ${Object.keys(DEVICE_PRESETS).join(", ")}`,
  );
  process.exit(1);
}
const [inputPath] = positionals;

const zipPath = resolve(inputPath);

const dataSource = await ZipDataSource.fromFile(zipPath).catch((err: unknown) => {
  if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
    console.error(`Error: file not found: ${zipPath}`);
    process.exit(1);
  }
  if (err instanceof Error && err.message.includes("not zip file")) {
    console.error(`Error: not a valid zip file: ${zipPath}`);
    process.exit(1);
  }
  throw err;
});

const registry = new Registry(dataSource);
if (values["allow-junk"] !== true) {
  registry.applyTransform(SkipJunkTransformer);
}
if (devicePreset !== undefined) {
  for (const transform of devicePreset.transforms) {
    registry.applyTransform(transform);
  }
}
const autoConfigPath = await loadConfig(registry, values.config === undefined ? undefined : resolve(values.config));
registry.setPathStrategy(SourcePathStrategy);

if (values.debug === true) {
  console.log(registry.toString(values.verbose === true));
  process.exit(0);
}

if (autoConfigPath !== undefined) {
  const savePath = autoConfigPath;
  await mkdir(dirname(savePath), { recursive: true });
  const autoConfigStream = createWriteStream(savePath);
  new JsonConfigWriter(autoConfigStream).writeConfig(registry);
  autoConfigStream.end();
  await finished(autoConfigStream).catch((err: unknown) => {
    console.error(`Warning: could not save config to ${savePath}: ${err instanceof Error ? err.message : String(err)}`);
  });
}

if (values.write !== undefined) {
  const writePath = resolve(values.write);
  const fileStream = createWriteStream(writePath);
  new JsonConfigWriter(fileStream).writeConfig(registry);
  fileStream.end();
  await finished(fileStream).catch((err: unknown) => {
    console.error(`Error: could not write to ${writePath}: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

if (values.output === undefined) {
  new JsonConfigWriter(process.stdout).writeConfig(registry);
  process.exit(0);
}

const destPath = resolve(values.output);
const reporter: ExportReporter = chalk.level > 0 ? new PrettyExportReporter() : new SimpleExportReporter();

if (values.convert === true) {
  reporter.writeEntry = async (entry: FileEntry, dest: string) => {
    await entry.copyToPath(dest);
    if (CONVERTIBLE_EXTENSIONS.has(extname(dest).toLowerCase())) {
      await convertToSixteenBit(dest);
    }
  };
}

await registry.exportToDirectory(destPath, reporter).catch((err: unknown) => {
  console.error(`Error: could not export to ${destPath}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
reporter.onComplete(destPath);
