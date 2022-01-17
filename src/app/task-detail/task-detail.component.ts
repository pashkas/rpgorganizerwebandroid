import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Pers } from 'src/Models/Pers';
import { Task, taskState, Reqvirement } from 'src/Models/Task';
import { ActivatedRoute, Router } from '@angular/router';
import { PersService } from '../pers.service';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Ability } from 'src/Models/Ability';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';
import { Characteristic } from 'src/Models/Characteristic';
import { ChangeCharactComponent } from '../pers/change-charact/change-charact.component';
import { Qwest } from 'src/Models/Qwest';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TaskDetailComponent implements OnInit {
  private unsubscribe$ = new Subject();

  isEditMode: boolean = false;
  linkQwests: Qwest[] = [];
  pers:Pers;
  requrenses: string[] = Task.requrenses;
  times = [1, 2, 3, 4, 5];
  tsk: Task;
  tskAbility: Ability;
  tskCharact: Characteristic;
  weekDays: string[] = Task.weekDays;

  constructor(private location: Location, private route: ActivatedRoute, public srv: PersService, private router: Router, public dialog: MatDialog) { }

  /**
   * Добавить состояние к задаче.
   */
  addStateToTask(st: taskState) {
    let isEdit;
    this.srv.isDialogOpen = true;

    if (st) {
      isEdit = true;
    } else {
      isEdit = false;
    }

    let header = '';
    let time = null;
    // if (this.tsk.requrense == 'нет') {
    //   time = null;
    // }
    // else{
    //   if (st) {
    //     if (st.time == null || st.time == undefined) {
    //       st.time = "00:00";
    //     }
    //     time = st.time;
    //   }
    //   else{
    //     time = "00:00";
    //   }
    // }

    header += isEdit ? 'Редактировать' : 'Добавить';
    header += this.tsk.requrense == 'нет' ? ' подзадачу' : ' подзадачу';
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: 'my-dialog',
      data: { header: header, text: isEdit ? st.name : '', timeVal: st ? st.timeVal : null },
      backdropClass: 'backdrop'
    });

    dialogRef.afterClosed()
      .subscribe(stt => {
        if (stt) {
          if (!isEdit) {
            let state = new taskState();
            state.value = this.tsk.value;
            state.requrense = this.tsk.requrense;
            state.image = this.srv.GetRndEnamy(state, this.pers.level, this.pers.maxPersLevel);
            state.name = stt;
            //state.time = stt.time;
            this.tsk.states.push(state);

            if (this.tsk.requrense == 'нет') {
              this.tsk.states = this.tsk.states.sort((a, b) => {
                return a.isDone === b.isDone ? 0 : b.isDone ? -1 : 1;
              });
            }
          } else {
            st.name = stt;
            //st.time = stt.time;
          }
        }
        this.srv.isDialogOpen = false;
      });
  }

  changeCharact() {
    if (!this.tskAbility || !this.tskCharact) {
      return;
    }

    this.srv.isDialogOpen = true;
    const dialogRef = this.dialog.open(ChangeCharactComponent, {
      panelClass: 'my-big',
      data: { characteristic: this.tskCharact, allCharacts: this.pers.characteristics.sort((a, b) => a.name.localeCompare(b.name)), tittle: 'Выберите квест' },
      backdropClass: 'backdrop'
    });

    dialogRef.afterClosed()
      .subscribe(n => {
        if (n) {
          if (n.id != this.tskCharact.id) {
            for (const ch of this.pers.characteristics) {
              if (ch.id == n.id) {
                ch.abilities.push(this.tskAbility);

                break;
              }
            }

            // Перемещаем
            this.tskCharact.abilities = this.tskCharact.abilities.filter(n => n.id !== this.tskAbility.id);

            this.findTask();
          }
        }
        this.srv.isDialogOpen = false;
      });
  }

  /**
   * Удалить состояние у задачи.
   * @param id Идентификатор задачи.
   */
  delState(id: string) {
    this.tsk.states = this.tsk.states.filter(n => { return n.id != id; });
  }

  /**
   * Сдвинуть задачу вниз.
   * @param i Индекс.
   */
  down(i: number) {
    if (this.tsk.states.length > i + 1) {
      let tmp = this.tsk.states[i];

      this.tsk.states[i] = this.tsk.states[i + 1];
      this.tsk.states[i + 1] = tmp;
    }
  }

  downAbil() {
    if (this.tskAbility) {
      this.srv.changesBefore();

      this.srv.downAbility(this.tskAbility);

      this.srv.changesAfter(false);
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.tsk.states, event.previousIndex, event.currentIndex);
  }

  findTask() {
    if (!this.pers) {
      this.router.navigate(['/main']);
    }

    const id = this.route.snapshot.paramMap.get('id');

    this.tsk = this.srv.allMap[id].item;

    if (this.tsk) {
      if (this.tsk.requrense == 'нет') {
        this.requrenses = Task.requrenses.filter(n => {
          return n === 'нет';
        });
      }
      else {
        this.tskAbility=this.srv.allMap[id].link;
        this.tskCharact=this.srv.allMap[this.srv.allMap[id].link.id].link;
        this.requrenses = Task.requrenses.filter(n => {
          return n != 'нет';
        });
      }
    }

    const isEdit = this.route.snapshot.paramMap.get('isEdit');
    if (isEdit == 'true') {
      this.isEditMode = true;
    }

    if (!this.tsk.tskWeekDays) {
      this.tsk.tskWeekDays = [...Task.weekDays];
    }

    if (!this.tsk.reqvirements) {
      this.tsk.reqvirements = [];
    }

    this.findLinks();
  }

  goBack() {
    if (this.isEditMode) {
      this.isEditMode = false;
    }
    else {
      this.location.back();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.srv.pers$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe(n=>{
      this.pers=n;
      this.findTask();
    });
  }

  onTskDateChange(ev) {
    this.tsk.date = ev;

    this.tsk.states.forEach(el => {
      el.isDone = false;
    });
  }

  qwickSetDate(v) {
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    if (v == 'today') {
      this.tsk.date = date;
    }
    else {
      date.setDate(date.getDate() + 1);
      this.tsk.date = date;
    }
    this.srv.CheckSetTaskDate(this.tsk);

    this.tsk.states.forEach(el => {
      el.isDone = false;
    });
  }

  refrCounter() {
    this.tsk.refreshCounter++;
    this.srv.savePers(false);
  }

  /**
  * Сохранить данные.
  */
  saveData() {
    if (this.isEditMode) {
      this.srv.savePers(false);
      this.findLinks();
      this.isEditMode = false;
    }
    else {
      this.isEditMode = true;
    }
  }

  setIsHard() {
    this.tsk.isHard = !this.tsk.isHard;
  }

  setSumStates() {
    this.tsk.isSumStates = !this.tsk.isSumStates;
  }

  setWeekDays(wd) {
    let idx = this.tsk.tskWeekDays.indexOf(wd);

    if (idx == -1) {
      this.tsk.tskWeekDays.push(wd);
    }
    else {
      this.tsk.tskWeekDays.splice(idx, 1);
    }
  }

  /**
   * Сдвинуть задачу вверх.
   * @param i Индекс задачи.
   */
  up(i: number) {
    if (i >= 1) {
      let tmp = this.tsk.states[i];

      this.tsk.states[i] = this.tsk.states[i - 1];
      this.tsk.states[i - 1] = tmp;
    }
  }

  upAbil() {
    if (this.tskAbility) {
      this.srv.changesBefore();

      this.srv.upAbility(this.tskAbility);

      this.srv.changesAfter(true);
    }
  }

  private findLinks() {
    let linkQwests = [];
    if (this.tskAbility) {
      for (const qw of this.pers.qwests) {
        if (qw.abilitiId == this.tskAbility.id) {
          linkQwests.push(qw);
        }
      }
    }
    this.linkQwests = linkQwests;
  }
}
