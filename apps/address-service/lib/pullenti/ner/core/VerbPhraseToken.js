/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphNumber = require("./../../morph/MorphNumber");
const MorphGender = require("./../../morph/MorphGender");
const MetaToken = require("./../MetaToken");
const MorphVoice = require("./../../morph/MorphVoice");
const MorphClass = require("./../../morph/MorphClass");

/**
 * Метатокен - глагольная группа (последовательность глаголов, наречий и причастий). 
 * Создаётся методом VerbPhraseHelper.TryParse.
 * Глагольная группа
 */
class VerbPhraseToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.items = new Array();
        this.preposition = null;
    }
    
    get firstVerb() {
        for (const it of this.items) {
            if (!it.isAdverb) 
                return it;
        }
        return null;
    }
    
    get lastVerb() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (!this.items[i].isAdverb) 
                return this.items[i];
        }
        return null;
    }
    
    get isVerbPassive() {
        let fi = this.firstVerb;
        if (fi === null || fi.verbMorph === null) 
            return false;
        return fi.verbMorph.misc.voice === MorphVoice.PASSIVE;
    }
    
    mergeWith(v) {
        this.items.splice(this.items.length, 0, ...v.items);
        this.endToken = v.endToken;
    }
    
    toString() {
        if (this.items.length === 1) 
            return (this.items[0].toString() + ", " + this.morph.toString());
        let tmp = new StringBuilder();
        for (const it of this.items) {
            if (tmp.length > 0) 
                tmp.append(' ');
            tmp.append(it);
        }
        tmp.append(", ").append(this.morph.toString());
        return tmp.toString();
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        return super.getNormalCaseText(MorphClass.VERB, num, gender, keepChars);
    }
}


module.exports = VerbPhraseToken