import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { PersService } from "../pers.service";
import { Task, taskState } from "src/Models/Task";
import { BehaviorSubject, Subject } from "rxjs";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Ability } from "src/Models/Ability";
import { MatDialog } from "@angular/material";
import { sortArr } from "src/Models/sortArr";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { StatesService } from "../states.service";
import { curpersview } from "src/Models/curpersview";
import { Qwest } from "src/Models/Qwest";
import { TaskTimerComponentComponent } from "../task-timer-component/task-timer-component.component";
import { takeUntil } from "rxjs/operators";
import * as moment from "moment";
import { GameSettings } from "../GameSettings";
// import { Vibration } from "@awesome-cordova-plugins/vibration";
// import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";
import { Vibration } from "@awesome-cordova-plugins/vibration";

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
  qwickSortVals: sortArr[] = [];

  constructor(public srv: PersService, public dialog: MatDialog, private srvSt: StatesService) {}

  /**
   * Автовремя.
   */
  autoSort(tsk: Task, isDone: boolean) {
    let prs = this.srv.pers$.value;

    if (!prs.isWriteTime || prs.currentView != curpersview.SkillTasks) {
      return;
    }

    let tsks: Task[] = prs.tasks;

    if (tsks.length > 0 && tsks.find((q) => q.order == GameSettings.tskOrderDefault) != null) {
      this.srv.pers$.value.currentView = curpersview.SkillsSort;
      this.srv.savePers(false);

      tsks = this.srv.pers$.value.tasks;
      this.sortSkillsGlobal();

      // // Лог
      // for (const tsk of tsks) {
      //   console.log(tsk.order + ": " + tsk.name);
      // }

      this.srv.pers$.value.currentView = curpersview.SkillTasks;
      this.srv.savePers(false);

      tsks = this.srv.pers$.value.tasks;
    }

    const orders = tsks.map((q) => q.order);

    tsks.unshift(
      tsks.splice(
        tsks.findIndex((q) => q.id == tsk.id),
        1
      )[0]
    );

    for (let i = 0; i < tsks.length; i++) {
      let t = tsks[i];
      let tskPers: Task | taskState = this.srv.allMap[t.id].item;

      if (tskPers != null) {
        tskPers.order = orders[i];
      }
    }

    if (prs.isWriteTime) {
      prs.currentView = curpersview.SkillsGlobal;
    }
  }

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
      await this.delay(GameSettings.flashDelay);
      this.isSucessShownOv$.next(false);
      // this.isSucessShown$.next(true);
      // await this.delay(500);
      // this.isSucessShown$.next(false);
    } else {
      this.isFailShownOv$.next(true);
      await this.delay(GameSettings.flashDelay);
      this.isFailShownOv$.next(false);
      // this.isFailShown$.next(true);
      // await this.delay(500);
      // this.isFailShown$.next(false);
    }
  }

  changeEnamyImageForItem(id) {
    this.srv.GetRndEnamy(this.srv.allMap[id].item, this.srv.pers$.value.level, this.srv.pers$.value.maxPersLevel);
  }

  checkDate(date: Date) {
    let dt = new Date(date).setHours(0, 0, 0, 0);
    let now = new Date().setHours(0, 0, 0, 0);

    if (dt.valueOf() < now.valueOf()) {
      return true;
    }

    return false;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async done(t: Task) {
    await this.animate(true);

    this.changeEnamyImageForItem(t.id);

    this.srv.changesBefore();

    let tskName = "";

    const prs = this.srv.pers$.value;

    let tskIndex = prs.tasks.indexOf(t);

    this.autoSort(t, true);

    if (t.parrentTask) {
      // Логика для навыков
      if (t.requrense != "нет") {
        tskName = this.srv.allMap[t.id].item.name;
        this.srv.subtaskDoneOrFail(t.parrentTask, t.id, true);
      }
      // Логика для подзадач
      else {
        const subTsk: taskState = this.srv.allMap[t.id].item;
        subTsk.lastNotDone = false;
        subTsk.isDone = true;
        subTsk.secondsDone = 0;
      }
    } else {
      this.srv.taskPlus(t.id);
      tskName = t.tittle;
    }

    if (tskName && !prs.isNoDiary) {
      prs.Diary[0].done += tskName + "; ";
    }

    if (t.requrense == "нет") {
      this.srv.upQwest(t.id);
    }

    this.srv.savePers(true);

    if (prs.currentView == curpersview.SkillTasks) {
      this.srv.setCurInd(tskIndex);
    }

    this.srv.changesAfter(true);
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

    this.changeEnamyImageForItem(t.id);

    this.srv.changesBefore();

    let tskName = "";

    let prs = this.srv.pers$.value;

    let tskIndex = prs.tasks.indexOf(t);

    this.autoSort(t, false);

    if (t.parrentTask) {
      // Логика для подзадач
      const tsk: Task = this.srv.allMap[t.parrentTask].item;
      for (const st of tsk.states) {
        st.secondsDone = 0;
      }
      tskName = this.srv.allMap[t.id].item.name;
      this.srv.subtaskDoneOrFail(t.parrentTask, t.id, false);
    } else {
      // Логика для задач
      tskName = t.tittle;
      this.srv.taskMinus(t.id);
    }

    if (tskName && !prs.isNoDiary) {
      prs.Diary[0].notDone += tskName + "; ";
    }

    this.srv.savePers(true);

    if (prs.currentView == curpersview.SkillTasks) {
      this.srv.setCurInd(tskIndex);
    }

    this.srv.changesAfter(false);
  }

  firstOrGlobal() {
    if (this.srv.pers$.value.currentView == curpersview.SkillTasks) {
      this.srv.pers$.value.currentView = curpersview.SkillsGlobal;
    } else if (this.srv.pers$.value.currentView == curpersview.SkillsSort) {
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
    } else if (this.srv.pers$.value.currentView == curpersview.SkillsGlobal) {
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

  focusFocus() {
    if (this.srv.pers$.value.currentTaskIndex) {
      this.srv.setCurInd(this.srv.pers$.value.currentTaskIndex);
    } else {
      this.srv.setCurInd(0);
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

  ngOnInit() {}

  onLongPress(e) {
    this.srv.setCurInd(0);
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

  setIsNotWriteTime(ev: any, tsk: Task) {
    this.srv.allMap[tsk.id].item.isNotWriteTime = ev.checked;
    tsk.isNotWriteTime = ev.checked;
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

  openTaskTimer() {
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
        if (current.parrentTask) {
          let tsk: Task = this.srv.allMap[this.srv.currentTask$.value.parrentTask].item;
          let st: taskState = this.srv.allMap[this.srv.currentTask$.value.id].item;
          let tt: number = tsk.secondsToDone - diffSecconds;
          if (tt < 0) {
            tt = 0;
          }

          if (tt > tsk.secondsToDone) {
            tt = tsk.secondsToDone;
          }

          st.secondsDone = tt;
        } else {
          let tsk: Task = this.srv.allMap[this.srv.currentTask$.value.id].item;
          let tt: number = tsk.secondsToDone - diffSecconds;
          if (tt < 0) {
            tt = 0;
          }

          if (tt > tsk.secondsToDone) {
            tt = tsk.secondsToDone;
          }

          tsk.secondsDone = tt;
        }

        this.srv.savePers(false);
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

  setMegaPlan() {
    this.srv.savePers(false);
  }

  setWriteTime() {
    this.srv.pers$.value.isWriteTime = !this.srv.pers$.value.isWriteTime;
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
    } else if (currentView == curpersview.SkillTasks) {
      this.srv.pers$.value.currentView = curpersview.SkillsSort;
    } else if (currentView == curpersview.SkillsSort || currentView == curpersview.SkillsGlobal) {
      this.sortSkillsGlobal();

      this.srv.pers$.value.isMegaPlan = false;
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
    }

    this.srv.savePers(false);
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

  /**
   * Задать вид - задачи, квесты.
   * @param name Название вида.
   */
  setView(currentView) {
    if (currentView == curpersview.SkillTasks || currentView == curpersview.SkillsGlobal) {
      this.srv.pers$.value.currentView = curpersview.QwestTasks;
      this.srv.savePers(false);
    } else if (currentView == curpersview.QwestTasks || currentView == curpersview.QwestsGlobal) {
      this.srv.pers$.value.currentView = curpersview.SkillTasks;
      this.srv.savePers(false);
    }
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
}
