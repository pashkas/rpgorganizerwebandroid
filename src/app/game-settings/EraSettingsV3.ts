import { getExpResult } from "src/Models/getExpResult";
import { EraSettings } from "./EraSettings";
import { Task } from "src/Models/Task";

/**
 * Настройки игры в стиле Ера Водолея.
 */
export class EraSettingsV3 extends EraSettings {
  minAbilLvl = 1;
  maxAbilLvl = 5;
  minChaLvl = 1;
  maxChaLvl = 5;
  maxPersLevel: number = 50;
  abPointsStart = 0;
  abPointsPerLvl = 3;
  isHardnessEnable = false;

  isOpenPersAtNewLevel: boolean = false;

  isOpenAbWhenActivate: boolean = false;
  isOpenAbWhenUp: boolean = false;
  isEditAbWhenActivate: boolean = false;
  perkHardness: number = 3 / 5;

  checkPerkTskValue(tsk: Task) {
    if (tsk.isPerk && tsk.value > 0) {
      tsk.value = this.maxAbilLvl;
    }
  }

  abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    if (isPerk) {
      return this.maxAbilLvl * hardness;
    }

    return 1 * hardness;
  }

  abTotalCost(curLvl: number, hardness: number, isPerk: boolean) {
    if (isPerk && curLvl > 0) {
      curLvl = this.maxAbilLvl;
    }

    return curLvl * hardness;
  }

  abChangeExp(curLvl: number, hardness: number, isPerk: boolean): number {
    if (isPerk) {
      curLvl = this.maxAbilLvl;
    }

    return curLvl * hardness;
  }

  getPersExpAndLevel(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number, classicalExpTotal: number, persExpVal: number, abOpenned: number): getExpResult {
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
      // Math.pow(1.02288, persLevel)
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

  getPersRangName(persLvl): string {
    let rngIdx = this.getMonsterLevel(persLvl, this.maxPersLevel);

    return this.rangNames[rngIdx - 1];
  }
}
