import { Injectable } from '@angular/core';
import { Pers } from 'src/Models/Pers';
import { PersChangesComponent } from './pers-changes/pers-changes.component';
import { MatDialog } from '@angular/material/dialog';
import { Ability } from 'src/Models/Ability';
import { Router } from '@angular/router';
import { Task } from 'src/Models/Task';
import { ChangesModel, persExpChanges } from 'src/Models/ChangesModel';
import { Characteristic } from 'src/Models/Characteristic';
import { LevelUpMsgComponent } from './level-up-msg/level-up-msg.component';
import { StatesService } from './states.service';

@Injectable({
  providedIn: 'root'
})
export class PerschangesService {
  afterPers: Pers;
  beforePers: Pers;

  constructor(public dialog: MatDialog, private router: Router, private srvSt: StatesService) { }

  getClone(pers: Pers): Pers {
    return JSON.parse(JSON.stringify(pers));
  }

  async showChanges(congrantMsg: string, failMsg: string, isGood: boolean) {
    let changesMap = {};

    // Значения до
    this.fillChangesMap(changesMap, 'before', this.beforePers);
    // Значения после
    this.fillChangesMap(changesMap, 'after', this.afterPers);

    // Ищем изменения
    let changes: ChangesModel[] = [];

    // Показать настройку навыка
    let abToEdit: any = null;
    let qwestToEdit: any = null;

    // Отображать - новый уровень
    let newLevel: boolean = false;

    // Произошло выполнение квеста
    let isDoneQwest = false;

    // Произошло открытие навыка
    let isAbilActivated = false;

    const isShowCharactChanges = true;
    const isShowAbChanges = true;
    const isShowAbActivate = false;
    const isShowExpChanges = true;

    const isOpenPersAtNewLevel = true;
    const maxAttrLevel = 10;


    Object.keys(changesMap).forEach(n => {
      // Квесты
      if (changesMap[n].type == 'qwest') {
        // Квест выполнен
        if (changesMap[n].after === null || changesMap[n].after === undefined) {
          changes.push(
            new ChangesModel('"' + changesMap[n].name + '" выполнен!', 'qwest', changesMap[n].before, changesMap[n].before, 0, changesMap[n].total, changesMap[n].img)
          );
          isDoneQwest = true;
          // qwestToEdit = n;
        }
        else {
          if (changesMap[n].after > changesMap[n].before) {
            changes.push(
              new ChangesModel(changesMap[n].name, 'qwest', changesMap[n].before, changesMap[n].after, 0, changesMap[n].total, changesMap[n].img)
            );
          }
          if (changesMap[n].after > changesMap[n].before && changesMap[n].after == changesMap[n].total) {
            changes.push(
              new ChangesModel('"' + changesMap[n].name + '" задания выполнены!', 'qwest', changesMap[n].after, changesMap[n].after, 0, changesMap[n].total, changesMap[n].img)
            );
            isDoneQwest = true;
            qwestToEdit = n;
          }
        }
      }
      // Награды
      else if (changesMap[n].type == 'inv') {
        if (changesMap[n].after === null || changesMap[n].after === undefined) {
          // Использован больше нет
          changes.push(
            new ChangesModel('Использован "' + changesMap[n].name + '"', 'inv', 0, 0, 0, 1, changesMap[n].img)
          );
        }
        else if (changesMap[n].before === null || changesMap[n].before === undefined) {
          // Получен новый
          changes.push(
            new ChangesModel('Получен "' + changesMap[n].name + '"', 'inv', 1, 1, 0, 1, changesMap[n].img)
          );
        } else if (changesMap[n].after > changesMap[n].before) {
          changes.push(
            new ChangesModel('Получен "' + changesMap[n].name + '"', 'inv', changesMap[n].after, changesMap[n].after, 0, changesMap[n].after, changesMap[n].img)
          );
        } else if (changesMap[n].after < changesMap[n].before) {
          changes.push(
            new ChangesModel('Использован "' + changesMap[n].name + '"', 'inv', changesMap[n].before, changesMap[n].before, 0, changesMap[n].before, changesMap[n].img)
          );
        }
      }
      // Характеристики
      else if (changesMap[n].type == 'cha') {
        if (isShowCharactChanges && changesMap[n].after != changesMap[n].before && changesMap[n].after <= maxAttrLevel) {
          changes.push(
            new ChangesModel(changesMap[n].name, 'cha', changesMap[n].before, changesMap[n].after, 0, maxAttrLevel, changesMap[n].img)
          );
        }
      }
      // Навыки
      else if (changesMap[n].type == 'abil') {
        if (isShowAbActivate && changesMap[n].abIsOpenBefore != changesMap[n].abIsOpenAfter) {
          isAbilActivated = true;
          abToEdit = n;
          changes.push(
            new ChangesModel(`"${changesMap[n].name}" активирован`, 'abil', 0, 0, 0, maxAttrLevel, changesMap[n].img)
          );
        }
        if (isShowAbChanges && changesMap[n].after != changesMap[n].before && changesMap[n].after <= maxAttrLevel) {
          if (changesMap[n].after > changesMap[n].before && changesMap[n].after == 1) {
            abToEdit = n;
          }

          changes.push(
            new ChangesModel(changesMap[n].name, 'abil', changesMap[n].before, changesMap[n].after, 0, maxAttrLevel, changesMap[n].img)
          );
        }
      }
      // Уровень
      else if (changesMap[n].type == 'lvl') {
        if (changesMap[n].after > changesMap[n].before) {
          newLevel = true;
        }
        else if (changesMap[n].after < changesMap[n].before) {
        }
      }
      // Ранг
      // else if (changesMap[n].type == 'rang') {
      //   if (changesMap[n].after > changesMap[n].before) {
      //   }
      //   else if (changesMap[n].after > changesMap[n].before) {
      //   }
      // }
    });

    Object.keys(changesMap).forEach(n => {
      // Опыт
      if (changesMap[n].type == 'exp') {
        let isShowBySettings = isDoneQwest || isShowExpChanges;

        if (isShowBySettings) {
          if (changesMap[n].after != changesMap[n].before) {
            let expChanges = new ChangesModel('Опыт', 'exp', changesMap[n].before * 10, changesMap[n].after * 10, this.afterPers.prevExp * 10, this.afterPers.nextExp * 10, changesMap[n].img);

            let beforeExp = changesMap[n].before;
            let afterExp = changesMap[n].after;

            let prevLvl = this.beforePers.level;
            let afterLvl = this.afterPers.level;

            let eCh: persExpChanges[] = [];

            if (afterLvl > prevLvl) {
              //1
              eCh.push(new persExpChanges(beforeExp, this.beforePers.nextExp, this.beforePers.prevExp, this.beforePers.nextExp));
              //2
              eCh.push(new persExpChanges(this.afterPers.prevExp, afterExp, this.afterPers.prevExp, this.afterPers.nextExp));
            } else if (afterLvl < prevLvl) {
              //1
              eCh.push(new persExpChanges(beforeExp, this.beforePers.prevExp, this.beforePers.prevExp, this.beforePers.nextExp));
              //2
              eCh.push(new persExpChanges(this.afterPers.nextExp, afterExp, this.afterPers.prevExp, this.afterPers.nextExp));
            } else {
              eCh.push(new persExpChanges(beforeExp, afterExp, this.afterPers.prevExp, this.afterPers.nextExp));
            }

            expChanges.expChanges = eCh;

            if (isDoneQwest || isShowExpChanges) {
              changes.push(expChanges);
            } else {
              changes.unshift(expChanges);
            }
          }
        }
      }
    });

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    let classPanel = isGood ? 'my-good' : 'my-bad';

    if (isDoneQwest) {
      changes = changes.filter(n => n.type != 'subtask');
    }

    let combineChanges: ChangesModel[] = [];
    let unionChanges: ChangesModel[] = [];

    if (!changes.length && this.afterPers.gold != this.beforePers.gold) {
      changes.push(
        new ChangesModel('Золото', 'qwest', this.beforePers.gold, this.afterPers.gold, 0, this.afterPers.gold, null)
      );
    }

    for (let index = 0; index < changes.length; index++) {
      let head;
      ({ head, isGood } = this.GetHead(isGood, congrantMsg, failMsg));

      let abPoints;
      let gold;
      let goldTotal;

      if (changes[index].type == 'abil') {
        abPoints = this.afterPers.ON;
        if (isAbilActivated) {
          head = changes[index].name + '!';
          changes[index].name = ' ';
        }
      } else if (changes[index].type == 'inv') {
        head = changes[index].name + '!';
        changes[index].name = ' ';
      }

      if (changes[index].type == 'exp'
        || changes[index].type == 'qwest'
        || changes[index].type == 'inv') {
        if (this.afterPers.gold != this.beforePers.gold) {
          gold = this.afterPers.gold - this.beforePers.gold;
          if (gold > 0) {
            gold = '+' + gold;
          }
          goldTotal = this.afterPers.gold;
        }
      }

      if (isDoneQwest && changes[index].type == 'qwest') {
        head = changes[index].name;
        changes[index].name = ' ';
      }

      // if (changes[index].type == 'abil') {
      //   combineChanges.push(changes[index]);
      // } else if (changes[index].type == 'cha') {
      //   combineChanges.push(changes[index]);
      // } else if (changes[index].type == 'exp') {
      //   combineChanges.push(changes[index]);
      // } else {
      //   unionChanges.push(changes[index]);
      // }

      unionChanges.push(changes[index]);

      changes[index].head = head;
      changes[index].abPoints = abPoints;
      changes[index].gold = gold;
      changes[index].goldTotal = goldTotal;
    }

    // Объединенные изменения
    // if (combineChanges.length) {
    //   const head = combineChanges[0].head;
    //   const abPoints = combineChanges[0].head;
    //   const type = combineChanges[0].type;
    //   const img = combineChanges[0].img;

    //   combineChanges.sort((a, b) => {
    //     return getChSort(a) - getChSort(b);

    //     function getChSort(ch: ChangesModel): number {
    //       if (ch.type == 'exp') { return 2; }
    //       if (ch.type == 'abil') { return 1; }
    //       if (ch.type == 'cha') { return 0; }

    //       return 3;
    //     }
    //   });


    //   let dialogRef = this.dialog.open(PersChangesComponent, {
    //     panelClass: classPanel,
    //     data: {
    //       headText: head,
    //       changes: combineChanges,
    //       isGood: isGood,
    //       abPoints: abPoints,
    //       isTES: this.afterPers.isTES,
    //       itemType: type,
    //       img: img
    //     },
    //     backdropClass: 'backdrop'
    //   });

    //   await sleep(5500);

    //   dialogRef.close();
    // }

    // Отдельные изменения
    unionChanges.sort((a, b) => {
      return getChSort(a) - getChSort(b);

      function getChSort(ch: ChangesModel): number {
        if (ch.type == 'exp') { return 0; }
        if (ch.type == 'abil') { return 1; }
        if (ch.type == 'cha') { return 2; }
        if (ch.type == 'qwest') { return 3; }

        return 4;
      }
    });

    let wasGold = false;
    for (const ch of unionChanges) {
      const head = ch.head;
      const abPoints = ch.head;
      const type = ch.type;
      const img = ch.img;
      let gold = ch.gold;
      let goldTotal = ch.goldTotal;

      if (gold) {
        wasGold = true;
      }

      if (wasGold) {
        gold = null;
        goldTotal = null;
      }

      let dialogRef = this.dialog.open(PersChangesComponent, {
        panelClass: classPanel,
        data: {
          headText: head,
          changes: [ch],
          isGood: isGood,
          abPoints: abPoints,
          isTES: this.afterPers.isTES,
          itemType: type,
          img: img,
          gold: gold,
          goldTotal: goldTotal
        },
        backdropClass: 'backdrop'
      });

      if (ch.type == 'abil'
        || ch.type == 'cha') {
        await sleep(5500);
      } else {
        await sleep(3500);
      }

      dialogRef.close();
    }

    if (newLevel) {
      let dialogRefLvlUp = this.dialog.open(LevelUpMsgComponent, {
        panelClass: classPanel,
        backdropClass: 'backdrop'
      });

      await sleep(5500);

      dialogRefLvlUp.close();

      if (isOpenPersAtNewLevel) {
        this.srvSt.selTabPersList = 0;
        if (this.afterPers.ON > 0) {
          this.router.navigate(['/pers']);
        }
      }
    }

    if (abToEdit != null) {
      this.router.navigate(['pers/task', abToEdit, false]);
    }

    if (isDoneQwest && qwestToEdit != null) {
      this.router.navigate(['pers/qwest', qwestToEdit, true]);
    }
  }

