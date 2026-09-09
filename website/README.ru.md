# Портал документации Clear Junction API

Статический портал документации на [Docusaurus](https://docusaurus.io/).

English version: [README.md](./README.md)

## Что входит

- **Docs** (Markdown/MDX) + автосайдбар
- **`/reference`** — OpenAPI reference через [Redoc](https://github.com/Redocly/redoc)
- **`static/openapi/*`** — публикуемый `openapi.yaml` + схемы
- **`static/postman/*`** — публикуемая Postman-коллекция
- **Integration guides/scenarios** — синхронизация из integration-репозитория

Перед `start` / `build` автоматически выполняется `npm run sync`, который копирует контент из соседних исходников в `docs/` и `static/`.

## Требования

- Node.js **20+** (в CI используется **Node 24**)
- npm 10+

## Установка

```bash
npm i
```

## Локальная разработка

```bash
npm run start
```

Команда поднимает локальный dev-сервер и открывает браузер. Большинство изменений подхватываются без перезапуска.

## Сборка

```bash
npm run build
```

Генерирует статику в `build/`. Можно раздавать любым static-хостингом или локально через `npm run serve`.

## Sync источников (переопределение через env)

По умолчанию `sync` ищет локальные соседние пути относительно `SOURCES_ROOT` (по умолчанию: `/Users/yarosi/Documents/Python`). Любой путь можно переопределить env-переменными:

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

Синхронизируемые артефакты (`static/openapi/`, `static/postman/`, `docs/integration/` и т.д.) в git не коммитятся — они пересобираются на каждом build.

## GitHub Pages

Workflow: [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)

Автоматически выставляет:

- `DOCS_URL` — например `https://<owner>.github.io`
- `DOCS_BASE_URL` — например `/<repo>/`

В CI дополнительно делается checkout исходников (нужен secret `DOCS_SOURCES_TOKEN`):

| Источник | Репозиторий | Путь checkout | Для чего |
| --- | --- | --- | --- |
| Contract | `yarosiCJ/CJ_API_Refact` | `sources/contract` | `web/openapi.bundled.yaml`, схемы, диаграммы, COP |
| Collection | `yarosiCJ/CJ_API_Sandbox` | `sources/collection` | Postman JSON |
| Integration | `yarosiCJ/CJ_API_Integration_Scenarios` | `sources/integration` | `docs/` + `scenarios/` |

Триггеры деплоя:

- push в `main`
- ручной `workflow_dispatch` в GitHub Actions

Сайт: https://yarosicj.github.io/CJ-docs-portal/

## Стек (текущее состояние)

| Компонент | В проекте | Комментарий |
| --- | --- | --- |
| Docusaurus | `^3.10.1` (lock ≈ 3.10.1) | Актуальный stable — **3.10.2**, можно безопасно поднять патч |
| `@docusaurus/*` helpers | `3.10.0` | Лучше выровнять все `@docusaurus/*` на одну версию |
| React | `^19` | Актуально |
| Redoc | `^2.5.2` (lock 2.5.2) | Latest **2.5.3** — безопасный патч |
| TypeScript | `~6.0.2` | Latest major — **7.x**; на 6 оставаться нормально |
| Node (CI) | 24 | Соответствует текущему направлению GitHub Actions |
| Actions | `checkout@v4`, `setup-node@v4`, Pages v3/v4 | Адекватно; позже можно обновить major-теги |

В целом стек **адекватный и рабочий**. Срочных major-апгрейдов нет; основная гигиена — выровнять версии `@docusaurus/*` и при желании взять патчи Docusaurus/Redoc.
