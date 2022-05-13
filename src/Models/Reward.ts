import { v4 as uuid } from 'uuid';
export class Reward {
    id: any = uuid();
    name: string = "";
    image: string = "";
    descr: string = "";
    probability: number = 1;
    cumulative: number = 0;
    count: number = 0;
    rare: string = 'Обычный';

    isLud: boolean = false;
    ludProbability: number = 0;
    isShop: boolean = true;
    cost: number = 0;
    startProbability: number;
    endProbability: number;
}
