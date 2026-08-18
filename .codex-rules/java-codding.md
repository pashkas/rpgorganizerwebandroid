# Java Coding

Применяй при изменении Java-кода. Перед правкой прочитай `.codex-rules/coding.md`; для backend-проекта, где разрешён IDEA MCP, также прочитай `.codex-rules/mcp-idea.md`.

## Style

- Используй Lombok там, где он уже принят.
- Локальный `var` используй в принятом проектом варианте, только если тип очевиден из правой части.
- Для новых и изменённых методов и классов добавляй короткий Javadoc на русском, если проект не задаёт другой стандарт. Не описывай очевидные параметры и return.
- Публичные contracts, DTO, exception classes и services держи в отдельных файлах, если тип используется самостоятельно.

## Optional And Streams

- Для nullable chain используй `Optional.ofNullable(...)`, `map` и `flatMap`, когда это понятнее обычной проверки; при принятом стиле используй static import `ofNullable`.
- Для короткой lambda предпочитай `q -> q.getValue()` вместо method reference, если так читается проще. В более глубоком сценарии называй параметр по домену: `doc`, `item`, `row`.
- Используй Stream API, пока он не скрывает доменный сценарий; иначе пиши обычный цикл.

## Checks

- Строки: `StringUtils.isEmpty()` / `StringUtils.isNotEmpty()` из `org.apache.commons.lang3`.
- Коллекции: `CollectionUtils.isEmpty(collection)` из `org.springframework.util`; непустоту проверяй через `!CollectionUtils.isEmpty(collection)`.
- Nullable list в read-only flow: `ListUtils.emptyIfNull(list)` из `org.apache.commons.collections4`. Возвращённый для `null` пустой list не изменяй.

## Exceptions And Models

- Используй `@SneakyThrows` для checked exception только при принятом Lombok-стиле и когда `catch` не добавит восстановления или доменного смысла.
- Не заворачивай исключение в `RuntimeException` без нового смысла.
- Getter для `List` в доменной модели не должен возвращать `null`, если контракт модели допускает lazy-init через `new ArrayList<>()`.

## Completion

- Проверь импорты utility methods, сохранность exception/public contracts и соответствие изменённых файлов проектному стилю; IDEA inspections выполняй только по правилам `mcp-idea.md`.

## Паттерны инспекций

Если по результатам IDEA inspections ты понимаешь что есть паттерн, который может помочь избежать ошибок в будущем - запиши его сюда. В будущем руководствуйся ими.

Обнаруженные паттерны, которых можно избегать:

- В этом списке должны быть паттерны

Если тебе попадаются инспекции, которые мы приняли решение игнорировать. Запиши их сюда и в будущем игнорируй.

Список инспекций для игнора:

- В этом списке - паттерны игнорируемых инспекций.
