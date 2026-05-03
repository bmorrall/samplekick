#!/usr/bin/env node
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { basename, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { CsvConfigWriter, DefaultPackageNameTransformer, OrganisedPathStrategy, Registry, SkipJunkTransformer, SourcePathStrategy, ZipDataSource, SP404Mk2Preset, formatSampleRate, formatBitDepth } from "samplekick-io";
import { loadConfig, openConfigInEditor, getDataDir } from "./config_loader";
import type { DevicePreset } from "samplekick-io";
import { SimpleExportReporter, PrettyExportReporter } from "./exporters";
import { AudioConverter } from "./post_processors";
import { createFfmpegRunner, getFfmpegVersion } from "./adaptors";
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
    const conversionSuffix = preset.targetBitDepth !== undefined && preset.targetSampleRate !== undefined
      ? ` (converts to ${formatBitDepth(preset.targetBitDepth)} ${formatSampleRate(preset.targetSampleRate)})`
      : "";
    deviceLines.push(`  ${aliases.padEnd(DEVICE_ALIAS_PAD_WIDTH)}${preset.displayName}${conversionSuffix}`);
  }

  return `\
samplekick/${packageJson.version}

Usage: samplekick <zip-file> [-o <output-dir>]

Arguments:
  <zip-file>              Path to the input ZIP file

Options:
  -o, --output <path>     Export samples to a directory
                          (omit to dump CSV config to stdout)
  -a, --analyse           Analyse pack and save auto-config
  -d, --device <name>     Apply a device preset
  -c, --convert           Convert audio files to device format
      --allow-junk        Keep junk entries (e.g. __MACOSX, hidden files)
      --preserve-paths    Export to original source paths (skip organising)
      --debug             Print pack string representation to stdout
                          without writing any files
      --edit              Open the auto-config file in $VISUAL/$EDITOR
      --config <path>     Load a CSV config file to apply to the pack
      --write-config <path>
                          Write the pack config as CSV to a file
      --verbose           Show inherited tags on all nodes in debug output
      --quiet             Only show errors (suppress per-file success lines)
  -v, --version           Show version number
  -h, --help              Show this help message

Devices:
${deviceLines.join("\n")}
`;
};

const { values, positionals } = parseArgs({
  args: process.argv.slice(CLI_ARG_START),
  options: {
    config: { type: "string" },
    device: { type: "string", short: "d" },
    output: { type: "string", short: "o" },
    "write-config": { type: "string" },
    convert: { type: "boolean", short: "c" },
    analyse: { type: "boolean", short: "a" },
    "allow-junk": { type: "boolean" },
    "preserve-paths": { type: "boolean" },
    debug: { type: "boolean" },
    edit: { type: "boolean" },
    verbose: { type: "boolean" },
    quiet: { type: "boolean" },
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
if (values.convert === true && values.device === undefined) {
  console.error("Error: --convert requires a device preset (use -d/--device)");
  process.exit(1);
}
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

const reporter: ExportReporter = chalk.level > 0
  ? new PrettyExportReporter(process.stdout, chalk, { quiet: values.quiet === true, packName: basename(zipPath), organised: values["preserve-paths"] !== true })
  : new SimpleExportReporter(process.stdout, values.quiet === true, basename(zipPath));

// Debug messages (e.g. skipped entries) are suppressed unless --verbose is passed
const debugLog = values.verbose === true ? reporter.onDebug.bind(reporter) : undefined;

let ffmpegVersion: string | undefined = undefined;
if (values.convert === true) {
  if (devicePreset?.targetBitDepth === undefined || devicePreset.targetSampleRate === undefined) {
    console.error(`Error: device "${values.device ?? ""}" does not support --convert (no conversion settings defined)`);
    process.exit(1);
  }
  ffmpegVersion = await getFfmpegVersion().catch((err: unknown) => {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
      console.error("Error: ffmpeg not found. Please install ffmpeg to use --convert.");
      process.exit(1);
    }
    throw err;
  });
  registry.addPostProcessor(new AudioConverter(createFfmpegRunner(), {
    onError: (destPath, error) => { reporter.onError(`Could not convert ${basename(destPath)}: ${error.message}`); },
    onDebug: debugLog,
    targetBitDepth: devicePreset.targetBitDepth,
    targetSampleRate: devicePreset.targetSampleRate,
  }));
}

if (values.analyse === true) {
  registry.applyTransform(DefaultPackageNameTransformer);
}
if (devicePreset !== undefined) {
  for (const transform of devicePreset.transforms) {
    registry.applyTransform(transform);
  }
}
const dataDir = process.env.SAMPLEKICK_DATA_DIR ?? getDataDir("samplekick", process.platform, process.env);
const configPath = values.config === undefined ? undefined : resolve(values.config);
const autoConfigPath = await loadConfig(registry, configPath, dataDir).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
const pathStrategy = values["preserve-paths"] === true ? SourcePathStrategy : OrganisedPathStrategy;
registry.setPathStrategy(pathStrategy);

if (values.verbose === true) {
  reporter.onInfo(`Reading: ${zipPath}`);
  if (configPath !== undefined) {
    reporter.onInfo(`Using config: ${configPath}`);
  } else if (autoConfigPath !== undefined) {
    reporter.onInfo(`Using auto-config: ${autoConfigPath}`);
  }
  if (ffmpegVersion !== undefined) {
    reporter.onInfo(`Using ffmpeg: ${ffmpegVersion}`);
  }
}

if (values.debug === true) {
  console.log(registry.toString(values.verbose === true));
  process.exit(0);
}

if (values.analyse === true && autoConfigPath !== undefined) {
  const savePath = autoConfigPath;
  await mkdir(dirname(savePath), { recursive: true });
  const autoConfigStream = createWriteStream(savePath);
  new CsvConfigWriter(autoConfigStream).writeConfig(registry);
  await finished(autoConfigStream).catch((err: unknown) => {
    console.error(`Warning: could not save config to ${savePath}: ${err instanceof Error ? err.message : String(err)}`);
  });
}

if (values.edit === true) {
  const editPath = configPath ?? autoConfigPath;
  if (editPath === undefined) {
    console.error("Error: no config file to edit. Run an export first to create an auto-config, or specify one with --config.");
    process.exit(1);
  }
  openConfigInEditor(editPath, process.platform, process.env);
  process.exit(0);
}

if (values["write-config"] !== undefined) {
  const writePath = resolve(values["write-config"]);
  const fileStream = createWriteStream(writePath);
  new CsvConfigWriter(fileStream).writeConfig(registry);
  await finished(fileStream).catch((err: unknown) => {
    console.error(`Error: could not write to ${writePath}: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}

if (values.output === undefined) {
  new CsvConfigWriter(process.stdout).writeConfig(registry);
  process.exit(0);
}

const destPath = resolve(values.output);
await registry.exportToDirectory(destPath, {
  onDebug: debugLog,
  onBeforeWrite: (e, p) => { reporter.onBeforeWrite?.(e, p); },
  onAfterWrite: (e, p, err) => { reporter.onAfterWrite?.(e, p, err); },
  onSkip: (e, r) => { reporter.onSkip(e, r); },
}).catch((err: unknown) => {
  console.error(`Error: could not export to ${destPath}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
reporter.onComplete(destPath);
