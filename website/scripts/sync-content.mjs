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

async function patchTextFileIfExists(filePath, patchFn) {
  if (!(await exists(filePath))) return;
  const before = await fs.readFile(filePath, "utf8");
  const after = patchFn(before);
  if (after !== before) {
    await fs.writeFile(filePath, after, "utf8");
    console.log(`[sync] file  (patched) -> ${filePath}`);
  }
}

async function writeFile(dir, filename, content) {
  const p = path.join(dir, filename);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content, "utf8");
  console.log(`[sync] file  (generated) -> ${p}`);
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

async function copyDirIfExistsExcludingReadmes(src, dst) {
  if (!(await exists(src))) {
    console.warn(`[sync] missing dir: ${src}`);
    return;
  }
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.cp(src, dst, {
    recursive: true,
    filter: (source) => path.basename(source) !== "README.md",
  });
  console.log(`[sync] dir   ${src} -> ${dst} (excluding README.md)`);
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
const OPENAPI_DIAGRAMS_DIR = path.resolve(
  getEnv(
    "OPENAPI_DIAGRAMS_DIR",
    path.join(SOURCES_ROOT, "ApiRefactoring", "docs", "diagrams", "out"),
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
const INTEGRATION_REPO_ROOT = path.resolve(
  getEnv("INTEGRATION_REPO_ROOT", path.join(SOURCES_ROOT, "CJ_API_Integration_Scenarios")),
);
// Backwards compatible: if INTEGRATION_DOCS_DIR is set, we still use it as "guides".
const INTEGRATION_GUIDES_DIR = path.resolve(
  getEnv("INTEGRATION_DOCS_DIR", path.join(INTEGRATION_REPO_ROOT, "docs")),
);
const INTEGRATION_SCENARIOS_DIR = path.resolve(
  getEnv("INTEGRATION_SCENARIOS_DIR", path.join(INTEGRATION_REPO_ROOT, "scenarios")),
);

const dstDocs = path.join(portalRoot, "docs");
const dstStatic = path.join(portalRoot, "static");

const dstOpenApiDir = path.join(dstStatic, "openapi");
const dstSchemasDir = path.join(dstOpenApiDir, "schemas");
const dstPostmanDir = path.join(dstStatic, "postman");
const dstDiagramsDir = path.join(dstStatic, "docs", "diagrams", "out");
const dstIntegrationDir = path.join(dstDocs, "integration");
const dstIntegrationGuidesDir = path.join(dstIntegrationDir, "guides");
const dstIntegrationScenariosDir = path.join(dstIntegrationDir, "scenarios");
const dstReferenceDir = path.join(dstDocs, "reference");

console.log("[sync] portalRoot:", portalRoot);

// Keep the default tutorial docs if present, but replace the folders we manage.
await fs.mkdir(dstDocs, { recursive: true });
await fs.mkdir(dstStatic, { recursive: true });

await ensureEmptyDir(dstOpenApiDir);
await ensureEmptyDir(dstPostmanDir);
await ensureEmptyDir(dstDiagramsDir);
await ensureEmptyDir(dstIntegrationDir);
await fs.mkdir(dstReferenceDir, { recursive: true });

if (OPENAPI_SPEC_FILE) {
  const dstOpenApiSpec = path.join(dstOpenApiDir, "openapi.yaml");
  await copyFileIfExists(OPENAPI_SPEC_FILE, dstOpenApiSpec);

  // Docusaurus docs are routed without file extensions (e.g. /docs/reference/cop),
  // so patch contract markdown links that mistakenly point to .md source files.
  await patchTextFileIfExists(dstOpenApiSpec, (s) => s.replaceAll("../docs/reference/cop.md", "../docs/reference/cop"));
} else {
  console.warn("[sync] missing OpenAPI bundled spec file (no candidates found)");
}
await copyDirIfExists(OPENAPI_SCHEMAS_DIR, dstSchemasDir);
await copyDirIfExists(OPENAPI_DIAGRAMS_DIR, dstDiagramsDir);

if (POSTMAN_COLLECTION) {
  await copyFileIfExists(POSTMAN_COLLECTION, path.join(dstPostmanDir, "Clear_Junction_API.postman_collection.json"));
} else {
  console.warn("[sync] missing Postman collection file (no candidates found)");
}
await copyFileIfExists(COP_MD, path.join(dstReferenceDir, "cop.md"));
await copyDirIfExistsExcludingReadmes(INTEGRATION_GUIDES_DIR, dstIntegrationGuidesDir);
await copyDirIfExistsExcludingReadmes(INTEGRATION_SCENARIOS_DIR, dstIntegrationScenariosDir);

// Ensure the integration section is visible in the sidebar even if the source repo
// currently contains only README.md (which we intentionally exclude).
await writeFile(
  dstIntegrationDir,
  "_category_.json",
  JSON.stringify({ label: "Integration", position: 20 }, null, 2) + "\n",
);
await writeFile(
  dstIntegrationDir,
  "index.mdx",
  `---\nsidebar_position: 1\n---\n\n# Integration\n\nThis section is synced from the integration scenarios repository.\n\n- **Guides** are taken from \`docs/**\`\n- **Scenarios** are taken from \`scenarios/**\`\n- Files named \`README.md\` are intentionally excluded everywhere.\n`,
);

await writeFile(
  dstIntegrationGuidesDir,
  "_category_.json",
  JSON.stringify({ label: "Guides", position: 1 }, null, 2) + "\n",
);
await writeFile(
  dstIntegrationGuidesDir,
  "index.mdx",
  `---\nsidebar_position: 1\n---\n\n# Integration guides\n\nNarrative documentation for integration flows, prerequisites, and troubleshooting.\n\nContent is synced from the integration scenarios repository (\`docs/**\`) excluding \`README.md\`.\n`,
);
await writeFile(
  dstIntegrationScenariosDir,
  "_category_.json",
  JSON.stringify({ label: "Scenarios", position: 2 }, null, 2) + "\n",
);
await writeFile(
  dstIntegrationScenariosDir,
  "index.mdx",
  `---\nsidebar_position: 1\n---\n\n# Integration scenarios\n\nStep-by-step playbooks and scenario documents.\n\nContent is synced from the integration scenarios repository (\`scenarios/**\`) excluding \`README.md\`.\n`,
);

console.log("[sync] done");

