import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Pers } from "src/Models/Pers";
import { Task, taskState, Reqvirement } from "src/Models/Task";
import { ActivatedRoute, Router } from "@angular/router";
import { PersService } from "../pers.service";
import { Location, PlatformLocation } from "@angular/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Ability } from "src/Models/Ability";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { MatDialog } from "@angular/material";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { Characteristic } from "src/Models/Characteristic";
import { ChangeCharactComponent } from "../pers/change-charact/change-charact.component";
import { Qwest } from "src/Models/Qwest";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { GameSettings } from "../GameSettings";

@Component({
  selector: "app-task-detail",
  templateUrl: "./task-detail.component.html",
  styleUrls: ["./task-detail.component.css"],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TaskDetailComponent implements OnInit {
  private unsubscribe$ = new Subject();

  aimUnits = [{ name: "Минут" }, { name: "Секунд" }, { name: "Часов" }, { name: "Раз" }, { name: "Раз чет" }, { name: "Раз нечет" }];
  charactCntrl: FormControl;
  charactGroup: FormGroup;
  @ViewChild("goUp", { static: false }) goUp: ElementRef;
  hardnesGroup = new FormGroup({
    hardnesControl: new FormControl(1),
  });
  hardneses = [
    { val: 0.5, name: "Легко" },
    { val: 1, name: "Норм" },
    { val: 2, name: "Сложно" },
  ];
  isClassical;
  isEditMode: boolean = false;
  isFromMain: any;
  isQuick: any;
  isShowAbProgrTable;
  linkQwests: Qwest[] = [];
  @ViewChild("nameEdt", { static: false }) nameEdt: ElementRef;
  percSymbol;
  pers: Pers;
  requrenses: string[] = Task.requrenses;
  times = [1, 2, 3, 4, 5];
  tsk: Task;
  tskAbility: Ability;
  tskCharact$ = new BehaviorSubject<Characteristic>(undefined);
  weekDays: string[] = Task.weekDays;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    public srv: PersService,
    private router: Router,
    public dialog: MatDialog,
    fb: FormBuilder,
    private platformLocation: PlatformLocation,
    public gameSettings: GameSettings
  ) {
    this.isShowAbProgrTable = this.gameSettings.isShowAbProgrTable;
    this.isClassical = this.gameSettings.isClassicaRPG;
    this.percSymbol = this.gameSettings.changesIsShowPercentageInAb ? "%" : "";

    this.charactCntrl = fb.control("");
    this.charactGroup = fb.group({
      charact: this.charactCntrl,
    });
  }

  /**
   * Добавить состояние к задаче.
   */
  addStateToTask(st: taskState) {
    let isEdit;
    this.srv.isDialogOpen = true;

    if (st) {
      isEdit = true;
    } else {
      isEdit = false;
    }

    let header = "";
    let time = null;

    header += isEdit ? "Редактировать" : "Добавить";
    header += this.tsk.requrense == "нет" ? " подзадачу" : " подзадачу";
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: header, text: isEdit ? st.name : "", timeVal: st ? st.timeVal : null },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((stt) => {
      if (stt) {
        if (!isEdit) {
          let state = new taskState();
          state.value = this.tsk.value;
          state.requrense = this.tsk.requrense;
          state.image = this.srv.GetRndEnamy(state, this.pers.level, this.pers.maxPersLevel);
          state.name = stt;
          //state.time = stt.time;
          this.tsk.states.push(state);

          if (this.tsk.requrense == "нет") {
            this.tsk.states = this.tsk.states.sort((a, b) => {
              return a.isDone === b.isDone ? 0 : b.isDone ? -1 : 1;
            });
          }
        } else {
          st.name = stt;
          //st.time = stt.time;
        }
      }
      this.srv.isDialogOpen = false;
    });
  }

  changeCharact() {
    if (!this.tskAbility || !this.tskCharact$.value) {
      return;
    }

    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(ChangeCharactComponent, {
      panelClass: "my-big",
      data: { characteristic: this.tskCharact$.value, allCharacts: this.pers.characteristics.sort((a, b) => a.name.localeCompare(b.name)), tittle: "Выберите квест" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((n) => {
      if (n) {
        if (n.id != this.tskCharact$.value.id) {
          for (const ch of this.pers.characteristics) {
            if (ch.id == n.id) {
              ch.abilities.push(this.tskAbility);

              break;
            }
          }

          // Перемещаем
          this.tskCharact$.value.abilities = this.tskCharact$.value.abilities.filter((n) => n.id !== this.tskAbility.id);

          this.tskCharact$.next(n);
        }
      }
      this.srv.isDialogOpen = false;
    });
  }

  /**
   * Удалить состояние у задачи.
   * @param id Идентификатор задачи.
   */
  delState(id: string) {
    this.tsk.states = this.tsk.states.filter((n) => {
      return n.id != id;
    });
  }

  /**
   * Сдвинуть задачу вниз.
   * @param i Индекс.
   */
  down(i: number) {
    if (this.tsk.states.length > i + 1) {
      let tmp = this.tsk.states[i];

      this.tsk.states[i] = this.tsk.states[i + 1];
      this.tsk.states[i + 1] = tmp;
    }
  }

  downAbil() {
    this.srv.downUbility(this.tskAbility);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.tsk.states, event.previousIndex, event.currentIndex);
  }

  findTask() {
    if (!this.pers) {
      this.router.navigate(["/main"]);
    }

    const id = this.route.snapshot.paramMap.get("id");

    this.tsk = this.srv.allMap[id].item;

    if (this.tsk) {
      if (this.tsk.requrense == "нет") {
        this.requrenses = Task.requrenses.filter((n) => {
          return n === "нет";
        });
      } else {
        this.tskAbility = this.srv.allMap[id].link;
        this.tskCharact$.next(this.srv.allMap[this.srv.allMap[id].link.id].link);
        this.requrenses = Task.requrenses.filter((n) => {
          return n != "нет";
        });
        this.hardnesGroup.patchValue({ hardnesControl: this.tsk.hardnes });
      }
    }

    const isEdit = this.route.snapshot.paramMap.get("isEdit");
    if (isEdit == "true") {
      this.isEditMode = true;
    }

    if (!this.tsk.tskWeekDays) {
      this.tsk.tskWeekDays = [...Task.weekDays];
    }

    if (!this.tsk.reqvirements) {
      this.tsk.reqvirements = [];
    }

    this.findLinks();
  }

  goBack() {
    if (this.isEditMode) {
      this.isEditMode = false;
    } else {
      this.location.back();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.route.queryParams.subscribe((queryParams: any) => {
      this.isQuick = queryParams.isQuick;
      this.isFromMain = queryParams.isFromMain;
      if (queryParams.isActivate == true) {
        this.isEditMode = true;
      }
      if (this.isQuick && !queryParams.isActivate) {
        setTimeout(() => this.nameEdt.nativeElement.focus());
      }
    });

    this.srv.pers$.pipe(takeUntil(this.unsubscribe$)).subscribe((n) => {
      this.pers = n;
      this.findTask();
    });

    this.tskCharact$.subscribe((n) => {
      if (this.charactCntrl.value != null && n.id != this.charactCntrl.value.id) {
        this.charactCntrl.setValue(n);
      }
    });

    this.charactCntrl.valueChanges.subscribe((n) => {
      if (this.tskCharact$.value != null && n.id != this.tskCharact$.value.id) {
        for (const ch of this.pers.characteristics) {
          if (ch.id == n.id) {
            ch.abilities.push(this.tskAbility);

            break;
          }
        }

        // Перемещаем
        this.tskCharact$.value.abilities = this.tskCharact$.value.abilities.filter((n) => n.id !== this.tskAbility.id);

        this.tskCharact$.next(n);
      }
    });

    this.hardnesGroup.get("hardnesControl").valueChanges.subscribe((q) => (this.tsk.hardnes = q));
  }

  onTskDateChange(ev) {
    this.tsk.date = ev;

    this.tsk.states.forEach((el) => {
      el.isDone = false;
    });
  }

  qwickSetDate(v) {
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    if (v == "today") {
      this.tsk.date = date;
    } else {
      date.setDate(date.getDate() + 1);
      this.tsk.date = date;
    }
    this.srv.CheckSetTaskDate(this.tsk);

    this.tsk.states.forEach((el) => {
      el.isDone = false;
    });
  }

  refrCounter() {
    this.tsk.refreshCounter++;
    this.srv.savePers(false);
  }

  requrenseChange() {
    this.qwickSetDate("today");
  }

  /**
   * Сохранить данные.
   */
  saveData() {
    if (this.isEditMode) {
      this.srv.savePers(false);
      this.findLinks();
      this.isEditMode = false;
      // if (this.isQuick) {
      //   this.location.back();
      //   // this.router.navigate(["/pers"]);
      // }
    } else {
      this.isEditMode = true;
    }
  }

  setIsHard() {
    this.tsk.isHard = !this.tsk.isHard;
  }

  setSumStates() {
    this.tsk.isSumStates = !this.tsk.isSumStates;
  }

  setTskHardness(val: number) {
    this.tsk.hardnes = val;
  }

  setWeekDays(wd) {
    let idx = this.tsk.tskWeekDays.indexOf(wd);

    if (idx == -1) {
      this.tsk.tskWeekDays.push(wd);
    } else {
      this.tsk.tskWeekDays.splice(idx, 1);
    }
  }

  trackByIdx(index: number, name: any): any {
    return name;
  }

  /**
   * Сдвинуть задачу вверх.
   * @param i Индекс задачи.
   */
  up(i: number) {
    if (i >= 1) {
      let tmp = this.tsk.states[i];

      this.tsk.states[i] = this.tsk.states[i - 1];
      this.tsk.states[i - 1] = tmp;
    }
  }

  upAbil() {
    this.srv.upAbility(this.tskAbility);
  }

  private findLinks() {
    let linkQwests = [];
    if (this.tskAbility) {
      for (const qw of this.pers.qwests) {
        if (qw.abilitiId == this.tskAbility.id) {
          linkQwests.push(qw);
        }
      }
    }
    this.linkQwests = linkQwests;
  }
}
