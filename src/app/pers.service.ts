import { Injectable } from "@angular/core";
import { Pers } from "src/Models/Pers";
import { BehaviorSubject, Subject } from "rxjs";
import { FirebaseUserModel } from "src/Models/User";
import { Characteristic } from "src/Models/Characteristic";
import { Ability } from "src/Models/Ability";
import { Task, taskState, IImg, Reqvirement } from "src/Models/Task";
import { Qwest } from "src/Models/Qwest";
import { ReqStrExt, Reward } from "src/Models/Reward";
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
import { GlobalItem } from "src/Models/GlobalItem";
import { allmap } from "src/Models/allmap";

@Injectable({
  providedIn: "root",
})
export class PersService {
  // Персонаж
  private unsubscribe$ = new Subject();

  _tesStartOn: number = 5;
  absMap: any;
  allMap: {};
  currentCounterDone$ = new BehaviorSubject<number>(0);
  currentTask$ = new BehaviorSubject<Task>(null);
  currentView$ = new BehaviorSubject<curpersview>(curpersview.SkillsGlobal);
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
  qwestsGlobal$ = new BehaviorSubject<GlobalItem[]>([]);
  skillsGlobal$ = new BehaviorSubject<GlobalItem[]>([]);
  twoDaysTes = 12.546;
  // Пользователь
  user: FirebaseUserModel;

  constructor(private router: Router, private changes: PerschangesService, public dialog: MatDialog, public gameSettings: GameSettings) {
    this.gameSettings.setTes();
    this.isOffline = true;
    this.getPers();

    this.currentTask$.subscribe((q) => {
      if (q != null) {
        this.currentCounterDone$.next(q.counterDone);
      }
    });
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
    if (tskExp <= 0) {
      return 0;
    }

    let totalGold = 0;

    // Для каждого целого значения tskExp проводим розыгрыш с вероятностью 50%
    const wholeParts = Math.floor(tskExp);
    for (let i = 0; i < wholeParts; i++) {
      if (Math.random() < 0.5) {
        totalGold += 1;
      }
    }

    // Для дробной части проводим дополнительный розыгрыш
    const fractionalPart = tskExp - wholeParts;
    if (fractionalPart > 0) {
      // Вероятность успеха пропорциональна дробной части
      if (Math.random() < fractionalPart * 0.5) {
        totalGold += 1;
      }
    }

    this.pers$.value.gold += totalGold;
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
    let mnstrLvl = this.gameSettings.getMonsterLevel(lvl, maxlvl);

    tsk.imageLvl = "" + mnstrLvl;
    let prs = this.pers$.value;
    if (prs != null) {
      tsk.image = this.getImgPathRandome(mnstrLvl, prs);
    }

    return;
  }

  abSorter(): (a: Ability, b: Ability) => number {
    return (a, b) => {
      let aTask = a.tasks[0];
      let bTask = b.tasks[0];

      // Открыта
      if (this.boolVCompare(a.isOpen, b.isOpen) != 0) {
        return -this.boolVCompare(a.isOpen, b.isOpen);
      }

      // Одинаковый?
      if (this.boolVCompare(a.HasSameAbLvl, b.HasSameAbLvl) != 0) {
        return -this.boolVCompare(a.HasSameAbLvl, b.HasSameAbLvl);
      }

      // Значение
      if (a.progressValue != b.progressValue) {
        return a.progressValue - b.progressValue;
      }

      // Перк?
      if (this.boolVCompare(aTask.isPerk, bTask.isPerk) != 0) {
        return this.boolVCompare(aTask.isPerk, bTask.isPerk);
      }

      // Сложность
      if (aTask.hardnes != bTask.hardnes) {
        return aTask.hardnes - bTask.hardnes;
      }

      return a.name.localeCompare(b.name);
    };
  }

  /**
   * Добавить навык.
   * @param charactId Идентификатор характеристики.
   */
  addAbil(charactId: string, name: string, hardness?: number): string {
    var charact: Characteristic = this.pers$.value.characteristics.filter((n) => {
      return n.id === charactId;
    })[0];
    if (charact != null && charact != undefined) {
      let abil = new Ability();
      abil.name = name;
      abil.isOpen = this.gameSettings.isNewAbOpened;

      let tsk = this.addTsk(abil, name, hardness);

      charact.abilities.push(abil);

      return tsk;
    }
  }

  addAchive(rev: Reward): any {
    this.pers$.value.achievements.push(rev);
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
  addTsk(abil: Ability, newTsk: string, hardnes?: number): string {
    var tsk = new Task();
    tsk.name = newTsk;
    if (hardnes) {
      tsk.hardnes = hardnes;
    }

    this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);

    abil.tasks.push(tsk);

    return tsk.id;
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

    this.GetRndEnamy(tsk, this.pers$.value.level, this.gameSettings.maxPersLevel);

    if (!toBegin) {
      qwest.tasks.push(tsk);
    } else {
      qwest.tasks.unshift(tsk);
    }

    this.sortQwestTasks(qwest);
  }

  boolVCompare(a: boolean, b: boolean): number {
    let aVal = a == true ? 1 : 0;
    let bVal = b == true ? 1 : 0;

    return aVal - bVal;
  }

