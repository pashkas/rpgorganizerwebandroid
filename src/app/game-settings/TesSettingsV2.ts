import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";

/**
 * Настройки игры в стиле TES.
 */
export class TesSettingsV2 extends GameSettings {
  isHardnessEnable: boolean = false;
  isClassicaRPG = false;
  perkHardness: number = 1;

  isAbPointsEnabled = true;
  abPointsStart = 5;
  abPointsPerLvl = 1;

  maxAbilLvl = 10;
  maxChaLvl = 10;
  isOpenPersAtNewLevel = true;

  changesPopupDuration = 2500;
  changesPopupDurationAbil = 4000;
  changesPopupDurationCha = 4000;
  changesPopupDurationQwest = 4000;
  changesIsShowAbValues = false;
  changesIsShowAbLevels = true;
  isShowAbLvlPopup = true;
  changesIsChowChaValues = false;
  changesIsChowChaLevels = true;
  isShowChaLvlPopup = true;
  changesIsShowExp = true;
  sort = ["exp", "abil", "abLvl", "cha", "chaLvl", "qwest", "hp"];

  setTes() {}

  getTesChangeKoef(tesVal: number): number {
    let level = 1 + Math.floor(tesVal / 10.0);

    let skillMult = 2;
    let skillOffcet = 3 - skillMult;
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

    // 1 уровень за START очков (например 5)
    let progress = totalAbVal / (this.abPointsStart * 1000);
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
}
