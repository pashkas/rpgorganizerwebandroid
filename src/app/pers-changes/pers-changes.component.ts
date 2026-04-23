import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { ChangesModel } from "src/Models/ChangesModel";
import { Task } from "src/Models/Task";
import { GameSettings } from "../GameSettings";
import { trigger, transition, query, stagger, style, animate } from "@angular/animations";

@Component({
  selector: "app-pers-changes",
  templateUrl: "./pers-changes.component.html",
  styleUrls: ["./pers-changes.component.css"],
  animations: [
    trigger("listAnim", [
      transition("* => *", [
        query(
          ":enter",
          [
            style({ opacity: 0, transform: "translateY(10px)" }),
            stagger(45, [animate("260ms cubic-bezier(.22,.61,.36,1)", style({ opacity: 1, transform: "translateY(0)" }))]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class PersChangesComponent implements OnInit {
  isShowAbProgrTable;
  abPoints: any;
  gold: any;
  goldTotal: any;
  changes: ChangesModel[] = [];
  counto: number[] = [];
  headText: string;
  isGood: boolean = true;
  slidingDoorValue: string = "out";
  img: any;
  tsk: Task;
  percSymbol;
  itemType: String;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public gameSettings: GameSettings, public dialogRef: MatDialogRef<PersChangesComponent>) {
    this.percSymbol = this.gameSettings.changesIsShowPercentageInAb ? "%" : "";
    this.isShowAbProgrTable = this.gameSettings.isShowAbProgrTable;
    this.img = data.img;
    this.headText = data.headText;
    this.changes = data.changes;
    this.changes.forEach((element) => {
      this.counto.push(element.valFrom);
    });
    this.isGood = data.isGood;
    this.abPoints = data.abPoints;
    this.gold = data.gold;
    this.goldTotal = data.goldTotal;
    if (data.isTES) {
      this.abPoints = null;
    }
    this.tsk = data.tsk;
    this.itemType = data.itemType;
  }

  ngOnInit() {}

  closeDialog() {
    this.dialogRef.close();
  }
}
