import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";

/**
 * Настройки игры в стиле TES.
 */
export class TesSettings extends GameSettings {
  isHardnessEnable: boolean = false;
  isClassicaRPG = false;
  perkHardness: number = 1;

  isAbPointsEnabled = true;
  abPointsStart = 3;
  abPointsPerLvl = 1;

  maxAbilLvl = 10;
  maxChaLvl = 10;
  isOpenPersAtNewLevel = true;

  changesPopupDuration = 3000;
  changesPopupDurationAbil = 4000;
  changesPopupDurationCha = 4000;
  changesPopupDurationQwest = 4000;
  changesIsShowAbValues = true;
  changesIsShowAbLevels = false;
  isShowAbLvlPopup = true;
  changesIsChowChaLevels = false;
  changesIsChowChaValues = true;
  isShowChaLvlPopup = true;
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
    let startExp = 0;
    let persLevel = 0;
    let exp = 0;
    let nextExp = 0;
    let expDirect = 0;

    // 1 уровень за 3 очка
    let progress = totalAbLvl / 300;
    exp = 1 + this.maxPersLevel * progress;

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
