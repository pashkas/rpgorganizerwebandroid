import { Pipe, PipeTransform } from '@angular/core';
import { Reward } from 'src/Models/Reward';

@Pipe({
  name: 'shop',
  pure: false
})
export class ShopPipe implements PipeTransform {

  transform(revs: Reward[], ...args: any[]): Reward[] {
    if (revs) {
      return revs
        .filter(r => r.isShop || r.isReward);
    }

    return [];
  }

}
