# MCP IDEA

Используй IDEA MCP для backend-навигации, точечных правок, refactoring и inspections в проекте с доступным индексом IntelliJ, если project router не запрещает этот инструмент.

## Connection And Project Routing

- Для глобального подключения Codex используй встроенный stdio launcher: `"C:\Program Files\JetBrains\IntelliJ IDEA Community Edition 2021.3.1\bin\idea64.exe" stdioMcpServer`. Название каталога осталось старым, но внутри установлена IDEA 2026.2.
- Не запускай MCP через вручную собранный classpath и `mcpserver-frontend.jar`: состав JAR меняется при обновлении IDEA, а в IDEA 2026.2 этот файл удалён.
- В глобальном `%USERPROFILE%\.codex\config.toml` не задавай `IJ_MCP_SERVER_PROJECT_PATH`: он закрепляет все Codex-сессии за одним проектом.
- `IJ_MCP_SERVER_PORT` оставляй равным порту включённого MCP Server из `Settings | Tools | MCP Server`; для текущей IDEA это `64342`. При нескольких экземплярах IDEA порт выбирает конкретный экземпляр.
- В каждый вызов `mcp__idea__*` передавай точный абсолютный `projectPath`, если корень проекта известен. Для этого проекта используй `D:\1EAES\op26Root\op26Old`.
- После изменения MCP-конфигурации полностью перезапусти Codex при открытой IDEA. Доступность подтверждай наличием `mcp__idea__*` и коротким read-only вызовом с `projectPath`, а не только ответом HTTP endpoint.

## Tool Choice

- Используй только namespace `mcp__idea__*`; старый JetBrains namespace не применяй.
- Предпочитай IDEA для symbols, references, safe rename, inspections и точного чтения project files.
- Используй `rg` для простого широкого текстового поиска с ограничением по директории и mask.
- Перед широким поиском сузь модуль, package, class или file mask. Не сканируй frontend в backend-задаче без относящейся к нему причины.

## Navigation

- Symbols: `mcp__idea__search_symbol`; для документации и точной сигнатуры по найденной позиции — `mcp__idea__get_symbol_info`.
- Calls: `mcp__idea__analyze_calls` для IDE Call Hierarchy по точному FQN. Предпочитай его текстовому поиску, когда нужны реальные входящие или исходящие вызовы; если FQN неизвестен, сначала используй `search_symbol`.
- Files: `mcp__idea__search_file` с project-relative glob.
- Text: `mcp__idea__search_text`; `mcp__idea__search_regex` только когда substring-поиска недостаточно.
- Structure: `mcp__idea__list_directory_tree`; `mcp__idea__get_project_modules` и `mcp__idea__get_project_dependencies` используй только когда задача требует понять границы модулей или зависимости.
- Reading: `mcp__idea__read_file`. Он также читает sources из project dependencies, JAR/JRT и декомпилирует `.class`; не распаковывай JAR вручную.
- Читай только нужный range большого файла.
- Перед переносом project pattern найди 1–2 ближайших аналога и возьми только относящуюся к задаче структуру.

## Editing

- Для ручной правки используй `apply_patch`; IDEA-side `mcp__idea__apply_patch` применяй только когда нужен project-aware MCP-вызов.
- Symbol rename выполняй только через `mcp__idea__rename_refactoring`.
- Не запускай `mcp__idea__reformat_file` автоматически: formatting разрешён только по прямой просьбе пользователя.

## Verification And Run

- После правки проверь каждый изменённый project file через `mcp__idea__get_file_problems`, если tool доступен.
- Если пользователь просит запустить приложение, сначала получи `mcp__idea__get_run_configurations` и используй подходящую `mcp__idea__execute_run_configuration`.
- `mcp__idea__build_project` запускай только по прямой просьбе.

## Runtime Debugging

- Для runtime-отладки используй skill `$ij-debugger` и инструменты `mcp__idea__xdebug_*`; подробный lifecycle breakpoint, session и cleanup не дублируй здесь.
- Старый сторонний debugger MCP не применяй.

## Completion

- Работа через IDEA завершена, когда область поиска была ограничена, изменения внесены подходящим инструментом, каждый изменённый файл проверен inspections либо явно указана недоступность проверки.
