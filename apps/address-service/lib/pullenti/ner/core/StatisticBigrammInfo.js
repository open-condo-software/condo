/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


/**
 * Статистическая информация о биграмме - возвращается StatisticCollection.GetBigrammInfo
 * Статистика биграмм
 */
class StatisticBigrammInfo {
    
    constructor() {
        this.firstCount = 0;
        this.secondCount = 0;
        this.pairCount = 0;
        this.firstHasOtherSecond = false;
        this.secondHasOtherFirst = false;
    }
    
    static _new874(_arg1, _arg2) {
        let res = new StatisticBigrammInfo();
        res.firstCount = _arg1;
        res.secondCount = _arg2;
        return res;
    }
}


module.exports = StatisticBigrammInfo