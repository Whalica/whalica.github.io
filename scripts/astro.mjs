import { spawnSync } from "node:child_process";
const command = process.argv[2];
const args =
  command === "check"
    ? ["check"]
    : command === "build"
      ? ["build"]
      : command === "preview"
        ? ["preview", "--host", "127.0.0.1"]
        : ["dev", "--host", "127.0.0.1"];
const result = spawnSync(
  process.execPath,
  ["node_modules/astro/bin/astro.mjs", ...args],
  { stdio: "inherit", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);
process.exit(result.status ?? 1);
