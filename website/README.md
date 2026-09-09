# Clear Junction API docs portal

Static documentation portal built with [Docusaurus](https://docusaurus.io/).

Russian version: [README.ru.md](./README.ru.md)

## What it includes

- **Docs** (Markdown/MDX) with an auto-generated sidebar
- **`/reference`** — OpenAPI reference rendered with [Redoc](https://github.com/Redocly/redoc)
- **`static/openapi/*`** — published `openapi.yaml` + schemas
- **`static/postman/*`** — published Postman collection
- **Integration guides/scenarios** synced from the integration repository

Before `start` / `build`, `npm run sync` copies content from sibling source repos into `docs/` and `static/`.

## Requirements

- Node.js **20+** (CI uses **Node 24**)
- npm 10+

## Installation

```bash
npm i
```

## Local development

```bash
npm run start
```

Starts a local development server and opens a browser window. Most changes are reflected live without a restart.

## Build

```bash
npm run build
```

Generates static content into the `build/` directory. Serve it with any static host, or use `npm run serve` locally.

## Sync sources (env overrides)

By default `sync` looks for local sibling paths under `SOURCES_ROOT` (default: `/Users/yarosi/Documents/Python`). Override any path via env vars:

```bash
SOURCES_ROOT="/Users/yarosi/Documents/Python" \
OPENAPI_SPEC_FILE="/Users/yarosi/Documents/Python/ApiRefactoring/web/openapi.bundled.yaml" \
OPENAPI_SCHEMAS_DIR="/Users/yarosi/Documents/Python/ApiRefactoring/openapi-built/components/schemas" \
OPENAPI_DIAGRAMS_DIR="/Users/yarosi/Documents/Python/ApiRefactoring/docs/diagrams/out" \
COP_MD="/Users/yarosi/Documents/Python/ApiRefactoring/docs/reference/cop.md" \
POSTMAN_COLLECTION="/Users/yarosi/Documents/Python/Postman_CJ_sand/Clear_Junction_API.postman_collection.json" \
INTEGRATION_REPO_ROOT="/Users/yarosi/Documents/Python/CJ_API_Integration_Scenarios" \
npm run sync
```

Synced outputs (`static/openapi/`, `static/postman/`, `docs/integration/`, etc.) are gitignored and regenerated on each build.

## GitHub Pages

Workflow: [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)

It auto-sets:

- `DOCS_URL` — e.g. `https://<owner>.github.io`
- `DOCS_BASE_URL` — e.g. `/<repo>/`

CI also checkouts source repositories (requires repo secret `DOCS_SOURCES_TOKEN`):

| Source | Repository | Checkout path | Used for |
| --- | --- | --- | --- |
| Contract | `yarosiCJ/CJ_API_Refact` | `sources/contract` | `web/openapi.bundled.yaml`, schemas, diagrams, COP |
| Collection | `yarosiCJ/CJ_API_Sandbox` | `sources/collection` | Postman collection JSON |
| Integration | `yarosiCJ/CJ_API_Integration_Scenarios` | `sources/integration` | `docs/` + `scenarios/` |

Deploy triggers:

- push to `main`
- manual `workflow_dispatch` in GitHub Actions

Live site: https://yarosicj.github.io/CJ-docs-portal/

## Stack (current)

| Component | Project | Notes |
| --- | --- | --- |
| Docusaurus | `^3.10.1` (lock ≈ 3.10.1) | Latest stable is **3.10.2** — safe patch bump |
| `@docusaurus/*` helpers | `3.10.0` | Prefer aligning all `@docusaurus/*` to the same version |
| React | `^19` | Current; fine |
| Redoc | `^2.5.2` (lock 2.5.2) | Latest **2.5.3** — safe patch bump |
| TypeScript | `~6.0.2` | Latest major is **7.x**; stay on 6 unless you need 7 |
| Node (CI) | 24 | Matches GitHub Actions current default direction |
| Actions | `checkout@v4`, `setup-node@v4`, Pages actions v3/v4 | Still adequate; optional later bump to newer major tags |

Overall the stack is **adequate and maintainable**. No urgent major upgrades are required; the main hygiene items are aligning Docusaurus package versions and optionally taking patch bumps for Docusaurus/Redoc.
