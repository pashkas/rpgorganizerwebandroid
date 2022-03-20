import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Pers } from 'src/Models/Pers';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { FirebaseUserModel } from 'src/Models/User';
import { Characteristic } from 'src/Models/Characteristic';
import { Ability } from 'src/Models/Ability';
import { Task, taskState, IImg } from 'src/Models/Task';
import { take, share, map } from 'rxjs/operators';
import { Qwest } from 'src/Models/Qwest';
import { Reward } from 'src/Models/Reward';
import { plusToName } from 'src/Models/plusToName';
import { Rangse } from 'src/Models/Rangse';
import { Router } from '@angular/router';
import { PerschangesService } from './perschanges.service';
import { EnamiesService } from './enamies.service';
import { Diary } from 'src/Models/Diary';
import * as moment from 'moment';
import { SamplePers } from 'src/Models/SamplePers';
import { curpersview } from 'src/Models/curpersview';
import { UserService } from './user.service';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class PersService {
  // Персонаж
  private unsubscribe$ = new Subject();

  _tesMaxLvl: number = 100;
  _tesStartOn: number = 5;
  absMap: any;
  allMap: {};
  isAutoPumpInProcess: boolean = false;
  isDialogOpen: boolean = false;
  isGlobalTaskView: boolean;
  isOffline: boolean = false;
  isOnline: boolean;
  isSynced: boolean = false;
  mn1Count: number = 62;
  mn2Count: number = 136;
  mn3Count: number = 617;
  mn4Count: number = 655;
  mn5Count: number = 281;
  pers$ = new BehaviorSubject<Pers>(null);
  currentView$ = new BehaviorSubject<curpersview>(curpersview.SkillTasks); currentTask$ = new BehaviorSubject<Task>(null);

  twoDaysTes = 12.546;
  // Пользователь
  user: FirebaseUserModel;

  constructor(public db: AngularFirestore, private router: Router, private changes: PerschangesService, private enmSrv: EnamiesService, public userService: UserService, public dialog: MatDialog) {
    this.isOffline = true;
    this.getPers();
  }

  getPers() {
    let prsJson = localStorage.getItem("pers");
    if (prsJson) {
      this.setPers(prsJson);
    } else {
      this.userService.getCurrentUser()
        .then(res => {
          this.loadPers(res.uid)
            .pipe(take(1))
            .subscribe(n => {
              let prs: Pers = n as Pers;
              if (prs != null) {
                this.setPers(JSON.stringify(prs));
              } else {
                const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                  panelClass: 'custom-black'
                });

                dialogRef.afterClosed()
                  .pipe(take(1))
                  .subscribe(result => {
                    if (result) {
                      this.setNewPers(res.uid);
                    }
                  });
              }
            });
        }, err => {
          this.router.navigate(['/login']);
        });
    };
  }

  get _maxAbilLevel(): number {
    return 100;
  }

  get _maxCharactLevel(): number {
    return 100;
  }

  get baseTaskPoints(): number {
    return 12.0;
  }

  /**
   * Добавить новую награду.
   */
  AddRevard(rev: Reward): any {
    this.pers$.value.rewards.push(rev);
  }

  /**
   * Проверка и задание даты для задачи.
   * @param tsk Задача.
   */
  CheckSetTaskDate(tsk: Task): any {
    let tDate = new Date(tsk.date);

    while (true) {
      if (tsk.requrense === 'дни недели' && tsk.tskWeekDays.length === 0) {
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
    this.pers$.value.characteristics.splice(this.pers$.value.characteristics.findIndex(n => n.id == uuid), 1);
  }

  /**
   * Завершить квест.
   * @param qw Идентификатор квестов.
   */
  DoneQwest(qw: Qwest): any {
    // Добавляем к персонажу награды от квеста
    qw.rewards.forEach(rew => {
      this.pers$.value.inventory.push(rew);
    });

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
    // if (this.pers$.value.isTES && tsk.requrense != 'нет') {
    //   if (tsk.parrentTask) {
    //     if (this.allMap[tsk.parrentTask] && this.allMap[tsk.parrentTask].item) {
    //       lvl = Math.floor(this.allMap[tsk.parrentTask].item.value);
    //     }
    //   }
    //   else {
    //     lvl = Math.floor(tsk.value);
    //   }
    //   maxlvl = this._maxAbilLevel;
    // }

    let mnstrLvl = this.getMonsterLevel(lvl, maxlvl);

    tsk.imageLvl = '' + mnstrLvl;
    tsk.image = this.getImgPathRandome(mnstrLvl);

    return;
  }

  abSorter(): (a: Ability, b: Ability) => number {
    return (a, b) => {
      let aTask = a.tasks[0];
      let bTask = b.tasks[0];

      // Макс?
      let aMax = aTask.value == this._maxAbilLevel ? 1 : 0;
      let bMax = bTask.value == this._maxAbilLevel ? 1 : 0;
      if (aMax != bMax) {
        return (aMax - bMax);
      }

      // Открыта?
      let aIsOpen = a.isOpen ? 1 : 0;
      let bIsOpen = b.isOpen ? 1 : 0;;
      if (aIsOpen != bIsOpen) {
        return -(aIsOpen - bIsOpen);
      }

      // Можно открыть
      let aMayUp = (aTask.mayUp || aTask.value == this._maxAbilLevel) ? 1 : 0;
      let bMayUp = (bTask.mayUp || bTask.value == this._maxAbilLevel) ? 1 : 0;

      if (aMayUp != bMayUp) {
        return -(aMayUp - bMayUp);
      }

      // Значение
      if (a.value != b.value) {
        return (a.value - b.value);
      }

      // Сложность
      if (aTask.hardnes != bTask.hardnes) {
        return aTask.hardnes - bTask.hardnes;
      }

      // Перк?
      let aperk = aTask.isPerk ? 1 : 0;
      let bperk = bTask.isPerk ? 1 : 0;

      if (aperk != bperk) {
        return (aperk - bperk);
      }

      return a.name.localeCompare(b.name);
    };
  }

  /**
   * Добавить навык.
   * @param charactId Идентификатор характеристики.
   */
  addAbil(charactId: string, name: string): any {
    var charact: Characteristic = this.pers$.value.characteristics.filter(n => {
      return n.id === charactId;
    })[0];
    if (charact != null && charact != undefined) {
      var abil = new Ability();
      abil.name = name;

      if (Pers.GameSettings.isNoAbilities) {
        this.addTsk(abil, name);
      }

      charact.abilities.push(abil);
    }
  }

  /**
   * Добавление новой характеристики.
   * @param newCharact Название.
   */
  addCharact(newCharact: string): any {
    var cha = new Characteristic();
    cha.name = newCharact;
    this.pers$.value.characteristics.push(cha);
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
  }

  /**
   * Добавить новую задачу к навыку
   * @param abil Навык.
   * @param newTsk Название задачи.
   */
  addTsk(abil: Ability, newTsk: string): any {
    var tsk = new Task();
    tsk.name = newTsk;

    this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);

    abil.tasks.push(tsk);
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
    }
    else {
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
        return (a.value - b.value);
      }

      return a.name.localeCompare(b.name);
    }
  }

  chainGetDateById(id: string): number {
    if (!this.allMap[id].item.date) {
      return new Date(this.allMap[id].link.date).setHours(0, 0, 0, 0);
    }
    else {
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
    prs.chainTable = prs.chainTable
      .filter(n => n != 'end_line' && !this.isNullOrUndefined(this.allMap[n]));

    // Добавляем записи, которых нет в таблице
    for (let i = 0; i < prs.tasks.length; i++) {
      const tsk = prs.tasks[i];

      let inChain = prs.chainTable.find(n => n == tsk.id);
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
        return a + b.abilities.filter(n => n.value >= 1).length;
      }, 0);
      this.pers$.value.expKoef += (changeMinus / (openAbs * 2));
    }
    else {
      this.pers$.value.expKoef -= changeMinus;
    }
    if (this.pers$.value.expKoef > 0) {
      this.pers$.value.expKoef = 0;
    }
    if (this.pers$.value.expKoef < -2) {
      this.pers$.value.expKoef = -2;
    }
  }

  changeTes(task: Task, isUp: boolean, subTasksCoef: number = 1) {
    let change = this.getTaskChangesExp(task, isUp, null, subTasksCoef);

    if (isUp) {
      task.tesValue += change;
    }
    else {
      task.tesValue -= change;
      if (task.tesValue < 0) {
        task.tesValue = 0;
      }
    }

    let nextChange = this.getTaskChangesExp(task, isUp, null, subTasksCoef);
    task.nextAbVal = Math.floor(task.tesValue + nextChange);
  }

  changesAfter(isGood) {
    if (isGood == null) {
      isGood = true;
    }

    this.changes.afterPers = this.changes.getClone(this.pers$.value);
    this.changes.showChanges(this.getCongrantMsg(), this.getFailMsg(), isGood);
  }

  changesBefore() {
    this.changes.beforePers = this.changes.getClone(this.pers$.value);
  }

  /**
   * Проверка даты задачи.
   * @param tDate Дата задачи.
   * @param requrense Повтор задачи.
   */
  checkDate(tDate: Date, requrense: string, weekDays: string[]): any {
    if (requrense === "ежедневно"
      || requrense === "нет"
      || requrense === "через 1 день"
      || requrense === "через 2 дня"
      || requrense === "через 3 дня") {
      return true;
    }

    let weekDay = tDate.getDay();

    if (requrense === "будни") {
      if (weekDay === 1
        || weekDay === 2
        || weekDay === 3
        || weekDay === 4
        || weekDay === 5) {
        return true;
      }
    } else if (requrense === "выходные") {
      if (weekDay === 6
        || weekDay === 0) {
        return true;
      }
    } else if (requrense === 'дни недели') {
      switch (weekDay) {
        case 1:
          return weekDays.includes('пн');
        case 2:
          return weekDays.includes('вт');
        case 3:
          return weekDays.includes('ср');
        case 4:
          return weekDays.includes('чт');
        case 5:
          return weekDays.includes('пт');
        case 6:
          return weekDays.includes('сб');
        case 0:
          return weekDays.includes('вс');

        default:
          return false;
      }
    }
    else if (requrense === "пн,ср,пт") {
      if (weekDay === 1
        || weekDay === 3
        || weekDay === 5) {
        return true;
      }
    } else if (requrense === "вт,чт,сб") {
      if (weekDay === 2
        || weekDay === 4
        || weekDay === 6) {
        return true;
      }
    } else if (requrense === "пн,вт,чт,сб") {
      if (weekDay === 1
        || weekDay === 2
        || weekDay === 4
        || weekDay === 6) {
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
          }
          else {
            return false;
          }
        }
        else {
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
    this.pers$.value.Diary.unshift(new Diary(moment().startOf('day').toDate(), []));
  }

  // checkTaskStates(tsk: Task) {
  //   tsk.statesDescr = [];
  //   // Ability.rangse.forEach(rang => {
  //   //   // Последний ранг не добавляем
  //   //   // if (rang.val < Ability.maxValue) {
  //   //   this.addTaskDescrState(rang, tsk);
  //   //   //}
  //   // });
  // }

  /**
   * Расчет таблицы для кумулятивных расчетов получения наград.
   */
  countRewProbCumulative(): any {
    let cumulative = 0;
    this.pers$.value.rewards.forEach(r => {
      cumulative += r.probability / 100;
      r.cumulative = cumulative;
    });
  }

  countTesExp(tesAbTotalMax: number, tesAbTotalCur: number): number {
    let exp = tesAbTotalCur / 25;

    return exp;
  }

  countToatalRewProb() {
    if (this.pers$.value.rewards.length === 0) {
      this.pers$.value.totalRewardProbability = 0;
    }
    else {
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
    this.pers$.value.characteristics.forEach(cha => {
      cha.abilities = cha.abilities.filter(n => {
        return n.id != id
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
    this.pers$.value.inventory = this.pers$.value.inventory.filter(n => {
      return n != rev;
    });
  }

  /**
   * Удалить квест.
   * @param id Идентификатор квеста.
   */
  delQwest(id: string): any {
    this.removeParrents(id);
    this.pers$.value.qwests = this.pers$.value.qwests.filter(n => {
      return n.id != id;
    });
  }

  /**
   * Удаление награды.
   * @param id Идентификатор.
   */
  delReward(id: string): any {
    this.pers$.value.rewards = this.pers$.value.rewards.filter(n => {
      return n.id != id;
    });
  }

  /**
   * Удаление задачи у навыка.
   * @param abil Навык
   * @param id Идентификатор задачи
   */
  delTask(abil: Ability, id: string): any {
    abil.tasks = abil.tasks.filter(n => { return n.id != id });
  }

  /**
  * Удаление задачи у навыка.
  * @param abil Навык
  * @param id Идентификатор задачи
  */
  delTaskfromQwest(qwest: Qwest, id: string): any {
    qwest.tasks = qwest.tasks.filter(n => { return n.id != id });
  }

  downAbility(ab: Ability) {
    let isOpen: Boolean = true;

    for (let i = 0; i < ab.tasks.length; i++) {
      const tsk: Task = ab.tasks[i];

      // Обнуляем фэйлы
      tsk.failCounter = 0;
      for (let j = 0; j < tsk.states.length; j++) {
        const st = tsk.states[j];
        st.failCounter = 0;
      }

      if (tsk.value < 1) {
        continue;
      }

      if (tsk.value == 1) {
        isOpen = false;
      }

      let prevTaskVal = tsk.value;

      let curTaskValue = tsk.value;

      if (tsk.isPerk) {
        tsk.value = 0;
      }
      else {
        let tskDescr = tsk.statesDescr[tsk.value];
        for (let i = tsk.value; i > 0; i--) {
          if (i == 0) {
            tsk.value = 0;
          }
          else {
            if (tsk.hardnes == 0.5) {
              tsk.value -= 2;
            }
            else {
              tsk.value -= 1;
            }
            if (tsk.value < 0) {
              tsk.value = 0;
            }
            if (tsk.statesDescr[tsk.value] != tskDescr) {
              break;
            }
          }
        }
      }

      this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
      tsk.states.forEach(st => {
        st.value = tsk.value;
        this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
      });

      this.changeLvlAbLogic(tsk, prevTaskVal, curTaskValue);
    }

    //todo
    if (isOpen == false) {
      ab.isOpen = false;
    }

    this.savePers(true, 'minus');

    // if (this.pers$.value.ON > 0) {
    //   this.router.navigate(['/pers']);
    // }
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

  getAbTesLvl(tesValue: number): number {
    let levels: number = this._maxAbilLevel + 1;
    let xp_for_first_level: number = 0.7;
    let xp_for_last_level: number = this._tesMaxLvl;

    let B: number = Math.log(xp_for_last_level / xp_for_first_level) / (levels - 1);
    let A: number = xp_for_first_level / (Math.exp(B) - 1.0);

    let abTesLvl = 0;

    for (let i = 1; i <= levels; i++) {
      let old_xp: number = A * Math.exp(B * (i - 1));
      let new_xp: number = A * Math.exp(B * (i));

      let lvlExp = new_xp - old_xp;

      if (lvlExp > tesValue) {
        abTesLvl = i - 1;

        break;
      }
    }

    return abTesLvl;
  }

  getAimString(aimVal: number, aimUnit: string): string {
    if (aimUnit == 'Раз') {
      return aimVal + '✓';
    }

    let seconds = aimVal;

    let h = 0;
    let min = 0;
    let sec = 0;

    h = Math.floor(seconds / 3600);
    seconds %= 3600;
    min = Math.floor(seconds / 60);
    sec = seconds % 60;

    let result = '';

    if (h > 0) {
      result += h + 'ч '
    }

    if (min > 0 || (h > 0 && sec > 0)) {
      result += min + 'м '
    }

    if (sec > 0) {
      result += sec + 'с '
    }

    return result;
  }

  getAimValueWithUnit(aimVal: number, aimUnit: string): number {
    if (aimUnit == 'Минут') {
      return aimVal * 60;
    }

    if (aimUnit == 'Часов') {
      return aimVal * 60 * 60;
    }

    return aimVal;
  }

  /**
   * Загрузить персонажей с уровнем, большим чем 0;
   */
  getChampions(): Observable<any> {
    //var dat = new Date();
    //dat.setDate(dat.getDate() - 21);

    return this.db.collection<Pers>('/pers', ref => ref.where('level', '>=', 1)
      .orderBy('level', 'desc'))
      .valueChanges()
      .pipe(
        map(champ => champ.map(n => {
          return { Name: n.name, Level: n.level, Pic: n.image ? n.image : n.rang.img, Id: n.id, date: new Date(n.dateLastUse) };
        })),
        //.filter(n => n.date.valueOf() >= dat.valueOf())),
        take(1),
        share()
      );
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
    let result: string = ''; //'assets/img/' + lvl + '/';

    let ss = '000' + num;
    ss = ss.substr(ss.length - 3);

    result += ss; // + '.jpg';

    return result;
  }

  getImgPathRandome(lvl: number): string {
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

      default:
        max = this.mn1Count;
        break;
    }

    if (!this.pers$.value.mnstrCounter) {
      this.pers$.value.mnstrCounter = 0;
    }
    if (this.pers$.value.mnstrCounter >= max) {
      this.pers$.value.mnstrCounter = 0;
    }

    this.pers$.value.mnstrCounter++;
    im = this.pers$.value.mnstrCounter;

    //im = this.randomInteger(1, max);

    let result: string = '';

    let ss = '000' + im;
    ss = ss.substr(ss.length - 3);

    result += ss;

    return result;
  }

  getQwestExpChange(qwHardness: number) {
    let exp = (this.pers$.value.nextExp - this.pers$.value.prevExp) * 10.0;
    let expChange = 0;
    switch (qwHardness) {
      case 1:
        expChange = exp * 0.20;
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

  getSet(tsk: Task, aim: number, aimUnit: string): number[] {
    let result: number[] = [];

    let av = this.getAimValueWithUnit(aim, aimUnit);

    // this.getSetMaxNeatEnd(aim, result, tsk);

    if (av > this.pers$.value.maxAttrLevel) {
      this.getSetMaxNeatEnd(av, result, tsk);
    }
    else {
      this.getSetLinear(av, result, tsk);
    }

    if (tsk.hardnes == 0.5) {
      let prev = result[result.length - 1];
      for (let i = result.length - 1; i > 0; i--) {
        if (i % 2 != 0) {
          let tmp = result[i];
          result[i] = prev;
          prev = tmp;
        }
        else {
          result[i] = prev;
        }
      }
    }

    return result;
  }

  getTskValForState(value: number, maxValue: number) {
    let progres = (Math.floor(value)) / (+this.pers$.value.maxAttrLevel);
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

    if (requrense === 'будни') {
      return base / 5.0;
    }
    if (requrense === 'выходные') {
      return base / 2.0;
    }
    if (requrense === 'ежедневно') {
      return base / 5.0;
    }
    if (requrense === 'пн,ср,пт') {
      return base / 3.0;
    }
    if (requrense === 'вт,чт,сб') {
      return base / 3.0;
    }
    if (requrense === 'пн,вт,чт,сб') {
      return base / 4.0;
    }
    if (requrense === 'не суббота') {
      return base / 5.0;
    }
    if (requrense === 'не воскресенье') {
      return base / 5.0;
    }
    if (requrense === 'дни недели') {
      return base / weekDays.length;
    }
    if (isPlus) {
      if (requrense === 'через 1 день') {
        return (base / 7.0) * 2;
      }
      if (requrense === 'через 2 дня') {
        return (base / 7.0) * 3;
      }
      if (requrense === 'через 3 дня') {
        return (base / 7.0) * 4;
      }
    }

    return 1.0;
  }

  isNullOrUndefined(ob) {
    if (ob == null || ob == undefined) {
      return true;
    }

    return false;
  }

  /**
   * Загрузить персонажа из БД.
   * @param userId Идентификатор пользователя
   */
  loadPers(userId: string) {
    return this.db.collection<Pers>('pers').doc(userId).valueChanges().pipe(take(1), share());
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  openCharact(id: any) {
    this.router.navigate(['/pers/characteristic', id]);
  }

  openPers() {
    this.router.navigate(['/pers']);
  }

  openTask(id: any) {
    this.router.navigate(['/pers/task', id, false]);
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
    prs.characteristics.forEach(ch => {
      ch.abilities.forEach(ab => {
        ab.tasks.forEach(tsk => {
          this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
          tsk.states.forEach(st => {
            this.GetRndEnamy(st, this.pers$.value.level, this.pers$.value.maxPersLevel);
          });
        });
      });
    });

    prs.qwests.forEach(qw => {
      qw.tasks.forEach(tsk => {
        this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
      });
    });

    this.savePers(false);
  }

  returnToAdventure() {
    this.pers$.value.isRest = false;
    for (const ch of this.pers$.value.characteristics) {
      for (const ab of ch.abilities) {
        for (const tsk of ab.tasks) {
          let tskDate: moment.Moment = moment(tsk.date);
          if (tskDate.isBefore(moment(new Date()), 'd')) {
            tsk.date = new Date();
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

    this.getAllMapping(prs);

    let abOpenned = 0;
    let abCount = 0;
    let abTotalMax = 0;
    let tesAbTotalCur = 0;
    let abTotalCur = 0;
    let tesAbTotalMax = 0;
    if (!prs.currentView) {
      prs.currentView = curpersview.SkillTasks;
    }

    let tasks: Task[] = [];

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
      let abMax = 0;
      let abCur = 0;
      let tesAbMax = 0;
      let tesAbCur = 0;
      let isHasSameAbil = false;

      for (const ab of ch.abilities) {
        for (const tsk of ab.tasks) {
          if (tsk.tesValue == null || tsk.tesValue == undefined || tsk.tesValue < 0) {
            tsk.tesValue = 0;
          }

          if (tsk.tesAbValue == null || tsk.tesAbValue == undefined || tsk.tesAbValue < 0) {
            tsk.tesAbValue = 0;
          }

          tsk.hardnes = 1;
          abCount += 1;

          if (!tsk.tskWeekDays) {
            tsk.tskWeekDays = [];
          }

          if (tsk.tskWeekDays.length == 0) {
            tsk.tskWeekDays.push('пн');
          }

          if (!tsk.aimUnit) {
            if (tsk.aimCounter > 0) {
              tsk.aimUnit = 'Раз';
              tsk.aimTimer = tsk.aimCounter;
              tsk.aimCounter = 0;
            } else {
              tsk.aimUnit = 'Минут';
            }
          }

          if (this.isNullOrUndefined(tsk.time)) {
            tsk.time = "00:00";
          }

          if (!prs.isTES) {
            if (tsk.isPerk && tsk.value >= 1) {
              tsk.value = 10;
            }
          } else {
            tsk.value = Math.floor(tsk.tesValue);

            tsk.failCounter = 0;
          }

          if (tsk.value < 0) {
            tsk.value = 0;
          }
          if (tsk.value > this._maxAbilLevel) {
            tsk.value = this._maxAbilLevel;
          }

          tsk.isCounter = false;
          tsk.isTimer = false;

          tsk.plusToNames = [];
          tsk.plusToNames.push(new plusToName(ch.name, ch.id, '/pers/characteristic', ''));

          this.setTaskTittle(tsk, prs.isMegaPlan);

          if (tsk.requrense != 'нет') {
            tsk.plusToNames.unshift(new plusToName('' + tsk.time, null, null, ''));

            if (!prs.isTES) {
              let exp = 0;

              if (tsk.isSumStates && tsk.states.length > 0) {
                exp = this.getSubtaskExpChange(tsk, true, tsk.states[0]) * 10.0;
              } else {
                exp = this.getTaskChangesExp(tsk, true) * 10.0;
              }

              tsk.plusToNames.push(new plusToName('+' + exp + ' exp', null, null, ''));
            }
          }

          this.CheckSetTaskDate(tsk);

          for (const st of tsk.states) {
            st.parrentTask = tsk.id;
            if (this.isNullOrUndefined(st.time)) {
              st.time = "00:00";
            }

            if (prs.isTES) {
              st.failCounter = 0;
            }
          }

          ab.name = tsk.name;

          // Что навык настроен
          if (tsk.value < 1
            && tsk.requrense == 'будни'
            && tsk.aimCounter == 0
            && tsk.aimTimer == 0
            && tsk.states.length == 0
            && tsk.isPerk == false
            && tsk.hardnes == 1
          ) {
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

          if (!prs.isTES) {
            // Чтобы с каждым уровнем в задаче что-то менялось
            if (tsk.value < 10 && tsk.value > 0) {
              for (let i = tsk.value + 1; i <= 10; i++) {
                const cur = tsk.statesDescr[tsk.value];
                const next = tsk.statesDescr[i];
                if (next != cur) {
                  break;
                }
                tsk.value = i;
              }
            }

            // Легкие сразу по два уровня
            if (tsk.hardnes == 0.5 && tsk.value % 2 != 0) {
              tsk.value = tsk.value + 1;
            }
          }

          if (tsk.value < 0) {
            tsk.value = 0;
          }
          if (tsk.value > this._maxAbilLevel) {
            tsk.value = this._maxAbilLevel;
          }

          tsk.progressValue = (tsk.value / this._maxAbilLevel) * 100;

          abMax += this._maxAbilLevel;
          abCur += tsk.value;
          tesAbMax += this._tesMaxLvl;
          tesAbCur += tsk.tesValue;

          if (tsk.value <= 9
            && doneReq) {
            tsk.mayUp = true;
          } else {
            tsk.mayUp = false;
          }
          if (prs.isTES && ab.isOpen) {
            tsk.mayUp = false;
          }

          ab.value = tsk.value;
          ab.progressValue = tsk.progressValue;

          const rng = new Rangse();

          if (!prs.isTES) {
            if (tsk.isPerk) {
              if (tsk.value == 0) {
                rng.name = "-";
              } else {
                rng.name = "👍";
              }
            }
            else {
              if (tsk.value == 10) {
                rng.name = "👍";
              } else {
                rng.name = tsk.value + '';
              }
            }
          }
          else {
            if (ab.isOpen == false) {
              rng.name = '-';
            } else {
              rng.name = tsk.value + '';
            }
          }

          ab.rang = rng;

          if (prs.currentView == curpersview.SkillTasks
            || prs.currentView == curpersview.SkillsSort
            || prs.currentView == curpersview.SkillsGlobal) {
            if ((prs.isMegaPlan && prs.currentView == curpersview.SkillsSort) || (doneReq && (tsk.value >= 1 || (prs.isTES && ab.isOpen)))) {
              if (tsk.isSumStates && tsk.states.length > 0 && !tsk.isStateInTitle) {
                if (this.checkTask(tsk) || prs.currentView == curpersview.SkillsSort) {
                  for (const st of tsk.states) {
                    if (
                      (prs.isMegaPlan && prs.currentView == curpersview.SkillsSort) ||
                      (st.isActive
                        && (!st.isDone || prs.currentView == curpersview.SkillsSort))) {
                      let stT = this.getTskFromState(tsk, st, false);
                      tasks.push(stT);
                    }
                  }
                }
              }
              else {
                if (this.checkTask(tsk) || prs.currentView == curpersview.SkillsSort) {
                  if (prs.isAutofocus) {
                    tsk.plusToNames.shift();
                  }
                  tasks.push(tsk);
                }
              }
            }
          }

          if (tsk.mayUp == false) {
            tsk.IsNextLvlSame = false;
          }

          if (tsk.IsNextLvlSame) {
            isHasSameAbil = true;
          }
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

      if (abMax == 0) {
        abMax = 1;
      }

      const start = ch.startRang.val;
      let left = this._maxCharactLevel - start;
      let progr = (abCur / abMax);
      ch.value = start + (left * progr);
      const chaCeilProgr = Math.floor(ch.value);
      ch.progressValue = (chaCeilProgr / this._maxCharactLevel) * 100;

      const rng = new Rangse();
      rng.val = chaCeilProgr;
      rng.name = chaCeilProgr + '';
      ch.rang = rng;

      ch.abilities = ch.abilities.sort(this.abSorter());
    }

    prs.characteristics
      = prs.characteristics.sort(this.chaSorter());

    for (const qw of prs.qwests) {
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
          abLink.item.tasks[0].plusToNames.push(new plusToName('🔗 ' + qw.name, qw.id, '', 'qwestTask'));

          for (const st of abLink.item.tasks[0].states) {
            let stt = this.allMap['stt' + st.id];
            if (this.allMap['stt' + st.id]) {
              stt.item.plusToNames.push(new plusToName('🔗 ' + qw.name, qw.id, '', 'qwestTask'));
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
        tsk.plusToNames.push(new plusToName(qw.name, qw.id, '/pers/qwest', ''));
        if (qw.abilitiId) {
          let abLink = this.allMap[qw.abilitiId].item;
          if (abLink) {
            tsk.plusToNames.push(new plusToName('🔗 ' + abLink.name, qw.id, '', 'abTask'));
          }
        }

        let noDoneStates: taskState[] = [];
        for (const st of tsk.states) {
          if (!st.isDone) {
            noDoneStates.push(st);
          }
        }

        if ((prs.currentView == curpersview.QwestSort)
          && !qw.isNoActive
          && (qw.id == prs.currentQwestId || !prs.currentQwestId)) {
          if (noDoneStates.length > 0 && prs.currentView != curpersview.QwestSort) {
            for (const st of noDoneStates) {
              tasks.push(this.getTskFromState(tsk, st, false));
              if (!prs.currentQwestId) {
                prs.currentQwestId = qw.id;
              }
            }
          }
          else {
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
      }
      else {
        qw.progressValue = (doneTasks / totalTasks) * 100;
      }

      this.sortQwestTasks(qw);

      if ((prs.currentView == curpersview.QwestTasks || prs.currentView == curpersview.QwestsGlobal)
        && !qw.isNoActive && totalTasks > 0 && totalTasks != doneTasks) {
        if (this.checkTask(qw.tasks[0])) {
          tasks.push(qw.tasks[0]);
        }
      }
    }

    let root = prs.qwests.filter(q => !q.parrentId)
      .sort((a, b) => {
        let aIsDeal = a.name == 'Дела' ? 1 : 0;
        let bIsDeal = b.name == 'Дела' ? 1 : 0;
        if (aIsDeal != bIsDeal) {
          return (aIsDeal - bIsDeal);
        }

        if (a.progressValue != b.progressValue) {
          return a.progressValue - b.progressValue;
        }

        return a.name.localeCompare(b.name);
      });

    let child = prs.qwests
      .sort((a, b) => {
        if (a.progressValue != b.progressValue) {
          return a.progressValue - b.progressValue;
        }

        return a.name.localeCompare(b.name);
      })
      .filter(q => q.parrentId);
    let ordered: Qwest[] = [];

    while (root.length > 0) {
      let r = root.pop();
      let stack: Qwest[] = [];
      stack.push(r);
      while (stack.length > 0) {
        let cur = stack.pop();
        ordered.push(cur);
        let nextIdx = child.findIndex(n => n.parrentId == cur.id);
        if (nextIdx != -1) {
          stack.push(child[nextIdx]);
          child.splice(nextIdx, 1);
        }
      }
    }

    ordered = ordered.sort((a, b) => {
      return +a.isNoActive - +b.isNoActive;
    });

    prs.qwests = ordered;

    // prs.Diary = [];

    prs.tasks = tasks;

    if (prs.currentView == curpersview.SkillTasks || prs.currentView == curpersview.SkillsSort || prs.currentView == curpersview.SkillsGlobal) {
      this.chainOrganize(prs);

      this.sortPersTasks(prs);
    }

    this.setCurPersTask(prs);

    let persLevel = 0;
    let exp: number = 0;
    let startExp = 0;
    let nextExp = 0;
    let maxLevel = 100;
    let ons = 0;
    let prevOn = 0;

    if (tesAbTotalMax == 0) {
      tesAbTotalMax = 1;
    }

    // Расчет уровня и очков навыков для персонажа
    if (prs.isTES) {
      exp = this.countTesExp(tesAbTotalMax, tesAbTotalCur);
    }
    ({ prevOn, startExp, exp, ons, nextExp, persLevel } = prs.isTES ? this.countPersLevelAndOnsTES(exp, abCount, abOpenned) : this.countPersLevelAndOns(abTotalMax, prevOn, startExp, exp, ons, nextExp, prs, persLevel));

    let prevPersLevel = prs.level;
    prs.level = persLevel;
    prs.prevExp = startExp;
    prs.nextExp = nextExp;
    if (!prs.isTES) {
      prs.ON = ons - abTotalCur;
    }
    else {
      prs.ON = ons;
      prs.exp = exp;
    }
    prs.maxPersLevel = maxLevel;
    prs.totalProgress = Math.floor((prs.level / prs.maxPersLevel) * 100);

    let lvlExp = nextExp - startExp;
    let progr = 0;
    if (lvlExp != 0) {
      progr = (prs.exp - startExp) / lvlExp;
    }
    prs.progressValue = progr * 100;

    let thisMonstersLevel = this.getMonsterLevel(prs.level, prs.maxPersLevel);

    let prevMonstersLevel = thisMonstersLevel;

    if (prevPersLevel != prs.level) {
      prevMonstersLevel = this.getMonsterLevel(prevPersLevel, prs.maxPersLevel);
    }

    // Апдэйт картинок
    if (prevMonstersLevel != thisMonstersLevel) {
      this.updateQwestTasksImages(prs);
      this.updateAbTasksImages(prs);
    }

    // Ранг
    prs.rangName = Pers.rangNames[thisMonstersLevel - 1];

    const persJson = JSON.parse(JSON.stringify(prs));

    if (this.isSynced || !prs.isOffline) {
      this.db.collection('pers').doc(prs.id)
        .set(persJson);
    }
    localStorage.setItem("isOffline", JSON.stringify(prs.isOffline));
    localStorage.setItem("pers", JSON.stringify(prs));

    this.isSynced = false;

    this.pers$.next(prs);

    if (prs.currentView == curpersview.QwestTasks && prs.tasks.length == 0) {
      prs.currentView = curpersview.QwestsGlobal;
      this.savePers(false);
    }
    else if (prs.currentView == curpersview.QwestsGlobal && prs.tasks.length == 0) {
      prs.currentView = curpersview.SkillTasks;
      this.savePers(false);
    }

    this.currentView$.next(prs.currentView);
    this.currentTask$.next(prs.currentTask);
  }

  checkAndChangeWebP(img: string): string {
    img = img.substr(0, img.lastIndexOf(".")) + ".webp";
    return img;
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

  setCurInd(i: number): any {
    this.pers$.value.currentTaskIndex = i;
    this.pers$.value.currentTask = this.pers$.value.tasks[i];

    if (this.pers$.value.currentView == curpersview.QwestsGlobal
      || this.pers$.value.currentView == curpersview.QwestTasks) {
      if (this.pers$.value.currentTask) {
        this.pers$.value.currentQwestId = this.pers$.value.currentTask.qwestId;
      }
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

  setNewPers(userid: string) {
    const prs = new Pers();
    prs.userId = userid;
    prs.id = userid;
    prs.level = 0;
    prs.prevExp = 0;
    prs.nextExp = 0;
    prs.isOffline = true;
    this.isOffline = true;

    this.setPers(JSON.stringify(prs));
  }

  setPers(data: string) {
    let prs: Pers = JSON.parse(data);
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
      if (tsk.requrense == 'через 1 день') {
        td.setDate(td.getDate() + 2);
      }
      else if (tsk.requrense == 'через 2 дня') {
        td.setDate(td.getDate() + 3);
      }
      else if (tsk.requrense == 'через 3 дня') {
        td.setDate(td.getDate() + 4);
      }
      else {
        td.setDate(td.getDate() + 1);
      }
    }
    else {
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
    // if (!isPlus && task.lastNotDone) {
    //   task.order = 9999;
    // }
    // else {
    if (isToEnd) {
      task.order = this.pers$.value.curEndOfListSeq;
      this.pers$.value.curEndOfListSeq++;
    }
    else {
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
    // }
  }

  showAbility(ab: Ability) {
    let tsk = ab.tasks[0];
    if (tsk) {
      this.router.navigate(['/pers/task', tsk.id, false]);
    }
  }

  showTask(tsk: Task) {
    if (tsk) {
      this.router.navigate(['/pers/task', tsk.id, false]);
    }
  }

  sortPersTasks(prs: Pers) {
    prs.tasks = prs.tasks.sort((a, b) => {
      // Квесты не сортируем
      if (a.requrense === 'нет' && b.requrense === 'нет') {
        return 0;
      }

      // По типу
      let aType = a.requrense === 'нет' ? 0 : 1;
      let bType = b.requrense === 'нет' ? 0 : 1;

      if (aType != bType) {
        return -(aType - bType);
      }

      let bDate = new Date(b.date).setHours(0, 0, 0, 0);
      let aDate = new Date(a.date).setHours(0, 0, 0, 0);
      let aValDate = aDate.valueOf();
      let bValDate = bDate.valueOf();

      // По дате
      if (prs.currentView != curpersview.SkillsSort) {
        if (aValDate != bValDate) {
          return aDate.valueOf() - bDate.valueOf();
        }
      }

      // Автофокус
      if (prs.isAutofocus) {
        return a.order - b.order;
      }

      // По времени
      if (a.time != b.time) {
        return a.time.localeCompare(b.time)
      }

      // По Order
      if (!a.order) {
        a.order = 0;
      }
      if (!b.order) {
        b.order = 0;
      }
      if (a.order != b.order) {
        return a.order - b.order;
      }

      return a.name.localeCompare(b.name);
    });
  }

  sortRevards() {
    this.pers$.value.rewards.forEach(rev => {
      if (rev.rare == Pers.commonRevSet.name) {
        rev.cumulative = Pers.commonRevSet.cumulative;
      } else if (rev.rare == Pers.uncommonRevSet.name) {
        rev.cumulative = Pers.uncommonRevSet.cumulative;
      } else if (rev.rare == Pers.rareRevSet.name) {
        rev.cumulative = Pers.rareRevSet.cumulative;
      } else if (rev.rare == Pers.epicRevSet.name) {
        rev.cumulative = Pers.epicRevSet.cumulative;
      } else if (rev.rare == Pers.legendaryRevSet.name) {
        rev.cumulative = Pers.legendaryRevSet.cumulative;
      } else {
        rev.cumulative = Pers.commonRevSet.cumulative;
        rev.rare = Pers.commonRevSet.name;
      }
    });

    this.pers$.value.rewards = this.pers$.value.rewards.sort((a, b) => a.cumulative - b.cumulative);
  }

  subtaskDoneOrFail(taskId: string, subtaskId: string, isDone: boolean) {
    let tsk: Task = this.allMap[taskId].item;
    let subTask: taskState = this.allMap[subtaskId].item;
    subTask.lastDate = new Date().getTime();
    if (this.isNullOrUndefined(subTask.failCounter)) {
      subTask.failCounter = 0;
    }

    if (isDone) {
      this.CasinoRevards(tsk);
    }

    if (!this.pers$.value.isTES) {
      let expChange = this.getSubtaskExpChange(tsk, isDone, subTask);

      if (isDone) {
        this.pers$.value.exp += expChange;
      } else {
        this.pers$.value.exp -= expChange;
      }
    } else {
      let activeSubtasksCount = tsk.states.filter(n => n.isActive).length;

      this.changeTes(tsk, isDone, activeSubtasksCount)
    }

    if (isDone) {
      subTask.failCounter = 0;
    } else {
      subTask.failCounter++;
    }

    // if (subTask.failCounter >= 3) {
    //   let ab: Ability = this.allMap[taskId].link;
    //   this.downAbility(ab);
    // }

    //tsk.states.find(n => n.id == subtaskId);
    subTask.isDone = true;

    let allIsDone = tsk.states.filter(n => n.isActive && !n.isDone).length;

    if (allIsDone == 0) {
      this.setTaskNextDate(tsk, isDone);
      this.setStatesNotDone(tsk);
    }

    this.setCurInd(0);
  }

  sync(isDownload) {
    this.isSynced = true;

    if (isDownload) {
      // download
      this.loadPers(this.pers$.value.userId)
        .pipe(take(1))
        .subscribe(n => {
          let prs: Pers = n as Pers;
          prs.currentView = curpersview.SkillTasks;
          this.savePers(false, null, prs);
        });
    } else {
      // upload
      this.savePers(false);
    }
  }

  /**
   * Клик минус по задаче.
   * @param id Идентификатор задачи.
   */
  taskMinus(id: string, notClearTosts?: boolean) {
    // Находим задачу
    let task: Task;
    let abil: Ability;

    ({ task, abil } = this.findTaskAnAb(id, task, abil));
    if (task) {
      task.lastDate = new Date().getTime();
      task.counterValue = 0;
      task.timerValue = 0;
      if (this.isNullOrUndefined(task.failCounter)) {
        task.failCounter = 0;
      }

      // Следующая дата
      this.setTaskNextDate(task, false);
      this.setStatesNotDone(task);

      // Минусуем значение
      if (!this.pers$.value.isTES) {
        this.pers$.value.exp -= this.getTaskChangesExp(task, false);
        if (this.pers$.value.exp < 0) {
          this.pers$.value.exp = 0;
        }
      } else {
        this.changeTes(task, false);
      }

      task.lastNotDone = true;
      task.failCounter++;

      this.setCurInd(0);
      this.changeExpKoef(false);
      this.savePers(true, 'minus');

      return 'навык';
    }
  }

  /**
   * Клик плюс по задаче.
   * @param id Идентификатор задачи.
   */
  taskPlus(id: string) {
    let tsk: Task = this.allMap[id].item;
    tsk.lastDate = new Date().getTime();

    if (tsk.requrense != 'нет') {
      let task: Task;
      let abil: Ability;
      ({ task, abil } = this.findTaskAnAb(id, task, abil));
      if (task) {
        task.counterValue = 0;
        task.timerValue = 0;
        task.failCounter = 0;

        // Разыгрываем награды
        this.CasinoRevards(task);

        // Счетчик обновлений стейтов
        if (task.isStateRefresh) {
          if (task.refreshCounter == null || task.refreshCounter == undefined) {
            task.refreshCounter = 0;
          } else {
            task.refreshCounter++;
          }
        }

        // Следующая дата
        this.setTaskNextDate(task, true);
        this.setStatesNotDone(task);

        // Плюсуем значение
        this.changeTes(tsk, true);

        task.lastNotDone = false;
        this.setCurInd(0);
        this.changeExpKoef(true);

        this.savePers(true, 'plus');

        return 'навык';
      }
    }
    else {
      let qw: Qwest = this.allMap[id].link;
      this.pers$.value.currentQwestId = qw.id;

      if (tsk) {
        if (qw.name == 'Дела') {
          qw.tasks = qw.tasks.filter(n => n.id != id);
        } else {
          tsk.isDone = true;
        }
        this.savePers(true, 'plus');
        if (this.pers$.value.currentView != curpersview.QwestTasks) {
          this.setCurInd(0);
        }

        return 'квест';
      }
    }
  }

  tesTaskTittleCount(progr: number, aimVal: number, moreThenOne: boolean, aimUnit: string) {
    let av = this.getAimValueWithUnit(aimVal, aimUnit);
    let value = Math.ceil(progr * av);

    if (moreThenOne) {
      if (value <= 1) {
        value = 1;
      }
    }

    if (value > av) {
      value = av;
    }

    return value;
  }

  upAbility(ab: Ability) {
    let isOpenForEdit = false;

    for (let i = 0; i < ab.tasks.length; i++) {
      const tsk: Task = ab.tasks[i];

      // Обнуляем фэйлы
      tsk.failCounter = 0;
      for (let j = 0; j < tsk.states.length; j++) {
        const st = tsk.states[j];
        st.failCounter = 0;
      }

      if (tsk.value < 1) {
        tsk.date = new Date();
        tsk.order = -1;
        tsk.states.forEach(st => {
          st.order = -1;
        });
        isOpenForEdit = true;
      }
      if (!ab.isOpen) {
        tsk.date = new Date();
        tsk.order = -1;
        tsk.states.forEach(st => {
          st.order = -1;
        });
        isOpenForEdit = true;
      }

      let prevTaskVal = tsk.value;
      if (!this.pers$.value.isTES) {
        if (tsk.isPerk) {
          tsk.value = 10;
        }
        else {
          if (tsk.hardnes == 0.5) {
            tsk.value += 2;
          }
          else {
            tsk.value += 1;
          }
          if (tsk.value > 10) {
            tsk.value = 10;
          }
        }

        // Чтобы с каждым уровнем в задаче что-то менялось
        if (tsk.value < 10 && tsk.value > 0) {
          for (let i = tsk.value + 1; i <= 10; i++) {
            const cur = tsk.statesDescr[tsk.value];
            const next = tsk.statesDescr[i];
            if (next != cur) {
              break;
            }
            tsk.value = i;
          }
        }

        let curTaskValue = tsk.value;

        this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
        tsk.states.forEach(st => {
          st.value = tsk.value;
          this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
        });

        this.changeLvlAbLogic(tsk, curTaskValue, prevTaskVal);
      }
    }

    if (!ab.isOpen) {
      ab.isOpen = true;
    }

    this.savePers(true, 'plus');

    // Переходим в настройку навыка, если это первый уровень
    if (false && isOpenForEdit && !this.pers$.value.isAutoPumping) {
      this.showAbility(ab);
    }
  }

  updateAbTasksImages(prs: Pers) {
    for (const ch of prs.characteristics) {
      for (const ab of ch.abilities) {
        for (const tsk of ab.tasks) {
          this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
          for (const st of tsk.states) {
            this.GetRndEnamy(st, this.pers$.value.level, this.pers$.value.maxPersLevel);
          }
        }
      }
    }
  }

  updateQwestTasksImages(prs: Pers) {
    for (const qwest of prs.qwests) {
      for (const tsk of qwest.tasks) {
        this.GetRndEnamy(tsk, this.pers$.value.level, this.pers$.value.maxPersLevel);
        for (const sub of tsk.states) {
          this.GetRndEnamy(sub, this.pers$.value.level, this.pers$.value.maxPersLevel);
        }
      }
    }
  }

  /**
   * Розыгрыш наград.
   */
  private CasinoRevards(task: Task) {
    if (!this.pers$.value.rewards || this.pers$.value.rewards.length == 0) {
      return;
    }

    let rand = Math.random() * 100.0;

    let revType = '';

    // if (rand > 3) {
    //   return;
    // }

    // if (this.pers.isMax5) {
    //   if (task.value >= 5) {
    //     revType = Pers.legendaryRevSet.name;
    //   }
    //   else if (task.value >= 4) {
    //     revType = Pers.epicRevSet.name;
    //   }
    //   else if (task.value >= 3) {
    //     revType = Pers.rareRevSet.name;
    //   }
    //   else if (task.value >= 2) {
    //     revType = Pers.uncommonRevSet.name;
    //   }
    //   else {
    //     revType = Pers.commonRevSet.name;
    //   }
    // }
    // else {
    //   if (task.value >= 9) {
    //     revType = Pers.legendaryRevSet.name;
    //   }
    //   else if (task.value >= 7) {
    //     revType = Pers.epicRevSet.name;
    //   }
    //   else if (task.value >= 5) {
    //     revType = Pers.rareRevSet.name;
    //   }
    //   else if (task.value >= 3) {
    //     revType = Pers.uncommonRevSet.name;
    //   }
    //   else {
    //     revType = Pers.commonRevSet.name;
    //   }
    // }

    if (rand <= Pers.commonRevSet.cumulative) {
      revType = Pers.commonRevSet.name;
    } else if (rand <= Pers.uncommonRevSet.cumulative) {
      revType = Pers.uncommonRevSet.name;
    } else if (rand <= Pers.rareRevSet.cumulative) {
      revType = Pers.rareRevSet.name;
    } else if (rand <= Pers.epicRevSet.cumulative) {
      revType = Pers.epicRevSet.name;
    } else if (rand <= Pers.legendaryRevSet.cumulative) {
      revType = Pers.legendaryRevSet.name;
    } else {
      return;
    }

    let revsOfType = this.getRewsOfType(revType);

    if (revsOfType.length > 0) {
      var rev = revsOfType[Math.floor(Math.random() * revsOfType.length)];

      // То добавляем к наградам
      let idx = this.pers$.value.inventory.findIndex(n => {
        return n.id === rev.id;
      });

      if (idx === -1) {
        rev.count = 1;
        this.pers$.value.inventory.push(rev);
      }
      else {
        this.pers$.value.inventory[idx].count = this.pers$.value.inventory[idx].count + 1;
      }
    }
  }

  private changeLvlAbLogic(tsk: Task, curTaskValue: number, prevTaskVal: number) {
    if (tsk.value >= 2 && !tsk.isSumStates && tsk.states.length > 0) {
      try {
        let nms: number[] = this.getSet(tsk, tsk.states.length, 'State');
        let index;
        let prevIdx;

        index = nms[Math.floor(curTaskValue)] - 1;
        prevIdx = nms[Math.floor(prevTaskVal)] - 1;

        if (prevIdx >= 0) {
          tsk.states[index].order = tsk.states[prevIdx].order;
        }
      }
      catch (error) {
      }
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
      let new_xp: number = A * Math.exp(B * (i));

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

  private countPersLevelAndOnsTES(exp: number, abCount: number, abOpenned: number) {
    let persLevel = Math.floor(exp);

    let abs = (abCount);

    if (abs < 1) {
      abs = 1;
    }

    let onEveryLevel = 1;

    let gainedOns = Math.floor(persLevel / onEveryLevel);

    let startOn = 1;

    startOn = 3;
    const totalGained = (startOn + gainedOns);

    let ons = totalGained - abOpenned;
    if (startOn + gainedOns > abs) {
      ons = (abs - abOpenned) + 1;
    }

    exp = exp * 100;
    let prevOn = 0;
    let startExp = persLevel * 100;
    let nextExp = (persLevel + 1) * 100;

    return { prevOn, startExp, exp, ons, nextExp, persLevel };
  }

  private filterRevs(revType: any) {
    return this.pers$.value.rewards.filter(n => n.rare == revType);
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
    return Pers.Inspirations[Math.floor(Math.random() * Pers.Inspirations.length)] + ', ' + this.pers$.value.name + '!';
  }

  private getCurRang(val: number) {
    if (val > this.pers$.value.maxAttrLevel) {
      val = this.pers$.value.maxAttrLevel;
    }
    const rng = new Rangse();
    let vl = Math.floor(val);
    let vlName = '' + Math.floor(val);
    rng.val = vl;
    rng.name = vlName;
    return rng;
  }

  private getFailMsg() {
    return Pers.Abuses[Math.floor(Math.random() * Pers.Abuses.length)] + ', ' + this.pers$.value.name + '!';
  }

  private getMaxTes() {
    return this.pers$.value.maxAttrLevel - 1;
  }

  private getMonsterLevel(prsLvl: number, maxLevel: number): number {
    if (prsLvl < 10) { // Обыватель
      return 1;
    } else if (prsLvl < 20) { // Авантюрист
      return 2;
    } else if (prsLvl < 60) { // Воин
      return 3;
    } else if (prsLvl < 100) { // Герой
      return 4;
    } else { // Легенда
      return 5;
    }
  }

  private getRewsOfType(revType: any) {
    let revsOfType = this.filterRevs(revType);

    if (revsOfType.length == 0 && revType == Pers.legendaryRevSet.name) {
      revType = Pers.epicRevSet.name;
      revsOfType = this.filterRevs(revType);
    }

    if (revsOfType.length == 0 && revType == Pers.epicRevSet.name) {
      revType = Pers.rareRevSet.name;
      revsOfType = this.filterRevs(revType);
    }

    if (revsOfType.length == 0 && revType == Pers.rareRevSet.name) {
      revType = Pers.uncommonRevSet.name;
      revsOfType = this.filterRevs(revType);
    }

    if (revsOfType.length == 0 && revType == Pers.uncommonRevSet.name) {
      revType = Pers.commonRevSet.name;
      revsOfType = this.filterRevs(revType);
    }

    return revsOfType;
  }

  /**
   * Получает равномерный набор.
   * @param aim 
   * @param result 
   */
  private getSetLinear(aim: number, result: number[], tsk: Task) {
    if (aim == 2) {
      result.push(1); // 0
      result.push(1); // 1
      result.push(1); // 2
      result.push(1); // 3
      result.push(1); // 4
      result.push(1); // 5
      result.push(2); // 6
      result.push(2); // 7
      result.push(2); // 8
      result.push(2); // 9
      result.push(2); // 10
    } else if (aim == 3) {
      result.push(1); // 0
      result.push(1); // 1
      result.push(1); // 2
      result.push(1); // 3
      result.push(1); // 4
      result.push(2); // 5
      result.push(2); // 6
      result.push(2); // 7
      result.push(3); // 8
      result.push(3); // 9
      result.push(3); // 10
    } else if (aim == 4) {
      result.push(1); // 0
      result.push(1); // 1
      result.push(1); // 2
      result.push(1); // 3
      result.push(2); // 4
      result.push(2); // 5
      result.push(2); // 6
      result.push(3); // 7
      result.push(3); // 8
      result.push(4); // 9
      result.push(4); // 10
    } else {
      for (let i = 0; i <= 10; i++) {
        let q = i;

        let progr = (q) / (10);

        let val = progr * aim;

        val = Math.ceil(val);
        if (val < 1) {
          val = 1;
        }

        result.push(val);
      }
    }
  }

  /**
   * Получает набор с более плавным концом.
   * @param aim 
   * @param result 
   */
  private getSetMaxNeatEnd(aim: number, result: number[], tsk: Task) {
    let max = aim;

    let step = Math.floor(aim / Task.maxValue);
    if (step < 1) {
      step = 1;
    }

    let left = max - step * Task.maxValue;
    if (left < 0) {
      left = 0;
    }
    max = max - left;

    // Основное..
    for (let i = Task.maxValue; i >= 1; i--) {
      result.unshift(max);

      max -= step;

      if (max < step) {
        max = step;
      }
    }

    // Остатки..
    for (let i = 0; i < result.length; i++) {
      let v = i + 1;
      if (v > left) {
        v = left;
      }

      result[i] += v;
    }

    result.unshift(0);
  }

  private getSubtaskExpChange(tsk: Task, isDone: boolean, subTask: taskState) {
    let activeSubtasksCount = tsk.states.filter(n => n.isActive).length;
    let expChange = this.getTaskChangesExp(tsk, isDone, subTask) / activeSubtasksCount;

    expChange = Math.ceil(expChange * 10.0) / 10.0;

    return expChange;
  }

  private getTaskChangesExp(task: Task, isPlus: boolean, subTask: taskState = null, subTasksCoef: number = 1, isChangeAb: boolean = false) {
    const koef = this.getWeekKoef(task.requrense, isPlus, task.tskWeekDays);
    let expKoef = 1;

    if (isChangeAb) {
      subTasksCoef = subTasksCoef * task.hardnes;
    }

    let chVal = (this.baseTaskPoints / subTasksCoef) * koef * expKoef;

    if (task.tesAbValue == null || task.tesAbValue == undefined) {
      task.tesAbValue = 0;
    }

    if (task.tesValue == null || task.tesValue == undefined) {
      task.tesValue = 0;
    }

    let taskStreang = task.value;

    if (this.pers$.value.isTES) {
      taskStreang = 1.0;
    }

    // Расчет для ТЕС
    if (this.pers$.value.isTES) {
      let change = 0;
      let tesVal;

      if (isChangeAb) {
        tesVal = task.tesAbValue;
      } else {
        tesVal = task.tesValue;
      }

      while (true) {
        let tesKoef = this.getTesChangeKoef(tesVal);

        let tesLeft = 1;
        if (isPlus) {
          tesLeft = (Math.floor(tesVal) + 1) - tesVal;
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
        }
        else {
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

    let chValFinaly = chVal * Math.floor(taskStreang);

    chValFinaly = Math.ceil(chValFinaly * 10.0) / 10.0;

    return chValFinaly;
  }

  private getTesChangeKoef(tesVal: number): number {
    // let levels: number = this._tesMaxLvl;
    // let xp_for_first_level: number = 1;
    // let xp_for_last_level: number = 10;

    // let B: number = Math.log(xp_for_last_level / xp_for_first_level) / (levels - 1);
    // let A: number = xp_for_first_level / (Math.exp(B) - 1.0);

    // let i = Math.floor(tesVal) + 1;

    // let old_xp: number = A * Math.exp(B * (i - 1));
    // let new_xp: number = A * Math.exp(B * (i));

    // let multi = new_xp - old_xp;

    // return 1 / multi;
    // let tesValTen = 1 + Math.floor(tesVal / 10.0);
    let tesValL = 1 + (tesVal / 10.0);

    return 1 / (2 * tesValL);
  }

  private getTskFromState(tsk: Task, st: taskState, isAll: boolean): Task {
    let stT = new Task();
    let stateProgr;
    stT.failCounter = st.failCounter;
    //stT.tittle = tsk.name + ': ' + st.name;

    let plusName = tsk.curLvlDescr3;
    if (tsk.requrense == 'нет') {
      plusName = st.name;
    }
    if (tsk.isSumStates) {
      plusName = st.name;
      let pattern = /\d+[⧖|✓].*/;
      let plusTimerOrCounter = pattern.exec(tsk.curLvlDescr3);
      if (plusTimerOrCounter) {
        plusName += ' ' + plusTimerOrCounter;
      }
    }

    if (tsk.isStatePlusTitle) {
      stT.tittle = tsk.name + ': ' + plusName;
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
      this.GetRndEnamy(st, this.pers$.value.level, this.pers$.value.maxPersLevel);
    }

    stT.id = st.id;
    stT.image = st.image;
    stT.imageLvl = st.imageLvl;
    stT.parrentTask = tsk.id;
    stT.lastNotDone = tsk.lastNotDone;
    stT.plusToNames = [...tsk.plusToNames];
    stT.nextAbVal = tsk.nextAbVal;

    if (stT.requrense != 'нет') {
      stT.plusToNames.shift();
    }

    if (stateProgr) {
      stT.plusToNames.unshift(new plusToName(stateProgr, null, null, ''));
    }

    if (stT.requrense != 'нет') {
      stT.time = st.time;
      stT.plusToNames.unshift(new plusToName('' + st.time, null, null, ''));
    }

    this.allMap['stt' + stT.id] = {};
    this.allMap['stt' + stT.id].item = stT;
    this.allMap['stt' + stT.id].link = st;

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
    }
    else {
      let tskProgr = tskCur / tskMax;
      if (tskProgr > 1) {
        tskProgr = 1;
      }
      ab.value = 10 * (tskProgr);
    }

    if (ab.value > 10) {
      ab.value = 10;
    }

    if (ab.value < 0) {
      ab.value = 0;
    }

    // Прогресс навыка
    let abCellValue = Math.floor(ab.value);
    // let abProgress = ab.value - abCellValue;
    // ab.progressValue = abProgress * 100;

    ab.progressValue = (abCellValue / 10) * 100;
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
            if (tsk) {
              prs.currentQwestId = tsk.qwestId;
            }
          }
        } else {
          prs.currentTaskIndex = 0;
        }
      }

      if (prs.currentTaskIndex >= prs.tasks.length
        || prs.tasks[prs.currentTaskIndex] == undefined
        || prs.tasks[prs.currentTaskIndex] == null) {
        prs.currentTaskIndex = 0;
      }

      prs.currentTask = prs.tasks[prs.currentTaskIndex];
    }
  }

  private setTaskTittle(tsk: Task, isMegaPlan: boolean) {
    tsk.statesDescr = [];
    tsk.curStateDescrInd = 0;

    if (tsk.aimTimer != 0 || tsk.aimCounter != 0 || tsk.states.length > 0 || tsk.postfix || tsk.prefix) {
      let plusState = '';
      tsk.curLvlDescr = '';
      plusState = '';
      tsk.statesDescr = [];
      tsk.IsNextLvlSame = false;

      if (tsk.nextAbVal == null || tsk.nextAbVal < 5) {
        tsk.nextAbVal = 5;
      }

      let start = (tsk.nextAbVal - tsk.value) / 100.0;
      let progr = start + (tsk.value / this._maxAbilLevel);

      if (progr < 0.01) {
        progr = 0.01;
      }
      if (progr > 1) {
        progr = 1
      }

      if (tsk.isPerk || isMegaPlan) {
        progr = 1;
      }

      // Состояния
      if (tsk.states.length > 0) {
        let stateInd = this.tesTaskTittleCount(progr, tsk.states.length, true, 'State');

        stateInd = stateInd - 1;

        if (tsk.isStateRefresh) {
          if (tsk.refreshCounter == null && tsk.refreshCounter == undefined) {
            tsk.refreshCounter = 0;
          }
          let cVal = tsk.refreshCounter % tsk.states.length;
          const el = tsk.states[cVal].name;

          if (el) {
            plusState += ' ' + el;
          }
        }
        else {
          if (tsk.isSumStates) {
            if (tsk.aimCounter > 0 || tsk.aimTimer > 0) {
              stateInd = tsk.states.length - 1;
            }
            let plus = [];
            for (let q = 0; q <= stateInd; q++) {
              const st = tsk.states[q];

              plus.push(st.name);
            }

            plusState += plus.join('; ');
          } else {
            plusState += tsk.states[stateInd].name;
          }
        }

        let index = stateInd;

        if (index >= 0) {
          if (tsk.isSumStates) {
            for (let i = 0; i < tsk.states.length; i++) {
              const el = tsk.states[i];
              if (i <= index) {
                el.isActive = true;
              } else {
                el.isActive = false;
              }
            }
          }
        }
      }

      // Таймер, счетчик
      if (tsk.aimTimer != 0) {
        plusState += ' ' + this.getAimString(this.tesTaskTittleCount(progr, tsk.aimTimer, true, tsk.aimUnit), tsk.aimUnit);

        if (tsk.aimUnit == 'Раз' && tsk.postfix && tsk.postfix.length > 0) {
          plusState = plusState.substring(0, plusState.length - 1);
        }
      }

      // Постфикс
      if (tsk.postfix) {
        plusState += tsk.postfix;
      }

      if (plusState) {
        if (tsk.states.length > 0 && !tsk.isSumStates) {
          if (tsk.isStatePlusTitle) {
            tsk.tittle = tsk.name + ': ' + plusState;
          } else {
            tsk.tittle = plusState;
          }
        } else {
          if (tsk.states.length > 0 && tsk.isStateInTitle) {
            if (tsk.isStatePlusTitle) {
              tsk.tittle = tsk.name + ': ' + plusState;
            } else {
              tsk.tittle = plusState;
            }
          } else {
            tsk.tittle = tsk.name + ': ' + plusState;
          }
        }
      } else {
        tsk.tittle = tsk.name;
      }

      tsk.curLvlDescr = plusState.trim();
      tsk.curLvlDescr2 = ' (' + plusState.trim() + ')';
      tsk.curLvlDescr3 = plusState.trim();
    }
    else {
      for (let i = 0; i <= this._maxAbilLevel; i++) {
        tsk.statesDescr.push('');
      }

      tsk.tittle = tsk.name;
      tsk.curLvlDescr = '';
      tsk.curLvlDescr2 = '';
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
