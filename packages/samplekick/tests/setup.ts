import { execSync } from "node:child_process";
import { resolve } from "node:path";

export const setup = (): void => {
  execSync("pnpm build", {
    cwd: resolve(import.meta.dirname, ".."),
    stdio: "inherit",
  });
};
