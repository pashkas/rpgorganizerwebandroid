# Flutter Coding

Применяй при изменении Flutter/Dart widgets, state и UI. Перед правкой прочитай `.codex-rules/coding.md` и `.codex-rules/frontend-coding.md`; архитектура и state management проекта имеют приоритет.

## Dart

- Используй `=>` для коротких expression-bodied methods и builders, для длинной логики — block body.
- Callbacks и handlers пиши closures или arrow functions, когда так понятнее.
- Явно типизируй public API.
- Не оставляй `dynamic` после границы JSON/API; сразу преобразуй данные в модель.
- Разделяй DTO, model и view state, когда их формы различаются.

## Widgets

- Держи `build()` обзорным: layout сверху вниз, без тяжёлых вычислений.
- Выноси большой UI fragment в private widget, только если это улучшает чтение.
- Используй `const` для неизменяемых widgets.
- Не создавай controllers и focus nodes в `build()`. Создавай lifecycle-ресурсы в `initState` и освобождай в `dispose`.

## State

- Используй `StatefulWidget` для локального UI state, а app/domain state держи в принятом проектом state management.
- После `await` проверяй `mounted` перед `setState`; не обновляй state после `dispose`.

## Files

- Для большого экрана отделяй screen, локальные widgets, controller/state и models только по реальным границам ответственности.
- Не создавай папку или слой ради одного файла без самостоятельного смысла.

## Completion

- Проверь lifecycle каждого созданного ресурса, безопасность state update после `await` и UI-ветку по критериям `frontend-coding.md`.
