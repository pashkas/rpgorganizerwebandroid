# CLAUDE.md — «РПГ Органайзер»

## База знаний `docs/UserTasks/`

В проекте есть база знаний в `docs/UserTasks/` — папки `tasks/` (решённые задачи) и `observations/` (факты об устройстве проекта). Поиск и запись идут через MCP-сервер `user-tasks` (семантический + SQLite).

### Триггер на ЧТЕНИЕ — перед ЛЮБЫМ вопросом по проекту

Перед **любым** вопросом или задачей по проекту — включая справочные («как сделано X», «как отключить Y», «почему так»), баги, фичи, рефакторинг, анализ — **обязательно и первым делом** вызови скилл **`user-tasks-read`**, только потом лезь в код через Grep/Read. Не делить вопросы на «справочные» и «задачные» — любой начинается с `user-tasks-read`. Скилл сначала показывает релевантные наблюдения (контекст), затем похожие задачи (прецеденты — если нашёл, **жди ответа**). Если пусто — «В UserTasks похожего не нашёл».

### Триггер на ЗАПИСЬ — при закрытии задачи

Когда пользователь закрывает задачу короткой реакцией — **«+», «готово», «ок», «отлично», «сделано», «=»** — сразу вызови скилл **`user-tasks-write`**. Кратко отчитайся: «Записал задачу NNNN, наблюдения: M1, M2» / «Дополнил задачу NNNN секцией Обновление» / «без наблюдений».

Не спрашивай разрешения — скилл правит только `docs/UserTasks/`, это внутренняя база знаний, а не код. Автопроверка актуальности (бамп `verified_at`, переезд путей через `append_*`, удаление протухших записей) тоже идёт молча.

---

## Цель

Геймифицированный таск-менеджер (аналог Habitica). RPG-персонаж с характеристиками/навыками/квестами, за выполнение задач растёт опыт и уровень. ToDo-лист в RPG-обёртке.

## Стек

- **Frontend:** Angular 9.1.13, TypeScript 3.8.3, RxJS 6.5
- **UI:** Angular Material 8, Bootstrap 4, Flex-Layout, ngx-masonry
- **BaaS:** Firebase (Firestore + Auth). Своего бэкенда нет, вся логика на клиенте.
- **Mobile:** Capacitor 5 (Android), PWA

## Команды

```bash
npm install
ng serve             # dev http://localhost:4200
ng build --prod      # прод-сборка
ng test              # Karma + Jasmine
firebase deploy

# Сборка под Android (Capacitor 5):
ng build --prod; npx cap sync; npx cap open android
```

**Компиляцию проверяет пользователь.** Не запускай `ng build`/`ng serve`/`ng test` для проверки — он сам прогонит.

**Когда пользователь просит «собери» / «собери под андроид» / «собери проект» — запускай команду сборки Capacitor:** `ng build --prod; npx cap sync; npx cap open android`.

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
