import { Injectable } from "@angular/core";

import { GameSettings } from "../GameSettings";
import { Pers } from "src/Models/Pers";
import { Task } from "src/Models/Task";
import { getExpResult } from "src/Models/getExpResult";

/**
 * Настройки игры в стиле Ера Водолея.
 */
@Injectable()
export class EraSettings extends GameSettings {
  public abPointsPerLvl = 5;
  public abPointsStart = 0;
  public isAbPointsEnabled = true;
  public isClassicaRPG = true;
  public isHardnessEnable = false;
  public isHpEnabled: boolean = false;
  public isOpenPersAtNewLevel = true;
  public maxAbilLvl = 10;
  public maxChaLvl = 10;
  public maxPersLevel: number = 70;
  public minAbilLvl = 1;
  public minChaLvl = 1;
  public perkHardness: number = 0.5;
  public rangNames = ["обыватель", "авантюрист", "воин", "мастер", "герой", "легенда"];

  public abChangeExp(curLvl: number, hardness: number, isPerk: boolean): number {
    if (isPerk) {
      curLvl = this.maxAbilLvl;
    }

    return curLvl * hardness;
  }

  public abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    if (isPerk) {
      return this.maxAbilLvl * hardness;
    }

    return 1 * hardness;
  }

  public abTotalCost(curLvl: number, hardness: number, isPerk: boolean) {
    if (isPerk && curLvl > 0) {
      curLvl = this.maxAbilLvl;
    }

    return curLvl * hardness;
  }

  public calculateHp(prs: Pers, prevLvl: number, curLvl: number) {
    if (prs.hp == null) {
      prs.hp = 100;
    }
    if (prs.maxHp == null) {
      prs.maxHp = 100;
    }
    if (prs.hpProgr == null) {
      prs.hpProgr = 100;
    }

    if (!this.isHpEnabled) {
      prs.hp = 100;
      prs.maxHp = 100;
      prs.hpProgr = 100;

      return;
    }

    prs.maxHp = (this.abPointsStart + prs.level * this.abPointsPerLvl) / 3;

    if (curLvl > prevLvl) {
      prs.hp = prs.maxHp;
    }

    if (prs.hp > prs.maxHp) {
      prs.hp = prs.maxHp;
    }

    prs.hpProgr = (prs.hp / prs.maxHp) * 100;
  }

  public changeExpClassical(tsk: Task, isDone: boolean, koef: number, prs: Pers) {
    if (isDone) {
      prs.expVal += 1 * koef;
    } else {
      if (this.isHpEnabled) {
        prs.hp -= 1 * koef;
      } else {
        prs.expVal -= 1 * koef;
      }
    }
  }

  public checkPerkTskValue(tsk: Task) {
    if (tsk.isPerk && tsk.value > 0) {
      tsk.value = this.maxAbilLvl;
    }
  }

  public getMonsterLevel(prsLvl: number, maxLevel: number): number {
    if (prsLvl < 10) {
      return 1;
    }
    if (prsLvl < 20) {
      return 2;
    }
    if (prsLvl < 30) {
      return 3;
    }
    if (prsLvl < 40) {
      return 4;
    }
    if (prsLvl < 70) {
      return 5;
    }

    return 6;
  }

  public getPersExpAndLevel(
    totalAbVal: number,
    abCount: number,
    expPoints: number,
    totalAbValMax: number,
    totalAbLvl: number,
    classicalExpTotal: number,
    persExpVal: number,
    abOpenned: number
  ): getExpResult {
    if (persExpVal == null) {
      persExpVal = classicalExpTotal;
    }

    let result = new getExpResult();

    result.exp = persExpVal;

    let persLevel = 1;
    let expLvl = 0;

    while (true) {
      result.startExp = expLvl;

      let e = 1 + (persLevel - 1) * 0.1;
      let cur = this.abPointsPerLvl * persLevel * e;
      expLvl += cur;

      result.nextExp = expLvl;

      if (expLvl > result.exp) {
        result.persLevel = persLevel;

        break;
      }

      persLevel++;
    }

    return result;
  }

  public getPersRangName(persLvl): string {
    let rngIdx = this.getMonsterLevel(persLvl, this.maxPersLevel);

    return this.rangNames[rngIdx - 1];
  }

  public setTes() {}
}
