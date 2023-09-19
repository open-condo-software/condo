/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const BracketParseAttr = require("./../BracketParseAttr");
const BracketHelper = require("./../BracketHelper");
const NumberParseAttr = require("./../NumberParseAttr");
const TerminToken = require("./../TerminToken");
const MorphLang = require("./../../../morph/MorphLang");
const Termin = require("./../Termin");
const TerminCollection = require("./../TerminCollection");
const PullentiNerCoreInternalResourceHelper = require("./PullentiNerCoreInternalResourceHelper");
const TerminParseAttr = require("./../TerminParseAttr");
const Token = require("./../../Token");
const NumberToken = require("./../../NumberToken");
const NumberExType = require("./../NumberExType");
const NumberSpellingType = require("./../../NumberSpellingType");
const TextToken = require("./../../TextToken");
const NumberExToken = require("./../NumberExToken");
const NumberHelper = require("./../NumberHelper");

class NumberExHelper {
    
    static tryParseNumberWithPostfix(t) {
        if (t === null) 
            return null;
        let t0 = t;
        let isDollar = null;
        if (t.lengthChar === 1 && t.next !== null) {
            if ((((isDollar = NumberHelper.isMoneyChar(t)))) !== null) 
                t = t.next;
        }
        let nt = Utils.as(t, NumberToken);
        if (nt === null) {
            if ((!(t.previous instanceof NumberToken) && t.isChar('(') && (t.next instanceof NumberToken)) && t.next.next !== null && t.next.next.isChar(')')) {
                let toks1 = NumberExHelper.m_Postfixes.tryParse(t.next.next.next, TerminParseAttr.NO);
                if (toks1 !== null && (NumberExType.of(toks1.termin.tag)) === NumberExType.MONEY) {
                    let nt0 = Utils.as(t.next, NumberToken);
                    let res = NumberExToken._new708(t, toks1.endToken, nt0.value, nt0.typ, NumberExType.MONEY, nt0.realValue, toks1.beginToken.morph);
                    return NumberExHelper._correctMoney(res, toks1.beginToken);
                }
            }
            let tt = Utils.as(t, TextToken);
            if (tt === null || !tt.morph._class.isAdjective) 
                return null;
            let val = tt.term;
            for (let i = 4; i < (val.length - 5); i++) {
                let v = val.substring(0, 0 + i);
                let li = NumberHelper.m_Nums.findTerminsByString(v, tt.morph.language);
                if (li === null) 
                    continue;
                let vv = val.substring(i);
                let lii = NumberExHelper.m_Postfixes.findTerminsByString(vv, tt.morph.language);
                if (lii !== null && lii.length > 0) {
                    let re = NumberExToken._new709(t, t, li[0].tag.toString(), NumberSpellingType.WORDS, NumberExType.of(lii[0].tag), t.morph);
                    NumberExHelper._correctExtTypes(re);
                    return re;
                }
                break;
            }
            return null;
        }
        if (t.next === null && isDollar === null) 
            return null;
        let f = nt.realValue;
        if (isNaN(f)) 
            return null;
        let t1 = nt.next;
        if (((t1 !== null && t1.isCharOf(",."))) || (((t1 instanceof NumberToken) && (t1.whitespacesBeforeCount < 3)))) {
            let d = 0;
            let tt11 = NumberHelper.tryParseRealNumber(nt, NumberParseAttr.CANNOTBEINTEGER);
            if (tt11 !== null) {
                t1 = tt11.endToken.next;
                f = tt11.realValue;
            }
        }
        if (t1 === null) {
            if (isDollar === null) 
                return null;
        }
        else if (t1.next !== null && t1.isValue("С", "З") && t1.next.isValue("ПОЛОВИНА", null)) {
            f += 0.5;
            t1 = t1.next.next;
        }
        else if ((t1.next !== null && t1.next.isValue("С", "З") && t1.next.next !== null) && t1.next.next.isValue("ПОЛОВИНА", null)) {
            f += 0.5;
            t1 = t1.next.next.next;
        }
        if (t1 !== null && t1.isHiphen && t1.next !== null) 
            t1 = t1.next;
        let det = false;
        let altf = f;
        if (((t1 instanceof NumberToken) && t1.previous !== null && t1.previous.isHiphen) && t1.intValue === 0 && t1.lengthChar === 2) 
            t1 = t1.next;
        if ((t1 !== null && t1.next !== null && t1.isChar('(')) && (((t1.next instanceof NumberToken) || t1.next.isValue("НОЛЬ", null))) && t1.next.next !== null) {
            let nt1 = Utils.as(t1.next, NumberToken);
            let val = 0;
            if (nt1 !== null) 
                val = nt1.realValue;
            if (Math.floor(f) === Math.floor(val)) {
                let ttt = t1.next.next;
                if (ttt.isChar(')')) {
                    t1 = ttt.next;
                    det = true;
                    if ((t1 instanceof NumberToken) && t1.intValue !== null && t1.intValue === 0) 
                        t1 = t1.next;
                }
                else if (((((ttt instanceof NumberToken) && (ttt.realValue < 100) && ttt.next !== null) && ttt.next.isChar('/') && ttt.next.next !== null) && ttt.next.next.getSourceText() === "100" && ttt.next.next.next !== null) && ttt.next.next.next.isChar(')')) {
                    let rest = NumberExHelper.getDecimalRest100(f);
                    if (ttt.intValue !== null && rest === ttt.intValue) {
                        t1 = ttt.next.next.next.next;
                        det = true;
                    }
                }
                else if ((ttt.isValue("ЦЕЛЫХ", null) && (ttt.next instanceof NumberToken) && ttt.next.next !== null) && ttt.next.next.next !== null && ttt.next.next.next.isChar(')')) {
                    let num2 = Utils.as(ttt.next, NumberToken);
                    altf = num2.realValue;
                    if (ttt.next.next.isValue("ДЕСЯТЫЙ", null)) 
                        altf /= (10);
                    else if (ttt.next.next.isValue("СОТЫЙ", null)) 
                        altf /= (100);
                    else if (ttt.next.next.isValue("ТЫСЯЧНЫЙ", null)) 
                        altf /= (1000);
                    else if (ttt.next.next.isValue("ДЕСЯТИТЫСЯЧНЫЙ", null)) 
                        altf /= (10000);
                    else if (ttt.next.next.isValue("СТОТЫСЯЧНЫЙ", null)) 
                        altf /= (100000);
                    else if (ttt.next.next.isValue("МИЛЛИОННЫЙ", null)) 
                        altf /= (1000000);
                    if (altf < 1) {
                        altf += val;
                        t1 = ttt.next.next.next.next;
                        det = true;
                    }
                }
                else {
                    let toks1 = NumberExHelper.m_Postfixes.tryParse(ttt, TerminParseAttr.NO);
                    if (toks1 !== null) {
                        if ((NumberExType.of(toks1.termin.tag)) === NumberExType.MONEY) {
                            if (toks1.endToken.next !== null && toks1.endToken.next.isChar(')')) {
                                let res = NumberExToken._new710(t, toks1.endToken.next, nt.value, nt.typ, NumberExType.MONEY, f, altf, toks1.beginToken.morph);
                                return NumberExHelper._correctMoney(res, toks1.beginToken);
                            }
                        }
                    }
                    let res2 = NumberExHelper.tryParseNumberWithPostfix(t1.next);
                    if (res2 !== null && res2.endToken.next !== null && res2.endToken.next.isChar(')')) {
                        res2.beginToken = t;
                        res2.endToken = res2.endToken.next;
                        res2.altRealValue = res2.realValue;
                        res2.realValue = f;
                        NumberExHelper._correctExtTypes(res2);
                        if (res2.whitespacesAfterCount < 2) {
                            let toks2 = NumberExHelper.m_Postfixes.tryParse(res2.endToken.next, TerminParseAttr.NO);
                            if (toks2 !== null) {
                                if ((NumberExType.of(toks2.termin.tag)) === NumberExType.MONEY) 
                                    res2.endToken = toks2.endToken;
                            }
                        }
                        return res2;
                    }
                }
            }
            else if (nt1 !== null && nt1.typ === NumberSpellingType.WORDS && nt.typ === NumberSpellingType.DIGIT) {
                altf = nt1.realValue;
                let ttt = t1.next.next;
                if (ttt.isChar(')')) {
                    t1 = ttt.next;
                    det = true;
                }
                if (!det) 
                    altf = f;
            }
        }
        if ((t1 !== null && t1.isChar('(') && t1.next !== null) && t1.next.isValue("СУММА", null)) {
            let br = BracketHelper.tryParse(t1, BracketParseAttr.NO, 100);
            if (br !== null) 
                t1 = br.endToken.next;
        }
        if (isDollar !== null) {
            let te = null;
            if (t1 !== null) 
                te = t1.previous;
            else 
                for (t1 = t0; t1 !== null; t1 = t1.next) {
                    if (t1.next === null) 
                        te = t1;
                }
            if (te === null) 
                return null;
            if (te.isHiphen && te.next !== null) {
                if (te.next.isValue("МИЛЛИОННЫЙ", null)) {
                    f *= (1000000);
                    altf *= (1000000);
                    te = te.next;
                }
                else if (te.next.isValue("МИЛЛИАРДНЫЙ", null)) {
                    f *= (1000000000);
                    altf *= (1000000000);
                    te = te.next;
                }
            }
            if (!te.isWhitespaceAfter && (te.next instanceof TextToken)) {
                if (te.next.isValue("M", null)) {
                    f *= (1000000);
                    altf *= (1000000);
                    te = te.next;
                }
                else if (te.next.isValue("BN", null)) {
                    f *= (1000000000);
                    altf *= (1000000000);
                    te = te.next;
                }
            }
            return NumberExToken._new711(t0, te, "", nt.typ, NumberExType.MONEY, f, altf, isDollar);
        }
        if (t1 === null || ((t1.isNewlineBefore && !det))) 
            return null;
        let toks = NumberExHelper.m_Postfixes.tryParse(t1, TerminParseAttr.NO);
        if ((toks === null && det && (t1 instanceof NumberToken)) && t1.value === "0") 
            toks = NumberExHelper.m_Postfixes.tryParse(t1.next, TerminParseAttr.NO);
        if (toks === null && t1.isChar('р')) {
            let cou = 10;
            for (let ttt = t0.previous; ttt !== null && cou > 0; ttt = ttt.previous,cou--) {
                if (ttt.isValue("СУММА", null) || ttt.isValue("НАЛИЧНЫЙ", null) || ttt.isValue("БАЛАНС", null)) {
                }
                else if (ttt.getReferent() !== null && ttt.getReferent().typeName === "MONEY") {
                }
                else 
                    continue;
                toks = TerminToken._new712(t1, t1, NumberExHelper.m_Postfixes.findTerminsByCanonicText("RUB")[0]);
                if (t1.next !== null && t1.next.isChar('.')) 
                    toks.endToken = t1.next;
                let ty = NumberExType.of(toks.termin.tag);
                return NumberExToken._new713(t, toks.endToken, nt.value, nt.typ, ty, f, altf, toks.beginToken.morph, "RUB");
            }
        }
        if (toks !== null) {
            t1 = toks.endToken;
            if (!t1.isChar('.') && t1.next !== null && t1.next.isChar('.')) {
                if ((t1 instanceof TextToken) && t1.isValue(toks.termin.terms[0].canonicalText, null)) {
                }
                else if (!t1.chars.isLetter) {
                }
                else 
                    t1 = t1.next;
            }
            if (toks.termin.canonicText === "LTL") 
                return null;
            if (toks.termin.canonicText === "BGN" && (t1 instanceof TextToken)) {
                if (t1.term === "ЛЬВА" || t1.term === "ЛЕВ") 
                    return null;
            }
            if (toks.termin.canonicText === "л.") {
                if (toks.endToken.next !== null && toks.endToken.next.isValue("Д", null)) 
                    return null;
            }
            if (toks.beginToken === t1) {
                if (t1.morph._class.isPreposition || t1.morph._class.isConjunction) {
                    if (t1.isWhitespaceBefore && t1.isWhitespaceAfter) 
                        return null;
                }
            }
            let ty = NumberExType.of(toks.termin.tag);
            let res = NumberExToken._new710(t, t1, nt.value, nt.typ, ty, f, altf, toks.beginToken.morph);
            if (ty !== NumberExType.MONEY) {
                NumberExHelper._correctExtTypes(res);
                return res;
            }
            return NumberExHelper._correctMoney(res, toks.beginToken);
        }
        let pfx = NumberExHelper._attachSpecPostfix(t1);
        if (pfx !== null) {
            pfx.beginToken = t;
            pfx.value = nt.value;
            pfx.typ = nt.typ;
            pfx.realValue = f;
            pfx.altRealValue = altf;
            return pfx;
        }
        if (t1.next !== null && ((t1.morph._class.isPreposition || t1.morph._class.isConjunction))) {
            if (t1.isValue("НА", null)) {
            }
            else {
                let nn = NumberExHelper.tryParseNumberWithPostfix(t1.next);
                if (nn !== null) 
                    return NumberExToken._new715(t, t, nt.value, nt.typ, nn.exTyp, f, altf, nn.exTyp2, nn.exTypParam);
            }
        }
        if (!t1.isWhitespaceAfter && (t1.next instanceof NumberToken) && (t1 instanceof TextToken)) {
            let term = t1.term;
            let ty = NumberExType.UNDEFINED;
            if (term === "СМХ" || term === "CMX") 
                ty = NumberExType.SANTIMETER;
            else if (term === "MX" || term === "МХ") 
                ty = NumberExType.METER;
            else if (term === "MMX" || term === "ММХ") 
                ty = NumberExType.MILLIMETER;
            if (ty !== NumberExType.UNDEFINED) 
                return NumberExToken._new716(t, t1, nt.value, nt.typ, ty, f, altf, true);
        }
        return null;
    }
    
