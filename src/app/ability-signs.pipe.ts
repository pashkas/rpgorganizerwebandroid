import { Pipe, PipeTransform } from '@angular/core';
import { Ability } from 'src/Models/Ability';

@Pipe({
  name: 'abilitySigns'
})
export class AbilitySignsPipe implements PipeTransform {

  transform(value: Ability, ...args: any[]): any {
    if (value == null || value.tasks == null || !value.tasks.length) {
      return '';
    }

    const firstTask = value.tasks[0];
    
    if (firstTask.isPerk) {
      return '*';
    }

    return '';
  }

}
