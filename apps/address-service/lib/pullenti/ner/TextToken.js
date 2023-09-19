/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../unisharp/StringBuilder");

const MorphClass = require("./../morph/MorphClass");
const MorphGender = require("./../morph/MorphGender");
const LanguageHelper = require("./../morph/LanguageHelper");
const MorphNumber = require("./../morph/MorphNumber");
const MorphBaseInfo = require("./../morph/MorphBaseInfo");
const MorphWordForm = require("./../morph/MorphWordForm");
const MorphologyService = require("./../morph/MorphologyService");
const MorphCollection = require("./MorphCollection");
const Token = require("./Token");

/**
 * Входной токен (после морфанализа)
 * Текстовой токен
 */
class TextToken extends Token {
    
    constructor(source, _kit, bchar = -1, echar = -1) {
        super(_kit, (bchar >= 0 ? bchar : (source === null ? 0 : source.beginChar)), (echar >= 0 ? echar : (source === null ? 0 : source.endChar)));
        this.term = null;
        this.lemma = null;
        this.term0 = null;
        this.invariantPrefixLengthOfMorphVars = 0;
        this.maxLengthOfMorphVars = 0;
        this.npt = null;
        this.noNpt = false;
        if (source === null) 
            return;
        this.chars = source.charInfo;
        this.term = source.term;
        this.lemma = Utils.notNull(source.getLemma(), this.term);
        this.maxLengthOfMorphVars = this.term.length;
        this.morph = new MorphCollection();
        if (source.wordForms !== null) {
            for (const wf of source.wordForms) {
                this.morph.addItem(wf);
                if (wf.normalCase !== null && (this.maxLengthOfMorphVars < wf.normalCase.length)) 
                    this.maxLengthOfMorphVars = wf.normalCase.length;
                if (wf.normalFull !== null && (this.maxLengthOfMorphVars < wf.normalFull.length)) 
                    this.maxLengthOfMorphVars = wf.normalFull.length;
            }
        }
        for (let i = 0; i < this.term.length; i++) {
            let ch = this.term[i];
            let j = 0;
            for (j = 0; j < this.morph.itemsCount; j++) {
                let wf = Utils.as(this.morph.getIndexerItem(j), MorphWordForm);
                if (wf.normalCase !== null) {
                    if (i >= wf.normalCase.length) 
                        break;
                    if (wf.normalCase[i] !== ch) 
                        break;
                }
                if (wf.normalFull !== null) {
                    if (i >= wf.normalFull.length) 
                        break;
                    if (wf.normalFull[i] !== ch) 
                        break;
                }
            }
            if (j < this.morph.itemsCount) 
                break;
            if ((i + 2) === this.term.length) {
                if ((this.term.endsWith("ИХ") || this.term.endsWith("ЫХ") || this.term.endsWith("ОВ")) || this.term.endsWith("ОМ")) 
                    break;
            }
            this.invariantPrefixLengthOfMorphVars = (i + 1);
        }
        if (this.morph.language.isUndefined && !source.language.isUndefined) 
            this.morph.language = source.language;
    }
    
    toString() {
        let res = new StringBuilder(this.term);
        for (const l of this.morph.items) {
            res.append(", ").append(l.toString());
        }
        return res.toString();
    }
    
    /**
     * Попробовать привязать словарь
     * @param dict 
     * @return 
     */
    checkValue(dict) {
        if (dict === null) 
            return null;
        let res = null;
        let wrapres2961 = new RefOutArgWrapper();
        let inoutres2962 = dict.tryGetValue(this.term, wrapres2961);
        res = wrapres2961.value;
        if (inoutres2962) 
            return res;
        if (this.morph !== null) {
            for (const it of this.morph.items) {
                let mf = Utils.as(it, MorphWordForm);
                if (mf !== null) {
                    if (mf.normalCase !== null) {
                        let wrapres2957 = new RefOutArgWrapper();
                        let inoutres2958 = dict.tryGetValue(mf.normalCase, wrapres2957);
                        res = wrapres2957.value;
                        if (inoutres2958) 
                            return res;
                    }
                    if (mf.normalFull !== null && mf.normalCase !== mf.normalFull) {
                        let wrapres2959 = new RefOutArgWrapper();
                        let inoutres2960 = dict.tryGetValue(mf.normalFull, wrapres2959);
                        res = wrapres2959.value;
                        if (inoutres2960) 
                            return res;
                    }
                }
            }
        }
        return null;
    }
    
