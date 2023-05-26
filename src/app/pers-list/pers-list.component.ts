import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { PersService } from "../pers.service";
import { Pers } from "src/Models/Pers";
import { Characteristic } from "src/Models/Characteristic";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { Reward } from "src/Models/Reward";
import { Subject } from "rxjs";
import { Ability } from "src/Models/Ability";
import { MatDialog } from "@angular/material";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { AddOrEditRevardComponent } from "../add-or-edit-revard/add-or-edit-revard.component";
import { Qwest } from "src/Models/Qwest";
import { StatesService } from "../states.service";
import { takeUntil } from "rxjs/operators";
import { PersImportExportDialogComponent } from "../pers-import-export-dialog/pers-import-export-dialog.component";
import { RevardDialogData } from "src/Models/RevardDialogData";
import { GameSettings } from "../GameSettings";

@Component({
  selector: "app-pers-list",
  templateUrl: "./pers-list.component.html",
  styleUrls: ["./pers-list.component.css"],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class PersListComponent implements OnInit {
  private unsubscribe$ = new Subject();

  chaArea: string = "";
  isEditMode: boolean = false;
  pers: Pers;
  selAb: Ability;
  selCha: Characteristic;
  GameSettings: typeof GameSettings;

  constructor(private location: Location, public srvSt: StatesService, private route: ActivatedRoute, public srv: PersService, private router: Router, public dialog: MatDialog) {
    this.GameSettings = GameSettings;
  }

  /**
   * Добавление навыка.
   */
  addAbil(charactId: string) {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить навык", text: "" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name) {
        this.srv.addAbil(charactId, name);
      }
      this.srv.isDialogOpen = false;
    });
  }

  /**
   * Добавление характеристки
   */
  addCharact() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить характеристику", text: "" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name) {
        this.srv.addCharact(name);
      }
      this.srv.isDialogOpen = false;
    });
  }

  /**
   * Создание нового квеста.
   */
  addNewQwest() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить квест", text: "" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name) {
        this.srv.addQwest(name);
      }
      this.srv.isDialogOpen = false;
    });
  }

  /**
   * Добавить награду.
   */
  addNewRevard(r) {
    let header, isEdit;

    if (r) {
      header = "Редактировать трофей";
      isEdit = true;
    } else {
      header = "Добавить трофей";
      isEdit = false;
      r = new Reward();
      r.isArtefact = false;
      r.image = "assets/icons/tresure.png";
    }

    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddOrEditRevardComponent, {
      panelClass: "my-dialog",
      data: <RevardDialogData>{ header: header, rev: r },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((rev) => {
      if (rev) {
        if (!isEdit) {
          this.srv.AddRevard(rev);
        }

        this.srv.recountRewards(this.srv.pers$.value);
      }
      this.srv.isDialogOpen = false;
    });
  }

  addOnlyAb() {
    let firstCharact: Characteristic;
    if (this.pers.characteristics.length > 0) {
      firstCharact = this.pers.characteristics[0];
    } else {
      this.srv.addCharact("");
      firstCharact = this.pers.characteristics[0];
    }

    this.addAbil(firstCharact.id);
  }

  buyRevard(rev: Reward) {
    this.srv.changesBefore();

    this.pers.gold -= rev.cost;
    this.srv.addToInventory(rev);
    if (rev.isArtefact) {
      this.srv.pers$.value.rewards = this.srv.pers$.value.rewards.filter((r) => r.id != rev.id);
    }

    this.srv.savePers(true);

    this.srv.changesAfter(null);
  }

  /**
   * Удаление навыка.
   * @param id Идентификатор.
   */
  delAbil(id: string) {
    this.srv.delAbil(id);
  }

  /**
   * Удаляем характеристику.
   * @param uuid Идентификатор.
   */
  delCharact(uuid) {
    this.srv.DeleteCharact(uuid);
  }

  /**
   * Удалить квест.
   * @param id Идентификатор квеста.
   */
  delQwest(id: string) {
    this.srv.delQwest(id);
  }

  /**
   * Удаление трофея.
   * @param id Идентификатор.
   */
  delReward(id: string) {
    this.srv.delReward(id);
  }

  delTask(ab: Ability, id: string) {
    this.srv.delTask(ab, id);
  }

  /**
   * Завершить квест.
   * @param qw Квест.
   */
  doneQwest(qw: Qwest) {
    this.srv.changesBefore();
    this.srv.DoneQwest(qw);
    this.srv.changesAfter(true);
  }

  /**
   * Экспорт персонажа - в виде текста.
   *
   */
  exportPers() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(PersImportExportDialogComponent, {
      data: { isImport: false },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((n) => {
      this.srv.isDialogOpen = false;
    });
  }

  goBack() {
    if (this.isEditMode) {
      this.isEditMode = false;
    } else {
      // this.location.back();
      this.router.navigate(["/main"]);
    }
  }

  /**
   * Импорт персонажа - из текстового файла.
   *
   */
  importPers() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(PersImportExportDialogComponent, {
      data: { isImport: true },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((n) => {
      if (n) {
        let newPers: Pers = JSON.parse(n);
        newPers.id = this.srv.pers$.value.id;
        newPers.userId = this.srv.pers$.value.userId;
        this.srv.setPers(JSON.stringify(newPers));
      }
      this.srv.isDialogOpen = false;
    });
  }

  loadSamplePers() {
    if (window.confirm("Вы уверены, что хотите загрузить тренировочного перса?")) {
      this.srv.setLearningPers(this.pers.userId);
      this.saveData();
    }
  }

  newgame() {
    this.isEditMode = false;
    this.router.navigate(["sync"], {
      queryParams: {
        type: "newGame",
      },
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

    const id = this.route.snapshot.paramMap.get("isFirst");
    if (id) {
      this.srvSt.selTabPersList = 0;
      this.srvSt.selInventoryList = 0;
    }

    this.srv.pers$.pipe(takeUntil(this.unsubscribe$)).subscribe((n) => {
      this.pers = n;
    });
  }

  openShop() {
    this.srvSt.selTabPersList = 2;
    this.srvSt.selInventoryList = 1;
  }

  quickAddAbil() {
    if (this.pers.characteristics == null || !this.pers.characteristics.length) {
      return;
    }

    let abilId = this.srv.addAbil(this.pers.characteristics[0].id, "Навык");

    this.srv.savePers(false);

    this.router.navigate(["pers/task", abilId, true], { queryParams: { isQuick: true } });
    // this.srv.isDialogOpen = true;

    // const dialogRef = this.dialog.open(QuickAddAbilityComponent, {
    //   panelClass: 'my-middle',
    //   data: { isImport: false },
    //   backdropClass: 'backdrop'
    // });

    // dialogRef.afterClosed()
    //   .subscribe(n => {
    //     this.srv.isDialogOpen = false;
    //   });
  }

  quickAddCharact() {
    let cha = this.srv.addCharact("Характеристика");
    this.srv.savePers(false);
    this.router.navigate(["pers/characteristic", cha.id, true], { queryParams: { isQuick: true } });

    // this.srv.isDialogOpen = true;
    // const dialogRef = this.dialog.open(AddItemDialogComponent, {
    //   panelClass: 'my-dialog',
    //   data: { header: 'Добавить характеристику', text: '' },
    //   backdropClass: 'backdrop'
    // });

    // dialogRef.afterClosed()
    //   .subscribe(name => {
    //     if (name) {
    //       let cha = this.srv.addCharact(name);

    //       this.srv.savePers(false);

    //       this.router.navigate(['pers/characteristic', cha.id, true]);
    //     }
    //     this.srv.isDialogOpen = false;
    //   });
  }

  upAbil(ab: Ability) {
    this.srv.activateAbility(ab, true);
  }

  /**
   * Респаун.
   */
  resp() {
    if (window.confirm("Вы уверены?")) {
      this.pers.lastTaskId = null;
      this.pers.isOffline = true;
      this.pers.gold = 0;
      this.pers.characteristics.forEach((cha) => {
        cha.abilities.forEach((ab) => {
          ab.isOpen = false;
          ab.tasks.forEach((tsk) => {
            this.srv.GetRndEnamy(tsk, this.pers.level, this.pers.maxPersLevel);
            tsk.order = GameSettings.tskOrderDefault;
            tsk.autoTime = 0;
            tsk.plusExp = 0;
            tsk.lastDate = 0;
            tsk.prevId = null;
            tsk.nextId = null;
            tsk.failCounter = 0;
            tsk.value = 1;
            tsk.tesValue = 0;
            tsk.tesAbValue = 0;
            tsk.refreshCounter = 0;
            tsk.date = new Date();
            tsk.secondsDone = 0;
            tsk.nextAbVal = 0;
            this.srv.GetRndEnamy(tsk, 0, this.pers.maxPersLevel);
            tsk.states.forEach((st) => {
              st.order = GameSettings.tskOrderDefault;
              st.autoTime = 0;
              st.lastDate = 0;
              st.prevId = null;
              st.nextId = null;
              st.lastNotDone = false;
              st.secondsDone = 0;
              this.srv.GetRndEnamy(st, 0, this.pers.maxPersLevel);
            });
            tsk.secondsDone = 0;
            tsk.lastNotDone = false;
            this.srv.setStatesNotDone(tsk);
          });
        });
      });

      // Обновление картинок квестов
      this.srv.updateQwestTasksImages(this.pers);

      this.pers.expKoef = 0;
      this.pers.exp = 0;
      this.pers.level = 0;
      this.pers.inventory = [];

      this.srv.clearDiary();
      // там тоже перс сохраняется...
      this.saveData();
    }
  }

  rest() {
    this.pers.isRest = true;
    this.srv.savePers(false);
    this.router.navigate(["/main"]);
  }

  /**
   * Сохранить данные.
   */
  saveData() {
    if (this.isEditMode) {
      this.srv.savePers(false);
      this.isEditMode = false;
    } else {
      this.isEditMode = true;
    }
  }

  showAbility(ab: Ability) {
    this.srv.showAbility(ab);
  }

  sync(isDownload) {
    if (this.pers.userId == null) {
      window.alert("Сначала войди в систему...");
      this.router.navigate(["/pers/login"], {
        queryParams: {
          frome: "/pers",
          type: "setUserId",
        },
      });
    } else {
      this.router.navigate(["sync"], {
        queryParams: {
          frome: "/pers",
          type: isDownload ? "load" : "upload",
        },
      });
    }
  }

  /**
   * Использование награды.
   * @param rev Награда.
   */
  useRevard(rev: Reward) {
    this.srv.changesBefore();

    // Уменьшаем количество если их больше чем 1
    if (rev.count >= 2) {
      rev.count = rev.count - 1;
    } else {
      // Удаляем из инвентаря
      this.srv.delInventoryItem(rev);
    }

    this.srv.savePers(true);

    this.srv.changesAfter(null);
  }

  qwickAddQwest() {
    let qwestId = this.srv.addQwest("Квест");

    this.srv.savePers(false);

    this.router.navigate(["pers/qwest", qwestId], { queryParams: { isQuick: true } });
  }

  qwickAddReward() {
    this.addNewRevard(null);
    this.srv.savePers(false);
  }
}
