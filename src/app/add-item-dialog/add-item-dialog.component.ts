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
    type: new FormControl(),
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data, public dialogRef: MatDialogRef<AddItemDialogComponent>, public gameSettings: GameSettings) {}

  chooseImg(img) {
    this.dialogRef.close(img);
  }

  ngOnInit() {
    this.galleryForm.get("type").valueChanges.subscribe((q) => {
      switch (q) {
        case "gallery":
          let galeryImg = [];
          for (let i = 1; i <= this.gameSettings.skillImgNum; i++) {
            let ss = "000" + i;
            ss = ss.substr(ss.length - 3);
            galeryImg.push("assets/img/Gallery/" + ss + ".webp");
          }
          this.gallerryImages = galeryImg;
          this.isGallery = true;
          break;
        case "pers":
          let persImg = [];
          for (let i = 1; i <= this.gameSettings.persImgNum; i++) {
            let ss = "000" + i;
            ss = ss.substr(ss.length - 3);
            persImg.push("assets/img/Perses/" + ss + ".webp");
          }
          this.gallerryImages = persImg;
          this.isGallery = true;
          break;
        case "reward":
          let revImg = [];
          for (let i = 1; i <= 44; i++) {
            let ss = "000" + i;
            ss = ss.substr(ss.length - 3);
            revImg.push("assets/img/Revards/" + ss + ".webp");
          }
          this.gallerryImages = revImg;
          this.isGallery = true;
          break;
        case "url":
          this.gallerryImages = [];
          this.lblTxt = "url";
          this.isGallery = false;
          break;
      }
    });

    this.galleryForm.get("isGallery").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({ type: "gallery" });
      }
    });

    this.galleryForm.get("isPers").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({ type: "pers" });
      }
    });

    this.galleryForm.get("isRev").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({ type: "reward" });
      }
    });

    this.galleryForm.get("isUrl").valueChanges.subscribe((q) => {
      if (q) {
        this.galleryForm.patchValue({ type: "url" });
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
