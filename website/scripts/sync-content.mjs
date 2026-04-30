import fs from "node:fs/promises";
import path from "node:path";

const portalRoot = path.resolve(import.meta.dirname, "..");

function getEnv(name, fallback) {
  return process.env[name] && process.env[name].trim() ? process.env[name].trim() : fallback;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureEmptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function copyFileIfExists(src, dst) {
  if (!(await exists(src))) {
    console.warn(`[sync] missing file: ${src}`);
    return;
  }
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
  console.log(`[sync] file  ${src} -> ${dst}`);
}

async function firstExistingFile(candidates) {
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

async function copyDirIfExists(src, dst) {
  if (!(await exists(src))) {
    console.warn(`[sync] missing dir: ${src}`);
    return;
  }
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.cp(src, dst, { recursive: true });
  console.log(`[sync] dir   ${src} -> ${dst}`);
}

// Defaults are tailored to your local layout (can be overridden in CI/local).
// You can override any path via env vars when running locally or in CI.
const SOURCES_ROOT = path.resolve(getEnv("SOURCES_ROOT", "/Users/yarosi/Documents/Python"));

const OPENAPI_SPEC_FILE_RAW = getEnv("OPENAPI_SPEC_FILE", "");
const OPENAPI_SPEC_FILE =
  OPENAPI_SPEC_FILE_RAW.trim() !== ""
    ? path.resolve(OPENAPI_SPEC_FILE_RAW)
    : await firstExistingFile([
        path.join(SOURCES_ROOT, "ApiRefactoring", "web", "openapi.bundled.yaml"),
      ]);
const OPENAPI_SCHEMAS_DIR = path.resolve(
  getEnv(
    "OPENAPI_SCHEMAS_DIR",
    path.join(SOURCES_ROOT, "ApiRefactoring", "openapi-built", "components", "schemas"),
  ),
);
const COP_MD = path.resolve(
  getEnv("COP_MD", path.join(SOURCES_ROOT, "ApiRefactoring", "docs", "reference", "cop.md")),
);
const POSTMAN_COLLECTION_RAW = getEnv("POSTMAN_COLLECTION", "");
const POSTMAN_COLLECTION =
  POSTMAN_COLLECTION_RAW.trim() !== ""
    ? path.resolve(POSTMAN_COLLECTION_RAW)
    : await firstExistingFile([
        path.join(SOURCES_ROOT, "Postman_CJ_sand", "Clear_Junction_API.postman_collection.json"),
        path.join(portalRoot, "..", "sources", "collection", "Clear_Junction_API.postman_collection.json"),
        path.join(portalRoot, "sources", "collection", "Clear_Junction_API.postman_collection.json"),
      ]);
const INTEGRATION_DOCS_DIR = path.resolve(
  getEnv("INTEGRATION_DOCS_DIR", path.join(SOURCES_ROOT, "Integration_scenarious", "docs")),
);

const dstDocs = path.join(portalRoot, "docs");
const dstStatic = path.join(portalRoot, "static");

const dstOpenApiDir = path.join(dstStatic, "openapi");
const dstSchemasDir = path.join(dstOpenApiDir, "schemas");
const dstPostmanDir = path.join(dstStatic, "postman");
const dstIntegrationDir = path.join(dstDocs, "integration");
const dstReferenceDir = path.join(dstDocs, "reference");

console.log("[sync] portalRoot:", portalRoot);

// Keep the default tutorial docs if present, but replace the folders we manage.
await fs.mkdir(dstDocs, { recursive: true });
await fs.mkdir(dstStatic, { recursive: true });

await ensureEmptyDir(dstOpenApiDir);
await ensureEmptyDir(dstPostmanDir);
await ensureEmptyDir(dstIntegrationDir);
await fs.mkdir(dstReferenceDir, { recursive: true });

if (OPENAPI_SPEC_FILE) {
  await copyFileIfExists(OPENAPI_SPEC_FILE, path.join(dstOpenApiDir, "openapi.yaml"));
} else {
  console.warn("[sync] missing OpenAPI bundled spec file (no candidates found)");
}
await copyDirIfExists(OPENAPI_SCHEMAS_DIR, dstSchemasDir);

if (POSTMAN_COLLECTION) {
  await copyFileIfExists(POSTMAN_COLLECTION, path.join(dstPostmanDir, "Clear_Junction_API.postman_collection.json"));
} else {
  console.warn("[sync] missing Postman collection file (no candidates found)");
}
await copyFileIfExists(COP_MD, path.join(dstReferenceDir, "cop.md"));
await copyDirIfExists(INTEGRATION_DOCS_DIR, dstIntegrationDir);

console.log("[sync] done");

