import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { CsvConfigReader } from "samplekick-io";
import type { Registry } from "samplekick-io";

export const getDataDir = (appName: string, platform: NodeJS.Platform, env: NodeJS.ProcessEnv): string => {
  const home = homedir();
  if (platform === "linux") {
    return join(env.XDG_DATA_HOME ?? join(home, ".local", "share"), appName);
  } else if (platform === "win32") {
    return join(env.APPDATA ?? join(home, "AppData", "Roaming"), appName);
  } else {
    return join(home, "Library", "Application Support", appName);
  }
};

export const openConfigInEditor = (configPath: string, platform: NodeJS.Platform, env: NodeJS.ProcessEnv): void => {
  const editor = env.VISUAL ?? env.EDITOR;
  if (editor !== undefined) {
    spawnSync(editor, [configPath], { stdio: "inherit" });
  } else if (platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", configPath], { stdio: "inherit" });
  } else if (platform === "linux") {
    spawnSync("xdg-open", [configPath], { stdio: "inherit" });
  } else {
    spawnSync("open", ["-W", configPath], { stdio: "inherit" });
  }
};

export const loadConfig = async (registry: Registry, configPath: string | undefined, dataDir: string): Promise<string | undefined> => {
  if (configPath === undefined) {
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
      } catch (err) {
        throw new Error(`Error: auto-config could not be loaded from ${autoConfigPath} — ${String(err)}`, { cause: err });
      }
    }
    return autoConfigPath;
  }

  const content = await readFile(configPath, "utf8").catch((err: unknown) => {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT") {
      throw new Error(`Error: config file not found: ${configPath}`);
    }
    throw err;
  });
  registry.loadConfig(new CsvConfigReader(Readable.from([content])));
  return undefined;
};
