# Архитектура и правила проекта «РПГ Органайзер»

## Источник

Правила проекта основаны на `CLAUDE.md` — едином источнике истины.

## База знаний `docs/UserTasks/`

- Проект использует базу знаний в `docs/UserTasks/` (папки `tasks/` и `observations/`).
- Поиск и запись осуществляются через MCP-сервер `user-tasks` (семантический поиск + SQLite).

### Триггеры

- **Чтение**: Перед любым вопросом или задачей по проекту **обязательно** вызывай скилл `user-tasks-read`, прежде чем анализировать код.
- **Запись**: При закрытии задачи (реакции: «+», «готово», «ок», «отлично», «сделано», «=») немедленно вызывай скилл `user-tasks-write`.
- Автопроверка актуальности (обновление `verified_at`, отслеживание переездов, удаление устаревших записей) выполняется автоматически.

## Цель проекта

Геймифицированный таск-менеджер (аналог Habitica), где пользователь — RPG-персонаж, растущий в уровнях и опыте за выполнение реальных задач.

## Технологический стек

- **Frontend**: Angular 9.1.13, TypeScript 3.8.3, RxJS 6.5
- **UI**: Angular Material 8, Bootstrap 4, Flex-Layout, ngx-masonry
- **BaaS**: Firebase (Firestore + Auth), бэкенда нет
- **Mobile**: Capacitor 5 (Android), PWA

## Команды

```bash
npm install
ng serve                   # разработка, http://localhost:4200
ng build --prod            # продакшн-сборка
ng test                    # тесты (Karma + Jasmine)
firebase deploy

# Сборка под Android (Capacitor 5)
ng build --prod; npx cap sync; npx cap open android
```

- Компиляцию проверяет пользователь — не запускай `ng build`/`ng serve`/`ng test`.
- По запросу «собери проект» или «под андроид» выполняй: `ng build --prod; npx cap sync; npx cap open android`.

## Архитектура

### Модули

- `AppModule` (eager)
  - `SharedModule` — общие компоненты и реэкспорт Material
  - `PersModule` (lazy, `/pers`) — основной функционал (~30 компонентов)
  - `MindMapModule` (lazy, `/mind-map`)
  - `SyncModuleModule` (lazy, `/sync`) — импортирует Material напрямую, не через SharedModule
- Новые Material-модули добавляй в `SharedModule` (imports + exports).
- Используются `entryComponents` (Angular 9).

### Состояние

- Нет NgRx. Состояние управляется через `PersService` и `BehaviorSubject`:
  - `pers$`, `currentTask$`, `currentView$`, `skillsGlobal$`, `qwestsGlobal$`
- Подписки: `.asObservable()` + `takeUntil(unsubscribe$)`.

### Доменная модель (`src/Models/`)

- `Pers` → `Characteristic` → `Ability` → `Task`
- `Qwest` — группа задач с наградами
- `Reward` — награда/артефакт
- `GameSettings` — абстрактный, реализации через DI (`EraSettings`, `EraSettings5Lvl`)
- ID генерируются через `uuid()`

### Ключевые сервисы

`PersService` (RPG-логика), `PerschangesService` (попапы изменений), `AuthService`, `UserService`, `StatesService`, `RevardService`, `EnamiesService`.

### Компоненты

- `ChangeDetectionStrategy.OnPush` где возможно
- Модальные окна через `MatDialog`
- **Иконки**: используются PNG из `assets/icons/`, `<mat-icon>` не применяется

## Стиль кода

- **Язык**: русский (комментарии, логи, сообщения)
- Краткие JSDoc по сути метода, без описания параметров
- Простой, понятный код в стиле проекта
- Перед `return` — пустая строка
- Стримы и лямбды: `q => q.getValue()`
- `camelCase` для переменных/методов, `PascalCase` для классов/интерфейсов

## Legacy — НЕ ТРОГАТЬ

- Опечатки в именах: `reqvirements`, `requrense`, `enamies`, `revard` — сохранять
- Устаревшие импорты: `angularfire2` вместо `@angular/fire` — оставлять
- Русские строки в моделях (ранги, подбадривания)
- Микс стилей в полях моделей
