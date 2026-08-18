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
  public isVibro: boolean = true;
  public isOpenPersAtNewLevel = true;
  public changesPopupDuration = 1750;
  public changesPopupDurationGold = 1750;
  public changesPopupDurationAbil = 1750;
  public changesPopupDurationCha = 1750;
  public changesPopupDurationNewLevel = 1750;
  public changesPopupDurationQwest = 1750;
  public maxAbilLvl = 10;
  public maxChaLvl = 10;
  public maxPersLevel: number = 50;
  public minAbilLvl = 1;
  public minChaLvl = 1;
  public perkHardness: number = 1;
  public perkPointAbLevelCost = 2;
  public perkPointLvlInterval = 4;
  rangNames = ["обыватель", "авантюрист", "воин", "мастер", "герой", "легенда"];
  private persRangLevelBorders = [0, 10, 20, 30, 40, 50];
  private monsterLevelBorders = [0, 10, 20, 30, 40, 50];
  isPerkPointsEnable: boolean = false;

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
    // ОП выкл — перк покупается целиком. Старую покупку по половинам можно вернуть настройкой.
    if (!this.isPerkPointsEnable && isPerk) {
      return this.isPerkTwoStepUpgradeEnabled ? this.abPointsPerLvl * hardness : (this.maxAbilLvl - curLvl) * hardness;
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
    // Сложность перков скрыта в UI: с ОП перк покупается целиком за 1 ОП.
    tsk.perkHardnes = this.isPerkPointsEnable ? 0.5 : 1;

    // Сохраняем старые промежуточные значения: новый режим их больше не создаёт.
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
    for (let i = this.monsterLevelBorders.length - 1; i >= 0; i--) {
      if (prsLvl >= this.monsterLevelBorders[i]) {
        return i + 1;
      }
    }

    return 1;
  }

  /**
   * Стоимость следующего апгрейда перка в ОП — если отключены, то в ОН.
   */
  perkCost(value: number, _perkHardnes?: number): number {
    if (!this.isPerkPointsEnable) {
      return this.isPerkTwoStepUpgradeEnabled ? this.abPointsPerLvl : this.maxAbilLvl - value;
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
    let curPoints = 0;

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
      curPoints += lvlPoints;
      let expMultiplier = 1 + (persLevel - 1) * 0.0618;
      let cur = curPoints * expMultiplier;
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
    let rngIdx = this.getPersRangIndex(persLvl);

    return this.rangNames[rngIdx];
  }

  /**
   * Логика получения прогресса ранга персонажа.
   */
  getPersRangIdx(persLvl: number, mosterLvl: number, maxPersLvl: number): number {
    let rngIdx = this.getPersRangIndex(persLvl);
    let nextBorder = this.persRangLevelBorders[rngIdx + 1];

    if (nextBorder == null) {
      return rngIdx;
    }

    let curBorder = this.persRangLevelBorders[rngIdx];
    let progress = (persLvl - curBorder) / (nextBorder - curBorder);

    return rngIdx + progress;
  }

  private getPersRangIndex(persLvl: number): number {
    for (let i = this.persRangLevelBorders.length - 1; i >= 0; i--) {
      if (persLvl >= this.persRangLevelBorders[i]) {
        return Math.min(i, this.rangNames.length - 1);
      }
    }

    return 0;
  }

  public setTes() {}
}
