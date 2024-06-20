export class GameSettings {
  static setTes() {
    GameSettings.isAbPointsEnabled = false;
    GameSettings.isClassicaRPG = false;
    GameSettings.expFotmulaType = "abVal";
    GameSettings.abPointsPerLvl = 30;
    GameSettings.failKoef = 1;
    GameSettings.changesPopupDurationAbil = 6000;
    GameSettings.changesPopupDurationCha = 6000;
    GameSettings.maxAbilLvl = 20;
    GameSettings.maxChaLvl = 20;
  }

  static failKoef: number = 1;

  /**
   * Начальное ОН.
   */
  static abPointsStart: number = 30;

  /**
   * Очков за уровень.
   */
  static abPointsPerLvl: number = 10;

  /**
   * Стоимость поднятия навыка
   */
  static abCost(curLvl: number, hardness: number): number {
    if (curLvl == 0) {
      return 10 * hardness;
    }

    return curLvl * hardness;
  }

  /**
   * Сумма потраченных очков на навык.
   */
  static abTotalCost(curLvl: number, hardness: number) {
    if (curLvl == 0) {
      return 0;
    }

    let v = curLvl - 1;

    return (10 + (v * (v + 1)) / 2) * hardness;
  }

  /**
   * В листе перса целые значения/или дробные.
   */
  static isCeilProgressInList: boolean = true;
  /**
   * Прогресс бар целый?
   */
  static isCeilProgressBar: boolean = true;
  /**
   * Классический режим РПГ.
   */
  static isClassicaRPG: boolean = true;

  static isShowDec: boolean = true;
  /**
   * Максимальный уровень персонажа.
   */
  static maxPersLevel: number = 100;

  /**
   * Тип расчета опыта. (dynamic, abLvl, abVal, abLvl2)
   */
  static expFotmulaType: string = "abLvl";

  /**
   * За сколько уровней даются очки навыков.
   */
  static perLvl: number = 10;

  /**
   * ОН активны.
   */
  static isAbPointsEnabled: boolean = true;

  /**
   * Новый навык открыт?
   */
  static isNewAbOpened: boolean = false;

  /**
   * Открывать навык при активации.
   */
  static isOpenAbWhenActivate: boolean = true;

  /**
   * Плюс к прогрессу для задания в задаче.
   *
   */
  static plusAbProgrForTitle: number = 0;

  /**
   * Формула прогресса навыка.
   */
  static getTesChangeKoef(tesVal: number): number {
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
      let levels = GameSettings.maxAbilLvl;
      let xp_for_first_level = 7;
      let xp_for_last_level = 20;

      let B = Math.log(xp_for_last_level / xp_for_first_level) / (levels - 1);
      let A = xp_for_first_level / (Math.exp(B) - 1);

      let old_exp = A * Math.exp(B * (level - 1));
      let new_exp = A * Math.exp(B * level);

      const diff = new_exp - old_exp;

      return 1 / diff;
    }
  }

  /**
   * Открывать окно перса когда новый уровень?
   */
  static isOpenPersAtNewLevel: boolean = false;
  /**
   * Показывать полный список требований навыка, по уровням.
   */
  static isShowAbProgrTable: boolean = true;

  /**
   * Показывать изменения уровней характеристик.
   */
  static changesIsChowChaLevels: boolean = true;

  /**
   * Показывать изменения значений характеристик.
   */
  static changesIsChowChaValues: boolean = false;

  /**
   * Показывать изменения уровней навыков.
   */
  static changesIsShowAbLevels: boolean = true;

  /**
   * Показывать изменения значений навыков.
   */
  static changesIsShowAbValues: boolean = false;

  /**
   * Показывать открытие навыка.
   */
  static changesIsShowAbActivate: boolean = true;

  /**
   * Показывать изменение опыта.
   */
  static changesIsShowExp: boolean = true;

  /**
   * Длительность показа попапа с изменениями.
   */
  static changesPopupDuration: number = 2500;
  static changesPopupDurationAbil: number = 6000;
  static changesPopupDurationCha: number = 6000;

  /**
   * Длительность попапа изменений квестов.
   */
  static changesPopupDurationQwest: number = 2500;

  /**
   * Анимация вспышки задачи.
   */
  static flashDelay: number = 333;
  static flashDelay2: number = 555;
  /**
   * Длительность самой анимации.
   */
  static animationDelay: number = 1000;

  /**
   * Показывать процент в прогрессе навыка.
   */
  static changesIsShowPercentageInAb: boolean = false;

  /**
   * Показывать значение в изменениях навыка.
   */
  static changesIsShowValueInAb: boolean = true;

  /**
   * Показывать значения в изменениях характеристик.
   */
  static changesIsShowValueInCha: boolean = true;

  /**
   * Показывать описание нового уровня навыка в изменениях.
   */
  static changesIsShowAbDescrInChanges: boolean = false;

  /**
   * Число рангов.
   */
  static rangsCount: number = 11;

  /**
   * Максимальный уровень характеристик.
   */
  static maxChaLvl: number = 10;
  /**
   * Минимальный уровень характеристик.
   */
  static minChaLvl: number = 1;

  /**
   * Максимальный уровень навыков.
   */
  static maxAbilLvl: number = 10;

  /**
   * Минимальный уровень навыка.
   */
  static minAbilLvl: number = 1;

  /**
   * Максимальное значение очков в задаче.
   */
  static tesMaxVal: number = GameSettings.maxAbilLvl * 10 - GameSettings.minAbilLvl * 10 + 9.99;

  /**
   * Число картинок скиллов.
   */
  static skiilImgNum: number = 134;

  /**
   * Число картинок персонажей.
   */
  static persImgNum: number = 51;

  static tskOrderDefault: number = -1;

  static baseTskGold: number = 1;
  static qwestHardneses: qwestHardness[] = [
    { id: 5, name: "оч. легко", gold: 30 },
    { id: 4, name: "легко", gold: 60 },
    { id: 3, name: "норм", gold: 125 },
    { id: 2, name: "сложно", gold: 500 },
    { id: 1, name: "оч. сложно", gold: 2500 },
  ];

  static revProbs: taskProb[] = [
    { id: 5, name: "оч. распространенный", prob: 3, gold: 75 },
    { id: 4, name: "распространенный", prob: 2, gold: 125 },
    { id: 3, name: "обычный", prob: 1, gold: 250 },
    { id: 2, name: "редкий", prob: 0.25, gold: 1000 },
    { id: 1, name: "оч. редкий", prob: 0.05, gold: 5000 },
  ];
}

export class qwestHardness {
  id: number;
  name: string;
  gold: number;
}

export class taskProb {
  id: number;
  name: string;
  prob: number;
  gold: number;
}