    static getDecimalRest100(f) {
        let rest = Utils.intDiv(Math.floor(((((f - Utils.mathTruncate(f)) + 0.0001)) * (10000))), 100);
        return rest;
    }
    
    static tryAttachPostfixOnly(t) {
        if (t === null) 
            return null;
        let tok = NumberExHelper.m_Postfixes.tryParse(t, TerminParseAttr.NO);
        let res = null;
        if (tok !== null) 
            res = NumberExToken._new717(t, tok.endToken, "", NumberSpellingType.DIGIT, NumberExType.of(tok.termin.tag), tok.termin);
        else 
            res = NumberExHelper._attachSpecPostfix(t);
        if (res !== null) {
            if (res.exTyp === NumberExType.MONEY) 
                NumberExHelper._correctMoney(res, res.beginToken);
            else 
                NumberExHelper._correctExtTypes(res);
        }
        return res;
    }
    
    static _attachSpecPostfix(t) {
        if (t === null) 
            return null;
        if (t.isCharOf("%")) 
            return new NumberExToken(t, t, "", NumberSpellingType.DIGIT, NumberExType.PERCENT);
        let money = NumberHelper.isMoneyChar(t);
        if (money !== null) 
            return NumberExToken._new718(t, t, "", NumberSpellingType.DIGIT, NumberExType.MONEY, money);
        return null;
    }
    
