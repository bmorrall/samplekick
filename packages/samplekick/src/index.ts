#!/usr/bin/env node
/* eslint-disable max-lines -- TODO: split this file to bring it under the max-lines limit */
import { createWriteStream } from "node:fs";
import { Writable } from "node:stream";
import { mkdir } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { basename, dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  createAbletonProjectTransformer,
  createArchiveFileTransformer,
  CsvConfigWriter,
  createDefaultRootPackageNameTransformer,
  createDefaultRootSampleTypeTransformer,
  createDirectorySampleTypeTransformer,
  createDirectorySegmentSuffixTransformer,
  createDirectorySubcategoryTransformer,
  createDirectoryChildNameTransformer,
  createDrumSubcategoryTransformer,
  createExpandRootPackageNameTransformer,
  createFlatPackPrefixTransformer,
  createFLStudioProjectTransformer,
  createSP404Mk2ProjectTransformer,
  createGhosthackNameTransformer,
  createCymaticsNameTransformer,
  createSquashNameTransformer,
  createNormaliseQuotesTransformer,
  createKnownFileTypeTransformer,
  createMidiFileTransformer,
  createNormaliseBracketSpacingTransformer,
  createNormaliseCommaSpacingTransformer,
  createNormaliseHyphenSpacingTransformer,
  createNormaliseDashesTransformer,
  createStripFormatHintsTransformer,
  createNormaliseBpmTagTransformer,
  createNormaliseKeyTagTransformer,
  createNormaliseSpacesTransformer,
  OrganisedPathStrategy,
  Registry,
  createKeepParentsTransformer,
  createSkipJunkTransformer,
  SourcePathStrategy,
  createTrimNameTransformer,
  ZipDataSource,
  SP404Mk2Preset,
  DirtywaveM8Preset,
  formatSampleRate,
  formatBitDepth,
} from "samplekick-io";
import { loadConfig, openConfigInEditor, getDataDir } from "./config_loader";
import type { DevicePreset } from "samplekick-io";
import {
  SimpleExportReporter,
  PrettyExportReporter,
  DryRunReporter,
} from "./exporters";
import { AudioConverter } from "./post_processors";
import { createFfmpegRunner, getFfmpegVersion } from "./adaptors";
import chalk from "chalk";
import type { ExportReporter } from "./exporters";
import packageJson from "../package.json" with { type: "json" };

const CLI_ARG_START = 2;
const DEVICE_MAIN_ALIAS_PAD_WIDTH = 24;

const DEVICE_PRESETS: Record<string, DevicePreset> = {
  sp404mk2: SP404Mk2Preset,
  sp404: SP404Mk2Preset,
  "404": SP404Mk2Preset,
  dirtywavem8: DirtywaveM8Preset,
  dirtywave: DirtywaveM8Preset,
  m8: DirtywaveM8Preset,
};

const buildHelpText = (): string => {
  const seen = new Set<DevicePreset>();
  const deviceLines: string[] = [];
  for (const preset of Object.values(DEVICE_PRESETS)) {
    if (!seen.has(preset)) seen.add(preset);
  }
  const sorted = [...seen].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );
  for (const preset of sorted) {
    const aliasList = Object.entries(DEVICE_PRESETS)
      .filter(([, p]) => p === preset)
      .map(([key]) => key)
      .sort((a, b) => b.length - a.length);
    const [mainAlias = "", ...restAliases] = aliasList;
    const conversionSuffix =
      preset.targetBitDepth !== undefined &&
      preset.targetSampleRate !== undefined
        ? ` (converts to ${formatBitDepth(preset.targetBitDepth)} ${formatSampleRate(preset.targetSampleRate)})`
        : "";
    deviceLines.push(
      `  ${mainAlias.padEnd(DEVICE_MAIN_ALIAS_PAD_WIDTH)}${preset.displayName}${conversionSuffix}`,
    );
    if (restAliases.length > 0) {
      deviceLines.push(`    ${restAliases.join(", ")}`);
    }
  }

  return `\
samplekick/${packageJson.version}

Usage: samplekick <zip-file> [zip-file...] [-o <output-dir>]

Arguments:
  <zip-file> [zip-file...]  One or more input ZIP files

Options:
  -o, --output <path>     Export samples to a directory
                          Omit to preview changes without writing files
  -a, --analyse           Analyse pack and save to the auto-config
  -s, --sanitise          Normalise entry names (trim, spacing, dashes, tags)
  -d, --device <name>     Apply device-specific transforms to sample names
  -c, --convert           Convert audio files to device format
      --allow-junk        Keep junk entries (e.g. __MACOSX, hidden files)
      --keep-parents      Preserve parent folders for all directories with files
      --preserve-paths    Export to original source paths (skip organising)
      --squash            Convert names to camelCase after device transforms
      --debug             Print the pack structure to stdout for inspection
      --edit              Open the active config file in $VISUAL/$EDITOR
      --config <path>     Load a CSV config file to apply to the pack
      --write-config <path>
                          Write the pack config as CSV to a file
      --dump-config       Print the pack config as CSV to stdout, with device
                          and squash transforms applied
      --bake              Save the transformed config as the auto-config so
                          transforms are applied automatically on the next run
      --rebuild           Ignore the auto-config and analyse from scratch
      --verbose           Show skipped files, config paths, and inherited tags
      --quiet             Only show errors (suppress per-file success lines)
  -v, --version           Show version number
  -h, --help              Show this help message

Devices:
${deviceLines.join("\n")}
`;
};

