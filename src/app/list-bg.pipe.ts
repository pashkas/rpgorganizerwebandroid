import { Pipe, PipeTransform } from '@angular/core';
import { Task } from 'src/Models/Task';

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
      if (tsk.time == "00:00") {
        return 'list-group-item-warning';
      }

      // if (tsk.requrense != 'нет' && check == 'later') {
      //   return 'list-group-item-info';
      // }
    }

    return '';
  }

  checkDate(date: Date): string {
    let dt = new Date(date).setHours(0, 0, 0, 0);
    let now = new Date().setHours(0, 0, 0, 0);

    if (dt.valueOf() < now.valueOf()) {
      return 'back';
    }

    if (dt.valueOf() == now.valueOf()) {
      return 'now';
    }

    return 'later';
  }

}
