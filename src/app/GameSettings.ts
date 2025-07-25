import { Pers } from "src/Models/Pers";
import { Task } from "src/Models/Task";
import { getExpResult } from "src/Models/getExpResult";

export abstract class GameSettings {
  isHardnessEnable: boolean = true;
  /**
   * Нужно набрать очков чтобы достичь уровень
   *
   */
  abPointsForLvl: number = 40;
  /**
   * Очков за уровень.
   */
  abPointsPerLvl: number = 10;
  /**
   * Начальное ОН.
   */
  abPointsStart: number = 30;
  /**
   * Длительность самой анимации.
   */
  animationDelay: number = 1000;
  baseTskGold: number = 1;
  /**
   * Показывать изменения уровней характеристик.
   */
  changesIsChowChaLevels: boolean = true;
  /**
   * Показывать изменения значений характеристик.
   */
  changesIsChowChaValues: boolean = false;
  /**
   * Показывать открытие навыка.
   */
  changesIsShowAbActivate: boolean = true;
  /**
   * Показывать описание нового уровня навыка в изменениях.
   */
  changesIsShowAbDescrInChanges: boolean = false;
  /**
   * Показывать изменения уровней навыков.
   */
  changesIsShowAbLevels: boolean = true;
  /**
   * Показывать изменения значений навыков.
   */
  changesIsShowAbValues: boolean = false;
  /**
   * Показывать изменение опыта.
   */
  changesIsShowExp: boolean = true;
  /**
   * Показывать процент в прогрессе навыка.
   */
  changesIsShowPercentageInAb: boolean = false;
  /**
   * Показывать значение в изменениях навыка.
   */
  changesIsShowValueInAb: boolean = true;
  /**
   * Показывать значения в изменениях характеристик.
   */
  changesIsShowValueInCha: boolean = true;
  /**
   * Длительность показа попапа с изменениями.
   */
  changesPopupDuration: number = 3000;
  changesPopupDurationAbil: number = 3000;
  changesPopupDurationCha: number = 3000;
  changesPopupDurationNewLevel: number = 5000;
  /**
   * Длительность попапа изменений квестов.
   */
  changesPopupDurationQwest: number = 3000;
  /**
   * Тип расчета опыта. (dynamic, abLvl, abLvlPoints, abValPoints)
   */
  expFotmulaType: string = "abLvl";
  failKoef: number = 1;
  /**
   * Анимация вспышки задачи.
   */
  flashDelay: number = 333;
  flashDelay2: number = 555;
  /**
   * ОН активны.
   */
  isAbPointsEnabled: boolean = true;
  /**
   * Прогресс бар целый?
   */
  isCeilProgressBar: boolean = true;
  /**
   * В листе перса целые значения/или дробные.
   */
  isCeilProgressInList: boolean = true;
  /**
   * Классический режим РПГ.
   */
  isClassicaRPG: boolean = true;
  isHpEnabled: boolean = false;
  /**
   * Новый навык открыт?
   */
  isNewAbOpened: boolean = false;
  /**
   * Открывать навык при активации.
   */
  isOpenAbWhenActivate: boolean = true;
  isOpenAbWhenUp: boolean = false;
  isEditAbWhenActivate: boolean = true;

  /**
   * Открывать окно перса когда новый уровень?
   */
  isOpenPersAtNewLevel: boolean = false;
  isShowAbLvlPopup: boolean = false;
  /**
   * Показывать полный список требований навыка, по уровням.
   */
  isShowAbProgrTable: boolean = true;
  isShowChaLvlPopup: boolean = false;
  isShowDec: boolean = true;
  /**
   * Максимальный уровень навыков.
   */
  maxAbilLvl: number = 10;
  /**
   * Максимальный уровень характеристик.
   */
  maxChaLvl: number = 10;
  /**
   * Максимальный уровень персонажа.
   */
  maxPersLevel: number = 100;
  /**
   * Минимальный уровень навыка.
   */
  minAbilLvl: number = 1;
  /**
   * Минимальный уровень характеристик.
   */
  minChaLvl: number = 1;
  /**
   * За сколько уровней даются очки навыков.
   */
  perLvl: number = 10;
  /**
   * Число картинок персонажей.
   */
  persImgNum: number = 56;

  perkHardness: number = 0.5;

  sort = ["abil", "abLvl", "cha", "chaLvl", "qwest", "exp", "hp"];

  /**
   * Плюс к прогрессу для задания в задаче.
   *
   */
  plusAbProgrForTitle: number = 0;
  qwestHardneses: qwestHardness[] = [
    { id: 5, name: "оч. легко", gold: 50 },
    { id: 4, name: "легко", gold: 100 },
    { id: 3, name: "норм", gold: 250 },
    { id: 2, name: "сложно", gold: 500 },
    { id: 1, name: "оч. сложно", gold: 1000 },
  ];
  rangNames = ["обыватель", "странник", "авантюрист", "пират", "корсар", "воин", "мастер", "джедай", "чемпион", "герой", "легенда"];
  revProbs: taskProb[] = [
    { id: 5, name: "оч. распространенный", prob: 3, gold: 25 },
    { id: 4, name: "распространенный", prob: 2, gold: 50 },
    { id: 3, name: "обычный", prob: 1, gold: 100 },
    { id: 2, name: "редкий", prob: 0.25, gold: 250 },
    { id: 1, name: "оч. редкий", prob: 0.05, gold: 500 },
  ];
  /**
   * Число картинок скиллов.
   */
  skillImgNum: number = 161;
  tskOrderDefault: number = -1;

