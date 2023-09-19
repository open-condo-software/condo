/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const MorphClass = require("./../../morph/MorphClass");
const MorphVoice = require("./../../morph/MorphVoice");
const MorphPerson = require("./../../morph/MorphPerson");
const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const MetaToken = require("./../MetaToken");
const MorphMiscInfo = require("./../../morph/MorphMiscInfo");
const MorphWordForm = require("./../../morph/MorphWordForm");
const MorphologyService = require("./../../morph/MorphologyService");
const TextToken = require("./../TextToken");

/**
 * Элемент глагольной группы VerbPhraseToken
 * Элемент глагольной группы
 */
class VerbPhraseItemToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.not = false;
        this.isAdverb = false;
        this.m_IsParticiple = -1;
        this.m_Normal = null;
        this.m_VerbMorph = null;
    }
    
    get isParticiple() {
        if (this.m_IsParticiple >= 0) 
            return this.m_IsParticiple > 0;
        for (const f of this.morph.items) {
            if (f._class.isAdjective && (f instanceof MorphWordForm) && !f.misc.attrs.includes("к.ф.")) 
                return true;
            else if (f._class.isVerb && !f._case.isUndefined) 
                return true;
        }
        this.m_IsParticiple = 0;
        let tt = Utils.as(this.endToken, TextToken);
        if (tt !== null && tt.term.endsWith("СЯ")) {
            try {
                let mb = MorphologyService.getWordBaseInfo(tt.term.substring(0, 0 + tt.term.length - 2), null, false, false);
                if (mb !== null) {
                    if (mb._class.isAdjective) 
                        this.m_IsParticiple = 1;
                }
            } catch (ex930) {
            }
        }
        return this.m_IsParticiple > 0;
    }
    set isParticiple(value) {
        this.m_IsParticiple = (value ? 1 : 0);
        return value;
    }
    
    get isDeeParticiple() {
        let tt = Utils.as(this.endToken, TextToken);
        if (tt === null) 
            return false;
        if (!tt.term.endsWith("Я") && !tt.term.endsWith("В")) 
            return false;
        if (tt.morph._class.isVerb && !tt.morph._class.isAdjective) {
            if (tt.morph.gender === MorphGender.UNDEFINED && tt.morph._case.isUndefined && tt.morph.number === MorphNumber.UNDEFINED) 
                return true;
        }
        return false;
    }
    
    get isVerbInfinitive() {
        for (const f of this.morph.items) {
            if (f._class.isVerb && (f instanceof MorphWordForm) && f.misc.attrs.includes("инф.")) 
                return true;
        }
        return false;
    }
    
    get isVerbBe() {
        let wf = this.verbMorph;
        if (wf !== null) {
            if (wf.normalCase === "БЫТЬ" || wf.normalCase === "ЯВЛЯТЬСЯ") 
                return true;
        }
        return false;
    }
    
    get isVerbReversive() {
        if (this.isVerbBe) 
            return false;
        if (this.verbMorph !== null) {
            if (this.verbMorph.containsAttr("возвр.", null)) 
                return true;
            if (this.verbMorph.normalCase !== null) {
                if (this.verbMorph.normalCase.endsWith("СЯ") || this.verbMorph.normalCase.endsWith("СЬ")) 
                    return true;
            }
        }
        return false;
    }
    
    get isVerbPassive() {
        if (this.isVerbBe) 
            return false;
        if (this.morph.containsAttr("страд.з", null)) 
            return true;
        if (this.verbMorph !== null) {
            if (this.verbMorph.misc.voice === MorphVoice.PASSIVE) 
                return true;
        }
        return false;
    }
    
    get normal() {
        let wf = this.verbMorph;
        if (wf !== null) {
            if (!wf._class.isAdjective && !wf._case.isUndefined && this.m_Normal !== null) 
                return this.m_Normal;
            if (wf._class.isAdjective && !wf._class.isVerb) 
                return (wf.normalFull != null ? wf.normalFull : wf.normalCase);
            return wf.normalCase;
        }
        return this.m_Normal;
    }
    set normal(value) {
        this.m_Normal = value;
        return value;
    }
    
    get verbMorph() {
        if (this.m_VerbMorph !== null) 
            return this.m_VerbMorph;
        for (const f of this.morph.items) {
            if (f._class.isVerb && (f instanceof MorphWordForm) && ((f.misc.person.value()) & (MorphPerson.THIRD.value())) !== (MorphPerson.UNDEFINED.value())) {
                if (f.normalCase.endsWith("СЯ")) 
                    return Utils.as(f, MorphWordForm);
            }
        }
        for (const f of this.morph.items) {
            if (f._class.isVerb && (f instanceof MorphWordForm) && ((f.misc.person.value()) & (MorphPerson.THIRD.value())) !== (MorphPerson.UNDEFINED.value())) 
                return Utils.as(f, MorphWordForm);
        }
        for (const f of this.morph.items) {
            if (f._class.isVerb && (f instanceof MorphWordForm)) 
                return Utils.as(f, MorphWordForm);
        }
        for (const f of this.morph.items) {
            if (f._class.isAdjective && (f instanceof MorphWordForm)) 
                return Utils.as(f, MorphWordForm);
        }
        if (this.m_Normal === "НЕТ") 
            return MorphWordForm._new931(MorphClass.VERB, new MorphMiscInfo());
        return null;
    }
    set verbMorph(value) {
        this.m_VerbMorph = value;
        return value;
    }
    
    toString() {
        return ((this.not ? "НЕ " : "")) + this.normal;
    }
    
    static _new927(_arg1, _arg2, _arg3) {
        let res = new VerbPhraseItemToken(_arg1, _arg2);
        res.morph = _arg3;
        return res;
    }
}


module.exports = VerbPhraseItemToken