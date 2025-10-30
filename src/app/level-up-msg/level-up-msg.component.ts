import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { Task } from "src/Models/Task";
import { GameSettings } from "../GameSettings";

@Component({
  selector: "app-level-up-msg",
  templateUrl: "./level-up-msg.component.html",
  styleUrls: ["./level-up-msg.component.css"],
})
export class LevelUpMsgComponent implements OnInit {
  percSymbol = "";
  isShowAbProgrTable;
  abPoints: any = null;
  img: any = "assets/img/levelUp.png";
  txt: string = "НОВЫЙ УРОВЕНЬ!!!";
  lvl: number;
  tsk: Task;
  curLvlDescr: String = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public gameSettings: GameSettings, public dialogRef: MatDialogRef<LevelUpMsgComponent>) {
    this.isShowAbProgrTable = this.gameSettings.isShowAbProgrTable;
    if (data) {
      this.abPoints = data.abPoints;
      this.img = data.img;
      this.txt = data.txt;
      this.lvl = data.lvl;
      this.tsk = data.tsk;
      if (this.tsk != null) {
        this.curLvlDescr = this.tsk.curLvlDescr;
      }
    }
  }

  ngOnInit() {}

  closeDialog() {
    this.dialogRef.close();
  }
}
