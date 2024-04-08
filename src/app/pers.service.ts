import { Injectable } from "@angular/core";
import { Pers } from "src/Models/Pers";
import { BehaviorSubject, Subject } from "rxjs";
import { FirebaseUserModel } from "src/Models/User";
import { Characteristic } from "src/Models/Characteristic";
import { Ability } from "src/Models/Ability";
import { Task, taskState, IImg, Reqvirement } from "src/Models/Task";
import { Qwest } from "src/Models/Qwest";
import { Reward } from "src/Models/Reward";
import { plusToName } from "src/Models/plusToName";
import { Rangse } from "src/Models/Rangse";
import { Router } from "@angular/router";
import { PerschangesService } from "./perschanges.service";
import { Diary } from "src/Models/Diary";
import * as moment from "moment";
import { SamplePers } from "src/Models/SamplePers";
import { curpersview } from "src/Models/curpersview";
import { MatDialog } from "@angular/material";
import { ReqItemType } from "src/Models/ReqItem";
import { GameSettings } from "./GameSettings";
import { getExpResult } from "src/Models/getExpResult";

@Injectable({
  providedIn: "root",
})
export class PersService {
  // Персонаж
  private unsubscribe$ = new Subject();

  _tesStartOn: number = 5;
  absMap: any;
  allMap: {};
  currentTask$ = new BehaviorSubject<Task>(null);
  currentView$ = new BehaviorSubject<curpersview>(curpersview.SkillTasks);
  isAutoPumpInProcess: boolean = false;
  isDialogOpen: boolean = false;
  isGlobalTaskView: boolean;
  isOffline: boolean = false;
  isOnline: boolean;
  isSynced: boolean = false;
  mn1Count: number = 62;
  mn2Count: number = 136;
  mn3Count: number = 439;
  mn4Count: number = 300;
  mn5Count: number = 532;
  mn6Count: number = 281;
  pers$ = new BehaviorSubject<Pers>(null);
  twoDaysTes = 12.546;
  // Пользователь
  user: FirebaseUserModel;

  constructor(private router: Router, private changes: PerschangesService, public dialog: MatDialog) {
    this.isOffline = true;
    this.getPers();
  }

  get baseTaskPoints(): number {
    return 10.0 / 1.0;
  }

  /**
   * Добавить новую награду.
   */
  AddRevard(rev: Reward): any {
    this.pers$.value.rewards.push(rev);
  }

  CasinoGold(tskExp: number) {
    // let gold = Math.round(tskExp * Math.random());
    // if (gold < 1) {
    //   gold = 1;
    // }
    let gold = Math.round(GameSettings.baseTskGold * Math.random());

    if (gold >= 1) {
      this.pers$.value.gold += gold;
    }
  }

  /**
   * Проверка и задание даты для задачи.
   * @param tsk Задача.
   */
  CheckSetTaskDate(tsk: Task): any {
    let tDate = new Date(tsk.date);

    while (true) {
      if (tsk.requrense === "дни недели" && tsk.tskWeekDays.length === 0) {
        break;
      }

      if (this.checkDate(tDate, tsk.requrense, tsk.tskWeekDays)) {
        break;
      }

      tDate.setDate(tDate.getDate() + 1);
    }

    tsk.date = tDate;
  }

  /**
   * Удаление характеристики.
   * @param uuid Идентификатор.
   */
  DeleteCharact(uuid: any): any {
    this.pers$.value.characteristics.splice(
      this.pers$.value.characteristics.findIndex((n) => n.id == uuid),
      1
    );
  }

  /**
   * Завершить квест.
   * @param qw Идентификатор квестов.
   */
  DoneQwest(qw: Qwest): any {
    // Добавляем к персонажу награды от квеста
    qw.rewards.forEach((rew) => {
      this.pers$.value.inventory.push(rew);
    });

    // Прибавка к золоту
    if (qw.gold > 0) {
      this.pers$.value.gold = +qw.gold + this.pers$.value.gold;
    }

    // Прибавка к опыту
    if (qw.exp > 0) {
      let plusExp = qw.exp / 10.0;
      this.pers$.value.exp += plusExp;
    }

    const qwId = qw.id;

    this.removeParrents(qwId);

    this.delQwest(qwId);

    this.savePers(true);
  }

  GetRndEnamy(tsk: IImg, lvl: number, maxlvl: number): string {
    let mnstrLvl = this.getMonsterLevel(lvl, maxlvl);

    tsk.imageLvl = "" + mnstrLvl;
    let prs = this.pers$.value;
    if (prs != null) {
      tsk.image = this.getImgPathRandome(mnstrLvl, prs);
    }

    return;
  }

  boolVCompare(a: boolean, b: boolean): number {
    let aVal = a == true ? 1 : 0;
    let bVal = b == true ? 1 : 0;

    return aVal - bVal;
  }

  abSorter(): (a: Ability, b: Ability) => number {
    return (a, b) => {
      let aTask = a.tasks[0];
      let bTask = b.tasks[0];

      // Можно открыть
      if (this.boolVCompare(aTask.mayUp, bTask.mayUp) != 0) {
        return -this.boolVCompare(aTask.mayUp, bTask.mayUp);
      }

      // Открыта
      if (this.boolVCompare(a.isOpen, b.isOpen) != 0) {
        return -this.boolVCompare(a.isOpen, b.isOpen);
      }

      // Одинаковые
      if (this.boolVCompare(aTask.IsNextLvlSame, bTask.IsNextLvlSame) != 0) {
        return -this.boolVCompare(aTask.IsNextLvlSame, bTask.IsNextLvlSame);
      }

      // Значение
      if (a.progressValue != b.progressValue) {
        return a.progressValue - b.progressValue;
      }

      // Сложность
      if (aTask.hardnes != bTask.hardnes) {
        return aTask.hardnes - bTask.hardnes;
      }

      // Перк?
      if (this.boolVCompare(aTask.isPerk, bTask.isPerk) != 0) {
        return this.boolVCompare(aTask.isPerk, bTask.isPerk);
      }

      return a.name.localeCompare(b.name);
    };
  }

  /**
   * Добавить навык.
   * @param charactId Идентификатор характеристики.
   */
  addAbil(charactId: string, name: string): string {
    var charact: Characteristic = this.pers$.value.characteristics.filter((n) => {
      return n.id === charactId;
    })[0];
    if (charact != null && charact != undefined) {
      let abil = new Ability();
      abil.name = name;
      abil.isOpen = GameSettings.isNewAbOpened;

      let tsk = this.addTsk(abil, name);

      charact.abilities.push(abil);

      return tsk;
    }
  }

  /**
   * Добавление новой характеристики.
   * @param newCharact Название.
   */
  addCharact(newCharact: string): Characteristic {
    var cha = new Characteristic();
    cha.name = newCharact;
    this.pers$.value.characteristics.push(cha);

    return cha;
  }

  /**
   * Добавить новый квест.
   * @param newQwest Название квеста.
   */
  addQwest(newQwest: string, parrent?: any, img?: string, abId?: any): any {
    let qwest = new Qwest();
    qwest.name = newQwest;
    if (parrent) {
      qwest.parrentId = parrent;
    }
    if (img) {
      qwest.image = img;
    }
    if (abId) {
      qwest.abilitiId = abId;
    }

    this.pers$.value.qwests.push(qwest);

    return qwest.id;
  }

  addToInventory(rev: Reward, prs: Pers = null) {
    if (prs == null) {
      prs = this.pers$.value;
    }

    let idx = prs.inventory.findIndex((n) => {
      return n.id === rev.id;
    });

    if (idx === -1) {
      rev.count = 1;
      prs.inventory.push(rev);
    } else {
      prs.inventory[idx].count = prs.inventory[idx].count + 1;
    }

    if (rev.isArtefact) {
      prs.rewards = prs.rewards.filter((r) => r.id != rev.id);
    }
  }

