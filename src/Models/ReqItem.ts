export interface ReqItem {
    elId: any;
    elName: string;
}

export enum ReqItemType {
    qwest = "Квест",
    abil = "Навык",
    charact = "Характеристика",
    persLvl = "Уровень персонажа",
}