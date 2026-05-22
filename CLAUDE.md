# CLAUDE.md — «РПГ Органайзер»

## База знаний (taskdb)

Проект: `rpgorganizer`

Git: `yes`

При чтении и записи через `user-tasks-qdrant-read` / `user-tasks-qdrant-write` название проекта уже известно из этой главной конфигурации агента: `rpgorganizer`. Не перечитывай для этого `CLAUDE.md`/`AGENTS.md`; сразу передавай готовое имя проекта в shared taskdb/qdrant.

В начале рабочей сессии или новой самостоятельной задачи по проекту сначала taskdb, потом код: скилл `user-tasks-qdrant-read` запускай **до** анализа, чтения кода, планирования и действий по задаче.
Внутри уже начатого обсуждения не повторяй поиск taskdb/qdrant на каждый уточняющий вопрос, короткую правку или продолжение той же темы; используй уже полученный контекст. Новый поиск делай только при смене задачи, явной просьбе пользователя или если прежний контекст явно устарел/не подходит.
Правила чтения, поиска и отбора записей taskdb/qdrant определены в скилле `user-tasks-qdrant-read`.
По закрытию задачи («+», «готово», «ок», «отлично», «сделано», «=», «закрывай», «задача завершена») — сначала скилл `user-tasks-qdrant-write`, затем локальный коммит с кратким сообщением по сути изменений. `git push` не делать, если пользователь не попросил явно.

Пользователь заранее разрешает штатные обращения к MCP `user-tasks-qdrant` для taskdb-операций. Если нативные MCP tools доступны в Codex, вызывай их напрямую и не запрашивай дополнительное подтверждение на `search_*`, `get_*`, `add_*`, `update_*`, `delete_*`, `list_*`, `create_project` и `migrate_from_user_tasks`.

---

## Субагенты

Codex имеет явное разрешение запускать субагентов: для параллельного анализа кода, проверки гипотез и других самостоятельных подзадач. Делегируй им ограниченные задачи с понятным ожидаемым результатом и учитывай их вывод в основной работе.

## Файлы инструкций

`CLAUDE.md` и `AGENTS.md` связаны hardlink и должны оставаться одним и тем же файлом. Правки инструкций вноси так, чтобы оба имени указывали на актуальное содержимое.

## Инструменты

В этом проекте не используй MCP IDEA. Для навигации и чтения кода используй `rg`/PowerShell, для правок — `apply_patch`.

---

## Цель

Геймифицированный таск-менеджер (аналог Habitica). RPG-персонаж с характеристиками/навыками/квестами, за выполнение задач растёт опыт и уровень. ToDo-лист в RPG-обёртке.

## Стек

- **Frontend:** Angular 9.1.13, TypeScript 3.8.3, RxJS 6.5
- **UI:** Angular Material 8, Bootstrap 4, Flex-Layout, ngx-masonry
- **BaaS:** Firebase (Firestore + Auth). Своего бэкенда нет, вся логика на клиенте.
- **Mobile:** Capacitor 5 (Android), PWA

## Архитектура

### Модули

```
AppModule (eager)
├── SharedModule           — общие компоненты + реэкспорт Material
├── PersModule     (lazy /pers)     — основной функционал (~30 компонентов)
├── MindMapModule  (lazy /mind-map)
└── SyncModuleModule (lazy /sync)
```

- **SharedModule** — центральный. Новые Material-модули добавляй сюда (imports + exports), чтобы были доступны в Pers и MindMap.
- **SyncModuleModule** — SharedModule НЕ импортирует, тащит Material-модули напрямую.
- `entryComponents` нужны (Angular 9).

### Состояние
Никакого NgRx. Всё через `PersService` и `BehaviorSubject`:
- `pers$`, `currentTask$`, `currentView$`, `skillsGlobal$`, `qwestsGlobal$`
- Компоненты подписываются через `.asObservable()` + `takeUntil(unsubscribe$)`.

### Доменная модель (`src/Models/`)
- `Pers` (персонаж) → `Characteristic` → `Ability` → `Task`
- `Qwest` — группа задач с наградами
- `Reward` — награда/артефакт
- `GameSettings` — абстрактный, реализации через DI (`EraSettings`, `EraSettings5Lvl`)
- ID через `uuid()`

### Ключевые сервисы
`PersService` (RPG-логика), `PerschangesService` (попапы изменений), `AuthService`, `UserService`, `StatesService`, `RevardService`, `EnamiesService`.

### Компоненты
- `ChangeDetectionStrategy.OnPush` где возможно
- `MatDialog` для модалок
- **Иконки — PNG из `assets/icons/`**, `<mat-icon>` НЕ используем

## Стиль кода

- **Язык — русский.** Комментарии, логи, сообщения пользователю. Краткие JSDoc по сути метода (без описания параметров).
- Писать просто, в стиле существующего кода.
- Перед `return` — пустая строка.
- Стримы и лямбды с короткими именами: `q => q.getValue()`. Method references не используем.
- camelCase для переменных/методов, PascalCase для классов/интерфейсов.

## Legacy — НЕ ТРОГАТЬ

- Опечатки в именах: `reqvirements`, `requrense`, `enamies`, `revard` — оставляем как есть.
- `angularfire2` вместо `@angular/fire` в части импортов.
- Русские строки прямо в моделях (ранги, подбадривания).
- Микс стилей в полях моделей.