    static _correctExtTypes(ex) {
        let t = ex.endToken.next;
        if (t === null) 
            return;
        let ty = ex.exTyp;
        let wrapty720 = new RefOutArgWrapper(ty);
        let tt = NumberExHelper._corrExTyp2(t, wrapty720);
        ty = wrapty720.value;
        if (tt !== null) {
            ex.exTyp = ty;
            ex.endToken = tt;
            t = tt.next;
        }
        if (t === null || t.next === null) 
            return;
        if (t.isCharOf("/\\") || t.isValue("НА", null)) {
        }
        else 
            return;
        let tok = NumberExHelper.m_Postfixes.tryParse(t.next, TerminParseAttr.NO);
        if (tok !== null && ((NumberExType.of(tok.termin.tag)) !== NumberExType.MONEY)) {
            ex.exTyp2 = NumberExType.of(tok.termin.tag);
            ex.endToken = tok.endToken;
            ty = ex.exTyp2;
            let wrapty719 = new RefOutArgWrapper(ty);
            tt = NumberExHelper._corrExTyp2(ex.endToken.next, wrapty719);
            ty = wrapty719.value;
            if (tt !== null) {
                ex.exTyp2 = ty;
                ex.endToken = tt;
                t = tt.next;
            }
        }
    }
    
