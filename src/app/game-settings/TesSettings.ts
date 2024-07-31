import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";

/**
 * Настройки игры в стиле TES.
 */
export class TesSettings extends GameSettings {
  isClassicaRPG = false;
  maxAbilLvl = 10;
  maxChaLvl = 10;
  isAbPointsEnabled = true;
  abPointsStart = 5;
  abPointsForLvl = 5;
  abPointsPerLvl = 1;
  isOpenPersAtNewLevel = true;

  setTes() {}

  getTesChangeKoef(tesVal: number): number {
    let level = 1 + Math.floor(tesVal / 10.0);

    let skillMult = 1;
    let skillOffcet = 3 - skillMult;

    let result = level * skillMult + skillOffcet;
    result = Math.ceil(result);

    return 1 / result;
  }

  getPersExpAndLevel(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number, classicalExpTotal: number): getExpResult {
    let startExp = 0;
    let persLevel = 0;
    let exp = 0;
    let nextExp = 0;
    let expDirect = 0;
    let abMinCount = 20;

    abCount = abMinCount;

    let max = this.maxPersLevel * this.abPointsForLvl;
    let progress = totalAbLvl / max;
    exp = this.maxPersLevel * progress;

    expDirect = exp;
    persLevel = Math.floor(exp);
    startExp = persLevel;
    nextExp = persLevel + 1;

    let result: getExpResult = {
      exp: exp,
      expDirect: expDirect,
      nextExp: nextExp,
      startExp: startExp,
      persLevel: persLevel,
    };

    return result;
  }
}
