import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StatesService {
  selTabPersList: number = 0;
  selInventoryList: number = 0;

  constructor() { }
}
