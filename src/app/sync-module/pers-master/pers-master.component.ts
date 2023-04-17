import { Component, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { GameSettings } from "src/app/GameSettings";
import { PersService } from "src/app/pers.service";
import { Rangse } from "src/Models/Rangse";

@Component({
  templateUrl: "./pers-master.component.html",
  styleUrls: ["./pers-master.component.css"],
})
export class PersMasterComponent implements OnInit {
  rangse: Rangse[];
  constructor(private fb: FormBuilder, private srv: PersService, private router: Router) {}

  persForm: FormGroup;

  ngOnInit() {
    this.rangse = [];
    for (let index = GameSettings.minChaLvl - 1; index <= GameSettings.maxChaLvl - 1; index++) {
      let rng = new Rangse();
      rng.val = index;
      rng.img = "";
      rng.name = "" + index;
      this.rangse.push(rng);
    }

    this.initForm();
  }

  initForm() {
    this.persForm = this.fb.group({
      persName: ["Хиро"],
      img: ["assets/icons/link.webp"],
      characts: this.fb.array([]),
    });

    this.addCharact();
  }

  addCharact() {
    let charactsFG = this.persForm.get("characts") as FormArray;
    charactsFG.push(
      this.fb.group({
        chaName: ["Характеристика"],
        img: ["assets/icons/defCha.webp"],
        val: [0],
        abils: this.fb.array([]),
      })
    );

    this.addAbil(charactsFG.length - 1);
  }

  addAbil(chInd: number) {
    let charactsFG = this.getCharactControls();
    let ch = charactsFG.at(chInd);
    let abs = ch.get("abils") as FormArray;
    abs.push(
      this.fb.group({
        abName: ["Навык"],
      })
    );
  }

  deleteCha(i: number) {
    let charactsFG = this.getCharactControls();
    charactsFG.removeAt(i);
  }

  deleteAbil(chaIdx: number, abIdx: number) {
    let charactsFG = this.getCharactControls();
    let ch = charactsFG.at(chaIdx);

    const abs = ch.get("abils") as FormArray;
    abs.removeAt(abIdx);
  }

  getCharactControls() {
    return (this.persForm.get("characts") as FormArray);
  }

  finish() {
    let prs = this.srv.pers$.value;
    let form = this.persForm.value;

    prs.name = form.persName;
    prs.image = form.img;

    for (const ch of form.characts) {
      let cha = this.srv.addCharact(ch.chaName);
      cha.image = ch.img;
      cha.startRang.val = ch.val;

      for (const ab of ch.abils) {
        let abil = this.srv.addAbil(cha.id, ab.abName);
      }
    }

    this.srv.savePers(false);

    this.router.navigate(["/main"]);
  }
}
