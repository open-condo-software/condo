/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const MorphGender = require("./../../../morph/MorphGender");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const MorphNumber = require("./../../../morph/MorphNumber");
const MorphClass = require("./../../../morph/MorphClass");
const MorphologyService = require("./../../../morph/MorphologyService");
const GetTextAttr = require("./../GetTextAttr");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const NounPhraseParseAttr = require("./../NounPhraseParseAttr");
const MetaToken = require("./../../MetaToken");
const MorphCollection = require("./../../MorphCollection");
const TextToken = require("./../../TextToken");
const NumberToken = require("./../../NumberToken");
const TerminParseAttr = require("./../TerminParseAttr");
const ReferentToken = require("./../../ReferentToken");
const MiscHelper = require("./../MiscHelper");
const MorphCase = require("./../../../morph/MorphCase");
const Termin = require("./../Termin");
const TerminCollection = require("./../TerminCollection");
const NumberHelper = require("./../NumberHelper");
const NounPhraseItemTextVar = require("./NounPhraseItemTextVar");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const NounPhraseHelper = require("./../NounPhraseHelper");

// Элемент именной группы
class NounPhraseItem extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.conjBefore = false;
        this.adjMorph = new Array();
        this.canBeAdj = false;
        this.nounMorph = new Array();
        this.canBeNoun = false;
        this.multiNouns = false;
        this.canBeSurname = false;
        this.isStdAdjective = false;
        this.isDoubtAdjective = false;
    }
    
    clone() {
        let res = new NounPhraseItem(this.beginToken, this.endToken);
        res.morph = this.morph.clone();
        res.conjBefore = this.conjBefore;
        res.canBeAdj = this.canBeAdj;
        res.canBeNoun = this.canBeNoun;
        res.multiNouns = this.multiNouns;
        res.canBeSurname = this.canBeSurname;
        res.isStdAdjective = this.isStdAdjective;
        res.isDoubtAdjective = this.isDoubtAdjective;
        res.adjMorph.splice(res.adjMorph.length, 0, ...this.adjMorph);
        res.nounMorph.splice(res.nounMorph.length, 0, ...this.nounMorph);
        return res;
    }
    
    get canBeNumericAdj() {
        let num = Utils.as(this.beginToken, NumberToken);
        if (num !== null) {
            if (num.intValue !== null && num.intValue > 1) 
                return true;
            else 
                return false;
        }
        if ((this.beginToken.isValue("НЕСКОЛЬКО", null) || this.beginToken.isValue("МНОГО", null) || this.beginToken.isValue("ПАРА", null)) || this.beginToken.isValue("ПОЛТОРА", null)) 
            return true;
        return false;
    }
    
    get isPronoun() {
        return this.beginToken.morph._class.isPronoun;
    }
    
    get isPersonalPronoun() {
        return this.beginToken.morph._class.isPersonalPronoun;
    }
    
    get isVerb() {
        return this.beginToken.morph._class.isVerb;
    }
    
    get isAdverb() {
        return this.beginToken.morph._class.isAdverb;
    }
    
    get canBeAdjForPersonalPronoun() {
        if (this.isPronoun && this.canBeAdj) {
            if (this.beginToken.isValue("ВСЕ", null) || this.beginToken.isValue("ВЕСЬ", null) || this.beginToken.isValue("САМ", null)) 
                return true;
        }
        return false;
    }
    
    _corrChars(str, keep) {
        if (!keep) 
            return str;
        if (this.chars.isAllLower) 
            return str.toLowerCase();
        if (this.chars.isCapitalUpper) 
            return MiscHelper.convertFirstCharUpperAndOtherLower(str);
        return str;
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        if ((this.beginToken instanceof ReferentToken) && this.beginToken === this.endToken) 
            return this.beginToken.getNormalCaseText(mc, num, gender, keepChars);
        let res = null;
        let maxCoef = 0;
        let defCoef = -1;
        for (const it of this.morph.items) {
            let v = Utils.as(it, NounPhraseItemTextVar);
            if (v === null) 
                continue;
            if (v.undefCoef > 0 && (((v.undefCoef < maxCoef) || defCoef >= 0))) 
                continue;
            if (num === MorphNumber.SINGULAR && v.singleNumberValue !== null) {
                if (mc !== null && ((gender === MorphGender.NEUTER || gender === MorphGender.FEMINIE)) && mc.isAdjective) {
                    let bi = MorphBaseInfo._new703(MorphClass._new266(mc.value), gender, MorphNumber.SINGULAR, MorphCase.NOMINATIVE, this.morph.language);
                    let str = null;
                    try {
                        str = MorphologyService.getWordform(v.singleNumberValue, bi);
                    } catch (ex704) {
                    }
                    if (str !== null) 
                        res = str;
                }
                else 
                    res = v.singleNumberValue;
                if (v.undefCoef === 0) 
                    break;
                maxCoef = v.undefCoef;
                continue;
            }
            if (Utils.isNullOrEmpty(v.normalValue)) 
                continue;
            if (Utils.isDigit(v.normalValue[0]) && mc !== null && mc.isAdjective) {
                let val = 0;
                let wrapval705 = new RefOutArgWrapper();
                let inoutres706 = Utils.tryParseInt(v.normalValue, wrapval705);
                val = wrapval705.value;
                if (inoutres706) {
                    let str = NumberHelper.getNumberAdjective(val, gender, (num === MorphNumber.SINGULAR || val === 1 ? MorphNumber.SINGULAR : MorphNumber.PLURAL));
                    if (str !== null) {
                        res = str;
                        if (v.undefCoef === 0) 
                            break;
                        maxCoef = v.undefCoef;
                        continue;
                    }
                }
            }
            let res1 = it.normalValue;
            if (this.beginToken !== this.endToken && this.endToken.isValue(res1, null)) 
                res1 = MiscHelper.getTextValue(this.beginToken, this.endToken.previous, GetTextAttr.NO) + res1;
            if (num === MorphNumber.SINGULAR) {
                if (res1 === "ДЕТИ") 
                    res1 = "РЕБЕНОК";
                else if (res1 === "ЛЮДИ") 
                    res1 = "ЧЕЛОВЕК";
            }
            maxCoef = v.undefCoef;
            if (v.undefCoef > 0) {
                res = res1;
                continue;
            }
            let defCo = 0;
            if (mc !== null && mc.isAdjective && v.undefCoef === 0) {
            }
            else if (((this.beginToken instanceof TextToken) && res1 === this.beginToken.term && it._case.isNominative) && it.number === MorphNumber.SINGULAR) 
                defCo = 1;
            if (num === MorphNumber.PLURAL && ((v.number.value()) & (MorphNumber.PLURAL.value())) === (MorphNumber.PLURAL.value())) 
                defCo += 3;
            if (res === null || defCo > defCoef) {
                res = res1;
                defCoef = defCo;
                if (defCo > 0) 
                    break;
            }
        }
        if (res !== null) 
            return this._corrChars(res, keepChars);
        if (res === null && this.beginToken === this.endToken) 
            res = this.beginToken.getNormalCaseText(mc, num, gender, keepChars);
        else if (res === null) {
            res = this.beginToken.getNormalCaseText(mc, num, gender, keepChars);
            if (res === null) 
                res = MiscHelper.getTextValueOfMetaToken(this, (keepChars ? GetTextAttr.KEEPREGISTER : GetTextAttr.NO));
            else 
                res = (res + " " + MiscHelper.getTextValue(this.beginToken.next, this.endToken, (keepChars ? GetTextAttr.KEEPREGISTER : GetTextAttr.NO)));
        }
        return (res != null ? res : "?");
    }
    
    isValue(term, term2 = null) {
        if (this.beginToken !== null) 
            return this.beginToken.isValue(term, term2);
        else 
            return false;
    }
    
    static tryParse(t, items, attrs) {
        if (t === null) 
            return null;
        let t0 = t;
        let _canBeSurname = false;
        let _isDoubtAdj = false;
        let rt = Utils.as(t, ReferentToken);
        if (rt !== null && rt.beginToken === rt.endToken && (rt.beginToken instanceof TextToken)) {
            let res = NounPhraseItem.tryParse(rt.beginToken, items, attrs);
            if (res !== null) {
                res.beginToken = res.endToken = t;
                res.canBeNoun = true;
                return res;
            }
        }
        if (rt !== null) {
            let res = new NounPhraseItem(t, t);
            for (const m of t.morph.items) {
                let v = new NounPhraseItemTextVar(m, null);
                v.normalValue = t.getReferent().toString();
                res.nounMorph.push(v);
            }
            res.canBeNoun = true;
            return res;
        }
        if (t instanceof NumberToken) {
        }
        let hasLegalVerb = false;
        if (t instanceof TextToken) {
            if (!t.chars.isLetter) 
                return null;
            let str = t.term;
            if (str[str.length - 1] === 'А' || str[str.length - 1] === 'О') {
                for (const wf of t.morph.items) {
                    if ((wf instanceof MorphWordForm) && wf.isInDictionary) {
                        if (wf._class.isVerb) {
                            let mc = t.getMorphClassInDictionary();
                            if (!mc.isNoun && (((attrs.value()) & (NounPhraseParseAttr.IGNOREPARTICIPLES.value()))) === (NounPhraseParseAttr.NO.value())) {
                                if (!LanguageHelper.endsWithEx(str, "ОГО", "ЕГО", null, null)) 
                                    return null;
                            }
                            hasLegalVerb = true;
                        }
                        if (wf._class.isAdverb) {
                            if (t.next === null || !t.next.isHiphen) {
                                if ((str === "ВСЕГО" || str === "ДОМА" || str === "НЕСКОЛЬКО") || str === "МНОГО" || str === "ПОРЯДКА") {
                                }
                                else 
                                    return null;
                            }
                        }
                        if (wf._class.isAdjective) {
                            if (wf.containsAttr("к.ф.", null)) {
                                if (t.getMorphClassInDictionary().equals(MorphClass.ADJECTIVE) && !t.morph.containsAttr("неизм.", null)) {
                                }
                                else 
                                    _isDoubtAdj = true;
                            }
                        }
                    }
                }
            }
            let mc0 = t.morph._class;
            if (mc0.isProperSurname && !t.chars.isAllLower) {
                for (const wf of t.morph.items) {
                    if (wf._class.isProperSurname && wf.number !== MorphNumber.PLURAL) {
                        let wff = Utils.as(wf, MorphWordForm);
                        if (wff === null) 
                            continue;
                        let s = Utils.notNull(((wff.normalFull != null ? wff.normalFull : wff.normalCase)), "");
                        if (LanguageHelper.endsWithEx(s, "ИН", "ЕН", "ЫН", null)) {
                            if (!wff.isInDictionary) 
                                _canBeSurname = true;
                            else 
                                return null;
                        }
                        if (wff.isInDictionary && LanguageHelper.endsWith(s, "ОВ")) 
                            _canBeSurname = true;
                    }
                }
            }
            if (mc0.isProperName && !t.chars.isAllLower) {
                for (const wff of t.morph.items) {
                    let wf = Utils.as(wff, MorphWordForm);
                    if (wf === null) 
                        continue;
                    if (wf.normalCase === "ГОР" || wf.normalCase === "ГОРЫ" || wf.normalCase === "ПОЛ") 
                        continue;
                    if (wf._class.isProperName && wf.isInDictionary) {
                        if (wf.normalCase === null || !wf.normalCase.startsWith("ЛЮБ")) {
                            if (mc0.isAdjective && t.morph.containsAttr("неизм.", null)) {
                            }
                            else if ((((attrs.value()) & (NounPhraseParseAttr.REFERENTCANBENOUN.value()))) === (NounPhraseParseAttr.REFERENTCANBENOUN.value())) {
                            }
                            else if (t.isValue("ПОЛЕ", null)) {
                            }
                            else {
                                if (items === null || (items.length < 1)) 
                                    return null;
                                if (!items[0].isStdAdjective) 
                                    return null;
                            }
                        }
                    }
                }
            }
            if (mc0.isAdjective && t.morph.itemsCount === 1) {
                if (t.morph.getIndexerItem(0).containsAttr("в.ср.ст.", null)) 
                    return null;
            }
            let mc1 = t.getMorphClassInDictionary();
            if (mc1.equals(MorphClass.VERB) && t.morph._case.isUndefined) 
                return null;
            if (((((attrs.value()) & (NounPhraseParseAttr.IGNOREPARTICIPLES.value()))) === (NounPhraseParseAttr.IGNOREPARTICIPLES.value()) && t.morph._class.isVerb && !t.morph._class.isNoun) && !t.morph._class.isProper) {
                for (const wf of t.morph.items) {
                    if (wf._class.isVerb) {
                        if (wf.containsAttr("дейст.з.", null)) {
                            if (LanguageHelper.endsWith(t.term, "СЯ")) {
                            }
                            else 
                                return null;
                        }
                    }
                }
            }
        }
        let t1 = null;
        for (let k = 0; k < 2; k++) {
            t = (t1 != null ? t1 : t0);
            if (k === 0) {
                if (((t0 instanceof TextToken) && t0.next !== null && t0.next.isHiphen) && t0.next.next !== null && t0.chars.isCyrillicLetter === t0.next.next.chars.isCyrillicLetter) {
                    if (!t0.isWhitespaceAfter && !t0.morph._class.isPronoun && !(t0.next.next instanceof NumberToken)) {
                        if (!t0.next.isWhitespaceAfter) 
                            t = t0.next.next;
                        else if (t0.next.next.chars.isAllLower && LanguageHelper.endsWith(t0.term, "О")) 
                            t = t0.next.next;
                    }
                }
            }
            let it = NounPhraseItem._new707(t0, t, _canBeSurname);
            if (t0 === t && (t0 instanceof ReferentToken)) {
                it.canBeNoun = true;
                it.morph = new MorphCollection(t0.morph);
            }
            let canBePrepos = false;
            for (const v of t.morph.items) {
                let wf = Utils.as(v, MorphWordForm);
                if (v._class.isVerb && !v._case.isUndefined) {
                    it.canBeAdj = true;
                    it.adjMorph.push(new NounPhraseItemTextVar(v, t));
                    continue;
                }
                if (v._class.isPreposition) 
                    canBePrepos = true;
                if (v._class.isAdjective || ((v._class.isPronoun && !v._class.isPersonalPronoun && !v.containsAttr("неизм.", null))) || ((v._class.isNoun && (t instanceof NumberToken)))) {
                    if (NounPhraseItem.tryAccordVariant(items, (items === null ? 0 : items.length), v, false)) {
                        let isDoub = false;
                        if (v.containsAttr("к.ф.", null)) 
                            continue;
                        if (v.containsAttr("неизм.", null)) 
                            continue;
                        if (v.containsAttr("собир.", null) && !(t instanceof NumberToken)) {
                            if (wf !== null && wf.isInDictionary) 
                                return null;
                            continue;
                        }
                        if (v.containsAttr("сравн.", null)) 
                            continue;
                        let ok = true;
                        if (t instanceof TextToken) {
                            let s = t.term;
                            if (s === "ПРАВО" || s === "ПРАВА") 
                                ok = false;
                            else if (LanguageHelper.endsWith(s, "ОВ") && t.getMorphClassInDictionary().isNoun) 
                                ok = false;
                        }
                        else if (t instanceof NumberToken) {
                            if (v._class.isNoun && t.morph._class.isAdjective) 
                                ok = false;
                            else if (t.morph._class.isNoun && (((attrs.value()) & (NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()))) === (NounPhraseParseAttr.NO.value())) 
                                ok = false;
                        }
                        if (ok) {
                            it.adjMorph.push(new NounPhraseItemTextVar(v, t));
                            it.canBeAdj = true;
                            if (_isDoubtAdj && t0 === t) 
                                it.isDoubtAdjective = true;
                            if (hasLegalVerb && wf !== null && wf.isInDictionary) 
                                it.canBeNoun = true;
                            if (wf !== null && wf._class.isPronoun) {
                                it.canBeNoun = true;
                                it.nounMorph.push(new NounPhraseItemTextVar(v, t));
                            }
                        }
                    }
                }
                let _canBeNoun = false;
                if (t instanceof NumberToken) {
                }
                else if (v._class.isNoun || ((wf !== null && wf.normalCase === "САМ"))) 
                    _canBeNoun = true;
                else if (v._class.isPersonalPronoun) {
                    if (items === null || items.length === 0) 
                        _canBeNoun = true;
                    else {
                        for (const it1 of items) {
                            if (it1.isVerb) {
                                if (items.length === 1 && !v._case.isNominative) 
                                    _canBeNoun = true;
                                else 
                                    return null;
                            }
                        }
                        if (items.length === 1) {
                            if (items[0].canBeAdjForPersonalPronoun) 
                                _canBeNoun = true;
                        }
                    }
                }
                else if ((v._class.isPronoun && ((items === null || items.length === 0 || ((items.length === 1 && items[0].canBeAdjForPersonalPronoun)))) && wf !== null) && (((((wf.normalCase === "ТОТ" || wf.normalFull === "ТО" || wf.normalCase === "ТО") || wf.normalCase === "ЭТО" || wf.normalCase === "ВСЕ") || wf.normalCase === "ЧТО" || wf.normalCase === "КТО") || wf.normalFull === "КОТОРЫЙ" || wf.normalCase === "КОТОРЫЙ"))) {
                    if (wf.normalCase === "ВСЕ") {
                        if (t.next !== null && t.next.isValue("РАВНО", null)) 
                            return null;
                    }
                    _canBeNoun = true;
                }
                else if (wf !== null && (((wf.normalFull != null ? wf.normalFull : wf.normalCase))) === "КОТОРЫЙ" && (((attrs.value()) & (NounPhraseParseAttr.PARSEPRONOUNS.value()))) === (NounPhraseParseAttr.NO.value())) 
                    return null;
                else if (v._class.isProper && (t instanceof TextToken)) {
                    if (t.lengthChar > 4 || v._class.isProperName) 
                        _canBeNoun = true;
                }
                if (_canBeNoun) {
                    let added = false;
                    if (items !== null && items.length > 1 && (((attrs.value()) & (NounPhraseParseAttr.MULTINOUNS.value()))) !== (NounPhraseParseAttr.NO.value())) {
                        let ok1 = true;
                        for (let ii = 1; ii < items.length; ii++) {
                            if (!items[ii].conjBefore) {
                                ok1 = false;
                                break;
                            }
                        }
                        if (ok1) {
                            if (NounPhraseItem.tryAccordVariant(items, (items === null ? 0 : items.length), v, true)) {
                                it.nounMorph.push(new NounPhraseItemTextVar(v, t));
                                it.canBeNoun = true;
                                it.multiNouns = true;
                                added = true;
                            }
                        }
                    }
                    if (!added) {
                        if (NounPhraseItem.tryAccordVariant(items, (items === null ? 0 : items.length), v, false)) {
                            it.nounMorph.push(new NounPhraseItemTextVar(v, t));
                            it.canBeNoun = true;
                            if (v._class.isPersonalPronoun && t.morph.containsAttr("неизм.", null) && !it.canBeAdj) {
                                let itt = new NounPhraseItemTextVar(v, t);
                                itt._case = MorphCase.ALL_CASES;
                                itt.number = MorphNumber.UNDEFINED;
                                if (itt.normalValue === null) {
                                }
                                it.adjMorph.push(itt);
                                it.canBeAdj = true;
                            }
                        }
                        else if ((items.length > 0 && items[0].adjMorph.length > 0 && items[0].adjMorph[0].number === MorphNumber.PLURAL) && !(MorphCase.ooBitand(items[0].adjMorph[0]._case, v._case)).isUndefined && !items[0].adjMorph[0]._class.isVerb) {
                            if (t.next !== null && t.next.isCommaAnd && (t.next.next instanceof TextToken)) {
                                let npt2 = NounPhraseHelper.tryParse(t.next.next, attrs, 0, null);
                                if (npt2 !== null && npt2.preposition === null && !(MorphCase.ooBitand(npt2.morph._case, MorphCase.ooBitand(v._case, items[0].adjMorph[0]._case))).isUndefined) {
                                    it.nounMorph.push(new NounPhraseItemTextVar(v, t));
                                    it.canBeNoun = true;
                                }
                            }
                        }
                        else if ((((attrs.value()) & (NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()))) !== (NounPhraseParseAttr.NO.value()) && items.length > 0 && (((items[0].beginToken instanceof NumberToken) || (items[items.length - 1].beginToken instanceof NumberToken)))) {
                            it.nounMorph.push(new NounPhraseItemTextVar(v, t));
                            it.canBeNoun = true;
                        }
                    }
                }
            }
            if (t0 !== t) {
                for (const v of it.adjMorph) {
                    v.correctPrefix(Utils.as(t0, TextToken), false);
                }
                for (const v of it.nounMorph) {
                    v.correctPrefix(Utils.as(t0, TextToken), true);
                }
            }
            if (k === 1 && it.canBeNoun && !it.canBeAdj) {
                if (t1 !== null) 
                    it.endToken = t1;
                else 
                    it.endToken = t0.next.next;
                for (const v of it.nounMorph) {
                    if (v.normalValue !== null && (v.normalValue.indexOf('-') < 0)) 
                        v.normalValue = (v.normalValue + "-" + it.endToken.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
                }
            }
            if (it.canBeAdj) {
                if (NounPhraseItem.m_StdAdjectives.tryParse(it.beginToken, TerminParseAttr.NO) !== null) 
                    it.isStdAdjective = true;
            }
            if (canBePrepos && it.canBeNoun) {
                if (items !== null && items.length > 0) {
                    let npt1 = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSEPREPOSITION.value()) | (NounPhraseParseAttr.PARSEPRONOUNS.value()) | (NounPhraseParseAttr.PARSEVERBS.value())), 0, null);
                    if (npt1 !== null && npt1.endChar > t.endChar) 
                        return null;
                }
                else {
                    let npt1 = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSEPRONOUNS.value()) | (NounPhraseParseAttr.PARSEVERBS.value())), 0, null);
                    if (npt1 !== null) {
                        let mc = LanguageHelper.getCaseAfterPreposition(t.lemma);
                        if (!(MorphCase.ooBitand(mc, npt1.morph._case)).isUndefined) 
                            return null;
                    }
                }
            }
            if (it.canBeNoun || it.canBeAdj || k === 1) {
                if (it.beginToken.morph._class.isPronoun) {
                    let tt2 = it.endToken.next;
                    if ((tt2 !== null && tt2.isHiphen && !tt2.isWhitespaceAfter) && !tt2.isWhitespaceBefore) 
                        tt2 = tt2.next;
                    if (tt2 instanceof TextToken) {
                        let ss = tt2.term;
                        if ((ss === "ЖЕ" || ss === "БЫ" || ss === "ЛИ") || ss === "Ж") 
                            it.endToken = tt2;
                        else if (ss === "НИБУДЬ" || ss === "ЛИБО" || (((ss === "ТО" && tt2.previous.isHiphen)) && it.canBeAdj)) {
                            it.endToken = tt2;
                            for (const m of it.adjMorph) {
                                m.normalValue = (m.normalValue + "-" + ss);
                                if (m.singleNumberValue !== null) 
                                    m.singleNumberValue = (m.singleNumberValue + "-" + ss);
                            }
                        }
                    }
                }
                return it;
            }
            if (t0 === t) {
                if (t0.isValue("БИЗНЕС", null) && t0.next !== null && t0.next.chars.equals(t0.chars)) {
                    t1 = t0.next;
                    continue;
                }
                return it;
            }
        }
        return null;
    }
    
    tryAccordVar(v, multinouns = false) {
        for (const vv of this.adjMorph) {
            if (vv.checkAccord(v, false, multinouns)) {
                if (multinouns) {
                }
                return true;
            }
            else if (vv.normalValue === "СКОЛЬКО") 
                return true;
        }
        if (this.canBeNumericAdj) {
            if (v.number === MorphNumber.PLURAL) 
                return true;
            if (this.beginToken instanceof NumberToken) {
                let val = this.beginToken.intValue;
                if (val === null) 
                    return false;
                let num = this.beginToken.value;
                if (Utils.isNullOrEmpty(num)) 
                    return false;
                let dig = num[num.length - 1];
                if ((((dig === '2' || dig === '3' || dig === '4')) && (val < 10)) || val > 20) {
                    if (v._case.isGenitive) 
                        return true;
                }
            }
            let term = null;
            if (v instanceof MorphWordForm) 
                term = v.normalCase;
            if (v instanceof NounPhraseItemTextVar) 
                term = v.normalValue;
            if (term === "ЛЕТ" || term === "ЧЕЛОВЕК") 
                return true;
        }
        if (this.adjMorph.length > 0 && this.beginToken.morph._class.isPersonalPronoun && this.beginToken.morph.containsAttr("3 л.", null)) 
            return true;
        return false;
    }
    
    static tryAccordVariant(items, count, v, multinouns = false) {
        if (items === null || items.length === 0) 
            return true;
        for (let i = 0; i < count; i++) {
            let ok = items[i].tryAccordVar(v, multinouns);
            if (!ok) 
                return false;
        }
        return true;
    }
    
    static tryAccordAdjAndNoun(adj, noun) {
        for (const v of adj.adjMorph) {
            for (const vv of noun.nounMorph) {
                if (v.checkAccord(vv, false, false)) 
                    return true;
            }
        }
        return false;
    }
    
    static initialize() {
        if (NounPhraseItem.m_StdAdjectives !== null) 
            return;
        NounPhraseItem.m_StdAdjectives = new TerminCollection();
        for (const s of ["СЕВЕРНЫЙ", "ЮЖНЫЙ", "ЗАПАДНЫЙ", "ВОСТОЧНЫЙ"]) {
            NounPhraseItem.m_StdAdjectives.add(new Termin(s));
        }
    }
    
    static _new707(_arg1, _arg2, _arg3) {
        let res = new NounPhraseItem(_arg1, _arg2);
        res.canBeSurname = _arg3;
        return res;
    }
    
    static static_constructor() {
        NounPhraseItem.m_StdAdjectives = null;
    }
}


NounPhraseItem.static_constructor();

module.exports = NounPhraseItem