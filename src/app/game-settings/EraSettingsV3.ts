import { getExpResult } from "src/Models/getExpResult";
import { EraSettings } from "./EraSettings";
import { Task } from "src/Models/Task";

/**
 * Настройки игры в стиле Ера Водолея.
 */
export class EraSettingsV3 extends EraSettings {
  maxAbilLvl = 10;
  minAbilLvl = 1;
  minChaLvl = 1;
  maxChaLvl = 10;
  maxPersLevel: number = 100;
  abPointsStart = 5;
  abPointsPerLvl = 5;
  isHardnessEnable = false;

  isOpenAbWhenActivate: boolean = false;
  isOpenAbWhenUp: boolean = false;
  isEditAbWhenActivate: boolean = false;

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

  getPersExpAndLevel(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number, classicalExpTotal: number, persExpVal: number): getExpResult {
    if (persExpVal == null) {
      persExpVal = classicalExpTotal;
    }

    let result = new getExpResult();

    result.exp = persExpVal;

    let persLevel = 0;
    let expLvl = 0;

    while (true) {
      result.startExp = expLvl;

      let cur = this.abPointsPerLvl * (persLevel + 1) * Math.pow(1.0333, persLevel);

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
}
