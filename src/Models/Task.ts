import { v4 as uuid } from "uuid";
import { Time } from "@angular/common";
import { Rangse } from "./Rangse";
import { Pers } from "./Pers";
import { plusToName } from "./plusToName";
import { ReqItemType } from "./ReqItem";
import { GameSettings } from "src/app/GameSettings";
export class Task implements IImg {
  classicalExp: number = 0;
  reqvirements: Reqvirement[] = [];
  prefix: string = "";
  postfix: string = "";

  static maxValue: number = 10;
  static requrenses: string[] = ["будни", "выходные", "ежедневно", "дни недели", "через 1 день", "через 2 дня", "через 3 дня", "нет"];

  static weekDays: string[] = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

  tskWeekDays: string[] = []; //[...Task.weekDays];
  nextAbVal: number;
  isNotWriteTime: boolean = false;

  aimCounter: number = 0;
  aimTimer: number = 0;

  aimUnit = "Минут";
  isEven = false;

  failCounter: number = 0;
  curStateDescrInd: number;
  statesDescr: string[] = [];

  hardnes: number = 1;

  date: Date = this.getNowDate();
  descr: string = "";
  id: any = uuid();

  prevId: any;
  nextId: any;

  image: string = "";
  isDone: boolean = false;

  // Таймер/счетчик
  isCounter: boolean = false;
  counterValue: number = 0;
  isTimer: boolean = false;
  timerStart: Date;
  timerValue: number = 0;
  /**
   * Суммирование состояний.
   */
  isSumStates: boolean = false;
  name: string;
  plusName: string;
  plusToNames: plusToName[] = [];
  isStatePlusTitle: boolean = true;
  isStateRefresh: boolean = false;
  refreshCounter: number = 0;
  isStateInTitle: boolean = false;
  progressValue: number = 0;
  requrense: string = "будни";
  states: taskState[] = [];
  // statesDescr: taskState[] = [];
  time: string = "00:00";
  timeForSort: number = 200000000;
  tittle: string;
  value: number = 0;
  order: number = GameSettings.tskOrderDefault;
  lastNotDone: boolean = false;
  isfrstqwtsk: boolean;
  isHard: boolean = false;

  parrentTask: string;
  curLvlDescr: string;
  curLvlDescr2: string;
  imageLvl: string = "0";
  IsNextLvlSame: boolean;
  isPerk: boolean = false;
  mayUp: boolean;
  cost: number = 0;
  nextUp: number = 0;
  tesValue: number = 0;
  roundVal: number = 0;
  plusStateMax: string;
  timeVal: number;
  curLvlDescr3: string;
  qwestId: string;
  autoInd: number;
  lastDate: number;
  tesAbValue: number = 0;
  progresNextLevel: number;

  secondsToDone: number = 0;
  secondsDone: number = 0;
  counterDone: number = 0;
  counterToDone: number = 0;
  plusExp: number = 0;
  autoTime: number = 0;

  isCounterEnable: boolean = false;

  static getHardness(tsk: Task): number {
    if (!tsk.hardnes) {
      tsk.hardnes = 1;
    }

    return tsk.hardnes;
  }

  chainIdx: number = -1;

  /**
   * Получить формулу для роста/понижения значения задачи.
   * @param curVal Значение.
   */
  static AbIncreaseFormula(curVal: number, persLvl: number, isHard): any {
    let abIncreaseFormula = 1;

    let hardKoef = 1;

    if (isHard) {
      hardKoef = 2;
    }

    let val = Math.floor(curVal) / 10.0 + 1;
    abIncreaseFormula = val * hardKoef;

    return 1 / abIncreaseFormula;
  }

  /**
   * Получить значение следующего уровня задачи.
   * @param value Значение.
   */
  static GetNextLvl(value: number): any {
    return Math.floor(value) + 1;
  }

  /**
   * Уменьшение значения задачи.
   * @param chVal Изменение значения.
   */
  static valueDecrease(chVal: number, tsk: Task, prsLvl: number): any {
    let curVal = tsk.value;

    if (chVal && isFinite(chVal)) {
      // Если формула - в зависимости от развитости навыков
      while (true) {
        let prevLvl = Math.floor(curVal);

        if (prevLvl == curVal) prevLvl = prevLvl - 1;

        let lastForPrev = curVal - prevLvl;
        let change = chVal * this.AbIncreaseFormula(prevLvl, prsLvl, tsk.isHard);

        if (change <= lastForPrev) {
          curVal -= change;
          break;
        }

        let iterationChange = lastForPrev / this.AbIncreaseFormula(prevLvl, prsLvl, tsk.isHard);
        chVal -= iterationChange;
        curVal -= lastForPrev;

        if (curVal <= 0) {
          curVal = 0;
          break;
        }
      }
    }

    tsk.value = curVal;
  }

  /**
   * Прирост значения задачи.
   * @param chVal Изменение значения.
   */
  static valueIncrease(chVal: number, tsk: Task, prsLvl: number): any {
    let curVal = tsk.value;

    if (chVal && isFinite(chVal)) {
      // Если формула - в зависимости от развитости навыков
      while (true) {
        let nextLvl = this.GetNextLvl(curVal);
        let lastForNext = nextLvl - curVal;
        let change = chVal * this.AbIncreaseFormula(curVal, prsLvl, tsk.isHard);

        if (change <= lastForNext) {
          curVal += change;
          break;
        }

        let iterationChange = lastForNext / this.AbIncreaseFormula(curVal, prsLvl, tsk.isHard);
        chVal -= iterationChange;
        curVal += lastForNext;
      }
    }

    tsk.value = curVal;
  }

  /**
   * Получить дату для новой задачи.
   */
  private getNowDate(): Date {
    var today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59);
  }
}

export class taskState implements IImg {
  abRang: Rangse;
  id: any = uuid();

  prevId: any;
  nextId: any;

  chainIdx: number = -1;
  isNotWriteTime: boolean = false;

  name: string;

  isDone: boolean = false;
  parrentTask: string;
  isActive: boolean = false;
  startLvl: number = 999;
  order: number = GameSettings.tskOrderDefault;
  img: string;
  image: string;
  imageLvl: string = "0";
  time: string = "00:00";
  value: number;
  requrense: string;
  timeVal: number;
  failCounter: number;
  lastDate: number;
  lastNotDone: boolean = false;
  autoTime: number = 0;
  secondsDone: number = 0;
  counterDone: number = 0;
}

export interface IImg {
  image: string;
  parrentTask: string;
  imageLvl: string;
  value: number;
  requrense: string;
}

export class Reqvirement {
  id: any = uuid();
  elId: any;
  elVal: number;
  elName?: string;
  type?: string;
  isDone?: boolean = false;
}
