import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-add-item-dialog',
  templateUrl: './add-item-dialog.component.html',
  styleUrls: ['./add-item-dialog.component.css']
})
export class AddItemDialogComponent implements OnInit {
  breakpoint: number;
  gallerryImages = [];
  isGallery = false;
  lblTxt = 'Название';
  times = [1, 2, 3, 4, 5];

  constructor(@Inject(MAT_DIALOG_DATA) public data, public dialogRef: MatDialogRef<AddItemDialogComponent>) {
  }

  chooseImg(img) {
    this.dialogRef.close(img);
  }

  gallery() {
    this.isGallery = !this.isGallery;
  }

  ngOnInit() {
    if (this.data && this.data.isGallery) {
      this.isGallery = true;
      this.lblTxt = 'url';
    }

    if (this.data.isPers) {
      for (let i = 1; i <= 50; i++) {
        let ss = '000' + i;
        ss = ss.substr(ss.length - 3);
        this.gallerryImages.push('assets/img/Perses/' + ss + '.webp');
      }
    } else if (this.data.isRev) {
      // this.isGallery = false;
      for (let i = 1; i <= 44; i++) {
        let ss = '000' + i;
        ss = ss.substr(ss.length - 3);
        this.gallerryImages.push('assets/img/Revards/' + ss + '.webp');
      }
    } else {
      if (this.data.isQwest) {
        // this.isGallery = false;
      }
      for (let i = 1; i <= 126; i++) {
        let ss = '000' + i;
        ss = ss.substr(ss.length - 3);
        this.gallerryImages.push('assets/img/Gallery/' + ss + '.webp');
      }
    }
  }

  ok() {
    this.dialogRef.close(this.data.text);
  }
}
