export interface ReqItem {
    elId: any;
    elName: string;
    progr: number;
}

export enum ReqItemType {
    qwest = "Квест",
    abil = "Навык",
    charact = "Характеристика",
    persLvl = "Уровень персонажа",
}