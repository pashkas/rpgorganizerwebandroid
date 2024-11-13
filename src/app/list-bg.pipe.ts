import { Pipe, PipeTransform } from "@angular/core";
import { Task } from "src/Models/Task";
import * as moment from "moment";

@Pipe({
  name: "listBg",
})
export class ListBgPipe implements PipeTransform {
  transform(tsk: Task, view: string, isMegaPlan: boolean, ...args: any[]): any {
    if (isMegaPlan) {
      return "";
    }

    let check = this.checkDate(tsk.date);

    if (view == "SkillsSort") {
      // if (tsk.requrense != 'нет' && check != 'now') {
      //   return 'list-group-item-info';
      // }

      if (tsk.requrense != "нет" && tsk.notActive == true) {
        return "revFade";
      }
    }

    return "";
  }

  checkDate(date: Date): string {
    let dt = moment(date).startOf("day");
    let now = moment().startOf("day");

    if (dt.isSame(now)) {
      return "now";
    }

    if (dt.isBefore(now)) {
      return "back";
    }

    return "later";
  }
}
