import { Pipe, PipeTransform } from "@angular/core";
import { Pers } from "src/Models/Pers";
import { curpersview } from "src/Models/curpersview";

@Pipe({
  name: "mainView",
})
export class MainViewPipe implements PipeTransform {
  transform(data: any, ...args: any[]): any {
    // Начало игры
    if (data.pers == null) {
      return "start";
    }

    if ((data.pers.characteristics == null || data.pers.characteristics.length == 0) && [curpersview.QwestTasks, curpersview.SkillTasks].includes(data.currentView)) {
      return "start";
    }

    // Пусто
    if (!data.currentTask && [curpersview.QwestTasks, curpersview.SkillTasks].includes(data.currentView)) {
      return "empty";
    }

    // Список
    if ([curpersview.SkillsSort, curpersview.QwestSort].includes(data.currentView)) {
      return "list";
    }

    // Список квестов
    if ([curpersview.QwestsGlobal].includes(data.currentView)) {
      return "listQwest";
    }

    // Список навыков
    if ([curpersview.SkillsGlobal].includes(data.currentView)) {
      return "listSkills";
    }

    // Сфокусированный
    if (data.currentTask && [curpersview.QwestTasks, curpersview.SkillTasks].includes(data.currentView)) {
      return "focus";
    }

    return null;
  }
}
