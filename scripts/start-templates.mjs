import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const registryPath = resolve(repoRoot, "public", "templates.json");

const children = new Set();

function killAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

function readRegistry() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(registryPath, "utf8"));
  } catch (err) {
    console.error(`[templates] Failed to read registry at ${registryPath}`);
    console.error(`[templates] ${err.message}`);
    process.exit(1);
  }
  return raw;
}

function detectPackageManager(sourceDir) {
  if (existsSync(resolve(sourceDir, "bun.lockb")) || existsSync(resolve(sourceDir, "bun.lock"))) {
    return "bun";
  }
  return "npm";
}

function isBinaryAvailable(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function resolvePackageManager(sourceDir, title) {
  const preferred = detectPackageManager(sourceDir);
  if (preferred === "bun" && !isBinaryAvailable("bun")) {
    console.warn(`[templates] bun not found in PATH, falling back to npm for "${title}"`);
    return "npm";
  }
  return preferred;
}

function startLocalEntry(entry) {
  const sourceDir = resolve(repoRoot, entry.sourcePath);
  if (!existsSync(sourceDir)) {
    console.warn(`[templates] Skipping "${entry.title}": sourcePath "${entry.sourcePath}" does not exist.`);
    return;
  }

  const pkgManager = resolvePackageManager(sourceDir, entry.title);
  const command = pkgManager === "bun" ? "bun" : "npm";
  const args = ["run", "dev"];

  console.log(`[templates] Starting "${entry.title}" (${pkgManager} run dev) -> ${entry.url}`);
  const child = spawn(command, args, {
    cwd: sourceDir,
    stdio: "inherit",
  });
  children.add(child);
  child.on("error", (err) => {
    console.error(`[templates] Failed to start "${entry.title}" (${command} run dev): ${err.message}`);
    children.delete(child);
  });
  child.on("exit", () => children.delete(child));
}

function main() {
  const registry = readRegistry();
  const local = Array.isArray(registry?.local) ? registry.local : [];

  const startable = local.filter((entry) => entry && entry.sourcePath);
  if (startable.length === 0) {
    console.log("[templates] No startable local templates found in public/templates.json.");
    process.exit(0);
  }

  for (const entry of startable) {
    startLocalEntry(entry);
  }

  console.log(`[templates] Started ${startable.length} local template dev server(s). Press Ctrl+C to stop.`);
}

process.on("SIGINT", () => {
  killAll();
  process.exit(0);
});
process.on("SIGTERM", () => {
  killAll();
  process.exit(0);
});

main();
