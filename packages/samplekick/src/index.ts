#!/usr/bin/env node
import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { finished } from "node:stream/promises";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { parseArgs } from "node:util";
import { JsonConfigReader, JsonConfigWriter, Registry, SkipJunkTransformer, SourcePathStrategy, ZipDataSource, SP404Mk2Preset } from "samplekick-io";
import type { DevicePreset } from "samplekick-io";
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
if (values.config !== undefined) {
  const configPath = resolve(values.config);
  const configContent = await readFile(configPath, "utf8").catch((err: unknown) => {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
      console.error(`Error: config file not found: ${configPath}`);
      process.exit(1);
    }
    throw err;
  });
  try {
    registry.loadConfig(new JsonConfigReader(Readable.from([configContent])));
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      console.error(`Error: config file is not valid JSON: ${configPath}`);
      process.exit(1);
    }
    throw err;
  }
}
registry.setPathStrategy(SourcePathStrategy);

if (values.debug === true) {
  console.log(registry.toString(values.verbose === true));
  process.exit(0);
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
await registry.exportToDirectory(destPath).catch((err: unknown) => {
  console.error(`Error: could not export to ${destPath}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
console.log(`Exported to ${destPath}`);
