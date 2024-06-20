import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PersService } from "../pers.service";
import { Pers } from "src/Models/Pers";
import { Characteristic } from "src/Models/Characteristic";
import { Rangse } from "src/Models/Rangse";
import { Location } from "@angular/common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Ability } from "src/Models/Ability";
import { MatDialog } from "@angular/material";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { GameSettings } from "../GameSettings";

@Component({
  selector: "app-characteristic-details",
  templateUrl: "./characteristic-details.component.html",
  styleUrls: ["./characteristic-details.component.css"],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CharacteristicDetailsComponent implements OnInit {
  @ViewChild("nameEdt", { static: false }) nameEdt: ElementRef;
  private unsubscribe$ = new Subject();

  charact: Characteristic;
  isEditMode: boolean = false;

  rangse: Rangse[];
  pers: Pers;
  isQuick: any;
  GameSettings: typeof GameSettings;

  //  = Characteristic.rangse;
  constructor(private location: Location, private route: ActivatedRoute, public srv: PersService, private router: Router, public dialog: MatDialog) {
    this.GameSettings = GameSettings;
  }

  /**
   * Добавление навыка.
   */
  addAbil() {
    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: "my-dialog",
      data: { header: "Добавить навык", text: "" },
      backdropClass: "backdrop",
    });

    dialogRef.afterClosed().subscribe((name) => {
      if (name) {
        this.srv.addAbil(this.charact.id, name);
      }
      this.srv.isDialogOpen = false;
    });
  }

  /**
   * Удаление навыка.
   * @param id Идентификатор.
   */
  delAbil(id: string) {
    this.srv.delAbil(id);
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
      if (this.isQuick) {
        setTimeout(() => this.nameEdt.nativeElement.focus());
      }
    });

    this.srv.pers$.pipe(takeUntil(this.unsubscribe$)).subscribe((n) => {
      this.pers = n;
      const id = this.route.snapshot.paramMap.get("id");
      this.charact = this.srv.allMap[id].item;
      const isEdit = this.route.snapshot.paramMap.get("isEdit");
      if (isEdit == "true") {
        this.isEditMode = true;
      }
    });

    if (!this.srv.pers$.value) {
      this.router.navigate(["/main"]);
    }

    this.rangse = [];
    for (let index = this.GameSettings.minChaLvl - 1; index <= this.GameSettings.maxChaLvl - 1; index++) {
      let rng = new Rangse();
      rng.val = index;
      rng.img = "";
      rng.name = "" + index;
      this.rangse.push(rng);
    }
  }

  upAbil(ab: Ability) {
    this.srv.upAbility(ab);
  }

  /**
   * Сохранить данные.
   */
  saveData() {
    if (this.isEditMode) {
      this.srv.savePers(false);
      this.isEditMode = false;
      if (this.isQuick) {
        this.router.navigate(["/pers"]);
      }
    } else {
      this.isEditMode = true;
    }
  }

  showAbility(ab: Ability) {
    let tsk = ab.tasks[0];
    if (tsk) {
      this.router.navigate(["/pers/task", tsk.id, false]);
    }
  }
}
