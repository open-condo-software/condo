/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const GetTextAttr = require("./GetTextAttr");
const MorphNumber = require("./../../morph/MorphNumber");
const MorphGender = require("./../../morph/MorphGender");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const MorphologyService = require("./../../morph/MorphologyService");
const TextToken = require("./../TextToken");
const MiscHelper = require("./MiscHelper");
const MorphLang = require("./../../morph/MorphLang");
const MetaToken = require("./../MetaToken");
const ReferentToken = require("./../ReferentToken");
const MorphClass = require("./../../morph/MorphClass");
const NounPhraseItem = require("./internal/NounPhraseItem");
const NounPhraseItemTextVar = require("./internal/NounPhraseItemTextVar");
const NounPhraseMultivarToken = require("./NounPhraseMultivarToken");

/**
 * Метатокен - именная группа (это существительное с возможными прилагательными, морфологичски согласованными). 
 * Выделяется методом TryParse() класса NounPhraseHelper.
 * 
 * Именная группа
 */
class NounPhraseToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.noun = null;
        this.adjectives = new Array();
        this.adverbs = null;
        this.internalNoun = null;
        this.anafor = null;
        this.anaforaRef = null;
        this.preposition = null;
        this.multiNouns = false;
    }
    
    clone() {
        let res = new NounPhraseToken(this.beginToken, this.endToken);
        res.morph = this.morph.clone();
        res.chars = this.chars;
        if (this.noun instanceof NounPhraseItem) 
            res.noun = this.noun.clone();
        else 
            res.noun = this.noun;
        res.internalNoun = this.internalNoun;
        if (this.adverbs !== null) 
            res.adverbs = Array.from(this.adverbs);
        for (const a of this.adjectives) {
            if (a instanceof NounPhraseItem) 
                res.adjectives.push(a.clone());
            else 
                res.adjectives.push(a);
        }
        res.anafor = this.anafor;
        res.anaforaRef = this.anaforaRef;
        res.preposition = this.preposition;
        return res;
    }
    
    /**
     * Это если MultiNouns = true, то можно как бы расщепить на варианты 
     * (грузовой и легковой автомобили -> грузовой автомобиль и легковой автомобиль)
     * @return список NounPhraseMultivarToken
     */
    getMultivars() {
        let res = new Array();
        for (let i = 0; i < this.adjectives.length; i++) {
            let v = NounPhraseMultivarToken._new807(this.adjectives[i].beginToken, this.adjectives[i].endToken, this, i, i);
            for (; i < (this.adjectives.length - 1); i++) {
                if (this.adjectives[i + 1].beginToken === this.adjectives[i].endToken.next) {
                    v.endToken = this.adjectives[i + 1].endToken;
                    v.adjIndex2 = i + 1;
                }
                else 
                    break;
            }
            if (i === (this.adjectives.length - 1)) 
                v.endToken = this.endToken;
            res.push(v);
        }
        return res;
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        let res = new StringBuilder();
        if (gender === MorphGender.UNDEFINED) 
            gender = this.morph.gender;
        if (this.adverbs !== null && this.adverbs.length > 0) {
            let i = 0;
            if (this.adjectives.length > 0) {
                for (let j = 0; j < this.adjectives.length; j++) {
                    for (; i < this.adverbs.length; i++) {
                        if (this.adverbs[i].beginChar < this.adjectives[j].beginChar) 
                            res.append(this.adverbs[i].getNormalCaseText(MorphClass.ADVERB, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false)).append(" ");
                        else 
                            break;
                    }
                    let s = this.adjectives[j].getNormalCaseText(MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.PRONOUN), num, gender, keepChars);
                    res.append(((s != null ? s : "?"))).append(" ");
                }
            }
            for (; i < this.adverbs.length; i++) {
                res.append(this.adverbs[i].getNormalCaseText(MorphClass.ADVERB, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false)).append(" ");
            }
        }
        else 
            for (const t of this.adjectives) {
                let s = t.getNormalCaseText(MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.PRONOUN), num, gender, keepChars);
                res.append(((s != null ? s : "?"))).append(" ");
            }
        let r = null;
        if ((this.noun.beginToken instanceof ReferentToken) && this.noun.beginToken === this.noun.endToken) 
            r = this.noun.beginToken.getNormalCaseText(null, num, gender, keepChars);
        else {
            let cas = MorphClass.ooBitor(MorphClass.NOUN, MorphClass.PRONOUN);
            if (mc !== null && !mc.isUndefined) 
                cas = mc;
            r = this.noun.getNormalCaseText(cas, num, gender, keepChars);
        }
        if (r === null || r === "?") 
            r = this.noun.getNormalCaseText(null, num, MorphGender.UNDEFINED, false);
        res.append((r != null ? r : this.noun.toString()));
        return res.toString();
    }
    
    getNormalCaseTextWithoutAdjective(adjIndex) {
        let res = new StringBuilder();
        for (let i = 0; i < this.adjectives.length; i++) {
            if (i !== adjIndex) {
                let s = this.adjectives[i].getNormalCaseText(MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.PRONOUN), MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                res.append(((s != null ? s : "?"))).append(" ");
            }
        }
        let r = this.noun.getNormalCaseText(MorphClass.ooBitor(MorphClass.NOUN, MorphClass.PRONOUN), MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
        if (r === null) 
            r = this.noun.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
        res.append((r != null ? r : this.noun.toString()));
        return res.toString();
    }
    
    /**
     * Сгенерировать текст именной группы в нужном падеже и числе
     * @param cas нужный падеж
     * @param plural нужное число
     * @return результирующая строка
     */
    getMorphVariant(cas, plural) {
        let mi = MorphBaseInfo._new808(cas, MorphLang.RU);
        if (plural) 
            mi.number = MorphNumber.PLURAL;
        else 
            mi.number = MorphNumber.SINGULAR;
        let res = null;
        for (const a of this.adjectives) {
            let tt = MiscHelper.getTextValueOfMetaToken(a, GetTextAttr.NO);
            if (a.beginToken !== a.endToken || !(a.beginToken instanceof TextToken)) {
            }
            else {
                let tt2 = null;
                try {
                    tt2 = MorphologyService.getWordform(tt, mi);
                } catch (ex809) {
                }
                if (tt2 !== null) 
                    tt = tt2;
            }
            if (res === null) 
                res = tt;
            else 
                res = (res + " " + tt);
        }
        if (this.noun !== null) {
            let tt = MiscHelper.getTextValueOfMetaToken(this.noun, GetTextAttr.NO);
            if (this.noun.beginToken !== this.noun.endToken || !(this.noun.beginToken instanceof TextToken)) {
            }
            else {
                let tt2 = null;
                try {
                    tt2 = MorphologyService.getWordform(tt, mi);
                } catch (ex810) {
                }
                if (tt2 !== null) 
                    tt = tt2;
            }
            if (res === null) 
                res = tt;
            else 
                res = (res + " " + tt);
        }
        return res;
    }
    
    toString() {
        if (this.internalNoun === null) 
            return ((Utils.notNull(this.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), "?")) + " " + this.morph.toString());
        else 
            return ((Utils.notNull(this.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), "?")) + " " + this.morph.toString() + " / " + this.internalNoun.toString());
    }
    
    removeLastNounWord() {
        if (this.noun !== null) {
            for (const it of this.noun.morph.items) {
                let ii = Utils.as(it, NounPhraseItemTextVar);
                if (ii === null || ii.normalValue === null) 
                    continue;
                let j = ii.normalValue.indexOf('-');
                if (j > 0) 
                    ii.normalValue = ii.normalValue.substring(0, 0 + j);
                if (ii.singleNumberValue !== null) {
                    if ((((j = ii.singleNumberValue.indexOf('-')))) > 0) 
                        ii.singleNumberValue = ii.singleNumberValue.substring(0, 0 + j);
                }
            }
        }
    }
    
    static _new769(_arg1, _arg2, _arg3) {
        let res = new NounPhraseToken(_arg1, _arg2);
        res.preposition = _arg3;
        return res;
    }
}


module.exports = NounPhraseToken