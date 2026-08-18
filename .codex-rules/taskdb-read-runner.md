# Taskdb Read

## Когда запускать

- Запускай один раз в начале новой нетривиальной рабочей задачи.
- Запускай по явной просьбе пользователя поискать в taskdb.
- Не запускай для простых вопросов по уже открытому контексту, статуса текущей работы или просьбы пояснить уже найденный фрагмент.
- Уточнения и правки в рамках той же задачи повторного lookup не требуют.

## Порядок

- Сначала taskdb lookup.
- Потом чтение кода, поиск файлов, план и правки.
- Не читай код параллельно с lookup.

## Как вызывать

- Используй локальный runner:
  `.codex-rules\run_taskdb_read.bat`
- Вызов всегда через stdin JSON с `project` и `query`.
- `project` задавай сам из текущего проектного контекста. Runner не читает `AGENTS.md` и не угадывает проект.
- Если проекта нет в контексте или есть конфликт имён, не запускай runner: скажи `taskdb не инициализирован или имя проекта неясно`.
- `query` делай коротким: задача, домен, классы, файлы, endpoint, ошибки, важные термины.
- Имена классов, файлов, endpoint и тексты ошибок сохраняй точно.
- Не добавляй в query длинный план, рассуждения агента и полный пользовательский текст, если там много шума.

PowerShell:

```powershell
$env:PYTHONIOENCODING = 'utf-8'
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$inputJson = @{
  project = '<project>'
  query = '<короткое описание задачи, домена, классов, файлов, ошибок>'
} | ConvertTo-Json -Compress
$inputJson | D:\MYPROJ\codex\.codex-rules\run_taskdb_read.bat
```

Optional fields in stdin JSON:

- `qdrant_url`: override Qdrant REST URL.
- `codex_model`: override model for external `codex exec`.
- `codex_timeout_seconds`: timeout for external `codex exec`.
- `no_codex: true`: smoke/debug only, returns deterministic top records without LLM compression.

## Контракт runner

- Runner ходит в Qdrant напрямую по REST, без MCP.
- Кандидатов сжимает внешний `codex exec`, чтобы не забивать контекст главного агента.
- `codex exec` запускается из временной пустой папки с `--ephemeral`, `--ignore-rules`, `--skip-git-repo-check`; stdout/stderr подавлены.
- Постоянные prompt/output/raw-log файлы не создаются.
- Qdrant URL: сначала `USER_TASKS_QDRANT_URL` или `qdrant_url` из stdin, потом автоfallback `http://127.0.0.1:7333`, `http://localhost:7333`, `http://127.0.0.1:6333`, `http://localhost:6333`.
- Если нужно выбрать модель для сжатия, задай `TASKDB_READ_CODEX_MODEL`; иначе используется default Codex.

## Результат

- Используй только `summary` и `places`.
- `summary`: факты, ограничения, риски, прежние решения.
- `places`: места, которые стоит читать после lookup.
- `used_records` держи внутренне для будущего taskdb-write.
- `warnings` учитывай как слабые места контекста, но не выводи как сырой JSON.
- Не показывай пользователю ids, scores, tags, сырой JSON и цитаты из body.
- Если `status=ok`, кратко скажи пользователю: `Нашёл похожее в taskdb.`
- Если `status=empty`, продолжай без taskdb-контекста.

## Статусы

- `ok`: применяй найденный контекст.
- `empty`: продолжай без taskdb-контекста.
- `unavailable`: скажи коротко, что Qdrant REST недоступен, и продолжай без taskdb-контекста.
- `error`: скажи коротко, что lookup сломался, и продолжай без него.

## Ограничения

- Только read-only.
- Не используй `add_*`, `update_*`, `delete_*`, `mark_*_used`, `migrate_*`.
- Не ходи напрямую в MCP, если runner работает.
- Не читай Qdrant/MCP выдачу вручную до runner.
- Не проверяй `affected` через `rg`, glob или чтение файлов до lookup.
- `stale:*` используй как слабый прецедент или игнорируй.
