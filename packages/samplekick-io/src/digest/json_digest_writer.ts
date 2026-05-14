import type { Writable } from "node:stream";
import type { DigestSource, DigestEntry, DigestWriter } from "../types";
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

const serializeEntry = (entry: DigestEntry): DataSourceEntryJSON => {
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

export class JsonDigestWriter implements DigestWriter {
  private readonly stream: Writable;

  constructor(stream: Writable) {
    this.stream = stream;
  }

  writeDigest(digestSource: DigestSource): void {
    const entries: DataSourceEntryJSON[] = [];
    digestSource.eachDigestEntry((entry) => {
      entries.push(serializeEntry(entry));
    });
    this.stream.write(JSON.stringify(entries, null, JSON_INDENT));
  }
}
