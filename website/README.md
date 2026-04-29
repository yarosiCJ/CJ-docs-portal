# Clear Junction API docs portal

Статический портал документации на [Docusaurus](https://docusaurus.io/):

- `Docs` (Markdown) + автосайдбар
- `/reference` — OpenAPI reference (Redoc)
- `static/openapi/*` — публикуемый `openapi.yaml` + схемы
- `static/postman/*` — публикуемая Postman коллекция

Перед `start/build` автоматически выполняется `npm run sync`, который копирует контент из соседних директорий в `docs/` и `static/`.

## Installation

```bash
npm i
```

## Local Development

```bash
npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Sync sources (overrides)

По умолчанию `sync` ожидает ваши локальные пути (можно переопределить через env):

```bash
SOURCES_ROOT="/Users/yarosi/Documents/Python" \
OPENAPI_BUILT_DIR="/Users/yarosi/Documents/Python/ApiRefactoring/openapi-built" \
COP_MD="/Users/yarosi/Documents/Python/ApiRefactoring/docs/reference/cop.md" \
POSTMAN_COLLECTION="/Users/yarosi/Documents/Python/Postman_CJ_sand/Clear_Junction_API.postman_collection.json" \
INTEGRATION_DOCS_DIR="/path/to/Integration_scenarios/docs" \
npm run sync
```

## Pages configuration

Для публикации в GitHub/GitLab Pages обычно нужно выставить:

- `DOCS_URL` (например `https://<org>.github.io`)
- `DOCS_BASE_URL` (например `/<repo>/` для GitHub Pages проекта)

Для GitHub Pages workflow уже добавлен в `.github/workflows/pages.yml` и автоматически выставляет `DOCS_URL`/`DOCS_BASE_URL`.

В CI workflow дополнительно делает checkout источников:

- contract: `yarosiCJ/CJ_API_Refact` → `sources/contract` (используется `web/openapi.bundled.yaml`)
- collection: `yarosiCJ/CJ_API_Sandbox` → `sources/collection`
- integration: `yarosiCJ/CJ_API_Integration_Scenarios` → `sources/integration` (используется `docs/`)
