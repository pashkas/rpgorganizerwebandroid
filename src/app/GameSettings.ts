export class GameSettings {
  /**
   * Максимальный уровень персонажа.
   */
  static maxPersLevel: number = 50;

  /**
   * Очков за уровень.
   */
  static abLvlForPersLvl: number = 50;

  /**
   * Плюс к прогрессу для задания в задаче.
   *
   */
  static plusAbProgrForTitle: number = 4;

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
   * Показывать процент в прогрессе навыка.
   */
  static isShowPercentageInAb: boolean = true;

  /**
   * Максимальное значение очков в задаче.
   */
  static tesMaxVal: number = GameSettings.maxAbilLvl * 10 - GameSettings.minAbilLvl * 10;

  /**
   * Формула прогресса навыка.
   */
  static getTesChangeKoef(tesVal: number): number {
    let skillMult = 0.0206556;
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
  static isShowCharactChanges: boolean = true;
  /**
   * Показывать изменения навыков.
   */
  static isShowAbChanges: boolean = false;
  /**
   * Показывать изменение опыта.
   */
  static isShowExpChanges: boolean = false;
}
