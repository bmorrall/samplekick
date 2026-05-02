import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { CsvConfigReader } from "samplekick-io";
import type { Registry } from "samplekick-io";

export const getDataDir = (appName: string): string => {
  const home = homedir();
  if (process.platform === "linux") {
    return join(process.env.XDG_DATA_HOME ?? join(home, ".local", "share"), appName);
  } else if (process.platform === "win32") {
    return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), appName);
  } else {
    return join(home, "Library", "Application Support", appName);
  }
};

export const openConfigInEditor = (configPath: string): void => {
  const editor = process.env.VISUAL ?? process.env.EDITOR;
  if (editor !== undefined) {
    spawnSync(editor, [configPath], { stdio: "inherit" });
  } else if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", configPath], { stdio: "inherit" });
  } else if (process.platform === "linux") {
    spawnSync("xdg-open", [configPath], { stdio: "inherit" });
  } else {
    spawnSync("open", ["-W", configPath], { stdio: "inherit" });
  }
};

export const loadConfig = async (registry: Registry, configPath: string | undefined): Promise<string | undefined> => {
  if (configPath === undefined) {
    const dataDir = process.env.SAMPLEKICK_DATA_DIR ?? getDataDir("samplekick");
    const autoConfigPath = join(dataDir, `${registry.getFingerprint()}.csv`);
    const content = await readFile(autoConfigPath, "utf8").catch((err: unknown) => {
      if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
        return undefined;
      }
      throw err;
    });
    if (content !== undefined) {
      try {
        registry.loadConfig(new CsvConfigReader(Readable.from([content])));
      } catch {
        // silently ignore corrupt auto-config files
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
  registry.loadConfig(new CsvConfigReader(Readable.from([content])));
  return undefined;
};
