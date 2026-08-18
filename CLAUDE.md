# RPG Organizer

Геймифицированный таск-менеджер: RPG-персонаж развивается за выполнение задач. Один клиент обслуживает web, PWA и Android; отдельного backend нет, данные и авторизация работают через Firebase.

Стек: Angular 9.1.13, TypeScript 3.8.3, RxJS 6.5, Angular Material 8, Bootstrap 4, Flex Layout, Firebase 7 и Capacitor 5.

## Правила работы

1. Всегда применяй `.codex-rules/common-rules.md` и `.codex-rules/caveman.md`.
2. Перед изменением или ревью Angular-кода, компонентов, сервисов, форм, RxJS и Angular API clients применяй `.codex-rules/angular-codding.md`.
3. Перед изменением Python-кода, CLI, pipeline, парсеров и файловой обработки применяй `.codex-rules/python-coding.md`.
4. Для новой нетривиальной задачи выполни один lookup taskdb по `.codex-rules/taskdb-read.md` до чтения кода. Проект: `rpgorganizer`.
   - Пропусти lookup для простого вопроса, статуса, уточнения и объяснения уже найденного кода.
   - Повтори lookup в текущей задаче только по просьбе `поищи в taskdb`.
5. Записывай taskdb по `.codex-rules/taskdb-write.md` только по точной команде `+` или `=`.
6. Навигацию, поиск и чтение выполняй через `rg` и PowerShell. `.codex-rules/mcp-idea.md` в этом проекте не применяй.

Если MCP `user-tasks-qdrant` недоступен, сообщи об этом и продолжай без taskdb. REST, shell и HTTP fallback не используй.

## Границы проекта

- `AGENTS.md` и `CLAUDE.md` — hardlink одного файла. После изменения связь должна сохраниться.
- `.codex-rules` — junction на `D:\MYPROJ\codex\.codex-rules`; rules в проект не копируй.
- npm-пакеты устанавливай через `npm install ... --legacy-peer-deps`: в проекте есть peer-конфликт Angular CDK/Flex Layout.
- Android Gradle запускай с JDK 17 из `C:\Users\tretyakovpk\.jdks\openjdk-17.0.1`.
- Одноразовые скрипты размещай в `docs/scripts/`, исследования — в `docs/research/`; после использования удаляй.
- Для ограниченных самостоятельных подзадач можно запускать субагентов; их вывод проверяй и учитывай в основной работе.

## Архитектура

### Модули

```text
AppModule (eager)
├── SharedModule                 общие компоненты и Material
├── PersModule (lazy /pers)      основной функционал
├── MindMapModule (lazy /mind-map)
└── SyncModuleModule (lazy /sync)
```

- Material-модули для `PersModule` и `MindMapModule` добавляй в imports и exports `SharedModule`.
- `SyncModuleModule` не импортирует `SharedModule`; нужные Material-модули подключает напрямую.
- Для динамических компонентов сохраняй `entryComponents`: проект использует Angular 9.

### Состояние и модель

- NgRx нет. Состояние хранит `PersService` через `BehaviorSubject`: `pers$`, `currentTask$`, `currentView$`, `skillsGlobal$`, `qwestsGlobal$`.
- Компоненты подписываются через `.asObservable()` и завершают подписки через `takeUntil(unsubscribe$)`.
- Основная модель в `src/Models/`: `Pers` → `Characteristic` → `Ability` → `Task`; отдельно `Qwest` и `Reward`.
- `GameSettings` — абстракция с DI-реализациями `EraSettings` и `EraSettings5Lvl`. ID создаются через `uuid()`.
- RPG-логика находится в `PersService`, попапы изменений — в `PerschangesService`.

### UI

- Используй `ChangeDetectionStrategy.OnPush`, когда компонент совместим с ним.
- Модальные окна открывай через `MatDialog`.
- Иконки бери как PNG из `assets/icons/`; `<mat-icon>` не используй.

## Стиль кода

- Комментарии, логи и сообщения пользователю пиши по-русски. Для методов оставляй короткий JSDoc по сути без очевидных параметров и return.
- Перед `return` оставляй пустую строку.
- В стримах и лямбдах используй короткие имена: `q => q.getValue()`. Method references не используй.
- Переменные и методы — camelCase, классы и интерфейсы — PascalCase.

## Legacy

Сохраняй без модернизации:

- имена `reqvirements`, `requrense`, `enamies`, `revard`;
- существующие импорты из `angularfire2`;
- русские строки и смешанный стиль полей в моделях.