  chaSorter(): (a: Characteristic, b: Characteristic) => number {
    return (a, b) => {
      if (this.gameSettings.isClassicaRPG) {
        // Можно открыть
        if (this.boolVCompare(a.anyMayUp, b.anyMayUp) != 0) {
          return -this.boolVCompare(a.anyMayUp, b.anyMayUp);
        }

        // Одинаковые
        if (a.anyMayUp && b.anyMayUp) {
          if (this.boolVCompare(a.HasSameAbLvl, b.HasSameAbLvl) != 0) {
            return -this.boolVCompare(a.HasSameAbLvl, b.HasSameAbLvl);
          }
        }
      }

      if (a.value != b.value) {
        return a.value - b.value;
      }

      if (a.progressValue != b.progressValue) {
        return a.progressValue - b.progressValue;
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

  checkAllDelReq(id: string) {
    this.pers$.value.characteristics.forEach((char) => {
      char.abilities.forEach((ab) => {
        ab.tasks.forEach((tsk) => {
          tsk.reqvirements = tsk.reqvirements.filter((f) => f.elId != id);
        });
      });
    });

    this.pers$.value.rewards.forEach((rev) => (rev.reqvirements = rev.reqvirements.filter((f) => f.elId != id)));

    this.pers$.value.achievements.forEach((ach) => (ach.reqvirements = ach.reqvirements.filter((f) => f.elId != id)));
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
    } else if (requrense === "кроме субботы") {
      if (weekDay === 1 || weekDay === 2 || weekDay === 3 || weekDay === 4 || weekDay === 5 || weekDay === 0) {
        return true;
      }
    } else if (requrense === "кроме воскресенья") {
      if (weekDay === 1 || weekDay === 2 || weekDay === 3 || weekDay === 4 || weekDay === 5 || weekDay === 6) {
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

  delAchive(id: string): any {
    this.pers$.value.achievements = this.pers$.value.achievements.filter((n) => {
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

  downUbility(tskAbility: Ability) {
    let ab: Ability = this.allMap[tskAbility.id].item;
    this.changesBefore();

    var isClosed = false;
    if (this.gameSettings.isClassicaRPG) {
      for (const tsk of ab.tasks) {
        tsk.value -= 1;
        if (tsk.value <= 0) {
          tsk.value = 0;
          isClosed = true;
        }
      }
    } else {
      for (const tsk of ab.tasks) {
        tsk.value = 0;
        isClosed = true;
      }

      ab.value = 0;
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
      this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);

      tsk.states.forEach((st) => {
        this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);
      });
    }

    setTimeout(() => {
      this.savePers(false);
      this.changesAfter(false, null);
    }, 50);
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

  generateQwestsGlobal(prs: Pers) {
    if (prs == null) {
      return;
    }

    if (prs.qwests == null || prs.tasks == null || prs.currentView != curpersview.QwestsGlobal) {
      return;
    }

    let qwg = [];

    for (let i = 0; i < prs.tasks.length; i++) {
      const tsk = prs.tasks[i];

      if (!tsk.qwestId) {
        continue;
      }

      let qw: Qwest = this.allMap[tsk.qwestId].item;

      let gl = new GlobalItem();
      gl.id = qw.id;
      gl.img = qw.image;
      gl.tskId = tsk.id;
      gl.tskIdx = i;
      gl.name = qw.name;
      gl.progressValue = qw.progressValue;

      qwg.push(gl);
    }

    this.qwestsGlobal$.next(qwg);
  }

  generateSkillsGlobal(prs: Pers) {
    if (prs == null) {
      return;
    }

    if (prs.tasks == null || prs.currentView != curpersview.SkillsGlobal) {
      return;
    }

    let map = new Map();

    for (let i = 0; i < prs.tasks.length; i++) {
      const tsk = prs.tasks[i];

      let ab: Ability;
      if (tsk.parrentTask) {
        ab = this.allMap[tsk.parrentTask].link;
      } else {
        ab = this.allMap[tsk.id].link;
      }

      let gl = new GlobalItem();
      gl.id = ab.id;
      gl.img = ab.image;
      gl.tskId = tsk.id;
      gl.tskIdx = i;
      gl.name = ab.name;
      if (tsk.counterDone > 0) {
        gl.name += ` (${tsk.counterDone}✓)`;
      }
      if (tsk.secondsDone > 0) {
        gl.name += ` (${this.getAimString(Math.floor(tsk.secondsDone), tsk.aimUnit, tsk.prefix)})`;
      }

      if (map.get(ab.id) == null) {
        map.set(ab.id, gl);
      }
    }

    this.skillsGlobal$.next([...map.values()]);
  }

  getAbExpPointsFromTes(tesValue: number): number {
    return tesValue;
  }

  getAbMonsterLvl(tsk: Task): number {
    return this.pers$.value.level;
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
    let gained = persLevel * this.gameSettings.abPointsPerLvl + this.gameSettings.abPointsStart;
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

  getExpAndLvl(classicalExpTotal: number, abCount: number): getExpResult {
    let result = new getExpResult();

    result.exp = classicalExpTotal;

    let persLevel = 0;
    let expLvl = 0;

    while (true) {
      result.startExp = expLvl;

      let expa = 1 + 0.033 * persLevel;
      if (expa < 1) {
        expa = 1;
      }
      if (expa > 3) {
        expa = 3;
      }

      let cur = persLevel * this.gameSettings.perLvl + this.gameSettings.abPointsStart;
      expLvl += cur * expa;

      result.nextExp = expLvl;

      if (expLvl > result.exp) {
        result.persLevel = persLevel;
        break;
      }

      persLevel++;
    }

    return result;
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

  getPersExpTES(totalAbVal: number, abCount: number, expPoints: number, totalAbValMax: number, totalAbLvl: number): getExpResult {
    let startExp = 0;
    let persLevel = 0;
    let exp = 0;
    let nextExp = 0;
    let expDirect = 0;

    // Цель - 20 навыков
    let abMinCount = 20;
    // let plus = 0.999;
    let plus = 0;

    // if (abCount < abMinCount) {
    abCount = abMinCount;
    // }

    if (this.gameSettings.expFotmulaType == "abVal") {
      plus = 0.999;
      // По значению навыка
      if (!totalAbValMax || totalAbValMax < abMinCount * this.gameSettings.tesMaxVal) {
        totalAbValMax = abMinCount * this.gameSettings.tesMaxVal;
      }

      let progress = totalAbVal / totalAbValMax;
      exp = (this.gameSettings.maxPersLevel + plus) * progress;
      expDirect = exp;
      persLevel = Math.floor(exp);
      startExp = persLevel;
      nextExp = persLevel + 1;
    } else if (this.gameSettings.expFotmulaType == "abLvl") {
      let max = abCount * (this.gameSettings.maxAbilLvl - this.gameSettings.minAbilLvl);
      let progress = totalAbLvl / max;
      exp = (this.gameSettings.maxPersLevel + plus) * progress;
      expDirect = exp;
      persLevel = Math.floor(exp);
      startExp = persLevel;
      nextExp = persLevel + 1;
    } else if (this.gameSettings.expFotmulaType == "abValPoints") {
      let max = this.gameSettings.maxPersLevel * this.gameSettings.abPointsForLvl * 10;
      let progress = totalAbVal / max;
      exp = this.gameSettings.maxPersLevel * progress;
      expDirect = exp;
      persLevel = Math.floor(exp);
      startExp = persLevel;
      nextExp = persLevel + 1;
    } else if (this.gameSettings.expFotmulaType == "dynamic") {
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

        if (total > totalAbVal) {
          nextLvlExp = total;
          break;
        }

        curLvlExp = total;

        i++;
      }

      exp = totalAbVal;
      expDirect = totalAbVal;
      persLevel = i;
      startExp = curLvlExp;
      nextExp = nextLvlExp;
    } else if (this.gameSettings.expFotmulaType == "abLvlPoints") {
      let max = this.gameSettings.maxPersLevel * this.gameSettings.abPointsForLvl;
      let progress = totalAbLvl / max;
      exp = this.gameSettings.maxPersLevel * progress;

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

  getReqStr(req: Reqvirement): string {
    let str = "";

    if (req.type != ReqItemType.persLvl) {
      let inAllMap = this.allMap[req.elId];
      if (inAllMap) {
        if (inAllMap.item && inAllMap.item.name) {
          req.elName = inAllMap.item.name;
        }
      }

      str += req.elName;
    }

    if (req.type != ReqItemType.qwest) {
      str += " ≥ " + req.elVal;
    }

    return str;
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

    if (requrense === "будни" || requrense === "кроме субботы" || requrense === "кроме воскресенья") {
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

  public isCounterAim(tsk: Task) {
    return tsk.aimUnit == "Раз" || tsk.aimUnit == "Раз чет" || tsk.aimUnit == "Раз нечет";
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

    // Округление до ближайшего целого, если значение на границе
    let roundedValue = Math.round(tsk.tesValue);
    let difference = Math.abs(tsk.tesValue - roundedValue);

    if (difference != 0 && difference <= 0.005) {
      tsk.tesValue = roundedValue;
    }

    tsk.value = this.getAbVal(tsk.tesValue, ab.isOpen, tsk.value);

    if (tsk.value < 0) {
      tsk.value = 0;
    }
    if (tsk.value > this.gameSettings.maxAbilLvl) {
      tsk.value = this.gameSettings.maxAbilLvl;
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
          this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);
          tsk.states.forEach((st) => {
            this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);
          });
        });
      });
    });

    prs.qwests.forEach((qw) => {
      qw.tasks.forEach((tsk) => {
        this.GetRndEnamy(tsk, prs.level, this.gameSettings.maxPersLevel);
      });
    });

    this.savePers(false);
  }

  recountRewards(prs: Pers) {
    // Достижения
    if (prs.achievements == null) {
      prs.achievements = [];
    }

    for (const r of prs.achievements) {
      if (r.isReward) {
        if (!r.reqvirements) {
          r.reqvirements = [];
        }

        let notDoneReqs: ReqStrExt[] = [];

        for (const req of r.reqvirements) {
          if (req.type == ReqItemType.persLvl) {
            this.reqCheck(prs.level, req, notDoneReqs);
          } else {
            let el = this.allMap[req.elId];
            if (el != null && el.item != null) {
              if (req.type == ReqItemType.qwest) {
                this.reqCheck(0, req, notDoneReqs);
              } else if (req.type == ReqItemType.abil) {
                let abil: Ability = el.item;
                this.reqCheck(abil.value, req, notDoneReqs);
              } else if (req.type == ReqItemType.charact) {
                let cha: Characteristic = el.item;
                this.reqCheck(cha.value, req, notDoneReqs);
              }
            } else {
              req.isDone = true;
            }
          }
        }

        if (notDoneReqs.length) {
          r.isAviable = false;
          r.reqStr = notDoneReqs.map((q) => q.name);
          r.reqStrExt = notDoneReqs;
        } else {
          r.isAviable = true;
          r.reqStr = [];
          r.reqStrExt = [];
        }
      }
    }
    prs.achievements.sort((a, b) => -this.boolVCompare(a.isAviable, b.isAviable));

    // Награды
    for (const r of prs.rewards) {
      if (!r.reqvirements) {
        r.reqvirements = [];
      }

      if (r.isShop) {
        if (Math.floor(prs.gold) >= r.cost) {
          r.isAviable = true;
        } else {
          r.isAviable = false;
        }
      } else {
        r.isAviable = true;
      }
    }

    prs.rewards = prs.rewards.sort((a, b) => {
      // Награда?
      let aIsRev = isRew(a);
      let bIsRev = isRew(b);
      if (aIsRev != bIsRev) {
        return aIsRev - bIsRev;
      }

      if (a.revProbId != b.revProbId) {
        return -(a.revProbId - b.revProbId);
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

      // // Вероятность получения
      // let aProb = getProbRev(a);
      // let bProb = getProbRev(b);
      // if (aProb != bProb) {
      //   return aProb - bProb;
      // }

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

    const rewardMap = new Map<string, Reward>();

    prs.rewards?.forEach((q) => {
      if (q.revProbId) {
        const rarity = this.gameSettings.revProbs.find((r) => r.id === q.revProbId);
        q.rarityName = rarity?.name || "";
      }

      rewardMap.set(q.id, q);
    });

    prs.inventory.forEach((q) => {
      const reward = rewardMap.get(q.id);
      if (reward) {
        q.name = reward.name;
        q.image = reward.image;
        q.rarityName = reward.rarityName;
        q.revProbId = reward.revProbId;
        q.rare = reward.rare;
      }
    });

    prs.inventory = prs.inventory.sort((a, b) => {
      // Редкость
      if (a.revProbId != b.revProbId) {
        return -(a.revProbId - b.revProbId);
      }

      // Название
      return a.name.localeCompare(b.name);
    });
  }

  reqCheck(val: number, req: Reqvirement, notDoneReqs: ReqStrExt[]) {
    req.progr = val / req.elVal;
    if (val < req.elVal) {
      notDoneReqs.push({ name: this.getReqStr(req), progress: req.progr * 100 });
      req.isDone = false;
    } else {
      req.isDone = true;
    }
  }

  returnToAdventure() {
    const prs = this.pers$.value;
    prs.isRest = false;
    prs.hp = prs.maxHp;
    if (this.gameSettings.isHpEnabled) {
      prs.expVal = prs.prevExp;
    }
    for (const ch of prs.characteristics) {
      for (const ab of ch.abilities) {
        for (const tsk of ab.tasks) {
          let tskDate: moment.Moment = moment(tsk.date);
          if (tskDate.isBefore(moment(new Date()), "d")) {
            tsk.date = new Date();
            for (const st of tsk.states) {
              st.isDone = false;
            }
          }
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
    let totalAbVal = 0;
    let totalAbLvl = 0;
    let totalAbValMax = 0;
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
      // ch.descr = null;
      let abMax = 0;
      let abLvl = 0;
      let abValMax = 0;
      let tesAbCur = 0;
      let isHasSameAbil = false;
      let abExpPointsCur = 0;

      for (const ab of ch.abilities) {
        // ab.descr = null;
        for (const tsk of ab.tasks) {
          // tsk.descr = null;
          this.normalizeTskAbilityValue(tsk, ab);
          this.gameSettings.checkPerkTskValue(tsk);
          if (!this.gameSettings.isHardnessEnable) {
            if (tsk.isPerk) {
              tsk.hardnes = this.gameSettings.perkHardness;
            } else {
              tsk.hardnes = 1;
            }
          }

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

            // if (prs.isTES) {
            //   st.failCounter = 0;
            // }
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
          if (tsk.tesValue > this.gameSettings.tesMaxVal) {
            tsk.tesValue = this.gameSettings.tesMaxVal;
          }

          let progressNextLevel = (tsk.tesValue / 10.0 - Math.floor(tsk.tesValue / 10.0)) * 100;
          tsk.progresNextLevel = progressNextLevel;

          if (this.gameSettings.isCeilProgressBar) {
            let valP = tsk.value;
            tsk.progressValue = (valP / this.gameSettings.maxAbilLvl) * 100;
            ab.progressValue = tsk.progressValue;
          } else {
            let valP = 1 + tsk.tesValue / 10;
            tsk.progressValue = progressNextLevel;
            ab.progressValue = tsk.progressValue;
          }

          // МАКС
          // if (tsk.tesValue > this.gameSettings.tesMaxVal + 9.99) {
          //   tsk.progresNextLevel = 100;
          //   tsk.progressValue = 100;
          //   ab.progressValue = 100;
          // }

          abMax += this.gameSettings.maxAbilLvl - this.gameSettings.minAbilLvl;
          if (ab.isOpen) {
            let vl = tsk.value - this.gameSettings.minAbilLvl;
            if (vl < 0) {
              vl = 0;
            }

            abLvl += vl;
          }

          abValMax += this.gameSettings.tesMaxVal;
          tesAbCur += tsk.tesValue;
          abExpPointsCur += this.getAbExpPointsFromTes(tsk.tesValue);

          if (doneReq) {
            tsk.mayUp = true;
          } else {
            tsk.mayUp = false;
          }

          if (!this.gameSettings.isClassicaRPG && ab.isOpen) {
            tsk.mayUp = false;
          }
          if (tsk.value >= this.gameSettings.maxAbilLvl) {
            tsk.mayUp = false;
          }

          const rng = new Rangse();

          if (ab.isOpen == false) {
            rng.name = "-";
          } else {
            rng.name = tsk.value + "";
            if (this.gameSettings.changesIsShowPercentageInAb) {
              rng.name += "%";
            }

            if (tsk.isPerk && this.gameSettings.isClassicaRPG) {
              rng.name = "⭐";
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
          abValTotal += this.gameSettings.abTotalCost(tsk.value, tsk.hardnes, tsk.isPerk);
        }

        if (ab.isOpen) {
          abOpenned++;
        }
        ch.HasSameAbLvl = isHasSameAbil;
      }

      totalAbVal += tesAbCur;
      totalAbValMax += abValMax;

      totalAbLvl += abLvl;

      abExpPointsTotalCur += abExpPointsCur;

      let chaCeilProgr = this.countCharacteristicValue(ch, abLvl, abMax);
      chaCeilProgr = Math.floor(chaCeilProgr);

      const rng = new Rangse();
      rng.val = chaCeilProgr;
      rng.name = chaCeilProgr + "";
      ch.rang = rng;
    }

    prs.characteristics = prs.characteristics.sort(this.chaSorter());

    for (const qw of prs.qwests) {
      // qw.descr = null;
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

    prs.qwests = prs.qwests.sort(this.qwestsSorter());

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

    let expResult: getExpResult = this.gameSettings.getPersExpAndLevel(totalAbVal, abCount, abExpPointsTotalCur, totalAbValMax, totalAbLvl, classicalExpTotal, prs.expVal, abOpenned);

    let ons: number = 0;
    if (!this.gameSettings.isClassicaRPG) {
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
    prs.totalProgress = (prs.level / this.gameSettings.maxPersLevel) * 100;

    let stage = this.gameSettings.getPersRangIdx(prs.level, this.gameSettings.getMonsterLevel(prs.level, this.gameSettings.maxPersLevel), this.gameSettings.maxPersLevel);

    if (stage > this.gameSettings.rangNames.length - 1) {
      stage = this.gameSettings.rangNames.length - 1;
    }
    let rangStartProgress = Math.floor(stage);
    let rangProgress = stage - rangStartProgress;

    if (prs.level >= this.gameSettings.maxPersLevel) {
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

    let thisMonstersLevel = this.gameSettings.getMonsterLevel(prs.level, this.gameSettings.maxPersLevel);

    let prevMonstersLevel = thisMonstersLevel;

    if (prevPersLevel != prs.level) {
      prevMonstersLevel = this.gameSettings.getMonsterLevel(prevPersLevel, this.gameSettings.maxPersLevel);
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
          let koef = this.getWeekKoef(tsk.requrense, true, tsk.tskWeekDays) * this.gameSettings.abChangeExp(tsk.value, tsk.hardnes, tsk.isPerk);
          let subTasksKoef = 1;

          if (tsk.isSumStates && tsk.states.length > 0) {
            subTasksKoef = tsk.states.filter((n) => n.isActive).length;
          }

          tsk.plusExp = (baseGold * koef) / subTasksKoef;
        }
      }
    }

    for (const qw of prs.qwests) {
      for (const tsk of qw.tasks) {
        tsk.plusExp = baseGold;
      }
    }

    // Ранг
    prs.rangName = this.gameSettings.getPersRangName(prs.level);

    // HP
    this.gameSettings.calculateHp(prs, prevPersLevel, prs.level);

    localStorage.setItem("isOffline", JSON.stringify(true));
    localStorage.setItem("pers", JSON.stringify(prs));

    this.pers$.next(prs);

    // HP null
    if (this.gameSettings.isHpEnabled && prs.hp <= 0 && prs.isRest == false) {
      prs.isRest = true;
      this.savePers(true);
    }

    if (prs.currentView == curpersview.QwestTasks && prs.tasks.length == 0) {
      prs.currentView = curpersview.QwestsGlobal;
      this.savePers(false);
    } else if (prs.currentView == curpersview.QwestsGlobal && prs.tasks.length == 0) {
      prs.currentView = curpersview.SkillTasks;
      this.savePers(false);
    }

    // Только задачи навыка, если он
    if (prs.currentView == curpersview.SkillTasks && prs.tasks != null) {
      if (prs.currentTask != null) {
        prs.tasks = prs.tasks.filter((q) => q.parrentTask == prs.currentTask.parrentTask);
      } else {
        prs.tasks = prs.tasks.filter((q) => q.id == prs.currentTask.id);
      }
    }
    // Только задачи квеста, если он
    if (prs.currentView == curpersview.QwestTasks && prs.tasks != null) {
      if (prs.currentTask != null && prs.currentTask.qwestId != null) {
        let qw = prs.qwests.find((q) => q.id == prs.currentTask.qwestId);
        prs.tasks = qw.tasks.filter((q) => this.checkTask(q) && !q.isDone);
      } else {
        prs.tasks = prs.tasks.filter((q) => q.id == prs.currentTask.id);
      }
    }

    this.currentView$.next(prs.currentView);
    this.currentTask$.next(prs.currentTask);

    this.generateQwestsGlobal(prs);
    this.generateSkillsGlobal(prs);
  }

  qwestsSorter(): (a: Qwest, b: Qwest) => number {
    return (a, b) => {
      if (a.name == "Дела") {
        return -1;
      }

      if (b.name == "Дела") {
        return 1;
      }

      if (a.hardnessId != b.hardnessId) {
        return -(a.hardnessId - b.hardnessId);
      }

      return a.name.localeCompare(b.name);
    };
  }

  setCurInd(i: number): any {
    const pers = this.pers$.value;
    const tasks = pers.tasks;

    if (tasks.length - 1 < i) {
      i = tasks.length - 1;
    }

    pers.currentTaskIndex = i;
    pers.currentTask = tasks[i];

    if (pers.currentTask && pers.currentTask.qwestId) {
      pers.currentQwestId = pers.currentTask.qwestId;
    }

    this.currentTask$.next(pers.currentTask);
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

    prs.currentView = curpersview.SkillsGlobal;
    // prs.currentView = curpersview.SkillTasks;

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

    if (this.isNullOrUndefined(subTask.failCounter)) {
      subTask.failCounter = 0;
    }

    // Изменяем значение
    if (!this.gameSettings.isClassicaRPG) {
      this.changeTes(tsk, isDone, subTask.lastNotDone, activeSubtasksCount);
    } else {
      this.changeClassical(tsk, isDone, activeSubtasksCount, subTask.failCounter);
    }

    subTask.lastDate = new Date().getTime();
    subTask.secondsDone = 0;
    subTask.counterDone = 0;

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
      if (this.isNullOrUndefined(tsk.failCounter)) {
        tsk.failCounter = 0;
      }

      // Минусуем значение
      if (!this.gameSettings.isClassicaRPG) {
        this.changeTes(tsk, false, tsk.lastNotDone);
      } else {
        this.changeClassical(tsk, false, 1, tsk.failCounter);
      }

      tsk.lastDate = new Date().getTime();
      tsk.counterValue = 0;
      tsk.timerValue = 0;

      // Счетчик обновлений стейтов
      if (tsk.isStateRefresh) {
        if (tsk.refreshCounter == null || tsk.refreshCounter == undefined) {
          tsk.refreshCounter = 0;
        } else {
          tsk.refreshCounter++;
        }
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
        tsk.failCounter = 0;

        // Плюсуем значение
        if (!this.gameSettings.isClassicaRPG) {
          this.changeTes(tsk, true, tsk.lastNotDone);
        } else {
          this.changeClassical(tsk, true, 1, tsk.failCounter);
        }

        tsk.counterValue = 0;
        tsk.timerValue = 0;

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

  tesTaskTittleCount(progr: number, aimVal: number, aimUnit: string, aimDone?: number, isEven?: boolean) {
    let av = this.getAimValueWithUnit(Math.abs(aimVal), aimUnit);
    let end = av;

    let start = 0;
    if (aimVal > 0 && aimUnit != "State") {
      start = (av * this.gameSettings.minAbilLvl) / this.gameSettings.maxAbilLvl;
      start = this.checkEven(aimUnit, start);
      start = this.checkOdd(aimUnit, start);
      let isOdd = aimUnit == "Раз чет";

      if (start < 1) {
        start = 1;
      }
      if (isOdd && start < 2) {
        start = 2;
      }

      if ((!isOdd && start > 1) || (isOdd && start > 2)) {
        let steps = this.gameSettings.maxAbilLvl - this.gameSettings.minAbilLvl;
        if (steps < 1) {
          steps = 1;
        }

        // Тут попробовать перенести все "остатки" в начало
        let step = (end - start) / steps;
        const fact = step * steps;
        const floor = Math.floor(step) * steps;
        let dots = fact - floor;
        if (step <= 1) {
          start += dots;
        }
      }
    }

    let pr = start + progr * (end - start);
    let value = Math.round(pr);

    value = this.checkEven(aimUnit, value);
    value = this.checkOdd(aimUnit, value);

    if (value > av) {
      value = av;
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

  private checkOdd(aimUnit: string, value: number) {
    if (aimUnit == "Раз нечет") {
      const floor = Math.floor(value);
      if (floor % 2 == 0) {
        value = floor + 1;
      }
    }
    return value;
  }

  private checkEven(aimUnit: string, value: number) {
    if (aimUnit == "Раз чет") {
      const floor = Math.floor(value);
      if (floor % 2 != 0) {
        value = floor + 1;
      }
    }

    return value;
  }

  testAbFormula() {
    // Тест опыта
    // let tsks: Task[] = [];
    // for (let i = 0; i < this.gameSettings.startAbPoints; i++) {
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
    // Тест прокачки навыка
    // let tsk = new Task();
    // tsk.name = "test";
    // tsk.tesValue = 0;
    // let day = 0;
    // let perc50 = 0;
    // let perc100 = 0;
    // let prevAbVal = this.gameSettings.minAbilLvl;
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
    //   if (abVal >= this.gameSettings.maxAbilLvl / 2 && perc50 == 0) {
    //     perc50 = day;
    //   }
    //   if (abVal >= this.gameSettings.maxAbilLvl) {
    //     perc100 = day;
    //     break;
    //   }
    // }
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
        tsk.order = this.gameSettings.tskOrderDefault;
        this.CheckSetTaskDate(tsk);

        tsk.states.forEach((el) => {
          el.isDone = false;
          el.order = this.gameSettings.tskOrderDefault;
        });
      }
    }

    if (this.gameSettings.isClassicaRPG) {
      for (const tsk of ab.tasks) {
        tsk.value += 1;
      }
    }

    for (const tsk of ab.tasks) {
      this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);

      tsk.states.forEach((st) => {
        this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);
      });
    }

    if (this.gameSettings.isOpenAbWhenUp) {
      this.router.navigate(["pers/task", ab.tasks[0].id, false], { queryParams: { isQuick: false, isActivate: false, isFromMain: false } });
    } else if (this.gameSettings.isOpenAbWhenActivate && !wasOpen && isFromMain) {
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
          this.GetRndEnamy(tsk, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);
          for (const st of tsk.states) {
            this.GetRndEnamy(st, this.getAbMonsterLvl(tsk), this.gameSettings.maxPersLevel);
          }
        }
      }
    }
  }

  updateQwestTasksImages(prs: Pers) {
    for (const qwest of prs.qwests) {
      for (const tsk of qwest.tasks) {
        this.GetRndEnamy(tsk, prs.level, this.gameSettings.maxPersLevel);
        for (const sub of tsk.states) {
          this.GetRndEnamy(sub, prs.level, this.gameSettings.maxPersLevel);
        }
      }
    }
  }

  /**
   * Розыгрыш наград.
   */
  private CasinoRevards(task: Task) {
    let tskExp = task.plusExp;

    let availableRewards = this.pers$.value.rewards.filter((q) => q.isLud && q.ludProbability > 0 && !q.isReward);

    if (!availableRewards.length || tskExp <= 0) {
      return;
    }

    // Определяем количество полных розыгрышей
    const wholeDraws = Math.floor(tskExp);

    // Определяем вероятность дополнительного розыгрыша для дробной части
    const fractionalPart = tskExp - wholeDraws;
    const hasFractionalDraw = fractionalPart > 0 && Math.random() < fractionalPart;

    // Общее количество розыгрышей
    const totalDraws = wholeDraws + (hasFractionalDraw ? 1 : 0);

    // Проводим розыгрыши
    for (let draw = 0; draw < totalDraws; draw++) {
      const reward = this.weightedRandomReward(availableRewards);
      if (reward) {
        this.addToInventory(reward);
      }
    }

    // let revards = this.pers$.value.rewards.filter((q) => q.isLud && q.ludProbability > 0 && !q.isReward);

    // if (!revards.length) {
    //   return;
    // }

    // for (const rev of revards) {
    //   let rnd = Math.random() * 100;
    //   if (rnd <= rev.ludProbability) {
    //     this.addToInventory(rev);
    //   }
    // }
  }

  private weightedRandomReward(rewards: any[]): any | null {
    if (!rewards.length) {
      return null;
    }

    // Создаем карту редкостей для быстрого поиска
    const rarityMap = new Map<number, any[]>();
    for (const reward of rewards) {
      if (!rarityMap.has(reward.revProbId)) {
        rarityMap.set(reward.revProbId, []);
      }
      rarityMap.get(reward.revProbId)?.push(reward);
    }

    // Функция для поиска награды с заданной редкостью или менее редкой
    const findRewardsByRarity = (rarityId: number): any[] => {
      // Ищем награды с указанной редкостью
      if (rarityMap.has(rarityId)) {
        return rarityMap.get(rarityId) || [];
      }

      // Если нет, ищем менее редкие (с большим id)
      const sortedRarities = [...this.gameSettings.revProbs].sort((a, b) => a.id - b.id);
      const currentRarityIndex = sortedRarities.findIndex((r) => r.id === rarityId);

      // Ищем в порядке убывания редкости (увеличения id)
      for (let i = currentRarityIndex + 1; i < sortedRarities.length; i++) {
        const lessRareId = sortedRarities[i].id;
        if (rarityMap.has(lessRareId)) {
          return rarityMap.get(lessRareId) || [];
        }
      }

      return [];
    };

    // Создаем взвешенный список редкостей
    let weightedRarities: Array<{ rarityId: number; weight: number }> = [];
    let totalWeight = 0;

    for (const rarity of this.gameSettings.revProbs) {
      const weight = rarity.prob;
      weightedRarities.push({ rarityId: rarity.id, weight });
      totalWeight += weight;
    }

    // Розыгрыш редкости методом взвешенной случайности
    let randomValue = Math.random() * 100;
    let currentWeight = 0;

    // Проверяем редкости
    for (const weightedRarity of weightedRarities) {
      currentWeight += weightedRarity.weight;
      if (randomValue <= currentWeight) {
        const selectedRarityId = weightedRarity.rarityId;

        // Ищем награды с выбранной редкостью или менее редкие
        let availableRewards = findRewardsByRarity(selectedRarityId);

        // Если не нашли наград с этой редкостью или менее редкой, возвращаем null
        if (!availableRewards.length) {
          return null;
        }

        // Выбираем случайную награду из доступных
        const randomIndex = Math.floor(Math.random() * availableRewards.length);
        return availableRewards[randomIndex];
      }
    }

    // Если дошли до сюда, значит выпало "ничего"
    return null;
  }

  private changeClassical(tsk: Task, isDone: boolean, activeSubtasksCount: number, failCounter: number) {
    let koef = this.getWeekKoef(tsk.requrense, isDone, tsk.tskWeekDays) * this.gameSettings.abChangeExp(tsk.value, tsk.hardnes, tsk.isPerk);

    if (!isDone && tsk.failCounter >= 1) {
      const failMod = failCounter + 1;
      koef = koef * failMod;
    }

    koef = koef / activeSubtasksCount;

    this.gameSettings.changeExpClassical(tsk, isDone, koef, this.pers$.value);
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

    if (!prs.rewards) {
      prs.rewards = [];
    }

    if (!prs.achievements) {
      prs.achievements = [];
    }

    if (!prs.inventory) {
      prs.inventory = [];
    }

    if (prs.hp == null) {
      prs.hp = 100;
    }

    if (prs.maxHp == null) {
      prs.maxHp = 100;
    }

    if (prs.hpProgr == null) {
      prs.hpProgr = 100;
    }

    if (prs.expVal == null) {
      prs.expVal = prs.exp;
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
    const start = ch.startRang.val + this.gameSettings.minChaLvl;
    let left = this.gameSettings.maxChaLvl - start;
    if (abMax == 0) {
      abMax = 1;
    }

    let progr = abCur / abMax;
    ch.value = start + left * progr;

    let chaCeilProgr;
    if (this.gameSettings.isCeilProgressInList) {
      chaCeilProgr = Math.floor(ch.value);
      ch.progressValue = (chaCeilProgr / this.gameSettings.maxChaLvl) * 100;
    } else {
      chaCeilProgr = ch.value;
    }

    ch.progresNextLevel = (ch.value - chaCeilProgr) * 100;
    if (chaCeilProgr >= this.gameSettings.maxChaLvl) {
      ch.progresNextLevel = 100;
    }

    if (!this.gameSettings.isCeilProgressBar) {
      ch.progressValue = ch.progresNextLevel;
    }

    return chaCeilProgr;
  }

  // private countPersLevelAndOns(abTotalMax: number, prevOn: number, startExp: number, exp: number, ons: number, nextExp: number, prs: Pers, persLevel: number) {
  //   let hasPersLevel = false;
  //   let hasMaxLevel = true;
  //   let levels: number = 100;
  //   let xp_for_first_level: number = 1.0;
  //   let xp_for_last_level: number = 5.0;
  //   let B: number = Math.log(xp_for_last_level / xp_for_first_level) / (levels - 1);
  //   let A: number = xp_for_first_level / (Math.exp(B) - 1.0);

  //   let numLevel = 0;
  //   do {
  //     const i = numLevel + 1;

  //     let old_xp: number = A * Math.exp(B * (i - 1));
  //     let new_xp: number = A * Math.exp(B * i);

  //     const round = abTotalMax * (i / 100);
  //     let thisLevel = Math.ceil(round - prevOn);
  //     if (thisLevel <= 0) {
  //       thisLevel = 1;
  //     }

  //     prevOn += thisLevel;
  //     if (!hasPersLevel) {
  //       startExp = exp;
  //       ons += thisLevel;
  //       let multiplicator = new_xp - old_xp;
  //       exp += ons * multiplicator;
  //       nextExp = exp;
  //       if (exp > prs.exp) {
  //         hasPersLevel = true;
  //         persLevel = numLevel;
  //       }
  //     }

  //     numLevel++;
  //   } while (!hasPersLevel || !hasMaxLevel);
  //   return { prevOn, startExp, exp, ons, nextExp, persLevel };
  // }
  private filterRevs(revType: any) {
    return this.pers$.value.rewards.filter((n) => n.rare == revType);
  }

  private getAbVal(tesVal: number, isOpen: boolean, tskValue: number): number {
    if (!this.gameSettings.isClassicaRPG) {
      let val = Math.floor(tesVal / 10.0);

      if (isOpen) {
        val = val + this.gameSettings.minAbilLvl;
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

  private getPlusState(tsk: Task, progr: number, progrSt: number, isCur: boolean) {
    let plusState = "";
    // Состояния
    if (tsk.states.length > 0) {
      let stateInd = this.tesTaskTittleCount(progrSt, tsk.states.length - 1, "State");

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
        if (el.trim().length == 0) {
          el = tsk.name;
        }

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
            let el = tsk.states[q].name;
            if (el.trim().length == 0) {
              el = tsk.name;
            }

            plus.push(el + statePostfix);
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
        // aimDone = tsk.counterDone;
      }

      plusState += " " + this.getAimString(this.tesTaskTittleCount(progr, tsk.aimTimer, tsk.aimUnit, aimDone, tsk.isEven), tsk.aimUnit, tsk.postfix);
    }

    return plusState;
  }

  private getProgrForTittle(tskVal: number, isPerk: boolean, isMegaPlan: boolean, isState: boolean) {
    tskVal = tskVal - this.gameSettings.minAbilLvl;
    if (tskVal < 0) {
      tskVal = 0;
    }

    let progr;

    if (isPerk) {
      progr = 1;
    } else {
      progr = tskVal / (this.gameSettings.maxAbilLvl - this.gameSettings.minAbilLvl);
    }

    return progr;
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

    let lvl = persLevel - 1;
    if (lvl < 0) {
      lvl = 0;
    }

    let gainedOns = lvl;
    let startOn = this.gameSettings.abPointsStart;

    const totalGained = startOn + gainedOns;

    ons = totalGained - abOpenned;

    prs.mayAddAbils = totalGained - abCount >= 1;

    if (ons < 0) {
      ons = 0;
    }

    return ons;
  }

  private getTaskChangesExp(task: Task, isPlus: boolean, subTask: taskState = null, subTasksCoef: number = 1, isChangeAb: boolean = false) {
    let koef = this.getWeekKoef(task.requrense, isPlus, task.tskWeekDays);

    // При пропуске учитывается количество пропусков задачи
    if (!isPlus && task.failCounter > 0) {
      const failMod = task.failCounter + 1;
      koef = koef * failMod;
    }

    // При пропуске штраф с коефициентом
    // if (!isPlus) {
    //   koef = koef * this.gameSettings.failKoef;
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
      let tesKoef = this.gameSettings.getTesChangeKoef(tesVal, this.pers$.value.level);

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
    stT.counterDone = st.counterDone;
    stT.counterToDone = tsk.counterToDone;
    stT.descr = tsk.descr;
    stT.isAlarmEnable = tsk.isAlarmEnable;
    stT.isCounterEnable = tsk.isCounterEnable;
    if (st.isActive == false) {
      stT.notActive = true;
    } else {
      stT.notActive = false;
    }

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
          const progr = this.getProgrForTittle(cur, tsk.isPerk, false, false);
          let plus = this.getAimString(this.tesTaskTittleCount(progr, tsk.aimTimer, tsk.aimUnit, aimVal, tsk.isEven), tsk.aimUnit, tsk.postfix);
          plusName += " " + plus;
        } else {
          // plusName += " " + plusTimerOrCounter;

          let aimVal = 0;
          // aimVal = st.counterDone;

          const cur = tsk.value;
          const progr = this.getProgrForTittle(cur, tsk.isPerk, false, false);
          let plus = this.getAimString(this.tesTaskTittleCount(progr, tsk.aimTimer, tsk.aimUnit, aimVal, tsk.isEven), tsk.aimUnit, tsk.postfix);
          plusName += " " + plus;
        }
      }
    }

    if (plusName.trim().length == 0) {
      stT.tittle = tsk.name;
    } else {
      if (tsk.isStatePlusTitle) {
        stT.tittle = tsk.name + ": " + plusName;
      } else {
        stT.tittle = plusName;
      }
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
      this.GetRndEnamy(st, prs.level, this.gameSettings.maxPersLevel);
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

  private recountAbilMayUp(prs: Pers) {
    let on = prs.ON;
    let anySame = false;

    for (let ch of prs.characteristics) {
      for (let ab of ch.abilities) {
        for (let tsk of ab.tasks) {
          if (on < this.gameSettings.abCost(tsk.value, tsk.hardnes, tsk.isPerk) && this.gameSettings.isAbPointsEnabled) {
            tsk.mayUp = false;
            tsk.IsNextLvlSame = false;
            ab.HasSameAbLvl = false;
          }

          if (tsk.value < 1 || !tsk.mayUp) {
            tsk.IsNextLvlSame = false;
            ab.HasSameAbLvl = false;
          }

          if (tsk.IsNextLvlSame) {
            anySame = true;
            ab.HasSameAbLvl = true;
          }
        }
      }

      ch.anyMayUp = ch.abilities.some((q) => q.tasks.some((qq) => qq.mayUp));
      ch.HasSameAbLvl = ch.abilities.some((q) => q.tasks.some((qq) => qq.IsNextLvlSame));
      ch.abilities = ch.abilities.sort(this.abSorter());
    }

    if (!this.gameSettings.isMayUpNotSame) {
      if (anySame) {
        for (let ch of prs.characteristics) {
          for (let ab of ch.abilities) {
            for (let tsk of ab.tasks) {
              if (!tsk.IsNextLvlSame) {
                tsk.mayUp = false;
              }
            }
          }
        }
      }
    }

    prs.characteristics = prs.characteristics.sort(this.chaSorter());
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

    if (this.gameSettings.isCeilProgressBar) {
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
      if (this.gameSettings.isShowAbProgrTable) {
        for (let i = 0; i <= this.gameSettings.maxAbilLvl; i++) {
          const progr = this.getProgrForTittle(i, tsk.isPerk, isMegaPlan, false);
          const progrSt = this.getProgrForTittle(i, tsk.isPerk, isMegaPlan, true);
          const pSt = this.getPlusState(tsk, progr, progrSt, false);

          tsk.statesDescr.push(pSt);
        }
      }

      // Текущий уровень
      const cur = tsk.value;
      const progr = this.getProgrForTittle(cur, tsk.isPerk, isMegaPlan, false);
      const progrSt = this.getProgrForTittle(cur, tsk.isPerk, isMegaPlan, true);

      if (tsk.aimTimer && !this.isCounterAim(tsk)) {
        tsk.secondsToDone = this.tesTaskTittleCount(progr, tsk.aimTimer, tsk.aimUnit);
      }

      let plusState = this.getPlusState(tsk, progr, progrSt, true);

      if (!this.gameSettings.isShowAbProgrTable) {
        tsk.statesDescr.push(plusState);
      }

      if (plusState && plusState.trim().length > 0) {
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
        plusState = tsk.name;
      }

      tsk.curLvlDescr = plusState.trim();
      tsk.curLvlDescr2 = " (" + plusState.trim() + ")";
      tsk.curLvlDescr3 = plusState.trim();

      if (cur <= this.gameSettings.maxAbilLvl && tsk.statesDescr[cur] == tsk.statesDescr[cur + 1]) {
        tsk.IsNextLvlSame = true;
      }
    } else {
      for (let i = 0; i <= this.gameSettings.maxAbilLvl; i++) {
        if (this.gameSettings.isShowAbProgrTable || i == tsk.value) {
          tsk.statesDescr.push(tsk.name);
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
}
