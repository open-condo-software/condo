/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphLang = require("./../../morph/MorphLang");
const LanguageHelper = require("./../../morph/LanguageHelper");
const MorphClass = require("./../../morph/MorphClass");
const MorphCase = require("./../../morph/MorphCase");
const MorphNumber = require("./../../morph/MorphNumber");
const NumberExType = require("./NumberExType");
const MorphologyService = require("./../../morph/MorphologyService");
const TextToken = require("./../TextToken");
const MorphWordForm = require("./../../morph/MorphWordForm");
const MetaToken = require("./../MetaToken");
const NumberSpellingType = require("./../NumberSpellingType");
const MorphGender = require("./../../morph/MorphGender");
const MorphBaseInfo = require("./../../morph/MorphBaseInfo");
const MorphCollection = require("./../MorphCollection");
const Token = require("./../Token");
const NumberParseAttr = require("./NumberParseAttr");
const TerminParseAttr = require("./TerminParseAttr");
const MiscHelper = require("./MiscHelper");
const NumberToken = require("./../NumberToken");
const Termin = require("./Termin");
const TerminCollection = require("./TerminCollection");
const NumberExToken = require("./NumberExToken");

/**
 * Работа с числовыми значениями
 * 
 * Хелпер числовых представлений
 */
class NumberHelper {
    
    /**
     * Попробовать создать числительное (без знака, целочисленное). 
     * Внимание! Этот метод всегда вызывается процессором при формировании цепочки токенов в методе Process(), 
     * так что все NumberToken уже созданы в основной цепочке, сфорированной для текста.
     * @param token начальный токен
     * @return число-метатокен
     */
    static tryParseNumber(token) {
        return NumberHelper._TryParse(token, null);
    }
    
