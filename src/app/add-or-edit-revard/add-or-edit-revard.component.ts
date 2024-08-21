import { Component, OnInit, Inject } from "@angular/core";
import { Reward } from "src/Models/Reward";
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { Pers } from "src/Models/Pers";
import { RequirementsAddDialogComponent } from "../pers/requirements-add-dialog/requirements-add-dialog.component";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { RevardDialogData } from "src/Models/RevardDialogData";
import { Reqvirement } from "src/Models/Task";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { GameSettings } from "../GameSettings";

@Component({
  selector: "app-add-or-edit-revard",
  templateUrl: "./add-or-edit-revard.component.html",
  styleUrls: ["./add-or-edit-revard.component.css"],
})
export class AddOrEditRevardComponent implements OnInit {
  private unsubscribe$ = new Subject();

  rev: Reward;
  revForm: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: RevardDialogData, private dialog: MatDialog, public gameSettings: GameSettings, public dialogRef: MatDialogRef<AddOrEditRevardComponent>) {
    this.revForm = new FormGroup({
      isLud: new FormControl(false),
      isShop: new FormControl(false),
      isReward: new FormControl(false),
      isArtefact: new FormControl(false),
      revProbCtrl: new FormControl({}),
    });
  }

  addReq() {
    const dialogRef = this.openReqDialogHandler(null);

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((n) => {
        if (n) {
          this.rev.reqvirements.push(n);
        }
      });
  }

  del(id: string) {
    this.rev.reqvirements = this.rev.reqvirements.filter((n) => n.id != id);
  }

  edit(req: Reqvirement) {
    const dialogRef = this.openReqDialogHandler(req);

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((n) => {
        if (n) {
          req.elId = n.elId;
          req.elName = n.elName;
          req.elVal = n.elVal;
          req.type = n.type;
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    if (this.data.rev.reqvirements == null) {
      this.data.rev.reqvirements = [];
    }

    this.rev = this.data.rev;

    this.revForm.get("revProbCtrl").setValue(this.gameSettings.revProbs.find((q) => q.id == this.rev.revProbId));

    this.revForm.get("revProbCtrl").valueChanges.subscribe((q) => {
      if (this.rev != null && this.rev.revProbId != q.id) {
        this.rev.revProbId = q.id;
        this.rev.ludProbability = q.prob;
        this.rev.cost = q.gold;
      }
    });

    if (this.rev.revProbId == null) {
      this.revForm.get("revProbCtrl").setValue(this.gameSettings.revProbs.find((q) => q.id == 3));
    }

    this.revForm.patchValue({
      isLud: this.rev.isLud,
      isShop: this.rev.isShop,
      isReward: this.rev.isReward,
      isArtefact: this.rev.isArtefact,
    });

    this.revForm.get("isLud").valueChanges.subscribe((value) => {
      this.rev.isLud = value;
      if (value == true) {
        this.revForm.patchValue({
          isReward: false,
          isArtefact: false,
        });
      }
    });

    this.revForm.get("isShop").valueChanges.subscribe((value) => {
      this.rev.isShop = value;
      if (value == true) {
        this.revForm.patchValue({
          isReward: false,
          isArtefact: false,
        });
      }
    });

    this.revForm.get("isReward").valueChanges.subscribe((value) => {
      this.rev.isReward = value;
      if (value == true) {
        this.revForm.patchValue({
          isLud: false,
          isShop: false,
          isArtefact: true,
        });
      }
    });

    this.revForm.get("isArtefact").valueChanges.subscribe((value) => {
      this.rev.isArtefact = value;
    });
  }

  toggleChip(chipName) {
    this.revForm.controls[chipName].setValue(!this.revForm.controls[chipName].value);
  }

  private openReqDialogHandler(data: any) {
    return this.dialog.open(RequirementsAddDialogComponent, {
      data: data,
      backdropClass: "backdrop",
    });
  }

  close() {
    this.dialogRef.close(this.rev);
  }
}
