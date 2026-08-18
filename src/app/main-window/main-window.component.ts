import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { PersService } from "../pers.service";
import { Task, taskState } from "src/Models/Task";
import { BehaviorSubject, Subject } from "rxjs";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Ability } from "src/Models/Ability";
import { MatDialog } from "@angular/material";
import { sortArr } from "src/Models/sortArr";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { QwickAddTaskDialogComponent } from "../qwick-add-task-dialog/qwick-add-task-dialog.component";
import { StatesService } from "../states.service";
import { curpersview } from "src/Models/curpersview";
import { Qwest } from "src/Models/Qwest";
import { TaskTimerComponentComponent } from "../task-timer-component/task-timer-component.component";
import { takeUntil } from "rxjs/operators";
import { GameSettings } from "../GameSettings";
import { VibroService } from "../vibro.service";
import { LocalImageService } from "../local-image.service";

@Component({
  selector: "app-main-window",
  templateUrl: "./main-window.component.html",
  styleUrls: ["./main-window.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent implements OnInit {
  private unsubscribe$ = new Subject();

  currentTask$ = this.srv.currentTask$.asObservable();
  currentView$ = this.srv.currentView$.asObservable();
  isFailShown$ = new BehaviorSubject<boolean>(false);
  isFailShownOv$ = new BehaviorSubject<boolean>(false);
  isSort: boolean = false;
  isSucessShown$ = new BehaviorSubject<boolean>(false);
  isSucessShownOv$ = new BehaviorSubject<boolean>(false);
  lastGlobalBeforeSort: boolean;
  pers$ = this.srv.pers$.asObservable();
  qwestsGlobal$ = this.srv.qwestsGlobal$;
  qwickSortVals: sortArr[] = [];
  qwestsGlobalReady = false;
  skillsGlobal$ = this.srv.skillsGlobal$;
  skillsGlobalReady = false;

  private readonly brokenImage = "assets/img/broken.jpg";
  private globalImageLoads = new Map<string, Promise<string>>();
  // Ссылки удерживают декодированные изображения в памяти до закрытия главного окна.
  private globalImages = new Map<string, HTMLImageElement>();
  private globalViewLoadIndexes = new Map<curpersview, number>();
  private preparedGlobalImageSources = new Map<string, string>();

  constructor(
    public srv: PersService,
    public dialog: MatDialog,
    private srvSt: StatesService,
    public gameSettings: GameSettings,
    private cdr: ChangeDetectorRef,
    private vibro: VibroService,
    private localImageSrv: LocalImageService,
  ) {}

  addToQwest() {
    let qwest = this.srv.allMap[this.srv.pers$.value.currentQwestId].item;

    this.addTaskToQwest(qwest);
  }

  addTaskToQwest(qwest: Qwest): boolean {
    return this.openAddTaskToQwestDialog(qwest ? qwest.id : null);
  }

  private openAddTaskToQwestDialog(qwestId: string, isMasonryAdd: boolean = false): boolean {
    if (!qwestId || this.srv.isDialogOpen) {
      return false;
    }

    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить миссию", text: "" },

      backdropClass: "backdrop",
      autoFocus: true,
      restoreFocus: false,
    });

    dialogRef.afterClosed().subscribe((name) => {
      try {
        if (name) {
          this.addTaskToQwestById(qwestId, name);
        }
      } finally {
        this.finishTaskToQwestAdd(isMasonryAdd);
      }
    });

    return true;
  }

  private addTaskToQwestById(qwestId, name) {
    try {
      let currentQwest = this.srv.pers$.value.qwests.find((q) => q.id == qwestId);
      if (!currentQwest) {
        return;
      }

      this.srv.addTskToQwest(currentQwest, name);
      this.srv.savePers(false);
    } catch (e) {
      console.error("Ошибка быстрого добавления задачи в квест", e);
    }
  }

  private finishTaskToQwestAdd(isMasonryAdd: boolean) {
    this.srv.isDialogOpen = false;
    this.cdr.markForCheck();
  }

  trackByGlobalItemId(index: number, item): string {

    return item ? item.id : index.toString();
  }

  /** Возвращает уже подготовленный источник картинки глобальной сетки. */
  getGlobalImageSrc(type: string, id: string, fallbackSrc: string): string {

    return this.preparedGlobalImageSources.get(type + ":" + id) || fallbackSrc;
  }

  /** Показывает глобальный вид только после подготовки всех его картинок. */
  private async openGlobalView(view: curpersview, previousView: curpersview): Promise<void> {
    let isPrepared = await this.prepareGlobalView(view);
    if (!isPrepared || this.srv.pers$.value.currentView != previousView) {
      return;
    }

    this.srv.pers$.value.currentView = view;
    this.srv.savePers(false);
  }

  /** Загружает и декодирует картинки выбранного глобального вида. */
  private async prepareGlobalView(view: curpersview): Promise<boolean> {
    let loadIndex = (this.globalViewLoadIndexes.get(view) || 0) + 1;
    this.globalViewLoadIndexes.set(view, loadIndex);

    let prs = this.srv.pers$.value;
    if (!prs) {
      return false;
    }

    let items: Array<{ type: string; id: string; src: string; isLocalImage: boolean }> = [];

    if (view == curpersview.SkillsGlobal) {
      for (const characteristic of prs.characteristics || []) {
        for (const ability of characteristic.abilities || []) {
          items.push({ type: "ability", id: ability.id, src: ability.image, isLocalImage: ability.isLocalImage });
        }
      }
    } else {
      for (const qwest of prs.qwests || []) {
        items.push({ type: "qwest", id: qwest.id, src: qwest.image, isLocalImage: qwest.isLocalImage });
      }
    }

    let preparedImages = await Promise.all(items.map(async item => {
      let src = item.src || this.brokenImage;
      if (item.isLocalImage) {
        src = await this.localImageSrv.read(item.type, item.id) || src;
      }

      return {
        key: item.type + ":" + item.id,
        src: await this.preloadImage(src),
      };
    }));

    if (this.globalViewLoadIndexes.get(view) != loadIndex) {
      return false;
    }

    for (const image of preparedImages) {
      this.preparedGlobalImageSources.set(image.key, image.src);
    }

    if (view == curpersview.SkillsGlobal) {
      this.skillsGlobalReady = true;
    } else {
      this.qwestsGlobalReady = true;
    }
    this.cdr.markForCheck();

    return true;
  }

  /** Загружает картинку и ждёт её декодирования браузером. */
  private preloadImage(src: string): Promise<string> {
    let cachedLoad = this.globalImageLoads.get(src);
    if (cachedLoad) {
      return cachedLoad;
    }

    let imageLoad = new Promise<string>((resolve) => {
      let image = new Image();
      let finishLoad = () => {
        this.globalImages.set(src, image);
        resolve(src);
      };
      image.onload = () => {
        if (!image.decode) {
          finishLoad();

          return;
        }

        image.decode().then(finishLoad, finishLoad);
      };
      image.onerror = () => {
        if (src == this.brokenImage) {
          return;
        }

        this.preloadImage(this.brokenImage).then(resolve);
      };
      image.src = src;
    });

    this.globalImageLoads.set(src, imageLoad);

    return imageLoad;
  }

  async animate(isDone: boolean) {
    if (isDone) {
      this.isSucessShownOv$.next(true);
      await this.delay(this.gameSettings.flashDelay);
      this.isSucessShownOv$.next(false);
      this.isSucessShown$.next(true);
      await this.delay(this.gameSettings.flashDelay2);
      this.isSucessShown$.next(false);
    } else {
      this.isFailShownOv$.next(true);
      await this.delay(this.gameSettings.flashDelay);
      this.isFailShownOv$.next(false);
      this.isFailShown$.next(true);
      await this.delay(this.gameSettings.flashDelay2);
      this.isFailShown$.next(false);
    }
  }

  changeEnamyImageForItem(id, tsk: Task) {
    let mainTask = this.getMainTask(tsk);
    if (mainTask != null && mainTask.requrense != "нет") {
      this.srv.GetRndEnamy(this.srv.allMap[id].item, this.srv.getAbMonsterLvl(mainTask), this.srv.pers$.value.maxPersLevel);
    } else {
      this.srv.GetRndEnamy(this.srv.allMap[id].item, this.srv.pers$.value.level, this.srv.pers$.value.maxPersLevel);
    }
  }

  checkDate(date: Date) {
    let dt = new Date(date).setHours(0, 0, 0, 0);
    let now = new Date().setHours(0, 0, 0, 0);

    if (dt.valueOf() < now.valueOf()) {
      return true;
    }

    return false;
  }

  /** Возвращает настройки цели активной подзадачи или самой задачи. */
  getAimTarget(cur: Task): Task | taskState {
    let state: taskState;
    if (cur.parrentTask) {
      state = this.srv.allMap[cur.id].item;
    } else if (cur.states && cur.states.length > 0) {
      state = cur.states[cur.curStateDescrInd];
    }

    if (state && state.isAim && state.aimTimer) {
      return state;
    }

    return cur;
  }

  hasTimerAim(cur: Task): boolean {
    const target = this.getAimTarget(cur);

    return !!target.aimTimer && !this.srv.isCounterAim(target);
  }

  isCounterEnabled(cur: Task): boolean {
    return this.getAimTarget(cur).isCounterEnable;
  }

  getCounterDone(cur: Task): number {
    return this.getAimTarget(cur).counterDone || 0;
  }

  async clickCounter(cur: Task) {
    this.vibro.counterClick();

    const target = this.getAimTarget(cur);
    target.counterDone = (target.counterDone || 0) + 1;
    this.srv.currentCounterDone$.next(target.counterDone);

    if (cur.parrentTask) {
      let st: taskState = this.srv.allMap[cur.id].item;

      st.counterDone = target.counterDone;
      cur.counterDone = target.counterDone;
    } else if (target === cur) {
      let tsk: Task = this.srv.allMap[cur.id].item;

      tsk.counterDone = target.counterDone;
    }

    this.srv.savePers(false);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async done(t: Task) {
    this.vibro.taskDone();
    await this.animate(true);

    this.changeEnamyImageForItem(t.id, t);

    this.srv.changesBefore();

    let tskName = "";

    const prs = this.srv.pers$.value;

    let tskIndex = prs.tasks.indexOf(t);

    let tsk = t;

    if (t.parrentTask) {
      // Логика для навыков
      if (t.requrense != "нет") {
        tskName = this.srv.allMap[t.id].item.name;
        tsk = this.srv.allMap[t.parrentTask].item;
        this.srv.subtaskDoneOrFail(t.parrentTask, t.id, true);
      }
      // Логика для подзадач
      else {
        const subTsk: taskState = this.srv.allMap[t.id].item;
        subTsk.lastNotDone = false;
        subTsk.isDone = true;
        subTsk.secondsDone = 0;
        subTsk.counterDone = 0;
      }
    } else {
      this.srv.taskPlus(t.id);
      tskName = t.tittle;
    }

    if (t.requrense == "нет") {
      this.srv.upQwest(t.id);
    }

    if (prs.currentView == curpersview.SkillTasks) {
      this.srv.setCurInd(0);
    }

    this.srv.savePers(true);

    if (this.gameSettings.isClassicaRPG) {
      tsk = null;
    }

    this.srv.changesAfter(true, this.getAbImg(t), tsk);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.srv.pers$.value.tasks, event.previousIndex, event.currentIndex);
  }

  editCansel() {
    this.setGlobalTaskView(true);
    this.firstOrGlobal();
  }

  async fail(t: Task) {
    this.vibro.taskFail();

    await this.animate(false);

    this.changeEnamyImageForItem(t.id, t);

    this.srv.changesBefore();

    let tskName = "";

    let prs = this.srv.pers$.value;

    let tskIndex = prs.tasks.indexOf(t);

    let tsk: Task = t;

    if (t.parrentTask) {
      // Логика для подзадач
      tsk = this.srv.allMap[t.parrentTask].item;
      for (const st of tsk.states) {
        st.secondsDone = 0;
        st.counterDone = 0;
      }
      tskName = this.srv.allMap[t.id].item.name;
      this.srv.subtaskDoneOrFail(t.parrentTask, t.id, false);
    } else {
      // Логика для задач
      tsk = t;
      tskName = t.tittle;
      this.srv.taskMinus(t.id);
    }

    if (tskName && !prs.isNoDiary) {
      prs.Diary[0].notDone += tskName + "; ";
    }

    if (prs.currentView == curpersview.SkillTasks) {
      this.srv.setCurInd(0);
    }

    this.srv.savePers(true);

    if (this.gameSettings.isClassicaRPG) {
      tsk = null;
    }

    this.srv.changesAfter(false, this.getAbImg(t), tsk);
  }

  clickPreventSingleClick = false;
  clickTimer: any;
  clickDelay: Number;
  masonryQwestClickBlockUntil = 0;

  masonrySingleClick(tskIdx: number) {
    if (Date.now() < this.masonryQwestClickBlockUntil) {
      return;
    }

    this.clickPreventSingleClick = false;
    const clickDelay = 200;
    this.clickTimer = setTimeout(() => {
      if (!this.clickPreventSingleClick) {
        this.tskClick(tskIdx);
      }
    }, clickDelay);
  }

  masonryDoubleClick() {
    this.clickPreventSingleClick = true;
    clearTimeout(this.clickTimer);
    this.firstOrGlobal();
  }

  async firstOrGlobal(isLast: boolean = false): Promise<void> {
    let currentView = this.srv.pers$.value.currentView;

    if (currentView == curpersview.SkillTasks) {
      await this.openGlobalView(curpersview.SkillsGlobal, currentView);

      return;
    } else if (currentView == curpersview.SkillsSort) {
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
    } else if (currentView == curpersview.SkillsGlobal) {
      if (!isLast) {
        this.srv.setCurInd(0);
      } else {
        this.srv.setCurInd(this.srv.pers$.value.tasks.length);
      }
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
    } else if (currentView == curpersview.QwestTasks) {
      await this.openGlobalView(curpersview.QwestsGlobal, currentView);

      return;
    } else if (currentView == curpersview.QwestsGlobal) {
      this.srv.pers$.value.currentView = curpersview.QwestTasks;
    } else if (currentView == curpersview.QwestSort) {
      this.srv.pers$.value.currentView = curpersview.QwestTasks;
    }

    this.srv.savePers(false);
  }

  firstOrGlobalSingleClick() {
    this.clickPreventSingleClick = false;
    const clickDelay = 200;
    this.clickTimer = setTimeout(() => {
      if (!this.clickPreventSingleClick) {
        this.firstOrGlobal();
      }
    }, clickDelay);
  }

  firstOrGlobalDoubleClick() {
    this.clickPreventSingleClick = true;
    clearTimeout(this.clickTimer);
    this.firstOrGlobal(true);
  }

  /** Открывает первую или последнюю задачу в сфокусированном режиме. */
  openBoundaryTask(isLast: boolean = false): void {
    let prs = this.srv.pers$.value;
    if (!prs.tasks.length) {
      return;
    }

    if (prs.currentView == curpersview.SkillTasks || prs.currentView == curpersview.SkillsGlobal) {
      let skills = this.skillsGlobal$.value;
      let boundarySkill = isLast ? skills[skills.length - 1] : skills[0];
      if (!boundarySkill) {
        return;
      }

      prs.currentTaskIndex = boundarySkill.tskIdx;
      prs.currentView = curpersview.SkillTasks;
      this.srv.savePers(false);

      return;
    }

    this.srv.setCurInd(isLast ? prs.tasks.length - 1 : 0);
    if (prs.currentView == curpersview.QwestsGlobal) {
      prs.currentView = curpersview.QwestTasks;
    }

    this.srv.savePers(false);
  }

  focusFocus() {
    if (this.srv.pers$.value.currentTaskIndex) {
      this.srv.setCurInd(this.srv.pers$.value.currentTaskIndex);
    } else {
      this.srv.setCurInd(0);
    }
  }

  /**
   * Получить первый невыполненный пункт чеклиста для текущей задачи.
   */
  getNextChecklistItem(tsk: Task) {
    let st = this.srv.allMap["stt" + tsk.id]?.link;
    if (!st || !st.isChecklist || !st.checklistItems) {
      return null;
    }

    return st.checklistItems.find(ci => ci && ci.name && ci.name.trim() && !ci.isDone) || null;
  }

  /**
   * Отметить пункт чеклиста выполненным.
   */
  completeChecklistItem(tsk: Task) {
    let item = this.getNextChecklistItem(tsk);
    if (item) {
      this.vibro.taskDone();

      item.isDone = true;
      this.srv.savePers(false);
    }
  }

  nextTask() {
    let i = this.srv.pers$.value.currentTaskIndex + 1;
    if (i >= this.srv.pers$.value.tasks.length) {
      i = 0;
    }
    this.srv.setCurInd(i);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.pers$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.prepareGlobalView(curpersview.SkillsGlobal);
      this.prepareGlobalView(curpersview.QwestsGlobal);
    });
  }

  onLongPress(e) {
    this.srv.setCurInd(0);
  }

  onMasonrySkillsLongPress(tsk: Task) {
    this.tskClick(0);
    // // Если есть таймер
    // if (tsk.aimTimer > 0 && !this.srv.isCounterAim(tsk)) {
    //   this.srv.currentTask$.next(tsk);
    //   this.openTaskTimer();
    // }
    // // Если есть счетчик
    // else if (tsk.isCounterEnable) {
    //   this.clickCounter(tsk);
    // }
  }

  onSwipeLeft(ev) {
    this.prevTask();
  }

  onSwipeRight(ev) {
    this.nextTask();
  }

  onTimeChanged(ev, tskid) {
    this.srv.allMap[tskid].item.time = ev;

    this.srv.savePers(false);
  }

  openPersList() {
    const pers = this.srv.pers$.value;
    if (pers && pers.isAbilityUpgradeHighlightPending) {
      pers.isAbilityUpgradeHighlightPending = false;
      this.srv.savePers(false);
    }

    this.srvSt.selTabPersList = 0;
    this.srvSt.selInventoryList = 0;
  }

  openPlusType(linkId, linkType) {
    if (linkType == "qwestTask") {
      this.srv.pers$.value.currentQwestId = linkId;
      this.srv.pers$.value.currentView = curpersview.QwestTasks;
      this.srv.savePers(false);
    } else if (linkType == "abTask") {
      this.srv.pers$.value.currentQwestId = null;
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
      this.srv.savePers(false);
      let idx = this.srv.pers$.value.tasks.findIndex((n) => n.plusToNames.filter((q) => q.linkId == linkId).length > 0);
      this.srv.setCurInd(idx);
    }
  }

  openTaskTimer(tskIdx?: number) {
    this.vibro.taskTimerOpen();

    const current = this.srv.currentTask$.value;
    const target = this.getAimTarget(current);
    let timerTask = current;
    if (target !== current) {
      timerTask = new Task();
      timerTask.secondsDone = target.secondsDone;
      timerTask.secondsToDone = target.secondsToDone;
      timerTask.isAlarmEnable = target.isAlarmEnable;
      timerTask.tittle = current.tittle;
    }

    let dialogRef = this.dialog.open(TaskTimerComponentComponent, {
      disableClose: true,
      panelClass: "backdrop-timer",
      backdropClass: "backdrop-timer",
      data: { task: timerTask },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((n) => {
        let diffSecconds = n / 1000;
        const isDone = target.aimTimer > 0 && target.secondsToDone - diffSecconds <= 0;
        target.secondsDone = diffSecconds;

        if (current.parrentTask) {
          const state: taskState = this.srv.allMap[current.id].item;
          state.secondsDone = diffSecconds;
          current.secondsDone = diffSecconds;
        }

        if (tskIdx != null && isDone) {
          this.tskClick(tskIdx);
        } else {
          this.srv.savePers(false);
        }
      });
  }

  prevTask() {
    let i = this.srv.pers$.value.currentTaskIndex - 1;
    if (i < 0) {
      i = this.srv.pers$.value.tasks.length - 1;
    }
    this.srv.setCurInd(i);
  }

  qwickAddTask() {
    if (this.srv.isDialogOpen) {
      return;
    }

    let qwestId = this.getCurrentQwestIdForQwickAdd();
    if (qwestId) {
      this.qwickAddTaskToQwest(qwestId);

      return;
    }

    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить задачу", text: "" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      try {
        if (name) {
          let dialQwest = this.srv.pers$.value.qwests.find((n) => n.name == "Дела");
          if (dialQwest == null) {
            this.srv.addQwest("Дела");
          }
          dialQwest = this.srv.pers$.value.qwests.find((n) => n.name == "Дела");
          this.srv.addTskToQwest(dialQwest, name);

          this.srv.savePers(false);
        }
      } finally {
        this.srv.isDialogOpen = false;
      }
    });
  }

  private getCurrentQwestIdForQwickAdd(): string {
    let prs = this.srv.pers$.value;
    if (!prs || prs.currentView != curpersview.QwestTasks) {
      return null;
    }

    if (prs.currentQwestId) {
      return prs.currentQwestId;
    }

    if (prs.currentTask && prs.currentTask.qwestId) {
      return prs.currentTask.qwestId;
    }

    return null;
  }

  qwickAddTaskToQwest(qwestId: string, isMasonryAdd: boolean = false) {
    if (this.srv.isDialogOpen) {
      return;
    }

    this.srv.isDialogOpen = true;
    let dialogComponent: any = isMasonryAdd ? QwickAddTaskDialogComponent : AddItemDialogComponent;
    const dialogRef = this.dialog.open(dialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить миссию", text: "" },
      backdropClass: "backdrop",
      autoFocus: false,
      restoreFocus: false,
    });

    dialogRef.afterClosed().subscribe((name) => {
      try {
        if (name) {
          setTimeout(() => {
            this.addTaskToQwestById(qwestId, name);
            this.cdr.markForCheck();
          }, 0);
        }
      } finally {
        this.srv.isDialogOpen = false;
        this.cdr.markForCheck();
      }
    });
  }

  qwickAddTaskToMasonryQwest(qwestId: string, ev?: any) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    this.blockMasonryQwestClick();
    this.vibro.masonryQwestQwickAdd();
    setTimeout(() => this.qwickAddTaskToQwest(qwestId, true), 0);
  }

  private blockMasonryQwestClick() {
    this.masonryQwestClickBlockUntil = Date.now() + 1200;
    this.clickPreventSingleClick = true;
    clearTimeout(this.clickTimer);
  }

  setGlobalTaskView(b: boolean) {
    this.srv.saveGlobalTaskViewState(b);
  }

  /**
   * Задаем ордер для "подзадачи" из статусов.
   * @param tskId
   * @param stateId
   * @param idx
   */
  setIndForState(tskId: string, stateId: any, idx: number) {
    // Находим задачу
    let task: Task;
    let abil: Ability;
    ({ task, abil } = this.srv.findTaskAnAb(tskId, task, abil));

    if (task) {
      for (let i = 0; i < task.states.length; i++) {
        const st = task.states[i];
        if (st.id === stateId) {
          task.states[i].order = idx;
        }
      }
    }
  }

  setIsNotWriteTime(ev: any, tsk: Task) {
    this.srv.allMap[tsk.id].item.isNotWriteTime = ev.checked;
    tsk.isNotWriteTime = ev.checked;
  }

  setMegaPlan() {
    this.srv.savePers(false);
  }

  setSort(currentView) {
    if (this.srv.pers$.value.isMegaPlan == null) {
      this.srv.pers$.value.isMegaPlan = false;
    }

    if (currentView == curpersview.QwestTasks) {
      this.srv.pers$.value.currentView = curpersview.QwestSort;
    } else if (currentView == curpersview.QwestSort) {
      let qwest: Qwest = this.srv.allMap[this.srv.pers$.value.currentQwestId].item;
      for (let index = 0; index < this.srv.pers$.value.tasks.length; index++) {
        this.srv.pers$.value.tasks[index].order = index;
      }
      qwest.tasks.sort((a, b) => a.order - b.order);

      this.srv.pers$.value.currentView = curpersview.QwestTasks;
    } else if (currentView == curpersview.SkillTasks || currentView == curpersview.SkillsGlobal) {
      this.lastGlobalBeforeSort = currentView == curpersview.SkillsGlobal;
      this.srv.pers$.value.currentView = curpersview.SkillsSort;
    } else if (currentView == curpersview.SkillsSort) {
      this.sortSkillsGlobal();

      this.srv.pers$.value.isMegaPlan = false;
      if (this.lastGlobalBeforeSort) {
        this.srv.pers$.value.currentView = curpersview.SkillsGlobal;
      } else {
        this.srv.pers$.value.currentView = curpersview.SkillTasks;
        this.srv.setCurInd(0);
      }
    }

    this.srv.savePers(false);
  }

  /**
   * Задать вид - задачи, квесты.
   * @param name Название вида.
   */
  async setView(currentView: curpersview): Promise<void> {
    if (currentView == curpersview.SkillTasks || currentView == curpersview.SkillsGlobal) {
      await this.openGlobalView(curpersview.QwestsGlobal, currentView);
    } else if (currentView == curpersview.QwestTasks || currentView == curpersview.QwestsGlobal) {
      await this.openGlobalView(curpersview.SkillsGlobal, currentView);
    }
  }

  setWriteTime() {
    this.srv.pers$.value.isWriteTime = !this.srv.pers$.value.isWriteTime;
    this.srv.savePers(false);
  }

  taskToEnd(tsk: Task) {
    this.srv.setTaskOrder(tsk, true, true);
    this.srv.setCurInd(0);
    this.srv.savePers(false);
  }

  tskClick(i) {
    if (this.srv.pers$.value.currentView != curpersview.SkillsSort && this.srv.pers$.value.currentView != curpersview.QwestSort) {
      this.srv.setCurInd(i);
      if (this.srv.pers$.value.currentView == curpersview.SkillsGlobal) {
        this.srv.pers$.value.currentView = curpersview.SkillTasks;
      } else if (this.srv.pers$.value.currentView == curpersview.QwestsGlobal) {
        this.srv.pers$.value.currentView = curpersview.QwestTasks;
      }
      this.srv.savePers(false);
    }
    // else if(this.srv.pers$.value.currentView == curpersview.SkillsSort)
    // {
    //   this.srv.showTask(this.srv.pers$.value.tasks[i]);
    // }
  }

  private getAbImg(t: Task) {
    let abImg: string = null;
    let mainTsk: Task = this.getMainTask(t);
    if (mainTsk != null) {
      if (mainTsk.requrense != "нет") {
        let ab: Ability = this.srv.allMap[mainTsk.id].link;
        if (ab != null) {
          abImg = ab.image;
        }
      }
    }
    return abImg;
  }

  private getMainTask(t: Task): Task {
    let mainTsk: Task = null;
    if (t.parrentTask) {
      mainTsk = this.srv.allMap[t.parrentTask].item;
    } else {
      mainTsk = t;
    }

    return mainTsk;
  }

  private sortSkillsGlobal() {
    const tasks = this.srv.pers$.value.tasks;

    for (let i = 0; i < tasks.length; i++) {
      const tsk = tasks[i];

      let tskPersOrder: Task | taskState;
      tskPersOrder = this.srv.allMap[tsk.id].item;

      if (tskPersOrder != null) {
        tsk.order = i;
        tskPersOrder.order = i;
      }
    }
  }
}
