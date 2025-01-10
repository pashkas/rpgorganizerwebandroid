import { getExpResult } from "src/Models/getExpResult";
import { EraSettings } from "./EraSettings";
import { Task } from "src/Models/Task";

/**
 * Настройки игры в стиле Ера Водолея.
 */
export class EraSettingsV4 extends EraSettings {
  minAbilLvl = 1;
  maxAbilLvl = 5;
  minChaLvl = 1;
  maxChaLvl = 5;
  maxPersLevel: number = 100;
  abPointsStart = 0;
  abPointsPerLvl = 5;
  isHardnessEnable = false;
  isHpEnabled = false;

  isOpenPersAtNewLevel: boolean = false;

  isOpenAbWhenActivate: boolean = false;
  isOpenAbWhenUp: boolean = false;
  isEditAbWhenActivate: boolean = false;
  perkHardness: number = 5 / 15;

  checkPerkTskValue(tsk: Task) {
    if (tsk.isPerk && tsk.value > 0) {
      tsk.value = this.maxAbilLvl;
    }
  }

  abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    if (isPerk) {
      return 5;
    }

    if (curLvl == 0) {
      return 5;
    }

    return curLvl;
  }

  abTotalCost(curLvl: number, hardness: number, isPerk: boolean) {
    if (curLvl < 1) {
      return 0;
    }

    if (isPerk) {
      return 5;
    }

    return 5 + ((curLvl - 1) * curLvl) / 2;
  }

  abChangeExp(curLvl: number, hardness: number, isPerk: boolean): number {
    return this.abTotalCost(curLvl, hardness, isPerk);
  }

  getPersExpAndLevel(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number, classicalExpTotal: number, persExpVal: number): getExpResult {
    if (persExpVal == null) {
      persExpVal = classicalExpTotal;
    }

    let result = new getExpResult();

    result.exp = persExpVal;

    let persLevel = 1;
    let expLvl = 0;

    while (true) {
      result.startExp = expLvl;

      let e = 1 + (persLevel - 1) * 0.033333;
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
    if (prsLvl < 20) {
      return 1;
    }
    if (prsLvl < 40) {
      return 2;
    }
    if (prsLvl < 60) {
      return 3;
    }
    if (prsLvl < 80) {
      return 4;
    }
    if (prsLvl < 100) {
      return 5;
    }

    return 6;
  }

  getPersRangName(persLvl): string {
    let rngIdx = this.getMonsterLevel(persLvl, this.maxPersLevel);

    return this.rangNames[rngIdx - 1];
  }
}
