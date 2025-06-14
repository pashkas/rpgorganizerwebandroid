import { Pipe, PipeTransform } from "@angular/core";
import { Ability } from "src/Models/Ability";
import { Task } from "src/Models/Task";

@Pipe({
  name: "abHardness",
  pure: false,
})
export class AbHardnessPipe implements PipeTransform {
  transform(tsk: Task): any {
    let hrd = "";

    if (tsk.hardnes == 0.5) {
      // hrd += '"';
    }

    if (tsk.hardnes == 2) {
      hrd += "*";
    }

    if (tsk.isPerk) {
      // hrd += "^";
    }

    let isSame = "";
    if (tsk.IsNextLvlSame) {
      // isSame = "+";
    }

    return isSame + tsk.name + hrd;
  }
}
