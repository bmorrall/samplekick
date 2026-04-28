import type { Writable } from "node:stream";
import type {
  ConfigSource,
  ConfigEntry,
  ConfigWriter,
} from "../types";
import { getPathName } from "../path_utils";

export interface DataSourceEntryJSON {
  path: string;
  name?: string;
  packageName: string | undefined;
  sampleType: string | undefined;
  isSkipped: boolean | undefined;
  isKeepStructure: boolean | undefined;
}

const JSON_INDENT = 2;

const serializeEntry = (entry: ConfigEntry): DataSourceEntryJSON => {
  const name = entry.getName();
  const path = entry.getPath();

  return {
    path,
    name: name === getPathName(path) ? undefined : name,
    packageName: entry.getPackageName(),
    sampleType: entry.getSampleType(),
    isSkipped: entry.isSkipped(),
    isKeepStructure: entry.isKeepStructure(),
  };
};

export class JsonConfigWriter implements ConfigWriter {
  private readonly stream: Writable;

  constructor(stream: Writable) {
    this.stream = stream;
  }

  writeConfig(configSource: ConfigSource): void {
    const entries: DataSourceEntryJSON[] = [];
    configSource.eachConfigEntry((entry) => {
      entries.push(serializeEntry(entry));
    });
    this.stream.write(JSON.stringify(entries, null, JSON_INDENT));
  }
}
