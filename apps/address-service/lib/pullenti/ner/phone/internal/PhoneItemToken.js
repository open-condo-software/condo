/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../../unisharp/StringBuilder");

const NumberSpellingType = require("./../../NumberSpellingType");
const MetaToken = require("./../../MetaToken");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphLang = require("./../../../morph/MorphLang");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const TerminCollection = require("./../../core/TerminCollection");
const PhoneItemTokenPhoneItemType = require("./PhoneItemTokenPhoneItemType");
const PhoneKind = require("./../PhoneKind");
const Termin = require("./../../core/Termin");
const NumberHelper = require("./../../core/NumberHelper");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const NumberToken = require("./../../NumberToken");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const PhoneHelper = require("./PhoneHelper");
const TextToken = require("./../../TextToken");

// Примитив, из которых состоит телефонный номер
class PhoneItemToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.itemType = PhoneItemTokenPhoneItemType.NUMBER;
        this.value = null;
        this.kind = PhoneKind.UNDEFINED;
        this.kind2 = PhoneKind.UNDEFINED;
        this.isInBrackets = false;
    }
    
    get canBeCountryPrefix() {
        if (this.value !== null && PhoneHelper.getCountryPrefix(this.value) === this.value) 
            return true;
        else 
            return false;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(String(this.itemType)).append(": ").append(this.value);
        if (this.kind !== PhoneKind.UNDEFINED) 
            res.append(" (").append(String(this.kind)).append(")");
        if (this.kind2 !== PhoneKind.UNDEFINED) 
            res.append(" (").append(String(this.kind2)).append(")");
        return res.toString();
    }
    
    static tryAttach(t0) {
        let res = PhoneItemToken._TryAttach(t0);
        if (res === null) 
            return null;
        if (res.itemType !== PhoneItemTokenPhoneItemType.PREFIX) 
            return res;
        for (let t = res.endToken.next; t !== null; t = t.next) {
            if (t.isTableControlChar) 
                break;
            if (t.isNewlineBefore) 
                break;
            let res2 = PhoneItemToken._TryAttach(t);
            if (res2 !== null) {
                if (res2.itemType === PhoneItemTokenPhoneItemType.PREFIX) {
                    if (res.kind === PhoneKind.UNDEFINED) 
                        res.kind = res2.kind;
                    t = res.endToken = res2.endToken;
                    continue;
                }
                break;
            }
            if (t.isChar(':')) {
                res.endToken = t;
                break;
            }
            if (!(t instanceof TextToken)) 
                break;
            if (t0.lengthChar === 1) 
                break;
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                t = npt.endToken;
                if (t.isValue("ПОСЕЛЕНИЕ", null) || t.isValue("СУД", null)) 
                    return null;
                res.endToken = t;
                continue;
            }
            if (t.getMorphClassInDictionary().isProper) {
                res.endToken = t;
                continue;
            }
            if (t.morph._class.isPreposition) 
                continue;
            break;
        }
        return res;
    }
    
    static _TryAttach(t0) {
        if (t0 === null) 
            return null;
        if (t0 instanceof NumberToken) {
            if (NumberHelper.tryParseNumberWithPostfix(t0) !== null && !t0.isWhitespaceAfter) {
                let rt = t0.kit.processReferent("PHONE", t0.next, null);
                if (rt === null) 
                    return null;
            }
            if (t0.typ === NumberSpellingType.DIGIT && !t0.morph._class.isAdjective) 
                return PhoneItemToken._new2721(t0, t0, PhoneItemTokenPhoneItemType.NUMBER, t0.getSourceText());
            return null;
        }
        if (t0.isChar('.')) 
            return PhoneItemToken._new2721(t0, t0, PhoneItemTokenPhoneItemType.DELIM, ".");
        if (t0.isHiphen) 
            return PhoneItemToken._new2721(t0, t0, PhoneItemTokenPhoneItemType.DELIM, "-");
        if (t0.isChar('+')) {
            if (!(t0.next instanceof NumberToken) || t0.next.typ !== NumberSpellingType.DIGIT) 
                return null;
            else {
                let val = t0.next.getSourceText();
                let i = 0;
                for (i = 0; i < val.length; i++) {
                    if (val[i] !== '0') 
                        break;
                }
                if (i >= val.length) 
                    return null;
                if (i > 0) 
                    val = val.substring(i);
                return PhoneItemToken._new2721(t0, t0.next, PhoneItemTokenPhoneItemType.COUNTRYCODE, val);
            }
        }
        if (t0.isChar(String.fromCharCode(0x2011)) && (t0.next instanceof NumberToken) && t0.next.lengthChar === 2) 
            return PhoneItemToken._new2721(t0, t0, PhoneItemTokenPhoneItemType.DELIM, "-");
        if (t0.isCharOf("(")) {
            if (t0.next instanceof NumberToken) {
                let et = t0.next;
                let val = new StringBuilder();
                for (; et !== null; et = et.next) {
                    if (et.isChar(')')) 
                        break;
                    if ((et instanceof NumberToken) && et.typ === NumberSpellingType.DIGIT) 
                        val.append(et.getSourceText());
                    else if (!et.isHiphen && !et.isChar('.')) 
                        return null;
                }
                if (et === null || val.length === 0) 
                    return null;
                else 
                    return PhoneItemToken._new2726(t0, et, PhoneItemTokenPhoneItemType.CITYCODE, val.toString(), true);
            }
            else {
                let tt1 = PhoneItemToken.m_PhoneTermins.tryParse(t0.next, TerminParseAttr.NO);
                if (tt1 === null || tt1.termin.tag !== null) {
                }
                else if (tt1.endToken.next === null || !tt1.endToken.next.isChar(')')) {
                }
                else 
                    return PhoneItemToken._new2727(t0, tt1.endToken.next, PhoneItemTokenPhoneItemType.PREFIX, true, "");
                return null;
            }
        }
        if ((t0.isChar('/') && (t0.next instanceof NumberToken) && t0.next.next !== null) && t0.next.next.isChar('/') && t0.next.lengthChar === 3) 
            return PhoneItemToken._new2726(t0, t0.next.next, PhoneItemTokenPhoneItemType.CITYCODE, t0.next.value.toString(), true);
        let t1 = null;
        let ki = PhoneKind.UNDEFINED;
        if ((t0.isValue("Т", null) && t0.next !== null && t0.next.isCharOf("\\/")) && t0.next.next !== null && ((t0.next.next.isValue("Р", null) || t0.next.next.isValue("М", null)))) {
            t1 = t0.next.next;
            ki = (t1.isValue("Р", null) ? PhoneKind.WORK : PhoneKind.MOBILE);
        }
        else {
            let tt = PhoneItemToken.m_PhoneTermins.tryParse(t0, TerminParseAttr.NO);
            if (tt === null || tt.termin.tag !== null) {
                if (t0.isValue("НОМЕР", null)) {
                    let rr = PhoneItemToken._TryAttach(t0.next);
                    if (rr !== null && rr.itemType === PhoneItemTokenPhoneItemType.PREFIX) {
                        rr.beginToken = t0;
                        return rr;
                    }
                }
                return null;
            }
            if ((t0.lengthChar === 1 && t0.chars.isAllUpper && t0.next !== null) && t0.next.isChar('.')) {
                if (((t0.whitespacesBeforeCount < 3) && t0.previous !== null && t0.previous.isChar('.')) && (t0.previous.previous instanceof TextToken) && t0.previous.previous.lengthChar === 1) 
                    return null;
            }
            if (tt.termin.tag2 instanceof PhoneKind) 
                ki = PhoneKind.of(tt.termin.tag2);
            t1 = tt.endToken;
        }
        let res = PhoneItemToken._new2729(t0, t1, PhoneItemTokenPhoneItemType.PREFIX, "", ki);
        while (true) {
            if (t1.next !== null && t1.next.isCharOf(".:")) 
                res.endToken = (t1 = t1.next);
            else if (t1.next !== null && t1.next.isTableControlChar) 
                t1 = t1.next;
            else if ((t1.next !== null && t1.next.isCharOf("/\\") && t1.next.next !== null) && t1.next.next.isValue("ФАКС", null)) {
                res.kind2 = PhoneKind.FAX;
                res.endToken = (t1 = t1.next.next);
                break;
            }
            else 
                break;
        }
        if (t0 === t1 && ((t0.beginChar === t0.endChar || t0.chars.isAllUpper))) {
            if (!t0.isWhitespaceAfter) 
                return null;
        }
        return res;
    }
    
    static tryAttachAdditional(t0) {
        let t = t0;
        if (t === null) 
            return null;
        if (t.isChar(',')) 
            t = t.next;
        else if (t.isCharOf("*#") && (t.next instanceof NumberToken)) {
            let val0 = t.next.getSourceText();
            let t1 = t.next;
            if ((t1.next !== null && t1.next.isHiphen && !t1.isWhitespaceAfter) && (t1.next.next instanceof NumberToken) && !t1.next.isWhitespaceAfter) {
                t1 = t1.next.next;
                val0 += t1.getSourceText();
            }
            if (val0.length >= 3 && (val0.length < 7)) 
                return PhoneItemToken._new2721(t, t1, PhoneItemTokenPhoneItemType.ADDNUMBER, val0);
        }
        let br = false;
        if (t !== null && t.isChar('(')) {
            if (t.previous !== null && t.previous.isComma) 
                return null;
            br = true;
            t = t.next;
        }
        let to = PhoneItemToken.m_PhoneTermins.tryParse(t, TerminParseAttr.NO);
        if (to === null) {
            if (!br) 
                return null;
            if (t0.whitespacesBeforeCount > 1) 
                return null;
        }
        else if (to.termin.tag === null) 
            return null;
        else 
            t = to.endToken.next;
        if (t === null) 
            return null;
        if (((t.isValue("НОМЕР", null) || t.isValue("N", null) || t.isValue("#", null)) || t.isValue("№", null) || t.isValue("NUMBER", null)) || ((t.isChar('+') && br))) 
            t = t.next;
        else if (to === null && !br) 
            return null;
        else if (t.isValue("НОМ", null) || t.isValue("ТЕЛ", null)) {
            t = t.next;
            if (t !== null && t.isChar('.')) 
                t = t.next;
        }
        if (t !== null && t.isCharOf(":,") && !t.isNewlineAfter) 
            t = t.next;
        if (!(t instanceof NumberToken)) 
            return null;
        let val = t.getSourceText();
        if ((t.next !== null && t.next.isHiphen && !t.isWhitespaceAfter) && (t.next.next instanceof NumberToken)) {
            val += t.next.next.getSourceText();
            t = t.next.next;
        }
        if ((val.length < 2) || val.length > 7) 
            return null;
        if (br) {
            if (t.next === null || !t.next.isChar(')')) 
                return null;
            t = t.next;
        }
        let res = PhoneItemToken._new2721(t0, t, PhoneItemTokenPhoneItemType.ADDNUMBER, val);
        return res;
    }
    
    static tryAttachAll(t0, maxCount = 15) {
        if (t0 === null) 
            return null;
        let p = PhoneItemToken.tryAttach(t0);
        let br = false;
        if (p === null && t0.isChar('(')) {
            br = true;
            p = PhoneItemToken.tryAttach(t0.next);
            if (p !== null) {
                p.beginToken = t0;
                p.isInBrackets = true;
                if (p.itemType === PhoneItemTokenPhoneItemType.PREFIX) 
                    br = false;
            }
        }
        if (p === null || p.itemType === PhoneItemTokenPhoneItemType.DELIM) 
            return null;
        let res = new Array();
        res.push(p);
        let t = null;
        for (t = p.endToken.next; t !== null; t = t.next) {
            if (t.isTableControlChar) {
                if (res.length === 1 && res[0].itemType === PhoneItemTokenPhoneItemType.PREFIX) 
                    continue;
                else 
                    break;
            }
            if (br && t.isChar(')')) {
                br = false;
                continue;
            }
            let p0 = PhoneItemToken.tryAttach(t);
            if (p0 === null) {
                if (t.isNewlineBefore) 
                    break;
                if (p.itemType === PhoneItemTokenPhoneItemType.PREFIX && ((t.isCharOf("\\/") || t.isHiphen))) {
                    p0 = PhoneItemToken.tryAttach(t.next);
                    if (p0 !== null && p0.itemType === PhoneItemTokenPhoneItemType.PREFIX) {
                        p.endToken = p0.endToken;
                        t = p.endToken;
                        continue;
                    }
                }
                if ((res[0].itemType === PhoneItemTokenPhoneItemType.PREFIX && t.isCharOf("\\/") && !t.isWhitespaceAfter) && !t.isWhitespaceBefore && (t.next instanceof NumberToken)) {
                    let sumNum = 0;
                    for (const pp of res) {
                        if (pp.itemType === PhoneItemTokenPhoneItemType.CITYCODE || pp.itemType === PhoneItemTokenPhoneItemType.COUNTRYCODE || pp.itemType === PhoneItemTokenPhoneItemType.NUMBER) 
                            sumNum += pp.value.length;
                    }
                    if (sumNum < 7) {
                        for (let tt = t.next; tt !== null; tt = tt.next) {
                            if (tt.isWhitespaceBefore) 
                                break;
                            else if (tt instanceof NumberToken) 
                                sumNum += tt.lengthChar;
                            else if ((tt instanceof TextToken) && !tt.chars.isLetter) {
                            }
                            else 
                                break;
                        }
                        if (sumNum === 10 || sumNum === 11) 
                            continue;
                    }
                }
                if (p0 === null) 
                    break;
            }
            if (t.isNewlineBefore) {
                if (p.itemType === PhoneItemTokenPhoneItemType.PREFIX) {
                }
                else 
                    break;
            }
            if (t.whitespacesBeforeCount > 1) {
                let ok = false;
                for (const pp of res) {
                    if (pp.itemType === PhoneItemTokenPhoneItemType.PREFIX || pp.itemType === PhoneItemTokenPhoneItemType.COUNTRYCODE) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) 
                    break;
            }
            if (br && p.itemType === PhoneItemTokenPhoneItemType.NUMBER) 
                p.itemType = PhoneItemTokenPhoneItemType.CITYCODE;
            p = p0;
            if (p.itemType === PhoneItemTokenPhoneItemType.NUMBER && res[res.length - 1].itemType === PhoneItemTokenPhoneItemType.NUMBER) 
                res.push(PhoneItemToken._new2721(t, t, PhoneItemTokenPhoneItemType.DELIM, " "));
            if (br) 
                p.isInBrackets = true;
            res.push(p);
            t = p.endToken;
            if (res.length > maxCount) 
                break;
        }
        if ((((p = PhoneItemToken.tryAttachAdditional(t)))) !== null) 
            res.push(p);
        for (let i = 1; i < (res.length - 1); i++) {
            if (res[i].itemType === PhoneItemTokenPhoneItemType.DELIM && res[i + 1].isInBrackets) {
                res.splice(i, 1);
                break;
            }
            else if (res[i].itemType === PhoneItemTokenPhoneItemType.DELIM && res[i + 1].itemType === PhoneItemTokenPhoneItemType.DELIM) {
                res[i].endToken = res[i + 1].endToken;
                res.splice(i + 1, 1);
                i--;
            }
        }
        if ((res.length > 1 && res[0].isInBrackets && res[0].itemType === PhoneItemTokenPhoneItemType.PREFIX) && res[res.length - 1].endToken.next !== null && res[res.length - 1].endToken.next.isChar(')')) 
            res[res.length - 1].endToken = res[res.length - 1].endToken.next;
        if (res[0].itemType === PhoneItemTokenPhoneItemType.PREFIX) {
            for (let i = 2; i < (res.length - 1); i++) {
                if (res[i].itemType === PhoneItemTokenPhoneItemType.PREFIX && res[i + 1].itemType !== PhoneItemTokenPhoneItemType.PREFIX) {
                    res.splice(i, res.length - i);
                    break;
                }
            }
        }
        while (res.length > 0) {
            if (res[res.length - 1].itemType === PhoneItemTokenPhoneItemType.DELIM) 
                res.splice(res.length - 1, 1);
            else 
                break;
        }
        return res;
    }
    
    static tryAttachAlternate(t0, ph0, pli) {
        if (t0 === null) 
            return null;
        if (t0.isCharOf("\\/") && (t0.next instanceof NumberToken) && (t0.next.endChar - t0.next.beginChar) <= 1) {
            let pli1 = PhoneItemToken.tryAttachAll(t0.next, 15);
            if (pli1 !== null && pli1.length > 1) {
                if (pli1[pli1.length - 1].itemType === PhoneItemTokenPhoneItemType.DELIM) 
                    pli1.splice(pli1.length - 1, 1);
                if (pli1.length <= pli.length) {
                    let ii = 0;
                    let num = "";
                    for (ii = 0; ii < pli1.length; ii++) {
                        let p1 = pli1[ii];
                        let p0 = pli[(pli.length - pli1.length) + ii];
                        if (p1.itemType !== p0.itemType) 
                            break;
                        if (p1.itemType !== PhoneItemTokenPhoneItemType.NUMBER && p1.itemType !== PhoneItemTokenPhoneItemType.DELIM) 
                            break;
                        if (p1.itemType === PhoneItemTokenPhoneItemType.NUMBER) {
                            if (p1.lengthChar !== p0.lengthChar) 
                                break;
                            num += p1.value;
                        }
                    }
                    if (ii >= pli1.length) 
                        return PhoneItemToken._new2721(t0, pli1[pli1.length - 1].endToken, PhoneItemTokenPhoneItemType.ALT, num);
                }
            }
            return PhoneItemToken._new2721(t0, t0.next, PhoneItemTokenPhoneItemType.ALT, t0.next.getSourceText());
        }
        if (t0.isHiphen && (t0.next instanceof NumberToken) && (t0.next.endChar - t0.next.beginChar) <= 1) {
            let t1 = t0.next.next;
            let ok = false;
            if (t1 === null) 
                ok = true;
            else if (t1.isNewlineBefore || t1.isCharOf(",.")) 
                ok = true;
            if (ok) 
                return PhoneItemToken._new2721(t0, t0.next, PhoneItemTokenPhoneItemType.ALT, t0.next.getSourceText());
        }
        if ((t0.isChar('(') && (t0.next instanceof NumberToken) && (t0.next.endChar - t0.next.beginChar) === 1) && t0.next.next !== null && t0.next.next.isChar(')')) 
            return PhoneItemToken._new2721(t0, t0.next.next, PhoneItemTokenPhoneItemType.ALT, t0.next.getSourceText());
        if ((t0.isCharOf("/-") && (t0.next instanceof NumberToken) && ph0.m_Template !== null) && LanguageHelper.endsWith(ph0.m_Template, ((t0.next.endChar - t0.next.beginChar) + 1).toString())) 
            return PhoneItemToken._new2721(t0, t0.next, PhoneItemTokenPhoneItemType.ALT, t0.next.getSourceText());
        return null;
    }
    
    static initialize() {
        if (PhoneItemToken.m_PhoneTermins !== null) 
            return;
        PhoneItemToken.m_PhoneTermins = new TerminCollection();
        let t = null;
        t = new Termin("ТЕЛЕФОН", MorphLang.RU, true);
        t.addAbridge("ТЕЛ.");
        t.addAbridge("TEL.");
        t.addAbridge("Т-Н");
        t.addAbridge("Т.");
        t.addAbridge("T.");
        t.addAbridge("TEL.EXT.");
        t.addVariant("ТЛФ", false);
        t.addVariant("ТЛФН", false);
        t.addAbridge("Т/Ф");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("МОБИЛЬНЫЙ", MorphLang.RU, true, PhoneKind.MOBILE);
        t.addAbridge("МОБ.");
        t.addAbridge("Т.М.");
        t.addAbridge("М.Т.");
        t.addAbridge("М.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("СОТОВЫЙ", MorphLang.RU, true, PhoneKind.MOBILE);
        t.addAbridge("СОТ.");
        t.addAbridge("CELL.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("РАБОЧИЙ", MorphLang.RU, true, PhoneKind.WORK);
        t.addAbridge("РАБ.");
        t.addAbridge("Т.Р.");
        t.addAbridge("Р.Т.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("ГОРОДСКОЙ", MorphLang.RU, true);
        t.addAbridge("ГОР.");
        t.addAbridge("Г.Т.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("ДОМАШНИЙ", MorphLang.RU, true, PhoneKind.HOME);
        t.addAbridge("ДОМ.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("КОНТАКТНЫЙ", MorphLang.RU, true);
        t.addVariant("КОНТАКТНЫЕ ДАННЫЕ", false);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("МНОГОКАНАЛЬНЫЙ", MorphLang.RU, true);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("ФАКС", MorphLang.RU, true, PhoneKind.FAX);
        t.addAbridge("Ф.");
        t.addVariant("ТЕЛЕФАКС", false);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("ЗВОНИТЬ", MorphLang.RU, true);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("ПРИЕМНАЯ", MorphLang.RU, true, PhoneKind.WORK);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("PHONE", MorphLang.EN, true);
        t.addAbridge("PH.");
        t.addVariant("TELEFON", true);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("DIRECT LINE", MorphLang.EN, true, PhoneKind.WORK);
        t.addVariant("DIRECT LINES", true);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("MOBILE", MorphLang.EN, true, PhoneKind.MOBILE);
        t.addAbridge("MOB.");
        t.addVariant("MOBIL", true);
        t.addAbridge("M.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("FAX", MorphLang.EN, true, PhoneKind.FAX);
        t.addAbridge("F.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = Termin._new2738("HOME", MorphLang.EN, true, PhoneKind.HOME);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("CALL", MorphLang.EN, true);
        t.addVariant("SEDIU", true);
        t.addVariant("CALL AT", false);
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("ДОПОЛНИТЕЛЬНЫЙ", MorphLang.RU, true);
        t.tag = t;
        t.addAbridge("ДОП.");
        t.addAbridge("EXT.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("ДОБАВОЧНЫЙ", MorphLang.RU, true);
        t.tag = t;
        t.addAbridge("ДОБ.");
        t.addAbridge("Д.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("ВНУТРЕННИЙ", MorphLang.RU, true);
        t.tag = t;
        t.addAbridge("ВНУТР.");
        t.addAbridge("ВН.");
        t.addAbridge("ВНТ.");
        t.addAbridge("Т.ВН.");
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("TONE MODE", MorphLang.EN, true);
        t.tag = t;
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("TONE", MorphLang.EN, true);
        t.tag = t;
        PhoneItemToken.m_PhoneTermins.add(t);
        t = new Termin("ADDITIONAL", MorphLang.EN, true);
        t.addAbridge("ADD.");
        t.tag = t;
        t.addVariant("INTERNAL", true);
        t.addAbridge("INT.");
        PhoneItemToken.m_PhoneTermins.add(t);
    }
    
    static _new2721(_arg1, _arg2, _arg3, _arg4) {
        let res = new PhoneItemToken(_arg1, _arg2);
        res.itemType = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new2726(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PhoneItemToken(_arg1, _arg2);
        res.itemType = _arg3;
        res.value = _arg4;
        res.isInBrackets = _arg5;
        return res;
    }
    
    static _new2727(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PhoneItemToken(_arg1, _arg2);
        res.itemType = _arg3;
        res.isInBrackets = _arg4;
        res.value = _arg5;
        return res;
    }
    
    static _new2729(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PhoneItemToken(_arg1, _arg2);
        res.itemType = _arg3;
        res.value = _arg4;
        res.kind = _arg5;
        return res;
    }
    
    static static_constructor() {
        PhoneItemToken.m_PhoneTermins = null;
    }
}


PhoneItemToken.static_constructor();

module.exports = PhoneItemToken