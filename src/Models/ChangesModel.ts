export class ChangesModel {
    name: string;
    type: string;
    valFrom: number;
    valTo: number;
    valChange: string;
    totalMax: number;
    totalMin: number;
    expChanges: persExpChanges[] = [];
    img: string;
    head: any;
    abPoints: any;
    gold: string;
    goldTotal: number;

    constructor(name, type, valFrom, valTo, totalMin, totalMax, img) {
        this.img = img;

        if (totalMin == null || totalMin == undefined) {
            totalMin = 0;
        }
        if (totalMax == null || totalMax == undefined) {
            totalMax = 0;
        }
        if (valFrom == null || valFrom == undefined) {
            valFrom = 0;
        }
        if (valTo == null || valTo == undefined) {
            valTo = 0;
        }

        this.name = name;
        this.type = type;

        let change;
        const changeAbs = Math.abs(valTo - valFrom);
        if (changeAbs < 1) {
            if (changeAbs < 0.1) {
                change = Math.floor((valTo - valFrom) * 100) / 100;
            } else {
                change = Math.floor((valTo - valFrom) * 10) / 10;
            }
        } else {
            change = Math.floor(valTo) - Math.floor(valFrom);
        }

        if (change != 0 && type != 'subtask' && type != 'qwest' && type != 'state' && type != 'inv' && type != 'perk') {
            if (change > 0) {
                this.valChange = '+' + change;
            } else {
                this.valChange = '' + change;
            }
        }

        if (type == 'perk') {
            this.name = '"' + this.name + '"';
            if (change > 0) {
                this.valChange = 'получен!';
            } else {
                this.valChange = 'потерян!';
            }
        } else if (type == 'inv') {
            if (change > 0) {
                this.valChange = 'получен!';
            } else {
                this.valChange = 'использован!';
            }
        } else if (type == 'exp' || type == 'cha' || type == 'abil') {
            this.valChange = '';
        }


        // if (type == 'abil' || type == 'cha') {
        //     this.valChange = '';
        // }

        //--------------------------------------
        this.totalMin = totalMin;
        this.totalMax = totalMax;

        this.valFrom = ((valFrom - totalMin) / (totalMax - totalMin)) * 100;
        this.valTo = ((valTo - totalMin) / (totalMax - totalMin)) * 100;
        //---------------------------------------

    }
}

export class persExpChanges {
    valFrom: number;
    valTo: number;
    lvlStartExp: number;
    lvlEndExp: number;

    constructor(valFrom, valTo, lvlStartExp, lvlEndExp) {
        lvlStartExp = lvlStartExp;
        lvlEndExp = lvlEndExp;


        this.valFrom = ((valFrom - lvlStartExp) / (lvlEndExp - lvlStartExp)) * 100;
        this.valTo = ((valTo - lvlStartExp) / (lvlEndExp - lvlStartExp)) * 100;

        this.lvlStartExp = 0;
        this.lvlEndExp = 100;
    }
}