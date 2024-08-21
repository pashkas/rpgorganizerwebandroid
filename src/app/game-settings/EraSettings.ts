import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";

/**
 * Настройки игры в стиле Ера Водолея.
 */
export class EraSettings extends GameSettings {
  isClassicaRPG = true;
  minAbilLvl = 0;
  maxAbilLvl = 5;
  maxChaLvl = 5;
  isAbPointsEnabled = true;
  abPointsStart = 3;
  abPointsPerLvl = 3;
  isOpenPersAtNewLevel = true;
  maxPersLevel: number = 50;

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

  abCost(curLvl: number, hardness: number): number {
    return 1;

    // if (curLvl == 0) {
    //   return this.maxAbilLvl * hardness;
    // }

    // return curLvl * hardness;
  }

  abTotalCost(curLvl: number, hardness: number) {
    return curLvl;

    // if (curLvl == 0) {
    //   return 0;
    // }

    // let v = curLvl - 1;

    // return (this.maxAbilLvl + (v * (v + 1)) / 2) * hardness;
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

      // let cur = 5 + persLevel * 2 + Math.pow(persLevel, 2) * 0.333;
      let l = persLevel + 1;
      let v = 3;
      let expa = 0.1618;
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