    static _corrExTyp2(t, typ) {
        if (t === null) 
            return null;
        let num = 0;
        let tt = t;
        if (t.isChar('³')) 
            num = 3;
        else if (t.isChar('²')) 
            num = 2;
        else if (!t.isWhitespaceBefore && (t instanceof NumberToken) && ((t.value === "3" || t.value === "2"))) 
            num = t.intValue;
        else if ((t.isChar('<') && (t.next instanceof NumberToken) && t.next.next !== null) && t.next.next.isChar('>') && t.next.intValue !== null) {
            num = t.next.intValue;
            tt = t.next.next;
        }
        if (num === 3) {
            if (typ.value === NumberExType.METER) {
                typ.value = NumberExType.METER3;
                return tt;
            }
            if (typ.value === NumberExType.SANTIMETER) {
                typ.value = NumberExType.SANTIMETER3;
                return tt;
            }
        }
        if (num === 2) {
            if (typ.value === NumberExType.METER) {
                typ.value = NumberExType.METER2;
                return tt;
            }
            if (typ.value === NumberExType.SANTIMETER) {
                typ.value = NumberExType.SANTIMETER2;
                return tt;
            }
        }
        return null;
    }
    
    static _correctMoney(res, t1) {
        if (t1 === null) 
            return null;
        let toks = NumberExHelper.m_Postfixes.tryParseAll(t1, TerminParseAttr.NO);
        if (toks === null || toks.length === 0) 
            return null;
        let tt = toks[0].endToken.next;
        let r = (tt === null ? null : tt.getReferent());
        let alpha2 = null;
        if (r !== null && r.typeName === "GEO") 
            alpha2 = r.getStringValue("ALPHA2");
        if (alpha2 !== null && toks.length > 0) {
            for (let i = toks.length - 1; i >= 0; i--) {
                if (!toks[i].termin.canonicText.startsWith(alpha2)) 
                    toks.splice(i, 1);
            }
            if (toks.length === 0) 
                toks = NumberExHelper.m_Postfixes.tryParseAll(t1, TerminParseAttr.NO);
        }
        if (toks.length > 1) {
            alpha2 = null;
            let str = toks[0].termin.terms[0].canonicalText;
            if (str === "РУБЛЬ" || str === "RUBLE") 
                alpha2 = "RU";
            else if (str === "ДОЛЛАР" || str === "ДОЛАР" || str === "DOLLAR") 
                alpha2 = "US";
            else if (str === "ФУНТ" || str === "POUND") 
                alpha2 = "UK";
            if (alpha2 !== null) {
                for (let i = toks.length - 1; i >= 0; i--) {
                    if (!toks[i].termin.canonicText.startsWith(alpha2) && toks[i].termin.canonicText !== "GBP") 
                        toks.splice(i, 1);
                }
            }
            alpha2 = null;
        }
        if (toks.length < 1) 
            return null;
        res.exTypParam = toks[0].termin.canonicText;
        if (alpha2 !== null && tt !== null) 
            res.endToken = tt;
        tt = res.endToken.next;
        if (tt !== null && tt.isCommaAnd) 
            tt = tt.next;
        if ((tt instanceof NumberToken) && tt.next !== null && (tt.whitespacesAfterCount < 4)) {
            let tt1 = tt.next;
            if ((tt1 !== null && tt1.isChar('(') && (tt1.next instanceof NumberToken)) && tt1.next.next !== null && tt1.next.next.isChar(')')) {
                if (tt.value === tt1.next.value) 
                    tt1 = tt1.next.next.next;
            }
            let tok = NumberExHelper.m_SmallMoney.tryParse(tt1, TerminParseAttr.NO);
            if (tok === null && tt1 !== null && tt1.isChar(')')) 
                tok = NumberExHelper.m_SmallMoney.tryParse(tt1.next, TerminParseAttr.NO);
            if (tok !== null && tt.intValue !== null) {
                let max = tok.termin.tag;
                let val = tt.intValue;
                if (val < max) {
                    let f = val;
                    f /= (max);
                    let f0 = res.realValue - (Math.floor(res.realValue));
                    let re0 = Math.floor(((f0 * (100)) + 0.0001));
                    if (re0 > 0 && val !== re0) 
                        res.altRestMoney = val;
                    else if (f0 === 0) 
                        res.realValue = res.realValue + f;
                    f0 = res.altRealValue - (Math.floor(res.altRealValue));
                    re0 = Math.floor(((f0 * (100)) + 0.0001));
                    if (re0 > 0 && val !== re0) 
                        res.altRestMoney = val;
                    else if (f0 === 0) 
                        res.altRealValue += f;
                    res.endToken = tok.endToken;
                }
            }
        }
        else if ((tt instanceof TextToken) && tt.isValue("НОЛЬ", null)) {
            let tok = NumberExHelper.m_SmallMoney.tryParse(tt.next, TerminParseAttr.NO);
            if (tok !== null) 
                res.endToken = tok.endToken;
        }
        return res;
    }
    
