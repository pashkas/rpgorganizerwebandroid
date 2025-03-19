import { getExpResult } from "src/Models/getExpResult";
import { EraSettings } from "./EraSettings";

export class EraSettingsV2 extends EraSettings {
  maxPersLevel: number = 100;
  abPointsStart = 5;
  abPointsPerLvl = 5;

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

  abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    return (curLvl + 1) * hardness;
  }

  abTotalCost(curLvl: number, hardness: number, isPerk: boolean) {
    const v = (curLvl * (curLvl + 1)) / 2;

    return v * hardness;
  }

  abChangeExp(curLvl: number, hardness: number, isPerk: boolean): number {
    return this.abTotalCost(curLvl, hardness,  isPerk);
  }

  getPersExpAndLevel(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number, classicalExpTotal: number, persExpVal: number, abOpenned: number): getExpResult {
    if (persExpVal == null) {
      persExpVal = classicalExpTotal;
    }

    let result = new getExpResult();

    result.exp = persExpVal;

    let persLevel = 0;
    let expLvl = 0;

    while (true) {
      result.startExp = expLvl;

      let l = persLevel + 1;
      let v = 5;
      let expa = 0.25;
      let line = v - expa;
      let cur = l * line + Math.pow(l, 2) * expa;

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
