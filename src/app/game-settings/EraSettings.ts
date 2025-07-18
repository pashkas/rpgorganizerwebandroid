import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";
import { Pers } from "src/Models/Pers";
import { Task } from "src/Models/Task";

/**
 * Настройки игры в стиле Ера Водолея.
 */
export class EraSettings extends GameSettings {
  isClassicaRPG = true;
  minAbilLvl = 1;
  maxAbilLvl = 10;
  minChaLvl = 1;
  maxChaLvl = 10;
  isAbPointsEnabled = true;
  abPointsStart = 0;
  abPointsPerLvl = 5;
  isOpenPersAtNewLevel = true;
  maxPersLevel: number = 50;
  isHpEnabled: boolean = false;
  isHardnessEnable = false;
  perkHardness: number = 1;

  rangNames = ["обыватель", "авантюрист", "воин", "мастер", "герой", "легенда"];

  getMonsterLevel(prsLvl: number, maxLevel: number): number {
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
    if (prsLvl < 50) {
      return 5;
    }

    return 6;
  }

  setTes() {}

  abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    return 1 * hardness;
  }

  abTotalCost(curLvl: number, hardness: number, isPerk: boolean) {
    return curLvl * hardness;
  }

  abChangeExp(curLvl: number, hardness: number, isPerk: boolean): number {
    return curLvl * hardness;
  }

  checkPerkTskValue(tsk: Task) {
  }

  getPersExpAndLevel(
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

  calculateHp(prs: Pers, prevLvl: number, curLvl: number) {
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

  changeExpClassical(tsk: Task, isDone: boolean, koef: number, prs: Pers) {
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
}
