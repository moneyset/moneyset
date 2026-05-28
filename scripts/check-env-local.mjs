#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const envPath = ".env.local";
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

execSync("node scripts/check-env.mjs", { stdio: "inherit", env: process.env });
