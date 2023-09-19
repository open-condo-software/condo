/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphNumber = require("./../../../morph/MorphNumber");
const NumberWithUnitParseAttr = require("./../../measure/internal/NumberWithUnitParseAttr");
const NumberSpellingType = require("./../../NumberSpellingType");
const Token = require("./../../Token");
const DateRangeReferent = require("./../DateRangeReferent");
const NumberExType = require("./../../core/NumberExType");
const MorphLang = require("./../../../morph/MorphLang");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const DateItemTokenFirstLastTyp = require("./DateItemTokenFirstLastTyp");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const DateItemTokenDateItemType = require("./DateItemTokenDateItemType");
const MetaToken = require("./../../MetaToken");
const TextToken = require("./../../TextToken");
const DatePointerType = require("./../DatePointerType");
const NumberToken = require("./../../NumberToken");
const BracketHelper = require("./../../core/BracketHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NumberHelper = require("./../../core/NumberHelper");
const NumbersWithUnitToken = require("./../../measure/internal/NumbersWithUnitToken");
const DateAnalyzer = require("./../DateAnalyzer");
const DateTokenData = require("./DateTokenData");

// Примитив, из которых состоит дата
class DateItemToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = DateItemTokenDateItemType.NUMBER;
        this.stringValue = null;
        this.intValue = 0;
        this.ptr = DatePointerType.NO;
        this.lang = null;
        this.newAge = 0;
        this.relate = false;
        this.lTyp = DateItemTokenFirstLastTyp.NO;
        this.newStyle = null;
        this.m_Year = -1;
        this.m_CanByMonth = -1;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(this.typ.toString()).append(" ").append((this.intValue === 0 ? this.stringValue : this.intValue.toString()));
        if (this.ptr !== DatePointerType.NO) 
            res.append(" (").append(String(this.ptr)).append(")");
        if (this.lTyp !== DateItemTokenFirstLastTyp.NO) 
            res.append(" ").append(String(this.lTyp));
        if (this.relate) 
            res.append(" relate");
        if (this.newStyle !== null) {
            for (const ns of this.newStyle) {
                res.append(" (new style: ").append(ns.toString()).append(")");
            }
        }
        return res.toString();
    }
    
    get year() {
        if (this.m_Year > 0) 
            return this.m_Year;
        if (this.intValue === 0) 
            return 0;
        if (this.newAge === 0) {
            if (this.intValue < 16) 
                return 2000 + this.intValue;
            if (this.intValue <= ((Utils.getDate(Utils.now()).getFullYear() - 2000) + 5)) 
                return 2000 + this.intValue;
            if (this.intValue < 100) 
                return 1900 + this.intValue;
        }
        return this.intValue;
    }
    set year(value) {
        this.m_Year = value;
        return value;
    }
    
    get year0() {
        if (this.newAge < 0) 
            return -this.year;
        return this.year;
    }
    
    get canBeYear() {
        if (this.lTyp !== DateItemTokenFirstLastTyp.NO) 
            return false;
        if (this.typ === DateItemTokenDateItemType.YEAR) 
            return true;
        if (this.typ === DateItemTokenDateItemType.MONTH || this.typ === DateItemTokenDateItemType.QUARTAL || this.typ === DateItemTokenDateItemType.HALFYEAR) 
            return false;
        if (this.intValue >= 50 && (this.intValue < 100)) 
            return true;
        if ((this.intValue < 1000) || this.intValue > 2100) 
            return false;
        return true;
    }
    
    get canByMonth() {
        if (this.lTyp !== DateItemTokenFirstLastTyp.NO) 
            return false;
        if (this.m_CanByMonth >= 0) 
            return this.m_CanByMonth === 1;
        if (this.typ === DateItemTokenDateItemType.MONTH) 
            return true;
        if (this.typ === DateItemTokenDateItemType.QUARTAL || this.typ === DateItemTokenDateItemType.HALFYEAR || this.typ === DateItemTokenDateItemType.POINTER) 
            return false;
        return this.intValue > 0 && this.intValue <= 12;
    }
    set canByMonth(value) {
        this.m_CanByMonth = (value ? 1 : 0);
        return value;
    }
    
    get canBeDay() {
        if ((this.typ === DateItemTokenDateItemType.MONTH || this.typ === DateItemTokenDateItemType.QUARTAL || this.typ === DateItemTokenDateItemType.HALFYEAR) || this.typ === DateItemTokenDateItemType.POINTER) 
            return false;
        if (this.lTyp !== DateItemTokenFirstLastTyp.NO) 
            return false;
        return this.intValue > 0 && this.intValue <= 31;
    }
    
    get canBeHour() {
        if (this.lTyp !== DateItemTokenFirstLastTyp.NO) 
            return false;
        if (this.typ !== DateItemTokenDateItemType.NUMBER) 
            return this.typ === DateItemTokenDateItemType.HOUR;
        if (this.lengthChar !== 2) {
            if (this.lengthChar !== 1 || this.intValue >= 24) 
                return false;
            if (this.intValue === 0) 
                return true;
            if (this.beginToken.next === null || !this.beginToken.next.isCharOf(":.") || this.isWhitespaceAfter) 
                return false;
            if (!(this.beginToken.next.next instanceof NumberToken)) 
                return false;
            if (this.beginToken.next.next.lengthChar !== 2) 
                return false;
            if (this.beginToken.next.isChar('.')) {
                if (this.beginToken.previous !== null && this.beginToken.previous.isValue("В", null)) {
                }
                else 
                    return false;
            }
            if (this.isWhitespaceBefore) 
                return true;
            if (this.beginToken.previous !== null && this.beginToken.previous.isCharOf("(,")) 
                return true;
            return false;
        }
        return this.intValue >= 0 && (this.intValue < 24);
    }
    
    get canBeMinute() {
        if (this.lTyp !== DateItemTokenFirstLastTyp.NO) 
            return false;
        if (this.typ !== DateItemTokenDateItemType.NUMBER) 
            return this.typ === DateItemTokenDateItemType.MINUTE;
        if (this.lengthChar !== 2) 
            return false;
        return this.intValue >= 0 && (this.intValue < 60);
    }
    
    get isZeroHeaded() {
        return this.kit.sofa.text[this.beginChar] === '0';
    }
    
    static prepareAllData(t0) {
        if (!DateItemToken.SPEED_REGIME) 
            return;
        let ad = DateAnalyzer.getData(t0);
        if (ad === null) 
            return;
        let prevs = new Array();
        for (let t = t0; t !== null; t = t.next) {
            prevs.splice(0, prevs.length);
            let kk = 0;
            let tt0 = t;
            for (let tt = t.previous; tt !== null && (kk < 10); tt = tt.previous,kk++) {
                let d0 = Utils.as(tt.tag, DateTokenData);
                if (d0 === null) 
                    continue;
                if (d0.dat === null) 
                    continue;
                if (d0.dat.endToken.next === tt0) {
                    prevs.splice(0, 0, d0.dat);
                    tt0 = tt;
                }
                else if (d0.dat.endChar < tt.endChar) 
                    break;
            }
            let d = Utils.as(t.tag, DateTokenData);
            let ter = DateItemToken.tryParse(t, prevs, false);
            if (ter !== null) {
                if (d === null) 
                    d = new DateTokenData(t);
                d.dat = ter;
            }
        }
    }
    
    static tryParse(t, prev, detailRegime = false) {
        if (t === null) 
            return null;
        let ad = DateAnalyzer.getData(t);
        if ((ad !== null && DateItemToken.SPEED_REGIME && ad.dRegime) && !detailRegime) {
            let d = Utils.as(t.tag, DateTokenData);
            if (d !== null) 
                return d.dat;
            return null;
        }
        if (ad !== null) {
            if (ad.level > 3) 
                return null;
            ad.level++;
        }
        let res = DateItemToken.tryParseInt(t, prev, detailRegime);
        if (ad !== null) 
            ad.level--;
        return res;
    }
    
    static tryParseInt(t, prev, detailRegime) {
        let t0 = t;
        if (t0.isChar('_')) {
            for (t = t.next; t !== null; t = t.next) {
                if (t.isNewlineBefore) 
                    return null;
                if (!t.isChar('_')) 
                    break;
            }
        }
        else if (BracketHelper.canBeStartOfSequence(t0, true, false)) {
            let ok = false;
            for (t = t.next; t !== null; t = t.next) {
                if (BracketHelper.canBeEndOfSequence(t, true, t0, false)) {
                    ok = true;
                    break;
                }
                else if (!t.isChar('_')) 
                    break;
            }
            if (!ok) 
                t = t0;
            else 
                for (t = t.next; t !== null; t = t.next) {
                    if (!t.isChar('_')) 
                        break;
                }
        }
        else if ((t0 instanceof TextToken) && t0.isValue("THE", null)) {
            let res0 = DateItemToken._TryAttach(t.next, prev, detailRegime);
            if (res0 !== null) {
                res0.beginToken = t;
                return res0;
            }
        }
        let res = DateItemToken._TryAttach(t, prev, detailRegime);
        if (res === null) 
            return null;
        res.beginToken = t0;
        if (!res.isWhitespaceAfter && res.endToken.next !== null && res.endToken.next.isChar('_')) {
            for (t = res.endToken.next; t !== null; t = t.next) {
                if (!t.isChar('_')) 
                    break;
                else 
                    res.endToken = t;
            }
        }
        if (res.typ === DateItemTokenDateItemType.YEAR || res.typ === DateItemTokenDateItemType.CENTURY || res.typ === DateItemTokenDateItemType.NUMBER) {
            let tok = null;
            let ii = 0;
            t = res.endToken.next;
            if (t !== null && t.isValue("ДО", null)) {
                tok = DateItemToken.m_NewAge.tryParse(t.next, TerminParseAttr.NO);
                ii = -1;
            }
            else if (t !== null && t.isValue("ОТ", "ВІД")) {
                tok = DateItemToken.m_NewAge.tryParse(t.next, TerminParseAttr.NO);
                ii = 1;
            }
            else {
                tok = DateItemToken.m_NewAge.tryParse(t, TerminParseAttr.NO);
                ii = 1;
            }
            if (tok !== null) {
                res.newAge = (ii < 0 ? -1 : 1);
                res.endToken = tok.endToken;
                if (res.typ === DateItemTokenDateItemType.NUMBER) 
                    res.typ = DateItemTokenDateItemType.YEAR;
            }
        }
        if (res.endToken.next !== null && res.endToken.next.isChar('(')) {
            let t1 = res.endToken.next.next;
            let li = DateItemToken.tryParseList(t1, 20);
            if ((li !== null && li.length > 0 && ((li[0].typ === DateItemTokenDateItemType.NUMBER || li[0].typ === DateItemTokenDateItemType.DAY))) && li[li.length - 1].endToken.next !== null && li[li.length - 1].endToken.next.isChar(')')) {
                res.newStyle = li;
                res.endToken = li[li.length - 1].endToken.next;
                if (res.canBeYear && res.endToken.next !== null && res.endToken.next.isValue("ГОД", "РІК")) {
                    res.endToken = res.endToken.next;
                    res.typ = DateItemTokenDateItemType.YEAR;
                }
            }
        }
        return res;
    }
    
    static _isNewAge(t) {
        if (t === null) 
            return false;
        if (t.isValue("ДО", null)) 
            return DateItemToken.m_NewAge.tryParse(t.next, TerminParseAttr.NO) !== null;
        else if (t.isValue("ОТ", "ВІД")) 
            return DateItemToken.m_NewAge.tryParse(t.next, TerminParseAttr.NO) !== null;
        return DateItemToken.m_NewAge.tryParse(t, TerminParseAttr.NO) !== null;
    }
    
    static _TryAttach(t, prev, detailRegime) {
        const MeasureToken = require("./../../measure/internal/MeasureToken");
        if (t === null) 
            return null;
        let nt = Utils.as(t, NumberToken);
        let begin = t;
        let end = t;
        let isInBrack = false;
        if (t.next instanceof NumberToken) {
            let nt0 = Utils.as(t.next, NumberToken);
            let canYear = nt0.intValue !== null && nt0.intValue >= 1800;
            if (BracketHelper.canBeStartOfSequence(t, canYear, false) && BracketHelper.canBeEndOfSequence(t.next.next, canYear, null, false)) {
                nt = Utils.as(t.next, NumberToken);
                end = t.next.next;
                isInBrack = true;
            }
        }
        if ((t.isNewlineBefore && BracketHelper.isBracket(t, false) && (t.next instanceof NumberToken)) && BracketHelper.isBracket(t.next.next, false)) {
            nt = Utils.as(t.next, NumberToken);
            end = t.next.next;
            isInBrack = true;
        }
        let flt = DateItemTokenFirstLastTyp.NO;
        if (t.isValue("ПЕРВЫЙ", null)) 
            flt = DateItemTokenFirstLastTyp.FIRST;
        else if (t.isValue("ПОСЛЕДНИЙ", null)) 
            flt = DateItemTokenFirstLastTyp.LAST;
        if (flt !== DateItemTokenFirstLastTyp.NO && t.next !== null) {
            let t1 = t.next;
            if (t1 instanceof NumberToken) 
                t1 = t1.next;
            if (t1 === null) 
                return null;
            let dty = DateItemTokenDateItemType.NUMBER;
            if (t1.isValue("ДЕНЬ", null)) 
                dty = DateItemTokenDateItemType.DAY;
            else if (t1.isValue("МЕСЯЦ", "МІСЯЦЬ")) 
                dty = DateItemTokenDateItemType.MONTH;
            else if (t1.isValue("КВАРТАЛ", null)) 
                dty = DateItemTokenDateItemType.QUARTAL;
            else if (t1.isValue("ПОЛУГОДИЕ", "ПІВРІЧЧЯ") || t1.isValue("ПОЛГОДА", "ПІВРОКУ")) 
                dty = DateItemTokenDateItemType.HALFYEAR;
            if (dty !== DateItemTokenDateItemType.NUMBER) {
                let res = DateItemToken._new973(t, t1, dty, flt, 1);
                if ((t.next instanceof NumberToken) && t.next.intValue !== null) 
                    res.intValue = t.next.intValue;
                return res;
            }
            if (t1.isValue("ГОД", "РІК") && NumberHelper.tryParseRoman(t1.next) !== null) 
                return DateItemToken._new974(t, t1, DateItemTokenDateItemType.POINTER, (flt === DateItemTokenFirstLastTyp.LAST ? DatePointerType.END : DatePointerType.BEGIN));
        }
        if (nt !== null) {
            if (nt.intValue === null) 
                return null;
            if (nt.typ === NumberSpellingType.WORDS) {
                if (nt.morph._class.isNoun && !nt.morph._class.isAdjective) {
                    if (t.next !== null && ((t.next.isValue("КВАРТАЛ", null) || t.next.isValue("ПОЛУГОДИЕ", null) || t.next.isValue("ПІВРІЧЧЯ", null)))) {
                    }
                    else 
                        return null;
                }
            }
            if (NumberHelper.tryParseAge(nt) !== null) 
                return null;
            let tt = null;
            let res = DateItemToken._new975(begin, end, DateItemTokenDateItemType.NUMBER, nt.intValue, nt.morph);
            if ((res.intValue === 20 && (nt.next instanceof NumberToken) && nt.next.intValue !== null) && nt.next.lengthChar === 2 && prev !== null) {
                let num = 2000 + nt.next.intValue;
                if ((num < 2030) && prev.length > 0 && prev[prev.length - 1].typ === DateItemTokenDateItemType.MONTH) {
                    let ok = false;
                    if (nt.whitespacesAfterCount === 1) 
                        ok = true;
                    else if (nt.isNewlineAfter && nt.isNewlineAfter) 
                        ok = true;
                    if (ok) {
                        nt = Utils.as(nt.next, NumberToken);
                        res.endToken = nt;
                        res.intValue = num;
                    }
                }
            }
            if (res.intValue === 20 || res.intValue === 201) {
                tt = t.next;
                if (tt !== null && tt.isChar('_')) {
                    for (; tt !== null; tt = tt.next) {
                        if (!tt.isChar('_')) 
                            break;
                    }
                    tt = DateItemToken.testYearRusWord(tt, false);
                    if (tt !== null) {
                        res.intValue = 0;
                        res.endToken = tt;
                        res.typ = DateItemTokenDateItemType.YEAR;
                        return res;
                    }
                }
            }
            if (res.intValue <= 12 && t.next !== null && (t.whitespacesAfterCount < 3)) {
                tt = t.next;
                if (tt.isValue("ЧАС", null)) {
                    if (((t.previous instanceof TextToken) && !t.previous.chars.isLetter && !t.isWhitespaceBefore) && (t.previous.previous instanceof NumberToken) && !t.previous.isWhitespaceBefore) {
                    }
                    else {
                        res.typ = DateItemTokenDateItemType.HOUR;
                        res.endToken = tt;
                        tt = tt.next;
                        if (tt !== null && tt.isChar('.')) {
                            res.endToken = tt;
                            tt = tt.next;
                        }
                    }
                }
                for (; tt !== null; tt = tt.next) {
                    if (tt.isValue("УТРО", "РАНОК")) {
                        res.endToken = tt;
                        res.typ = DateItemTokenDateItemType.HOUR;
                        return res;
                    }
                    if (tt.isValue("ВЕЧЕР", "ВЕЧІР") && tt.morph.number === MorphNumber.SINGULAR) {
                        res.endToken = tt;
                        res.intValue += 12;
                        res.typ = DateItemTokenDateItemType.HOUR;
                        return res;
                    }
                    if (tt.isValue("ДЕНЬ", null) && tt.morph.number === MorphNumber.SINGULAR) {
                        res.endToken = tt;
                        if (res.intValue < 10) 
                            res.intValue += 12;
                        res.typ = DateItemTokenDateItemType.HOUR;
                        return res;
                    }
                    if (tt.isValue("НОЧЬ", "НІЧ") && tt.morph.number === MorphNumber.SINGULAR) {
                        res.endToken = tt;
                        if (res.intValue === 12) 
                            res.intValue = 0;
                        else if (res.intValue > 9) 
                            res.intValue += 12;
                        res.typ = DateItemTokenDateItemType.HOUR;
                        return res;
                    }
                    if (tt.isComma || tt.morph._class.isAdverb) 
                        continue;
                    break;
                }
                if (res.typ === DateItemTokenDateItemType.HOUR) 
                    return res;
            }
            let _canBeYear = true;
            if (prev !== null && prev.length > 0 && prev[prev.length - 1].typ === DateItemTokenDateItemType.MONTH) {
            }
            else if ((prev !== null && prev.length >= 4 && prev[prev.length - 1].typ === DateItemTokenDateItemType.DELIM) && prev[prev.length - 2].canByMonth) {
            }
            else if (nt.next !== null && (nt.next.isValue("ГОД", "РІК"))) {
                if (res.intValue < 1000) 
                    _canBeYear = false;
            }
            tt = DateItemToken.testYearRusWord(nt.next, false);
            if (tt !== null && DateItemToken._isNewAge(tt.next)) {
                res.typ = DateItemTokenDateItemType.YEAR;
                res.endToken = tt;
            }
            else if (_canBeYear) {
                if (res.canBeYear || res.typ === DateItemTokenDateItemType.NUMBER) {
                    if ((((tt = DateItemToken.testYearRusWord(nt.next, res.isNewlineBefore)))) !== null) {
                        if ((tt.isValue("Г", null) && !tt.isWhitespaceBefore && t.previous !== null) && ((t.previous.isValue("КОРПУС", null) || t.previous.isValue("КОРП", null)))) {
                        }
                        else if ((((nt.next.isValue("Г", null) && (t.whitespacesBeforeCount < 3) && t.previous !== null) && t.previous.isValue("Я", null) && t.previous.previous !== null) && t.previous.previous.isCharOf("\\/") && t.previous.previous.previous !== null) && t.previous.previous.previous.isValue("А", null)) 
                            return null;
                        else if (nt.next.lengthChar === 1 && !res.canBeYear && ((prev === null || ((prev.length > 0 && prev[prev.length - 1].typ !== DateItemTokenDateItemType.DELIM))))) {
                        }
                        else {
                            res.endToken = tt;
                            res.typ = DateItemTokenDateItemType.YEAR;
                            res.lang = tt.morph.language;
                        }
                    }
                    if (((res.typ === DateItemTokenDateItemType.NUMBER && !t.isNewlineBefore && t.previous !== null) && t.previous.morph._class.isPreposition && t.previous.previous !== null) && t.previous.previous.isValue("ГОД", "")) 
                        res.typ = DateItemTokenDateItemType.YEAR;
                    if (((nt.typ === NumberSpellingType.DIGIT && res.typ === DateItemTokenDateItemType.NUMBER && res.canBeYear) && t.previous !== null && t.previous.isChar('(')) && t.next !== null && t.next.isChar(')')) 
                        res.typ = DateItemTokenDateItemType.YEAR;
                }
                else if (tt !== null && (nt.whitespacesAfterCount < 2) && (nt.endChar - nt.beginChar) === 1) {
                    res.endToken = tt;
                    res.typ = DateItemTokenDateItemType.YEAR;
                    res.lang = tt.morph.language;
                }
            }
            if (nt.previous !== null) {
                if (nt.previous.isValue("В", "У") || nt.previous.isValue("К", null) || nt.previous.isValue("ДО", null)) {
                    if ((((tt = DateItemToken.testYearRusWord(nt.next, false)))) !== null) {
                        let ok = false;
                        if ((res.intValue < 100) && (tt instanceof TextToken) && ((tt.term === "ГОДА" || tt.term === "РОКИ"))) {
                        }
                        else {
                            ok = true;
                            if (nt.previous.isValue("ДО", null) && nt.next.isValue("Г", null)) {
                                let cou = 0;
                                for (let ttt = nt.previous.previous; ttt !== null && (cou < 10); ttt = ttt.previous,cou++) {
                                    let mt = MeasureToken.tryParse(ttt, null, false, false, false, false);
                                    if (mt !== null && mt.endChar > nt.endChar) {
                                        ok = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (ok) {
                            res.endToken = tt;
                            res.typ = DateItemTokenDateItemType.YEAR;
                            res.lang = tt.morph.language;
                            res.beginToken = nt.previous;
                        }
                    }
                }
                else if (((nt.previous.isValue("IN", null) || nt.previous.isValue("SINCE", null))) && res.canBeYear) {
                    let uu = (nt.previous.isValue("IN", null) ? NumbersWithUnitToken.tryParse(nt, null, NumberWithUnitParseAttr.NO) : null);
                    if (uu !== null && uu.units.length > 0) {
                    }
                    else {
                        res.typ = DateItemTokenDateItemType.YEAR;
                        res.beginToken = nt.previous;
                    }
                }
                else if (nt.previous.isValue("NEL", null) || nt.previous.isValue("DEL", null)) {
                    if (res.canBeYear) {
                        res.typ = DateItemTokenDateItemType.YEAR;
                        res.lang = MorphLang.IT;
                        res.beginToken = nt.previous;
                    }
                }
                else if (nt.previous.isValue("IL", null) && res.canBeDay) {
                    res.lang = MorphLang.IT;
                    res.beginToken = nt.previous;
                }
            }
            let t1 = res.endToken.next;
            if (t1 !== null) {
                if (t1.isValue("ЧАС", "ГОДИНА") || t1.isValue("HOUR", null) || t1.isValue("Ч", null)) {
                    if ((((prev !== null && prev.length === 2 && prev[0].canBeHour) && prev[1].typ === DateItemTokenDateItemType.DELIM && !prev[1].isWhitespaceAfter) && !prev[1].isWhitespaceAfter && res.intValue >= 0) && (res.intValue < 59)) {
                        prev[0].typ = DateItemTokenDateItemType.HOUR;
                        res.typ = DateItemTokenDateItemType.MINUTE;
                        res.endToken = t1;
                    }
                    else if (res.intValue < 24) {
                        if (t1.next !== null && t1.next.isChar('.')) 
                            t1 = t1.next;
                        res.typ = DateItemTokenDateItemType.HOUR;
                        res.endToken = t1;
                    }
                }
                else if ((res.intValue < 60) && (((t1.isValue("МИНУТА", "ХВИЛИНА") || t1.isValue("МИН", null) || t1.isValue("MINUTE", null)) || ((((t1.isValue("М", null) && prev !== null && prev.length > 0) && prev[prev.length - 1].typ === DateItemTokenDateItemType.HOUR)))))) {
                    if (t1.next !== null && t1.next.isChar('.')) 
                        t1 = t1.next;
                    res.typ = DateItemTokenDateItemType.MINUTE;
                    res.endToken = t1;
                }
                else if ((res.intValue < 60) && ((t1.isValue("СЕКУНДА", null) || t1.isValue("СЕК", null) || t1.isValue("SECOND", null)))) {
                    if (t1.next !== null && t1.next.isChar('.')) 
                        t1 = t1.next;
                    res.typ = DateItemTokenDateItemType.SECOND;
                    res.endToken = t1;
                }
                else if ((res.intValue < 30) && ((t1.isValue("ВЕК", "ВІК") || t1.isValue("СТОЛЕТИЕ", "СТОЛІТТЯ")))) {
                    res.typ = DateItemTokenDateItemType.CENTURY;
                    res.endToken = t1;
                }
                else if ((res.intValue < 10) && ((t1.isValue("ДЕСЯТИЛЕТИЕ", "ДЕСЯТИЛІТТЯ") || t1.isValue("ДЕКАДА", null)))) {
                    res.typ = DateItemTokenDateItemType.TENYEARS;
                    res.endToken = t1;
                }
                else if (res.intValue <= 4 && t1.isValue("КВАРТАЛ", null)) {
                    res.typ = DateItemTokenDateItemType.QUARTAL;
                    res.endToken = t1;
                }
                else if (res.intValue <= 2 && ((t1.isValue("ПОЛУГОДИЕ", null) || t1.isValue("ПІВРІЧЧЯ", null)))) {
                    res.typ = DateItemTokenDateItemType.HALFYEAR;
                    res.endToken = t1;
                }
            }
            return res;
        }
        let t0 = Utils.as(t, TextToken);
        if (t0 === null) 
            return null;
        let txt = t0.getSourceText();
        if ((txt[0] === 'I' || txt[0] === 'X' || txt[0] === 'Х') || txt[0] === 'V' || ((t0.chars.isLatinLetter && t0.chars.isAllUpper))) {
            let lat = NumberHelper.tryParseRoman(t);
            if (lat !== null && lat.endToken.next !== null && lat.intValue !== null) {
                let val = lat.intValue;
                let tt = lat.endToken.next;
                if (tt.isValue("КВАРТАЛ", null) && val > 0 && val <= 4) 
                    return DateItemToken._new976(t, tt, DateItemTokenDateItemType.QUARTAL, val);
                if (tt.isValue("ПОЛУГОДИЕ", "ПІВРІЧЧЯ") && val > 0 && val <= 2) 
                    return DateItemToken._new976(t, lat.endToken.next, DateItemTokenDateItemType.HALFYEAR, val);
                if (tt.isValue("ВЕК", "ВІК") || tt.isValue("СТОЛЕТИЕ", "СТОЛІТТЯ")) 
                    return DateItemToken._new976(t, lat.endToken.next, DateItemTokenDateItemType.CENTURY, val);
                if (tt.isValue("ДЕСЯТИЛЕТИЕ", "ДЕСЯТИЛІТТЯ") || tt.isValue("ДЕКАДА", null)) 
                    return DateItemToken._new976(t, lat.endToken.next, DateItemTokenDateItemType.TENYEARS, val);
                if (((tt.isValue("В", null) || tt.isValue("ВВ", null))) && tt.next !== null && tt.next.isChar('.')) {
                    if (prev !== null && prev.length > 0 && prev[prev.length - 1].typ === DateItemTokenDateItemType.POINTER) 
                        return DateItemToken._new976(t, tt.next, DateItemTokenDateItemType.CENTURY, val);
                    if (DateItemToken._isNewAge(tt.next.next) || !tt.isWhitespaceBefore) 
                        return DateItemToken._new976(t, tt.next, DateItemTokenDateItemType.CENTURY, val);
                }
                if (tt.isHiphen) {
                    let lat2 = NumberHelper.tryParseRoman(tt.next);
                    if (lat2 !== null && lat2.intValue !== null && lat2.endToken.next !== null) {
                        if (lat2.endToken.next.isValue("ВЕК", "ВІК") || lat2.endToken.next.isValue("СТОЛЕТИЕ", "СТОЛІТТЯ")) {
                            let ddd = DateItemToken.tryParse(tt.next, null, false);
                            return DateItemToken._new982(t, lat.endToken, DateItemTokenDateItemType.CENTURY, val, (ddd !== null ? ddd.newAge : 0));
                        }
                    }
                }
                let pr0 = null;
                for (let ttt = tt; ttt !== null; ttt = ttt.next) {
                    if (ttt.isHiphen || ttt.isCommaAnd) 
                        continue;
                    let mc = ttt.getMorphClassInDictionary();
                    if (mc.isPreposition) 
                        continue;
                    let nex = DateItemToken.tryParse(ttt, pr0, false);
                    if (nex === null) 
                        break;
                    if (nex.typ === DateItemTokenDateItemType.POINTER) {
                        if (pr0 === null) 
                            pr0 = new Array();
                        pr0.push(nex);
                        ttt = nex.endToken;
                        continue;
                    }
                    if (nex.typ === DateItemTokenDateItemType.CENTURY || nex.typ === DateItemTokenDateItemType.QUARTAL) 
                        return DateItemToken._new982(t, lat.endToken, nex.typ, val, nex.newAge);
                    break;
                }
            }
        }
        if (t === null) 
            return null;
        if (t !== null && t.isValue("НАПРИКІНЦІ", null)) 
            return DateItemToken._new984(t, t, DateItemTokenDateItemType.POINTER, DatePointerType.END, "конец");
        if (t !== null && t.isValue("ДОНЕДАВНА", null)) 
            return DateItemToken._new984(t, t, DateItemTokenDateItemType.POINTER, DatePointerType.TODAY, "сегодня");
        if (prev === null) {
            if (t !== null) {
                if (t.isValue("ОКОЛО", "БІЛЯ") || t.isValue("ПРИМЕРНО", "ПРИБЛИЗНО") || t.isValue("ABOUT", null)) 
                    return DateItemToken._new984(t, t, DateItemTokenDateItemType.POINTER, DatePointerType.ABOUT, "около");
            }
            if (t.isValue("ОК", null) || t.isValue("OK", null)) {
                if (t.next !== null && t.next.isChar('.')) 
                    return DateItemToken._new984(t, t.next, DateItemTokenDateItemType.POINTER, DatePointerType.ABOUT, "около");
                return DateItemToken._new984(t, t, DateItemTokenDateItemType.POINTER, DatePointerType.ABOUT, "около");
            }
        }
        let tok = DateItemToken.m_Seasons.tryParse(t, TerminParseAttr.NO);
        if ((tok !== null && (DatePointerType.of(tok.termin.tag)) === DatePointerType.SUMMER && t.morph.language.isRu) && (t instanceof TextToken)) {
            let str = t.term;
            if (str !== "ЛЕТОМ" && str !== "ЛЕТА" && str !== "ЛЕТО") 
                tok = null;
        }
        if (tok !== null) 
            return DateItemToken._new974(t, tok.endToken, DateItemTokenDateItemType.POINTER, DatePointerType.of(tok.termin.tag));
        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
        if (npt !== null) {
            tok = DateItemToken.m_Seasons.tryParse(npt.endToken, TerminParseAttr.NO);
            if ((tok !== null && (DatePointerType.of(tok.termin.tag)) === DatePointerType.SUMMER && t.morph.language.isRu) && (t instanceof TextToken)) {
                let str = t.term;
                if (str !== "ЛЕТОМ" && str !== "ЛЕТА" && str !== "ЛЕТО") 
                    tok = null;
            }
            if (tok !== null) 
                return DateItemToken._new974(t, tok.endToken, DateItemTokenDateItemType.POINTER, DatePointerType.of(tok.termin.tag));
            let _typ = DateItemTokenDateItemType.NUMBER;
            if (npt.noun.isValue("КВАРТАЛ", null)) 
                _typ = DateItemTokenDateItemType.QUARTAL;
            else if (npt.endToken.isValue("ПОЛУГОДИЕ", "ПІВРІЧЧЯ")) 
                _typ = DateItemTokenDateItemType.HALFYEAR;
            else if (npt.endToken.isValue("ДЕСЯТИЛЕТИЕ", "ДЕСЯТИЛІТТЯ") || npt.endToken.isValue("ДЕКАДА", null)) 
                _typ = DateItemTokenDateItemType.TENYEARS;
            else if (npt.endToken.isValue("НАЧАЛО", "ПОЧАТОК")) 
                return DateItemToken._new984(t, npt.endToken, DateItemTokenDateItemType.POINTER, DatePointerType.BEGIN, "начало");
            else if (npt.endToken.isValue("СЕРЕДИНА", null)) 
                return DateItemToken._new984(t, npt.endToken, DateItemTokenDateItemType.POINTER, DatePointerType.CENTER, "середина");
            else if (npt.endToken.isValue("КОНЕЦ", null) || npt.endToken.isValue("КІНЕЦЬ", null) || npt.endToken.isValue("НАПРИКІНЕЦЬ", null)) 
                return DateItemToken._new984(t, npt.endToken, DateItemTokenDateItemType.POINTER, DatePointerType.END, "конец");
            else if (npt.endToken.isValue("ВРЕМЯ", null) && npt.adjectives.length > 0 && npt.endToken.previous.isValue("НАСТОЯЩЕЕ", null)) 
                return DateItemToken._new984(t, npt.endToken, DateItemTokenDateItemType.POINTER, DatePointerType.TODAY, "сегодня");
            else if (npt.endToken.isValue("ЧАС", null) && npt.adjectives.length > 0 && npt.endToken.previous.isValue("ДАНИЙ", null)) 
                return DateItemToken._new984(t, npt.endToken, DateItemTokenDateItemType.POINTER, DatePointerType.TODAY, "сегодня");
            if (_typ !== DateItemTokenDateItemType.NUMBER || detailRegime) {
                let delta = 0;
                let ok = false;
                if (npt.adjectives.length > 0) {
                    if (npt.adjectives[0].isValue("ПОСЛЕДНИЙ", "ОСТАННІЙ")) 
                        return DateItemToken._new996(t0, npt.endToken, _typ, (_typ === DateItemTokenDateItemType.QUARTAL ? 4 : (_typ === DateItemTokenDateItemType.TENYEARS ? 9 : 2)), DateItemTokenFirstLastTyp.LAST);
                    if (npt.adjectives[0].isValue("ПРЕДЫДУЩИЙ", "ПОПЕРЕДНІЙ") || npt.adjectives[0].isValue("ПРОШЛЫЙ", null)) 
                        delta = -1;
                    else if (npt.adjectives[0].isValue("СЛЕДУЮЩИЙ", null) || npt.adjectives[0].isValue("ПОСЛЕДУЮЩИЙ", null) || npt.adjectives[0].isValue("НАСТУПНИЙ", null)) 
                        delta = 1;
                    else if (npt.adjectives[0].isValue("ЭТОТ", "ЦЕЙ") || npt.adjectives[0].isValue("ТЕКУЩИЙ", "ПОТОЧНИЙ")) 
                        delta = 0;
                    else 
                        return null;
                    ok = true;
                }
                else if (npt.beginToken.isValue("ЭТОТ", "ЦЕЙ")) 
                    ok = true;
                let cou = 0;
                for (let tt = t.previous; tt !== null; tt = tt.previous) {
                    if (cou > 200) 
                        break;
                    let dr = Utils.as(tt.getReferent(), DateRangeReferent);
                    if (dr === null) 
                        continue;
                    if (_typ === DateItemTokenDateItemType.QUARTAL) {
                        let ii = dr.quarterNumber;
                        if (ii < 1) 
                            continue;
                        ii += delta;
                        if ((ii < 1) || ii > 4) 
                            continue;
                        return DateItemToken._new976(t0, npt.endToken, _typ, ii);
                    }
                    if (_typ === DateItemTokenDateItemType.HALFYEAR) {
                        let ii = dr.halfyearNumber;
                        if (ii < 1) 
                            continue;
                        ii += delta;
                        if ((ii < 1) || ii > 2) 
                            continue;
                        return DateItemToken._new976(t0, npt.endToken, _typ, ii);
                    }
                }
                if (ok && _typ === DateItemTokenDateItemType.TENYEARS) 
                    return DateItemToken._new999(t0, npt.endToken, _typ, delta, true);
            }
        }
        let term = t0.term;
        if (!Utils.isLetterOrDigit(term[0])) {
            if (t0.isCharOf(".\\/:") || t0.isHiphen) 
                return DateItemToken._new1000(t0, t0, DateItemTokenDateItemType.DELIM, term);
            else if (t0.isChar(',')) 
                return DateItemToken._new1000(t0, t0, DateItemTokenDateItemType.DELIM, term);
            else 
                return null;
        }
        if (term === "O" || term === "О") {
            if ((t.next instanceof NumberToken) && !t.isWhitespaceAfter && t.next.value.length === 1) 
                return DateItemToken._new976(t, t.next, DateItemTokenDateItemType.NUMBER, t.next.intValue);
        }
        if (Utils.isLetter(term[0])) {
            let inf = DateItemToken.m_Monthes.tryParse(t, TerminParseAttr.NO);
            if (inf !== null && inf.termin.tag === null) 
                inf = DateItemToken.m_Monthes.tryParse(inf.endToken.next, TerminParseAttr.NO);
            if (inf !== null && ((typeof inf.termin.tag === 'number' || inf.termin.tag instanceof Number))) 
                return DateItemToken._new1003(inf.beginToken, inf.endToken, DateItemTokenDateItemType.MONTH, inf.termin.tag, inf.termin.lang);
        }
        return null;
    }
    
    static initialize() {
        if (DateItemToken.m_NewAge !== null) 
            return;
        DateItemToken.m_NewAge = new TerminCollection();
        let tt = Termin._new1004("НОВАЯ ЭРА", MorphLang.RU, true, "НОВОЙ ЭРЫ");
        tt.addVariant("НАША ЭРА", true);
        tt.addAbridge("Н.Э.");
        DateItemToken.m_NewAge.add(tt);
        tt = Termin._new1004("НОВА ЕРА", MorphLang.UA, true, "НОВОЇ ЕРИ");
        tt.addVariant("НАША ЕРА", true);
        tt.addAbridge("Н.Е.");
        DateItemToken.m_NewAge.add(tt);
        tt = new Termin("РОЖДЕСТВО ХРИСТОВО", MorphLang.RU, true);
        tt.addAbridge("Р.Х.");
        DateItemToken.m_NewAge.add(tt);
        tt = new Termin("РІЗДВА ХРИСТОВОГО", MorphLang.UA, true);
        tt.addAbridge("Р.Х.");
        DateItemToken.m_NewAge.add(tt);
        DateItemToken.m_Seasons = new TerminCollection();
        DateItemToken.m_Seasons.add(Termin._new850("ЗИМА", MorphLang.RU, true, DatePointerType.WINTER));
        DateItemToken.m_Seasons.add(Termin._new850("WINTER", MorphLang.EN, true, DatePointerType.WINTER));
        let t = Termin._new850("ВЕСНА", MorphLang.RU, true, DatePointerType.SPRING);
        t.addVariant("ПРОВЕСНА", true);
        DateItemToken.m_Seasons.add(t);
        DateItemToken.m_Seasons.add(Termin._new850("SPRING", MorphLang.EN, true, DatePointerType.SPRING));
        t = Termin._new850("ЛЕТО", MorphLang.RU, true, DatePointerType.SUMMER);
        DateItemToken.m_Seasons.add(t);
        t = Termin._new850("ЛІТО", MorphLang.UA, true, DatePointerType.SUMMER);
        DateItemToken.m_Seasons.add(t);
        t = Termin._new850("ОСЕНЬ", MorphLang.RU, true, DatePointerType.AUTUMN);
        DateItemToken.m_Seasons.add(t);
        t = Termin._new850("AUTUMN", MorphLang.EN, true, DatePointerType.AUTUMN);
        DateItemToken.m_Seasons.add(t);
        t = Termin._new850("ОСІНЬ", MorphLang.UA, true, DatePointerType.AUTUMN);
        DateItemToken.m_Seasons.add(t);
        DateItemToken.m_Monthes = new TerminCollection();
        let months = ["ЯНВАРЬ", "ФЕВРАЛЬ", "МАРТ", "АПРЕЛЬ", "МАЙ", "ИЮНЬ", "ИЮЛЬ", "АВГУСТ", "СЕНТЯБРЬ", "ОКТЯБРЬ", "НОЯБРЬ", "ДЕКАБРЬ"];
        for (let i = 0; i < months.length; i++) {
            t = Termin._new850(months[i], MorphLang.RU, true, i + 1);
            DateItemToken.m_Monthes.add(t);
        }
        months = ["СІЧЕНЬ", "ЛЮТИЙ", "БЕРЕЗЕНЬ", "КВІТЕНЬ", "ТРАВЕНЬ", "ЧЕРВЕНЬ", "ЛИПЕНЬ", "СЕРПЕНЬ", "ВЕРЕСЕНЬ", "ЖОВТЕНЬ", "ЛИСТОПАД", "ГРУДЕНЬ"];
        for (let i = 0; i < months.length; i++) {
            t = Termin._new850(months[i], MorphLang.UA, true, i + 1);
            DateItemToken.m_Monthes.add(t);
        }
        months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        for (let i = 0; i < months.length; i++) {
            t = Termin._new850(months[i], MorphLang.EN, true, i + 1);
            DateItemToken.m_Monthes.add(t);
        }
        months = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GUINGO", "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE"];
        for (let i = 0; i < months.length; i++) {
            t = Termin._new850(months[i], MorphLang.IT, true, i + 1);
            DateItemToken.m_Monthes.add(t);
        }
        for (const m of ["ЯНВ", "ФЕВ", "ФЕВР", "МАР", "АПР", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "СЕНТ", "ОКТ", "НОЯ", "НОЯБ", "ДЕК", "JAN", "FEB", "MAR", "APR", "JUN", "JUL", "AUG", "SEP", "SEPT", "OCT", "NOV", "DEC"]) {
            for (const ttt of DateItemToken.m_Monthes.termins) {
                if (ttt.terms[0].canonicalText.startsWith(m)) {
                    ttt.addAbridge(m);
                    DateItemToken.m_Monthes.reindex(ttt);
                    break;
                }
            }
        }
        for (const m of ["OF"]) {
            DateItemToken.m_Monthes.add(new Termin(m, MorphLang.EN, true));
        }
        DateItemToken.m_EmptyWords = new Hashtable();
        DateItemToken.m_EmptyWords.put("IN", MorphLang.EN);
        DateItemToken.m_EmptyWords.put("SINCE", MorphLang.EN);
        DateItemToken.m_EmptyWords.put("THE", MorphLang.EN);
        DateItemToken.m_EmptyWords.put("NEL", MorphLang.IT);
        DateItemToken.m_EmptyWords.put("DEL", MorphLang.IT);
        DateItemToken.m_EmptyWords.put("IL", MorphLang.IT);
        DateItemToken.DAYS_OF_WEEK = new TerminCollection();
        let te = Termin._new850("SUNDAY", MorphLang.EN, true, 7);
        te.addAbridge("SUN");
        te.addVariant("ВОСКРЕСЕНЬЕ", true);
        te.addVariant("ВОСКРЕСЕНИЕ", true);
        te.addAbridge("ВС");
        te.addVariant("НЕДІЛЯ", true);
        DateItemToken.DAYS_OF_WEEK.add(te);
        te = Termin._new850("MONDAY", MorphLang.EN, true, 1);
        te.addAbridge("MON");
        te.addVariant("ПОНЕДЕЛЬНИК", true);
        te.addAbridge("ПОН");
        te.addVariant("ПОНЕДІЛОК", true);
        DateItemToken.DAYS_OF_WEEK.add(te);
        te = Termin._new850("TUESDAY", MorphLang.EN, true, 2);
        te.addAbridge("TUE");
        te.addVariant("ВТОРНИК", true);
        te.addAbridge("ВТ");
        te.addVariant("ВІВТОРОК", true);
        DateItemToken.DAYS_OF_WEEK.add(te);
        te = Termin._new850("WEDNESDAY", MorphLang.EN, true, 3);
        te.addAbridge("WED");
        te.addVariant("СРЕДА", true);
        te.addAbridge("СР");
        te.addVariant("СЕРЕДА", true);
        DateItemToken.DAYS_OF_WEEK.add(te);
        te = Termin._new850("THURSDAY", MorphLang.EN, true, 4);
        te.addAbridge("THU");
        te.addVariant("ЧЕТВЕРГ", true);
        te.addAbridge("ЧТ");
        te.addVariant("ЧЕТВЕР", true);
        DateItemToken.DAYS_OF_WEEK.add(te);
        te = Termin._new850("FRIDAY", MorphLang.EN, true, 5);
        te.addAbridge("FRI");
        te.addVariant("ПЯТНИЦА", true);
        te.addAbridge("ПТ");
        te.addVariant("ПЯТНИЦЯ", true);
        DateItemToken.DAYS_OF_WEEK.add(te);
        te = Termin._new850("SATURDAY", MorphLang.EN, true, 6);
        te.addAbridge("SAT");
        te.addVariant("СУББОТА", true);
        te.addAbridge("СБ");
        te.addVariant("СУБОТА", true);
        DateItemToken.DAYS_OF_WEEK.add(te);
    }
    
    static testYearRusWord(t0, ignoreNewline = false) {
        let tt = t0;
        if (tt === null) 
            return null;
        if (tt.isValue("ГОД", null) || tt.isValue("РІК", null)) 
            return tt;
        if (!ignoreNewline && tt.previous !== null && tt.isNewlineBefore) 
            return null;
        if ((tt.isValue("Г", null) && tt.next !== null && tt.next.isCharOf("\\/.")) && tt.next.next !== null && tt.next.next.isValue("Б", null)) 
            return null;
        if (((tt.morph.language.isRu && ((tt.isValue("ГГ", null) || tt.isValue("Г", null))))) || ((tt.morph.language.isUa && ((tt.isValue("Р", null) || tt.isValue("РР", null)))))) {
            if (tt.next !== null && tt.next.isChar('.')) {
                tt = tt.next;
                if ((tt.next !== null && (tt.whitespacesAfterCount < 4) && ((((tt.next.isValue("Г", null) && tt.next.morph.language.isRu)) || ((tt.next.morph.language.isUa && tt.next.isValue("Р", null)))))) && tt.next.next !== null && tt.next.next.isChar('.')) 
                    tt = tt.next.next;
                return tt;
            }
            else 
                return tt;
        }
        return null;
    }
    
    static tryParseList(t, maxCount = 20) {
        let p = DateItemToken.tryParse(t, null, false);
        if (p === null) 
            return null;
        if (p.typ === DateItemTokenDateItemType.DELIM) 
            return null;
        let res = new Array();
        res.push(p);
        let tt = p.endToken.next;
        while (tt !== null) {
            if (tt instanceof TextToken) {
                if (tt.checkValue(DateItemToken.m_EmptyWords) !== null) {
                    tt = tt.next;
                    continue;
                }
            }
            let p0 = DateItemToken.tryParse(tt, res, false);
            if (p0 === null) {
                if (tt.isNewlineBefore) 
                    break;
                if (tt.chars.isLatinLetter) 
                    break;
                let mc = tt.getMorphClassInDictionary();
                if (((mc.isAdjective || mc.isPronoun)) && !mc.isVerb && !mc.isAdverb) {
                    tt = tt.next;
                    continue;
                }
                if (tt.isValue("В", null)) {
                    p0 = DateItemToken.tryParse(tt.next, res, false);
                    if (p0 !== null && p0.canBeYear) 
                        p0.beginToken = tt;
                    else 
                        p0 = null;
                }
                if (p0 === null) 
                    break;
            }
            if (tt.isNewlineBefore) {
                if (p.typ === DateItemTokenDateItemType.MONTH && p0.canBeYear) {
                }
                else if (p.typ === DateItemTokenDateItemType.NUMBER && p.canBeDay && p0.typ === DateItemTokenDateItemType.MONTH) {
                }
                else 
                    break;
            }
            if (p0.canBeYear && p0.typ === DateItemTokenDateItemType.NUMBER) {
                if (p.typ === DateItemTokenDateItemType.HALFYEAR || p.typ === DateItemTokenDateItemType.QUARTAL) 
                    p0.typ = DateItemTokenDateItemType.YEAR;
                else if (p.typ === DateItemTokenDateItemType.POINTER && p0.intValue > 1990) 
                    p0.typ = DateItemTokenDateItemType.YEAR;
            }
            p = p0;
            res.push(p);
            if (maxCount > 0 && res.length >= maxCount) 
                break;
            tt = p.endToken.next;
        }
        for (let i = res.length - 1; i >= 0; i--) {
            if (res[i].typ === DateItemTokenDateItemType.DELIM) 
                res.splice(i, 1);
            else 
                break;
        }
        if (res.length > 0 && res[res.length - 1].typ === DateItemTokenDateItemType.NUMBER) {
            let nex = NumberHelper.tryParseNumberWithPostfix(res[res.length - 1].beginToken);
            if (nex !== null && nex.exTyp !== NumberExType.HOUR) {
                if (res.length > 3 && res[res.length - 2].typ === DateItemTokenDateItemType.DELIM && res[res.length - 2].stringValue === ":") {
                }
                else if (res[res.length - 1].canBeYear && nex.endToken === res[res.length - 1].endToken) {
                }
                else 
                    res.splice(res.length - 1, 1);
            }
        }
        if (res.length === 0) 
            return null;
        for (let i = 1; i < (res.length - 1); i++) {
            if (res[i].typ === DateItemTokenDateItemType.DELIM && res[i].beginToken.isComma) {
                if ((i === 1 && res[i - 1].typ === DateItemTokenDateItemType.MONTH && res[i + 1].canBeYear) && (i + 1) === (res.length - 1)) 
                    res.splice(i, 1);
            }
        }
        if (res[res.length - 1].typ === DateItemTokenDateItemType.NUMBER) {
            let rr = res[res.length - 1];
            if (rr.canBeYear && res.length > 1 && res[res.length - 2].typ === DateItemTokenDateItemType.MONTH) {
            }
            else {
                let npt = NounPhraseHelper.tryParse(rr.beginToken, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.endChar > rr.endChar) {
                    res.splice(res.length - 1, 1);
                    if (res.length > 0 && res[res.length - 1].typ === DateItemTokenDateItemType.DELIM) 
                        res.splice(res.length - 1, 1);
                }
            }
        }
        if (res.length === 0) 
            return null;
        if (res.length === 2 && !res[0].isWhitespaceAfter) {
            if (!res[0].isWhitespaceBefore && !res[1].isWhitespaceAfter) 
                return null;
        }
        if (res.length === 1 && (res[0].tag instanceof DateItemTokenFirstLastTyp) && (DateItemTokenFirstLastTyp.of(res[0].tag)) === DateItemTokenFirstLastTyp.LAST) 
            return null;
        return res;
    }
    
    static _new973(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.lTyp = _arg4;
        res.intValue = _arg5;
        return res;
    }
    
    static _new974(_arg1, _arg2, _arg3, _arg4) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ptr = _arg4;
        return res;
    }
    
    static _new975(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.intValue = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new976(_arg1, _arg2, _arg3, _arg4) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.intValue = _arg4;
        return res;
    }
    
    static _new982(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.intValue = _arg4;
        res.newAge = _arg5;
        return res;
    }
    
    static _new984(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ptr = _arg4;
        res.stringValue = _arg5;
        return res;
    }
    
    static _new996(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.intValue = _arg4;
        res.tag = _arg5;
        return res;
    }
    
    static _new999(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.intValue = _arg4;
        res.relate = _arg5;
        return res;
    }
    
    static _new1000(_arg1, _arg2, _arg3, _arg4) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.stringValue = _arg4;
        return res;
    }
    
    static _new1003(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new DateItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.intValue = _arg4;
        res.lang = _arg5;
        return res;
    }
    
    static _new1149(_arg1, _arg2, _arg3) {
        let res = new DateItemToken(_arg1, _arg2);
        res.intValue = _arg3;
        return res;
    }
    
    static static_constructor() {
        DateItemToken.SPEED_REGIME = false;
        DateItemToken.DAYS_OF_WEEK = null;
        DateItemToken.m_NewAge = null;
        DateItemToken.m_Monthes = null;
        DateItemToken.m_Seasons = null;
        DateItemToken.m_EmptyWords = null;
    }
}


DateItemToken.static_constructor();

module.exports = DateItemToken