    static _TryParse(token, prevVal = null) {
        if (token instanceof NumberToken) 
            return Utils.as(token, NumberToken);
        let tt = Utils.as(token, TextToken);
        if (tt === null) 
            return null;
        let et = tt;
        let val = null;
        let typ = NumberSpellingType.DIGIT;
        let term = tt.term;
        let i = 0;
        let j = 0;
        if (Utils.isDigit(term[0])) 
            val = term;
        if (val !== null) {
            let hiph = false;
            if ((et.next instanceof TextToken) && et.next.isHiphen) {
                if ((et.whitespacesAfterCount < 2) && (et.next.whitespacesAfterCount < 2)) {
                    et = Utils.as(et.next, TextToken);
                    hiph = true;
                }
            }
            let mc = null;
            let rr = NumberHelper.analizeNumberTail(Utils.as(et.next, TextToken), val);
            if (rr === null || et.whitespacesAfterCount > 2) 
                et = tt;
            else {
                mc = rr.morph;
                et = Utils.as(rr.endToken, TextToken);
            }
            if (et.next !== null && et.next.isChar('(')) {
                let num2 = NumberHelper.tryParseNumber(et.next.next);
                if ((num2 !== null && num2.value === val && num2.endToken.next !== null) && num2.endToken.next.isChar(')')) 
                    et = Utils.as(num2.endToken.next, TextToken);
            }
            while ((et.next instanceof TextToken) && !(et.previous instanceof NumberToken) && et.isWhitespaceBefore) {
                if (et.whitespacesAfterCount !== 1) 
                    break;
                let sss = et.next.term;
                if (sss === "000") {
                    val = val + "000";
                    et = Utils.as(et.next, TextToken);
                    continue;
                }
                else if (sss === "ООО" || sss === "OOO") {
                    let sub = NumberHelper.tryParsePostfixOnly(et.next.next);
                    if (sub !== null) {
                        val = val + "000";
                        et = Utils.as(et.next, TextToken);
                        continue;
                    }
                }
                if (Utils.isDigit(sss[0]) && sss.length === 3) {
                    let val2 = val;
                    for (let ttt = et.next; ttt !== null; ttt = ttt.next) {
                        let ss = ttt.getSourceText();
                        if (ttt.whitespacesBeforeCount === 1 && ttt.lengthChar === 3 && Utils.isDigit(ss[0])) {
                            let ii = 0;
                            let wrapii813 = new RefOutArgWrapper();
                            let inoutres814 = Utils.tryParseInt(ss, wrapii813);
                            ii = wrapii813.value;
                            if (!inoutres814) 
                                break;
                            val2 += ss;
                            continue;
                        }
                        if ((ttt.isCharOf(".,") && !ttt.isWhitespaceBefore && !ttt.isWhitespaceAfter) && ttt.next !== null && Utils.isDigit(ttt.next.getSourceText()[0])) {
                            if (ttt.next.isWhitespaceAfter && (ttt.previous instanceof TextToken)) {
                                et = Utils.as(ttt.previous, TextToken);
                                val = val2;
                                break;
                            }
                        }
                        if (((((((ttt.isValue("ТРИЛЛИОН", "ТРИЛЬЙОН") || ttt.isValue("TRILLION", null) || ttt.isValue("ТРЛН", null)) || ttt.isValue("МИЛЛИАРД", "МІЛЬЯРД") || ttt.isValue("BILLION", null)) || ttt.isValue("BN", null) || ttt.isValue("МЛРД", null)) || ttt.isValue("МИЛЛИОН", "МІЛЬЙОН") || ttt.isValue("MILLION", null)) || ttt.isValue("МЛН", null) || ttt.isValue("ТЫСЯЧА", "ТИСЯЧА")) || ttt.isValue("THOUSAND", null) || ttt.isValue("ТЫС", null)) || ttt.isValue("ТИС", null)) {
                            et = Utils.as(ttt.previous, TextToken);
                            val = val2;
                            break;
                        }
                        break;
                    }
                }
                break;
            }
            for (let k = 0; k < 4; k++) {
                if ((et.next instanceof TextToken) && et.next.chars.isLetter) {
                    tt = Utils.as(et.next, TextToken);
                    let t0 = et;
                    let coef = null;
                    if (k === 0) {
                        coef = "000000000000";
                        if (tt.isValue("ТРИЛЛИОН", "ТРИЛЬЙОН") || tt.isValue("TRILLION", null)) {
                            et = tt;
                            val += coef;
                        }
                        else if (tt.isValue("ТРЛН", null)) {
                            et = tt;
                            val += coef;
                            if ((et.next instanceof TextToken) && et.next.isChar('.')) 
                                et = Utils.as(et.next, TextToken);
                        }
                        else 
                            continue;
                    }
                    else if (k === 1) {
                        coef = "000000000";
                        if (tt.isValue("МИЛЛИАРД", "МІЛЬЯРД") || tt.isValue("BILLION", null) || tt.isValue("BN", null)) {
                            et = tt;
                            val += coef;
                        }
                        else if (tt.isValue("МЛРД", null)) {
                            et = tt;
                            val += coef;
                            if ((et.next instanceof TextToken) && et.next.isChar('.')) 
                                et = Utils.as(et.next, TextToken);
                        }
                        else 
                            continue;
                    }
                    else if (k === 2) {
                        coef = "000000";
                        if (tt.isValue("МИЛЛИОН", "МІЛЬЙОН") || tt.isValue("MILLION", null)) {
                            et = tt;
                            val += coef;
                        }
                        else if (tt.isValue("МЛН", null)) {
                            et = tt;
                            val += coef;
                            if ((et.next instanceof TextToken) && et.next.isChar('.')) 
                                et = Utils.as(et.next, TextToken);
                        }
                        else if ((tt instanceof TextToken) && tt.term === "M") {
                            if (NumberHelper.isMoneyChar(et.previous) !== null) {
                                et = tt;
                                val += coef;
                            }
                            else 
                                break;
                        }
                        else 
                            continue;
                    }
                    else {
                        coef = "000";
                        if (tt.isValue("ТЫСЯЧА", "ТИСЯЧА") || tt.isValue("THOUSAND", null)) {
                            et = tt;
                            val += coef;
                        }
                        else if (tt.isValue("ТЫС", null) || tt.isValue("ТИС", null)) {
                            et = tt;
                            val += coef;
                            if ((et.next instanceof TextToken) && et.next.isChar('.')) 
                                et = Utils.as(et.next, TextToken);
                        }
                        else 
                            break;
                    }
                    if (((t0 === token && t0.lengthChar <= 3 && t0.previous !== null) && !t0.isWhitespaceBefore && t0.previous.isCharOf(",.")) && !t0.previous.isWhitespaceBefore && (((t0.previous.previous instanceof NumberToken) || prevVal !== null))) {
                        if (t0.lengthChar === 1) 
                            val = val.substring(0, 0 + val.length - 1);
                        else if (t0.lengthChar === 2) 
                            val = val.substring(0, 0 + val.length - 2);
                        else 
                            val = val.substring(0, 0 + val.length - 3);
                        let hi = (t0.previous.previous instanceof NumberToken ? t0.previous.previous.value : prevVal.value);
                        let cou = coef.length - val.length;
                        for (; cou > 0; cou--) {
                            hi = hi + "0";
                        }
                        val = hi + val;
                        token = t0.previous.previous;
                    }
                    let next = NumberHelper._TryParse(et.next, null);
                    if (next === null || next.value.length > coef.length) 
                        break;
                    let tt1 = next.endToken;
                    if (((tt1.next instanceof TextToken) && !tt1.isWhitespaceAfter && tt1.next.isCharOf(".,")) && !tt1.next.isWhitespaceAfter) {
                        let re1 = NumberHelper._TryParse(tt1.next.next, next);
                        if (re1 !== null && re1.beginToken === next.beginToken) 
                            next = re1;
                    }
                    if (val.length > next.value.length) 
                        val = val.substring(0, 0 + val.length - next.value.length);
                    val += next.value;
                    et = Utils.as(next.endToken, TextToken);
                    break;
                }
            }
            let res = NumberToken._new815(token, et, val, typ, mc);
            if (et.next !== null && (res.value.length < 4) && ((et.next.isHiphen || et.next.isValue("ДО", null)))) {
                for (let tt1 = et.next.next; tt1 !== null; tt1 = tt1.next) {
                    if (!(tt1 instanceof TextToken)) 
                        break;
                    if (Utils.isDigit(tt1.term[0])) 
                        continue;
                    if (tt1.isCharOf(",.") || NumberHelper.isMoneyChar(tt1) !== null) 
                        continue;
                    if (tt1.isValue("ТРИЛЛИОН", "ТРИЛЬЙОН") || tt1.isValue("ТРЛН", null) || tt1.isValue("TRILLION", null)) 
                        res.value = res.value + "000000000000";
                    else if (tt1.isValue("МИЛЛИОН", "МІЛЬЙОН") || tt1.isValue("МЛН", null) || tt1.isValue("MILLION", null)) 
                        res.value = res.value + "000000";
                    else if ((tt1.isValue("МИЛЛИАРД", "МІЛЬЯРД") || tt1.isValue("МЛРД", null) || tt1.isValue("BILLION", null)) || tt1.isValue("BN", null)) 
                        res.value = res.value + "000000000";
                    else if (tt1.isValue("ТЫСЯЧА", "ТИСЯЧА") || tt1.isValue("ТЫС", "ТИС") || tt1.isValue("THOUSAND", null)) 
                        res.value = res.value + "1000";
                    break;
                }
            }
            return res;
        }
        let intVal = 0;
        et = null;
        let locValue = 0;
        let isAdj = false;
        let jPrev = -1;
        for (let t = tt; t !== null; t = Utils.as(t.next, TextToken)) {
            if (t !== tt && t.newlinesBeforeCount > 1) 
                break;
            term = t.term;
            if (!Utils.isLetter(term[0])) 
                break;
            let num = NumberHelper.m_Nums.tryParse(t, TerminParseAttr.FULLWORDSONLY);
            if (num === null) 
                break;
            let wrapj816 = new RefOutArgWrapper();
            let inoutres817 = Utils.tryParseInt(num.termin.tag.toString(), wrapj816);
            j = wrapj816.value;
            if (!inoutres817) 
                break;
            isAdj = ((j & NumberHelper.prilNumTagBit)) !== 0;
            j &= (~NumberHelper.prilNumTagBit);
            if (jPrev > 0) {
                if ((jPrev < 20) && (j < 20)) 
                    break;
                if (jPrev <= j) {
                    if (jPrev === j) 
                        break;
                    if ((j === 100 || j === 1000 || j === 1000000) || j === 1000000000) {
                    }
                    else 
                        break;
                }
                else if (jPrev.toString().length === j.toString().length) 
                    break;
            }
            if ((intVal + locValue) > 0 && ((t.isValue("СТО", null) || t.isValue("ДЕСЯТЬ", null))) && t.next !== null) {
                if (t.next.isValue("ТЫСЯЧНЫЙ", "ТИСЯЧНИЙ") || t.next.isValue("МИЛЛИОННЫЙ", "МІЛЬЙОННИЙ") || t.next.isValue("МИЛЛИАРДНЫЙ", "МІЛЬЯРДНИЙ")) 
                    break;
            }
            if (isAdj && t !== tt) {
                if (((t.isValue("ДЕСЯТЫЙ", "ДЕСЯТИЙ") || t.isValue("СОТЫЙ", "СОТИЙ") || t.isValue("ТЫСЯЧНЫЙ", "ТИСЯЧНИЙ")) || t.isValue("ДЕСЯТИТЫСЯЧНЫЙ", "ДЕСЯТИТИСЯЧНИЙ") || t.isValue("МИЛЛИОННЫЙ", "МІЛЬЙОННИЙ")) || t.isValue("МИЛЛИАРДНЫЙ", "МІЛЬЯРДНИЙ")) 
                    break;
                if ((j < 9) && (jPrev < 20)) 
                    break;
            }
            if (j >= 1000) {
                if (locValue === 0) 
                    locValue = 1;
                intVal += (locValue * j);
                locValue = 0;
            }
            else {
                if (locValue > 0 && locValue <= j) 
                    break;
                locValue += j;
            }
            et = t;
            if (j === 1000 || j === 1000000) {
                if ((et.next instanceof TextToken) && et.next.isChar('.')) 
                    t = (et = Utils.as(et.next, TextToken));
            }
            jPrev = j;
        }
        if (locValue > 0) 
            intVal += locValue;
        if (intVal === 0 || et === null) 
            return null;
        let nt = new NumberToken(tt, et, intVal.toString(), NumberSpellingType.WORDS);
        if (et.morph !== null) {
            nt.morph = new MorphCollection(et.morph);
            for (const wff of et.morph.items) {
                let wf = Utils.as(wff, MorphWordForm);
                if (wf !== null && wf.misc !== null && wf.misc.attrs.includes("собир.")) {
                    nt.morph._class = MorphClass.NOUN;
                    break;
                }
            }
            if (!isAdj) {
                nt.morph.removeItems(MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.NOUN), false);
                if (nt.morph._class.isUndefined) 
                    nt.morph._class = MorphClass.NOUN;
            }
            if (et.chars.isLatinLetter && isAdj) 
                nt.morph._class = MorphClass.ADJECTIVE;
        }
        return nt;
    }
    
    /**
     * Попробовать выделить число в римской записи
     * @param t начальный токен
     * @return числовой метатокен или null
     * 
     */
    static tryParseRoman(t) {
        if (t instanceof NumberToken) 
            return Utils.as(t, NumberToken);
        let tt = Utils.as(t, TextToken);
        if (tt === null || !t.chars.isLetter) 
            return null;
        let term = tt.term;
        if (!NumberHelper._isRomVal(term)) 
            return null;
        if (tt.morph._class.isPreposition) {
            if (tt.chars.isAllLower) 
                return null;
        }
        let res = new NumberToken(t, t, "", NumberSpellingType.ROMAN);
        let nums = new Array();
        let val = 0;
        for (; t !== null; t = t.next) {
            if (t !== res.beginToken && t.isWhitespaceBefore) 
                break;
            if (!(t instanceof TextToken)) {
                if ((t instanceof NumberToken) && t.value === "1" && t.typ === NumberSpellingType.DIGIT) 
                    term = "1";
                else 
                    break;
            }
            else 
                term = t.term;
            if (!NumberHelper._isRomVal(term)) 
                break;
            for (const s of term) {
                let i = NumberHelper._romVal(s);
                if (i > 0) 
                    nums.push(i);
            }
            res.endToken = t;
        }
        if (nums.length === 0) 
            return null;
        for (let i = 0; i < nums.length; i++) {
            if ((i + 1) < nums.length) {
                if (nums[i] === 1 && nums[i + 1] === 5) {
                    val += 4;
                    i++;
                }
                else if (nums[i] === 1 && nums[i + 1] === 10) {
                    val += 9;
                    i++;
                }
                else if (nums[i] === 10 && nums[i + 1] === 50) {
                    val += 40;
                    i++;
                }
                else if (nums[i] === 10 && nums[i + 1] === 100) {
                    val += 90;
                    i++;
                }
                else 
                    val += nums[i];
            }
            else 
                val += nums[i];
        }
        res.intValue = val;
        let et = res.endToken;
        if (et.whitespacesAfterCount > 2) 
            return res;
        if (et.next !== null && et.next.isHiphen) 
            et = et.next;
        if (et.whitespacesAfterCount > 2) 
            return null;
        let mc = NumberHelper.analizeNumberTail(Utils.as(et.next, TextToken), res.value);
        if (mc !== null) {
            res.endToken = mc.endToken;
            res.morph = mc.morph;
        }
        if ((res.beginToken === res.endToken && val === 1 && res.beginToken.chars.isAllLower) && res.beginToken.morph.language.isUa) 
            return null;
        return res;
    }
    
    static _romVal(ch) {
        if (ch === 'Х' || ch === 'X') 
            return 10;
        if (ch === 'І' || ch === 'I' || ch === '1') 
            return 1;
        if (ch === 'V') 
            return 5;
        if (ch === 'L') 
            return 50;
        if (ch === 'C' || ch === 'С') 
            return 100;
        return 0;
    }
    
    static _isRomVal(str) {
        for (const ch of str) {
            if (NumberHelper._romVal(ch) < 1) 
                return false;
        }
        return true;
    }
    
    /**
     * Выделить число в римской записи в обратном порядке
     * @param token токен на предполагаемой римской цифрой
     * @return число-метатокен или null
     */
    static tryParseRomanBack(token) {
        let t = token;
        if (t === null) 
            return null;
        if ((t.chars.isAllLower && t.previous !== null && t.previous.isHiphen) && t.previous.previous !== null) 
            t = token.previous.previous;
        let res = null;
        for (; t !== null; t = t.previous) {
            let nt = NumberHelper.tryParseRoman(t);
            if (nt !== null) {
                if (nt.endToken === token) 
                    res = nt;
                else 
                    break;
            }
            if (t.isWhitespaceAfter) 
                break;
        }
        return res;
    }
    
    /**
     * Это выделение числительных типа 16-летие, 50-летний
     * @param t начальный токен
     * @return числовой метатокен или null
     */
    static tryParseAge(t) {
        if (t === null) 
            return null;
        let nt = Utils.as(t, NumberToken);
        let ntNext = null;
        if (nt !== null) 
            ntNext = nt.next;
        else {
            if (t.isValue("AGED", null) && (t.next instanceof NumberToken)) 
                return new NumberToken(t, t.next, t.next.value, NumberSpellingType.AGE);
            if ((((nt = NumberHelper.tryParseRoman(t)))) !== null) 
                ntNext = nt.endToken.next;
        }
        if (nt !== null) {
            if (ntNext !== null) {
                let t1 = ntNext;
                if (t1.isHiphen) 
                    t1 = t1.next;
                if (t1 instanceof TextToken) {
                    let v = t1.term;
                    if ((v === "ЛЕТ" || v === "ЛЕТИЯ" || v === "ЛЕТИЕ") || v === "РІЧЧЯ") 
                        return NumberToken._new815(t, t1, nt.value, NumberSpellingType.AGE, t1.morph);
                    if (t1.isValue("ЛЕТНИЙ", "РІЧНИЙ")) 
                        return NumberToken._new815(t, t1, nt.value, NumberSpellingType.AGE, t1.morph);
                    if (v === "Л" || ((v === "Р" && nt.morph.language.isUa))) {
                        if (nt.lengthChar < 2) 
                            return null;
                        let res = new NumberToken(t, (t1.next !== null && t1.next.isChar('.') ? t1.next : t1), nt.value, NumberSpellingType.AGE);
                        if (res.endToken.next !== null) {
                            if (res.endToken.next.isCharOf("\\/") || res.endToken.next.isValue("Д", null)) 
                                return null;
                        }
                        return res;
                    }
                }
            }
            return null;
        }
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        let s = tt.term;
        if (LanguageHelper.endsWithEx(s, "ЛЕТИЕ", "ЛЕТИЯ", "РІЧЧЯ", null)) {
            let term = NumberHelper.m_Nums.find(s.substring(0, 0 + s.length - 5));
            if (term !== null) 
                return NumberToken._new815(tt, tt, term.tag.toString(), NumberSpellingType.AGE, tt.morph);
        }
        s = tt.lemma;
        let i = s.indexOf("ЛЕТН");
        if (i < 0) 
            i = s.indexOf("РІЧН");
        if (i > 3) {
            let ss = s.substring(0, 0 + i);
            let term = NumberHelper.m_Nums.find(ss);
            if (term !== null) 
                return NumberToken._new815(tt, tt, term.tag.toString(), NumberSpellingType.AGE, tt.morph);
            for (i = ss.length - 2; i > 2; i--) {
                let ss1 = ss.substring(0, 0 + i);
                let term1 = NumberHelper.m_Nums.find(ss1);
                if (term1 === null) 
                    continue;
                let ss2 = ss.substring(i);
                let term2 = NumberHelper.m_Nums.find(ss2);
                if (term2 === null) 
                    continue;
                let num0 = term1.tag.toString();
                let num1 = term2.tag.toString();
                if (num0.length > 1 && num0[num0.length - 1] === '0' && num1.length === 1) 
                    return NumberToken._new815(tt, tt, num0.substring(0, 0 + num0.length - 1) + num1, NumberSpellingType.AGE, tt.morph);
            }
        }
        return null;
    }
    
    /**
     * Выделение годовщин и летий (XX-летие) ...
     * @param t начальный токен
     * @return числовой метатокен или null
     */
    static tryParseAnniversary(t) {
        let nt = Utils.as(t, NumberToken);
        let t1 = null;
        if (nt !== null) 
            t1 = nt.next;
        else {
            if ((((nt = NumberHelper.tryParseRoman(t)))) === null) {
                if (t instanceof TextToken) {
                    let v = t.term;
                    let num = 0;
                    if (v.endsWith("ЛЕТИЯ") || v.endsWith("ЛЕТИЕ")) {
                        if (v.startsWith("ВОСЕМЬСОТ") || v.startsWith("ВОСЬМИСОТ")) 
                            num = 800;
                    }
                    if (num > 0) 
                        return new NumberToken(t, t, num.toString(), NumberSpellingType.AGE);
                }
                return null;
            }
            t1 = nt.endToken.next;
        }
        if (t1 === null) 
            return null;
        if (t1.isHiphen) 
            t1 = t1.next;
        if (t1 instanceof TextToken) {
            let v = t1.term;
            if ((v === "ЛЕТ" || v === "ЛЕТИЯ" || v === "ЛЕТИЕ") || v.startsWith("ГОДОВ")) {
                if (t1.next !== null && t1.next.isChar('.')) 
                    t1 = t1.next;
                return new NumberToken(t, t1, nt.value, NumberSpellingType.AGE);
            }
            if (v === "ГОД" && t1.next !== null) {
                t1 = t1.next;
                if (t1.next !== null && t1.isChar('.')) 
                    t1 = t1.next;
                if (t1.isValue("ОКТЯБРЬ", null) || t1.isValue("ПОБЕДА", null)) 
                    return new NumberToken(t, t1.previous, nt.value, NumberSpellingType.AGE);
            }
            if (t1.morph.language.isUa) {
                if (v === "РОКІВ" || v === "РІЧЧЯ" || t1.isValue("РІЧНИЦЯ", null)) 
                    return new NumberToken(t, t1, nt.value, NumberSpellingType.AGE);
            }
        }
        return null;
    }
    
    static analizeNumberTail(tt, val) {
        if (!(tt instanceof TextToken)) 
            return null;
        let ok0 = false;
        if (!tt.isWhitespaceBefore) 
            ok0 = true;
        else if (tt.previous !== null && tt.previous.isHiphen) 
            ok0 = true;
        let s = tt.term;
        let mc = null;
        if (!tt.chars.isLetter) {
            if (((s === "<" || s === "(")) && (tt.next instanceof TextToken)) {
                s = tt.next.term;
                if ((s === "TH" || s === "ST" || s === "RD") || s === "ND") {
                    if (tt.next.next !== null && tt.next.next.isCharOf(">)")) {
                        mc = new MorphCollection();
                        mc._class = MorphClass.ADJECTIVE;
                        mc.language = MorphLang.EN;
                        return MetaToken._new823(tt, tt.next.next, mc);
                    }
                }
            }
            return null;
        }
        if ((s === "TH" || s === "ST" || s === "RD") || s === "ND") {
            mc = new MorphCollection();
            mc._class = MorphClass.ADJECTIVE;
            mc.language = MorphLang.EN;
            return MetaToken._new823(tt, tt, mc);
        }
        if (!tt.chars.isCyrillicLetter) 
            return null;
        if (!tt.isWhitespaceAfter) {
            if (tt.next !== null && tt.next.chars.isLetter) 
                return null;
            if (tt.lengthChar === 1 && ((tt.isValue("X", null) || tt.isValue("Х", null)))) 
                return null;
        }
        if (!tt.chars.isAllLower || !ok0) {
            let ss = tt.term;
            if (ss === "Я" || ss === "Й" || ss === "Е") {
                if (ss === "Е" && ((tt.previous === null || !tt.previous.isHiphen))) 
                    return null;
            }
            else if (ss.length === 2 && ((ss[1] === 'Я' || ss[1] === 'Й' || ss[1] === 'Е'))) {
            }
            else 
                return null;
        }
        if (tt.term === "М") {
            if (tt.previous === null || !tt.previous.isHiphen) 
                return null;
        }
        if (Utils.isNullOrEmpty(val)) 
            return null;
        let dig = ((val.charCodeAt(val.length - 1)) - ('0'.charCodeAt(0)));
        if ((dig < 0) || dig >= 10) 
            return null;
        if (val.length === 2 && val[0] === '1') 
            dig = 0;
        let samp = NumberHelper.m_Samples[dig];
        if (val.length > 1 && val[val.length - 2] === '1') 
            samp = "ДЕВЯТЫЙ";
        let vars = null;
        try {
            vars = MorphologyService.getAllWordforms(samp, null);
        } catch (ex825) {
        }
        if (vars === null || vars.length === 0) 
            return null;
        for (const v of vars) {
            if (v._class.isAdjective && LanguageHelper.endsWith(v.normalCase, s) && v.number !== MorphNumber.UNDEFINED) {
                if (mc === null) 
                    mc = new MorphCollection();
                let ok = false;
                for (const it of mc.items) {
                    if (it._class.equals(v._class) && it.number === v.number && ((it.gender === v.gender || v.number === MorphNumber.PLURAL))) {
                        it._case = MorphCase.ooBitor(it._case, v._case);
                        ok = true;
                        break;
                    }
                }
                if (!ok) {
                    let mm = new MorphBaseInfo();
                    mm.copyFrom(v);
                    mc.addItem(mm);
                }
            }
        }
        if (tt.morph.language.isUa && mc === null && s === "Ї") {
            mc = new MorphCollection();
            mc.addItem(MorphBaseInfo._new826(MorphClass.ADJECTIVE));
        }
        if (mc !== null) 
            return MetaToken._new823(tt, tt, mc);
        if ((((s.length < 3) && !tt.isWhitespaceBefore && tt.previous !== null) && tt.previous.isHiphen && !tt.previous.isWhitespaceBefore) && tt.whitespacesAfterCount === 1 && s !== "А") {
            if (s.length === 1 && s !== "Й" && !LanguageHelper.isCyrillicVowel(s[0])) {
            }
            else 
                return MetaToken._new823(tt, tt, MorphCollection._new828(MorphClass.ADJECTIVE));
        }
        return null;
    }
    
    static _tryParseFloat(t, d, attrs) {
        const NumberExHelper = require("./internal/NumberExHelper");
        d.value = 0;
        if (t === null || t.next === null || t.typ !== NumberSpellingType.DIGIT) 
            return null;
        for (let tt = t.beginToken; tt !== null && tt.endChar <= t.endChar; tt = tt.next) {
            if ((tt instanceof TextToken) && tt.chars.isLetter) 
                return null;
        }
        let kit = t.kit;
        let ns = null;
        let sps = null;
        for (let t1 = t; t1 !== null; t1 = t1.next) {
            if (t1.next === null) 
                break;
            if (((t1.next instanceof NumberToken) && (((t1.whitespacesAfterCount < 6) || ((t.previous !== null && t.previous.isTableControlChar)))) && t1.next.typ === NumberSpellingType.DIGIT) && t1.next.lengthChar === 3) {
                if (ns === null) {
                    ns = new Array();
                    ns.push(t);
                    sps = new Array();
                }
                else if (sps[0] !== ' ') 
                    return null;
                ns.push(Utils.as(t1.next, NumberToken));
                sps.push(' ');
                continue;
            }
            if ((t1.next.isCharOf(",.") && (t1.next.next instanceof NumberToken) && t1.next.next.typ === NumberSpellingType.DIGIT) && (t1.whitespacesAfterCount < 6) && (t1.next.whitespacesAfterCount < 2)) {
                if ((((attrs.value()) & (NumberParseAttr.NOWHITESPACES.value()))) !== (NumberParseAttr.NO.value())) {
                    if (t1.isWhitespaceAfter || t1.next.isWhitespaceAfter) 
                        break;
                }
                if (ns === null) {
                    ns = new Array();
                    ns.push(t);
                    sps = new Array();
                }
                else if (t1.next.isWhitespaceAfter && t1.next.next.lengthChar !== 3 && ((t1.next.isChar('.') ? '.' : ',')) === sps[sps.length - 1]) 
                    break;
                ns.push(Utils.as(t1.next.next, NumberToken));
                sps.push((t1.next.isChar('.') ? '.' : ','));
                t1 = t1.next;
                continue;
            }
            break;
        }
        if (sps === null) 
            return null;
        let isLastDrob = false;
        let notSetDrob = false;
        let merge = false;
        let m_PrevPointChar = '.';
        if (sps.length === 1) {
            if (sps[0] === ' ') 
                isLastDrob = false;
            else if ((((attrs.value()) & (NumberParseAttr.COMMAISFLOATPOINT.value()))) !== (NumberParseAttr.NO.value()) && sps[0] === ',') 
                isLastDrob = true;
            else if (ns[1].lengthChar !== 3) {
                isLastDrob = true;
                if (ns.length === 2) {
                    if (ns[1].endToken.chars.isLetter) 
                        merge = true;
                    else if (ns[1].endToken.isChar('.') && ns[1].endToken.previous !== null && ns[1].endToken.previous.chars.isLetter) 
                        merge = true;
                    if (ns[1].isWhitespaceBefore) {
                        if ((ns[1].endToken instanceof TextToken) && ns[1].endToken.term.endsWith("000")) 
                            return null;
                    }
                }
            }
            else if (ns[0].lengthChar > 3 || ns[0].realValue === 0) 
                isLastDrob = true;
            else {
                let ok = true;
                if (ns.length === 2 && ns[1].lengthChar === 3) {
                    let ttt = NumberExHelper.m_Postfixes.tryParse(ns[1].endToken.next, TerminParseAttr.NO);
                    if (ttt !== null && (NumberExType.of(ttt.termin.tag)) === NumberExType.MONEY) {
                        isLastDrob = false;
                        ok = false;
                        notSetDrob = false;
                    }
                    else if (ns[1].endToken.next !== null && ns[1].endToken.next.isChar('(') && (ns[1].endToken.next.next instanceof NumberToken)) {
                        let nt1 = Utils.as(ns[1].endToken.next.next, NumberToken);
                        if (nt1.realValue === (((ns[0].realValue * (1000)) + ns[1].realValue))) {
                            isLastDrob = false;
                            ok = false;
                            notSetDrob = false;
                        }
                    }
                }
                if (ok) {
                    if (t.kit.miscData.containsKey("pt")) 
                        m_PrevPointChar = String(t.kit.miscData.get("pt"));
                    if (m_PrevPointChar === sps[0]) {
                        isLastDrob = true;
                        notSetDrob = true;
                    }
                    else {
                        isLastDrob = false;
                        notSetDrob = true;
                    }
                }
            }
        }
        else {
            let last = sps[sps.length - 1];
            if (last === ' ' && sps[0] !== last) 
                return null;
            for (let i = 0; i < (sps.length - 1); i++) {
                if (sps[i] !== sps[0]) 
                    return null;
                else if (ns[i + 1].lengthChar !== 3) 
                    return null;
            }
            if (sps[0] !== last) 
                isLastDrob = true;
            else if (ns[ns.length - 1].lengthChar !== 3) 
                return null;
            if (ns[0].lengthChar > 3) 
                return null;
        }
        for (let i = 0; i < ns.length; i++) {
            if ((i < (ns.length - 1)) || !isLastDrob) {
                if (i === 0) 
                    d.value = ns[i].realValue;
                else 
                    d.value = (d.value * (1000)) + ns[i].realValue;
                if (i === (ns.length - 1) && !notSetDrob) {
                    if (sps[sps.length - 1] === ',') 
                        m_PrevPointChar = '.';
                    else if (sps[sps.length - 1] === '.') 
                        m_PrevPointChar = ',';
                }
            }
            else {
                if (!notSetDrob) {
                    m_PrevPointChar = sps[sps.length - 1];
                    if (m_PrevPointChar === ',') {
                    }
                }
                let f2 = 0;
                if (merge) {
                    let sss = ns[i].value.toString();
                    let kkk = 0;
                    for (kkk = 0; kkk < (sss.length - ns[i].beginToken.lengthChar); kkk++) {
                        d.value *= (10);
                    }
                    f2 = ns[i].realValue;
                    for (kkk = 0; kkk < ns[i].beginToken.lengthChar; kkk++) {
                        f2 /= (10);
                    }
                    d.value += f2;
                }
                else {
                    f2 = ns[i].realValue;
                    for (let kkk = 0; kkk < ns[i].lengthChar; kkk++) {
                        f2 /= (10);
                    }
                    d.value += f2;
                }
            }
        }
        if (kit.miscData.containsKey("pt")) 
            kit.miscData.put("pt", m_PrevPointChar);
        else 
            kit.miscData.put("pt", m_PrevPointChar);
        return ns[ns.length - 1];
    }
    
    /**
     * Выделить действительное число, знак также выделяется, 
     * разделители дроби могут быть точка или запятая, разделителями тысячных 
     * могут быть точки, пробелы и запятые.
     * @param t начальный токен
     * @param attrs дополнительные атрибуты выделения
     * @return числовой метатокен или null
     * 
     */
    static tryParseRealNumber(t, attrs = NumberParseAttr.NO) {
        let isNot = false;
        let t0 = t;
        if (t !== null) {
            if (t.isHiphen || t.isValue("МИНУС", "МІНУС")) {
                t = t.next;
                isNot = true;
            }
            else if (t.isChar('+') || t.isValue("ПЛЮС", null)) 
                t = t.next;
        }
        if ((t instanceof TextToken) && ((t.isValue("НОЛЬ", null) || t.isValue("НУЛЬ", null)))) {
            if (t.next === null) 
                return new NumberToken(t, t, "0", NumberSpellingType.WORDS);
            if (t.next.isValue("ЦЕЛЫЙ", "ЦІЛИЙ") && t.next.next !== null) 
                t = t.next;
            if (t.next.isCommaAnd && t.next.next !== null) 
                t = t.next;
            let res0 = new NumberToken(t, t.next, "0", NumberSpellingType.WORDS);
            t = t.next;
            if ((t instanceof NumberToken) && t.intValue !== null) {
                let val = t.intValue;
                if (t.next !== null && val > 0) 
                    res0._corrDrob(val);
                if (res0.realValue === 0) {
                    res0.endToken = t;
                    res0.value = ("0." + val);
                }
            }
            return res0;
        }
        if (t instanceof TextToken) {
            let tok = NumberHelper.m_AfterPoints.tryParse(t, TerminParseAttr.NO);
            if (tok !== null) {
                let res0 = new NumberExToken(t, tok.endToken, null, NumberSpellingType.WORDS, NumberExType.UNDEFINED);
                res0.realValue = tok.termin.tag;
                return res0;
            }
        }
        if (t === null) 
            return null;
        if (!(t instanceof NumberToken)) {
            if (t.isValue("СОТНЯ", null)) 
                return new NumberToken(t, t, "100", NumberSpellingType.WORDS);
            if (t.isValue("ТЫЩА", null) || t.isValue("ТЫСЯЧА", "ТИСЯЧА")) 
                return new NumberToken(t, t, "1000", NumberSpellingType.WORDS);
            return null;
        }
        if (t.next !== null && t.next.isValue("ЦЕЛЫЙ", "ЦІЛИЙ")) {
            let tt1 = t.next.next;
            if (tt1 !== null && tt1.isCommaAnd) 
                tt1 = tt1.next;
            if ((tt1 instanceof NumberToken) || (((tt1 instanceof TextToken) && tt1.isValue("НОЛЬ", "НУЛЬ")))) {
                let res0 = new NumberExToken(t, t.next, t.value, NumberSpellingType.WORDS, NumberExType.UNDEFINED);
                t = tt1;
                let val = 0;
                if (t instanceof TextToken) {
                    res0.endToken = t;
                    t = t.next;
                }
                if (t instanceof NumberToken) {
                    res0.endToken = t;
                    val = t.realValue;
                    t = t.next;
                    res0._corrDrob(val);
                }
                if (res0.realValue === 0) {
                    let str = ("0." + val);
                    let dd = 0;
                    let wrapdd832 = new RefOutArgWrapper();
                    let inoutres833 = Utils.tryParseFloat(str, wrapdd832);
                    dd = wrapdd832.value;
                    if (inoutres833) {
                    }
                    else {
                        let wrapdd830 = new RefOutArgWrapper();
                        let inoutres831 = Utils.tryParseFloat(Utils.replaceString(str, '.', ','), wrapdd830);
                        dd = wrapdd830.value;
                        if (inoutres831) {
                        }
                        else 
                            return null;
                    }
                    res0.realValue = dd + res0.realValue;
                }
                return res0;
            }
        }
        let d = 0;
        let wrapd835 = new RefOutArgWrapper();
        let tt = NumberHelper._tryParseFloat(Utils.as(t, NumberToken), wrapd835, attrs);
        d = wrapd835.value;
        if (tt === null) {
            if ((t.next === null || t.isWhitespaceAfter || t.next.chars.isLetter) || (((attrs.value()) & (NumberParseAttr.CANNOTBEINTEGER.value()))) === (NumberParseAttr.NO.value())) {
                tt = t;
                d = t.realValue;
            }
            else 
                return null;
        }
        if (isNot) 
            d = -d;
        if (tt.next !== null && tt.next.isValue("ДЕСЯТОК", null)) {
            d *= (10);
            tt = tt.next;
        }
        return NumberExToken._new834(t0, tt, "", NumberSpellingType.DIGIT, NumberExType.UNDEFINED, d);
    }
    
    /**
     * Преобразовать целое число в записанное буквами числительное в нужном роде и числе именительного падежа. 
     * Например, 5 жен.ед. - ПЯТАЯ,  26 мн. - ДВАДЦАТЬ ШЕСТЫЕ.
     * @param value целочисленное значение
     * @param gender род
     * @param num число
     * @return значение
     * 
     */
    static getNumberAdjective(value, gender, num) {
        if ((value < 1) || value >= 100) 
            return null;
        let words = null;
        if (num === MorphNumber.PLURAL) 
            words = NumberHelper.m_PluralNumberWords;
        else if (gender === MorphGender.FEMINIE) 
            words = NumberHelper.m_WomanNumberWords;
        else if (gender === MorphGender.NEUTER) 
            words = NumberHelper.m_NeutralNumberWords;
        else 
            words = NumberHelper.m_ManNumberWords;
        if (value < 20) 
            return words[value - 1];
        let i = Utils.intDiv(value, 10);
        let j = value % 10;
        i -= 2;
        if (i >= NumberHelper.m_DecDumberWords.length) 
            return null;
        if (j > 0) 
            return (NumberHelper.m_DecDumberWords[i] + " " + words[j - 1]);
        let decs = null;
        if (num === MorphNumber.PLURAL) 
            decs = NumberHelper.m_PluralDecDumberWords;
        else if (gender === MorphGender.FEMINIE) 
            decs = NumberHelper.m_WomanDecDumberWords;
        else if (gender === MorphGender.NEUTER) 
            decs = NumberHelper.m_NeutralDecDumberWords;
        else 
            decs = NumberHelper.m_ManDecDumberWords;
        return decs[i];
    }
    
    static checkPureNumber(t) {
        if (t instanceof NumberToken) 
            return NumberHelper.checkPureNumber(t.endToken);
        if (!(t instanceof TextToken)) 
            return false;
        for (const w of NumberHelper.m_1Words) {
            if (t.isValue(w, null)) 
                return true;
        }
        for (const w of NumberHelper.m_10Words) {
            if (t.isValue(w, null)) 
                return true;
        }
        for (const w of NumberHelper.m_100Words) {
            if (t.isValue(w, null)) 
                return true;
        }
        return false;
    }
    
    /**
     * Получить для числа римскую запись
     * @param val целое число
     * @return римская запись
     */
    static getNumberRoman(val) {
        if (val > 0 && val <= NumberHelper.m_Romans.length) 
            return NumberHelper.m_Romans[val - 1];
        return val.toString();
    }
    
    /**
     * Получить строковое представление целого числа. Например, GetNumberString(38, "попугай") => "тридцать восемь попугаев".
     * @param val значение
     * @param units единицы измерения (если не null, то они тоже будут преобразовываться в нужное число)
     * @return строковое представление (пока на русском языке)
     */
    static getNumberString(val, units = null) {
        if (val < 0) 
            return "минус " + NumberHelper.getNumberString(-val, units);
        let res = null;
        if (val >= 1000000000) {
            let vv = Utils.intDiv(val, 1000000000);
            res = NumberHelper.getNumberString(vv, "миллиард");
            vv = val % 1000000000;
            if (vv !== 0) 
                res = (res + " " + NumberHelper.getNumberString(vv, units));
            else if (units !== null) 
                res = (res + " " + MiscHelper.getTextMorphVarByCaseAndNumberEx(units, MorphCase.GENITIVE, MorphNumber.PLURAL, null));
            return res.toLowerCase();
        }
        if (val >= 1000000) {
            let vv = Utils.intDiv(val, 1000000);
            res = NumberHelper.getNumberString(vv, "миллион");
            vv = val % 1000000;
            if (vv !== 0) 
                res = (res + " " + NumberHelper.getNumberString(vv, units));
            else if (units !== null) 
                res = (res + " " + MiscHelper.getTextMorphVarByCaseAndNumberEx(units, MorphCase.GENITIVE, MorphNumber.PLURAL, null));
            return res.toLowerCase();
        }
        if (val >= 1000) {
            let vv = Utils.intDiv(val, 1000);
            res = NumberHelper.getNumberString(vv, "тысяча");
            vv = val % 1000;
            if (vv !== 0) 
                res = (res + " " + NumberHelper.getNumberString(vv, units));
            else if (units !== null) 
                res = (res + " " + MiscHelper.getTextMorphVarByCaseAndNumberEx(units, MorphCase.GENITIVE, MorphNumber.PLURAL, null));
            return res.toLowerCase();
        }
        if (val >= 100) {
            let vv = Utils.intDiv(val, 100);
            res = NumberHelper.m_100Words[vv - 1];
            vv = val % 100;
            if (vv !== 0) 
                res = (res + " " + NumberHelper.getNumberString(vv, units));
            else if (units !== null) 
                res = (res + " " + MiscHelper.getTextMorphVarByCaseAndNumberEx(units, MorphCase.GENITIVE, MorphNumber.PLURAL, null));
            return res.toLowerCase();
        }
        if (val >= 20) {
            let vv = Utils.intDiv(val, 10);
            res = NumberHelper.m_10Words[vv - 1];
            vv = val % 10;
            if (vv !== 0) 
                res = (res + " " + NumberHelper.getNumberString(vv, units));
            else if (units !== null) 
                res = (res + " " + MiscHelper.getTextMorphVarByCaseAndNumberEx(units, MorphCase.GENITIVE, MorphNumber.PLURAL, null));
            return res.toLowerCase();
        }
        if (units !== null) {
            try {
                if (val === 1) {
                    let bi = MorphologyService.getWordBaseInfo(units.toUpperCase(), null, false, false);
                    if (((bi.gender.value()) & (MorphGender.FEMINIE.value())) === (MorphGender.FEMINIE.value())) 
                        return "одна " + units;
                    if (((bi.gender.value()) & (MorphGender.NEUTER.value())) === (MorphGender.NEUTER.value())) 
                        return "одно " + units;
                    return "один " + units;
                }
                if (val === 2) {
                    let bi = MorphologyService.getWordBaseInfo(units.toUpperCase(), null, false, false);
                    if (((bi.gender.value()) & (MorphGender.FEMINIE.value())) === (MorphGender.FEMINIE.value())) 
                        return "две " + MiscHelper.getTextMorphVarByCaseAndNumberEx(units, null, MorphNumber.PLURAL, null);
                }
            } catch (ex836) {
            }
            return (NumberHelper.m_1Words[val].toLowerCase() + " " + MiscHelper.getTextMorphVarByCaseAndNumberEx(units, MorphCase.GENITIVE, MorphNumber.UNDEFINED, val.toString()));
        }
        return NumberHelper.m_1Words[val].toLowerCase();
    }
    
    /**
     * Получить морфологическую информацию для последующей нормализации того, что идёт за числом. 
     * Например, для 38 вернёт то, в какую форму нужно преобразовать "ПОПУГАЙ" - множ.число именит.падеж.
     * @param numVal число (например, 123)
     * @param cla часть речи (существительное или прилагательное)
     * @return результат
     */
    static getNumberBaseInfo(numVal, cla) {
        let ch = numVal[numVal.length - 1];
        let n = 0;
        let wrapn838 = new RefOutArgWrapper();
        Utils.tryParseInt(numVal, wrapn838);
        n = wrapn838.value;
        let res = MorphBaseInfo._new826(cla);
        if (numVal === "1" || ((ch === '1' && n > 20 && ((n % 100)) !== 11))) {
            res.number = MorphNumber.SINGULAR;
            res._case = MorphCase.NOMINATIVE;
        }
        else if (((ch === '2' || ch === '3' || ch === '4')) && ((n < 10))) {
            if (cla.isAdjective) {
                res.number = MorphNumber.PLURAL;
                res._case = MorphCase.NOMINATIVE;
            }
            else {
                res.number = MorphNumber.SINGULAR;
                res._case = MorphCase.GENITIVE;
            }
        }
        else {
            res.number = MorphNumber.PLURAL;
            res._case = MorphCase.GENITIVE;
        }
        return res;
    }
    
    // Выделение стандартных мер, типа: 10 кв.м.
    // УСТАРЕЛО. Вместо этого лучше использовать возможности MeasureReferent.
    static tryParseNumberWithPostfix(t) {
        const NumberExHelper = require("./internal/NumberExHelper");
        return NumberExHelper.tryParseNumberWithPostfix(t);
    }
    
    // Это попробовать только тип (постфикс) без самого числа.
    // Например, куб.м.
    static tryParsePostfixOnly(t) {
        const NumberExHelper = require("./internal/NumberExHelper");
        return NumberExHelper.tryAttachPostfixOnly(t);
    }
    
    // Если это обозначение денежной единицы (н-р, $), то возвращает код валюты
    static isMoneyChar(t) {
        if (!(t instanceof TextToken) || t.lengthChar !== 1) 
            return null;
        let ch = t.term[0];
        if (ch === '$') 
            return "USD";
        if (ch === '£' || ch === (String.fromCharCode(0xA3)) || ch === (String.fromCharCode(0x20A4))) 
            return "GBP";
        if (ch === '€') 
            return "EUR";
        if (ch === '₿') 
            return "BTC";
        if (ch === '¥' || ch === (String.fromCharCode(0xA5))) 
            return "JPY";
        if (ch === (String.fromCharCode(0x20A9))) 
            return "KRW";
        if (ch === (String.fromCharCode(0xFFE5)) || ch === 'Ұ' || ch === 'Ұ') 
            return "CNY";
        if (ch === (String.fromCharCode(0x20BD))) 
            return "RUB";
        if (ch === (String.fromCharCode(0x20B4))) 
            return "UAH";
        if (ch === (String.fromCharCode(0x20AB))) 
            return "VND";
        if (ch === (String.fromCharCode(0x20AD))) 
            return "LAK";
        if (ch === (String.fromCharCode(0x20BA))) 
            return "TRY";
        if (ch === (String.fromCharCode(0x20B1))) 
            return "PHP";
        if (ch === (String.fromCharCode(0x17DB))) 
            return "KHR";
        if (ch === (String.fromCharCode(0x20B9))) 
            return "INR";
        if (ch === (String.fromCharCode(0x20A8))) 
            return "IDR";
        if (ch === (String.fromCharCode(0x20B5))) 
            return "GHS";
        if (ch === (String.fromCharCode(0x09F3))) 
            return "BDT";
        if (ch === (String.fromCharCode(0x20B8))) 
            return "KZT";
        if (ch === (String.fromCharCode(0x20AE))) 
            return "MNT";
        if (ch === (String.fromCharCode(0x0192))) 
            return "HUF";
        if (ch === (String.fromCharCode(0x20AA))) 
            return "ILS";
        return null;
    }
    
    /**
     * Для парсинга действительного числа из строки используйте эту функцию, 
     * которая работает назависимо от локализьных настроек и на всех языках программирования.
     * @param str строка с действительным числом
     * @return double-число или null
     * 
     */
    static stringToDouble(str) {
        let res = 0;
        if (Utils.isNullOrEmpty(str)) 
            return null;
        if (str === "NaN") 
            return Number.NaN;
        let wrapres843 = new RefOutArgWrapper();
        let inoutres844 = Utils.tryParseFloat(str, wrapres843);
        res = wrapres843.value;
        if (inoutres844) 
            return res;
        let wrapres841 = new RefOutArgWrapper();
        let inoutres842 = Utils.tryParseFloat(Utils.replaceString(str, '.', ','), wrapres841);
        res = wrapres841.value;
        if (inoutres842) 
            return res;
        let wrapres839 = new RefOutArgWrapper();
        let inoutres840 = Utils.tryParseFloat(Utils.replaceString(str, ',', '.'), wrapres839);
        res = wrapres839.value;
        if (inoutres840) 
            return res;
        return null;
    }
    
    /**
     * Независимо от языка и локальных настроек выводит действительное число в строку, 
     * разделитель - всегда точка. Ситуация типа 1.0000000001 или 23.7299999999999, 
     * случающиеся на разных языках, округляются куда надо.
     * @param d число
     * @return строковый результат
     * 
     */
    static doubleToString(d) {
        if (isNaN(d)) 
            return "NaN";
        let res = null;
        if (Utils.mathTruncate(d) === 0.0) 
            res = Utils.replaceString(d.toString(), ",", ".");
        else {
            let rest = Math.abs(d - Utils.mathTruncate(d));
            if ((rest < 0.000000001) && rest > 0) {
                res = Utils.mathTruncate(d).toString();
                if ((res.indexOf('E') < 0) && (res.indexOf('e') < 0)) {
                    let ii = res.indexOf('.');
                    if (ii < 0) 
                        ii = res.indexOf(',');
                    if (ii > 0) 
                        return res.substring(0, 0 + ii);
                    else 
                        return res;
                }
            }
            else 
                res = Utils.replaceString(d.toString(), ",", ".");
        }
        if (res.endsWith(".0")) 
            res = res.substring(0, 0 + res.length - 2);
        let i = res.indexOf('e');
        if (i < 0) 
            i = res.indexOf('E');
        if (i > 0) {
            let exp = 0;
            let neg = false;
            for (let jj = i + 1; jj < res.length; jj++) {
                if (res[jj] === '+') {
                }
                else if (res[jj] === '-') 
                    neg = true;
                else 
                    exp = (exp * 10) + (((res.charCodeAt(jj)) - ('0'.charCodeAt(0))));
            }
            res = res.substring(0, 0 + i);
            if (res.endsWith(".0")) 
                res = res.substring(0, 0 + res.length - 2);
            let nneg = false;
            if (res[0] === '-') {
                nneg = true;
                res = res.substring(1);
            }
            let v1 = new StringBuilder();
            let v2 = new StringBuilder();
            i = res.indexOf('.');
            if (i < 0) 
                v1.append(res);
            else {
                v1.append(res.substring(0, 0 + i));
                v2.append(res.substring(i + 1));
            }
            for (; exp > 0; exp--) {
                if (neg) {
                    if (v1.length > 0) {
                        v2.insert(0, v1.charAt(v1.length - 1));
                        v1.length = v1.length - 1;
                    }
                    else 
                        v2.insert(0, '0');
                }
                else if (v2.length > 0) {
                    v1.append(v2.charAt(0));
                    v2.remove(0, 1);
                }
                else 
                    v1.append('0');
            }
            if (v2.length === 0) 
                res = v1.toString();
            else if (v1.length === 0) 
                res = "0." + v2.toString();
            else 
                res = (v1.toString() + "." + v2.toString());
            if (nneg) 
                res = "-" + res;
        }
        i = res.indexOf('.');
        if (i < 0) 
            return res;
        i++;
        let j = 0;
        for (j = i + 1; j < res.length; j++) {
            if (res[j] === '9') {
                let k = 0;
                let jj = 0;
                for (jj = j; jj < res.length; jj++) {
                    if (res[jj] !== '9') 
                        break;
                    else 
                        k++;
                }
                if (jj >= res.length || ((jj === (res.length - 1) && res[jj] === '8'))) {
                    if (k > 5) {
                        for (; j > i; j--) {
                            if (res[j] !== '9') {
                                if (res[j] !== '.') 
                                    return (res.substring(0, 0 + j) + ((((res.charCodeAt(j)) - ('0'.charCodeAt(0)))) + 1));
                            }
                        }
                        break;
                    }
                }
            }
        }
        return res;
    }
    
    static initialize() {
        if (NumberHelper.m_Nums !== null) 
            return;
        NumberHelper.m_Nums = new TerminCollection();
        NumberHelper.m_Nums.allAddStrsNormalized = true;
        NumberHelper.m_Nums.addString("ОДИН", 1, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ПЕРВЫЙ", 1 | NumberHelper.prilNumTagBit, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ОДИН", 1, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ПЕРШИЙ", 1 | NumberHelper.prilNumTagBit, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ОДНА", 1, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ОДНО", 1, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("FIRST", 1 | NumberHelper.prilNumTagBit, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("SEMEL", 1, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("ONE", 1, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("ДВА", 2, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ВТОРОЙ", 2 | NumberHelper.prilNumTagBit, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ДВОЕ", 2, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ДВЕ", 2, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ДВУХ", 2, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ОБА", 2, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ОБЕ", 2, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ДВА", 2, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ДРУГИЙ", 2 | NumberHelper.prilNumTagBit, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ДВОЄ", 2, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ДВІ", 2, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ДВОХ", 2, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ОБОЄ", 2, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ОБИДВА", 2, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("SECOND", 2 | NumberHelper.prilNumTagBit, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("BIS", 2, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("TWO", 2, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("ТРИ", 3, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ТРЕТИЙ", 3 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ТРЕХ", 3, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ТРОЕ", 3, MorphLang.RU, true);
        NumberHelper.m_Nums.addString("ТРИ", 3, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ТРЕТІЙ", 3 | NumberHelper.prilNumTagBit, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ТРЬОХ", 3, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("ТРОЄ", 3, MorphLang.UA, true);
        NumberHelper.m_Nums.addString("THIRD", 3 | NumberHelper.prilNumTagBit, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("TER", 3, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("THREE", 3, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("ЧЕТЫРЕ", 4, null, false);
        NumberHelper.m_Nums.addString("ЧЕТВЕРТЫЙ", 4 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ЧЕТЫРЕХ", 4, null, false);
        NumberHelper.m_Nums.addString("ЧЕТВЕРО", 4, null, false);
        NumberHelper.m_Nums.addString("ЧОТИРИ", 4, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ЧЕТВЕРТИЙ", 4 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ЧОТИРЬОХ", 4, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("FORTH", 4 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("QUATER", 4, null, false);
        NumberHelper.m_Nums.addString("FOUR", 4, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("ПЯТЬ", 5, null, false);
        NumberHelper.m_Nums.addString("ПЯТЫЙ", 5 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ПЯТИ", 5, null, false);
        NumberHelper.m_Nums.addString("ПЯТЕРО", 5, null, false);
        NumberHelper.m_Nums.addString("ПЯТЬ", 5, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ПЯТИЙ", 5 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("FIFTH", 5 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("QUINQUIES", 5, null, false);
        NumberHelper.m_Nums.addString("FIVE", 5, MorphLang.EN, true);
        NumberHelper.m_Nums.addString("ШЕСТЬ", 6, null, false);
        NumberHelper.m_Nums.addString("ШЕСТОЙ", 6 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ШЕСТИ", 6, null, false);
        NumberHelper.m_Nums.addString("ШЕСТЕРО", 6, null, false);
        NumberHelper.m_Nums.addString("ШІСТЬ", 6, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ШОСТИЙ", 6 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("SIX", 6, MorphLang.EN, false);
        NumberHelper.m_Nums.addString("SIXTH", 6 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("SEXIES ", 6, null, false);
        NumberHelper.m_Nums.addString("СЕМЬ", 7, null, false);
        NumberHelper.m_Nums.addString("СЕДЬМОЙ", 7 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СЕМИ", 7, null, false);
        NumberHelper.m_Nums.addString("СЕМЕРО", 7, null, false);
        NumberHelper.m_Nums.addString("СІМ", 7, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СЬОМИЙ", 7 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("SEVEN", 7, null, false);
        NumberHelper.m_Nums.addString("SEVENTH", 7 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("SEPTIES", 7, null, false);
        NumberHelper.m_Nums.addString("ВОСЕМЬ", 8, null, false);
        NumberHelper.m_Nums.addString("ВОСЬМОЙ", 8 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ВОСЬМИ", 8, null, false);
        NumberHelper.m_Nums.addString("ВОСЬМЕРО", 8, null, false);
        NumberHelper.m_Nums.addString("ВІСІМ", 8, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ВОСЬМИЙ", 8 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("EIGHT", 8, null, false);
        NumberHelper.m_Nums.addString("EIGHTH", 8 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("OCTIES", 8, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТЬ", 9, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТЫЙ", 9 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТИ", 9, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТЕРО", 9, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТЬ", 9, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДЕВЯТИЙ", 9 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("NINE", 9, null, false);
        NumberHelper.m_Nums.addString("NINTH", 9 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("NOVIES", 9, null, false);
        NumberHelper.m_Nums.addString("ДЕСЯТЬ", 10, null, false);
        NumberHelper.m_Nums.addString("ДЕСЯТЫЙ", 10 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕСЯТИ", 10, null, false);
        NumberHelper.m_Nums.addString("ДЕСЯТИРО", 10, null, false);
        NumberHelper.m_Nums.addString("ДЕСЯТЬ", 10, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДЕСЯТИЙ", 10 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("TEN", 10, null, false);
        NumberHelper.m_Nums.addString("TENTH", 10 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("DECIES", 10, null, false);
        NumberHelper.m_Nums.addString("ОДИННАДЦАТЬ", 11, null, false);
        NumberHelper.m_Nums.addString("ОДИНАДЦАТЬ", 11, null, false);
        NumberHelper.m_Nums.addString("ОДИННАДЦАТЫЙ", 11 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ОДИННАДЦАТИ", 11, null, false);
        NumberHelper.m_Nums.addString("ОДИННАДЦАТИРО", 11, null, false);
        NumberHelper.m_Nums.addString("ОДИНАДЦЯТЬ", 11, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ОДИНАДЦЯТИЙ", 11 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ОДИНАДЦЯТИ", 11, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ELEVEN", 11, null, false);
        NumberHelper.m_Nums.addString("ELEVENTH", 11 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДВЕНАДЦАТЬ", 12, null, false);
        NumberHelper.m_Nums.addString("ДВЕНАДЦАТЫЙ", 12 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДВЕНАДЦАТИ", 12, null, false);
        NumberHelper.m_Nums.addString("ДВАНАДЦЯТЬ", 12, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДВАНАДЦЯТИЙ", 12 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДВАНАДЦЯТИ", 12, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("TWELVE", 12, null, false);
        NumberHelper.m_Nums.addString("TWELFTH", 12 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ТРИНАДЦАТЬ", 13, null, false);
        NumberHelper.m_Nums.addString("ТРИНАДЦАТЫЙ", 13 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ТРИНАДЦАТИ", 13, null, false);
        NumberHelper.m_Nums.addString("ТРИНАДЦЯТЬ", 13, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРИНАДЦЯТИЙ", 13 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРИНАДЦЯТИ", 13, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("THIRTEEN", 13, null, false);
        NumberHelper.m_Nums.addString("THIRTEENTH", 13 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ЧЕТЫРНАДЦАТЬ", 14, null, false);
        NumberHelper.m_Nums.addString("ЧЕТЫРНАДЦАТЫЙ", 14 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ЧЕТЫРНАДЦАТИ", 14, null, false);
        NumberHelper.m_Nums.addString("ЧОТИРНАДЦЯТЬ", 14, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ЧОТИРНАДЦЯТИЙ", 14 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ЧОТИРНАДЦЯТИ", 14, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("FOURTEEN", 14, null, false);
        NumberHelper.m_Nums.addString("FOURTEENTH", 14 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ПЯТНАДЦАТЬ", 15, null, false);
        NumberHelper.m_Nums.addString("ПЯТНАДЦАТЫЙ", 15 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ПЯТНАДЦАТИ", 15, null, false);
        NumberHelper.m_Nums.addString("ПЯТНАДЦЯТЬ", 15, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ПЯТНАДЦЯТИЙ", 15 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ПЯТНАДЦЯТИ", 15, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("FIFTEEN", 15, null, false);
        NumberHelper.m_Nums.addString("FIFTEENTH", 15 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ШЕСТНАДЦАТЬ", 16, null, false);
        NumberHelper.m_Nums.addString("ШЕСТНАДЦАТЫЙ", 16 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ШЕСТНАДЦАТИ", 16, null, false);
        NumberHelper.m_Nums.addString("ШІСТНАДЦЯТЬ", 16, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ШІСТНАДЦЯТИЙ", 16 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ШІСТНАДЦЯТИ", 16, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("SIXTEEN", 16, null, false);
        NumberHelper.m_Nums.addString("SIXTEENTH", 16 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СЕМНАДЦАТЬ", 17, null, false);
        NumberHelper.m_Nums.addString("СЕМНАДЦАТЫЙ", 17 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СЕМНАДЦАТИ", 17, null, false);
        NumberHelper.m_Nums.addString("СІМНАДЦЯТЬ", 17, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СІМНАДЦЯТИЙ", 17 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СІМНАДЦЯТИ", 17, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("SEVENTEEN", 17, null, false);
        NumberHelper.m_Nums.addString("SEVENTEENTH", 17 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ВОСЕМНАДЦАТЬ", 18, null, false);
        NumberHelper.m_Nums.addString("ВОСЕМНАДЦАТЫЙ", 18 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ВОСЕМНАДЦАТИ", 18, null, false);
        NumberHelper.m_Nums.addString("ВІСІМНАДЦЯТЬ", 18, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ВІСІМНАДЦЯТИЙ", 18 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ВІСІМНАДЦЯТИ", 18, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("EIGHTEEN", 18, null, false);
        NumberHelper.m_Nums.addString("EIGHTEENTH", 18 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТНАДЦАТЬ", 19, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТНАДЦАТЫЙ", 19 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТНАДЦАТИ", 19, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТНАДЦЯТЬ", 19, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДЕВЯТНАДЦЯТИЙ", 19 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДЕВЯТНАДЦЯТИ", 19, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("NINETEEN", 19, null, false);
        NumberHelper.m_Nums.addString("NINETEENTH", 19 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДВАДЦАТЬ", 20, null, false);
        NumberHelper.m_Nums.addString("ДВАДЦАТЫЙ", 20 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДВАДЦАТИ", 20, null, false);
        NumberHelper.m_Nums.addString("ДВАДЦЯТЬ", 20, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДВАДЦЯТИЙ", 20 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДВАДЦЯТИ", 20, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("TWENTY", 20, null, false);
        NumberHelper.m_Nums.addString("TWENTIETH", 20 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ТРИДЦАТЬ", 30, null, false);
        NumberHelper.m_Nums.addString("ТРИДЦАТЫЙ", 30 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ТРИДЦАТИ", 30, null, false);
        NumberHelper.m_Nums.addString("ТРИДЦЯТЬ", 30, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРИДЦЯТИЙ", 30 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРИДЦЯТИ", 30, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("THIRTY", 30, null, false);
        NumberHelper.m_Nums.addString("THIRTIETH", 30 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СОРОК", 40, null, false);
        NumberHelper.m_Nums.addString("СОРОКОВОЙ", 40 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СОРОКА", 40, null, false);
        NumberHelper.m_Nums.addString("СОРОК", 40, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СОРОКОВИЙ", 40 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("FORTY", 40, null, false);
        NumberHelper.m_Nums.addString("FORTIETH", 40 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ПЯТЬДЕСЯТ", 50, null, false);
        NumberHelper.m_Nums.addString("ПЯТИДЕСЯТЫЙ", 50 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ПЯТИДЕСЯТИ", 50, null, false);
        NumberHelper.m_Nums.addString("ПЯТДЕСЯТ", 50, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ПЯТДЕСЯТИЙ", 50 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ПЯТДЕСЯТИ", 50, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("FIFTY", 50, null, false);
        NumberHelper.m_Nums.addString("FIFTIETH", 50 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ШЕСТЬДЕСЯТ", 60, null, false);
        NumberHelper.m_Nums.addString("ШЕСТИДЕСЯТЫЙ", 60 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ШЕСТИДЕСЯТИ", 60, null, false);
        NumberHelper.m_Nums.addString("ШІСТДЕСЯТ", 60, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ШЕСИДЕСЯТЫЙ", 60 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ШІСТДЕСЯТИ", 60, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("SIXTY", 60, null, false);
        NumberHelper.m_Nums.addString("SIXTIETH", 60 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СЕМЬДЕСЯТ", 70, null, false);
        NumberHelper.m_Nums.addString("СЕМИДЕСЯТЫЙ", 70 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СЕМИДЕСЯТИ", 70, null, false);
        NumberHelper.m_Nums.addString("СІМДЕСЯТ", 70, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СІМДЕСЯТИЙ", 70 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СІМДЕСЯТИ", 70, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("SEVENTY", 70, null, false);
        NumberHelper.m_Nums.addString("SEVENTIETH", 70 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("SEVENTIES", 70 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ВОСЕМЬДЕСЯТ", 80, null, false);
        NumberHelper.m_Nums.addString("ВОСЬМИДЕСЯТЫЙ", 80 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ВОСЬМИДЕСЯТИ", 80, null, false);
        NumberHelper.m_Nums.addString("ВІСІМДЕСЯТ", 80, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ВОСЬМИДЕСЯТИЙ", 80 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ВІСІМДЕСЯТИ", 80, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("EIGHTY", 80, null, false);
        NumberHelper.m_Nums.addString("EIGHTIETH", 80 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("EIGHTIES", 80 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯНОСТО", 90, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯНОСТЫЙ", 90 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯНОСТО", 90, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДЕВЯНОСТИЙ", 90 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("NINETY", 90, null, false);
        NumberHelper.m_Nums.addString("NINETIETH", 90 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("NINETIES", 90 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СТО", 100, null, false);
        NumberHelper.m_Nums.addString("СОТЫЙ", 100 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СТА", 100, null, false);
        NumberHelper.m_Nums.addString("СТО", 100, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СОТИЙ", 100 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("HUNDRED", 100, null, false);
        NumberHelper.m_Nums.addString("HUNDREDTH", 100 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДВЕСТИ", 200, null, false);
        NumberHelper.m_Nums.addString("ДВУХСОТЫЙ", 200 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДВУХСОТ", 200, null, false);
        NumberHelper.m_Nums.addString("ДВІСТІ", 200, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДВОХСОТИЙ", 200 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДВОХСОТ", 200, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРИСТА", 300, null, false);
        NumberHelper.m_Nums.addString("ТРЕХСОТЫЙ", 300 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ТРЕХСОТ", 300, null, false);
        NumberHelper.m_Nums.addString("ТРИСТА", 300, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРЬОХСОТИЙ", 300 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРЬОХСОТ", 300, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ЧЕТЫРЕСТА", 400, null, false);
        NumberHelper.m_Nums.addString("ЧЕТЫРЕХСОТЫЙ", 400 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ЧОТИРИСТА", 400, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ЧОТИРЬОХСОТИЙ", 400 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ПЯТЬСОТ", 500, null, false);
        NumberHelper.m_Nums.addString("ПЯТИСОТЫЙ", 500 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ПЯТСОТ", 500, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ПЯТИСОТИЙ", 500 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ШЕСТЬСОТ", 600, null, false);
        NumberHelper.m_Nums.addString("ШЕСТИСОТЫЙ", 600 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ШІСТСОТ", 600, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ШЕСТИСОТИЙ", 600 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СЕМЬСОТ", 700, null, false);
        NumberHelper.m_Nums.addString("СЕМИСОТЫЙ", 700 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("СІМСОТ", 700, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("СЕМИСОТИЙ", 700 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ВОСЕМЬСОТ", 800, null, false);
        NumberHelper.m_Nums.addString("ВОСЕМЬСОТЫЙ", 800 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ВОСЬМИСОТЫЙ", 800 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ВІСІМСОТ", 800, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ВОСЬМИСОТЫЙ", 800 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДЕВЯТЬСОТ", 900, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТЬСОТЫЙ", 900 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТИСОТЫЙ", 900 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТСОТ", 900, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДЕВЯТЬСОТЫЙ", 900 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДЕВЯТИСОТИЙ", 900 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТЫС", 1000, null, false);
        NumberHelper.m_Nums.addString("ТЫСЯЧА", 1000, null, false);
        NumberHelper.m_Nums.addString("ТЫСЯЧНЫЙ", 1000 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ТИС", 1000, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТИСЯЧА", 1000, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТИСЯЧНИЙ", 1000 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ДВУХТЫСЯЧНЫЙ", 2000 | NumberHelper.prilNumTagBit, null, false);
        NumberHelper.m_Nums.addString("ДВОХТИСЯЧНИЙ", 2000 | NumberHelper.prilNumTagBit, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("МИЛЛИОН", 1000000, null, false);
        NumberHelper.m_Nums.addString("МЛН", 1000000, null, false);
        NumberHelper.m_Nums.addString("МІЛЬЙОН", 1000000, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("МИЛЛИАРД", 1000000000, null, false);
        NumberHelper.m_Nums.addString("МІЛЬЯРД", 1000000000, MorphLang.UA, false);
        NumberHelper.m_Nums.addString("ТРИЛЛИОН", "1000000000000", null, false);
        NumberHelper.m_Nums.addString("ТРИЛЬЙОН", "1000000000000", MorphLang.UA, false);
        NumberHelper.m_AfterPoints = new TerminCollection();
        let t = Termin._new170("ПОЛОВИНА", 0.5);
        t.addVariant("ОДНА ВТОРАЯ", false);
        t.addVariant("ПОЛ", false);
        NumberHelper.m_AfterPoints.add(t);
        t = Termin._new170("ТРЕТЬ", 0.33);
        t.addVariant("ОДНА ТРЕТЬ", false);
        NumberHelper.m_AfterPoints.add(t);
        t = Termin._new170("ЧЕТВЕРТЬ", 0.25);
        t.addVariant("ОДНА ЧЕТВЕРТАЯ", false);
        NumberHelper.m_AfterPoints.add(t);
        t = Termin._new170("ПЯТАЯ ЧАСТЬ", 0.2);
        t.addVariant("ОДНА ПЯТАЯ", false);
        NumberHelper.m_AfterPoints.add(t);
    }
    
    static static_constructor() {
        NumberHelper.m_Samples = ["ДЕСЯТЫЙ", "ПЕРВЫЙ", "ВТОРОЙ", "ТРЕТИЙ", "ЧЕТВЕРТЫЙ", "ПЯТЫЙ", "ШЕСТОЙ", "СЕДЬМОЙ", "ВОСЬМОЙ", "ДЕВЯТЫЙ"];
        NumberHelper.m_ManNumberWords = ["ПЕРВЫЙ", "ВТОРОЙ", "ТРЕТИЙ", "ЧЕТВЕРТЫЙ", "ПЯТЫЙ", "ШЕСТОЙ", "СЕДЬМОЙ", "ВОСЬМОЙ", "ДЕВЯТЫЙ", "ДЕСЯТЫЙ", "ОДИННАДЦАТЫЙ", "ДВЕНАДЦАТЫЙ", "ТРИНАДЦАТЫЙ", "ЧЕТЫРНАДЦАТЫЙ", "ПЯТНАДЦАТЫЙ", "ШЕСТНАДЦАТЫЙ", "СЕМНАДЦАТЫЙ", "ВОСЕМНАДЦАТЫЙ", "ДЕВЯТНАДЦАТЫЙ"];
        NumberHelper.m_NeutralNumberWords = ["ПЕРВОЕ", "ВТОРОЕ", "ТРЕТЬЕ", "ЧЕТВЕРТОЕ", "ПЯТОЕ", "ШЕСТОЕ", "СЕДЬМОЕ", "ВОСЬМОЕ", "ДЕВЯТОЕ", "ДЕСЯТОЕ", "ОДИННАДЦАТОЕ", "ДВЕНАДЦАТОЕ", "ТРИНАДЦАТОЕ", "ЧЕТЫРНАДЦАТОЕ", "ПЯТНАДЦАТОЕ", "ШЕСТНАДЦАТОЕ", "СЕМНАДЦАТОЕ", "ВОСЕМНАДЦАТОЕ", "ДЕВЯТНАДЦАТОЕ"];
        NumberHelper.m_WomanNumberWords = ["ПЕРВАЯ", "ВТОРАЯ", "ТРЕТЬЯ", "ЧЕТВЕРТАЯ", "ПЯТАЯ", "ШЕСТАЯ", "СЕДЬМАЯ", "ВОСЬМАЯ", "ДЕВЯТАЯ", "ДЕСЯТАЯ", "ОДИННАДЦАТАЯ", "ДВЕНАДЦАТАЯ", "ТРИНАДЦАТАЯ", "ЧЕТЫРНАДЦАТАЯ", "ПЯТНАДЦАТАЯ", "ШЕСТНАДЦАТАЯ", "СЕМНАДЦАТАЯ", "ВОСЕМНАДЦАТАЯ", "ДЕВЯТНАДЦАТАЯ"];
        NumberHelper.m_PluralNumberWords = ["ПЕРВЫЕ", "ВТОРЫЕ", "ТРЕТЬИ", "ЧЕТВЕРТЫЕ", "ПЯТЫЕ", "ШЕСТЫЕ", "СЕДЬМЫЕ", "ВОСЬМЫЕ", "ДЕВЯТЫЕ", "ДЕСЯТЫЕ", "ОДИННАДЦАТЫЕ", "ДВЕНАДЦАТЫЕ", "ТРИНАДЦАТЫЕ", "ЧЕТЫРНАДЦАТЫЕ", "ПЯТНАДЦАТЫЕ", "ШЕСТНАДЦАТЫЕ", "СЕМНАДЦАТЫЕ", "ВОСЕМНАДЦАТЫЕ", "ДЕВЯТНАДЦАТЫЕ"];
        NumberHelper.m_DecDumberWords = ["ДВАДЦАТЬ", "ТРИДЦАТЬ", "СОРОК", "ПЯТЬДЕСЯТ", "ШЕСТЬДЕСЯТ", "СЕМЬДЕСЯТ", "ВОСЕМЬДЕСЯТ", "ДЕВЯНОСТО"];
        NumberHelper.m_ManDecDumberWords = ["ДВАДЦАТЫЙ", "ТРИДЦАТЫЙ", "СОРОКОВОЙ", "ПЯТЬДЕСЯТЫЙ", "ШЕСТЬДЕСЯТЫЙ", "СЕМЬДЕСЯТЫЙ", "ВОСЕМЬДЕСЯТЫЙ", "ДЕВЯНОСТЫЙ"];
        NumberHelper.m_WomanDecDumberWords = ["ДВАДЦАТАЯ", "ТРИДЦАТАЯ", "СОРОКОВАЯ", "ПЯТЬДЕСЯТАЯ", "ШЕСТЬДЕСЯТАЯ", "СЕМЬДЕСЯТАЯ", "ВОСЕМЬДЕСЯТАЯ", "ДЕВЯНОСТАЯ"];
        NumberHelper.m_NeutralDecDumberWords = ["ДВАДЦАТОЕ", "ТРИДЦАТОЕ", "СОРОКОВОЕ", "ПЯТЬДЕСЯТОЕ", "ШЕСТЬДЕСЯТОЕ", "СЕМЬДЕСЯТОЕ", "ВОСЕМЬДЕСЯТОЕ", "ДЕВЯНОСТОЕ"];
        NumberHelper.m_PluralDecDumberWords = ["ДВАДЦАТЫЕ", "ТРИДЦАТЫЕ", "СОРОКОВЫЕ", "ПЯТЬДЕСЯТЫЕ", "ШЕСТЬДЕСЯТЫЕ", "СЕМЬДЕСЯТЫЕ", "ВОСЕМЬДЕСЯТЫЕ", "ДЕВЯНОСТЫЕ"];
        NumberHelper.m_100Words = ["СТО", "ДВЕСТИ", "ТРИСТА", "ЧЕТЫРЕСТА", "ПЯТЬСОТ", "ШЕСТЬСОТ", "СЕМЬСОТ", "ВОСЕМЬСОТ", "ДЕВЯТЬСОТ"];
        NumberHelper.m_10Words = ["ДЕСЯТЬ", "ДВАДЦАТЬ", "ТРИДЦАТЬ", "СОРОК", "ПЯТЬДЕСЯТ", "ШЕСТЬДЕСЯТ", "СЕМЬДЕСЯТ", "ВОСЕМЬДЕСЯТ", "ДЕВЯНОСТО"];
        NumberHelper.m_1Words = ["НОЛЬ", "ОДИН", "ДВА", "ТРИ", "ЧЕТЫРЕ", "ПЯТЬ", "ШЕСТЬ", "СЕМЬ", "ВОСЕМЬ", "ДЕВЯТЬ", "ДЕСЯТЬ", "ОДИННАДЦАТЬ", "ДВЕНАДЦАТЬ", "ТРИНАДЦАТЬ", "ЧЕТЫРНАДЦАТЬ", "ПЯТНАДЦАТЬ", "ШЕСТНАДЦАТЬ", "СЕМНАДЦАТЬ", "ВОСЕМНАДЦАТЬ", "ДЕВЯТНАДЦАТЬ"];
        NumberHelper.m_Romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX"];
        NumberHelper.prilNumTagBit = 0x40000000;
        NumberHelper.m_Nums = null;
        NumberHelper.m_AfterPoints = null;
    }
}


NumberHelper.static_constructor();

module.exports = NumberHelper