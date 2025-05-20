import { Injectable } from "@angular/core";
import { Pers } from "src/Models/Pers";
import { PersChangesComponent } from "./pers-changes/pers-changes.component";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Task } from "src/Models/Task";
import { ChangesModel, persExpChanges } from "src/Models/ChangesModel";
import { LevelUpMsgComponent } from "./level-up-msg/level-up-msg.component";
import { StatesService } from "./states.service";
import { NewLvlData } from "src/Models/NewLvlData";
import { GameSettings } from "./GameSettings";

@Injectable({
  providedIn: "root",
})
export class PerschangesService {
  afterPers: Pers;
  beforePers: Pers;

  constructor(public dialog: MatDialog, private router: Router, private srvSt: StatesService, public gameSettings: GameSettings) {}

  getClone(pers: Pers): Pers {
    return JSON.parse(JSON.stringify(pers));
  }
  getChSort(ch: ChangesModel): number {
    let sort = this.gameSettings.sort;

    // if (!this.gameSettings.isClassicaRPG) {
    //   sort = ["exp", "qwest", "abil", "abLvl", "cha", "chaLvl", "hp"];
    // }

    const idx = sort.findIndex((q) => q == ch.type);
    if (idx != -1) {
      return idx;
    } else {
      return sort.length;
    }
  }

