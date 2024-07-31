import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";

/**
 * Настройки игры в стиле Ера Водолея.
 */
export class EraSettings extends GameSettings {
  isClassicaRPG = true;
  maxAbilLvl = 5;
  maxChaLvl = 5;
  isAbPointsEnabled = true;
  abPointsStart = 25;
  abPointsPerLvl = 5;
  isOpenPersAtNewLevel = true;

  rangNames = ["обыватель", "авантюрист", "корсар", "воин", "герой", "легенда"];

  setTes() {}

  abCost(curLvl: number, hardness: number): number {
    if (curLvl == 0) {
      return this.maxAbilLvl * hardness;
    }

    return curLvl * hardness;
  }

  abTotalCost(curLvl: number, hardness: number) {
    if (curLvl == 0) {
      return 0;
    }

    let v = curLvl - 1;

    return (this.maxAbilLvl + (v * (v + 1)) / 2) * hardness;
  }

  abChangeExp(curLvl: number, hardness: number): number {
    return curLvl * hardness;
  }

  getPersExpAndLevel(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number, classicalExpTotal: number): getExpResult {
    let result = new getExpResult();

    result.exp = classicalExpTotal;

    let persLevel = 0;
    let expLvl = 0;

    while (true) {
      result.startExp = expLvl;

      let cur = 10 + persLevel * 5;
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
