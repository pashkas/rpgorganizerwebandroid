import { v4 as uuid } from "uuid";
import { Rangse } from "./Rangse";
import { plusToName } from "./plusToName";

export interface IImg {
  image: string;
  imageLvl: string;
  parrentTask: string;
  requrense: string;
  value: number;
}

export class Reqvirement {
  elId: any;
  elName?: string;
  elVal: number;
  id: any = uuid();
  isDone?: boolean = false;
  type?: string;
}

export class Task implements IImg {
  static maxValue: number = 10;
  static requrenses: string[] = ["будни", "выходные", "ежедневно", "дни недели", "через 1 день", "через 2 дня", "через 3 дня", "нет"];
  static weekDays: string[] = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

  IsNextLvlSame: boolean;
  aimCounter: number = 0;
  aimTimer: number = 0;
  aimUnit = "Минут";
  autoInd: number;
  autoTime: number = 0;
  chainIdx: number = -1;
  classicalExp: number = 0;
  cost: number = 0;
  counterDone: number = 0;
  counterToDone: number = 0;
  counterValue: number = 0;
  curLvlDescr: string;
  curLvlDescr2: string;
  curLvlDescr3: string;
  curStateDescrInd: number;
  date: Date = this.getNowDate();
  descr: string = "";
  failCounter: number = 0;
  hardnes: number = 1;
  id: any = uuid();
  image: string = "";
  imageLvl: string = "0";
  // Таймер/счетчик
  isCounter: boolean = false;
  isCounterEnable: boolean = false;
  isDone: boolean = false;
  isEven = false;
  isHard: boolean = false;
  isNotWriteTime: boolean = false;
  isPerk: boolean = false;
  isStateInTitle: boolean = false;
  isStatePlusTitle: boolean = true;
  isStateRefresh: boolean = false;
  /**
   * Суммирование состояний.
   */
  isSumStates: boolean = false;
  isTimer: boolean = false;
  isfrstqwtsk: boolean;
  lastDate: number;
  lastNotDone: boolean = false;
  mayUp: boolean;
  name: string;
  //[...Task.weekDays];
  nextAbVal: number;
  nextId: any;
  nextUp: number = 0;
  order: number = 0;
  parrentTask: string;
  plusExp: number = 0;
  plusName: string;
  plusStateMax: string;
  plusToNames: plusToName[] = [];
  postfix: string = "";
  prefix: string = "";
  prevId: any;
  progresNextLevel: number;
  progressValue: number = 0;
  qwestId: string;
  refreshCounter: number = 0;
  requrense: string = "будни";
  reqvirements: Reqvirement[] = [];
  roundVal: number = 0;
  secondsDone: number = 0;
  secondsToDone: number = 0;
  states: taskState[] = [];
  statesDescr: string[] = [];
  tesAbValue: number = 0;
  tesValue: number = 0;
  // statesDescr: taskState[] = [];
  time: string = "00:00";
  timeForSort: number = 200000000;
  timeVal: number;
  timerStart: Date;
  timerValue: number = 0;
  tittle: string;
  tskWeekDays: string[] = [];
  value: number = 0;

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

  static getHardness(tsk: Task): number {
    if (!tsk.hardnes) {
      tsk.hardnes = 1;
    }

    return tsk.hardnes;
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
  autoTime: number = 0;
  chainIdx: number = -1;
  counterDone: number = 0;
  failCounter: number;
  id: any = uuid();
  image: string;
  imageLvl: string = "0";
  img: string;
  isActive: boolean = false;
  isDone: boolean = false;
  isNotWriteTime: boolean = false;
  lastDate: number;
  lastNotDone: boolean = false;
  name: string;
  nextId: any;
  order: number = 0;
  parrentTask: string;
  prevId: any;
  requrense: string;
  secondsDone: number = 0;
  startLvl: number = 999;
  time: string = "00:00";
  timeVal: number;
  value: number;
}
