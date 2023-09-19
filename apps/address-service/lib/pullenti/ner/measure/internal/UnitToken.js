/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const Token = require("./../../Token");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const TextToken = require("./../../TextToken");
const UnitsFactors = require("./UnitsFactors");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MorphGender = require("./../../../morph/MorphGender");
const MorphNumber = require("./../../../morph/MorphNumber");
const MetaToken = require("./../../MetaToken");
const NumberSpellingType = require("./../../NumberSpellingType");
const Referent = require("./../../Referent");
const MiscHelper = require("./../../core/MiscHelper");
const MeasureKind = require("./../MeasureKind");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const Unit = require("./Unit");
const UnitsHelper = require("./UnitsHelper");
const MeasureHelper = require("./MeasureHelper");
const UnitReferent = require("./../UnitReferent");
const NumberToken = require("./../../NumberToken");
const NumberHelper = require("./../../core/NumberHelper");
const MeasureReferent = require("./../MeasureReferent");

class UnitToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.unit = null;
        this.pow = 1;
        this.isDoubt = false;
        this.keyword = null;
        this.extOnto = null;
        this.unknownName = null;
    }
    
    toString() {
        let res = (this.unknownName != null ? this.unknownName : ((this.extOnto === null ? this.unit.toString() : this.extOnto.toString())));
        if (this.pow !== 1) 
            res = (res + "<" + this.pow + ">");
        if (this.isDoubt) 
            res += "?";
        if (this.keyword !== null) 
            res = (res + " (<-" + this.keyword.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false) + ")");
        return res;
    }
    
    static canBeEquals(ut1, ut2) {
        if (ut1.length !== ut2.length) 
            return false;
        for (let i = 0; i < ut1.length; i++) {
            if (ut1[i].unit !== ut2[i].unit || ut1[i].extOnto !== ut2[i].extOnto) 
                return false;
            if (ut1[i].pow !== ut2[i].pow) 
                return false;
        }
        return true;
    }
    
    static calcKind(units) {
        if (units === null || units.length === 0) 
            return MeasureKind.UNDEFINED;
        let u0 = units[0];
        if (u0.unit === null) 
            return MeasureKind.UNDEFINED;
        if (units.length === 1) {
            if (u0.pow === 1) 
                return u0.unit.kind;
            if (u0.pow === 2) {
                if (u0.unit.kind === MeasureKind.LENGTH) 
                    return MeasureKind.AREA;
            }
            if (u0.pow === 3) {
                if (u0.unit.kind === MeasureKind.LENGTH) 
                    return MeasureKind.VOLUME;
            }
            return MeasureKind.UNDEFINED;
        }
        if (units.length === 2) {
            if (units[1].unit === null) 
                return MeasureKind.UNDEFINED;
            if ((u0.unit.kind === MeasureKind.LENGTH && u0.pow === 1 && units[1].unit.kind === MeasureKind.TIME) && units[1].pow === -1) 
                return MeasureKind.SPEED;
        }
        return MeasureKind.UNDEFINED;
    }
    
    static _createReferent(u) {
        let ur = new UnitReferent();
        ur.addSlot(UnitReferent.ATTR_NAME, u.nameCyr, false, 0);
        ur.addSlot(UnitReferent.ATTR_NAME, u.nameLat, false, 0);
        ur.addSlot(UnitReferent.ATTR_FULLNAME, u.fullnameCyr, false, 0);
        ur.addSlot(UnitReferent.ATTR_FULLNAME, u.fullnameLat, false, 0);
        ur.tag = u;
        ur.m_Unit = u;
        return ur;
    }
    
    createReferentWithRegister(ad) {
        let ur = this.extOnto;
        if (this.unit !== null) 
            ur = UnitToken._createReferent(this.unit);
        else if (this.unknownName !== null) {
            ur = new UnitReferent();
            ur.addSlot(UnitReferent.ATTR_NAME, this.unknownName, false, 0);
            ur.isUnknown = true;
        }
        if (this.pow !== 1) 
            ur.addSlot(UnitReferent.ATTR_POW, this.pow.toString(), false, 0);
        let owns = new Array();
        owns.push(ur);
        if (this.unit !== null) {
            for (let uu = this.unit.baseUnit; uu !== null; uu = uu.baseUnit) {
                let ur0 = UnitToken._createReferent(uu);
                owns.push(ur0);
            }
        }
        for (let i = owns.length - 1; i >= 0; i--) {
            if (ad !== null) 
                owns[i] = Utils.as(ad.registerReferent(owns[i]), UnitReferent);
            if (i > 0) {
                owns[i - 1].addSlot(UnitReferent.ATTR_BASEUNIT, owns[i], false, 0);
                if (owns[i - 1].tag.baseMultiplier !== 0) 
                    owns[i - 1].addSlot(UnitReferent.ATTR_BASEFACTOR, NumberHelper.doubleToString(owns[i - 1].tag.baseMultiplier), false, 0);
            }
        }
        return owns[0];
    }
    
    static tryParseList(t, addUnits, parseUnknownUnits = false) {
        let ut = UnitToken.tryParse(t, addUnits, null, parseUnknownUnits);
        if (ut === null) 
            return null;
        let res = new Array();
        res.push(ut);
        for (let tt = ut.endToken.next; tt !== null; tt = tt.next) {
            if (tt.whitespacesBeforeCount > 2) 
                break;
            ut = UnitToken.tryParse(tt, addUnits, res[res.length - 1], true);
            if (ut === null) {
                if (tt.isCharOf("\\/") && tt.next !== null && tt.next.isChar('(')) {
                    let li = UnitToken.tryParseList(tt.next.next, addUnits, parseUnknownUnits);
                    if (li !== null && li[li.length - 1].endToken.next !== null && li[li.length - 1].endToken.next.isChar(')')) {
                        for (const v of li) {
                            v.pow = -v.pow;
                            res.push(v);
                        }
                        li[li.length - 1].endToken = li[li.length - 1].endToken.next;
                    }
                }
                if (tt.isCharOf("\\/") || tt.isHiphen) {
                    if (!tt.isWhitespaceAfter && !tt.isWhitespaceBefore && res.length === 1) {
                        if (res[0].isDoubt || res[0].lengthChar === 1 || res[0].unit === null) {
                            if (!(tt.next instanceof NumberToken)) 
                                return null;
                        }
                    }
                }
                break;
            }
            if (ut.unit === null && ut.isWhitespaceBefore) 
                break;
            if (ut.unit !== null && ut.unit.kind !== MeasureKind.UNDEFINED) {
                if (res[res.length - 1].unit !== null && res[res.length - 1].unit.kind === ut.unit.kind) 
                    break;
            }
            res.push(ut);
            tt = ut.endToken;
            if (res.length > 2) 
                break;
        }
        for (let i = 0; i < res.length; i++) {
            if (res[i].unit !== null && res[i].unit.baseUnit !== null && res[i].unit.multUnit !== null) {
                let ut2 = new UnitToken(res[i].beginToken, res[i].endToken);
                ut2.unit = res[i].unit.multUnit;
                res.splice(i + 1, 0, ut2);
                res[i].unit = res[i].unit.baseUnit;
            }
        }
        for (let i = res.length - 1; i > 0; i--) {
            let r = res[i];
            if ((r.isDoubt && r.beginToken === r.endToken && r.unit === null) && !r.beginToken.getMorphClassInDictionary().isUndefined) 
                res.splice(i, 1);
            else 
                break;
        }
        if (res.length > 1) {
            for (const r of res) {
                r.isDoubt = false;
            }
        }
        return res;
    }
    
    static tryParse(t, addUnits, prev, parseUnknownUnits = false) {
        if (t === null) 
            return null;
        let t0 = t;
        let _pow = 1;
        let isNeg = false;
        if ((t.isCharOf("\\/") || t.isValue("НА", null) || t.isValue("OF", null)) || t.isValue("PER", null)) {
            if (prev === null) 
                return null;
            isNeg = true;
            t = t.next;
        }
        else if (t.isValue("В", null) && prev !== null) {
            isNeg = true;
            t = t.next;
        }
        else if (MeasureHelper.isMultChar(t)) 
            t = t.next;
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        if (tt.term === "КВ" || tt.term === "КВАДР" || tt.isValue("КВАДРАТНЫЙ", null)) {
            _pow = 2;
            tt = Utils.as(tt.next, TextToken);
            if (tt !== null && tt.isChar('.')) 
                tt = Utils.as(tt.next, TextToken);
            if (tt === null) 
                return null;
        }
        else if (tt.term === "КУБ" || tt.term === "КУБИЧ" || tt.isValue("КУБИЧЕСКИЙ", null)) {
            _pow = 3;
            tt = Utils.as(tt.next, TextToken);
            if (tt !== null && tt.isChar('.')) 
                tt = Utils.as(tt.next, TextToken);
            if (tt === null) 
                return null;
        }
        else if (tt.term === "µ") {
            let res = UnitToken.tryParse(tt.next, addUnits, prev, false);
            if (res !== null) {
                for (const u of UnitsHelper.UNITS) {
                    if (u.factor === UnitsFactors.MICRO && Utils.compareStrings("мк" + u.nameCyr, res.unit.nameCyr, true) === 0) {
                        res.unit = u;
                        res.beginToken = tt;
                        res.pow = _pow;
                        if (isNeg) 
                            res.pow = -_pow;
                        res._correct();
                        return res;
                    }
                }
            }
        }
        let toks = UnitsHelper.TERMINS.tryParseAll(tt, TerminParseAttr.NO);
        if (toks !== null) {
            if ((prev !== null && tt === t0 && toks.length === 1) && t.isWhitespaceBefore) 
                return null;
            if ((toks[0].lengthChar === 1 && tt.chars.isAllUpper && !toks[0].isWhitespaceAfter) && (toks[0].endToken.next instanceof NumberToken)) 
                return null;
            if (tt.isValue("BA", null) && tt.kit.baseLanguage.isEn) 
                return null;
            if (toks[0].beginToken === toks[0].endToken && tt.morph._class.isPreposition && (tt.whitespacesAfterCount < 3)) {
                if (NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.PARSEPREPOSITION, 0, null) !== null) 
                    return null;
                if (tt.next instanceof NumberToken) {
                    if (tt.next.typ !== NumberSpellingType.DIGIT) 
                        return null;
                }
                let nex = UnitToken.tryParse(tt.next, addUnits, null, false);
                if (nex !== null) 
                    return null;
            }
            if (toks[0].beginToken.lengthChar === 1 && toks[0].beginToken.chars.isAllLower) {
                if (toks[0].beginToken === toks[0].endToken || ((toks[0].endToken.isChar('.') && toks[0].beginToken.next === toks[0].endToken))) {
                    if (toks[0].beginToken.isValue("М", null) || toks[0].beginToken.isValue("M", null)) {
                        if (prev !== null && prev.unit !== null && prev.unit.kind === MeasureKind.LENGTH) {
                            let res = UnitToken._new1609(t0, toks[0].endToken, UnitsHelper.UMINUTE);
                            res.pow = _pow;
                            if (isNeg) 
                                res.pow = -_pow;
                            res._correct();
                            return res;
                        }
                    }
                    if (toks[0].beginToken.isValue("S", null) || toks[0].beginToken.isValue("С", null)) {
                        if (prev !== null && prev.unit !== null && ((prev.unit.kind === MeasureKind.LENGTH || isNeg))) {
                            let res = UnitToken._new1609(t0, toks[0].endToken, UnitsHelper.USEC);
                            res.pow = _pow;
                            if (isNeg) 
                                res.pow = -_pow;
                            res._correct();
                            return res;
                        }
                    }
                }
            }
            let uts = new Array();
            for (const tok of toks) {
                let res = UnitToken._new1609(t0, tok.endToken, Utils.as(tok.termin.tag, Unit));
                res.pow = _pow;
                if (isNeg) 
                    res.pow = -_pow;
                if (res.unit.baseMultiplier === 1000000 && (t0 instanceof TextToken) && Utils.isLowerCase(t0.getSourceText()[0])) {
                    for (const u of UnitsHelper.UNITS) {
                        if (u.factor === UnitsFactors.MILLI && Utils.compareStrings(u.nameCyr, res.unit.nameCyr, true) === 0) {
                            res.unit = u;
                            break;
                        }
                    }
                }
                res._correct();
                res._checkDoubt();
                uts.push(res);
            }
            let max = 0;
            let best = null;
            for (const ut of uts) {
                if (ut.keyword !== null) {
                    if (ut.keyword.beginChar >= max) {
                        max = ut.keyword.beginChar;
                        best = ut;
                    }
                }
            }
            if (best !== null) 
                return best;
            for (const ut of uts) {
                if (!ut.isDoubt) 
                    return ut;
            }
            return uts[0];
        }
        let t1 = null;
        if (t.isCharOf("º°")) 
            t1 = t;
        else if ((t.isChar('<') && t.next !== null && t.next.next !== null) && t.next.next.isChar('>') && (((t.next.isValue("О", null) || t.next.isValue("O", null) || t.next.isCharOf("º°")) || (((t.next instanceof NumberToken) && t.next.value === "0"))))) 
            t1 = t.next.next;
        if (t1 !== null) {
            let res = UnitToken._new1609(t0, t1, UnitsHelper.UGRADUS);
            res._checkDoubt();
            t = t1.next;
            if (t !== null && t.isComma) 
                t = t.next;
            if (t !== null && t.isValue("ПО", null)) 
                t = t.next;
            if (t instanceof TextToken) {
                let vv = t.term;
                if (vv === "C" || vv === "С" || vv.startsWith("ЦЕЛЬС")) {
                    res.unit = UnitsHelper.UGRADUSC;
                    res.isDoubt = false;
                    res.endToken = t;
                }
                if (vv === "F" || vv.startsWith("ФАР")) {
                    res.unit = UnitsHelper.UGRADUSF;
                    res.isDoubt = false;
                    res.endToken = t;
                }
            }
            return res;
        }
        if ((t instanceof TextToken) && ((t.isValue("ОС", null) || t.isValue("OC", null)))) {
            let str = t.getSourceText();
            if (str === "оС" || str === "oC") {
                let res = UnitToken._new1741(t, t, UnitsHelper.UGRADUSC, false);
                return res;
            }
        }
        if (t.isChar('%')) {
            let tt1 = t.next;
            if (tt1 !== null && tt1.isChar('(')) 
                tt1 = tt1.next;
            if ((tt1 instanceof TextToken) && ((tt1.isValue("ОБ", null) || tt1.isValue("ОБОРОТ", null)))) {
                let re = UnitToken._new1609(t, tt1, UnitsHelper.UALCO);
                if (re.endToken.next !== null && re.endToken.next.isChar('.')) 
                    re.endToken = re.endToken.next;
                if (re.endToken.next !== null && re.endToken.next.isChar(')') && t.next.isChar('(')) 
                    re.endToken = re.endToken.next;
                return re;
            }
            return UnitToken._new1609(t, t, UnitsHelper.UPERCENT);
        }
        if (addUnits !== null) {
            let tok = addUnits.tryParse(t, TerminParseAttr.NO);
            if (tok !== null) {
                let res = UnitToken._new1744(t0, tok.endToken, Utils.as(tok.termin.tag, UnitReferent));
                if (tok.endToken.next !== null && tok.endToken.next.isChar('.')) 
                    tok.endToken = tok.endToken.next;
                res.pow = _pow;
                if (isNeg) 
                    res.pow = -_pow;
                res._correct();
                return res;
            }
        }
        if (!parseUnknownUnits) 
            return null;
        if ((t.whitespacesBeforeCount > 2 || !t.chars.isLetter || t.lengthChar > 5) || !(t instanceof TextToken)) 
            return null;
        if (MiscHelper.canBeStartOfSentence(t)) 
            return null;
        t1 = t;
        if (t.next !== null && t.next.isChar('.')) 
            t1 = t;
        let ok = false;
        if (t1.next === null || t1.whitespacesAfterCount > 2) 
            ok = true;
        else if (t1.next.isComma || t1.next.isCharOf("\\/") || t1.next.isTableControlChar) 
            ok = true;
        else if (MeasureHelper.isMultChar(t1.next)) 
            ok = true;
        if (!ok) 
            return null;
        let mc = t.getMorphClassInDictionary();
        if (mc.isUndefined) {
        }
        else if (t.lengthChar > 7) 
            return null;
        let res1 = UnitToken._new1745(t0, t1, _pow, true);
        if (isNeg) 
            res1.pow = -_pow;
        res1.unknownName = t.getSourceText();
        if (prev !== null && res1.unknownName === "d") 
            res1.unit = UnitsHelper.UDAY;
        res1._correct();
        return res1;
    }
    
    _correct() {
        let t = this.endToken.next;
        if (t === null) 
            return;
        let num = 0;
        let neg = this.pow < 0;
        if (t.isChar('³')) 
            num = 3;
        else if (t.isChar('²')) 
            num = 2;
        else if (!t.isWhitespaceBefore && (t instanceof NumberToken) && ((t.value === "3" || t.value === "2"))) 
            num = t.intValue;
        else if ((t.isChar('<') && (t.next instanceof NumberToken) && t.next.intValue !== null) && t.next.next !== null && t.next.next.isChar('>')) {
            num = t.next.intValue;
            t = t.next.next;
        }
        else if (((t.isChar('<') && t.next !== null && t.next.isHiphen) && (t.next.next instanceof NumberToken) && t.next.next.intValue !== null) && t.next.next.next !== null && t.next.next.next.isChar('>')) {
            num = t.next.next.intValue;
            neg = true;
            t = t.next.next.next;
        }
        else {
            if (t.isValue("B", null) && t.next !== null) 
                t = t.next;
            if ((t.isValue("КВ", null) || t.isValue("КВАДР", null) || t.isValue("КВАДРАТНЫЙ", null)) || t.isValue("КВАДРАТ", null)) {
                num = 2;
                if (t.next !== null && t.next.isChar('.')) 
                    t = t.next;
            }
            else if (t.isValue("КУБ", null) || t.isValue("КУБИЧ", null) || t.isValue("КУБИЧЕСКИЙ", null)) {
                num = 3;
                if (t.next !== null && t.next.isChar('.')) 
                    t = t.next;
            }
        }
        if (num !== 0) {
            this.pow = num;
            if (neg) 
                this.pow = -num;
            this.endToken = t;
        }
        t = this.endToken.next;
        if ((t !== null && t.isValue("ПО", null) && t.next !== null) && t.next.isValue("U", null)) 
            this.endToken = t.next;
    }
    
    _checkDoubt() {
        this.isDoubt = false;
        if (this.pow !== 1) 
            return;
        if ((this.beginToken.lengthChar < 3) || this.beginToken.isValue("ARE", null)) {
            this.isDoubt = true;
            if ((this.beginToken.chars.isCapitalUpper || this.beginToken.chars.isAllUpper || this.beginToken.chars.isLastLower) || this.beginToken.chars.isAllLower) {
                if (this.beginToken.lengthChar === 2 && (this.beginToken.previous instanceof NumberToken) && (this.beginToken.whitespacesBeforeCount < 2)) 
                    this.isDoubt = false;
            }
            else if (this.unit.psevdo.length > 0) {
            }
            else 
                this.isDoubt = false;
        }
        let cou = 0;
        for (let t = this.beginToken.previous; t !== null && (cou < 30); t = t.previous,cou++) {
            let mr = Utils.as(t.getReferent(), MeasureReferent);
            if (mr !== null) {
                for (const s of mr.slots) {
                    if (s.value instanceof UnitReferent) {
                        let ur = Utils.as(s.value, UnitReferent);
                        for (let u = this.unit; u !== null; u = u.baseUnit) {
                            if (ur.findSlot(UnitReferent.ATTR_NAME, u.nameCyr, true) !== null) 
                                this.isDoubt = false;
                            else if (this.unit.psevdo.length > 0) {
                                for (const uu of this.unit.psevdo) {
                                    if (ur.findSlot(UnitReferent.ATTR_NAME, uu.nameCyr, true) !== null) {
                                        this.unit = uu;
                                        this.isDoubt = false;
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (!(t instanceof TextToken) || (t.lengthChar < 3)) 
                continue;
            for (let u = this.unit; u !== null; u = u.baseUnit) {
                for (const k of u.keywords) {
                    if (t.isValue(k, null)) {
                        this.keyword = t;
                        this.isDoubt = false;
                        return;
                    }
                }
                for (const uu of u.psevdo) {
                    for (const k of uu.keywords) {
                        if (t.isValue(k, null)) {
                            this.unit = uu;
                            this.keyword = t;
                            this.isDoubt = false;
                            return;
                        }
                    }
                }
            }
        }
    }
    
    static outUnits(units) {
        if (units === null || units.length === 0) 
            return null;
        let res = new StringBuilder();
        res.append(units[0].unit.nameCyr);
        if (units[0].pow !== 1) 
            res.append("<").append(units[0].pow).append(">");
        for (let i = 1; i < units.length; i++) {
            let mnem = units[i].unit.nameCyr;
            let _pow = units[i].pow;
            if (_pow < 0) {
                res.append("/").append(mnem);
                if (_pow !== -1) 
                    res.append("<").append((-_pow)).append(">");
            }
            else {
                res.append("*").append(mnem);
                if (_pow > 1) 
                    res.append("<").append(_pow).append(">");
            }
        }
        return res.toString();
    }
    
    static _new1609(_arg1, _arg2, _arg3) {
        let res = new UnitToken(_arg1, _arg2);
        res.unit = _arg3;
        return res;
    }
    
    static _new1741(_arg1, _arg2, _arg3, _arg4) {
        let res = new UnitToken(_arg1, _arg2);
        res.unit = _arg3;
        res.isDoubt = _arg4;
        return res;
    }
    
    static _new1744(_arg1, _arg2, _arg3) {
        let res = new UnitToken(_arg1, _arg2);
        res.extOnto = _arg3;
        return res;
    }
    
    static _new1745(_arg1, _arg2, _arg3, _arg4) {
        let res = new UnitToken(_arg1, _arg2);
        res.pow = _arg3;
        res.isDoubt = _arg4;
        return res;
    }
}


module.exports = UnitToken