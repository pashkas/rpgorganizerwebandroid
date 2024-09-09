import { Component, OnInit, Inject, ViewChild, ElementRef } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { GameSettings } from "../GameSettings";
import { FormControl, FormGroup } from "@angular/forms";

@Component({
  selector: "app-add-item-dialog",
  templateUrl: "./add-item-dialog.component.html",
  styleUrls: ["./add-item-dialog.component.css"],
})
export class AddItemDialogComponent implements OnInit {
  breakpoint: number;
  gallerryImages = [];
  isGallery = false;
  lblTxt = "Название";
  times = [1, 2, 3, 4, 5];

  galleryForm = new FormGroup({
    isGallery: new FormControl(true),
    isSkills: new FormControl(true),
    isPers: new FormControl(true),
    isRev: new FormControl(false),
    isUrl: new FormControl(false),
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data, public dialogRef: MatDialogRef<AddItemDialogComponent>, public gameSettings: GameSettings) {}

  chooseImg(img) {
    this.dialogRef.close(img);
  }

  ngOnInit() {
    this.galleryForm.get("isGallery").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({
          isRev: false,
          isPers: false,
          isUrl: false,
        });

        let img = [];
        for (let i = 1; i <= this.gameSettings.skiilImgNum; i++) {
          let ss = "000" + i;
          ss = ss.substr(ss.length - 3);
          img.push("assets/img/Gallery/" + ss + ".webp");
        }
        this.gallerryImages = img;

        this.isGallery = true;
      }
    });

    this.galleryForm.get("isPers").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({
          isRev: false,
          isQwest: false,
          isUrl: false,
        });

        let img = [];
        for (let i = 1; i <= this.gameSettings.persImgNum; i++) {
          let ss = "000" + i;
          ss = ss.substr(ss.length - 3);
          img.push("assets/img/Perses/" + ss + ".webp");
        }
        this.gallerryImages = img;
        this.isGallery = true;
      }
    });

    this.galleryForm.get("isRev").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({
          isPers: false,
          isQwest: false,
          isUrl: false,
        });

        let img = [];
        for (let i = 1; i <= 44; i++) {
          let ss = "000" + i;
          ss = ss.substr(ss.length - 3);
          img.push("assets/img/Revards/" + ss + ".webp");
        }
        this.gallerryImages = img;
        this.isGallery = true;
      }
    });

    this.galleryForm.get("isUrl").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({
          isPers: false,
          isQwest: false,
          isRev: false,
        });

        this.gallerryImages = [];
        this.lblTxt = "url";
        this.isGallery = false;
      }
    });

    this.initForm();
  }

  private initForm() {
    this.galleryForm.patchValue({
      isGallery: this.data.isGallery,
      isPers: this.data.isPers,
      isRev: this.data.isRev,
      isUrl: false,
    });
  }

  ok() {
    this.dialogRef.close(this.data.text);
  }
}
