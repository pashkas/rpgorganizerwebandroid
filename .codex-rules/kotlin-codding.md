# Kotlin Coding

Применяй при изменении Kotlin-кода. Перед правкой прочитай `.codex-rules/coding.md`; для backend-проекта, где разрешён IDEA MCP, также прочитай `.codex-rules/mcp-idea.md`.

## Project

- Создавай новый backend-класс на Kotlin, только если текущий модуль уже компилирует Kotlin и это соответствует стилю проекта.
- Используй Kotlin idioms, а не Java-style code с другим синтаксисом.

## KDoc And Files

- Для новых и изменённых методов и классов добавляй короткий KDoc на русском, если проект не задаёт другой стандарт. Не описывай очевидные параметры и return.
- Внутри функции комментируй только доменный смысл или неочевидный риск.
- Публичные top-level contracts, DTO/result classes, exceptions и services держи в отдельных `.kt` files; рядом с service оставляй только локальную private-механику.

## Java Interop

- При Java → Kotlin сохраняй public contract.
- Для Java-вызовов статических методов используй `object` + `@JvmStatic` или другой совместимый project pattern.
- Если Kotlin не видит Lombok getter, setter или builder, сначала проверь порядок Lombok/Kotlin compilation. Конвертацию модели в Kotlin рассматривай только в границах задачи.
- Имена legacy classes вроде `FlcCommon_005` и `Validator_014_003` сохраняй; для них используй `@Suppress("ClassName")`.
- Для `UserCredentialsConnectionFactoryAdapter` оставляй Java setters: `setUsername`, `setPassword` и `setTargetConnectionFactory`.

## Spring

- Для Spring proxies используй `kotlin-spring` / `kotlin-maven-allopen`.
- При `Cannot subclass final class`, `Could not generate CGLIB subclass` или странном NPE в bean сначала проверь all-open; не добавляй `open` механически, если plugin настроен.
- Используй constructor injection. В изменяемом коде переводи `@Autowired lateinit var` только когда это локально безопасно; оставляй field injection для cycle, optional/lazy dependency или жёсткого legacy.

## Nullability And Collections

- Обрабатывай nullable через `?.`, `?:`, `let` и early return; не используй `Optional` в Kotlin-коде.
- Для строк используй `isNullOrEmpty()` / `isNullOrBlank()`.
- Для nullable list используй `orEmpty()` или `?: emptyList()`. Если JAXB getter гарантированно lazy-init и не возвращает `null`, не добавляй лишнюю защиту.
- Для пошагового сбора используй `buildList { ... }`; не склеивай много lists через `+`, если обычный сбор читается лучше.

## Idioms

- Используй property access вместо `getX()` / `setX(...)`, кроме явных interop exceptions.
- Не усложняй сценарий `Sequence`, `flatMap` или `mapNotNull`, если цикл или `buildList` понятнее.
- Используй `runCatching` для компактного контролируемого fallback, а не для сокрытия normal error flow.

## Completion

- Проверь сохранность Java interop, Spring proxy contract и nullability assumptions; IDEA inspections выполняй только по правилам `mcp-idea.md`.

## Паттерны инспекций

Если по результатам IDEA inspections ты понимаешь что есть паттерн, который может помочь избежать ошибок в будущем - запиши его сюда. В будущем руководствуйся ими.

Обнаруженные паттерны, которых можно избегать:

- В этом списке должны быть паттерны

Если тебе попадаются инспекции, которые мы приняли решение игнорировать. Запиши их сюда и в будущем игнорируй.

Список инспекций для игнора:

- В этом списке - паттерны игнорируемых инспекций.
