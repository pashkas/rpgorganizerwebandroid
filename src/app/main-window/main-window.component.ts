import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from "@angular/core";
import { PersService } from "../pers.service";
import { Task, taskState } from "src/Models/Task";
import { BehaviorSubject, Observable, Subject, combineLatest, forkJoin, of } from "rxjs";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Ability } from "src/Models/Ability";
import { MatDialog } from "@angular/material";
import { sortArr } from "src/Models/sortArr";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { StatesService } from "../states.service";
import { curpersview } from "src/Models/curpersview";
import { Qwest } from "src/Models/Qwest";
import { TaskTimerComponentComponent } from "../task-timer-component/task-timer-component.component";
import { filter, switchMap, takeUntil } from "rxjs/operators";
import { GameSettings } from "../GameSettings";
import { BreakpointObserver } from "@angular/cdk/layout";
import { NgxMasonryComponent } from "ngx-masonry";
import { GlobalItem } from "src/Models/GlobalItem";

@Component({
  selector: "app-main-window",
  templateUrl: "./main-window.component.html",
  styleUrls: ["./main-window.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent implements OnInit {
  private unsubscribe$ = new Subject();

  currentCounterDone$ = this.srv.currentCounterDone$.asObservable();
  currentTask$ = this.srv.currentTask$.asObservable();
  currentView$ = this.srv.currentView$.asObservable();
  globalMasonryCls$: Observable<string>;
  globalMasonryClsNGX$: Observable<string>;
  isFailShown$ = new BehaviorSubject<boolean>(false);
  isFailShownOv$ = new BehaviorSubject<boolean>(false);
  isSort: boolean = false;
  isSucessShown$ = new BehaviorSubject<boolean>(false);
  isSucessShownOv$ = new BehaviorSubject<boolean>(false);
  lastGlobalBeforeSort: boolean;
  @ViewChild(NgxMasonryComponent, { static: false }) masonry: NgxMasonryComponent;
  public myOptions = {
    horizontalOrder: true,
    animations: "hide",
  };
  pers$ = this.srv.pers$.asObservable();
  qwestsGlobal$ = this.srv.qwestsGlobal$;
  qwickSortVals: sortArr[] = [];
  skillsGlobal$ = this.srv.skillsGlobal$;

  constructor(public srv: PersService, public dialog: MatDialog, private srvSt: StatesService, public gameSettings: GameSettings, private breakpointObserver: BreakpointObserver) {}

  addToQwest() {
    let qwest = this.srv.allMap[this.srv.pers$.value.currentQwestId].item;

    if (qwest) {
      const dialogRef = this.dialog.open(AddItemDialogComponent, {
        panelClass: "my-dialog",
        data: { header: "Добавить миссию", text: "" },

        backdropClass: "backdrop",
      });

      dialogRef.afterClosed().subscribe((name) => {
        if (name) {
          this.srv.addTskToQwest(qwest, name);
          this.srv.savePers(false);
        }
      });
    }
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

  async clickCounter(cur: Task) {
    cur.counterDone = cur.counterDone + 1;
    this.srv.currentCounterDone$.next(cur.counterDone);

    if (cur.parrentTask) {
      let st: taskState = this.srv.allMap[cur.id].item;

      st.counterDone = cur.counterDone;
    } else {
      let tsk: Task = this.srv.allMap[cur.id].item;

      tsk.counterDone = cur.counterDone;
    }

    this.srv.savePers(false);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async done(t: Task) {
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
      this.srv.pers$.value.currentView = curpersview.SkillsGlobal;
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
    // Vibration.vibrate(250);

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
      this.srv.pers$.value.currentView = curpersview.SkillsGlobal;
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

  masonrySingleClick(tskIdx: number) {
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

  firstOrGlobal(isLast: boolean = false) {
    if (this.srv.pers$.value.currentView == curpersview.SkillTasks) {
      this.srv.pers$.value.currentView = curpersview.SkillsGlobal;
    } else if (this.srv.pers$.value.currentView == curpersview.SkillsSort) {
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
    } else if (this.srv.pers$.value.currentView == curpersview.SkillsGlobal) {
      if (!isLast) {
        this.srv.setCurInd(0);
      } else {
        this.srv.setCurInd(this.srv.pers$.value.tasks.length);
      }
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
    } else if (this.srv.pers$.value.currentView == curpersview.QwestTasks) {
      this.srv.pers$.value.currentView = curpersview.QwestsGlobal;
    } else if (this.srv.pers$.value.currentView == curpersview.QwestsGlobal) {
      this.srv.pers$.value.currentView = curpersview.QwestTasks;
    } else if (this.srv.pers$.value.currentView == curpersview.QwestSort) {
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

  focusFocus() {
    if (this.srv.pers$.value.currentTaskIndex) {
      this.srv.setCurInd(this.srv.pers$.value.currentTaskIndex);
    } else {
      this.srv.setCurInd(0);
    }
  }

  itemsLoaded(type: string, ev: any) {
    this.masonry.reloadItems();
    this.masonry.layout();
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

  ngOnInit() {
    const screenObservable = this.breakpointObserver.observe(["(min-width: 927px)", "(max-width: 926px) and (min-width: 601px)", "(max-width: 600px)"]);
    const qwestObservable = this.srv.qwestsGlobal$;
    const skillsObservable = this.srv.skillsGlobal$;
    const viewObservable = this.srv.currentView$.pipe(filter((q) => q == curpersview.QwestsGlobal || q == curpersview.SkillsGlobal));

    this.globalMasonryCls$ = combineLatest([screenObservable, qwestObservable, skillsObservable, viewObservable]).pipe(
      switchMap(([screen, qwests, skills, view]) => {
        let cls = "main-masonry";

        if (screen.breakpoints["(min-width: 927px)"]) {
          // большой
          cls += "-big";
        } else if (screen.breakpoints["(max-width: 926px) and (min-width: 601px)"]) {
          // средний
          cls += "-mid";
        } else if (screen.breakpoints["(max-width: 600px)"]) {
          cls += "-small";
          // if (view == curpersview.QwestsGlobal && qwests.length >= 12) {
          //   cls += "-plus";
          // }

          if (view == curpersview.SkillsGlobal && skills.length > 12) {
            cls += "-plus";
          }
        }

        return of(cls);
      })
    );

    this.globalMasonryClsNGX$ = combineLatest([screenObservable, qwestObservable, skillsObservable, viewObservable]).pipe(
      switchMap(([screen, qwests, skills, view]) => {
        let cls = "ngx-masonry-item";

        if (screen.breakpoints["(min-width: 927px)"]) {
          // большой
          cls += "-big";
        } else if (screen.breakpoints["(max-width: 926px) and (min-width: 601px)"]) {
          // средний
          cls += "-mid";
        } else if (screen.breakpoints["(max-width: 600px)"]) {
          // cls += "-small";
          // if (view == curpersview.QwestsGlobal && qwests.length >= 12) {
          //   cls += "-plus";
          // }
          // if (view == curpersview.SkillsGlobal && skills.length >= 12) {
          //   cls += "-plus";
          // }
        }

        return of(cls);
      })
    );
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
    let dialogRef = this.dialog.open(TaskTimerComponentComponent, {
      disableClose: true,
      panelClass: "backdrop-timer",
      backdropClass: "backdrop",
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((n) => {
        let diffSecconds = n / 1000;
        let current = this.srv.currentTask$.value;
        let isDone = false;
        if (current.parrentTask) {
          let tsk: Task = this.srv.allMap[this.srv.currentTask$.value.parrentTask].item;
          let st: taskState = this.srv.allMap[this.srv.currentTask$.value.id].item;
          let tt: number = tsk.secondsToDone - diffSecconds;
          if (tt <= 0) {
            tt = 0;
            isDone = true;
          }

          if (tt > tsk.secondsToDone) {
            tt = tsk.secondsToDone;
          }

          // st.secondsDone = tt;
          st.secondsDone = n / 1000;
        } else {
          let tsk: Task = this.srv.allMap[this.srv.currentTask$.value.id].item;
          let tt: number = tsk.secondsToDone - diffSecconds;
          if (tt <= 0) {
            tt = 0;
            isDone = true;
          }

          if (tt > tsk.secondsToDone) {
            tt = tsk.secondsToDone;
          }

          // tsk.secondsDone = tt;
          tsk.secondsDone = n / 1000;
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
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить задачу", text: "" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name) {
        let dialQwest = this.srv.pers$.value.qwests.find((n) => n.name == "Дела");
        if (dialQwest == null) {
          this.srv.addQwest("Дела");
        }
        dialQwest = this.srv.pers$.value.qwests.find((n) => n.name == "Дела");
        this.srv.addTskToQwest(dialQwest, name, true);

        this.srv.savePers(false);
      }
      this.srv.isDialogOpen = false;
    });
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
    } else if (currentView == curpersview.SkillsGlobal) {
      this.srv.pers$.value.currentView = curpersview.SkillsSort;
    } else if (currentView == curpersview.SkillsSort || currentView == curpersview.SkillsGlobal) {
      this.sortSkillsGlobal();

      this.srv.pers$.value.isMegaPlan = false;
      this.srv.pers$.value.currentView = curpersview.SkillsGlobal;
    }

    this.srv.savePers(false);
  }

  /**
   * Задать вид - задачи, квесты.
   * @param name Название вида.
   */
  setView(currentView) {
    if (currentView == curpersview.SkillTasks || currentView == curpersview.SkillsGlobal) {
      this.srv.pers$.value.currentView = curpersview.QwestsGlobal;
      this.srv.savePers(false);
    } else if (currentView == curpersview.QwestTasks || currentView == curpersview.QwestsGlobal) {
      this.srv.pers$.value.currentView = curpersview.SkillsGlobal;
      this.srv.savePers(false);
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
