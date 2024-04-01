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
    if (tsk.isPerk) {
      hrd += "^";
    }

    if (tsk.hardnes == 2) {
      hrd += "*";
    }

    if (tsk.hardnes == 3) {
      hrd += "**";
    }

    let isSame = "";
    if(tsk.IsNextLvlSame && tsk.value >= 1 && tsk.mayUp){
      isSame = "+";
    }

    return isSame + tsk.name + hrd;
  }
}
