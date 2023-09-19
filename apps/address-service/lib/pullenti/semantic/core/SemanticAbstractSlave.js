/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const MetaToken = require("./../../ner/MetaToken");
const NounPhraseToken = require("./../../ner/core/NounPhraseToken");

class SemanticAbstractSlave extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.preposition = null;
        this.source = null;
    }
    
    static createFromNoun(npt) {
        let res = new SemanticAbstractSlave(npt.beginToken, npt.endToken);
        if (npt.preposition !== null) 
            res.preposition = npt.preposition.normal;
        res.morph = npt.morph;
        res.source = npt;
        return res;
    }
    
    toString() {
        if (this.preposition !== null) 
            return (this.preposition + ": " + this.getSourceText());
        return this.getSourceText();
    }
    
    get hasPronoun() {
        let npt = Utils.as(this.source, NounPhraseToken);
        if (npt === null) 
            return false;
        for (const a of npt.adjectives) {
            if (a.beginToken.morph._class.isPronoun) 
                return true;
        }
        return false;
    }
}


module.exports = SemanticAbstractSlave