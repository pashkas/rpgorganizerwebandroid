export class GameSettings {
  /**
   * Максимальный уровень персонажа.
   */
  static maxPersLevel: number = 100;

  /**
   * Тип расчета опыта. (dynamic, abLvl, abVal)
   */
  static expFotmulaType: string = "abLvl";

  /**
   * Очков за уровень.
   */
  static abLvlForPersLvl: number = 3;

  /**
   * ОН активны.
   */
  static isAbPointsEnabled: boolean = false;

  /**
   * Новый навык открыт?
   */
  static isNewAbOpened: boolean = false;

  /**
   * Открывать навык при активации.
   */
  static isOpenAbWhenActivate: boolean = true;

  /**
   * Начальное ОН.
   */
  static startAbPoints: number = 3;

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
      let skillOffcet = 3 - skillMult;

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
   * Показывать полный список требований навыка, по уровням.
   */
  static isShowAbProgrTable: boolean = true;

  /**
   * Показывать изменения уровней характеристик.
   */
  static changesIsChowChaLevels: boolean = false;

  /**
   * Показывать изменения значений характеристик.
   */
  static changesIsChowChaValues: boolean = true;

  /**
   * Показывать изменения уровней навыков.
   */
  static changesIsShowAbLevels: boolean = false;

  /**
   * Показывать изменения значений навыков.
   */
  static changesIsShowAbValues: boolean = true;

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
  static changesPopupDuration: number = 2250;

  /**
   * Длительность попапа изменений квестов.
   */
  static changesPopupDurationQwest: number = 2250;

  /**
   * Длительность самой анимации.
   */
  static animationSpeed: number = 1000;

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
  static tesMaxVal: number = GameSettings.maxAbilLvl * 10 - GameSettings.minAbilLvl * 10;

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