  /**
   * Максимальное значение очков в задаче.
   */
  get tesMaxVal(): number {
    return this.maxAbilLvl * 10 - this.minAbilLvl * 10 + 9.99;
  }

  getPersRangName(persLvl): string {
    let persRang = Math.floor(persLvl / 10);
    if (persRang > this.rangNames.length - 1) {
      persRang = this.rangNames.length - 1;
    }

    return this.rangNames[persRang];
  }

  abChangeExp(curLvl: number, hardness: number, isPerk: boolean): number {
    return 0;
  }

  /**
   * Стоимость поднятия навыка
   */
  abCost(curLvl: number, hardness: number, isPerk: boolean): number {
    return 1;
  }

  /**
   * Сумма потраченных очков на навык.
   */
  abTotalCost(curLvl: number, hardness: number, isPerk: boolean) {
    if (curLvl == 0) {
      return 0;
    }

    let v = curLvl - 1;

    return (10 + (v * (v + 1)) / 2) * hardness;
  }

  calculateHp(prs: Pers, prevLvl: number, curLvl: number) {}

  changeExpClassical(tsk: Task, isDone: boolean, koef: number, prs: Pers) {
    if (tsk.classicalExp == null) {
      tsk.classicalExp = 0;
    }
    if (isDone) {
      tsk.classicalExp += 1 * koef;
    } else {
      tsk.classicalExp -= 1 * koef;
    }
  }

  checkPerkTskValue(tsk: Task) {
    return;
  }

  public getExpDiff(level: number, xp_for_first_level: number, xp_for_last_level: number, levels: number) {
    let B = Math.log(xp_for_last_level / xp_for_first_level) / (levels - 1);
    let A = xp_for_first_level / (Math.exp(B) - 1);

    let old_exp = A * Math.exp(B * (level - 1));
    let new_exp = A * Math.exp(B * level);

    const diff = new_exp - old_exp;

    return diff;
  }

  getMonsterLevel(prsLvl: number, maxLevel: number): number {
    if (prsLvl < 20) {
      return 1;
    }
    if (prsLvl < 40) {
      return 2;
    }
    if (prsLvl < 50) {
      return 3;
    }
    if (prsLvl < 70) {
      return 4;
    }
    if (prsLvl < 90) {
      return 5;
    }

    return 6;
  }

  /**
   * Формула прогресса навыка.
   */
  getTesChangeKoef(tesVal: number): number {
    const isTES = true;
    let level = 1 + Math.floor(tesVal / 10.0);

    if (isTES) {
      // В стиле TES
      let skillMult = 1;
      let skillOffcet = 1 - skillMult;

      let result = level * skillMult + skillOffcet;
      result = Math.ceil(result);

      return 1 / result;
    } else {
      // Экспонента
      const diff = this.getExpDiff(level, 7, 20, this.maxAbilLvl);

      return 1 / diff;
    }
  }

  setExpFormulaType(type: string) {
    this.expFotmulaType = type;

    if (type == "abLvl") {
      this.changesPopupDuration = 3000;
      this.changesPopupDurationAbil = 3000;
      this.changesPopupDurationCha = 3000;
      this.changesIsShowAbLevels = false;
      this.changesIsShowAbValues = true;
      this.changesIsChowChaLevels = false;
      this.changesIsChowChaValues = true;
    } else if (type == "abLvlPoints") {
      this.changesPopupDuration = 3000;
      this.changesPopupDurationAbil = 3000;
      this.changesPopupDurationCha = 3000;
      this.changesIsShowAbLevels = true;
      this.changesIsShowAbValues = false;
      this.changesIsChowChaLevels = true;
      this.changesIsChowChaValues = false;
    } else if (type == "abVal") {
      this.changesPopupDuration = 3000;
      this.changesPopupDurationAbil = 6000;
      this.changesPopupDurationCha = 6000;
      this.changesIsShowAbLevels = false;
      this.changesIsShowAbValues = true;
      this.changesIsChowChaLevels = false;
      this.changesIsChowChaValues = true;
      this.changesIsShowExp = false;
    } else if (type == "abValPoints") {
      this.changesPopupDuration = 3000;
      this.changesPopupDurationAbil = 6000;
      this.changesPopupDurationCha = 6000;
      this.changesPopupDurationQwest = 3000;
      this.changesIsShowAbLevels = true;
      this.changesIsShowAbValues = false;
      this.isShowAbLvlPopup = false;
      this.changesIsChowChaLevels = true;
      this.changesIsChowChaValues = false;
      this.isShowChaLvlPopup = false;
      this.changesIsShowExp = true;
    }
  }

  /**
   * Логика получения ранга персонажа.
   */
  getPersRangIdx(persLvl: number, mosterLvl: number, maxPersLvl: number): number {
    let stage = (persLvl / maxPersLvl) * (this.rangNames.length - 1);

    return stage;
  }

  setTes() {
    this.isClassicaRPG = false;

    this.setExpFormulaType("abValPoints");

    this.maxAbilLvl = 20;
    this.maxChaLvl = 20;

    // Очки навыков
    this.isAbPointsEnabled = true;
    this.abPointsStart = 4;
    this.abPointsPerLvl = 1;
    this.abPointsForLvl = 4;

    this.isOpenPersAtNewLevel = true;
  }

  abstract getPersExpAndLevel(
    totalAbVal: number,
    abCount: number,
    expPoints: number,
    totalAbValMax: number,
    totalAbLvl: number,
    classicalExpTotal: number,
    persExpVal: number,
    abOpenned: number
  ): getExpResult;
}

export class qwestHardness {
  gold: number;
  id: number;
  name: string;
}

export class taskProb {
  gold: number;
  id: number;
  name: string;
  prob: number;
}
