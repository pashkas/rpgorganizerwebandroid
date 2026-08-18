# React Coding

Применяй при изменении React-компонентов, hooks, state и JSX. Перед правкой прочитай `.codex-rules/coding.md` и `.codex-rules/frontend-coding.md`; локальные conventions проекта имеют приоритет.

## Components And TypeScript

- Компоненты пиши arrow functions, если проект не использует другой устойчивый стиль.
- Props типизируй явно через `type Props = { ... }` или принятый проектом эквивалент.
- Не используй `React.FC` без причины.
- Разделяй container и presentational component только когда это упрощает поток данных.

## Hooks

- Создавай custom hook для повторяемого stateful behavior или чтобы скрыть шумный integration-код, а не для одной строки state.
- Используй `useMemo` и `useCallback` для дорогого расчёта, стабильной ссылки или зависимости memoized children, а не механически.
- Effect должен синхронизировать React с внешней системой.
- Derived state вычисляй при render или через `useMemo`; не поддерживай его связкой `useEffect + setState`.

## JSX And State

- Держи JSX читаемым сверху вниз.
- Inline arrow handlers допустимы, пока нет измеренной performance-проблемы и код читается.
- Не дублируй server state в local state без причины.
- Для форм используй controlled inputs или принятую проектом form library.

## Completion

- Проверь, что effects обслуживают только внешнюю синхронизацию, derived state не дублируется, а UI-ветка завершена по критериям `frontend-coding.md`.