  /**
   * Добавить новую задачу к навыку
   * @param abil Навык.
   * @param newTsk Название задачи.
   */
  addTsk(abil: Ability, newTsk: string): string {
    var tsk = new Task();
    tsk.name = newTsk;

    this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), this.pers$.value.maxPersLevel);

    abil.tasks.push(tsk);

    return tsk.id;
  }

  getAbMonsterLvl(tsk: Task): number {
    let lvl = tsk.value * 10;
    if (lvl < GameSettings.maxPersLevel) {
      lvl = lvl - 0.01;
    }

    if (lvl < 0) {
      lvl = 0;
    }

    return lvl;
  }

  /**
   * Добавление задачи к квесту.
   * @param qwest Квест.
   * @param newTsk Название задачи.
   */
  addTskToQwest(qwest: Qwest, newTsk: string, toBegin: boolean = false): any {
    var tsk = new Task();
    tsk.name = newTsk;
    tsk.tittle = tsk.name = newTsk;
    tsk.requrense = "нет";

    this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);

    if (!toBegin) {
      qwest.tasks.push(tsk);
    } else {
      qwest.tasks.unshift(tsk);
    }

    this.sortQwestTasks(qwest);
  }

  chaSorter(): (a: Characteristic, b: Characteristic) => number {
    return (a, b) => {
      // let aHasSame = a.HasSameAbLvl ? 1 : 0;
      // let bHasSame = b.HasSameAbLvl ? 1 : 0;

      // if (aHasSame != bHasSame) {
      //   return -(aHasSame - bHasSame);
      // }

      if (a.value != b.value) {
        return a.value - b.value;
      }

      return a.name.localeCompare(b.name);
    };
  }

  chainGetDateById(id: string): number {
    if (!this.allMap[id].item.date) {
      return new Date(this.allMap[id].link.date).setHours(0, 0, 0, 0);
    } else {
      return new Date(this.allMap[id].item.date).setHours(0, 0, 0, 0);
    }
  }

  chainOrganize(prs: Pers) {
    prs.chainTable = [];
    return;

    if (prs.chainTable == null || prs.chainTable == undefined || prs.chainTable.length == 0) {
      prs.chainTable = [];
    }

    // Удаляем лишние записи
    prs.chainTable = prs.chainTable.filter((n) => n != "end_line" && !this.isNullOrUndefined(this.allMap[n]));

    // Добавляем записи, которых нет в таблице
    for (let i = 0; i < prs.tasks.length; i++) {
      const tsk = prs.tasks[i];

      let inChain = prs.chainTable.find((n) => n == tsk.id);
      if (!inChain) {
        prs.chainTable.unshift(tsk.id);
      }
    }

    let tasksDic = prs.tasks.reduce((acc, el) => {
      acc[el.id] = el;

      return acc;
    }, {});

    // Проставляем индексы
    for (let i = 0; i < prs.chainTable.length; i++) {
      const ch = prs.chainTable[i];

      if (tasksDic[ch]) {
        tasksDic[ch].chainIdx = i;
      }
    }
  }

  changeExpKoef(isPlus: boolean) {
    let changeMinus = 1;
    if (isPlus) {
      let openAbs = this.pers$.value.characteristics.reduce((a, b) => {
        return a + b.abilities.filter((n) => n.value >= 1).length;
      }, 0);
      this.pers$.value.expKoef += changeMinus / (openAbs * 2);
    } else {
      this.pers$.value.expKoef -= changeMinus;
    }
    if (this.pers$.value.expKoef > 0) {
      this.pers$.value.expKoef = 0;
    }
    if (this.pers$.value.expKoef < -2) {
      this.pers$.value.expKoef = -2;
    }
  }

  changeTes(task: Task, isDone: boolean, lastNotDone: boolean, subTasksCoef: number = 1) {
    // Если это первый пропуск, то не минусуем
    // if (!isDone && !lastNotDone) {
    //   return;
    // }

    let change = this.getTaskChangesExp(task, isDone, null, subTasksCoef);

    if (isDone) {
      task.tesValue += change;
    } else {
      task.tesValue -= change;
      if (task.tesValue < 0) {
        task.tesValue = 0;
      }
    }
  }

  changesAfter(isGood, img?: string, tsk?: Task) {
    if (isGood == null) {
      isGood = true;
    }

    this.changes.afterPers = this.changes.getClone(this.pers$.value);
    this.changes.showChanges(this.getCongrantMsg(), this.getFailMsg(), isGood, img, tsk);
  }

  changesBefore() {
    this.changes.beforePers = this.changes.getClone(this.pers$.value);
  }

  checkAndChangeWebP(img: string): string {
    img = img.substr(0, img.lastIndexOf(".")) + ".webp";
    return img;
  }

  /**
   * Проверка даты задачи.
   * @param tDate Дата задачи.
   * @param requrense Повтор задачи.
   */
  checkDate(tDate: Date, requrense: string, weekDays: string[]): any {
    if (requrense === "ежедневно" || requrense === "нет" || requrense === "через 1 день" || requrense === "через 2 дня" || requrense === "через 3 дня") {
      return true;
    }

    let weekDay = tDate.getDay();

    if (requrense === "будни") {
      if (weekDay === 1 || weekDay === 2 || weekDay === 3 || weekDay === 4 || weekDay === 5) {
        return true;
      }
    } else if (requrense === "выходные") {
      if (weekDay === 6 || weekDay === 0) {
        return true;
      }
    } else if (requrense === "дни недели") {
      switch (weekDay) {
        case 1:
          return weekDays.includes("пн");
        case 2:
          return weekDays.includes("вт");
        case 3:
          return weekDays.includes("ср");
        case 4:
          return weekDays.includes("чт");
        case 5:
          return weekDays.includes("пт");
        case 6:
          return weekDays.includes("сб");
        case 0:
          return weekDays.includes("вс");

        default:
          return false;
      }
    } else if (requrense === "пн,ср,пт") {
      if (weekDay === 1 || weekDay === 3 || weekDay === 5) {
        return true;
      }
    } else if (requrense === "вт,чт,сб") {
      if (weekDay === 2 || weekDay === 4 || weekDay === 6) {
        return true;
      }
    } else if (requrense === "пн,вт,чт,сб") {
      if (weekDay === 1 || weekDay === 2 || weekDay === 4 || weekDay === 6) {
        return true;
      }
    } else if (requrense === "не суббота") {
      if (weekDay != 6) {
        return true;
      }
    } else if (requrense === "не воскресенье") {
      if (weekDay != 0) {
        return true;
      }
    }

    return false;
  }

  checkNullOrUndefined(v) {
    if (v == null || v == undefined) {
      return true;
    }

    return false;
  }

  checkQwestAb(qw: Qwest): boolean {
    if (qw.abilitiId) {
      let ab: Ability = this.absMap[qw.abilitiId];
      if (ab) {
        if (ab.value >= 1 && !ab.isNotDoneReqvirements) {
          if (ab.tasks && ab.tasks.length > 0) {
            if (!this.checkTask(ab.tasks[0])) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Проверка задачи - доступна ли она сейчас.
   * @param tsk Задача.
   */
  checkTask(tsk: Task): any {
    let date = new Date(tsk.date).setHours(0, 0, 0, 0);
    let now = new Date();

    // Проверка по дате
    if (now.valueOf() >= date.valueOf()) {
      return true;
    }
  }

  clearDiary() {
    this.pers$.value.Diary = [];
    this.pers$.value.Diary.unshift(new Diary(moment().startOf("day").toDate(), []));
  }

  /**
   * Расчет таблицы для кумулятивных расчетов получения наград.
   */
  countRewProbCumulative(): any {
    let cumulative = 0;
    this.pers$.value.rewards.forEach((r) => {
      cumulative += r.probability / 100;
      r.cumulative = cumulative;
    });
  }

  countToatalRewProb() {
    if (this.pers$.value.rewards.length === 0) {
      this.pers$.value.totalRewardProbability = 0;
    } else {
      this.pers$.value.totalRewardProbability = this.pers$.value.rewards.reduce((prev, cur) => {
        return +prev + +cur.probability;
      }, 0);
    }
  }

  downUbility(tskAbility: Ability) {
    let ab = this.allMap[tskAbility.id].item;
    this.changesBefore();

    var isClosed = false;
    if (GameSettings.isClassicaRPG) {
      for (const tsk of ab.tasks) {
        tsk.value -= 1;
        if (tsk.value <= 0) {
          tsk.value = 0;
          isClosed = true;
        }
      }
    }

    if (isClosed) {
      ab.isOpen = false;

      for (const tsk of ab.tasks) {
        tsk.value = 0;
        tsk.tesValue = 0;
        tsk.tesAbValue = 0;
        tsk.progresNextLevel = 0;
        tsk.progressValue = 0;
        tsk.classicalExp = 0;
      }

      ab.value = 0;
      ab.progressValue = 0;

      // Обновляем дату
      let date = new Date();
      date.setHours(0, 0, 0, 0);
    }

    for (const tsk of ab.tasks) {
      this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);

      tsk.states.forEach((st) => {
        this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);
      });
    }

    setTimeout(() => {
      this.savePers(false);
      this.changesAfter(false, null);
    }, 50);
  }

  /**
   * Удаление навыка по идентификатору.
   * @param id Идентификатор.
   */
  delAbil(id: string): any {
    this.pers$.value.characteristics.forEach((cha) => {
      cha.abilities = cha.abilities.filter((n) => {
        return n.id != id;
      });
    });

    for (const qw of this.pers$.value.qwests) {
      if (qw.abilitiId == id) {
        qw.abilitiId = null;
      }
    }
  }

  /**
   * Удаление награды из инвентаря.
   * @param rev Награда.
   */
  delInventoryItem(rev: Reward): any {
    this.pers$.value.inventory = this.pers$.value.inventory.filter((n) => {
      return n != rev;
    });
  }

  /**
   * Удалить квест.
   * @param id Идентификатор квеста.
   */
  delQwest(id: string): any {
    this.removeParrents(id);
    this.pers$.value.qwests = this.pers$.value.qwests.filter((n) => {
      return n.id != id;
    });
  }

  /**
   * Удаление награды.
   * @param id Идентификатор.
   */
  delReward(id: string): any {
    this.pers$.value.rewards = this.pers$.value.rewards.filter((n) => {
      return n.id != id;
    });
  }

  /**
   * Удаление задачи у навыка.
   * @param abil Навык
   * @param id Идентификатор задачи
   */
  delTask(abil: Ability, id: string): any {
    abil.tasks = abil.tasks.filter((n) => {
      return n.id != id;
    });
  }

  /**
   * Удаление задачи у навыка.
   * @param abil Навык
   * @param id Идентификатор задачи
   */
  delTaskfromQwest(qwest: Qwest, id: string): any {
    qwest.tasks = qwest.tasks.filter((n) => {
      return n.id != id;
    });
  }

  /**
   * Поиск задачи и навыка по идентификатору у персонажа.
   * @param id Идентификатор задачи.
   * @param task Задача, которая будет найдена.
   * @param abil Навык, который будет найден.
   */
  findTaskAnAb(id: string, task: Task, abil: Ability) {
    task = this.allMap[id].item;
    abil = this.allMap[id].link;

    return { task, abil };
  }

  getAbExpPointsFromTes(tesValue: number): number {
    return tesValue;
  }

  getAimString(aimVal: number, aimUnit: string, postfix: string): string {
    if (aimUnit == "Раз" || aimUnit == "Раз чет" || aimUnit == "Раз нечет") {
      let pstf = "✓";
      if (postfix != null && postfix.length > 0) {
        pstf = postfix;
      }

      return "‪" + aimVal + pstf;
    }

    let seconds = aimVal;

    let h = 0;
    let min = 0;
    let sec = 0;

    h = Math.floor(seconds / 3600);
    seconds %= 3600;
    min = Math.floor(seconds / 60);
    sec = seconds % 60;

    let result = "‪";

    if (h > 0) {
      result += h + "ч ";
    }

    if (min > 0 || (h > 0 && sec > 0)) {
      result += min + "м ";
    }

    if (sec > 0 || (h == 0 && min == 0)) {
      result += sec + "с ";
    }

    result = result.trim();

    return result;
  }

  getAimValueWithUnit(aimVal: number, aimUnit: string): number {
    if (aimUnit == "Минут") {
      return aimVal * 60;
    }

    if (aimUnit == "Часов") {
      return aimVal * 60 * 60;
    }

    return aimVal;
  }

  getClassicalAbPoints(persLevel: number, abValTotal: number, prs: Pers, abCount: number): number {
    let gained = persLevel * GameSettings.startAbPoints + GameSettings.startAbPoints;
    let spent = abValTotal;

    return gained - spent;
  }

  getEraCostLvl(curAbLvl: number) {
    //return curAbLvl + 1;
    if (curAbLvl == 0) {
      return 10;
    }
    return curAbLvl;
  }

  getEraCostTotal(curAbLvl: number) {
    let cost = 0;
    for (let i = 0; i < curAbLvl; i++) {
      cost += this.getEraCostLvl(i);
    }

    return cost;
  }

  getExpKoef(isPlus: boolean): number {
    const toRet = Math.pow(2, this.pers$.value.expKoef);

    return toRet;
  }

  getImgPath(num: number, lvl: number): string {
    let result: string = ""; //'assets/img/' + lvl + '/';

    let ss = "000" + num;
    ss = ss.substr(ss.length - 3);

    result += ss; // + '.jpg';

    return result;
  }

  getImgPathRandome(lvl: number, prs: Pers): string {
    let im: number = 0;
    let max: number = 0;

    switch (lvl) {
      case 1:
        max = this.mn1Count;
        break;
      case 2:
        max = this.mn2Count;
        break;
      case 3:
        max = this.mn3Count;
        break;
      case 4:
        max = this.mn4Count;
        break;
      case 5:
        max = this.mn5Count;
        break;
      case 6:
        max = this.mn6Count;
        break;

      default:
        max = this.mn1Count;
        break;
    }

    if (!prs.mnstrCounter) {
      prs.mnstrCounter = 0;
    }
    if (prs.mnstrCounter >= max) {
      prs.mnstrCounter = 0;
    }

    prs.mnstrCounter++;
    im = prs.mnstrCounter;

    //im = this.randomInteger(1, max);

    let result: string = "";

    let ss = "000" + im;
    ss = ss.substr(ss.length - 3);

    result += ss;

    return result;
  }

  getIsSt(tsk: Task): boolean {
    if (tsk.states.length > 0 && tsk.aimCounter == 0 && tsk.aimTimer == 0) {
      return true;
    }

    return false;
  }

  getPers() {
    let prsJson = localStorage.getItem("pers");
    if (prsJson) {
      this.setPers(prsJson);
    } else {
      this.router.navigate(["sync"], {
        queryParams: {
          type: "newGame",
          frome: "/pers/login",
        },
      });
    }
  }

  getPersExpClassical(classicalExpTotal: number, abCount: number): getExpResult {
    let result = new getExpResult();

    result.exp = classicalExpTotal;

    let persLevel = 0;
    let expLvl = 0;

    while (true) {
      result.startExp = expLvl;

      let curLvl = (persLevel + 1) * GameSettings.startAbPoints;
      // let koef = 1 + persLevel * 0.03;
      // curLvl = curLvl * koef;

      expLvl += curLvl;

      result.nextExp = expLvl;

      if (expLvl > result.exp) {
        result.persLevel = persLevel;
        break;
      }

      persLevel++;
    }

    return result;
  }

  getPersExpTES(tesCur: number, abCount: number, expPoints: number, tesMax: number, abTotalCur: number): getExpResult {
    let startExp = 0;
    let persLevel = 0;
    let exp = 0;
    let nextExp = 0;
    let expDirect = 0;

    if (abCount < 10) {
      abCount = 10;
    }

    if (GameSettings.expFotmulaType == "abVal") {
      // По значению навыка
      // tesMax = GameSettings.maxPersLevel * GameSettings.abLvlForPersLvl * 10;
      let progress = tesCur / tesMax;
      exp = GameSettings.maxPersLevel * progress;
      expDirect = exp;
      persLevel = Math.floor(exp);
      startExp = persLevel;
      nextExp = persLevel + 1;
    } else if (GameSettings.expFotmulaType == "abLvl") {
      let max = GameSettings.maxPersLevel * GameSettings.abLvlForPersLvl;

      let progress = abTotalCur / max;

      exp = GameSettings.maxPersLevel * progress;

      expDirect = exp;
      persLevel = Math.floor(exp);
      startExp = persLevel;
      nextExp = persLevel + 1;
    } else if (GameSettings.expFotmulaType == "dynamic") {
      // Динамический расчет
      let tsks: Task[] = [];

      let i = 0;
      let curLvlExp = 0;
      let nextLvlExp = 0;

      while (true) {
        if (i < abCount) {
          let tsk = new Task();
          tsks.push(tsk);
        }

        let total = 0;
        for (const t of tsks) {
          this.changeTes(t, true, false, 1);
          total += t.tesValue;
        }

        if (total > tesCur) {
          nextLvlExp = total;
          break;
        }

        curLvlExp = total;

        i++;
      }

      exp = tesCur;
      expDirect = tesCur;
      persLevel = i;
      startExp = curLvlExp;
      nextExp = nextLvlExp;
    } else if (GameSettings.expFotmulaType == "abLvl2") {
      if (abTotalCur < 2) {
        let progress = abTotalCur / 2;
        exp = 2 * progress;
      } else {
        let max = (GameSettings.maxPersLevel - 2) * GameSettings.abLvlForPersLvl;
        let progress = (abTotalCur - 2) / max;
        exp = 2 + (GameSettings.maxPersLevel - 2) * progress;
      }

      expDirect = exp;
      persLevel = Math.floor(exp);
      startExp = persLevel;
      nextExp = persLevel + 1;
    }

    let result: getExpResult = {
      exp: exp,
      expDirect: expDirect,
      nextExp: nextExp,
      startExp: startExp,
      persLevel: persLevel,
    };

    return result;
  }

  getQwestExpChange(qwHardness: number) {
    let exp = (this.pers$.value.nextExp - this.pers$.value.prevExp) * 10.0;
    let expChange = 0;
    switch (qwHardness) {
      case 1:
        expChange = exp * 0.2;
        break;
      case 2:
        expChange = exp * 0.5;
        break;
      case 3:
        expChange = exp * 1;
        break;
      case 0:
        expChange = 0;
        break;

      default:
        break;
    }
    return expChange;
  }

  getTskValForState(value: number, maxValue: number) {
    let progres = Math.floor(value) / +this.pers$.value.maxAttrLevel;
    let ret = Math.floor(progres * maxValue);
    if (ret < 1) {
      ret = 1;
    }

    return ret;
  }

  /**
   * Получить коефициент - чем реже задача тем больше за нее опыта!
   * @param requrense Повтор задачи.
   */
  getWeekKoef(requrense: string, isPlus: boolean, weekDays: string[]): number {
    let base = 5.0;

    if (requrense === "будни") {
      return 1;
    }
    if (requrense === "выходные") {
      return base / 2.0;
    }
    if (requrense === "ежедневно") {
      return 1;
    }
    if (requrense === "дни недели") {
      let wd = weekDays.length;
      if (wd > base) {
        wd = base;
      }
      if (wd <= 0) {
        wd = 1;
      }

      return base / wd;
    }
    if (isPlus) {
      if (requrense === "через 1 день") {
        return 2;
      }
      if (requrense === "через 2 дня") {
        return 3;
      }
      if (requrense === "через 3 дня") {
        return 4;
      }
    }

    return 1.0;
  }

  hardnessKoef(hardnes: number) {
    if (hardnes <= 1) {
      return 1;
    }
    if (hardnes <= 2) {
      return 100.45454545454547 / 124.25373134328362;
    }
    if (hardnes <= 3) {
      return 100.45454545454547 / 144.4155844155844;
    }
  }

  isNullOrUndefined(ob) {
    if (ob == null || ob == undefined) {
      return true;
    }

    return false;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  normalizeTskAbilityValue(tsk: Task, ab: Ability) {
    if (tsk.tesValue == null || tsk.tesValue == undefined || tsk.tesValue < 0) {
      tsk.tesValue = 0;
    }

    if (tsk.tesAbValue == null || tsk.tesAbValue == undefined || tsk.tesAbValue < 0) {
      tsk.tesAbValue = 0;
    }

    if (tsk.tesValue < 0 || ab.isOpen == false) {
      tsk.tesValue = 0;
    }

    tsk.tesValue = Math.ceil(tsk.tesValue * 1000) / 1000;

    tsk.value = this.getAbVal(tsk.tesValue, ab.isOpen, tsk.value);

    if (tsk.value < 0) {
      tsk.value = 0;
    }
    if (tsk.value > GameSettings.maxAbilLvl) {
      tsk.value = GameSettings.maxAbilLvl;
    }

    ab.value = tsk.value;
  }

  openCharact(id: any) {
    this.router.navigate(["/pers/characteristic", id]);
  }

  openPers() {
    this.router.navigate(["/pers"]);
  }

  openTask(id: any) {
    this.router.navigate(["/pers/task", id, false]);
  }

  randomInteger(min: number, max: number): number {
    // случайное число от min до (max+1)
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }

  /**
   * Обновление всех картинок монстров.
   */
  reImages(prs: Pers) {
    prs.characteristics.forEach((ch) => {
      ch.abilities.forEach((ab) => {
        ab.tasks.forEach((tsk) => {
          this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);
          tsk.states.forEach((st) => {
            this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);
          });
        });
      });
    });

    prs.qwests.forEach((qw) => {
      qw.tasks.forEach((tsk) => {
        this.GetRndEnamy(tsk, prs.level, GameSettings.maxPersLevel);
      });
    });

    this.savePers(false);
  }

  recountRewards(prs: Pers) {
    for (const r of prs.rewards) {
      let notDoneReqs: string[] = [];

      if (!r.reqvirements) {
        r.reqvirements = [];
      }

      if (r.isReward) {
        for (const req of r.reqvirements) {
          if (req.type == ReqItemType.persLvl) {
            reqCheck(prs.level, req, notDoneReqs);
          } else {
            let el = this.allMap[req.elId];
            if (el != null && el.item != null) {
              if (req.type == ReqItemType.qwest) {
                reqCheck(0, req, notDoneReqs);
              } else if (req.type == ReqItemType.abil) {
                let abil: Ability = el.item;
                reqCheck(abil.value, req, notDoneReqs);
              } else if (req.type == ReqItemType.charact) {
                let cha: Characteristic = el.item;
                reqCheck(cha.value, req, notDoneReqs);
              }
            } else {
              req.isDone = true;
            }
          }
        }

        if (notDoneReqs.length) {
          r.isAviable = false;
          r.reqStr = notDoneReqs;
        } else {
          r.isAviable = true;
          r.reqStr = [];
        }
      } else {
        if (r.isShop) {
          if (prs.gold >= r.cost) {
            r.isAviable = true;
          } else {
            r.isAviable = false;
          }
        } else {
          r.isAviable = true;
        }
      }
    }

    function reqCheck(val: number, req: Reqvirement, notDoneReqs: string[]) {
      if (val < req.elVal) {
        notDoneReqs.push(getReqStr(req));
        req.isDone = false;
      } else {
        req.isDone = true;
      }
    }

    function getReqStr(req: Reqvirement) {
      let str = "";

      str += req.type;
      if (req.type != ReqItemType.persLvl) {
        str += ' "' + req.elName + '"';
      }

      if (req.type != ReqItemType.qwest) {
        str += " ≥ " + req.elVal;
      }

      return str;
    }

    prs.rewards = prs.rewards.sort((a, b) => {
      // Награда?
      let aIsRev = isRew(a);
      let bIsRev = isRew(b);
      if (aIsRev != bIsRev) {
        return aIsRev - bIsRev;
      }

      // Количество невыполненных заданий
      let aR = reqNotDone(a);
      let bR = reqNotDone(b);
      if (aR != bR) {
        return aR - bR;
      }

      // Цена
      let aCost = getCostRev(a);
      let bCost = getCostRev(b);
      if (aCost != bCost) {
        return aCost - bCost;
      }

      // Артефакт
      let aArt = isArt(a);
      let bArt = isArt(b);
      if (aArt != bArt) {
        return aArt - bArt;
      }

      // Вероятность получения
      let aProb = getProbRev(a);
      let bProb = getProbRev(b);
      if (aProb != bProb) {
        return aProb - bProb;
      }

      // Название
      return a.name.localeCompare(b.name);

      function getCostRev(r: Reward): number {
        if (!r.isShop) {
          return 99999999;
        }

        return r.cost;
      }

      function getProbRev(r: Reward): number {
        if (!r.isLud) {
          return 99999999;
        }

        return r.ludProbability;
      }

      function reqNotDone(r: Reward) {
        if (!r.reqvirements) {
          return 0;
        }

        return r.reqvirements.filter((q) => !q.isDone).length;
      }

      function isRew(r: Reward): number {
        if (!r.isReward) {
          return 0;
        }

        return 1;
      }

      function isArt(r: Reward) {
        if (!r.isArtefact) {
          return 0;
        }

        return 1;
      }
    });
  }

  returnToAdventure() {
    this.pers$.value.isRest = false;
    for (const ch of this.pers$.value.characteristics) {
      for (const ab of ch.abilities) {
        for (const tsk of ab.tasks) {
          tsk.date = new Date();
          // let tskDate: moment.Moment = moment(tsk.date);
          // if (tskDate.isBefore(moment(new Date()), "d")) {
          //   tsk.date = new Date();
          // }
        }
      }
    }
    this.savePers(false);
  }

  saveGlobalTaskViewState(b: boolean) {
    this.isGlobalTaskView = b;
    this.pers$.value.isGlobalView = b;
  }

  /**
   * Записать персонажа в БД.
   */
  savePers(isShowNotif: boolean, plusOrMinus?, pers?): any {
    let prs: Pers = pers != null ? pers : this.pers$.value;

    prs.dateLastUse = new Date();
    if (prs.gold == null) {
      prs.gold = 0;
    }

    this.getAllMapping(prs);

    let abOpenned = 0;
    let abCount = 0;
    let abTotalMax = 0;
    let tesAbTotalCur = 0;
    let abTotalCur = 0;
    let tesAbTotalMax = 0;
    let abExpPointsTotalCur = 0;
    let classicalExpTotal = 0;
    let abValTotal = 0;

    if (!prs.currentView) {
      prs.currentView = curpersview.SkillTasks;
    }

    let tasks: Task[] = [];

    this.testAbFormula();

    // Переделка картинок
    if (!prs.isWebp) {
      prs.image = this.checkAndChangeWebP(prs.image);
      for (const ch of prs.characteristics) {
        ch.image = this.checkAndChangeWebP(ch.image);
        for (const ab of ch.abilities) {
          ab.image = this.checkAndChangeWebP(ab.image);
        }
      }

      for (const qw of prs.qwests) {
        qw.image = this.checkAndChangeWebP(qw.image);
      }

      prs.isWebp = true;
    }

    for (const ch of prs.characteristics) {
      ch.descr = null;
      let abMax = 0;
      let abCur = 0;
      let tesAbMax = 0;
      let tesAbCur = 0;
      let isHasSameAbil = false;
      let abExpPointsCur = 0;

      for (const ab of ch.abilities) {
        ab.descr = null;
        for (const tsk of ab.tasks) {
          tsk.descr = null;
          this.normalizeTskAbilityValue(tsk, ab);

          if (tsk.autoTime == null) {
            tsk.autoTime = 0;
          }
          if (tsk.counterDone == null) {
            tsk.counterDone = 0;
          }

          abCount += 1;

          if (!tsk.tskWeekDays) {
            tsk.tskWeekDays = [];
          }

          if (tsk.tskWeekDays.length == 0) {
            tsk.tskWeekDays.push("пн");
          }

          if (!tsk.aimUnit) {
            if (tsk.aimCounter > 0) {
              tsk.aimUnit = "Раз";
              tsk.aimTimer = tsk.aimCounter;
              tsk.aimCounter = 0;
            } else {
              tsk.aimUnit = "Минут";
            }
          }

          if (this.isNullOrUndefined(tsk.time)) {
            tsk.time = "00:00";
          }

          tsk.isCounter = false;
          tsk.isTimer = false;

          tsk.plusToNames = [];
          tsk.plusToNames.push(new plusToName(ch.name, ch.id, "/pers/characteristic", ""));

          this.setTaskTittle(tsk, prs.isMegaPlan);

          if (tsk.requrense != "нет" && !true) {
            tsk.plusToNames.unshift(new plusToName("" + tsk.time, null, null, ""));
          }

          this.CheckSetTaskDate(tsk);

          for (const st of tsk.states) {
            st.parrentTask = tsk.id;

            if (st.autoTime == null) {
              st.autoTime = 0;
            }
            if (st.counterDone == null) {
              st.counterDone = 0;
            }

            if (this.isNullOrUndefined(st.time)) {
              st.time = "00:00";
            }

            if (prs.isTES) {
              st.failCounter = 0;
            }
          }

          ab.name = tsk.name;

          // Что навык настроен
          if (tsk.value < 1 && tsk.requrense == "будни" && tsk.aimCounter == 0 && tsk.aimTimer == 0 && tsk.states.length == 0 && tsk.isPerk == false && tsk.hardnes == 1) {
            ab.isNotChanged = true;
          } else {
            ab.isNotChanged = false;
          }

          // Требования
          if (!tsk.reqvirements) {
            tsk.reqvirements = [];
          }

          let doneReq = true;
          for (const req of tsk.reqvirements) {
            if (this.allMap[req.elId]) {
              let abil = this.allMap[req.elId].item;
              if (abil) {
                req.elName = abil.name;
                if (abil.value >= req.elVal) {
                  req.isDone = true;
                } else {
                  req.isDone = false;
                  doneReq = false;
                }
              }
            }
          }

          if (!doneReq) {
            ab.isNotDoneReqvirements = true;
          }

          // Ограничение по макс
          if (tsk.tesValue > GameSettings.tesMaxVal + 9.99) {
            tsk.tesValue = GameSettings.tesMaxVal + 9.99;
          }

          let progressNextLevel = (tsk.tesValue / 10.0 - Math.floor(tsk.tesValue / 10.0)) * 100;
          tsk.progresNextLevel = progressNextLevel;

          if (GameSettings.isCeilProgressBar) {
            let valP = tsk.value;
            tsk.progressValue = (valP / GameSettings.maxAbilLvl) * 100;
            ab.progressValue = tsk.progressValue;
          } else {
            let valP = 1 + tsk.tesValue / 10;
            tsk.progressValue = progressNextLevel;
            ab.progressValue = tsk.progressValue;
          }

          abMax += (GameSettings.maxAbilLvl - 1) * tsk.hardnes;
          abCur += (tsk.value - GameSettings.minAbilLvl >= 0 ? tsk.value - GameSettings.minAbilLvl : 0) * tsk.hardnes;

          if (abMax < (GameSettings.maxAbilLvl - 1) * 1) {
            abMax = (GameSettings.maxAbilLvl - 1) * 1;
          }

          tesAbMax += GameSettings.tesMaxVal;
          tesAbCur += tsk.tesValue;
          abExpPointsCur += this.getAbExpPointsFromTes(tsk.tesValue);

          if (doneReq) {
            tsk.mayUp = true;
          } else {
            tsk.mayUp = false;
          }

          if (!GameSettings.isClassicaRPG && ab.isOpen) {
            tsk.mayUp = false;
          }
          if (tsk.value >= GameSettings.maxAbilLvl) {
            tsk.mayUp = false;
          }

          const rng = new Rangse();

          if (ab.isOpen == false) {
            rng.name = "";
          } else {
            rng.name = tsk.value + "";
            if (GameSettings.changesIsShowPercentageInAb) {
              rng.name += "%";
            }
          }

          ab.rang = rng;

          if (prs.currentView == curpersview.SkillTasks || prs.currentView == curpersview.SkillsSort || prs.currentView == curpersview.SkillsGlobal) {
            if (prs.currentView == curpersview.SkillsSort) {
              if (tsk.value >= 1 || ab.isOpen) {
                if (tsk.states.length > 0 && tsk.isSumStates && !tsk.isStateInTitle && !tsk.isStateRefresh) {
                  for (const st of tsk.states) {
                    if (st.isActive || prs.currentView == curpersview.SkillsSort) {
                      let stT = this.getTaskFromState(tsk, st, false, prs);
                      tasks.push(stT);
                    }
                  }
                } else {
                  tasks.push(tsk);
                }
              }
            } else {
              if (doneReq && (tsk.value >= 1 || ab.isOpen)) {
                if (tsk.states.length > 0 && tsk.isSumStates && !tsk.isStateInTitle && !tsk.isStateRefresh) {
                  if (this.checkTask(tsk)) {
                    for (const st of tsk.states) {
                      if (st.isActive && !st.isDone) {
                        let stT = this.getTaskFromState(tsk, st, false, prs);
                        tasks.push(stT);
                      }
                    }
                  }
                } else {
                  if (this.checkTask(tsk)) {
                    tasks.push(tsk);
                  }
                }
              }
            }
          }

          if (tsk.IsNextLvlSame) {
            isHasSameAbil = true;
          }

          if (tsk.classicalExp == null) {
            tsk.classicalExp = 0;
          }
          classicalExpTotal += tsk.classicalExp;
          abValTotal += this.getTskAccValue(tsk.value) * tsk.hardnes;
        }

        if (ab.isOpen) {
          abOpenned++;
        }
        ch.HasSameAbLvl = isHasSameAbil;
      }

      abTotalMax += abMax;
      tesAbTotalMax += tesAbMax;
      abTotalCur += abCur;
      tesAbTotalCur += tesAbCur;
      abExpPointsTotalCur += abExpPointsCur;

      let chaCeilProgr = this.countCharacteristicValue(ch, abCur, abMax);
      chaCeilProgr = Math.floor(chaCeilProgr);

      const rng = new Rangse();
      rng.val = chaCeilProgr;
      rng.name = chaCeilProgr + "";
      ch.rang = rng;
    }

    prs.characteristics = prs.characteristics.sort(this.chaSorter());

    for (const qw of prs.qwests) {
      qw.descr = null;
      qw.isNoActive = false;
      let totalTasks = 0;
      let doneTasks = 0;

      if (qw.hardnes == null || qw.hardnes == undefined) {
        qw.hardnes = 0;
      }

      if (qw.hardnes != 0) {
        let expChange = this.getQwestExpChange(qw.hardnes);
        qw.exp = Math.ceil(expChange);
      }

      if (qw.parrentId) {
        qw.isNoActive = true;
      }

      if (qw.abilitiId) {
        let abLink = this.allMap[qw.abilitiId];
        if (abLink) {
          abLink.item.tasks[0].plusToNames.push(new plusToName("🔗 " + qw.name, qw.id, "", "qwestTask"));

          for (const st of abLink.item.tasks[0].states) {
            let stt = this.allMap["stt" + st.id];
            if (this.allMap["stt" + st.id]) {
              stt.item.plusToNames.push(new plusToName("🔗 " + qw.name, qw.id, "", "qwestTask"));
            }
          }

          // Квест неактивен, если навык неактивен
          if (!this.checkTask(abLink.item.tasks[0])) {
            qw.isNoActive = true;
          }
        }
      }

      for (const tsk of qw.tasks) {
        totalTasks++;
        if (tsk.isDone) {
          doneTasks++;
        }

        tsk.plusToNames = [];
        tsk.qwestId = qw.id;
        tsk.tittle = tsk.name;
        tsk.plusName = qw.name;
        tsk.plusToNames.push(new plusToName(qw.name, qw.id, "/pers/qwest", ""));
        if (qw.abilitiId) {
          if (this.allMap[qw.abilitiId]) {
            let abLink = this.allMap[qw.abilitiId].item;
            if (abLink) {
              tsk.plusToNames.push(new plusToName("🔗 " + abLink.name, qw.id, "", "abTask"));
            }
          } else {
            qw.abilitiId = null;
          }
        }

        let noDoneStates: taskState[] = [];
        for (const st of tsk.states) {
          if (!st.isDone) {
            noDoneStates.push(st);
          }
        }

        if (prs.currentView == curpersview.QwestSort && !qw.isNoActive && (qw.id == prs.currentQwestId || !prs.currentQwestId)) {
          if (noDoneStates.length > 0 && prs.currentView != curpersview.QwestSort) {
            for (const st of noDoneStates) {
              tasks.push(this.getTaskFromState(tsk, st, false, prs));
              if (!prs.currentQwestId) {
                prs.currentQwestId = qw.id;
              }
            }
          } else {
            if (!tsk.isDone) {
              tasks.push(tsk);
              if (!prs.currentQwestId) {
                prs.currentQwestId = qw.id;
              }
            }
          }
        }

        tsk.states = tsk.states.sort((a, b) => {
          let aIsDone = 0;
          let bIsDone = 0;
          if (a.isDone) {
            aIsDone = 1;
          }
          if (b.isDone) {
            bIsDone = 1;
          }
          return aIsDone - bIsDone;
        });
      }

      if (totalTasks == 0) {
        qw.progressValue = 0;
      } else {
        qw.progressValue = (doneTasks / totalTasks) * 100;
      }

      this.sortQwestTasks(qw);

      if ((prs.currentView == curpersview.QwestTasks || prs.currentView == curpersview.QwestsGlobal) && !qw.isNoActive && totalTasks > 0 && totalTasks != doneTasks) {
        if (this.checkTask(qw.tasks[0])) {
          tasks.push(qw.tasks[0]);
        }
      }
    }

    // let root = prs.qwests.filter((q) => !q.parrentId);
    // .sort((a, b) => {
    //   let aIsDeal = a.name == "Дела" ? 1 : 0;
    //   let bIsDeal = b.name == "Дела" ? 1 : 0;
    //   if (aIsDeal != bIsDeal) {
    //     return aIsDeal - bIsDeal;
    //   }

    //   if (a.progressValue != b.progressValue) {
    //     return a.progressValue - b.progressValue;
    //   }

    //   return a.name.localeCompare(b.name);
    // });

    // let child = prs.qwests
    // .sort((a, b) => {
    //   if (a.progressValue != b.progressValue) {
    //     return a.progressValue - b.progressValue;
    //   }

    //   return a.name.localeCompare(b.name);
    // })
    // .filter((q) => q.parrentId);

    // let ordered: Qwest[] = [];

    // while (root.length > 0) {
    //   let r = root.pop();
    //   let stack: Qwest[] = [];
    //   stack.push(r);
    //   while (stack.length > 0) {
    //     let cur = stack.pop();
    //     ordered.push(cur);
    //     let nextIdx = child.findIndex((n) => n.parrentId == cur.id);
    //     if (nextIdx != -1) {
    //       stack.push(child[nextIdx]);
    //       child.splice(nextIdx, 1);
    //     }
    //   }
    // }

    // ordered = ordered.sort((a, b) => {
    //   return +a.isNoActive - +b.isNoActive;
    // });

    // prs.qwests = ordered;

    prs.Diary = [];

    prs.tasks = tasks;

    if (prs.currentView == curpersview.SkillTasks || prs.currentView == curpersview.SkillsSort || prs.currentView == curpersview.SkillsGlobal) {
      this.chainOrganize(prs);

      this.sortPersTasks(prs);
    }

    if (prs.currentQwestId && prs.currentView == curpersview.QwestTasks && tasks.length) {
      let curQwestTask = tasks.find((q) => q.qwestId == prs.currentQwestId);
      if (curQwestTask) {
        let idx = tasks.indexOf(curQwestTask);
        this.setCurInd(idx);
      }
    }

    // Если есть вчерашние задачи
    if ((prs.currentView == curpersview.SkillTasks || prs.currentView == curpersview.SkillsGlobal) && prs.tasks != null && prs.tasks[0] != null) {
      let firstTsk = prs.tasks[0];
      let today = moment().startOf("day");
      let firstTaskDate = moment(firstTsk.date).startOf("day");

      if (firstTaskDate.isBefore(today)) {
        prs.tasks = prs.tasks.filter((q) => {
          if (moment(q.date).startOf("day").isSameOrBefore(firstTaskDate)) {
            return true;
          }

          return false;
        });
      }
    }

    this.setCurPersTask(prs);

    let expResult: getExpResult;
    if (!GameSettings.isClassicaRPG) {
      expResult = this.getPersExpTES(tesAbTotalCur, abCount, abExpPointsTotalCur, tesAbTotalMax, abTotalCur);
    } else {
      expResult = this.getPersExpClassical(classicalExpTotal, abCount);
    }

    let ons: number = 0;
    if (!GameSettings.isClassicaRPG) {
      ons = this.getTESAbPoints(abCount, expResult.persLevel, abOpenned, prs);
    } else {
      ons = this.getClassicalAbPoints(expResult.persLevel, abValTotal, prs, abCount);
    }

    let prevPersLevel = prs.level;
    prs.level = Math.floor(expResult.persLevel);
    prs.prevExp = expResult.startExp;
    prs.nextExp = expResult.nextExp;
    prs.ON = ons;
    prs.exp = expResult.exp;
    prs.totalProgress = (prs.level / GameSettings.maxPersLevel) * 100;

    let stage = (prs.level / GameSettings.maxPersLevel) * (GameSettings.rangsCount - 1);
    if (stage > GameSettings.rangsCount - 1) {
      stage = GameSettings.rangsCount - 1;
    }
    let rangStartProgress = Math.floor(stage);
    let rangProgress = stage - rangStartProgress;

    if (prs.level >= GameSettings.maxPersLevel) {
      rangProgress = 1;
    }
    prs.rangProgress = rangProgress * 100;

    let lvlExp = expResult.nextExp - expResult.startExp;
    let progr = 0;

    if (lvlExp != 0) {
      progr = (prs.exp - expResult.startExp) / lvlExp;
    }
    prs.progressValue = progr * 100;

    // prs.exp = prs.exp - startExp;
    prs.nextExp = prs.nextExp;
    prs.prevExp = prs.prevExp;
    // prs.expDirect = expDirect;

    this.recountAbilMayUp(prs);

    let thisMonstersLevel = this.getMonsterLevel(prs.level, GameSettings.maxPersLevel);

    let prevMonstersLevel = thisMonstersLevel;

    if (prevPersLevel != prs.level) {
      prevMonstersLevel = this.getMonsterLevel(prevPersLevel, GameSettings.maxPersLevel);
    }

    // Апдэйт картинок
    if (prevMonstersLevel != thisMonstersLevel) {
      this.updateQwestTasksImages(prs);
      // this.updateAbTasksImages(prs);
    }

    // Награды
    this.recountRewards(prs);

    // Автополучение наград
    let addedIds = [];
    let addedRevs: Reward[] = [];
    for (const rev of prs.rewards) {
      if (rev.isReward && rev.isAviable) {
        addedRevs.push(rev);
        addedIds.push(rev.id);
      }
    }

    for (const rev of addedRevs) {
      this.addToInventory(rev, prs);
    }

    if (addedIds.length) {
      prs.rewards = prs.rewards.filter((r) => !addedIds.includes(r.id));
    }

    // Расчет золота задач
    const baseGold = 1;
    for (const ch of prs.characteristics) {
      for (const ab of ch.abilities) {
        for (const tsk of ab.tasks) {
          let weekKoef = this.getWeekKoef(tsk.requrense, true, tsk.tskWeekDays);
          let tskLvl = tsk.value;
          let subTasksKoef = 1;

          if (tsk.isSumStates && tsk.states.length > 0) {
            subTasksKoef = tsk.states.filter((n) => n.isActive).length;
          }

          tsk.plusExp = (baseGold * tskLvl * weekKoef) / subTasksKoef;
        }
      }
    }

    for (const qw of prs.qwests) {
      for (const tsk of prs.tasks) {
        tsk.plusExp = baseGold;
      }
    }

    // Ранг
    let persRang = Math.floor(prs.level / 10);
    if (persRang > GameSettings.rangsCount - 1) {
      persRang = GameSettings.rangsCount - 1;
    }
    prs.rangName = Pers.rangNames[persRang];

    localStorage.setItem("isOffline", JSON.stringify(true));
    localStorage.setItem("pers", JSON.stringify(prs));

    this.pers$.next(prs);

    if (prs.currentView == curpersview.QwestTasks && prs.tasks.length == 0) {
      prs.currentView = curpersview.QwestsGlobal;
      this.savePers(false);
    } else if (prs.currentView == curpersview.QwestsGlobal && prs.tasks.length == 0) {
      prs.currentView = curpersview.SkillTasks;
      this.savePers(false);
    }

    this.currentView$.next(prs.currentView);
    this.currentTask$.next(prs.currentTask);
  }

  setCurInd(i: number): any {
    const pers = this.pers$.value;

    const tasks = pers.tasks;

    if (tasks.length - 1 < i) {
      i = tasks.length - 1;
    }

    this.pers$.value.currentTaskIndex = i;
    this.pers$.value.currentTask = tasks[i];

    if (this.pers$.value.currentTask && this.pers$.value.currentTask.qwestId) {
      this.pers$.value.currentQwestId = this.pers$.value.currentTask.qwestId;
    }

    this.currentTask$.next(this.pers$.value.currentTask);
  }

  setLearningPers(userId) {
    let sp = new SamplePers();
    let samplePers: Pers = JSON.parse(sp.prsjson);
    samplePers.userId = userId;
    samplePers.id = userId;
    samplePers.isOffline = true;
    for (const ch of samplePers.characteristics) {
      ch.startRang = { val: 0, name: "0", img: "" };
    }

    this.setPers(JSON.stringify(samplePers));
  }

  setPers(data: string) {
    let prs: Pers = JSON.parse(data);
    prs.isWriteTime = false;

    prs.currentView = curpersview.SkillTasks;

    if (prs.tasks && prs.tasks.length > 0) {
      prs.currentTaskIndex = 0;
      prs.currentTask = prs.tasks[0];
    }

    this.checkPersNewFields(prs);

    this.savePers(false, undefined, prs);
  }

  setStatesNotDone(tsk: Task) {
    for (let i = 0; i < tsk.states.length; i++) {
      const element = tsk.states[i];
      element.isDone = false;
      element.isActive = false;
    }
  }

  /**
   * Задать следующую дату задачи и время выполнения.
   * @param tsk Задача.
   */
  setTaskNextDate(tsk: Task, isPlus: boolean) {
    let td = new Date(tsk.date);
    let tdDate = new Date(tsk.date);
    tdDate.setHours(0, 0, 0, 0);

    // Задаем следующий день
    if (isPlus) {
      if (tsk.requrense == "через 1 день") {
        td.setDate(td.getDate() + 2);
      } else if (tsk.requrense == "через 2 дня") {
        td.setDate(td.getDate() + 3);
      } else if (tsk.requrense == "через 3 дня") {
        td.setDate(td.getDate() + 4);
      } else {
        td.setDate(td.getDate() + 1);
      }
    } else {
      td.setDate(td.getDate() + 1);
    }

    tsk.date = td;

    // Задаем время выполнения для сортировки
    tsk.timeForSort = Date.now().valueOf() - tdDate.valueOf();

    // Все состояния делаем невыполненными
    if (tsk.states.length > 0 && tsk.isSumStates) {
      for (let i = 0; i < tsk.states.length; i++) {
        tsk.states[i].isDone = false;
      }
    }
  }

  /**
   * Установить "порядок" для автосортировки.
   * @param task Задача
   * @param isPlus Нажат плюс?
   * @param isToEnd В конец списка?
   */
  setTaskOrder(task: Task, isPlus: boolean, isToEnd: boolean) {
    if (isToEnd) {
      task.order = this.pers$.value.curEndOfListSeq;
      this.pers$.value.curEndOfListSeq++;
    } else {
      let dt = new Date(task.date).setHours(0, 0, 0, 0);
      let now = new Date().setHours(0, 0, 0, 0);
      // Если дата задачи - вчера
      if (dt.valueOf() < now.valueOf()) {
        task.order = this.pers$.value.prevOrderSeq;
        this.pers$.value.prevOrderSeq++;
      }
      // Если сегодня
      else {
        task.order = this.pers$.value.curOrderSeq;
        this.pers$.value.curOrderSeq++;
      }
    }
  }

  showAbility(ab: Ability) {
    let tsk = ab.tasks[0];
    if (tsk) {
      this.router.navigate(["/pers/task", tsk.id, false]);
    }
  }

  showTask(tsk: Task) {
    if (tsk) {
      this.router.navigate(["/pers/task", tsk.id, false]);
    }
  }

  sortPersTasks(prs: Pers) {
    prs.tasks = prs.tasks.sort((a, b) => {
      // Квесты не сортируем
      if (a.requrense === "нет" && b.requrense === "нет") {
        return 0;
      }

      // По типу
      let aType = a.requrense === "нет" ? 0 : 1;
      let bType = b.requrense === "нет" ? 0 : 1;

      if (aType != bType) {
        return -(aType - bType);
      }

      if (prs.currentView != curpersview.SkillsSort) {
        let aDate = moment(a.date).startOf("day");
        let bDate = moment(b.date).startOf("day");

        // По дате
        if (!aDate.isSame(bDate)) {
          return aDate.valueOf() - bDate.valueOf();
        }
      }

      // По Order
      if (!a.order) {
        a.order = 0;
      }
      if (!b.order) {
        b.order = 0;
      }
      return a.order - b.order;
    });
  }

  subtaskDoneOrFail(taskId: string, subtaskId: string, isDone: boolean) {
    let tsk: Task = this.allMap[taskId].item;
    let subTask: taskState = this.allMap[subtaskId].item;
    let activeSubtasksCount = tsk.states.filter((n) => n.isActive).length;

    // Изменяем значение
    if (!GameSettings.isClassicaRPG) {
      this.changeTes(tsk, isDone, subTask.lastNotDone, activeSubtasksCount);
    } else {
      this.changeClassical(tsk, isDone, activeSubtasksCount);
    }

    subTask.lastDate = new Date().getTime();
    subTask.secondsDone = 0;
    subTask.counterDone = 0;

    if (this.isNullOrUndefined(subTask.failCounter)) {
      subTask.failCounter = 0;
    }

    if (isDone) {
      this.CasinoRevards(tsk);
      this.CasinoGold(tsk.plusExp);
    }

    if (isDone) {
      subTask.lastNotDone = false;
      subTask.isDone = true;
      subTask.failCounter = 0;
    } else {
      subTask.lastNotDone = true;
      subTask.isDone = false;
      subTask.failCounter++;
    }

    subTask.isDone = true;

    let allIsDone = tsk.states.filter((n) => n.isActive && !n.isDone).length;

    if (allIsDone == 0) {
      this.setTaskNextDate(tsk, isDone);
      this.setStatesNotDone(tsk);
    }

    this.setCurInd(0);
  }

  /**
   * Клик минус по задаче.
   * @param id Идентификатор задачи.
   */
  taskMinus(id: string, notClearTosts?: boolean) {
    // Находим задачу
    let tsk: Task;
    let abil: Ability;

    ({ task: tsk, abil } = this.findTaskAnAb(id, tsk, abil));
    if (tsk) {
      // Минусуем значение
      if (!GameSettings.isClassicaRPG) {
        this.changeTes(tsk, false, tsk.lastNotDone);
      } else {
        this.changeClassical(tsk, false, 1);
      }

      tsk.lastDate = new Date().getTime();
      tsk.counterValue = 0;
      tsk.timerValue = 0;
      if (this.isNullOrUndefined(tsk.failCounter)) {
        tsk.failCounter = 0;
      }

      // Следующая дата
      this.setTaskNextDate(tsk, false);
      this.setStatesNotDone(tsk);

      tsk.lastNotDone = true;

      for (const st of tsk.states) {
        st.secondsDone = 0;
        st.counterDone = 0;
      }
      tsk.secondsDone = 0;
      tsk.counterDone = 0;
      tsk.failCounter++;

      this.setCurInd(0);
      this.changeExpKoef(false);

      return "навык";
    }
  }

  /**
   * Клик плюс по задаче.
   * @param id Идентификатор задачи.
   */
  taskPlus(id: string) {
    let tsk: Task = this.allMap[id].item;
    tsk.lastDate = new Date().getTime();

    if (tsk.requrense != "нет") {
      let tsk: Task;
      let abil: Ability;
      ({ task: tsk, abil } = this.findTaskAnAb(id, tsk, abil));
      if (tsk) {
        // Плюсуем значение
        if (!GameSettings.isClassicaRPG) {
          this.changeTes(tsk, true, tsk.lastNotDone);
        } else {
          this.changeClassical(tsk, true, 1);
        }

        tsk.counterValue = 0;
        tsk.timerValue = 0;
        tsk.failCounter = 0;

        // Разыгрываем награды
        this.CasinoRevards(tsk);

        // Золото
        this.CasinoGold(tsk.plusExp);

        // Счетчик обновлений стейтов
        if (tsk.isStateRefresh) {
          if (tsk.refreshCounter == null || tsk.refreshCounter == undefined) {
            tsk.refreshCounter = 0;
          } else {
            tsk.refreshCounter++;
          }
        }

        // Следующая дата
        this.setTaskNextDate(tsk, true);
        this.setStatesNotDone(tsk);

        tsk.secondsDone = 0;
        tsk.counterDone = 0;
        tsk.lastNotDone = false;

        for (const st of tsk.states) {
          st.secondsDone = 0;
          st.counterDone = 0;
        }

        this.setCurInd(0);
        this.changeExpKoef(true);

        return "навык";
      }
    } else {
      let qw: Qwest = this.allMap[id].link;
      this.pers$.value.currentQwestId = qw.id;

      if (tsk) {
        if (qw.name == "Дела") {
          qw.tasks = qw.tasks.filter((n) => n.id != id);
        } else {
          tsk.isDone = true;
        }
        if (this.pers$.value.currentView == curpersview.QwestTasks) {
          this.setCurInd(0);
        }

        // Золото
        this.CasinoGold(tsk.plusExp);

        return "квест";
      }
    }
  }

  tesTaskTittleCount(progr: number, aimVal: number, oneOrMore: boolean, aimUnit: string, aimDone?: number, isEven?: boolean) {
    if (aimVal < 0) {
      aimVal = aimVal - 1;
    }

    let av = this.getAimValueWithUnit(Math.abs(aimVal), aimUnit);

    let pr = progr * av;
    let value = Math.round(pr);

    if (oneOrMore) {
      if (value < 1) {
        value = 1;
      }
    }

    if (value > av) {
      value = av;
    }

    if (aimUnit == "Раз чет") {
      value = 2 * Math.ceil(value / 2);
      if (value < 2) value = 2;
    }

    if (aimUnit == "Раз нечет") {
      value = 2 * Math.ceil(value / 2) - 1;
      if (value < 1) value = 1;
    }

    if (aimVal < 0) {
      value = av - value;
    }

    if (aimDone != null && aimDone != 0) {
      value = Math.round(value - aimDone);
    }

    if (value < 0) {
      value = 0;
    }

    return value;
  }

  testAbFormula() {
    // Тест опыта
    // let tsks: Task[] = [];
    // for (let i = 0; i < GameSettings.startAbPoints; i++) {
    //     let tsk = new Task();
    //     tsks.push(tsk);
    // }
    // let vals: number[] = [];
    // for (let i = 1; i <= 100; i++) {
    //   if (i >= 2 && i <= 29) {
    //     let tsk = new Task();
    //     tsks.push(tsk);
    //   }
    //   let total = 0;
    //   for (const t of tsks) {
    //     let before = t.tesValue;
    //     this.changeTes(t, true, 1);
    //     total += (t.tesValue - before) / 10;
    //   }
    //   vals.push(total);
    // }
    // let tsksV = tsks.reduce((a, b) => a + b.tesValue / 10, 0);
    // debugger;
    // Тест прокачки навыка
    // let tsk = new Task();
    // tsk.name = "test";
    // tsk.tesValue = 0;
    // let day = 0;
    // let perc50 = 0;
    // let perc100 = 0;
    // let prevAbVal = GameSettings.minAbilLvl;
    // let prevDay = 0;
    // while (true) {
    //   this.changeTes(tsk, true, false, 1);
    //   day++;
    //   tsk.tesValue = Math.ceil(tsk.tesValue * 1000) / 1000;
    //   const abVal = this.getAbVal(tsk.tesValue, true);
    //   if (abVal != prevAbVal) {
    //     console.log(day - prevDay);
    //     prevAbVal = abVal;
    //     prevDay = day;
    //   }
    //   if (abVal >= GameSettings.maxAbilLvl / 2 && perc50 == 0) {
    //     perc50 = day;
    //   }
    //   if (abVal >= GameSettings.maxAbilLvl) {
    //     perc100 = day;
    //     break;
    //   }
    // }
    // debugger;
  }

  upAbility(ab: Ability, isFromMain: boolean = false) {
    this.changesBefore();

    let wasOpen = ab.isOpen;

    if (!ab.isOpen) {
      ab.isOpen = true;

      // Обновляем дату
      let date = new Date();
      date.setHours(0, 0, 0, 0);

      for (const tsk of ab.tasks) {
        tsk.date = date;
        tsk.order = GameSettings.tskOrderDefault;
        this.CheckSetTaskDate(tsk);

        tsk.states.forEach((el) => {
          el.isDone = false;
          el.order = GameSettings.tskOrderDefault;
        });
      }
    }

    if (GameSettings.isClassicaRPG) {
      for (const tsk of ab.tasks) {
        tsk.value += 1;
      }
    }

    for (const tsk of ab.tasks) {
      this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);

      tsk.states.forEach((st) => {
        this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);
      });
    }

    // if (GameSettings.isOpenAbWhenActivate && !wasOpen && !GameSettings.isClassicaRPG) {
    //   this.router.navigate(["pers/task", ab.tasks[0].id, true], { queryParams: { isQuick: true, isActivate: true, isFromMain: isFromMain } });
    // }

    if (GameSettings.isOpenAbWhenActivate && !wasOpen && isFromMain) {
      this.router.navigate(["pers/task", ab.tasks[0].id, false], { queryParams: { isQuick: true, isActivate: true, isFromMain: false } });
    }

    let tsk = ab.tasks[0];
    if (!isFromMain) {
      tsk = null;
    }

    setTimeout(() => {
      this.savePers(false);
      this.changesAfter(true, null, tsk);
    }, 50);
  }

  upQwest(tskId: string) {
    let qwest = this.allMap[tskId].link;
    let qwId = qwest.id;
    this.pers$.value.currentQwestId = qwId;

    const index = this.pers$.value.qwests.findIndex((qw) => qw.id === qwId);
    if (index !== -1) {
      this.pers$.value.qwests.unshift(this.pers$.value.qwests.splice(index, 1)[0]);
    }
  }

  updateAbTasksImages(prs: Pers) {
    for (const ch of prs.characteristics) {
      for (const ab of ch.abilities) {
        for (const tsk of ab.tasks) {
          this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);
          for (const st of tsk.states) {
            this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), GameSettings.maxPersLevel);
          }
        }
      }
    }
  }

  updateQwestTasksImages(prs: Pers) {
    for (const qwest of prs.qwests) {
      for (const tsk of qwest.tasks) {
        this.GetRndEnamy(tsk, prs.level, GameSettings.maxPersLevel);
        for (const sub of tsk.states) {
          this.GetRndEnamy(sub, prs.level, GameSettings.maxPersLevel);
        }
      }
    }
  }

  /**
   * Розыгрыш наград.
   */
  private CasinoRevards(task: Task) {
    let revards = this.pers$.value.rewards.filter((q) => q.isLud && q.ludProbability > 0 && !q.isReward);

    if (!revards.length) {
      return;
    }

    for (const rev of revards) {
      let rnd = Math.random() * 100;
      if (rnd <= rev.ludProbability) {
        this.addToInventory(rev);
      }
    }
  }

  private getTskAccValue(v: number): number {
    if (v <= 0) {
      return 0;
    }

    return (v * (v + 1)) / 2;
  }

  private changeClassical(tsk: Task, isDone: boolean, activeSubtasksCount: number) {
    let koef = this.getWeekKoef(tsk.requrense, isDone, tsk.tskWeekDays) * this.getTskAccValue(tsk.value);

    koef = koef / activeSubtasksCount;
    if (tsk.classicalExp == null) {
      tsk.classicalExp = 0;
    }
    if (isDone) {
      tsk.classicalExp += 1 * koef * tsk.hardnes;
    } else {
      tsk.classicalExp -= 2 * koef * tsk.hardnes;
    }
  }

  /**
   * Проверка полей персонажа (вдруг новые появились).
   * @param prs Персонаж.
   */
  private checkPersNewFields(prs: Pers) {
    if (!prs.rangName) {
      prs.rangName = "обыватель";
    }

    if (prs.expKoef == undefined || prs.expKoef == null) {
      prs.expKoef = 0;
    }

    if (!prs.image) {
      prs.image = prs.rang.img;
    }

    if (!prs.qwests) {
      prs.qwests = [];
    }

    // Настройки
    // prs.isTES = false;
    prs.isEra = false;
    prs.isOneLevOneCrist = false;
    prs.isEqLvlUp = true;
    prs.isNoExpShow = true;
    prs.isMax5 = false;
    prs.isNoAbs = false;
    prs.isNoDiary = true;
    prs.isTES = true;
    prs.isAutoPumping = false;
    prs.isAutofocus = false;
    prs.Diary = [];
  }

  private countCharacteristicValue(ch: Characteristic, abCur: number, abMax: number) {
    const start = ch.startRang.val + GameSettings.minChaLvl;
    let left = GameSettings.maxChaLvl - start;
    if (abMax == 0) {
      abMax = 1;
    }
    let progr = abCur / abMax;
    ch.value = start + left * progr;

    let chaCeilProgr;
    if (GameSettings.isCeilProgressInList) {
      chaCeilProgr = Math.floor(ch.value);
      ch.progressValue = (chaCeilProgr / GameSettings.maxChaLvl) * 100;
    } else {
      chaCeilProgr = ch.value;
    }

    ch.progresNextLevel = (ch.value - chaCeilProgr) * 100;
    if (chaCeilProgr >= GameSettings.maxChaLvl) {
      ch.progresNextLevel = 100;
    }

    if (!GameSettings.isCeilProgressBar) {
      ch.progressValue = ch.progresNextLevel;
    }

    return chaCeilProgr;
  }

  private countPersLevelAndOns(abTotalMax: number, prevOn: number, startExp: number, exp: number, ons: number, nextExp: number, prs: Pers, persLevel: number) {
    let hasPersLevel = false;
    let hasMaxLevel = true;
    let levels: number = 100;
    let xp_for_first_level: number = 1.0;
    let xp_for_last_level: number = 5.0;
    let B: number = Math.log(xp_for_last_level / xp_for_first_level) / (levels - 1);
    let A: number = xp_for_first_level / (Math.exp(B) - 1.0);

    let numLevel = 0;
    do {
      const i = numLevel + 1;

      let old_xp: number = A * Math.exp(B * (i - 1));
      let new_xp: number = A * Math.exp(B * i);

      const round = abTotalMax * (i / 100);
      let thisLevel = Math.ceil(round - prevOn);
      if (thisLevel <= 0) {
        thisLevel = 1;
      }

      prevOn += thisLevel;
      if (!hasPersLevel) {
        startExp = exp;
        ons += thisLevel;
        let multiplicator = new_xp - old_xp;
        exp += ons * multiplicator;
        nextExp = exp;
        if (exp > prs.exp) {
          hasPersLevel = true;
          persLevel = numLevel;
        }
      }

      numLevel++;
    } while (!hasPersLevel || !hasMaxLevel);
    return { prevOn, startExp, exp, ons, nextExp, persLevel };
  }

  private filterRevs(revType: any) {
    return this.pers$.value.rewards.filter((n) => n.rare == revType);
  }

  private getAbVal(tesVal: number, isOpen: boolean, tskValue: number): number {
    if (!GameSettings.isClassicaRPG) {
      let val = Math.floor(tesVal / 10.0);

      if (isOpen) {
        val = val + GameSettings.minAbilLvl;
      }

      return val;
    } else {
      if (!isOpen) {
        return 0;
      }

      return tskValue;
    }
  }

  private getAllMapping(prs: Pers) {
    let allMap = {};

    for (const ch of prs.characteristics) {
      allMap[ch.id] = {};
      allMap[ch.id].item = ch;
      allMap[ch.id].link = null;

      for (const ab of ch.abilities) {
        allMap[ab.id] = {};
        allMap[ab.id].item = ab;
        allMap[ab.id].link = ch;

        for (const tsk of ab.tasks) {
          allMap[tsk.id] = {};
          allMap[tsk.id].item = tsk;
          allMap[tsk.id].link = ab;

          for (const st of tsk.states) {
            allMap[st.id] = {};
            allMap[st.id].item = st;
            allMap[st.id].link = tsk;
          }
        }
      }
    }
    for (const qw of prs.qwests) {
      allMap[qw.id] = {};
      allMap[qw.id].item = qw;
      allMap[qw.id].link = null;
      for (const tsk of qw.tasks) {
        allMap[tsk.id] = {};
        allMap[tsk.id].item = tsk;
        allMap[tsk.id].link = qw;
        for (const st of tsk.states) {
          allMap[st.id] = {};
          allMap[st.id].item = st;
          allMap[st.id].link = tsk;
        }
      }
    }

    this.allMap = allMap;
  }

  private getCongrantMsg() {
    return Pers.Inspirations[Math.floor(Math.random() * Pers.Inspirations.length)] + ", " + this.pers$.value.name + "!";
  }

  private getCurRang(val: number) {
    if (val > this.pers$.value.maxAttrLevel) {
      val = this.pers$.value.maxAttrLevel;
    }
    const rng = new Rangse();
    let vl = Math.floor(val);
    let vlName = "" + Math.floor(val);
    rng.val = vl;
    rng.name = vlName;
    return rng;
  }

  private getFailMsg() {
    return Pers.Abuses[Math.floor(Math.random() * Pers.Abuses.length)] + ", " + this.pers$.value.name + "!";
  }

  private getMaxTes() {
    return this.pers$.value.maxAttrLevel - 1;
  }

  private getMonsterLevel(prsLvl: number, maxLevel: number): number {
    if (prsLvl < 20) {
      return 1;
    }
    if (prsLvl < 40) {
      return 2;
    }
    if (prsLvl < 60) {
      return 3;
    }
    if (prsLvl < 80) {
      return 4;
    }
    if (prsLvl < 100) {
      return 5;
    }

    return 6;

    // let stage = (prsLvl / GameSettings.maxPersLevel) * (GameSettings.rangsCount - 1);
    // stage = Math.floor(stage) + 1;

    // if (stage > GameSettings.rangsCount) {
    //   stage = GameSettings.rangsCount;
    // }

    // return stage;
  }

  private getPlusState(tsk: Task, progr: number, progrSt: number, isCur: boolean) {
    let plusState = "";
    // Состояния
    if (tsk.states.length > 0) {
      let stateInd = this.tesTaskTittleCount(progrSt, tsk.states.length - 1, false, "State");

      stateInd = stateInd;
      let statePostfix = tsk.postfix;
      if (tsk.aimTimer != null && tsk.aimTimer > 0) {
        statePostfix = "";
      }

      if (tsk.isStateRefresh) {
        if (tsk.refreshCounter == null && tsk.refreshCounter == undefined) {
          tsk.refreshCounter = 0;
        }
        let cVal = tsk.refreshCounter % tsk.states.length;
        let el = tsk.states[cVal].name;

        if (el) {
          el += statePostfix;

          plusState += el;
        }
      } else {
        if (tsk.isSumStates) {
          if (tsk.aimCounter > 0 || tsk.aimTimer > 0) {
            stateInd = tsk.states.length - 1;
          }
          let plus = [];
          for (let q = 0; q <= stateInd; q++) {
            let el = tsk.states[q];

            plus.push(el.name + statePostfix);
          }

          plusState += plus.join("; ");
        } else {
          plusState += tsk.states[stateInd].name + statePostfix;
        }
      }

      let index = stateInd;

      if (index >= 0) {
        for (let i = 0; i < tsk.states.length; i++) {
          const el = tsk.states[i];
          if (i <= index || tsk.isStateRefresh || tsk.isPerk) {
            el.isActive = true;
          } else {
            el.isActive = false;
          }
        }
      }
    }

    // Таймер, счетчик
    if (tsk.aimTimer != 0) {
      let aimDone = 0;
      if (isCur && !this.isCounterAim(tsk)) {
        aimDone = tsk.secondsDone;
      } else if (isCur && this.isCounterAim(tsk)) {
        aimDone = tsk.counterDone;
      }

      plusState += " " + this.getAimString(this.tesTaskTittleCount(progr, tsk.aimTimer, true, tsk.aimUnit, aimDone, tsk.isEven), tsk.aimUnit, tsk.postfix);
    }

    return plusState;
  }

  public isCounterAim(tsk: Task) {
    return tsk.aimUnit == "Раз" || tsk.aimUnit == "Раз чет" || tsk.aimUnit == "Раз нечет";
  }

  private getProgrForTittle(nextAbVal: number, tskVal: number, isPerk: boolean, isMegaPlan: boolean, isState: boolean) {
    tskVal = tskVal + GameSettings.plusAbProgrForTitle;
    let progr;

    if (!isState) {
      progr = tskVal / GameSettings.maxAbilLvl;
      let min = 1 / GameSettings.maxAbilLvl;
      if (progr < min) {
        progr = min;
      }
    } else {
      progr = (tskVal - 1) / (GameSettings.maxAbilLvl - 1);
      if (progr < 0) {
        progr = 0;
      }
    }

    if (progr > 1) {
      progr = 1;
    }

    if (isPerk || isMegaPlan) {
      progr = 1;
    }

    return Math.round(progr * 100) / 100;
  }

  private getSubtaskExpChange(tsk: Task, isDone: boolean, subTask: taskState) {
    let activeSubtasksCount = tsk.states.filter((n) => n.isActive).length;
    let expChange = this.getTaskChangesExp(tsk, isDone, subTask, activeSubtasksCount);

    expChange = expChange;

    return expChange;
  }

  private getTESAbPoints(abCount: number, persLevel: number, abOpenned: number, prs: Pers) {
    let ons = 0;
    let abs = abCount;

    if (abs < 1) {
      abs = 1;
    }

    let gainedOns = persLevel;

    let startOn = GameSettings.startAbPoints;

    const totalGained = startOn + gainedOns;

    ons = totalGained - abOpenned * 1;
    if (startOn + gainedOns > abs) {
      ons = 0;
    }

    prs.mayAddAbils = totalGained - abCount * 1 >= 1;

    if (ons < 0) {
      ons = 0;
    }

    return ons;
  }

  private getTaskChangesExp(task: Task, isPlus: boolean, subTask: taskState = null, subTasksCoef: number = 1, isChangeAb: boolean = false) {
    let koef = this.getWeekKoef(task.requrense, isPlus, task.tskWeekDays);

    // При пропуске учитывается количество пропусков задачи
    // if (!isPlus && task.failCounter > 0) {
    //   koef = koef * (task.failCounter + 1);
    // }

    // При пропуске штраф больше в 2 раза
    // if (!isPlus) {
    //   koef = koef * 2;
    // }

    if (isChangeAb) {
      subTasksCoef = subTasksCoef * task.hardnes;
    }

    let chVal = (this.baseTaskPoints / subTasksCoef) * koef;

    if (task.tesAbValue == null || task.tesAbValue == undefined) {
      task.tesAbValue = 0;
    }

    // Расчет для ТЕС
    let change = 0;
    let tesVal;

    if (isChangeAb) {
      tesVal = task.tesAbValue;
    } else {
      tesVal = task.tesValue;
    }

    while (true) {
      let tesKoef = GameSettings.getTesChangeKoef(tesVal);

      let tesLeft = 1;
      if (isPlus) {
        tesLeft = Math.floor(tesVal) + 1 - tesVal;
      } else {
        tesLeft = tesVal - Math.floor(tesVal);
      }

      let ch: number = 0;
      if (chVal * tesKoef > tesLeft) {
        ch = tesLeft / tesKoef;
        if (ch < 0.01) {
          ch = 0.01;
        }
      } else {
        ch = chVal;
      }

      change += ch * tesKoef;

      if (!isChangeAb) {
        if (isPlus) {
          tesVal = task.tesValue + change;
        } else {
          tesVal = task.tesValue - change;
        }
      } else {
        if (isPlus) {
          tesVal = task.tesAbValue + change;
        } else {
          tesVal = task.tesAbValue - change;
        }
      }

      chVal -= ch;

      if (chVal <= 0 || tesVal <= 0) {
        break;
      }
    }

    return change;
  }

  private getTaskFromState(tsk: Task, st: taskState, isAll: boolean, prs: Pers): Task {
    let stT = new Task();
    let stateProgr;
    stT.failCounter = st.failCounter;
    stT.lastNotDone = st.lastNotDone;
    stT.isNotWriteTime = st.isNotWriteTime;
    stT.autoTime = st.autoTime;

    stT.aimTimer = tsk.aimTimer;
    stT.aimUnit = tsk.aimUnit;
    stT.secondsDone = st.secondsDone;
    stT.secondsToDone = tsk.secondsToDone;
    stT.counterDone = tsk.counterDone;
    stT.counterToDone = tsk.counterToDone;
    stT.descr = tsk.descr;

    let plusName = tsk.curLvlDescr3;
    if (tsk.requrense == "нет") {
      plusName = st.name;
    }
    if (tsk.isSumStates) {
      plusName = st.name;

      let pattern = /‪.*/;
      let plusTimerOrCounter = pattern.exec(tsk.curLvlDescr3);
      if (plusTimerOrCounter) {
        if (!this.isCounterAim(tsk)) {
          let aimVal = 0;
          aimVal = st.secondsDone;

          const cur = tsk.value;
          const progr = this.getProgrForTittle(tsk.value + 1, cur, tsk.isPerk, false, false);
          let plus = this.getAimString(this.tesTaskTittleCount(progr, tsk.aimTimer, true, tsk.aimUnit, aimVal, tsk.isEven), tsk.aimUnit, tsk.postfix);
          plusName += " " + plus;
        } else {
          // plusName += " " + plusTimerOrCounter;

          let aimVal = 0;
          aimVal = st.counterDone;

          const cur = tsk.value;
          const progr = this.getProgrForTittle(tsk.value + 1, cur, tsk.isPerk, false, false);
          let plus = this.getAimString(this.tesTaskTittleCount(progr, tsk.aimTimer, true, tsk.aimUnit, aimVal, tsk.isEven), tsk.aimUnit, tsk.postfix);
          plusName += " " + plus;
        }
      }
    }

    if (tsk.isStatePlusTitle) {
      stT.tittle = tsk.name + ": " + plusName;
    } else {
      stT.tittle = plusName;
    }

    stT.name = stT.tittle;
    stT.qwestId = tsk.qwestId;
    stT.order = st.order;
    stT.date = tsk.date;
    if (st.isDone) {
      let today = new Date(tsk.date);
      let tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      stT.date = tomorrow;
    }
    stT.requrense = tsk.requrense;
    stT.value = tsk.value;
    stT.imageLvl = tsk.imageLvl;
    stT.requrense = tsk.requrense;
    stT.isCounter = tsk.isCounter;
    stT.isTimer = tsk.isTimer;
    stT.timeVal = st.timeVal;
    stT.counterValue = tsk.counterValue;
    stT.timerValue = tsk.timerValue;
    stT.timerStart = tsk.timerStart;
    stT.requrense = tsk.requrense;
    stT.lastDate = st.lastDate;

    if (!st.image) {
      let lvl = prs.level;
      if (tsk.requrense != "нет") {
        lvl = this.getAbMonsterLvl(tsk);
      }
      this.GetRndEnamy(st, prs.level, GameSettings.maxPersLevel);
    }

    stT.id = st.id;
    stT.image = st.image;
    stT.imageLvl = st.imageLvl;
    stT.parrentTask = tsk.id;
    stT.plusToNames = [...tsk.plusToNames];
    stT.nextAbVal = tsk.nextAbVal;
    stT.tesValue = tsk.tesValue;

    if (stT.requrense != "нет" && !true) {
      stT.plusToNames.shift();
    }

    if (stateProgr) {
      stT.plusToNames.unshift(new plusToName(stateProgr, null, null, ""));
    }

    if (stT.requrense != "нет" && !true) {
      stT.time = st.time;
      stT.plusToNames.unshift(new plusToName("" + st.time, null, null, ""));
    }

    this.allMap["stt" + stT.id] = {};
    this.allMap["stt" + stT.id].item = stT;
    this.allMap["stt" + stT.id].link = st;

    return stT;
  }

  /**
   * У следующего квеста удаляем parrent
   * @param qwId Идентификатор родителя
   */
  private removeParrents(qwId: any) {
    for (let i = 0; i < this.pers$.value.qwests.length; i++) {
      const qw = this.pers$.value.qwests[i];
      if (qw.parrentId == qwId) {
        qw.parrentId = 0;
      }
    }
  }

  private setAbRang(ab: Ability) {
    let val = ab.value;
    let firstTask = ab.tasks[0];
    if (firstTask.isPerk) {
      const rng = new Rangse();
      if (firstTask.value == 0) {
        rng.name = "-";
      } else {
        rng.name = "👍";
      }

      ab.rang = rng;
    } else {
      ab.rang = this.getCurRang(val);
    }
  }

  private setAbValueAndProgress(ab: Ability, tskCur: number, tskMax: number, tesCur: number) {
    if (tskMax === 0) {
      ab.value = 0;
    } else {
      let tskProgr = tskCur / tskMax;
      if (tskProgr > 1) {
        tskProgr = 1;
      }
      ab.value = 10 * tskProgr;
    }

    if (ab.value > 10) {
      ab.value = 10;
    }

    if (ab.value < 0) {
      ab.value = 0;
    }

    // Прогресс навыка
    let abCellValue = Math.floor(ab.value);
    ab.progressValue = (abCellValue / 10) * 100;

    if (GameSettings.isCeilProgressBar) {
      let abProgress = ab.value - abCellValue;
      ab.progressValue = abProgress * 100;
    }
  }

  private setCurPersTask(prs: Pers) {
    if (prs && prs.tasks) {
      if (prs.currentView == curpersview.QwestTasks) {
        if (prs.currentQwestId) {
          let firstTask = null;
          for (const t of prs.tasks) {
            if (t.qwestId == prs.currentQwestId) {
              firstTask = t;
            }
          }

          if (firstTask != null) {
            prs.currentTaskIndex = prs.tasks.indexOf(firstTask);
          } else {
            prs.currentTaskIndex = 0;
            let tsk = prs.tasks[prs.currentTaskIndex];
            if (tsk && tsk.qwestId) {
              prs.currentQwestId = tsk.qwestId;
            }
          }
        } else {
          prs.currentTaskIndex = 0;
        }
      }

      if (prs.currentTaskIndex >= prs.tasks.length || prs.tasks[prs.currentTaskIndex] == undefined || prs.tasks[prs.currentTaskIndex] == null) {
        prs.currentTaskIndex = 0;
      }

      prs.currentTask = prs.tasks[prs.currentTaskIndex];
    }
  }

  private setTaskTittle(tsk: Task, isMegaPlan: boolean) {
    tsk.statesDescr = [];
    tsk.curStateDescrInd = 0;
    tsk.IsNextLvlSame = false;

    if (tsk.aimTimer != 0 || tsk.aimCounter != 0 || tsk.states.length > 0 || tsk.postfix || tsk.prefix) {
      tsk.curLvlDescr = "";
      tsk.statesDescr = [];
      tsk.nextAbVal = tsk.value + 1;

      // По уровням
      if (GameSettings.isShowAbProgrTable) {
        for (let i = 0; i <= GameSettings.maxAbilLvl; i++) {
          const progr = this.getProgrForTittle(i + 1, i, tsk.isPerk, isMegaPlan, false);
          const progrSt = this.getProgrForTittle(i + 1, i, tsk.isPerk, isMegaPlan, true);
          const pSt = this.getPlusState(tsk, progr, progrSt, false);

          tsk.statesDescr.push(pSt);
        }
      }

      // Текущий уровень
      const cur = tsk.value;
      const progr = this.getProgrForTittle(tsk.value + 1, cur, tsk.isPerk, isMegaPlan, false);
      const progrSt = this.getProgrForTittle(tsk.value + 1, cur, tsk.isPerk, isMegaPlan, true);

      if (tsk.aimTimer && tsk.aimUnit != "Раз") {
        tsk.secondsToDone = this.tesTaskTittleCount(progr, tsk.aimTimer, true, tsk.aimUnit);
      }

      const plusState = this.getPlusState(tsk, progr, progrSt, true);

      if (!GameSettings.isShowAbProgrTable) {
        tsk.statesDescr.push(plusState);
      }

      if (plusState) {
        if (tsk.states.length > 0 && !tsk.isSumStates) {
          if (tsk.isStatePlusTitle) {
            tsk.tittle = tsk.name + ": " + plusState;
          } else {
            tsk.tittle = plusState;
          }
        } else {
          if (tsk.states.length > 0 && tsk.isStateInTitle) {
            if (tsk.isStatePlusTitle) {
              tsk.tittle = tsk.name + ": " + plusState;
            } else {
              tsk.tittle = plusState;
            }
          } else {
            tsk.tittle = tsk.name + ": " + plusState;
          }
        }
      } else {
        tsk.tittle = tsk.name;
      }

      tsk.curLvlDescr = plusState.trim();
      tsk.curLvlDescr2 = " (" + plusState.trim() + ")";
      tsk.curLvlDescr3 = plusState.trim();

      if (cur <= GameSettings.maxAbilLvl && tsk.statesDescr[cur] == tsk.statesDescr[cur + 1]) {
        tsk.IsNextLvlSame = true;
      }
    } else {
      for (let i = 0; i <= GameSettings.maxAbilLvl; i++) {
        if (GameSettings.isShowAbProgrTable || i == tsk.value) {
          tsk.statesDescr.push(tsk.tittle);
        }
      }

      tsk.tittle = tsk.name;
      tsk.curLvlDescr = "";
      tsk.curLvlDescr2 = "";

      tsk.IsNextLvlSame = true;
    }
  }

  private sortQwestTasks(qw: Qwest) {
    qw.tasks = qw.tasks.sort((a, b) => {
      let aIsDone = 0;
      let bIsDone = 0;
      if (a.isDone) {
        aIsDone = 1;
      }
      if (b.isDone) {
        bIsDone = 1;
      }
      return aIsDone - bIsDone;
    });
  }

  private recountAbilMayUp(prs: Pers) {
    let on = prs.ON;

    for (let ch of prs.characteristics) {
      for (let ab of ch.abilities) {
        for (let tsk of ab.tasks) {
          if (tsk.mayUp == true && on < (tsk.value + 1) * tsk.hardnes) {
            tsk.mayUp = false;
          }
        }
      }

      ch.abilities = ch.abilities.sort(this.abSorter());
    }
  }
}
