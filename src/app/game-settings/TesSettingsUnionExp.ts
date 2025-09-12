import { getExpResult } from "src/Models/getExpResult";
import { GameSettings } from "../GameSettings";
import { TesSettings } from "./TesSettings";

/**
 * Настройки в стиле TES, но навыки замедляют рост с уровнем перса.
 */
export class TessSettingsUnionExp extends TesSettings {
  abPointsStart = 3;

  getTesChangeKoef(tesVal: number, persLvl: number): number {
    let lvl = persLvl - 1;
    if (lvl < 0) {
      lvl = 0;
    }

    let v = this.abPointsStart + lvl * 0.5;
    let divider = v / this.abPointsStart;
    if (divider > 10) {
      divider = 10;
    }

    return 1 / divider;
  }

  getMonsterLevel(prsLvl: number, maxLevel: number): number {
    if (prsLvl < 10) {
      return 1;
    }
    if (prsLvl < 20) {
      return 2;
    }
    if (prsLvl < 40) {
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
}
