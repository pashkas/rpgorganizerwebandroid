import { Pipe, PipeTransform } from '@angular/core';
import { Task } from 'src/Models/Task';
import * as moment from 'moment';

@Pipe({
  name: 'listBg'
})
export class ListBgPipe implements PipeTransform {

  transform(tsk: Task, view: string, isMegaPlan: boolean, ...args: any[]): any {
    if (isMegaPlan) {
      return '';
    }

    if (tsk.lastNotDone && view == 'SkillsGlobal') {
      return 'list-group-item-danger';
    }

    let check = this.checkDate(tsk.date);

    if (view == 'SkillsSort') {
      // if (tsk.requrense != 'нет' && this.checkDate(tsk.date) == 'back') {
      //   return 'list-group-item-warning';
      // }

      // Новые задачи подсвечиваем
      // if (tsk.time == "00:00") {
      //   return 'list-group-item-warning';
      // }

      if (tsk.requrense != 'нет' && check != 'now') {
        return 'list-group-item-info';
      }
    }

    return '';
  }

  checkDate(date: Date): string {
    let dt = moment(date).startOf('day');
    let now = moment().startOf('day');

    if (dt.isSame(now)) {
      return 'now';
    }

    if (dt.isBefore(now)) {
      return 'back';
    }

    return 'later';
  }

}
