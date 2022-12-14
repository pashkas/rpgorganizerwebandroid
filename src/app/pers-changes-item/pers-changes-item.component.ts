import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { ChangesModel } from 'src/Models/ChangesModel';
import { AnimationBuilder, style, animate } from '@angular/animations';

@Component({
  selector: 'app-pers-changes-item',
  templateUrl: './pers-changes-item.component.html',
  styleUrls: ['./pers-changes-item.component.css']
})
export class PersChangesItemComponent implements OnInit {

  @Input() item: ChangesModel;
  plusName: string = '';

  @ViewChild('progress', { static: false }) progress: ElementRef;

  constructor(public builder: AnimationBuilder) { }

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    this.setpercentage();
  }

  setpercentage() {
    if (this.item.valFrom == this.item.valTo) {
      return;
    }

    this.plusName = '';
    if(this.item.valChange == null){
      this.item.valChange = '';
    }
    if(this.item.name == null){
      this.item.name = '';
    }

    if (this.item.type == 'exp' && this.item.expChanges.length > 1) {
      let firstPerc = this.item.expChanges[0].valTo - this.item.expChanges[0].valFrom;
      let secondPerc = this.item.expChanges[1].valTo - this.item.expChanges[1].valFrom;

      let total = firstPerc + secondPerc;

      let firstTime = (firstPerc / total) * 2000;
      let secondTime = (secondPerc / total) * 2000;


      //1
      let factory1 = this.builder.build([
        style({ width: this.item.expChanges[0].valFrom + '%' }),
        animate(firstTime + 'ms', style({ width: this.item.expChanges[0].valTo + '%' }))
      ]);
      let player1 = factory1.create(this.progress.nativeElement, {})
      this.plusName = ': ' + Math.floor(this.item.expChanges[0].lvl);
      player1.play();
      setTimeout(() => {
        this.plusName = ': ' + Math.floor(this.item.expChanges[1].lvl);
        //2
        let factory2 = this.builder.build([
          style({ width: this.item.expChanges[1].valFrom + '%' }),
          animate(secondTime + 'ms', style({ width: this.item.expChanges[1].valTo + '%' }))
        ]);
        let player2 = factory2.create(this.progress.nativeElement, {})
        player2.play();
      }, firstTime);
    }
    else if ( false && (this.item.type == 'abil' || this.item.type == 'cha') && this.item.abilChanges.length > 1) {
      let firstPerc = this.item.abilChanges[0].valTo - this.item.abilChanges[0].valFrom;
      let secondPerc = this.item.abilChanges[1].valTo - this.item.abilChanges[1].valFrom;

      let total = firstPerc + secondPerc;

      let firstTime = (firstPerc / total) * 2000;
      let secondTime = (secondPerc / total) * 2000;

      //1
      let factory1 = this.builder.build([
        style({ width: this.item.abilChanges[0].valFrom + '%' }),
        animate(firstTime + 'ms', style({ width: this.item.abilChanges[0].valTo + '%' }))
      ]);
      let player1 = factory1.create(this.progress.nativeElement, {})
      player1.play();
      this.plusName = ': ' + Math.floor(this.item.abilChanges[0].lvl);
      setTimeout(() => {
        this.plusName = ': ' + Math.floor(this.item.abilChanges[1].lvl);
        //2
        let factory2 = this.builder.build([
          style({ width: this.item.abilChanges[1].valFrom + '%' }),
          animate(secondTime + 'ms', style({ width: this.item.abilChanges[1].valTo + '%' }))
        ]);
        let player2 = factory2.create(this.progress.nativeElement, {})
        player2.play();
      }, firstTime);
    }
    else {
      let factory = this.builder.build([
        style({ width: this.item.valFrom + '%' }),
        animate('2000ms', style({ width: this.item.valTo + '%' }))
      ]);

      let player = factory.create(this.progress.nativeElement, {});
      if (this.item.lvl != null) {
        this.plusName = ': ' + Math.floor(this.item.lvl);
      }

      player.play();
    }
  }

}
