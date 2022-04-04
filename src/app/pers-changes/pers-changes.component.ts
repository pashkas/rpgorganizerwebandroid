import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { ChangesModel } from 'src/Models/ChangesModel';

@Component({
  selector: 'app-pers-changes',
  templateUrl: './pers-changes.component.html',
  styleUrls: ['./pers-changes.component.css']
})
export class PersChangesComponent implements OnInit {
  abPoints: any;
  changes: ChangesModel[] = [];
  counto: number[] = [];
  headText: string;
  isGood: boolean = true;
  slidingDoorValue: string = 'out';
  img: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.img = data.img;
    this.headText = data.headText;
    this.changes = data.changes;
    this.changes.forEach(element => {
      this.counto.push(element.valFrom);
    });
    this.isGood = data.isGood;
    this.abPoints = data.abPoints;
    if (data.isTES) {
      this.abPoints = null;
    }
  }

  ngOnInit() {
  }
}
