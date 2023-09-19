/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const GetTextAttr = require("./GetTextAttr");
const MorphNumber = require("./../../morph/MorphNumber");
const MorphGender = require("./../../morph/MorphGender");
const MetaToken = require("./../MetaToken");
const MorphClass = require("./../../morph/MorphClass");
const ReferentToken = require("./../ReferentToken");
const MiscHelper = require("./MiscHelper");

/**
 * Вариант расщепления именной группы, у которой слиплись существительные. 
 * Получается методом GetMultivars() у NounPhraseToken, у которой MultiNouns = true.
 * Расщепление именной группы
 */
class NounPhraseMultivarToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.source = null;
        this.adjIndex1 = 0;
        this.adjIndex2 = 0;
    }
    
    toString() {
        return (String(this.source.adjectives[this.adjIndex1]) + " " + this.source.noun);
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        if (gender === MorphGender.UNDEFINED) 
            gender = this.source.morph.gender;
        let res = new StringBuilder();
        for (let k = this.adjIndex1; k <= this.adjIndex2; k++) {
            let adj = this.source.adjectives[k].getNormalCaseText(MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.PRONOUN), num, gender, keepChars);
            if (adj === null || adj === "?") 
                adj = MiscHelper.getTextValueOfMetaToken(this.source.adjectives[k], (keepChars ? GetTextAttr.KEEPREGISTER : GetTextAttr.NO));
            res.append(((adj != null ? adj : "?"))).append(" ");
        }
        let noun = null;
        if ((this.source.noun.beginToken instanceof ReferentToken) && this.source.beginToken === this.source.noun.endToken) 
            noun = this.source.noun.beginToken.getNormalCaseText(null, num, gender, keepChars);
        else {
            let cas = MorphClass.ooBitor(MorphClass.NOUN, MorphClass.PRONOUN);
            if (mc !== null && !mc.isUndefined) 
                cas = mc;
            noun = this.source.noun.getNormalCaseText(cas, num, gender, keepChars);
        }
        if (noun === null || noun === "?") 
            noun = this.source.noun.getNormalCaseText(null, num, MorphGender.UNDEFINED, false);
        res.append((noun != null ? noun : "?"));
        return res.toString();
    }
    
    static _new807(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new NounPhraseMultivarToken(_arg1, _arg2);
        res.source = _arg3;
        res.adjIndex1 = _arg4;
        res.adjIndex2 = _arg5;
        return res;
    }
}


module.exports = NounPhraseMultivarToken