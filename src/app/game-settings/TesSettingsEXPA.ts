import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";
import { TesSettings } from "./TesSettings";

/**
 * Настройки в стиле TES, но навыки замедляют рост в геометрической прогрессии.
 */
export class TessSettingsEXPA extends TesSettings {
  abPointsStart = 3;

  getTesChangeKoef(tesVal: number, persLvl: number): number {
    let TRANSITIONS = 8.0;
    let FIRST = 2.0;
    let LAST = 14.0;

    let multi = Math.pow(LAST / FIRST, 1.0 / TRANSITIONS);

    let level = 1 + Math.floor(tesVal / 10.0);
    let divider = FIRST * Math.pow(multi, level - 1);
    divider = Math.ceil(divider);
    if (divider > LAST) {
      divider = LAST;
    }

    return 1 / divider;
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

    if (totalAbLvl > 7) {
      totalAbLvl = totalAbLvl - 7;
      exp = 3 + totalAbLvl * (1 / 5);
    } else if (totalAbLvl > 3) {
      totalAbLvl = totalAbLvl - 3;
      exp = 2 + totalAbLvl * (1 / 4);
    } else {
      exp = 1 + totalAbLvl * (1 / 3);
    }

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
