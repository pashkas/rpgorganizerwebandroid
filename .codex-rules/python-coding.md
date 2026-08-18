# Python Coding

Применяй при создании или изменении Python-кода, CLI, pipelines, parsers и одноразовых scripts. Перед правкой прочитай `.codex-rules/coding.md`; версия и conventions проекта имеют приоритет.

## Runtime

- Используй Python 3.10+ только когда это совместимо с проектом.
- Запускай Python-команды через `python -X utf8`.
- Не передавай русские строковые литералы в inline Python через PowerShell.

## Structure And Types

- `main()` собирает зависимости, запускает сценарий и возвращает exit code.
- Используй class для состояния, стратегии, зависимости, нескольких реализаций или lifecycle; чистое преобразование оставляй function.
- Добавляй type hints для public functions, methods, dataclass models и нетривиального return.
- Используй `dataclass` для config, DTO, manifest records и небольших структур.
- `Protocol`, `TypedDict`, `Literal`, `Generic`, `TypeVar` и `Self` добавляй только когда контракт становится яснее.
- Допускай `Any` на границе внешней библиотеки или JSON и сразу сужай тип.
- Не используй mutable default arguments; для list/dict в dataclass применяй `field(default_factory=...)`.

## Files And CLI

- Для путей используй `pathlib.Path`, для текстовых файлов — `encoding="utf-8"`.
- Перед записью в новый каталог создавай его через `mkdir(parents=True, exist_ok=True)`.
- CLI строй через `argparse` или проектный механизм; давай аргументам понятные имена и пиши ошибки по-русски в русскоязычном проекте.
- Pipeline, который пишет artifacts, делай идемпотентным: повторный запуск не должен портить успешный результат.
- Текстовые внешние команды по умолчанию запускай через `subprocess.run([...], check=True, text=True, encoding="utf-8")`; не собирай shell command строкой без необходимости.
- Одноразовые Python scripts держи в указанной проектом temp-папке, а при её отсутствии — в `.python_tmp/`; после использования удаляй.

## Runtime Behavior

- Ресурсы открывай через context manager: `with Path.open(...)`, `with tempfile.TemporaryDirectory(...)`.
- Для project scripts используй `logging`; для коротких CLI messages допустим `print`.
- Добавляй короткий docstring о назначении функции или метода, если проект требует docstrings; не пересказывай код.

## Completion

- Проверь, что внешние данные типизированы после границы, ресурсы имеют lifecycle, output pipeline не портит готовые artifacts, а временные scripts удалены.
