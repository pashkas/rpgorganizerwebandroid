import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";

/**
 * Настройки игры в стиле TES.
 */
export class TesSettings extends GameSettings {
  isClassicaRPG = false;
  isAbPointsEnabled = false;
  maxAbilLvl = 10;
  maxChaLvl = 10;
  isOpenPersAtNewLevel = true;

  changesPopupDuration = 3000;
  changesPopupDurationAbil = 6000;
  changesPopupDurationCha = 6000;
  changesPopupDurationQwest = 3000;
  changesIsShowAbLevels = true;
  changesIsShowAbValues = false;
  isShowAbLvlPopup = false;
  changesIsChowChaLevels = true;
  changesIsChowChaValues = false;
  isShowChaLvlPopup = false;
  changesIsShowExp = true;

  setTes() {}

  getTesChangeKoef(tesVal: number): number {
    let level = 1 + Math.floor(tesVal / 10.0);

    let skillMult = 2;
    let skillOffcet = 2 - skillMult;

    let result = level * skillMult + skillOffcet;
    result = Math.ceil(result);

    return 1 / result;
  }

  getPersExpAndLevel(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number, classicalExpTotal: number, persExpVal: number): getExpResult {
    let startExp = 0;
    let persLevel = 0;
    let exp = 0;
    let nextExp = 0;
    let expDirect = 0;
    let minAbCount = 20;
    let minAbValMax = minAbCount * this.maxAbilLvl;

    if (abCount < minAbCount) {
      abCount = minAbCount;
    }
    if (totalAbValMax < minAbValMax) {
      totalAbValMax = minAbValMax;
    }

    let progress = totalAbVal / totalAbValMax;
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
