import { Injectable } from '@angular/core';
import { Pers } from 'src/Models/Pers';
import { ReqItem, ReqItemType } from 'src/Models/ReqItem';

@Injectable({
  providedIn: 'root'
})
export class RevardService {
  constructor() { }

  getDefaultValue(q: string): number {
    if (q == ReqItemType.qwest) {
      return 1;
    } else if (q == ReqItemType.charact) {
      return 10;
    } else if (q == ReqItemType.abil) {
      return 10;
    } else if (q == ReqItemType.persLvl) {
      return 10;
    }
  }

  getElements(prs: Pers, q: string): ReqItem[] {
    if (q == ReqItemType.qwest) {
      return prs.qwests
        .filter(p => p.name != 'Дела')
        .map(q => <ReqItem>{
          elId: q.id,
          elName: q.name,
        }).sort((a, b) => a.elName.localeCompare(b.elName));
    } else if (q == ReqItemType.charact) {
      return prs.characteristics.map(q => <ReqItem>{
        elId: q.id,
        elName: q.name,
      }).sort((a, b) => a.elName.localeCompare(b.elName));
    } else if (q == ReqItemType.abil) {
      let allAbils = prs.characteristics.reduce((acc, ch) => acc.concat(ch.abilities), []);
      return allAbils.map(q => <ReqItem>{
        elId: q.id,
        elName: q.name,
      }).sort((a, b) => a.elName.localeCompare(b.elName));
    } else if (q == ReqItemType.persLvl) {
      return [<ReqItem>{
        elId: 'pers',
        elName: 'Уровень персонажа'
      }];
    }
  }

  getRevTypes(): string[] {
    return [
      ReqItemType.qwest,
      ReqItemType.abil,
      ReqItemType.charact,
      ReqItemType.persLvl,
    ];
  }
}
