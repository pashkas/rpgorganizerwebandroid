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
  rangNames = ["обыватель", "авантюрист", "воин", "мастер", "герой", "легенда"];

  public abChangeExp(curLvl: number, hardness: number, isPerk: boolean, _perkHardnes?: number): number {
    if (isPerk) {
      // Перк даёт опыт как навык максимального уровня. curLvl=0 (неактивированный) — 0 опыта.
      return curLvl > 0 ? this.maxAbilLvl : 0;
    }

    return curLvl * hardness;
  }

  public abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    // Перки тратят ОП, а не ОН — см. perkCost.
    if (isPerk) {
      return 0;
    }

    return 1 * hardness;
  }

  public abTotalCost(curLvl: number, hardness: number, isPerk: boolean, perkHardnes?: number) {
    // Перки не учитываются в балансе ОН — они расходуют только ОП.
    if (isPerk) {
      return 0;
    }

    return curLvl * hardness;
  }

  public checkPerkTskValue(tsk: Task) {
    if (!tsk.isPerk) {
      return;
    }
    // Сложность перков скрыта в UI — все перки принудительно норм.
    // Старые сложн-перки (perkHardnes=1) с любым value>0 добиваются до полного значения.
    tsk.perkHardnes = 0.5;

    if (tsk.value > 0) {
      tsk.value = this.maxAbilLvl;
    }
  }

  public calculateHp(prs: Pers, prevLvl: number, curLvl: number) {
    if (prs.hp == null) {
      prs.hp = 100;
    }
    if (prs.maxHp == null) {
      prs.maxHp = 100;
    }
    if (prs.hpProgr == null) {
      prs.hpProgr = 100;
    }

    if (!this.isHpEnabled) {
      prs.hp = 100;
      prs.maxHp = 100;
      prs.hpProgr = 100;

      return;
    }

    prs.maxHp = (this.abPointsStart + prs.level * this.abPointsPerLvl) / 3;

    if (curLvl > prevLvl) {
      prs.hp = prs.maxHp;
    }

    if (prs.hp > prs.maxHp) {
      prs.hp = prs.maxHp;
    }

    prs.hpProgr = (prs.hp / prs.maxHp) * 100;
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

    while (true) {
      result.startExp = expLvl;

      // Коэффициент сложности: сигмоида 1→5, основной рост на 10-20 уровнях, округление вниз до десятых
      // let e = Math.floor((1 + 4 / (1 + Math.exp(-0.35 * (persLevel - 18)))) * 10) / 10;

      // Сначала 1 день, потом с каждым рангом + 1
      let e = Math.floor(persLevel / 10) + 1;

      // На каждом perkPointLvlInterval-м уровне вместо ОН начисляется 1 ОП,
      // а 1 ОП = perkPointAbLevelCost * abPointsPerLvl ОН по экономике —
      // значит такой уровень «стоит» во столько же раз дороже по опыту.
      let lvlPoints =
        this.perkPointLvlInterval > 0 && persLevel % this.perkPointLvlInterval === 0
          ? this.abPointsPerLvl * this.perkPointAbLevelCost
          : this.abPointsPerLvl;

      // Опыт, нужный для перехода на следующий уровень
      let cur = lvlPoints * persLevel * e;
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