  private GetHead(isGood: boolean, congrantMsg: string, failMsg: string) {
    let head = '';
    if (isGood == null) {
      head = null;
      isGood = true;
    }
    else {
      if (isGood) {
        head = this.getCongrantMsg();
      }
      else {
        head = this.getFailMsg();
      }
    }
    return { head, isGood };
  }

  private fillChangesMap(changesMap: {}, chType: string, prs: Pers) {
    // Ранг
    if (!changesMap['rang']) {
      changesMap['rang'] = this.getChItem('rang', 'rang', null);
    }
    changesMap['rang'][chType] = prs.rang.name;

    // Уровень
    if (!changesMap['lvl']) {
      changesMap['lvl'] = this.getChItem('lvl', 'lvl', null);
    }
    changesMap['lvl'][chType] = prs.level;

    // Опыт
    if (!changesMap['exp']) {
      changesMap['exp'] = this.getChItem('exp', 'exp', null);
    }
    changesMap['exp'][chType] = prs.exp;

    // Навыки
    prs.characteristics.forEach(ch => {
      ch.abilities.forEach(ab => {
        ab.tasks.forEach(tsk => {
          if (!changesMap[tsk.id]) {
            changesMap[tsk.id] = this.getChItem('abil', ab.name, ab.image);
          }

          //changesMap[tsk.id][chType] = Math.floor(tsk.value);
          changesMap[tsk.id][chType] = tsk.value;

          if (chType == 'before') {
            changesMap[tsk.id]['abIsOpenBefore'] = ab.isOpen;
          }
          else {
            changesMap[tsk.id]['abIsOpenAfter'] = ab.isOpen;
          }

          // if (tsk.isSumStates) {
          //   this.tskStatesProgress(tsk, chType, changesMap, true);
          // }
        });
      });
    });

    // Характеристики
    prs.characteristics.forEach(ch => {
      if (!changesMap[ch.id]) {
        changesMap[ch.id] = this.getChItem('cha', ch.name, ch.image);
      }
      changesMap[ch.id][chType] = Math.floor(ch.value);
    });

    // Квесты
    prs.qwests.forEach(qw => {
      if (!changesMap[qw.id]) {
        let qwitem = this.getChItem('qwest', qw.name, qw.image);
        changesMap[qw.id] = qwitem;
      }

      changesMap[qw.id][chType] = qw.tasks.filter(n => n.isDone).length;
      changesMap[qw.id]['total'] = qw.tasks.length;

      // Подзадачи
      qw.tasks.forEach(tsk => {
        if (!changesMap[tsk.id]) {
          let qwitem = this.getChItem('tsk', tsk.name, null);
          changesMap[tsk.id] = qwitem;
        }
        this.tskStatesProgress(tsk, chType, changesMap, false);
      });
    });

    // Инвентарь
    prs.inventory.forEach(inv => {
      if (!changesMap[inv.id]) {
        changesMap[inv.id] = this.getChItem('inv', inv.name, inv.image);
      }

      changesMap[inv.id][chType] = inv.count;
    });
  }

