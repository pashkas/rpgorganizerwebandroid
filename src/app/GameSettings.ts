export class GameSettings {
  /**
   * Максимальный уровень персонажа.
   */
  static maxPersLevel: number = 100;

  /**
   * Очков за уровень.
   */
  static abLvlForPersLvl: number = 20;

  /**
   * Плюс к прогрессу для задания в задаче.
   *
   */
  static plusAbProgrForTitle: number = 0;

  /**
   * Число рангов.
   */
  static rangsCount: number = 6;

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
  static maxAbilLvl: number = 100;

  /**
   * Минимальный уровень навыка.
   */
  static minAbilLvl: number = 0;

  /**
   * Максимальное значение очков в задаче.
   */
  static tesMaxVal: number = GameSettings.maxAbilLvl * 10 - GameSettings.minAbilLvl * 10;

  /**
   * Формула прогресса навыка.
   */
  static getTesChangeKoef(tesVal: number): number {
    let skillMult = 0.021;
    let skillOffcet = 0.2 - skillMult;

    let level = 1 + Math.floor(tesVal / 10.0);
    let result = level * skillMult + skillOffcet;

    return 1 / result;
  }

  /**
   * Показывать полный список требований навыка, по уровням.
   */
  static isShowAbProgrTable: boolean = false;

  /**
   * Показывать изменения характеристик.
   */
  static changesIsChowCha: boolean = true;
  /**
   * Показывать изменения навыков.
   */
  static changesIsShowAb: boolean = false;
  /**
   * Показывать открытие навыка.
   */
  static changesIsShowAbActivate: boolean = true;
  /**
   * Показывать изменение опыта.
   */
  static changesIsShowExp: boolean = false;

  /**
   * Длительность показа попапа с изменениями.
   */
  static changesPopupDuration: number = 5000;

  /**
   * Показывать процент в прогрессе навыка.
   */
  static changesIsShowPercentageInAb: boolean = true;

  /**
   * Показывать значение в изменениях навыка.
   */
  static changesIsShowValueInAb: boolean = false;

  /**
   * Показывать значения в изменениях характеристик.
   */
  static changesIsShowValueInCha: boolean = false;

  /**
   * Показывать описание нового уровня навыка в изменениях.
   */
  static changesIsShowAbDescrInChanges: boolean = false;

  /**
   * Новый навык открыт?
   */
  static isNewAbOpened: boolean = false;

  /**
   * ОН активны.
   */
  static isAbPointsEnabled: boolean = true;

  /**
   * Начальное ОН.
   */
  static startAbPoints: number = 4;
}
