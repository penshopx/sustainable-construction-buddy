import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(appDir, "../ruang-simpan/dist/public");
const targetDir = resolve(appDir, "dist/public/ruang-simpan");

if (!existsSync(resolve(sourceDir, "index.html"))) {
  throw new Error(`Ruang Simpan production build is missing: ${sourceDir}`);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

if (!existsSync(resolve(targetDir, "index.html"))) {
  throw new Error(`Ruang Simpan was not copied into the PUB build: ${targetDir}`);
}

console.log(`Packaged Ruang Simpan at ${targetDir}`);
