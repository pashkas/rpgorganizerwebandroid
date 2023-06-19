import { Pipe, PipeTransform } from "@angular/core";
import { Task } from "src/Models/Task";

@Pipe({
  name: "requrence",
})
export class RequrencePipe implements PipeTransform {
  transform(tsk: Task): string {
    if (tsk.requrense != "дни недели") return tsk.requrense;

    const formattedWeekDays = this.convertToRangeString(tsk.tskWeekDays);

    return formattedWeekDays;
  }

  convertToRangeString(tskWeekDays: string[]): string {
    const sortedDays = tskWeekDays.sort((a, b) => Task.weekDays.indexOf(a) - Task.weekDays.indexOf(b));
    let rangeStart = sortedDays[0];
    let rangeEnd = sortedDays[0];
    let rangeString = "";

    for (let i = 1; i < sortedDays.length; i++) {
      const currentDay = sortedDays[i];
      const prevDay = sortedDays[i - 1];

      if (Task.weekDays.indexOf(currentDay) !== Task.weekDays.indexOf(prevDay) + 1) {
        rangeEnd = prevDay;
        if (rangeString !== "") {
          rangeString += ", ";
        }
        if (rangeEnd === rangeStart) {
          rangeString += rangeStart;
        } else if (Task.weekDays.indexOf(rangeEnd) === Task.weekDays.indexOf(rangeStart) + 1) {
          rangeString += `${rangeStart}, ${rangeEnd}`;
        } else {
          rangeString += `${rangeStart}-${rangeEnd}`;
        }
        rangeStart = currentDay;
      }
      rangeEnd = currentDay;
    }

    if (rangeString !== "") {
      rangeString += ", ";
    }

    if (rangeEnd === rangeStart) {
      rangeString += rangeStart;
    } else if (Task.weekDays.indexOf(rangeEnd) === Task.weekDays.indexOf(rangeStart) + 1) {
      rangeString += `${rangeStart}, ${rangeEnd}`;
    } else {
      rangeString += `${rangeStart}-${rangeEnd}`;
    }

    return rangeString;
  }
}