    getSourceText() {
        return super.getSourceText();
    }
    
    isValue(_term, termUA = null) {
        if (termUA !== null && this.morph.language.isUa) {
            if (this.isValue(termUA, null)) 
                return true;
        }
        if (_term === null) 
            return false;
        if (this.invariantPrefixLengthOfMorphVars > _term.length) 
            return false;
        if (this.maxLengthOfMorphVars >= this.term.length && (this.maxLengthOfMorphVars < _term.length)) 
            return false;
        if (_term === this.term || _term === this.term0) 
            return true;
        for (const wf of this.morph.items) {
            if ((wf instanceof MorphWordForm) && ((wf.normalCase === _term || wf.normalFull === _term))) 
                return true;
        }
        return false;
    }
    
    get isAnd() {
        if (!this.morph._class.isConjunction) {
            if (this.lengthChar === 1 && this.isChar('&')) 
                return true;
            return false;
        }
        let val = this.term;
        if (val === "И" || val === "AND" || val === "UND") 
            return true;
        if (this.morph.language.isUa) {
            if (val === "І" || val === "ТА") 
                return true;
        }
        return false;
    }
    
    get isOr() {
        if (!this.morph._class.isConjunction) 
            return false;
        let val = this.term;
        if (val === "ИЛИ" || val === "ЛИБО" || val === "OR") 
            return true;
        if (this.morph.language.isUa) {
            if (val === "АБО") 
                return true;
        }
        return false;
    }
    
    get isLetters() {
        return Utils.isLetter(this.term[0]);
    }
    
    getMorphClassInDictionary() {
        let res = new MorphClass();
        for (const wf of this.morph.items) {
            if ((wf instanceof MorphWordForm) && wf.isInDictionary) 
                res = MorphClass.ooBitor(res, wf._class);
        }
        return res;
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        const MiscHelper = require("./core/MiscHelper");
        let empty = true;
        if (mc !== null && mc.isPreposition) 
            return LanguageHelper.normalizePreposition(this.term);
        for (const it of this.morph.items) {
            if (mc !== null && !mc.isUndefined) {
                let cc = MorphClass.ooBitand(it._class, mc);
                if (cc.isUndefined) 
                    continue;
                if (cc.isMisc && !cc.isProper && mc !== it._class) 
                    continue;
            }
            let wf = Utils.as(it, MorphWordForm);
            let normalFull = false;
            if (gender !== MorphGender.UNDEFINED) {
                if (((it.gender.value()) & (gender.value())) === (MorphGender.UNDEFINED.value())) {
                    if ((gender === MorphGender.MASCULINE && ((it.gender !== MorphGender.UNDEFINED || it.number === MorphNumber.PLURAL)) && wf !== null) && wf.normalFull !== null) 
                        normalFull = true;
                    else if (gender === MorphGender.MASCULINE && it._class.isPersonalPronoun) {
                    }
                    else 
                        continue;
                }
            }
            if (!it._case.isUndefined) 
                empty = false;
            if (wf !== null) {
                let res = null;
                if (num === MorphNumber.SINGULAR && it.number === MorphNumber.PLURAL && wf.normalFull !== null) {
                    let le = wf.normalCase.length;
                    if ((le === (wf.normalFull.length + 2) && le > 4 && wf.normalCase[le - 2] === 'С') && wf.normalCase[le - 1] === 'Я') 
                        res = wf.normalCase;
                    else 
                        res = (normalFull ? wf.normalFull : wf.normalFull);
                }
                else 
                    res = (normalFull ? wf.normalFull : ((wf.normalCase != null ? wf.normalCase : this.term)));
                if (num === MorphNumber.SINGULAR && mc !== null && mc.equals(MorphClass.NOUN)) {
                    if (res === "ДЕТИ") 
                        res = "РЕБЕНОК";
                }
                if (keepChars) {
                    if (this.chars.isAllLower) 
                        res = res.toLowerCase();
                    else if (this.chars.isCapitalUpper) 
                        res = MiscHelper.convertFirstCharUpperAndOtherLower(res);
                }
                return res;
            }
        }
        if (!empty) 
            return null;
        let te = null;
        if (num === MorphNumber.SINGULAR && mc !== null) {
            let bi = MorphBaseInfo._new795(MorphClass._new266(mc.value), gender, MorphNumber.SINGULAR, this.morph.language);
            let vars = null;
            try {
                vars = MorphologyService.getWordform(this.term, bi);
            } catch (ex2965) {
            }
            if (vars !== null) 
                te = vars;
        }
        if (te === null) 
            te = this.term;
        if (keepChars) {
            if (this.chars.isAllLower) 
                return te.toLowerCase();
            else if (this.chars.isCapitalUpper) 
                return MiscHelper.convertFirstCharUpperAndOtherLower(te);
        }
        return te;
    }
    
