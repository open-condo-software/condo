/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphClass = require("./../../../morph/MorphClass");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const NumberParseAttr = require("./../../core/NumberParseAttr");
const MorphGender = require("./../../../morph/MorphGender");
const MorphNumber = require("./../../../morph/MorphNumber");
const MorphologyService = require("./../../../morph/MorphologyService");
const MetaToken = require("./../../MetaToken");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumberHelper = require("./../../core/NumberHelper");
const TextToken = require("./../../TextToken");
const MeasureKind = require("./../MeasureKind");
const MeasureHelper = require("./MeasureHelper");
const Referent = require("./../../Referent");
const MeasureReferent = require("./../MeasureReferent");
const ReferentToken = require("./../../ReferentToken");
const Unit = require("./Unit");
const UnitsHelper = require("./UnitsHelper");
const NumberToken = require("./../../NumberToken");
const NumbersWithUnitTokenDiapTyp = require("./NumbersWithUnitTokenDiapTyp");
const NumberWithUnitParseAttr = require("./NumberWithUnitParseAttr");
const UnitToken = require("./UnitToken");

// Это для моделирования разных числовых диапазонов + единицы изменерия
class NumbersWithUnitToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.singleVal = null;
        this.plusMinus = null;
        this.plusMinusPercent = false;
        this.fromInclude = false;
        this.fromVal = null;
        this.toInclude = false;
        this.toVal = null;
        this.about = false;
        this.not = false;
        this.wHL = null;
        this.units = new Array();
        this.divNum = null;
        this.isAge = false;
    }
    
    toString() {
        return this.toStringEx(false);
    }
    
    toStringEx(ignoreUnits = false) {
        let res = new StringBuilder();
        if (this.singleVal !== null) {
            if (this.plusMinus !== null) 
                res.append("[").append(this.singleVal).append(" ±").append(this.plusMinus).append((this.plusMinusPercent ? "%" : "")).append("]");
            else 
                res.append(this.singleVal);
        }
        else {
            if (this.fromVal !== null) 
                res.append((this.fromInclude ? '[' : ']')).append(this.fromVal);
            else 
                res.append("]");
            res.append(" .. ");
            if (this.toVal !== null) 
                res.append(this.toVal).append((this.toInclude ? ']' : '['));
            else 
                res.append("[");
        }
        if (!ignoreUnits) {
            for (const u of this.units) {
                res.append(" ").append(u.toString());
            }
        }
        if (this.divNum !== null) {
            res.append(" / ");
            res.append(this.divNum);
        }
        return res.toString();
    }
    
    createRefenetsTokensWithRegister(ad, name, regist = true) {
        if (name === "T =") 
            name = "ТЕМПЕРАТУРА";
        let res = new Array();
        for (const u of this.units) {
            let rt = new ReferentToken(u.createReferentWithRegister(ad), u.beginToken, u.endToken);
            res.push(rt);
        }
        let mr = new MeasureReferent();
        let templ = "1";
        if (this.singleVal !== null) {
            mr.addValue(this.singleVal);
            if (this.plusMinus !== null) {
                templ = ("[1 ±2" + (this.plusMinusPercent ? "%" : "") + "]");
                mr.addValue(this.plusMinus);
            }
            else if (this.about) 
                templ = "~1";
        }
        else {
            if (this.not && ((this.fromVal === null || this.toVal === null))) {
                let b = this.fromInclude;
                this.fromInclude = this.toInclude;
                this.toInclude = b;
                let v = this.fromVal;
                this.fromVal = this.toVal;
                this.toVal = v;
            }
            let num = 1;
            if (this.fromVal !== null) {
                mr.addValue(this.fromVal);
                templ = (this.fromInclude ? "[1" : "]1");
                num++;
            }
            else 
                templ = "]";
            if (this.toVal !== null) {
                mr.addValue(this.toVal);
                templ = (templ + " .. " + num + (this.toInclude ? ']' : '['));
            }
            else 
                templ += " .. [";
        }
        mr.template = templ;
        for (const rt of res) {
            mr.addSlot(MeasureReferent.ATTR_UNIT, rt.referent, false, 0);
        }
        if (name !== null) 
            mr.addSlot(MeasureReferent.ATTR_NAME, name, false, 0);
        if (this.divNum !== null) {
            let dn = this.divNum.createRefenetsTokensWithRegister(ad, null, true);
            res.splice(res.length, 0, ...dn);
            mr.addSlot(MeasureReferent.ATTR_REF, dn[dn.length - 1].referent, false, 0);
        }
        let ki = UnitToken.calcKind(this.units);
        if (ki !== MeasureKind.UNDEFINED) 
            mr.kind = ki;
        if (regist && ad !== null) 
            mr = Utils.as(ad.registerReferent(mr), MeasureReferent);
        res.push(new ReferentToken(mr, this.beginToken, this.endToken));
        return res;
    }
    
    static tryParseMulti(t, addUnits, attrs = NumberWithUnitParseAttr.NO) {
        if (t === null || (t instanceof ReferentToken)) 
            return null;
        let tt0 = t;
        if (tt0.isChar('(')) {
            let whd = NumbersWithUnitToken._tryParseWHL(tt0);
            if (whd !== null) 
                tt0 = whd.endToken;
            let res0 = NumbersWithUnitToken.tryParseMulti(tt0.next, addUnits, attrs);
            if (res0 !== null) {
                res0[0].wHL = whd;
                let tt2 = res0[res0.length - 1].endToken.next;
                if (tt2 !== null && tt2.isCharOf(",")) 
                    tt2 = tt2.next;
                if (whd !== null) 
                    return res0;
                if (tt2 !== null && tt2.isChar(')')) {
                    res0[res0.length - 1].endToken = tt2;
                    return res0;
                }
            }
        }
        let mt = NumbersWithUnitToken.tryParse(t, addUnits, attrs);
        if (mt === null) 
            return null;
        let res = new Array();
        let nnn = null;
        if (mt.whitespacesAfterCount < 2) {
            if (MeasureHelper.isMultChar(mt.endToken.next)) 
                nnn = mt.endToken.next.next;
            else if ((mt.endToken instanceof NumberToken) && MeasureHelper.isMultChar(mt.endToken.endToken)) 
                nnn = mt.endToken.next;
        }
        if (nnn !== null) {
            let mt2 = NumbersWithUnitToken.tryParse(nnn, addUnits, NumberWithUnitParseAttr.NO);
            if (mt2 !== null) {
                let mt3 = null;
                nnn = null;
                if (mt2.whitespacesAfterCount < 2) {
                    if (MeasureHelper.isMultChar(mt2.endToken.next)) 
                        nnn = mt2.endToken.next.next;
                    else if ((mt2.endToken instanceof NumberToken) && MeasureHelper.isMultChar(mt2.endToken.endToken)) 
                        nnn = mt2.endToken.next;
                }
                if (nnn !== null) 
                    mt3 = NumbersWithUnitToken.tryParse(nnn, addUnits, NumberWithUnitParseAttr.NO);
                if (mt3 === null) {
                    let tt2 = mt2.endToken.next;
                    if (tt2 !== null && !tt2.isWhitespaceBefore) {
                        if (!tt2.isCharOf(",.;")) 
                            return null;
                    }
                }
                if (mt3 !== null && mt3.units.length > 0) {
                    if (mt2.units.length === 0) 
                        mt2.units = mt3.units;
                }
                res.push(mt);
                if (mt2 !== null) {
                    if (mt2.units.length > 0 && mt.units.length === 0) 
                        mt.units = mt2.units;
                    res.push(mt2);
                    if (mt3 !== null) 
                        res.push(mt3);
                }
                return res;
            }
        }
        if ((!mt.isWhitespaceAfter && MeasureHelper.isMultCharEnd(mt.endToken.next) && (mt.endToken.next.next instanceof NumberToken)) && mt.units.length === 0) {
            let utxt = mt.endToken.next.term;
            utxt = utxt.substring(0, 0 + utxt.length - 1);
            let terms = UnitsHelper.TERMINS.findTerminsByString(utxt, null);
            if (terms !== null && terms.length > 0) {
                mt.units.push(UnitToken._new1609(mt.endToken.next, mt.endToken.next, Utils.as(terms[0].tag, Unit)));
                mt.endToken = mt.endToken.next;
                let res1 = NumbersWithUnitToken.tryParseMulti(mt.endToken.next, addUnits, NumberWithUnitParseAttr.NO);
                if (res1 !== null) {
                    res1.splice(0, 0, mt);
                    return res1;
                }
            }
        }
        res.push(mt);
        return res;
    }
    
    static tryParse(t, addUnits, attrs = NumberWithUnitParseAttr.NO) {
        if (t === null) 
            return null;
        let res = NumbersWithUnitToken._tryParse(t, addUnits, attrs);
        if (res !== null && (((attrs.value()) & (NumberWithUnitParseAttr.NOT.value()))) === (NumberWithUnitParseAttr.NOT.value())) 
            res.not = true;
        return res;
    }
    
    static _isMinOrMax(t, res) {
        if (t === null) 
            return null;
        if (t.isValue("МИНИМАЛЬНЫЙ", null) || t.isValue("МИНИМУМ", null) || t.isValue("MINIMUM", null)) {
            res.value = -1;
            return t;
        }
        if (t.isValue("MIN", null) || t.isValue("МИН", null)) {
            res.value = -1;
            if (t.next !== null && t.next.isChar('.')) 
                t = t.next;
            return t;
        }
        if (t.isValue("МАКСИМАЛЬНЫЙ", null) || t.isValue("МАКСИМУМ", null) || t.isValue("MAXIMUM", null)) {
            res.value = 1;
            return t;
        }
        if (t.isValue("MAX", null) || t.isValue("МАКС", null) || t.isValue("МАХ", null)) {
            res.value = 1;
            if (t.next !== null && t.next.isChar('.')) 
                t = t.next;
            return t;
        }
        if (t.isChar('(')) {
            t = NumbersWithUnitToken._isMinOrMax(t.next, res);
            if (t !== null && t.next !== null && t.next.isChar(')')) 
                t = t.next;
            return t;
        }
        return null;
    }
    
    static _tryParse(t, addUnits, attrs) {
        if (t === null) 
            return null;
        while (t !== null) {
            if (t.isCommaAnd || t.isValue("НО", null)) 
                t = t.next;
            else 
                break;
        }
        let t0 = t;
        let _about = false;
        let hasKeyw = false;
        let isDiapKeyw = false;
        let minMax = 0;
        let wrapminMax1617 = new RefOutArgWrapper(minMax);
        let ttt = NumbersWithUnitToken._isMinOrMax(t, wrapminMax1617);
        minMax = wrapminMax1617.value;
        if (ttt !== null) {
            t = ttt.next;
            if (t === null) 
                return null;
        }
        if (t === null) 
            return null;
        if (t.isChar('~') || t.isValue("ОКОЛО", null) || t.isValue("ПРИМЕРНО", null)) {
            t = t.next;
            _about = true;
            hasKeyw = true;
            if (t === null) 
                return null;
        }
        if (t.isValue("В", null) && t.next !== null) {
            if (t.next.isValue("ПРЕДЕЛ", null) || t.next.isValue("ДИАПАЗОН", null) || t.next.isValue("ТЕЧЕНИЕ", null)) {
                t = t.next.next;
                if (t === null) 
                    return null;
                isDiapKeyw = true;
            }
        }
        if (t0.isChar('(')) {
            let mt0 = NumbersWithUnitToken._tryParse(t.next, addUnits, NumberWithUnitParseAttr.NO);
            if (mt0 !== null && mt0.endToken.next !== null && mt0.endToken.next.isChar(')')) {
                if ((((attrs.value()) & (NumberWithUnitParseAttr.ISSECOND.value()))) !== (NumberWithUnitParseAttr.NO.value())) {
                    if (mt0.fromVal !== null && mt0.toVal !== null && mt0.fromVal === (-mt0.toVal)) {
                    }
                    else 
                        return null;
                }
                mt0.beginToken = t0;
                mt0.endToken = mt0.endToken.next;
                let uu = UnitToken.tryParseList(mt0.endToken.next, addUnits, false);
                if (uu !== null && mt0.units.length === 0) {
                    mt0.units = uu;
                    mt0.endToken = uu[uu.length - 1].endToken;
                }
                return mt0;
            }
        }
        let plusminus = false;
        let unitBefore = false;
        let _isAge = false;
        let dty = NumbersWithUnitTokenDiapTyp.UNDEFINED;
        let whd = null;
        let uni = null;
        let tok = (NumbersWithUnitToken.m_Termins === null ? null : NumbersWithUnitToken.m_Termins.tryParse(t, TerminParseAttr.NO));
        if (tok !== null) {
            if (t.isValue("С", null)) {
                let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.PARSENUMERICASADJECTIVE, 0, null);
                if (npt !== null && npt.morph._case.isInstrumental) 
                    return null;
            }
            if (tok.endToken.isValue("СТАРШЕ", null) || tok.endToken.isValue("МЛАДШЕ", null)) 
                _isAge = true;
            t = tok.endToken.next;
            dty = NumbersWithUnitTokenDiapTyp.of(tok.termin.tag);
            hasKeyw = true;
            if (!tok.isWhitespaceAfter) {
                if (t === null) 
                    return null;
                if (t instanceof NumberToken) {
                    if (tok.beginToken === tok.endToken && !tok.chars.isAllLower) 
                        return null;
                }
                else if (t.isComma && t.next !== null && t.next.isValue("ЧЕМ", null)) {
                    t = t.next.next;
                    if (t !== null && t.morph._class.isPreposition) 
                        t = t.next;
                }
                else if (t.isCharOf(":,(") || t.isTableControlChar) {
                }
                else 
                    return null;
            }
            if (t !== null && t.isChar('(')) {
                uni = UnitToken.tryParseList(t.next, addUnits, false);
                if (uni !== null) {
                    t = uni[uni.length - 1].endToken.next;
                    while (t !== null) {
                        if (t.isCharOf("):")) 
                            t = t.next;
                        else 
                            break;
                    }
                    let mt0 = NumbersWithUnitToken._tryParse(t, addUnits, NumberWithUnitParseAttr.of((attrs.value()) & (NumberWithUnitParseAttr.CANOMITNUMBER.value())));
                    if (mt0 !== null && mt0.units.length === 0) {
                        mt0.beginToken = t0;
                        mt0.units = uni;
                        return mt0;
                    }
                }
                whd = NumbersWithUnitToken._tryParseWHL(t);
                if (whd !== null) 
                    t = whd.endToken.next;
            }
            else if (t !== null && t.isValue("IP", null)) {
                uni = UnitToken.tryParseList(t, addUnits, false);
                if (uni !== null) 
                    t = uni[uni.length - 1].endToken.next;
            }
            if ((t !== null && t.isHiphen && t.isWhitespaceBefore) && t.isWhitespaceAfter) 
                t = t.next;
        }
        else if (t.isChar('<')) {
            dty = NumbersWithUnitTokenDiapTyp.LS;
            t = t.next;
            hasKeyw = true;
            if (t !== null && t.isChar('=')) {
                t = t.next;
                dty = NumbersWithUnitTokenDiapTyp.LE;
            }
        }
        else if (t.isChar('>')) {
            dty = NumbersWithUnitTokenDiapTyp.GT;
            t = t.next;
            hasKeyw = true;
            if (t !== null && t.isChar('=')) {
                t = t.next;
                dty = NumbersWithUnitTokenDiapTyp.GE;
            }
        }
        else if (t.isChar('≤')) {
            dty = NumbersWithUnitTokenDiapTyp.LE;
            hasKeyw = true;
            t = t.next;
        }
        else if (t.isChar('≥')) {
            dty = NumbersWithUnitTokenDiapTyp.GE;
            hasKeyw = true;
            t = t.next;
        }
        else if (t.isValue("IP", null)) {
            uni = UnitToken.tryParseList(t, addUnits, false);
            if (uni !== null) 
                t = uni[uni.length - 1].endToken.next;
        }
        else if (t.isValue("ЗА", null) && (t.next instanceof NumberToken)) {
            dty = NumbersWithUnitTokenDiapTyp.GE;
            t = t.next;
        }
        while (t !== null && (((t.isCharOf(":,") || t.isValue("ЧЕМ", null) || ((t.getMorphClassInDictionary().isPreposition && t !== t0))) || t.isTableControlChar))) {
            t = t.next;
        }
        let second = (((attrs.value()) & (NumberWithUnitParseAttr.ISSECOND.value()))) !== (NumberWithUnitParseAttr.NO.value());
        if (t !== null) {
            if (t.isChar('+') || t.isValue("ПЛЮС", null)) {
                t = t.next;
                if (t !== null && !t.isWhitespaceBefore) {
                    if (t.isHiphen) {
                        t = t.next;
                        plusminus = true;
                    }
                    else if ((t.isCharOf("\\/") && t.next !== null && !t.isNewlineAfter) && t.next.isHiphen) {
                        t = t.next.next;
                        plusminus = true;
                    }
                }
            }
            else if (second && (t.isCharOf("\\/÷…~"))) 
                t = t.next;
            else if ((t.isHiphen && t === t0 && !second) && NumbersWithUnitToken.m_Termins.tryParse(t.next, TerminParseAttr.NO) !== null) {
                tok = NumbersWithUnitToken.m_Termins.tryParse(t.next, TerminParseAttr.NO);
                t = tok.endToken.next;
                dty = NumbersWithUnitTokenDiapTyp.of(tok.termin.tag);
            }
            else if (t.isHiphen && t === t0 && ((t.isWhitespaceAfter || second))) 
                t = t.next;
            else if (t.isChar('±')) {
                t = t.next;
                plusminus = true;
                hasKeyw = true;
            }
            else if ((second && t.isChar('.') && t.next !== null) && t.next.isChar('.')) {
                t = t.next.next;
                if (t !== null && t.isChar('.')) 
                    t = t.next;
            }
        }
        let num = NumberHelper.tryParseRealNumber(t, NumberParseAttr.NO);
        if (num === null) {
            uni = UnitToken.tryParseList(t, addUnits, false);
            if (uni !== null) {
                unitBefore = true;
                t = uni[uni.length - 1].endToken.next;
                let delim = false;
                while (t !== null) {
                    if (t.isCharOf(":,")) {
                        delim = true;
                        t = t.next;
                    }
                    else if (t.isHiphen && t.isWhitespaceAfter) {
                        delim = true;
                        t = t.next;
                    }
                    else 
                        break;
                }
                if (!delim) {
                    if (t === null) {
                        if (hasKeyw && (((attrs.value()) & (((NumberWithUnitParseAttr.CANBENON.value()) | (NumberWithUnitParseAttr.CANOMITNUMBER.value()))))) !== (NumberWithUnitParseAttr.NO.value())) {
                        }
                        else 
                            return null;
                    }
                    else if (!t.isWhitespaceBefore) 
                        return null;
                    if ((t !== null && t.next !== null && t.isHiphen) && t.isWhitespaceAfter) {
                        delim = true;
                        t = t.next;
                    }
                }
                num = NumberHelper.tryParseRealNumber(t, NumberParseAttr.NO);
                if (num !== null && num.isNewlineBefore) 
                    return null;
            }
        }
        let res = null;
        let rval = 0;
        if (num === null) {
            let tt = NumbersWithUnitToken.m_Spec.tryParse(t, TerminParseAttr.NO);
            if (tt !== null) {
                rval = tt.termin.tag;
                let unam = String(tt.termin.tag2);
                for (const u of UnitsHelper.UNITS) {
                    if (u.fullnameCyr === unam) {
                        uni = new Array();
                        uni.push(UnitToken._new1609(t, t, u));
                        break;
                    }
                }
                if (uni === null) 
                    return null;
                res = NumbersWithUnitToken._new1611(t0, tt.endToken, _about);
                t = tt.endToken.next;
            }
            else {
                if ((((attrs.value()) & (NumberWithUnitParseAttr.CANOMITNUMBER.value()))) === (NumberWithUnitParseAttr.NO.value()) && !hasKeyw && (((attrs.value()) & (NumberWithUnitParseAttr.CANBENON.value()))) === (NumberWithUnitParseAttr.NO.value())) 
                    return null;
                if ((uni !== null && uni.length === 1 && uni[0].beginToken === uni[0].endToken) && uni[0].lengthChar > 3) {
                    rval = 1;
                    res = NumbersWithUnitToken._new1611(t0, uni[uni.length - 1].endToken, _about);
                    t = res.endToken.next;
                }
                else if (hasKeyw && (((attrs.value()) & (NumberWithUnitParseAttr.CANBENON.value()))) !== (NumberWithUnitParseAttr.NO.value())) {
                    rval = Number.NaN;
                    res = NumbersWithUnitToken._new1611(t0, t0, _about);
                    if (t !== null) 
                        res.endToken = t.previous;
                    else 
                        for (t = t0; t !== null; t = t.next) {
                            res.endToken = t;
                        }
                }
                else 
                    return null;
            }
        }
        else {
            if ((t === t0 && t0.isHiphen && !t.isWhitespaceBefore) && !t.isWhitespaceAfter && (num.realValue < 0)) {
                num = NumberHelper.tryParseRealNumber(t.next, NumberParseAttr.NO);
                if (num === null) 
                    return null;
            }
            if (t === t0 && (t instanceof NumberToken) && t.morph._class.isAdjective) {
                let nn = Utils.as(t.endToken, TextToken);
                if (nn === null) 
                    return null;
                let norm = nn.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                if ((norm.endsWith("Ь") || norm === "ЧЕТЫРЕ" || norm === "ТРИ") || norm === "ДВА") {
                }
                else 
                    try {
                        let mi = MorphologyService.getWordBaseInfo("КОКО" + nn.term, null, false, false);
                        if (mi._class.isAdjective) 
                            return null;
                    } catch (ex1614) {
                    }
            }
            t = num.endToken.next;
            res = NumbersWithUnitToken._new1611(t0, num.endToken, _about);
            rval = num.realValue;
            if (res.endToken.next !== null && res.endToken.next.isChar('(') && (res.endToken.next.next instanceof NumberToken)) {
                let nn = Utils.as(res.endToken.next.next, NumberToken);
                if (nn.value === num.value && nn.endToken.next !== null && nn.endToken.next.isChar(')')) 
                    res.endToken = nn.endToken.next;
            }
            if (t !== null && t.isValue("И", null) && t.next !== null) {
                if (t.next.isValue("БОЛЕЕ", null) || t.next.isValue("БОЛЬШЕ", null)) {
                    dty = NumbersWithUnitTokenDiapTyp.GE;
                    res.endToken = t.next;
                    t = res.endToken.next;
                }
                else if (t.next.isValue("МЕНЕЕ", null) || t.next.isValue("МЕНЬШЕ", null)) {
                    dty = NumbersWithUnitTokenDiapTyp.LE;
                    res.endToken = t.next;
                    t = res.endToken.next;
                }
            }
        }
        if (uni === null) {
            uni = UnitToken.tryParseList(t, addUnits, false);
            if (uni !== null) {
                if ((plusminus && second && uni.length >= 1) && uni[0].unit === UnitsHelper.UPERCENT) {
                    res.endToken = uni[0].endToken;
                    res.plusMinusPercent = true;
                    let tt1 = uni[0].endToken.next;
                    uni = UnitToken.tryParseList(tt1, addUnits, false);
                    if (uni !== null) {
                        res.units = uni;
                        res.endToken = uni[uni.length - 1].endToken;
                    }
                }
                else {
                    res.units = uni;
                    res.endToken = uni[uni.length - 1].endToken;
                }
                t = res.endToken.next;
                if ((t !== null && t.isValue("И", null) && t.next !== null) && dty === NumbersWithUnitTokenDiapTyp.UNDEFINED) {
                    if (NumbersWithUnitToken._tryParse(t.next, addUnits, attrs) === null) {
                        if (t.next.isValue("БОЛЕЕ", null) || t.next.isValue("БОЛЬШЕ", null)) {
                            dty = NumbersWithUnitTokenDiapTyp.GE;
                            res.endToken = t.next;
                            t = res.endToken.next;
                        }
                        else if (t.next.isValue("МЕНЕЕ", null) || t.next.isValue("МЕНЬШЕ", null)) {
                            dty = NumbersWithUnitTokenDiapTyp.LE;
                            res.endToken = t.next;
                            t = res.endToken.next;
                        }
                    }
                }
            }
        }
        else {
            res.units = uni;
            if (uni.length > 1) {
                let uni1 = UnitToken.tryParseList(t, addUnits, false);
                if (((uni1 !== null && uni1[0].unit === uni[0].unit && (uni1.length < uni.length)) && uni[uni1.length].pow === -1 && uni1[uni1.length - 1].endToken.next !== null) && uni1[uni1.length - 1].endToken.next.isCharOf("/\\")) {
                    let num2 = NumbersWithUnitToken._tryParse(uni1[uni1.length - 1].endToken.next.next, addUnits, NumberWithUnitParseAttr.NO);
                    if (num2 !== null && num2.units !== null && num2.units[0].unit === uni[uni1.length].unit) {
                        res.units = uni1;
                        res.divNum = num2;
                        res.endToken = num2.endToken;
                    }
                }
            }
        }
        res.wHL = whd;
        if (dty !== NumbersWithUnitTokenDiapTyp.UNDEFINED) {
            if (dty === NumbersWithUnitTokenDiapTyp.GE || dty === NumbersWithUnitTokenDiapTyp.FROM) {
                res.fromInclude = true;
                res.fromVal = rval;
            }
            else if (dty === NumbersWithUnitTokenDiapTyp.GT) {
                res.fromInclude = false;
                res.fromVal = rval;
            }
            else if (dty === NumbersWithUnitTokenDiapTyp.LE || dty === NumbersWithUnitTokenDiapTyp.TO) {
                res.toInclude = true;
                res.toVal = rval;
            }
            else if (dty === NumbersWithUnitTokenDiapTyp.LS) {
                res.toInclude = false;
                res.toVal = rval;
            }
        }
        let isSecondMax = false;
        if (!second) {
            let iii = 0;
            let wrapiii1616 = new RefOutArgWrapper(iii);
            ttt = NumbersWithUnitToken._isMinOrMax(t, wrapiii1616);
            iii = wrapiii1616.value;
            if (ttt !== null && iii > 0) {
                isSecondMax = true;
                t = ttt.next;
            }
        }
        let _next = null;
        if (second || plusminus || ((t !== null && ((t.isTableControlChar || t.isNewlineBefore))))) {
        }
        else {
            let a = NumberWithUnitParseAttr.ISSECOND;
            if ((((attrs.value()) & (NumberWithUnitParseAttr.CANBENON.value()))) !== (NumberWithUnitParseAttr.NO.value())) 
                a = NumberWithUnitParseAttr.of((a.value()) | (NumberWithUnitParseAttr.CANBENON.value()));
            _next = NumbersWithUnitToken._tryParse(t, addUnits, a);
        }
        if (_next !== null && (t.previous instanceof NumberToken)) {
            if (MeasureHelper.isMultChar(t.previous.endToken)) 
                _next = null;
        }
        if (_next !== null && ((_next.toVal !== null || _next.singleVal !== null)) && _next.fromVal === null) {
            if ((((_next.beginToken.isChar('+') && _next.singleVal !== null && !isNaN(_next.singleVal)) && _next.endToken.next !== null && _next.endToken.next.isCharOf("\\/")) && _next.endToken.next.next !== null && _next.endToken.next.next.isHiphen) && !hasKeyw && !isNaN(rval)) {
                let next2 = NumbersWithUnitToken._tryParse(_next.endToken.next.next.next, addUnits, NumberWithUnitParseAttr.ISSECOND);
                if (next2 !== null && next2.singleVal !== null && !isNaN(next2.singleVal)) {
                    res.fromVal = rval - next2.singleVal;
                    res.fromInclude = true;
                    res.toVal = rval + _next.singleVal;
                    res.toInclude = true;
                    if (next2.units !== null && res.units.length === 0) 
                        res.units = next2.units;
                    res.endToken = next2.endToken;
                    return res;
                }
            }
            if (_next.units.length > 0) {
                if (res.units.length === 0) 
                    res.units = _next.units;
                else if (!UnitToken.canBeEquals(res.units, _next.units)) 
                    _next = null;
            }
            else if (res.units.length > 0 && !unitBefore && !_next.plusMinusPercent) 
                _next = null;
            if (_next !== null) 
                res.endToken = _next.endToken;
            if (_next !== null && _next.toVal !== null) {
                res.toVal = _next.toVal;
                res.toInclude = _next.toInclude;
            }
            else if (_next !== null && _next.singleVal !== null) {
                if (_next.beginToken.isCharOf("/\\")) {
                    res.divNum = _next;
                    res.singleVal = rval;
                    return res;
                }
                else if (_next.plusMinusPercent) {
                    res.singleVal = rval;
                    res.plusMinus = _next.singleVal;
                    res.plusMinusPercent = true;
                    res.toInclude = true;
                }
                else {
                    res.toVal = _next.singleVal;
                    res.toInclude = true;
                }
            }
            if (_next !== null) {
                if (res.fromVal === null) {
                    res.fromVal = rval;
                    res.fromInclude = true;
                }
                return res;
            }
        }
        else if ((_next !== null && _next.fromVal !== null && _next.toVal !== null) && _next.toVal === (-_next.fromVal)) {
            if (_next.units.length === 1 && _next.units[0].unit === UnitsHelper.UPERCENT && res.units.length > 0) {
                res.singleVal = rval;
                res.plusMinus = _next.toVal;
                res.plusMinusPercent = true;
                res.endToken = _next.endToken;
                return res;
            }
            if (_next.units.length === 0) {
                res.singleVal = rval;
                res.plusMinus = _next.toVal;
                res.endToken = _next.endToken;
                return res;
            }
            res.fromVal = _next.fromVal + rval;
            res.fromInclude = true;
            res.toVal = _next.toVal + rval;
            res.toInclude = true;
            res.endToken = _next.endToken;
            if (_next.units.length > 0) 
                res.units = _next.units;
            return res;
        }
        if (dty === NumbersWithUnitTokenDiapTyp.UNDEFINED) {
            if (plusminus && ((!res.plusMinusPercent || !second))) {
                res.fromInclude = true;
                res.fromVal = -rval;
                res.toInclude = true;
                res.toVal = rval;
            }
            else if (isDiapKeyw) {
                res.toInclude = true;
                res.toVal = rval;
            }
            else {
                res.singleVal = rval;
                res.plusMinusPercent = plusminus;
            }
        }
        if (_isAge) 
            res.isAge = true;
        return res;
    }
    
    static _tryParseWHL(t) {
        if (!(t instanceof TextToken)) 
            return null;
        if (t.isCharOf(":-")) {
            let re0 = NumbersWithUnitToken._tryParseWHL(t.next);
            if (re0 !== null) 
                return re0;
        }
        if (t.isCharOf("(")) {
            let re0 = NumbersWithUnitToken._tryParseWHL(t.next);
            if (re0 !== null) {
                if (re0.endToken.next !== null && re0.endToken.next.isChar(')')) {
                    re0.beginToken = t;
                    re0.endToken = re0.endToken.next;
                    return re0;
                }
            }
        }
        let txt = t.term;
        let nams = null;
        if (txt.length === 5 && ((txt[1] === 'Х' || txt[1] === 'X')) && ((txt[3] === 'Х' || txt[3] === 'X'))) {
            nams = new Array();
            for (let i = 0; i < 3; i++) {
                let ch = txt[i * 2];
                if (ch === 'Г') 
                    nams.push("ГЛУБИНА");
                else if (ch === 'В' || ch === 'H' || ch === 'Н') 
                    nams.push("ВЫСОТА");
                else if (ch === 'Ш' || ch === 'B' || ch === 'W') 
                    nams.push("ШИРИНА");
                else if (ch === 'Д' || ch === 'L') 
                    nams.push("ДЛИНА");
                else if (ch === 'D') 
                    nams.push("ДИАМЕТР");
                else 
                    return null;
            }
            return MetaToken._new806(t, t, nams);
        }
        let t0 = t;
        let t1 = t;
        for (; t !== null; t = t.next) {
            if (!(t instanceof TextToken) || ((t.whitespacesBeforeCount > 1 && t !== t0))) 
                break;
            let term = t.term;
            if (term.endsWith("X") || term.endsWith("Х")) 
                term = term.substring(0, 0 + term.length - 1);
            let nam = null;
            if (((t.isValue("ДЛИНА", null) || t.isValue("ДЛИННА", null) || term === "Д") || term === "ДЛ" || term === "ДЛИН") || term === "L") 
                nam = "ДЛИНА";
            else if (((t.isValue("ШИРИНА", null) || t.isValue("ШИРОТА", null) || term === "Ш") || term === "ШИР" || term === "ШИРИН") || term === "W" || term === "B") 
                nam = "ШИРИНА";
            else if ((t.isValue("ГЛУБИНА", null) || term === "Г" || term === "ГЛ") || term === "ГЛУБ") 
                nam = "ГЛУБИНА";
            else if ((t.isValue("ВЫСОТА", null) || term === "В" || term === "ВЫС") || term === "H" || term === "Н") 
                nam = "ВЫСОТА";
            else if (t.isValue("ДИАМЕТР", null) || term === "D" || term === "ДИАМ") 
                nam = "ДИАМЕТР";
            else 
                break;
            if (nams === null) 
                nams = new Array();
            nams.push(nam);
            t1 = t;
            if (t.next !== null && t.next.isChar('.')) 
                t1 = (t = t.next);
            if (t.next === null) 
                break;
            if (MeasureHelper.isMultChar(t.next) || t.next.isComma || t.next.isCharOf("\\/")) 
                t = t.next;
        }
        if (nams === null || (nams.length < 2)) 
            return null;
        return MetaToken._new806(t0, t1, nams);
    }
    
    static initialize() {
        if (NumbersWithUnitToken.m_Termins !== null) 
            return;
        NumbersWithUnitToken.m_Termins = new TerminCollection();
        let lss = ["МЕНЬШЕ", "МЕНЕ", "КОРОЧЕ", "МЕДЛЕННЕЕ", "НИЖЕ", "МЛАДШЕ", "ДЕШЕВЛЕ", "РЕЖЕ", "РАНЬШЕ", "РАНЕЕ"];
        let gts = ["БОЛЬШЕ", "ДЛИННЕЕ", "БЫСТРЕЕ", "БОЛЕ", "ЧАЩЕ", "ГЛУБЖЕ", "ВЫШЕ", "СВЫШЕ", "СТАРШЕ", "ДОЛЬШЕ", "ПОЗДНЕЕ", "ПОЗЖЕ", "ДОРОЖЕ", "ПРЕВЫШАТЬ"];
        let t = Termin._new170("МЕНЕЕ", NumbersWithUnitTokenDiapTyp.LS);
        for (const s of lss) {
            t.addVariant(s, false);
        }
        NumbersWithUnitToken.m_Termins.add(t);
        t = Termin._new170("НЕ МЕНЕЕ", NumbersWithUnitTokenDiapTyp.GE);
        for (const s of lss) {
            t.addVariant("НЕ " + s, false);
        }
        NumbersWithUnitToken.m_Termins.add(t);
        t = Termin._new170("БОЛЕЕ", NumbersWithUnitTokenDiapTyp.GT);
        for (const s of gts) {
            t.addVariant(s, false);
        }
        NumbersWithUnitToken.m_Termins.add(t);
        t = Termin._new170("НЕ БОЛЕЕ", NumbersWithUnitTokenDiapTyp.LE);
        for (const s of gts) {
            t.addVariant("НЕ " + s, false);
        }
        NumbersWithUnitToken.m_Termins.add(t);
        t = Termin._new170("ОТ", NumbersWithUnitTokenDiapTyp.FROM);
        t.addVariant("С", false);
        t.addVariant("C", false);
        t.addVariant("НАЧИНАЯ С", false);
        t.addVariant("НАЧИНАЯ ОТ", false);
        NumbersWithUnitToken.m_Termins.add(t);
        t = Termin._new170("ДО", NumbersWithUnitTokenDiapTyp.TO);
        t.addVariant("ПО", false);
        t.addVariant("ЗАКАНЧИВАЯ", false);
        NumbersWithUnitToken.m_Termins.add(t);
        t = Termin._new170("НЕ ХУЖЕ", NumbersWithUnitTokenDiapTyp.UNDEFINED);
        NumbersWithUnitToken.m_Termins.add(t);
        NumbersWithUnitToken.m_Spec = new TerminCollection();
        t = Termin._new349("ПОЛЛИТРА", 0.5, "литр");
        t.addVariant("ПОЛУЛИТРА", false);
        NumbersWithUnitToken.m_Spec.add(t);
        t = Termin._new349("ПОЛКИЛО", 0.5, "килограмм");
        t.addVariant("ПОЛКИЛОГРАММА", false);
        NumbersWithUnitToken.m_Spec.add(t);
        t = Termin._new349("ПОЛМЕТРА", 0.5, "метр");
        t.addVariant("ПОЛУМЕТРА", false);
        NumbersWithUnitToken.m_Spec.add(t);
        t = Termin._new349("ПОЛТОННЫ", 0.5, "тонна");
        t.addVariant("ПОЛУТОННЫ", false);
        NumbersWithUnitToken.m_Spec.add(t);
        NumbersWithUnitToken.m_Spec.add(t);
    }
    
    static _new1602(_arg1, _arg2, _arg3) {
        let res = new NumbersWithUnitToken(_arg1, _arg2);
        res.singleVal = _arg3;
        return res;
    }
    
    static _new1611(_arg1, _arg2, _arg3) {
        let res = new NumbersWithUnitToken(_arg1, _arg2);
        res.about = _arg3;
        return res;
    }
    
    static static_constructor() {
        NumbersWithUnitToken.m_Termins = null;
        NumbersWithUnitToken.m_Spec = null;
    }
}


NumbersWithUnitToken.static_constructor();

module.exports = NumbersWithUnitToken