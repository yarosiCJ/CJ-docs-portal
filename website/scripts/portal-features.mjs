import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const portalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function envFlag(name) {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") {
    return null;
  }
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

export function loadPortalFeatures() {
  const filePath = path.join(portalRoot, "portal-features.json");
  const file = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    docs: envFlag("PORTAL_ENABLE_DOCS") ?? Boolean(file.docs),
    postman: envFlag("PORTAL_ENABLE_POSTMAN") ?? Boolean(file.postman),
    integration: envFlag("PORTAL_ENABLE_INTEGRATION") ?? Boolean(file.integration),
  };
}