    static initialize() {
        if (NumberExHelper.m_Postfixes !== null) 
            return;
        let t = null;
        NumberExHelper.m_Postfixes = new TerminCollection();
        t = Termin._new721("КВАДРАТНЫЙ МЕТР", MorphLang.RU, true, "кв.м.", NumberExType.METER2);
        t.addAbridge("КВ.МЕТР");
        t.addAbridge("КВ.МЕТРА");
        t.addAbridge("КВ.М.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КВАДРАТНИЙ МЕТР", MorphLang.UA, true, "КВ.М.", NumberExType.METER2);
        t.addAbridge("КВ.МЕТР");
        t.addAbridge("КВ.МЕТРА");
        t.addAbridge("КВ.М.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КВАДРАТНЫЙ КИЛОМЕТР", MorphLang.RU, true, "кв.км.", NumberExType.KILOMETER2);
        t.addVariant("КВАДРАТНИЙ КІЛОМЕТР", true);
        t.addAbridge("КВ.КМ.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ГЕКТАР", MorphLang.RU, true, "га", NumberExType.GEKTAR);
        t.addAbridge("ГА");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("АР", MorphLang.RU, true, "ар", NumberExType.AR);
        t.addVariant("СОТКА", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КУБИЧЕСКИЙ МЕТР", MorphLang.RU, true, "куб.м.", NumberExType.METER3);
        t.addVariant("КУБІЧНИЙ МЕТР", true);
        t.addAbridge("КУБ.МЕТР");
        t.addAbridge("КУБ.М.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МЕТР", MorphLang.RU, true, "м.", NumberExType.METER);
        t.addAbridge("М.");
        t.addAbridge("M.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МЕТРОВЫЙ", MorphLang.RU, true, "м.", NumberExType.METER);
        t.addVariant("МЕТРОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИЛЛИМЕТР", MorphLang.RU, true, "мм.", NumberExType.MILLIMETER);
        t.addAbridge("ММ");
        t.addAbridge("MM");
        t.addVariant("МІЛІМЕТР", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИЛЛИМЕТРОВЫЙ", MorphLang.RU, true, "мм.", NumberExType.MILLIMETER);
        t.addVariant("МІЛІМЕТРОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("САНТИМЕТР", MorphLang.RU, true, "см.", NumberExType.SANTIMETER);
        t.addAbridge("СМ");
        t.addAbridge("CM");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("САНТИМЕТРОВЫЙ", MorphLang.RU, true, "см.", NumberExType.SANTIMETER);
        t.addVariant("САНТИМЕТРОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КВАДРАТНЫЙ САНТИМЕТР", MorphLang.RU, true, "кв.см.", NumberExType.SANTIMETER2);
        t.addVariant("КВАДРАТНИЙ САНТИМЕТР", true);
        t.addAbridge("КВ.СМ.");
        t.addAbridge("СМ.КВ.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КУБИЧЕСКИЙ САНТИМЕТР", MorphLang.RU, true, "куб.см.", NumberExType.SANTIMETER3);
        t.addVariant("КУБІЧНИЙ САНТИМЕТР", true);
        t.addAbridge("КУБ.САНТИМЕТР");
        t.addAbridge("КУБ.СМ.");
        t.addAbridge("СМ.КУБ.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КИЛОМЕТР", MorphLang.RU, true, "км.", NumberExType.KILOMETER);
        t.addAbridge("КМ");
        t.addAbridge("KM");
        t.addVariant("КІЛОМЕТР", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КИЛОМЕТРОВЫЙ", MorphLang.RU, true, "км.", NumberExType.KILOMETER);
        t.addVariant("КІЛОМЕТРОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИЛЯ", MorphLang.RU, true, "миль", NumberExType.KILOMETER);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ГРАММ", MorphLang.RU, true, "гр.", NumberExType.GRAMM);
        t.addAbridge("ГР");
        t.addAbridge("Г");
        t.addVariant("ГРАМ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ГРАММОВЫЙ", MorphLang.RU, true, "гр.", NumberExType.GRAMM);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КИЛОГРАММ", MorphLang.RU, true, "кг.", NumberExType.KILOGRAM);
        t.addAbridge("КГ");
        t.addVariant("КІЛОГРАМ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КИЛОГРАММОВЫЙ", MorphLang.RU, true, "кг.", NumberExType.KILOGRAM);
        t.addVariant("КІЛОГРАМОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИЛЛИГРАММ", MorphLang.RU, true, "мг.", NumberExType.MILLIGRAM);
        t.addAbridge("МГ");
        t.addVariant("МІЛІГРАМ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИЛЛИГРАММОВЫЙ", MorphLang.RU, true, "мг.", NumberExType.MILLIGRAM);
        t.addVariant("МИЛЛИГРАМОВЫЙ", true);
        t.addVariant("МІЛІГРАМОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ТОННА", MorphLang.RU, true, "т.", NumberExType.TONNA);
        t.addAbridge("Т");
        t.addAbridge("T");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ТОННЫЙ", MorphLang.RU, true, "т.", NumberExType.TONNA);
        t.addVariant("ТОННИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ЛИТР", MorphLang.RU, true, "л.", NumberExType.LITR);
        t.addAbridge("Л");
        t.addVariant("ЛІТР", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ЛИТРОВЫЙ", MorphLang.RU, true, "л.", NumberExType.LITR);
        t.addVariant("ЛІТРОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИЛЛИЛИТР", MorphLang.RU, true, "мл.", NumberExType.MILLILITR);
        t.addAbridge("МЛ");
        t.addVariant("МІЛІЛІТР", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИЛЛИЛИТРОВЫЙ", MorphLang.RU, true, "мл.", NumberExType.MILLILITR);
        t.addVariant("МІЛІЛІТРОВИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ЧАС", MorphLang.RU, true, "ч.", NumberExType.HOUR);
        t.addAbridge("Ч.");
        t.addVariant("ГОДИНА", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МИНУТА", MorphLang.RU, true, "мин.", NumberExType.MINUTE);
        t.addAbridge("МИН.");
        t.addVariant("ХВИЛИНА", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("СЕКУНДА", MorphLang.RU, true, "сек.", NumberExType.SECOND);
        t.addAbridge("СЕК.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ГОД", MorphLang.RU, true, "г.", NumberExType.YEAR);
        t.addAbridge("Г.");
        t.addAbridge("ЛЕТ");
        t.addVariant("ЛЕТНИЙ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("МЕСЯЦ", MorphLang.RU, true, "мес.", NumberExType.MONTH);
        t.addAbridge("МЕС.");
        t.addVariant("МЕСЯЧНЫЙ", true);
        t.addVariant("КАЛЕНДАРНЫЙ МЕСЯЦ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ДЕНЬ", MorphLang.RU, true, "дн.", NumberExType.DAY);
        t.addAbridge("ДН.");
        t.addVariant("ДНЕВНЫЙ", true);
        t.addVariant("СУТКИ", true);
        t.addVariant("СУТОЧНЫЙ", true);
        t.addVariant("КАЛЕНДАРНЫЙ ДЕНЬ", true);
        t.addVariant("РАБОЧИЙ ДЕНЬ", true);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("НЕДЕЛЯ", MorphLang.RU, true, "нед.", NumberExType.WEEK);
        t.addVariant("НЕДЕЛЬНЫЙ", true);
        t.addVariant("КАЛЕНДАРНАЯ НЕДЕЛЯ", false);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ПРОЦЕНТ", MorphLang.RU, true, "%", NumberExType.PERCENT);
        t.addVariant("%", false);
        t.addVariant("ПРОЦ", true);
        t.addAbridge("ПРОЦ.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ШТУКА", MorphLang.RU, true, "шт.", NumberExType.SHUK);
        t.addVariant("ШТ", false);
        t.addAbridge("ШТ.");
        t.addAbridge("ШТ-К");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("УПАКОВКА", MorphLang.RU, true, "уп.", NumberExType.UPAK);
        t.addVariant("УПАК", true);
        t.addVariant("УП", true);
        t.addAbridge("УПАК.");
        t.addAbridge("УП.");
        t.addAbridge("УП-КА");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("РУЛОН", MorphLang.RU, true, "рулон", NumberExType.RULON);
        t.addVariant("РУЛ", true);
        t.addAbridge("РУЛ.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("НАБОР", MorphLang.RU, true, "набор", NumberExType.NABOR);
        t.addVariant("НАБ", true);
        t.addAbridge("НАБ.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("КОМПЛЕКТ", MorphLang.RU, true, "компл.", NumberExType.KOMPLEKT);
        t.addVariant("КОМПЛ", true);
        t.addAbridge("КОМПЛ.");
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ПАРА", MorphLang.RU, true, "пар", NumberExType.PARA);
        NumberExHelper.m_Postfixes.add(t);
        t = Termin._new721("ФЛАКОН", MorphLang.RU, true, "флак.", NumberExType.FLAKON);
        t.addVariant("ФЛ", true);
        t.addAbridge("ФЛ.");
        t.addVariant("ФЛАК", true);
        t.addAbridge("ФЛАК.");
        NumberExHelper.m_Postfixes.add(t);
        for (const te of NumberExHelper.m_Postfixes.termins) {
            let ty = NumberExType.of(te.tag);
            if (!NumberExHelper.m_NormalsTyps.containsKey(ty)) 
                NumberExHelper.m_NormalsTyps.put(ty, te.canonicText);
        }
        NumberExHelper.m_SmallMoney = new TerminCollection();
        t = Termin._new381("УСЛОВНАЯ ЕДИНИЦА", "УЕ", NumberExType.MONEY);
        t.addAbridge("У.Е.");
        t.addAbridge("У.E.");
        t.addAbridge("Y.Е.");
        t.addAbridge("Y.E.");
        NumberExHelper.m_Postfixes.add(t);
        let bb = Termin.ASSIGN_ALL_TEXTS_AS_NORMAL;
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        for (let k = 0; k < 3; k++) {
            let str = PullentiNerCoreInternalResourceHelper.getString((k === 0 ? "Money.csv" : (k === 1 ? "MoneyUA.csv" : "MoneyEN.csv")));
            if (str === null) 
                continue;
            let lang = (k === 0 ? MorphLang.RU : (k === 1 ? MorphLang.UA : MorphLang.EN));
            if (str === null) 
                continue;
            for (const line0 of Utils.splitString(str, '\n', false)) {
                let line = line0.trim();
                if (Utils.isNullOrEmpty(line)) 
                    continue;
                let parts = Utils.splitString(line.toUpperCase(), ';', false);
                if (parts === null || parts.length !== 5) 
                    continue;
                if (Utils.isNullOrEmpty(parts[1]) || Utils.isNullOrEmpty(parts[2])) 
                    continue;
                t = new Termin(parts[1], lang);
                t.canonicText = parts[2];
                t.acronym = parts[2];
                t.tag = NumberExType.MONEY;
                for (const p of Utils.splitString(parts[0], ',', false)) {
                    if (p !== parts[1]) {
                        let t0 = new Termin(p, lang);
                        t.addVariantTerm(t0);
                    }
                }
                if (parts[1] === "РУБЛЬ") 
                    t.addAbridge("РУБ.");
                else if (parts[1] === "ГРИВНЯ" || parts[1] === "ГРИВНА") 
                    t.addAbridge("ГРН.");
                else if (parts[1] === "ДОЛЛАР") {
                    t.addAbridge("ДОЛ.");
                    t.addAbridge("ДОЛЛ.");
                }
                else if (parts[1] === "ДОЛАР") 
                    t.addAbridge("ДОЛ.");
                else if (parts[1] === "ИЕНА") 
                    t.addVariant("ЙЕНА", false);
                else if (parts[1] === "БИТКОЙН") 
                    t.addVariant("БИТКОИН", false);
                NumberExHelper.m_Postfixes.add(t);
                if (Utils.isNullOrEmpty(parts[3])) 
                    continue;
                let num = 0;
                let i = parts[3].indexOf(' ');
                if (i < 2) 
                    continue;
                let wrapnum766 = new RefOutArgWrapper();
                let inoutres767 = Utils.tryParseInt(parts[3].substring(0, 0 + i), wrapnum766);
                num = wrapnum766.value;
                if (!inoutres767) 
                    continue;
                let vv = parts[3].substring(i).trim();
                t = new Termin();
                t.initByNormalText(parts[4], lang);
                t.tag = num;
                if (vv !== parts[4]) {
                    let t0 = new Termin();
                    t0.initByNormalText(vv, null);
                    t.addVariantTerm(t0);
                }
                if (parts[4] === "КОПЕЙКА" || parts[4] === "КОПІЙКА") 
                    t.addAbridge("КОП.");
                NumberExHelper.m_SmallMoney.add(t);
            }
        }
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = bb;
    }
    
    static static_constructor() {
        NumberExHelper.m_Postfixes = null;
        NumberExHelper.m_NormalsTyps = new Hashtable();
        NumberExHelper.m_SmallMoney = null;
    }
}


NumberExHelper.static_constructor();

module.exports = NumberExHelper