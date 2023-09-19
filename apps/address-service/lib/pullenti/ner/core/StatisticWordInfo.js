/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Статистическая информация о токене - возвращается StatisticCollection.GetWordInfo
 * Статистика токена
 */
class StatisticWordInfo {
    
    constructor() {
        this.normal = null;
        this.totalCount = 0;
        this.lowerCount = 0;
        this.upperCount = 0;
        this.capitalCount = 0;
        this.maleVerbsAfterCount = 0;
        this.femaleVerbsAfterCount = 0;
        this.hasBeforePersonAttr = false;
        this.notCapitalBeforeCount = 0;
        this.likeCharsBeforeWords = null;
        this.likeCharsAfterWords = null;
    }
    
    toString() {
        return this.normal;
    }
    
    addBefore(w) {
        if (this.likeCharsBeforeWords === null) 
            this.likeCharsBeforeWords = new Hashtable();
        if (!this.likeCharsBeforeWords.containsKey(w)) 
            this.likeCharsBeforeWords.put(w, 1);
        else 
            this.likeCharsBeforeWords.put(w, this.likeCharsBeforeWords.get(w) + 1);
    }
    
    addAfter(w) {
        if (this.likeCharsAfterWords === null) 
            this.likeCharsAfterWords = new Hashtable();
        if (!this.likeCharsAfterWords.containsKey(w)) 
            this.likeCharsAfterWords.put(w, 1);
        else 
            this.likeCharsAfterWords.put(w, this.likeCharsAfterWords.get(w) + 1);
    }
    
    static _new861(_arg1) {
        let res = new StatisticWordInfo();
        res.normal = _arg1;
        return res;
    }
}


module.exports = StatisticWordInfo