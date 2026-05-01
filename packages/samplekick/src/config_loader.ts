import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { Readable } from "node:stream";

import { JsonConfigReader } from "samplekick-io";
import type { Registry } from "samplekick-io";
import type appDirsType from "appdirsjs";

// CJS interop: appdirsjs is a CJS package that exports { default: fn }.
// Using createRequire avoids the ESM default-import interop issue at runtime.
const _require = createRequire(import.meta.url);
const _appDirsModule: unknown = _require("appdirsjs");
const isAppDirsModule = (m: unknown): m is { default: typeof appDirsType } =>
  typeof m === "object" && m !== null && "default" in m && typeof m.default === "function";
if (!isAppDirsModule(_appDirsModule)) {
  throw new Error("appdirsjs: unexpected module format");
}
const { default: appDirs } = _appDirsModule;

export const loadConfig = async (registry: Registry, configPath: string | undefined): Promise<string | undefined> => {
  if (configPath === undefined) {
    const dataDir = process.env.SAMPLEKICK_DATA_DIR ?? appDirs({ appName: "samplekick" }).data;
    const autoConfigPath = join(dataDir, `${registry.getFingerprint()}.json`);
    const content = await readFile(autoConfigPath, "utf8").catch((err: unknown) => {
      if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
        return undefined;
      }
      throw err;
    });
    if (content !== undefined) {
      try {
        registry.loadConfig(new JsonConfigReader(Readable.from([content])));
      } catch (err: unknown) {
        if (!(err instanceof SyntaxError)) throw err;
      }
    }
    return autoConfigPath;
  }

  const content = await readFile(configPath, "utf8").catch((err: unknown) => {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
      console.error(`Error: config file not found: ${configPath}`);
      process.exit(1);
    }
    throw err;
  });
  try {
    registry.loadConfig(new JsonConfigReader(Readable.from([content])));
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      console.error(`Error: config file is not valid JSON: ${configPath}`);
      process.exit(1);
    }
    throw err;
  }
  return undefined;
};