  private getChItem(type, name, img): any {
    let ch = new changesItem();
    ch.type = type;
    ch.name = name;
    ch.img = img;

    return ch;
  }

  private getCongrantMsg() {
    return Pers.Inspirations[Math.floor(Math.random() * Pers.Inspirations.length)] + '!';//+ ', ' + this.afterPers.name + '!';
  }

  private getFailMsg() {
    return Pers.Abuses[Math.floor(Math.random() * Pers.Abuses.length)] + '!'; //+ ', ' + this.afterPers.name + '!';
  }

  private tskStatesProgress(tsk: Task, chType: string, changesMap: any, isCheckActive: boolean) {
    if (tsk.states.length > 0) {
      let done = tsk.states.filter(n => (n.isActive || !isCheckActive) && n.isDone).length;
      if (chType == 'before') {
        changesMap[tsk.id]['tskProgrBefore'] = done;
      }
      else {
        changesMap[tsk.id]['tskProgrAfter'] = done;
      }
      let all = tsk.states.filter(n => (n.isActive || !isCheckActive)).length;
      changesMap[tsk.id]['tskProgrTotal'] = all;
    }
    else {
      changesMap[tsk.id]['tskProgrBefore'] = 1;
      changesMap[tsk.id]['tskProgrAfter'] = 1;
      changesMap[tsk.id]['tskProgrTotal'] = 1;
    }
  }
}

export class changesItem {
  after;
  before;
  img;
  name;
  total;
  tskProgrAfter;
  tskProgrBefore;
  tskProgrTotal;
  type;
  abIsOpenBefore;
  abIsOpenAfter;
}
