| Описание | Теги | Связанные | Файл |
|----------|------|-----------|------|
| Перки качаются только если нет доступных обычных навыков; исключение — начатый сложн-перк (value>0) | перк, isPerk, perkHardnes, mayUp, recountAbilMayUp, pers.service, ограничение, isHardOpened | 0015, 0019, 0016 | 0022.md |
| Квест с непрокачанным навыком (value=0) помечается isNoActive, прозрачность 0.75 и в конец списка | квесты, isNoActive, abilitiId, Ability.value, pers.service, main-window, checkTask | 0002, 0019 | 0021.md |
| Уплотнение грида навыков в main-window до 4 колонок при >15 навыках на маленьких экранах | masonry, masonry-grid, dense, main-window, CSS Grid, media query, навыки | 0008, 0006, 0011, 0002 | 0020.md |
| Изменение формулы ограничения прокачки навыка по уровню персонажа: начальный потолок 2, +2 за каждые 10 уровней | mayUp, recountAbilMayUp, pers.service, уровень, прокачка, навык | 0016, 0022 | 0019.md |
| Замена формулы коэффициента e на сигмоиду: рост 1→5, основной рост 10–20, округление вниз до десятых, комментарии | e, сигмоид, getPersExpAndLevel, EraSettings, Math.exp, округление, комментарии | 0017, 0016 | 0018.md |
| Замена линейной кривой опыта на S-кривую (сигмоид) — энтузиазм до 10, фундамент 10–30, плато к 5 | e, сигмоид, S-кривая, getPersExpAndLevel, EraSettings, опыт, уровень, кривая, выгорание | 0016, 0018 | 0017.md |
| Макс. уровень персонажа снижен до 50, пороги монстров пересчитаны каждые 10 уровней | maxPersLevel, getMonsterLevel, GameSettings, уровень, монстры | 0003, 0017, 0022 | 0016.md |
| Настраиваемая сложность перков (норм/сложн): UI MatButtonToggle, формулы abCost/abTotalCost/abChangeExp с множителем perkHardnes, сообщения «перк активирован/прокачан», `*` в AbHardnessPipe | перк, isPerk, perkHardnes, MatButtonToggle, EraSettings, abCost, abTotalCost, abChangeExp, checkPerkTskValue, upAbility, perschanges, AbHardnessPipe, task-detail | 0004, 0022 | 0015.md |
| Simplify-ревью: OnPush+Set баг в loadedSkillImgs, мёртвый код (time, тернарник), форматирование | simplify, OnPush, Set, ChangeDetectorRef, markForCheck, loadedSkillImgs, мёртвый код, main-window, task-detail, customSwipe | 0013, 0010, 0006, 0007, 0012 | 0014.md |
| Simplify-ревью: imgLoaded баг (Set вместо динамического свойства), пропущенный сброс чеклиста, чистка импортов | simplify, imgLoaded, failCounter, Set, onTskDateChange, checklistItems, CdkDragDrop, guard | 0010, 0006, 0007, 0012, 0004, 0014 | 0013.md |
| Simplify-ревью: moveItemInArray вместо swap, ChecklistItem вместо литерала, удалены unused поля, Date вынесен из цикла | simplify, add-item-dialog, customSwipe, pers.service, task-detail, ChecklistItem, moveItemInArray | 0001, 0004, 0005, 0013 | 0012.md |
| Унификация картинок в карточках masonry-grid: pers-list приведён к стилю main-window (masonry-img) | masonry, masonry-img, img-fluid, pers-list, квесты, инвентарь, достижения, лавка | 0008, 0020 | 0011.md |
| Красная рамка появляется только после загрузки картинки (load event) | masonry, failCounter, img, load, main-window, ngStyle | 0006, 0007, 0013 | 0010.md |
| Выравнивание padding контейнера masonry с gap между элементами грида | masonry, CSS Grid, styles.css, masonry-container, padding | 0008 | 0009.md |
| Замена masonry (ngx-masonry + column-count) на CSS Grid — порядок по строкам, единый класс | masonry, CSS Grid, main-window, pers-list, add-item-dialog, styles.css, SharedModule | 0006, 0007, 0002, 0009, 0011, 0020 | 0008.md |
| Доработка красной рамки: перенос на img, убрано закругление, толщина 3px | masonry, failCounter, main-window, ngStyle, img, border | 0006, 0008, 0010 | 0007.md |
| Красная рамка для пропущенных задач (failCounter > 0) в masonry навыков | masonry, failCounter, GlobalItem, main-window, pers.service, ngStyle | 0002, 0007, 0008, 0010, 0020 | 0006.md |
| Улучшение директивы свайпов — настраиваемые пороги, блокировка скролла, рефакторинг | customSwipe, swipe, touchmove, main-window, @Input | 0012 | 0005.md |
| Белый экран на телефоне из-за новой фичи дней недели в подзадачах — дефенсивные гварды + нормализация полей taskState | белый экран, tskWeekDays, taskState, нормализация, getWeekKoef, CheckSetTaskDate, пн, фэншуй, requrence.pipe | 0001, 0012 | 0004.md |
| Выравнивание чеклистов на один уровень с подзадачами в task-detail | task-detail, чеклист, верстка, ml-4 | 0004, 0012 | 0001.md |
| Показ неактивных квестов (привязанных к навыку) с прозрачностью 75% и сортировкой в конец | квесты, main-window, masonry, isNoActive, GlobalItem, opacity, generateQwestsGlobal | 0006, 0008, 0020, 0021 | 0002.md |
| Убрать вероятностное повышение уровня монстра — картинка строго по рангу персонажа | GetRndEnamy, EnamyImage, монстры, pers.service, getMonsterLevel | 0016 | 0003.md |