  async showChanges(congrantMsg: string, failMsg: string, isGood: boolean, img?: string, tsk?: Task) {
    let changesMap = {};

    // Значения до
    this.fillChangesMap(changesMap, "before", this.beforePers);
    // Значения после
    this.fillChangesMap(changesMap, "after", this.afterPers);

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

    Object.keys(changesMap).forEach((n) => {
      const el = changesMap[n];
      // HP
      if (el.type == "hp") {
        if (el.after < el.before) {
          changes.push(new ChangesModel("HP", "hp", el.before, el.after, 0, this.afterPers.maxHp, null));
        }
      }
      // Квесты
      if (el.type == "qwest") {
        // Квест выполнен
        if (el.after === null || el.after === undefined) {
          changes.push(new ChangesModel('"' + el.name + '" выполнен!', "qwest", el.before, el.before, 0, el.total, el.img));
          isDoneQwest = true;
        } else {
          if (el.after > el.before) {
            changes.push(new ChangesModel(el.name, "qwest", el.before, el.after, 0, el.total, el.img));
          }
          if (el.after > el.before && el.after == el.total) {
            changes.push(new ChangesModel('"' + el.name + '" задания выполнены!', "qwest", el.after, el.after, 0, el.total, el.img));
            isDoneQwest = true;
            qwestToEdit = n;
          }
        }
      }
      // Награды
      else if (el.type == "inv") {
        if (el.after === null || el.after === undefined) {
          // Использован больше нет
          changes.push(new ChangesModel('Использован "' + el.name + '"', "inv", 0, 0, 0, 1, el.img));
        } else if (el.before === null || el.before === undefined) {
          // Получен новый
          changes.push(new ChangesModel('Получен "' + el.name + '"', "inv", 1, 1, 0, 1, el.img));
        } else if (el.after > el.before) {
          changes.push(new ChangesModel('Получен "' + el.name + '"', "inv", el.after, el.after, 0, el.after, el.img));
        } else if (el.after < el.before) {
          changes.push(new ChangesModel('Использован "' + el.name + '"', "inv", el.before, el.before, 0, el.before, el.img));
        }
      }
      // Характеристики
      else if (el.type == "cha") {
        // Изменение уровня
        if (el.after != el.before && el.after <= this.gameSettings.maxChaLvl && el.after > this.gameSettings.minChaLvl) {
          if (this.gameSettings.changesIsChowChaLevels) {
            let chaChanges = new ChangesModel(el.name, "cha", this.moreThenThero(el.before), this.moreThenThero(el.after), this.gameSettings.minChaLvl, this.gameSettings.maxChaLvl, el.img);
            chaChanges.lvl = el.after;
            changes.push(chaChanges);
          }
        }
        // Изменение значения
        if (this.gameSettings.changesIsChowChaValues && this.NE(el.before_chaVal, el.after_chaVal) && el.after_chaVal <= this.gameSettings.maxChaLvl) {
          let beforeVal = el.before_chaVal;
          let afterVal = el.after_chaVal;

          let abBeforePrevExp = Math.floor(beforeVal);
          let abBeforeNextExp = abBeforePrevExp + 1;

          let abAfterPrevExp = Math.floor(afterVal);
          let abAfterNextExp = abAfterPrevExp + 1;

          let abilChanges = new ChangesModel(el.name, "cha", beforeVal, afterVal, abBeforePrevExp, abBeforeNextExp, el.img);

          let eCh: persExpChanges[] = [];
          let prevChaLvl = Math.floor(beforeVal);
          let afterChaLvl = Math.floor(afterVal);
          abilChanges.lvl = prevChaLvl;

          if (afterChaLvl > prevChaLvl) {
            //1
            eCh.push(new persExpChanges(beforeVal, abBeforeNextExp, abBeforePrevExp, abBeforeNextExp, prevChaLvl));
            //2
            eCh.push(new persExpChanges(abAfterPrevExp, afterVal, abAfterPrevExp, abAfterNextExp, afterChaLvl));

            let chaLvlChanges = new ChangesModel(el.name, "chaLvl", beforeVal, afterVal, abBeforePrevExp, abBeforeNextExp, el.img);
            let chaNewLvl: NewLvlData = { txt: `${el.name.toUpperCase()}`, img: el.img, lvl: afterChaLvl, tsk: null };
            chaLvlChanges;
            chaLvlChanges.newLvlData = chaNewLvl;
            changes.push(chaLvlChanges);
          } else if (afterChaLvl < prevChaLvl) {
            //1
            eCh.push(new persExpChanges(beforeVal, abBeforePrevExp, abBeforePrevExp, abBeforeNextExp, prevChaLvl));
            //2
            eCh.push(new persExpChanges(abAfterNextExp, afterVal, abAfterPrevExp, abAfterNextExp, afterChaLvl));
          } else {
            eCh.push(new persExpChanges(beforeVal, afterVal, abAfterPrevExp, abAfterNextExp, prevChaLvl));
          }

          abilChanges.abilChanges = eCh;

          changes.push(abilChanges);
        }
      }
      // Навыки
      else if (el.type == "abil") {
        // Активирован
        if (this.gameSettings.changesIsShowAbActivate && el.abIsOpenBefore != el.abIsOpenAfter) {
          isAbilActivated = true;
          abToEdit = n;

          let txt = el.abIsOpenAfter == true ? "активирован" : "сброшен";

          changes.push(new ChangesModel(`${el.name} ${txt}`, "abil", 0, 0, 0, this.gameSettings.maxAbilLvl, el.img));
        } else {
          // Иземенение уровня
          if (this.gameSettings.changesIsShowAbLevels && el.after != el.before && el.after <= this.gameSettings.maxAbilLvl) {
            let abChanges = new ChangesModel(el.name, "abil", this.moreThenThero(el.before), this.moreThenThero(el.after), this.gameSettings.minAbilLvl, this.gameSettings.maxAbilLvl, el.img);

            abChanges.lvl = el.after;

            let abNewLvl: NewLvlData = { txt: `${el.name.toUpperCase()}`, img: el.img, lvl: el.after, tsk: tsk };
            abChanges.newLvlData = abNewLvl;

            changes.push(abChanges);
          }
          // Изменение значения
          if (this.gameSettings.changesIsShowAbValues && this.NE(el.before_abVal, el.after_abVal) && el.after_abVal <= this.gameSettings.tesMaxVal + 9.99) {
            let beforeVal = el.before_abVal;
            let afterVal = el.after_abVal;

            let abBeforePrevExp = Math.floor(beforeVal / 10) * 10;
            let abBeforeNextExp = abBeforePrevExp + 10;

            let abAfterPrevExp = Math.floor(afterVal / 10) * 10;
            let abAfterNextExp = abAfterPrevExp + 10;

            let abilChanges = new ChangesModel(el.name, "abil", beforeVal, afterVal, abBeforePrevExp, abBeforeNextExp, el.img);

            let eCh: persExpChanges[] = [];
            let prevAbLvl = this.gameSettings.minAbilLvl + (Math.floor(beforeVal / 10) * 10) / 10;
            let afterAbLvl = this.gameSettings.minAbilLvl + (Math.floor(afterVal / 10) * 10) / 10;
            abilChanges.lvl = prevAbLvl;

            if (afterAbLvl > prevAbLvl) {
              //1
              eCh.push(new persExpChanges(beforeVal, abBeforeNextExp, abBeforePrevExp, abBeforeNextExp, prevAbLvl));
              //2
              eCh.push(new persExpChanges(abAfterPrevExp, afterVal, abAfterPrevExp, abAfterNextExp, afterAbLvl));

              let abLvlChanges = new ChangesModel(el.name, "abLvl", beforeVal, afterVal, abBeforePrevExp, abBeforeNextExp, el.img);
              let abNewLvl: NewLvlData = { txt: `${el.name.toUpperCase()}`, img: el.img, lvl: afterAbLvl, tsk: tsk };
              abLvlChanges;
              abLvlChanges.newLvlData = abNewLvl;
              changes.push(abLvlChanges);
            } else if (afterAbLvl < prevAbLvl) {
              //1
              eCh.push(new persExpChanges(beforeVal, abBeforePrevExp, abBeforePrevExp, abBeforeNextExp, prevAbLvl));
              //2
              eCh.push(new persExpChanges(abAfterNextExp, afterVal, abAfterPrevExp, abAfterNextExp, afterAbLvl));
            } else {
              eCh.push(new persExpChanges(beforeVal, afterVal, abAfterPrevExp, abAfterNextExp, prevAbLvl));
            }

            abilChanges.abilChanges = eCh;

            changes.push(abilChanges);
          }
        }
      }
      // Уровень
      else if (el.type == "lvl") {
        if (el.after > el.before) {
          newLevel = true;
        } else if (el.after < el.before) {
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

    Object.keys(changesMap).forEach((n) => {
      // Опыт
      if (changesMap[n].type == "exp") {
        let isShowBySettings = isDoneQwest || this.gameSettings.changesIsShowExp;

        if (isShowBySettings) {
          let isTesChange = !this.gameSettings.isClassicaRPG && tsk != null && tsk.tesValue >= this.gameSettings.tesMaxVal && tsk.requrense != "нет";

          if (changesMap[n].after != changesMap[n].before || isTesChange) {
            let expChanges = new ChangesModel("Уровень", "exp", changesMap[n].before * 10, changesMap[n].after * 10, this.afterPers.prevExp * 10, this.afterPers.nextExp * 10, changesMap[n].img);

            let beforeExp = changesMap[n].before;
            let afterExp = changesMap[n].after;

            let prevLvl = this.beforePers.level;
            let afterLvl = this.afterPers.level;
            expChanges.lvl = afterLvl;

            let eCh: persExpChanges[] = [];

            if (afterLvl > prevLvl) {
              //1
              eCh.push(new persExpChanges(beforeExp, this.beforePers.nextExp, this.beforePers.prevExp, this.beforePers.nextExp, prevLvl));
              //2
              eCh.push(new persExpChanges(this.afterPers.prevExp, afterExp, this.afterPers.prevExp, this.afterPers.nextExp, afterLvl));
            } else if (afterLvl < prevLvl) {
              //1
              eCh.push(new persExpChanges(beforeExp, this.beforePers.prevExp, this.beforePers.prevExp, this.beforePers.nextExp, prevLvl));
              //2
              eCh.push(new persExpChanges(this.afterPers.nextExp, afterExp, this.afterPers.prevExp, this.afterPers.nextExp, afterLvl));
            } else {
              eCh.push(new persExpChanges(beforeExp, afterExp, this.afterPers.prevExp, this.afterPers.nextExp, prevLvl));
            }

            expChanges.expChanges = eCh;

            if (isDoneQwest || this.gameSettings.changesIsShowExp) {
              changes.push(expChanges);
            } else {
              changes.unshift(expChanges);
            }
          }
        }
      }
    });

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let classPanel = isGood ? "my-good" : "my-bad";

    if (isDoneQwest) {
      changes = changes.filter((n) => n.type != "subtask");
    }

    let combineChanges: ChangesModel[] = [];
    let unionChanges: ChangesModel[] = [];

    // if (!changes.length && this.afterPers.gold != this.beforePers.gold) {
    //   changes.push(
    //     new ChangesModel('Золото', 'qwest', 0, 0, 0, 1, null)
    //   );
    // }

    for (let index = 0; index < changes.length; index++) {
      let head;
      ({ head, isGood } = this.GetHead(isGood, congrantMsg, failMsg));

      let abPoints;
      let gold;
      let goldTotal;

      if (changes[index].type == "abil") {
        abPoints = this.afterPers.ON;
        if (isAbilActivated) {
          head = changes[index].name + "!";
          changes[index].name = " ";
        }
      } else if (changes[index].type == "inv") {
        head = changes[index].name + "!";
        changes[index].name = " ";
      }

      // Добавляем золото к первому изменению
      if (Math.floor(this.afterPers.gold) != Math.floor(this.beforePers.gold)) {
        gold = Math.floor(this.afterPers.gold) - Math.floor(this.beforePers.gold);
        if (gold > 0) {
          gold = "+" + gold;
        }
        goldTotal = Math.floor(this.afterPers.gold);
      }

      if (isDoneQwest && changes[index].type == "qwest") {
        head = changes[index].name;
        changes[index].name = " ";
      }

      unionChanges.push(changes[index]);

      changes[index].head = head;
      changes[index].abPoints = abPoints;
      changes[index].gold = gold;
      changes[index].goldTotal = goldTotal;
    }

    // Отдельные изменения
    unionChanges.sort((a, b) => {
      return this.getChSort(a) - this.getChSort(b);
    });

    let wasGold = false;

    // this.gameSettings.isClassicaRPG &&
    // if (img != null) {
    //   for (const ch of unionChanges) {
    //     if (ch.type == "exp") {
    //       ch.img = img;
    //     }
    //   }
    // }

    for (const ch of unionChanges) {
      const head = ch.head;
      const abPoints = ch.head;
      const type = ch.type;
      const img = ch.img;
      let gold = ch.gold;
      let goldTotal = ch.goldTotal;

      if (type == "abLvl" || type == "chaLvl") {
        if (type == "abLvl" && !this.gameSettings.isShowAbLvlPopup) {
          continue;
        }
        if (type == "chaLvl" && !this.gameSettings.isShowChaLvlPopup) {
          continue;
        }

        let dialogRefLvlUp = this.dialog.open(LevelUpMsgComponent, {
          panelClass: classPanel,
          backdropClass: "backdrop-changes",
          data: {
            abPoints: ch.newLvlData.lvl,
            img: ch.newLvlData.img,
            txt: ch.newLvlData.txt,
            lvl: ch.newLvlData.lvl,
            tsk: ch.newLvlData.tsk,
          },
        });

        await sleep(this.gameSettings.changesPopupDurationNewLevel);

        dialogRefLvlUp.close();

        continue;
      }

      if (wasGold) {
        gold = null;
        goldTotal = null;
      }

      if (gold) {
        wasGold = true;
      }

      let dialogRef = this.dialog.open(PersChangesComponent, {
        panelClass: classPanel,
        data: {
          headText: head,
          changes: [ch],
          isGood: isGood,
          abPoints: null,
          isTES: this.afterPers.isTES,
          itemType: type,
          img: img,
          gold: gold,
          goldTotal: goldTotal,
          tsk: tsk,
        },
        backdropClass: "backdrop-changes",
      });

      if (type == "abil") {
        await sleep(this.gameSettings.changesPopupDurationAbil);
      } else if (type == "cha") {
        await sleep(this.gameSettings.changesPopupDurationCha);
      } else if (ch.type == "qwest") {
        await sleep(this.gameSettings.changesPopupDurationQwest);
      } else {
        await sleep(this.gameSettings.changesPopupDuration);
      }

      dialogRef.close();
    }

    if (newLevel) {
      let dialogRefLvlUp = this.dialog.open(LevelUpMsgComponent, {
        panelClass: classPanel,
        backdropClass: "backdrop-changes",
        data: {
          abPoints: this.afterPers.ON,
          lvl: this.afterPers.level,
          img: "assets/img/levelUp.png",
        },
      });

      await sleep(this.gameSettings.changesPopupDurationNewLevel);

      dialogRefLvlUp.close();

      if (this.gameSettings.isOpenPersAtNewLevel) {
        this.srvSt.selTabPersList = 0;
        this.srvSt.selInventoryList = 0;
        if (this.afterPers.ON >= 1) {
          this.router.navigate(["/pers"]);
        }
      }
    }

    if (isDoneQwest && qwestToEdit != null) {
      this.router.navigate(["pers/qwest", qwestToEdit, true]);
    }
  }

  private NE(a: number, b: number): boolean {
    let diff = Math.abs(b - a);

    return diff >= 0.01;
  }

  private GetHead(isGood: boolean, congrantMsg: string, failMsg: string) {
    let head = "";
    if (isGood == null) {
      head = null;
      isGood = true;
    } else {
      if (isGood) {
        head = this.getCongrantMsg();
      } else {
        head = this.getFailMsg();
      }
    }
    return { head, isGood };
  }

  private fillChangesMap(changesMap: {}, chType: string, prs: Pers) {
    // Ранг
    if (!changesMap["rang"]) {
      changesMap["rang"] = this.getChItem("rang", "rang", null);
    }
    changesMap["rang"][chType] = prs.rang.name;

    // Уровень
    if (!changesMap["lvl"]) {
      changesMap["lvl"] = this.getChItem("lvl", "lvl", null);
    }
    changesMap["lvl"][chType] = prs.level;

    // Опыт
    if (!changesMap["exp"]) {
      changesMap["exp"] = this.getChItem("exp", "exp", null);
    }
    changesMap["exp"][chType] = prs.exp;

    // HP
    if (this.gameSettings.isHpEnabled) {
      if (!changesMap["hp"]) {
        changesMap["hp"] = this.getChItem("hp", "hp", null);
      }
      changesMap["hp"][chType] = prs.hp;
    }

    // Навыки
    prs.characteristics.forEach((ch) => {
      ch.abilities.forEach((ab) => {
        ab.tasks.forEach((tsk) => {
          if (!changesMap[tsk.id]) {
            changesMap[tsk.id] = this.getChItem("abil", "", ab.image);
          }

          let name = ab.name;
          if (this.gameSettings.changesIsShowAbDescrInChanges && tsk.curLvlDescr3 != null && tsk.curLvlDescr3 != ab.name) {
            name += " (" + tsk.curLvlDescr3 + ")";
          }

          changesMap[tsk.id].name = name;

          let abVal = Math.floor(tsk.value);
          if (abVal > this.gameSettings.maxAbilLvl) {
            abVal = this.gameSettings.maxAbilLvl;
          }
          changesMap[tsk.id][chType] = abVal;

          changesMap[tsk.id][chType + "_abVal"] = tsk.tesValue;
          if (chType == "before") {
            changesMap[tsk.id]["abIsOpenBefore"] = ab.isOpen;
          } else {
            changesMap[tsk.id]["abIsOpenAfter"] = ab.isOpen;
          }
        });
      });
    });

    // Характеристики
    prs.characteristics.forEach((ch) => {
      if (!changesMap[ch.id]) {
        changesMap[ch.id] = this.getChItem("cha", ch.name, ch.image);
      }

      let chaVal = Math.floor(ch.value);
      if (chaVal > this.gameSettings.maxChaLvl) {
        chaVal = this.gameSettings.maxChaLvl;
      }

      changesMap[ch.id][chType] = chaVal;
      changesMap[ch.id][chType + "_chaVal"] = ch.value;
    });

    // Квесты
    prs.qwests.forEach((qw) => {
      if (!changesMap[qw.id]) {
        let qwitem = this.getChItem("qwest", qw.name, qw.image);
        changesMap[qw.id] = qwitem;
      }

      changesMap[qw.id][chType] = qw.tasks.filter((n) => n.isDone).length;
      changesMap[qw.id]["total"] = qw.tasks.length;

      // Подзадачи
      qw.tasks.forEach((tsk) => {
        if (!changesMap[tsk.id]) {
          let qwitem = this.getChItem("tsk", tsk.name, null);
          changesMap[tsk.id] = qwitem;
        }
        this.tskStatesProgress(tsk, chType, changesMap, false);
      });
    });

    // Инвентарь
    prs.inventory.forEach((inv) => {
      if (!changesMap[inv.id]) {
        changesMap[inv.id] = this.getChItem("inv", inv.name, inv.image);
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
    return Pers.Inspirations[Math.floor(Math.random() * Pers.Inspirations.length)] + "!"; //+ ', ' + this.afterPers.name + '!';
  }

  private getFailMsg() {
    return Pers.Abuses[Math.floor(Math.random() * Pers.Abuses.length)] + "!"; //+ ', ' + this.afterPers.name + '!';
  }

  private tskStatesProgress(tsk: Task, chType: string, changesMap: any, isCheckActive: boolean) {
    if (tsk.states.length > 0) {
      let done = tsk.states.filter((n) => (n.isActive || !isCheckActive) && n.isDone).length;
      if (chType == "before") {
        changesMap[tsk.id]["tskProgrBefore"] = done;
      } else {
        changesMap[tsk.id]["tskProgrAfter"] = done;
      }
      let all = tsk.states.filter((n) => n.isActive || !isCheckActive).length;
      changesMap[tsk.id]["tskProgrTotal"] = all;
    } else {
      changesMap[tsk.id]["tskProgrBefore"] = 1;
      changesMap[tsk.id]["tskProgrAfter"] = 1;
      changesMap[tsk.id]["tskProgrTotal"] = 1;
    }
  }

  moreThenThero(val: number): number {
    if (val <= 0) {
      val = 0;
    }

    return val;
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
