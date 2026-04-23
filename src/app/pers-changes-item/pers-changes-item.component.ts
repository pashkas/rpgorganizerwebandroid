import { Component, OnInit, Input, ViewChild, ElementRef, HostBinding } from "@angular/core";
import { ChangesModel } from "src/Models/ChangesModel";
import { AnimationBuilder, style, animate } from "@angular/animations";
import { GameSettings } from "../GameSettings";

/** Кривая — «мягкое приземление» */
const EASE = " cubic-bezier(.22,.61,.36,1)";

@Component({
  selector: "app-pers-changes-item",
  templateUrl: "./pers-changes-item.component.html",
  styleUrls: ["./pers-changes-item.component.css"],
})
export class PersChangesItemComponent implements OnInit {
  @Input() item: ChangesModel;
  plusName: string = "";

  @ViewChild("progress") progress: ElementRef;

  /** Подсветка строки на level-up (золотой пульс) */
  flashActive = false;
  /** Всплывающий текст «+1 ур.» над баром */
  floatText = "";
  /** Частицы-спарки на level-up */
  sparks: number[] = [];
  /** Минусовое изменение — красная тонировка */
  @HostBinding("class.sign-minus") get isMinus(): boolean {
    return !!this.item && typeof this.item.valChange === "string" && this.item.valChange.indexOf("-") === 0;
  }

  constructor(public builder: AnimationBuilder, public gameSettings: GameSettings) {}

  ngOnInit() {}

  /** Класс градиентной заливки под тип: характеристика — зелёный, навык/опыт — жёлтый (как в mainWindow), остальное (hp и т.п.) — инлайн-цвет */
  get fillClass(): string {
    if (this.item.type == "cha") return "charactProgrFill";
    if (this.item.type == "abil" || this.item.type == "exp") return "skillProgrFill";

    return "";
  }

  ngAfterViewInit(): void {
    this.setpercentage();
  }

  /** Протикать целое число от from до to за ms, пишем в плашку уровня */
  private tickLevel(from: number, to: number, ms: number) {
    const start = performance.now();
    const delta = to - from;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.floor(from + delta * eased);
      this.plusName = ": " + cur;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** Вспышка level-up: золотой пульс + всплывашка + искры */
  private triggerLevelUp() {
    this.flashActive = true;
    this.floatText = "+1 ур.";
    this.sparks = [0, 1, 2, 3, 4, 5, 6, 7];
    setTimeout(() => {
      this.flashActive = false;
      this.floatText = "";
      this.sparks = [];
    }, 900);
  }

  setpercentage() {
    if (this.item.valFrom == this.item.valTo) {
      return;
    }

    this.plusName = "";
    if (this.item.valChange == null) {
      this.item.valChange = "";
    }
    if (this.item.name == null) {
      this.item.name = "";
    }

    if (this.item.type == "exp" && this.item.expChanges.length > 1) {
      let firstPerc = this.item.expChanges[0].valTo - this.item.expChanges[0].valFrom;
      if (firstPerc < 0.01) {
        firstPerc = 0.01;
      }

      let secondPerc = this.item.expChanges[1].valTo - this.item.expChanges[1].valFrom;
      if (secondPerc < 0.01) {
        secondPerc = 0.01;
      }

      let total = firstPerc + secondPerc;

      let firstTime = (firstPerc / total) * this.gameSettings.animationDelay;
      let secondTime = (secondPerc / total) * this.gameSettings.animationDelay;

      //1
      let factory1 = this.builder.build([style({ width: this.item.expChanges[0].valFrom + "%" }), animate(firstTime + "ms" + EASE, style({ width: this.item.expChanges[0].valTo + "%" }))]);
      let player1 = factory1.create(this.progress.nativeElement, {});
      this.plusName = ": " + Math.floor(this.item.expChanges[0].lvl);
      player1.play();
      setTimeout(() => {
        this.triggerLevelUp();
        this.plusName = ": " + Math.floor(this.item.expChanges[1].lvl);
        //2
        let factory2 = this.builder.build([style({ width: this.item.expChanges[1].valFrom + "%" }), animate(secondTime + "ms" + EASE, style({ width: this.item.expChanges[1].valTo + "%" }))]);
        let player2 = factory2.create(this.progress.nativeElement, {});
        player2.play();
      }, firstTime);
    } else if ((this.item.type == "abil" || this.item.type == "cha") && this.item.abilChanges.length > 1) {
      let firstPerc = this.item.abilChanges[0].valTo - this.item.abilChanges[0].valFrom;
      if (firstPerc < 0.01) {
        firstPerc = 0.01;
      }

      let secondPerc = this.item.abilChanges[1].valTo - this.item.abilChanges[1].valFrom;
      if (secondPerc < 0.01) {
        secondPerc = 0.01;
      }

      let total = firstPerc + secondPerc;

      let firstTime = (firstPerc / total) * this.gameSettings.animationDelay;
      let secondTime = (secondPerc / total) * this.gameSettings.animationDelay;

      //1
      let factory1 = this.builder.build([style({ width: this.item.abilChanges[0].valFrom + "%" }), animate(firstTime + "ms" + EASE, style({ width: this.item.abilChanges[0].valTo + "%" }))]);
      let player1 = factory1.create(this.progress.nativeElement, {});
      player1.play();
      this.plusName = ": " + Math.floor(this.item.abilChanges[0].lvl);
      setTimeout(() => {
        this.triggerLevelUp();
        this.plusName = ": " + Math.floor(this.item.abilChanges[1].lvl);
        //2
        let factory2 = this.builder.build([style({ width: this.item.abilChanges[1].valFrom + "%" }), animate(secondTime + "ms" + EASE, style({ width: this.item.abilChanges[1].valTo + "%" }))]);
        let player2 = factory2.create(this.progress.nativeElement, {});
        player2.play();
      }, firstTime);
    } else {
      let factory = this.builder.build([style({ width: this.item.valFrom + "%" }), animate(this.gameSettings.animationDelay + "ms" + EASE, style({ width: this.item.valTo + "%" }))]);

      let player = factory.create(this.progress.nativeElement, {});
      if (this.item.lvl != null) {
        // счётчик уровня тикает вместе с заливкой
        const toLvl = Math.floor(this.item.lvl);
        this.plusName = ": " + toLvl;
        this.tickLevel(Math.max(0, toLvl - 1), toLvl, this.gameSettings.animationDelay);
      }

      player.play();
    }

    if (this.item.type == "abil" && this.gameSettings.changesIsShowPercentageInAb) {
      this.plusName += "%";
    }

    if (this.item.type == "abil" && !this.gameSettings.changesIsShowValueInAb) {
      this.plusName = "";
    }

    if (this.item.type == "cha" && !this.gameSettings.changesIsShowValueInCha) {
      this.plusName = "";
    }
  }
}
