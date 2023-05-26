import { v4 as uuid } from "uuid";
import { Reqvirement } from "./Task";
export class Reward {
  id: any = uuid();
  name: string = "";
  image: string = "";
  descr: string = "";
  probability: number = 0;
  cumulative: number = 0;
  count: number = 0;
  rare: string = "Обычный";

  isLud: boolean = false;
  isShop: boolean = true;
  isArtefact: boolean = false;
  isReward: boolean = false;

  reqvirements: Reqvirement[] = [];
  reqStr: string[];

  ludProbability: number = 0;
  cost: number = 0;
  startProbability: number;
  endProbability: number;

  isAviable: boolean = false;
  revProbId: number;
}
