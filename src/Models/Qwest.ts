import { Task } from './Task';
import { v4 as uuid } from 'uuid';
import { Reward } from './Reward';
export class Qwest {
  id: any = uuid();
  name: string = "";
  image: string = "assets/icons/defQwest.png";
  descr: string = "";
  rewards: Reward[] = [];
  tasksDone: number = 0;
  tasks: Task[] = [];
  progressValue: number = 0;
  exp: number = 0;
  parrentId: any = 0;
  abilitiId: any;
  hardnes: number;
  isNoActive: boolean;
}
