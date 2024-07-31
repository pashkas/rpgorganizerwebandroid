import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";
import { ChangesModel } from "src/Models/ChangesModel";
import { Task } from "src/Models/Task";
import { GameSettings } from "../GameSettings";

@Component({
  selector: "app-pers-changes",
  templateUrl: "./pers-changes.component.html",
  styleUrls: ["./pers-changes.component.css"],
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

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public gameSettings: GameSettings) {
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
}
