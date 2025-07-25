import { v4 as uuid } from "uuid";
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PersService } from "../pers.service";
import { Location } from "@angular/common";
import { Ability } from "src/Models/Ability";
import { Pers } from "src/Models/Pers";
import { Qwest } from "src/Models/Qwest";
import { Reward } from "src/Models/Reward";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { MatDialog } from "@angular/material";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { filter, switchMap, takeUntil } from "rxjs/operators";
import { AddOrEditRevardComponent } from "../add-or-edit-revard/add-or-edit-revard.component";
import { ChangeCharactComponent } from "../pers/change-charact/change-charact.component";
import { Reqvirement, Task } from "src/Models/Task";
import { combineLatest, of, Subject } from "rxjs";
import { RevardDialogData } from "src/Models/RevardDialogData";
import { ReqItemType } from "src/Models/ReqItem";
import { FormControl } from "@angular/forms";
import { GameSettings, qwestHardness } from "../GameSettings";

@Component({
  selector: "app-qwest-detail",
  templateUrl: "./qwest-detail.component.html",
  styleUrls: ["./qwest-detail.component.css"],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class QwestDetailComponent implements OnInit {
  private unsubscribe$ = new Subject();

  qwestHardnessControll = new FormControl({});

  @ViewChild("nameEdt") nameEdt: ElementRef;
  isEditMode: boolean = false;
  /**
   * Добавление задачи из просмотра, когда квест выполнен.
   */
  isFromDoneQwest: boolean = false;
  isFromMain: boolean;
  isQuick: any;
  linkAbs: Task[] = [];
  nextQwests: Qwest[] = [];
  pers: Pers;
  prevQwest: Qwest;
  qwest: Qwest;
  qwestAbiliti;
  qwestRewards: Reward[] = [];

  constructor(private location: Location, private route: ActivatedRoute, public srv: PersService, private router: Router, public dialog: MatDialog, public gameSettings: GameSettings) {}

  /**
   * Добавить награду.
   */
  addNewRevard(r: Reward) {
    let header, isEdit;

    if (r) {
      header = "Редактировать награду";
      isEdit = true;
    } else {
      header = "Добавить награду";
      isEdit = false;
      r = new Reward();
      r.image = "assets/icons/tresure.png";
      r.isReward = true;
      r.reqvirements = [];
      r.reqvirements.push(<Reqvirement>{
        elName: this.qwest.name,
        elId: this.qwest.id,
        type: ReqItemType.qwest,
        elVal: 1,
        isDone: false,
        id: uuid(),
      });
    }

    this.srv.isDialogOpen = true;
    let data: RevardDialogData = {
      header: header,
      qwestId: this.qwest.id,
      rev: r,
    };
    const dialogRef = this.dialog.open(AddOrEditRevardComponent, {
      panelClass: "my-dialog",
      data: data,
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((rev) => {
      if (rev) {
        if (!isEdit) {
          this.srv.AddRevard(rev);
        }
      }

      this.srv.isDialogOpen = false;
      this.qwestRewards = this.getQwestRewards(this.qwest);
    });
  }

  addNextQwest() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить следующий квест", text: "" },

      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name) {
        this.srv.addQwest(name, this.qwest.id, this.qwest.image, this.qwest.abilitiId);
      }
      this.srv.isDialogOpen = false;
      this.getNextPrevQwests();
    });
  }

  /**
   * Добавление задачи.
   */
  addTask() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить миссию", text: "" },

      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name) {
        this.srv.addTskToQwest(this.qwest, name);
      }
      this.srv.isDialogOpen = false;
    });
  }

  chooseNextQwest() {
    let sortedQwests = this.pers.qwests.sort((a, b) => a.name.localeCompare(b.name)).filter((n) => n.id != this.qwest.id);

    if (sortedQwests.length < 1) {
      return;
    }

    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(ChangeCharactComponent, {
      panelClass: "my-big",
      data: { characteristic: sortedQwests[0], allCharacts: sortedQwests, tittle: "Выберите квест" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((n) => {
      if (n) {
        if (n.id != this.qwest.id) {
          for (const qw of this.pers.qwests) {
            if (qw.id == n.id) {
              qw.parrentId = this.qwest.id;

              break;
            }
          }
        }
      }
      this.srv.isDialogOpen = false;
      this.getNextPrevQwests();
    });
  }

  delAb() {
    this.qwest.abilitiId = null;
    this.qwestAbiliti = null;
  }

  delNextQwest(id) {
    for (const qw of this.pers.qwests) {
      if (qw.id === id) {
        qw.parrentId = null;
        break;
      }
    }

    this.getNextPrevQwests();
  }

  /**
   * Удаление награды.
   * @param id Идентификатор.
   */
  delReward(id: string) {
    this.srv.delReward(id);
    this.qwestRewards = this.getQwestRewards(this.qwest);
  }

  /**
   * Удаление задачи.
   * @param id Идентификатор.
   */
  delTask(id: string) {
    this.srv.delTaskfromQwest(this.qwest, id);
  }

  /**
   * Завершить квест.
   * @param qw Квест.
   */
  doneQwest(qw: Qwest) {
    this.srv.changesBefore();
    this.srv.DoneQwest(qw);
    if (this.isFromMain) {
      this.router.navigate(["/main"]);
    } else {
      this.router.navigate(["/pers"]);
    }

    this.srv.changesAfter(true);
  }

  /**
   * Сдвинуть задачу вниз.
   * @param i Индекс.
   */
  downTask(i: number) {
    if (this.qwest.tasks.length > i + 1) {
      let tmp = this.qwest.tasks[i];

      this.qwest.tasks[i] = this.qwest.tasks[i + 1];
      this.qwest.tasks[i + 1] = tmp;
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.qwest.tasks, event.previousIndex, event.currentIndex);
  }

  getNextPrevQwests() {
    let nextQw: Qwest[] = [];
    let prevQwest;

    for (const qw of this.pers.qwests) {
      if (qw.parrentId === this.qwest.id) {
        nextQw.push(qw);
      } else if (qw.id === this.qwest.parrentId) {
        prevQwest = qw;
      }
    }

    this.nextQwests = nextQw;
    this.prevQwest = prevQwest;
  }

  getQwestAb() {
    let qwAb = null;
    if (this.qwest.abilitiId) {
      for (const ch of this.pers.characteristics) {
        for (const ab of ch.abilities) {
          if (ab.id == this.qwest.abilitiId) {
            qwAb = ab;
            break;
          }
        }
      }
    }
    this.qwestAbiliti = qwAb;
  }

  getQwestRewards(qw: Qwest): Reward[] {
    if (qw) {
      return this.pers.rewards.filter((r) => r.reqvirements.filter((req) => req.elId == qw.id).length);
    } else {
      return [];
    }
  }

  goBack() {
    if (this.isEditMode) {
      this.isEditMode = false;
    } else {
      this.location.back();
    }
  }

  moveTaskToAnotherQwest(tsk: Task) {
    let sortedQwests = this.pers.qwests.sort((a, b) => a.name.localeCompare(b.name)).filter((n) => n.id != this.qwest.id);

    if (sortedQwests.length < 1) {
      return;
    }

    this.srv.isDialogOpen = true;

    const dialogRef = this.dialog.open(ChangeCharactComponent, {
      panelClass: "my-big",
      data: { characteristic: sortedQwests[0], allCharacts: sortedQwests, tittle: "Выберите квест (перенос задачи)" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((n) => {
      if (n) {
        if (n.id != this.qwest.id) {
          for (const qw of this.pers.qwests) {
            if (qw.id == n.id) {
              qw.tasks.push(tsk);
              this.qwest.tasks = this.qwest.tasks.filter((n) => n.id != tsk.id);

              break;
            }
          }
        }

        this.srv.savePers(false);
      }
      this.srv.isDialogOpen = false;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    if (!this.srv.pers$.value) {
      this.router.navigate(["/main"]);
    }

    this.route.queryParams.subscribe((queryParams: any) => {
      this.isQuick = queryParams.isQuick;
      if (this.isQuick && !queryParams.isActivate) {
        this.isEditMode = true;
        setTimeout(() => this.nameEdt.nativeElement.focus());
      }
    });

    this.srv.pers$
      .pipe(takeUntil(this.unsubscribe$))
      .pipe(switchMap((n) => combineLatest([this.route.params, of(n)])))
      .subscribe((n) => {
        const id = n[0]["id"];
        const fromMain = n[0]["fromMain"];
        this.pers = n[1];

        if (fromMain) {
          this.isFromMain = true;
        } else {
          this.isFromMain = false;
        }

        for (const qw of this.pers.qwests) {
          if (qw.id === id) {
            if (qw.hardnes == null || qw.hardnes == undefined) {
              qw.hardnes = 0;
            }
            this.qwest = qw;
            this.qwestRewards = this.getQwestRewards(qw);
            this.setHardnessControll(qw.hardnessId);

            break;
          }
        }

        this.findLinks();

        this.getNextPrevQwests();
        this.getQwestAb();
      });

    this.qwestHardnessControll.valueChanges.subscribe((q) => {
      if (this.qwest != null && q.id != this.qwest.hardnessId) {
        this.qwest.hardnessId = q.id;
        this.qwest.gold = q.gold;
      }
    });

    if (this.qwest != null && this.qwest.hardnessId == null) {
      this.setHardnessControll(3);
    }
  }

  setHardnessControll(hardnessId: number) {
    this.qwestHardnessControll.setValue(this.gameSettings.qwestHardneses.find((q) => q.id == hardnessId));
  }

  /**
   * Сохранить данные.
   */
  saveData() {
    if (this.isEditMode) {
      this.srv.savePers(false);
      this.findLinks();
      this.isEditMode = false;
      if (this.isQuick) {
        this.router.navigate(["/pers"]);
      }
    } else {
      this.isEditMode = true;
    }
  }

  setAbil() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(ChangeCharactComponent, {
      panelClass: "my-dialog",
      data: {
        characteristic: this.qwestAbiliti,
        allCharacts: this.pers.characteristics
          .reduce((a, b) => {
            return a.concat(b.abilities);
          }, [])
          .sort((a, b) => a.name.localeCompare(b.name)),
        tittle: "Выбери навык",
      },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((n) => {
      if (n) {
        this.qwest.abilitiId = n.id;
        this.qwestAbiliti = n;
      }
      this.srv.isDialogOpen = false;
    });
  }

  setExp(i: number) {
    this.qwest.hardnes = i;
    let expChange = this.srv.getQwestExpChange(i);

    this.qwest.exp = Math.ceil(expChange);
  }

  /**
   * Сдвинуть задачу вверх.
   * @param i Индекс задачи.
   */
  upTask(i: number) {
    if (i >= 1) {
      let tmp = this.qwest.tasks[i];

      this.qwest.tasks[i] = this.qwest.tasks[i - 1];
      this.qwest.tasks[i - 1] = tmp;
    }
  }

  private findLinks() {
    let linkAbs = [];
    if (this.qwest) {
      for (const ch of this.pers.characteristics) {
        for (const ab of ch.abilities) {
          if (ab.id == this.qwest.abilitiId) {
            linkAbs.push(ab.tasks[0]);
          }
        }
      }
    }

    this.linkAbs = linkAbs;
  }
}