const SEPARATOR_WIDTH = 40;
const SEPARATOR = `\n${"─".repeat(SEPARATOR_WIDTH)}\n\n`;

const makeSafeStdout = (stream: NodeJS.WriteStream): Writable => {
  let broken = false;
  stream.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EPIPE") {
      broken = true;
      return;
    }
    throw err;
  });
  return new Writable({
    write(chunk: Buffer, _encoding: BufferEncoding, callback: () => void) {
      if (!broken) stream.write(chunk);
      callback();
    },
  });
};

const saveConfigToStream = (
  registry: Registry,
  stream: Writable,
  options: { explicit?: boolean } = {},
): void => {
  new CsvConfigWriter(stream, { explicit: options.explicit }).writeConfig(
    registry,
  );
};

const saveConfigToPath = async (
  registry: Registry,
  savePath: string,
  options: { explicit?: boolean } = {},
): Promise<void> => {
  await mkdir(dirname(savePath), { recursive: true });
  const stream = createWriteStream(savePath);
  saveConfigToStream(registry, stream, options);
  await finished(stream).catch((err: unknown) => {
    console.error(
      `Warning: could not save config to ${savePath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  });
};

const buildAutoConfigPath = (registry: Registry, dataDir: string): string =>
  join(dataDir, `${registry.getFingerprint()}.csv`);

// eslint-disable-next-line @typescript-eslint/init-declarations -- assigned in try/catch below
let parseResult;
try {
  parseResult = parseArgs({
    args: process.argv.slice(CLI_ARG_START),
    options: {
      config: { type: "string" },
      device: { type: "string", short: "d" },
      output: { type: "string", short: "o" },
      "write-config": { type: "string" },
      "dump-config": { type: "boolean" },
      convert: { type: "boolean", short: "c" },
      analyse: { type: "boolean", short: "a" },
      "allow-junk": { type: "boolean" },
      "preserve-paths": { type: "boolean" },
      "keep-parents": { type: "boolean" },
      sanitise: { type: "boolean", short: "s" },
      squash: { type: "boolean" },
      bake: { type: "boolean" },
      rebuild: { type: "boolean" },
      debug: { type: "boolean" },
      edit: { type: "boolean" },
      verbose: { type: "boolean" },
      quiet: { type: "boolean" },
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });
} catch (err) {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
const { values, positionals } = parseResult;

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
const zipPaths = positionals.map((p) => resolve(p));

if (zipPaths.length > 1) {
  if (values.config !== undefined) {
    console.error("Error: --config cannot be used with multiple input files");
    process.exit(1);
  }
  if (values["write-config"] !== undefined) {
    console.error(
      "Error: --write-config cannot be used with multiple input files",
    );
    process.exit(1);
  }
  if (values["dump-config"] === true) {
    console.error(
      "Error: --dump-config cannot be used with multiple input files",
    );
    process.exit(1);
  }
  if (values.edit === true) {
    console.error("Error: --edit cannot be used with multiple input files");
    process.exit(1);
  }
  if (values.debug === true) {
    console.error("Error: --debug cannot be used with multiple input files");
    process.exit(1);
  }
}

const dataDir =
  process.env.SAMPLEKICK_DATA_DIR ??
  getDataDir("samplekick", process.platform, process.env);
const pathStrategy =
  values["preserve-paths"] === true
    ? SourcePathStrategy
    : OrganisedPathStrategy;

let conversion:
  | { targetBitDepth: number; targetSampleRate: number; ffmpegVersion: string }
  | undefined = undefined;
if (values.convert === true) {
  if (
    devicePreset?.targetBitDepth === undefined ||
    devicePreset.targetSampleRate === undefined
  ) {
    console.error(
      `Error: device "${values.device ?? ""}" does not support --convert (no conversion settings defined)`,
    );
    process.exit(1);
  }
  const { targetBitDepth, targetSampleRate } = devicePreset;
  const ffmpegVersion = await getFfmpegVersion().catch((err: unknown) => {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "ENOENT"
    ) {
      console.error(
        "Error: ffmpeg not found. Please install ffmpeg to use --convert.",
      );
      process.exit(1);
    }
    throw err;
  });
  conversion = { targetBitDepth, targetSampleRate, ffmpegVersion };
}

/* eslint-disable no-await-in-loop -- sequential per-file processing is intentional */
for (const [zipIndex, zipPath] of zipPaths.entries()) {
  if (zipIndex > 0) process.stdout.write(SEPARATOR);

  const reporter: ExportReporter =
    chalk.level > 0
      ? new PrettyExportReporter(process.stdout, chalk, {
          quiet: values.quiet === true,
          displayName: basename(zipPath),
          organised: values["preserve-paths"] !== true,
        })
      : new SimpleExportReporter(
          makeSafeStdout(process.stdout),
          values.quiet === true,
          basename(zipPath),
          values["preserve-paths"] !== true,
        );

  if (
    values.debug !== true &&
    values["dump-config"] !== true &&
    values.edit !== true
  ) {
    reporter.onStart(zipPath);
  }

  const dataSource = await ZipDataSource.fromFile(zipPath).catch(
    (err: unknown) => {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === "ENOENT"
      ) {
        console.error(`Error: file not found: ${zipPath}`);
        process.exit(1);
      }
      if (err instanceof Error && err.message.includes("not zip file")) {
        console.error(`Error: not a valid zip file: ${zipPath}`);
        process.exit(1);
      }
      throw err;
    },
  );

  const registry = new Registry(dataSource);

  // Debug messages are suppressed unless --verbose is passed
  const debugLog =
    values.verbose === true ? reporter.onDebug.bind(reporter) : undefined;

  if (conversion !== undefined) {
    registry.addPostProcessor(
      new AudioConverter(createFfmpegRunner(), {
        onError: (destPath, error) => {
          reporter.onError(
            `Could not convert ${basename(destPath)}: ${error.message}`,
          );
        },
        onDebug: debugLog,
        targetBitDepth: conversion.targetBitDepth,
        targetSampleRate: conversion.targetSampleRate,
      }),
    );
  }

  if (values["allow-junk"] !== true) {
    // Junk transforms: mark OS metadata and hidden files as skipped
    registry.applyTransform(createSkipJunkTransformer());
  }

  if (values.analyse === true || values["keep-parents"] === true) {
    // Root package name: set early from the zip filename so expand runs before
    // directory analysis, keeping packageName clean for the auto-config.
    registry.applyTransform(createDefaultRootPackageNameTransformer());
    registry.applyTransform(createExpandRootPackageNameTransformer());
  }

  if (values.analyse === true || values.sanitise === true) {
    registry.applyTransform(createTrimNameTransformer());
    registry.applyTransform(createNormaliseQuotesTransformer());
    registry.applyTransform(createNormaliseDashesTransformer());
  }

  if (values.analyse === true) {
    // File transforms: identify known file types and lock their folder structure
    registry.applyTransform(createKnownFileTypeTransformer());
    registry.applyTransform(createArchiveFileTransformer());
    registry.applyTransform(createAbletonProjectTransformer());
    registry.applyTransform(createFLStudioProjectTransformer());
    registry.applyTransform(createSP404Mk2ProjectTransformer());
  }

  if (values.analyse === true || values.sanitise === true) {
    // Name transforms: run after file transforms so locked entries are skipped
    registry.applyTransform(createGhosthackNameTransformer());
    registry.applyTransform(createCymaticsNameTransformer());
    registry.applyTransform(createNormaliseSpacesTransformer());
    registry.applyTransform(createNormaliseBracketSpacingTransformer());
    registry.applyTransform(createNormaliseCommaSpacingTransformer());
    registry.applyTransform(createNormaliseHyphenSpacingTransformer());
    registry.applyTransform(createStripFormatHintsTransformer());

    // Tag transforms: normalise embedded BPM and key tags to canonical forms
    registry.applyTransform(createNormaliseBpmTagTransformer());
    registry.applyTransform(createNormaliseKeyTagTransformer());
  }

  if (values.analyse === true) {
    // Directory transforms: run after name transforms so folder names are normalised first
    registry.applyTransform(createDrumSubcategoryTransformer());
    registry.applyTransform(createDirectorySampleTypeTransformer());
    registry.applyTransform(createDirectoryChildNameTransformer());
    registry.applyTransform(createDirectorySubcategoryTransformer());
    registry.applyTransform(createDirectorySegmentSuffixTransformer());
    registry.applyTransform(createFlatPackPrefixTransformer());

    // MIDI transforms: detect MIDI files after directory structure is resolved
    registry.applyTransform(createMidiFileTransformer());
  }

  if (values.analyse === true || values["keep-parents"] === true) {
    // Root sample type: runs after directory/MIDI transforms so their sampleType
    // assignments (e.g. FlatPackPrefixTransformer) are not skipped by the Packs default.
    registry.applyTransform(createDefaultRootSampleTypeTransformer());
  }

  if (values["keep-parents"] === true) {
    registry.applyTransform(createKeepParentsTransformer());
  }

  const configPath =
    values.config === undefined ? undefined : resolve(values.config);
  const autoConfigPath = await loadConfig(registry, configPath, dataDir, {
    skipAutoConfig: values.rebuild === true,
  }).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });

  if (
    (values.analyse === true ||
      values["keep-parents"] === true ||
      values.sanitise === true) &&
    autoConfigPath !== undefined &&
    values.bake !== true
  ) {
    await saveConfigToPath(registry, autoConfigPath);
  }

  if (devicePreset !== undefined) {
    for (const transform of devicePreset.transforms) {
      registry.applyTransform(transform);
    }
    for (const validator of devicePreset.validators) {
      registry.addValidator(validator);
    }
  }

  if (values.squash === true) {
    registry.applyTransform(createSquashNameTransformer());
  }

  registry.setPathStrategy(pathStrategy);

  if (values.verbose === true) {
    reporter.onInfo(`Reading: ${zipPath}`);
    if (configPath !== undefined) {
      reporter.onInfo(`Using config: ${configPath}`);
    } else if (autoConfigPath !== undefined) {
      reporter.onInfo(`Using auto-config: ${autoConfigPath}`);
    }
    if (conversion !== undefined) {
      reporter.onInfo(`Using ffmpeg: ${conversion.ffmpegVersion}`);
    }
  }

  if (values.debug === true) {
    console.log(registry.toString(values.verbose === true));
    process.exit(0);
  }

  if (values.edit === true) {
    const editPath = configPath ?? autoConfigPath;
    if (editPath === undefined) {
      console.error(
        "Error: no config file to edit. Run an export first to create an auto-config, or specify one with --config.",
      );
      process.exit(1);
    }
    openConfigInEditor(editPath, process.platform, process.env);
    process.exit(0);
  }

  if (values["write-config"] !== undefined) {
    const writePath = resolve(values["write-config"]);
    const fileStream = createWriteStream(writePath);
    saveConfigToStream(registry, fileStream, {
      explicit: values.bake === true,
    });
    await finished(fileStream).catch((err: unknown) => {
      console.error(
        `Error: could not write to ${writePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
      process.exit(1);
    });
  }

  if (values["dump-config"] === true) {
    saveConfigToStream(registry, process.stdout, {
      explicit: values.bake === true,
    });
    process.exit(0);
  }

  if (values.bake === true) {
    await saveConfigToPath(registry, buildAutoConfigPath(registry, dataDir), {
      explicit: true,
    });
  }

  if (values.output === undefined) {
    const dryRun = new DryRunReporter(reporter);
    await registry
      .exportToDirectory(undefined, {
        onAfterWrite: (e, p, err) => {
          dryRun.onAfterWrite(e, p, err);
        },
        onReject: (e, r) => {
          dryRun.onReject(e, r);
        },
        onSkip: (e) => {
          dryRun.onSkip(e);
        },
      })
      .catch((err: unknown) => {
        console.error(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      });
    dryRun.flush();
  } else {
    const destPath = resolve(values.output);
    await registry
      .exportToDirectory(destPath, {
        onBeforeWrite: (e, p) => {
          reporter.onBeforeWrite?.(e, p);
        },
        onAfterWrite: (e, p, err) => {
          reporter.onAfterWrite(e, p, err);
        },
        onReject: (e, r) => {
          reporter.onReject(e, r);
        },
        onSkip:
          values.verbose === true
            ? (e) => {
                reporter.onSkip(e);
              }
            : undefined,
      })
      .catch((err: unknown) => {
        console.error(
          `Error: could not export to ${destPath}: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      });
    reporter.onComplete(destPath);
  }
}
/* eslint-enable no-await-in-loop -- sequential per-file processing is intentional */