    static getSourceTextTokens(begin, end) {
        const MetaToken = require("./MetaToken");
        let res = new Array();
        for (let t = begin; t !== null && t !== end.next && t.endChar <= end.endChar; t = t.next) {
            if (t instanceof TextToken) 
                res.push(Utils.as(t, TextToken));
            else if (t instanceof MetaToken) 
                res.splice(res.length, 0, ...TextToken.getSourceTextTokens(t.beginToken, t.endToken));
        }
        return res;
    }
    
    get isPureVerb() {
        let ret = false;
        if ((this.isValue("МОЖНО", null) || this.isValue("МОЖЕТ", null) || this.isValue("ДОЛЖНЫЙ", null)) || this.isValue("НУЖНО", null)) 
            return true;
        for (const it of this.morph.items) {
            if ((it instanceof MorphWordForm) && it.isInDictionary) {
                if (it._class.isVerb && it._case.isUndefined) 
                    ret = true;
                else if (!it._class.isVerb) {
                    if (it._class.isAdjective && it.containsAttr("к.ф.", null)) {
                    }
                    else 
                        return false;
                }
            }
        }
        return ret;
    }
    
    get isVerbBe() {
        if ((this.isValue("БЫТЬ", null) || this.isValue("ЕСТЬ", null) || this.isValue("ЯВЛЯТЬ", null)) || this.isValue("BE", null)) 
            return true;
        if (this.term === "IS" || this.term === "WAS" || this.term === "BECAME") 
            return true;
        if (this.term === "Є") 
            return true;
        return false;
    }
    
    serialize(stream) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        super.serialize(stream);
        SerializerHelper.serializeString(stream, this.term);
        SerializerHelper.serializeString(stream, this.lemma);
        SerializerHelper.serializeShort(stream, this.invariantPrefixLengthOfMorphVars);
        SerializerHelper.serializeShort(stream, this.maxLengthOfMorphVars);
    }
    
    deserialize(stream, _kit, vers) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        super.deserialize(stream, _kit, vers);
        this.term = SerializerHelper.deserializeString(stream);
        this.lemma = SerializerHelper.deserializeString(stream);
        this.invariantPrefixLengthOfMorphVars = SerializerHelper.deserializeShort(stream);
        this.maxLengthOfMorphVars = SerializerHelper.deserializeShort(stream);
    }
    
    static _new773(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TextToken(_arg1, _arg2, _arg3, _arg4);
        res.term0 = _arg5;
        return res;
    }
    
    static _new776(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new TextToken(_arg1, _arg2, _arg3, _arg4);
        res.chars = _arg5;
        res.term0 = _arg6;
        return res;
    }
}


module.exports = TextToken