import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-level-up-msg',
  templateUrl: './level-up-msg.component.html',
  styleUrls: ['./level-up-msg.component.css']
})
export class LevelUpMsgComponent implements OnInit {
  abPoints: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { 
    if(data){
      this.abPoints = data.abPoints;
    }
  }

  ngOnInit() {
  }
}
