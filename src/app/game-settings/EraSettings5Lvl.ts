import { getExpResult } from "src/Models/getExpResult";
import { EraSettings } from "./EraSettings";

export class EraSettings5Lvl extends EraSettings {
  public abPointsPerLvl = 3;
  public maxPersLevel: number = 50;
  public maxAbilLvl = 5;
  public maxChaLvl = 5;
  public perkHardness: number = 3 / 5;

  public getMonsterLevel(prsLvl: number, maxLevel: number): number {
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
