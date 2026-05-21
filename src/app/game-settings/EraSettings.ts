import { Injectable } from "@angular/core";

import { GameSettings } from "../GameSettings";
import { Pers } from "src/Models/Pers";
import { Task } from "src/Models/Task";
import { getExpResult } from "src/Models/getExpResult";

/**
 * Настройки игры в стиле Ера Водолея.
 */
@Injectable()
export class EraSettings extends GameSettings {
  isMayUpNotSame: boolean = true;
  public abPointsPerLvl = 5;
  public abPointsStart = 0;
  public isAbPointsEnabled = true;
  public isClassicaRPG = true;
  public isHardnessEnable = false;
  public isHpEnabled: boolean = false;
  public isOpenPersAtNewLevel = true;
  public maxAbilLvl = 10;
  public maxChaLvl = 10;
  public maxPersLevel: number = 50;
  public minAbilLvl = 1;
  public minChaLvl = 1;
  public perkHardness: number = 1;
  public perkPointAbLevelCost = 2;
  public perkPointLvlInterval = 4;
  rangNames = ["обыватель", "авантюрист", "воин", "мастер", "герой", "легенда"];
  isPerkPointsEnable: boolean = true;

  public abChangeExp(curLvl: number, hardness: number, isPerk: boolean, _perkHardnes?: number): number {
    if (isPerk) {
      return curLvl;
    }

    return curLvl * hardness;
  }

  public abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    // Перки тратят ОП, а не ОН — см. perkCost.
    if (this.isPerkPointsEnable && isPerk) {
      return 0;
    }
    // ОП выкл — перк стоит как уровень навыка (abPointsPerLvl ОН за клик).
    if (!this.isPerkPointsEnable && isPerk) {
      return this.abPointsPerLvl * hardness;
    }

    return 1 * hardness;
  }

  public abTotalCost(curLvl: number, hardness: number, isPerk: boolean, perkHardnes?: number) {
    // Перки не учитываются в балансе ОН — они расходуют только ОП.
    if (this.isPerkPointsEnable && isPerk) {
      return 0;
    }

    return curLvl * hardness;
  }

  public checkPerkTskValue(tsk: Task) {
    if (!tsk.isPerk) {
      return;
    }
    // Сложность перков скрыта в UI: с ОП перк покупается целиком за 1 ОП,
    // без ОП перк докачивается за ОН как навык.
    tsk.perkHardnes = this.isPerkPointsEnable ? 0.5 : 1;

    // ОП выкл — даём докачивать, промежуточное value (maxAbilLvl/2) сохраняем.
    if (!this.isPerkPointsEnable) {
      return;
    }

    if (tsk.value > 0) {
      tsk.value = this.maxAbilLvl;
    }
  }

  public changeExpClassical(tsk: Task, isDone: boolean, koef: number, prs: Pers) {
    if (isDone) {
      prs.expVal += 1 * koef;
    } else {
      if (this.isHpEnabled) {
        prs.hp -= 1 * koef;
      } else {
        prs.expVal -= 1 * koef;
      }
    }
  }

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

  /**
   * Стоимость следующего апгрейда перка в ОП — если отключены, то в ОН.
   */
  perkCost(_value: number, _perkHardnes?: number): number {
    if (!this.isPerkPointsEnable) {
      return 5;
    }

    return 1;
  }

  public getPersExpAndLevel(
    totalAbVal: number,
    abCount: number,
    expPoints: number,
    totalAbValMax: number,
    totalAbLvl: number,
    classicalExpTotal: number,
    persExpVal: number,
    abOpenned: number,
  ): getExpResult {
    if (persExpVal == null) {
      persExpVal = classicalExpTotal;
    }

    let result = new getExpResult();

    result.exp = persExpVal;

    // Итеративно определяем уровень персонажа по накопленному опыту
    let persLevel = 1;
    let expLvl = 0; // суммарный опыт, необходимый для достижения текущего уровня
    let cur = 0;

    while (true) {
      result.startExp = expLvl;

      // На каждом perkPointLvlInterval-м уровне вместо ОН начисляется 1 ОП,
      // а 1 ОП = perkPointAbLevelCost * abPointsPerLvl ОН по экономике —
      // значит такой уровень «стоит» во столько же раз дороже по опыту.
      let lvlPoints = this.abPointsPerLvl;

      // Когда перки отдельно
      if (this.isPerkPointsEnable && this.perkPointLvlInterval > 0 && persLevel % this.perkPointLvlInterval === 0) {
        lvlPoints *= this.perkPointAbLevelCost;
      }

      // Опыт, нужный для перехода на следующий уровень
      cur = persLevel === 1 ? lvlPoints : (cur + lvlPoints) * 1.1;
      expLvl += cur;

      result.nextExp = expLvl;

      // Если суммарный порог превысил накопленный опыт — текущий уровень найден
      if (expLvl > result.exp) {
        result.persLevel = persLevel;

        break;
      }

      persLevel++;
    }

    return result;
  }

  public getPersRangName(persLvl: number): string {
    let rngIdx = Math.min(Math.floor(persLvl / 10), this.rangNames.length - 1);

    return this.rangNames[rngIdx];
  }

  public setTes() {}
}
