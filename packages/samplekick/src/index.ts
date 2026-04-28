#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";
import { JsonConfigWriter, Registry, SkipJunkTransformer, SourcePathStrategy, ZipDataSource } from "samplekick-io";

const CLI_ARG_START = 2;

const HELP_TEXT = `\
Usage: samplekick <zip-file> [-o <output-dir>]

Arguments:
  <zip-file>              Path to the input ZIP file

Options:
  -o, --output <path>     Directory to export samples into
                          (omit to dump the pack config as JSON to stdout)
      --allow-junk        Keep junk entries (e.g. __MACOSX, hidden files)
      --debug             Print pack string representation to stdout
                          without writing any files
  -h, --help              Show this help message
`;

const { values, positionals } = parseArgs({
  args: process.argv.slice(CLI_ARG_START),
  options: {
    output: { type: "string", short: "o" },
    "allow-junk": { type: "boolean" },
    debug: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: true,
});

if (values.help === true || process.argv.slice(CLI_ARG_START).length === 0) {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (positionals.length === 0) {
  console.error("Error: missing required argument <zip-file>\n");
  console.error(HELP_TEXT);
  process.exit(1);
}
const [inputPath] = positionals;

const zipPath = resolve(inputPath);

const buffer = await readFile(zipPath);
const blob = new Blob([buffer]);
const dataSource = await ZipDataSource.fromBlob(blob);

const registry = new Registry(basename(zipPath));
registry.load(dataSource);
if (values["allow-junk"] !== true) {
  registry.applyTransform(SkipJunkTransformer);
}
registry.setPathStrategy(SourcePathStrategy);

if (values.debug === true) {
  console.log(registry.toString());
  process.exit(0);
}

if (values.output === undefined) {
  new JsonConfigWriter(process.stdout).writeConfig(registry);
  process.exit(0);
}

const destPath = resolve(values.output);
await registry.exportToDirectory(destPath);
console.log(`Exported to ${destPath}`);
