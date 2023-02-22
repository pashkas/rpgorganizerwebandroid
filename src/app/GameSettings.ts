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
  static abLvlForPersLvl: number = 2;

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
  static isOpenAbWhenActivate: boolean = false;

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
      let skillMult = 2.06;
      let skillOffcet = 3 - skillMult;

      let result = level * skillMult + skillOffcet;

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
  static changesPopupDuration: number = 3000;

  /**
   * Длительность попапа изменений квестов.
   */
  static changesPopupDurationQwest: number = 3000;

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
  static maxAbilLvl: number = 10;

  /**
   * Минимальный уровень навыка.
   */
  static minAbilLvl: number = 1;

  /**
   * Максимальное значение очков в задаче.
   */
  static tesMaxVal: number = GameSettings.maxAbilLvl * 10 - GameSettings.minAbilLvl * 10;
}
