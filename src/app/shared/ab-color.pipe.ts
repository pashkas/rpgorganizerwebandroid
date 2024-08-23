import { Pipe, PipeTransform } from "@angular/core";
import { Task } from "src/Models/Task";

@Pipe({
  name: "abColor",
})
export class AbColorPipe implements PipeTransform {
  transform(tsk: Task, ...args: any[]): any {
    let cls = [];
    if (tsk.IsNextLvlSame) {
      cls.push("isSame");
    }

    if (tsk.isPerk) {
      cls.push("isPerk");
    } else {
      cls.push("text-primary");
    }

    return cls.join(" ");
  }
}
