/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphNumber = require("./../../../morph/MorphNumber");
const MorphGender = require("./../../../morph/MorphGender");
const MorphClass = require("./../../../morph/MorphClass");
const GetTextAttr = require("./../../core/GetTextAttr");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MetaToken = require("./../../MetaToken");
const ReferentToken = require("./../../ReferentToken");
const NumberWithUnitParseAttr = require("./../../measure/internal/NumberWithUnitParseAttr");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const NumberToken = require("./../../NumberToken");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const TextToken = require("./../../TextToken");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const MiscHelper = require("./../../core/MiscHelper");
const BracketHelper = require("./../../core/BracketHelper");
const Termin = require("./../../core/Termin");
const WeaponItemTokenTyps = require("./WeaponItemTokenTyps");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumbersWithUnitToken = require("./../../measure/internal/NumbersWithUnitToken");
const GeoReferent = require("./../../geo/GeoReferent");
const NumberHelper = require("./../../core/NumberHelper");
const OrganizationReferent = require("./../../org/OrganizationReferent");
const TransItemToken = require("./../../transport/internal/TransItemToken");

class WeaponItemToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = WeaponItemTokenTyps.NOUN;
        this.value = null;
        this.altValue = null;
        this.isDoubt = false;
        this.isAfterConjunction = false;
        this.isInternal = false;
        this.innerTokens = new Array();
        this.ref = null;
    }
    
    toString() {
        return (this.typ.toString() + ": " + ((this.value != null ? this.value : ((this.ref === null ? "" : this.ref.toString())))) + " " + ((this.altValue != null ? this.altValue : "")) + (this.isInternal ? "[int]" : ""));
    }
    
    static tryParseList(t, maxCount = 10) {
        let tr = WeaponItemToken.tryParse(t, null, false, false);
        if (tr === null) 
            return null;
        if (tr.typ === WeaponItemTokenTyps.CLASS || tr.typ === WeaponItemTokenTyps.DATE) 
            return null;
        let tr0 = tr;
        let res = new Array();
        if (tr.innerTokens.length > 0) {
            res.splice(res.length, 0, ...tr.innerTokens);
            if (res[0].beginChar > tr.beginChar) 
                res[0].beginToken = tr.beginToken;
        }
        res.push(tr);
        t = tr.endToken.next;
        if (tr.typ === WeaponItemTokenTyps.NOUN) {
            for (; t !== null; t = t.next) {
                if (t.isChar(':') || t.isHiphen) {
                }
                else 
                    break;
            }
        }
        let andConj = false;
        for (; t !== null; t = t.next) {
            if (maxCount > 0 && res.length >= maxCount) 
                break;
            if (t.isChar(':')) 
                continue;
            if (tr0.typ === WeaponItemTokenTyps.NOUN) {
                if (t.isHiphen && t.next !== null) 
                    t = t.next;
            }
            tr = WeaponItemToken.tryParse(t, tr0, false, false);
            if (tr === null) {
                if (BracketHelper.canBeEndOfSequence(t, true, null, false) && t.next !== null) {
                    if (tr0.typ === WeaponItemTokenTyps.MODEL || tr0.typ === WeaponItemTokenTyps.BRAND) {
                        let tt1 = t.next;
                        if (tt1 !== null && tt1.isComma) 
                            tt1 = tt1.next;
                        tr = WeaponItemToken.tryParse(tt1, tr0, false, false);
                    }
                }
            }
            if (tr === null && (t instanceof ReferentToken)) {
                let rt = Utils.as(t, ReferentToken);
                if (rt.beginToken === rt.endToken && (rt.beginToken instanceof TextToken)) {
                    tr = WeaponItemToken.tryParse(rt.beginToken, tr0, false, false);
                    if (tr !== null && tr.beginToken === tr.endToken) 
                        tr.beginToken = tr.endToken = t;
                }
            }
            if (tr === null && t.isChar('(')) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br !== null) {
                    let tt = br.endToken.next;
                    if (tt !== null && tt.isComma) 
                        tt = tt.next;
                    tr = WeaponItemToken.tryParse(tt, tr0, false, false);
                    if (tr !== null && tr.typ === WeaponItemTokenTyps.NUMBER) {
                    }
                    else 
                        tr = null;
                }
            }
            if (tr === null && t.isHiphen) {
                if (tr0.typ === WeaponItemTokenTyps.BRAND || tr0.typ === WeaponItemTokenTyps.MODEL) 
                    tr = WeaponItemToken.tryParse(t.next, tr0, false, false);
            }
            if (tr === null && t.isComma) {
                if ((tr0.typ === WeaponItemTokenTyps.NAME || tr0.typ === WeaponItemTokenTyps.BRAND || tr0.typ === WeaponItemTokenTyps.MODEL) || tr0.typ === WeaponItemTokenTyps.CLASS || tr0.typ === WeaponItemTokenTyps.DATE) {
                    tr = WeaponItemToken.tryParse(t.next, tr0, true, false);
                    if (tr !== null) {
                        if (tr.typ === WeaponItemTokenTyps.NUMBER) {
                        }
                        else 
                            tr = null;
                    }
                }
            }
            if (tr === null) 
                break;
            if (t.isNewlineBefore) {
                if (tr.typ !== WeaponItemTokenTyps.NUMBER) 
                    break;
            }
            if (tr.innerTokens.length > 0) 
                res.splice(res.length, 0, ...tr.innerTokens);
            res.push(tr);
            tr0 = tr;
            t = tr.endToken;
            if (andConj) 
                break;
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === WeaponItemTokenTyps.MODEL && res[i + 1].typ === WeaponItemTokenTyps.MODEL) {
                res[i].endToken = res[i + 1].endToken;
                res[i].value = (res[i].value + (res[i].endToken.next !== null && res[i].endToken.next.isHiphen ? '-' : ' ') + res[i + 1].value);
                res.splice(i + 1, 1);
                i--;
            }
        }
        return res;
    }
    
    static tryParse(t, prev, afterConj, attachHigh = false) {
        let res = WeaponItemToken._TryParse(t, prev, afterConj, attachHigh);
        if (res === null) {
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.noun.beginChar > npt.beginChar) {
                res = WeaponItemToken._TryParse(npt.noun.beginToken, prev, afterConj, attachHigh);
                if (res !== null) {
                    if (res.typ === WeaponItemTokenTyps.NOUN) {
                        let str = npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                        if (str === "РУЧНОЙ ГРАНАТ") 
                            str = "РУЧНАЯ ГРАНАТА";
                        if (((str != null ? str : "")).endsWith(res.value)) {
                            if (res.altValue === null) 
                                res.altValue = str;
                            else {
                                str = str.substring(0, 0 + str.length - res.value.length).trim();
                                res.altValue = (str + " " + res.altValue);
                            }
                            res.beginToken = t;
                            return res;
                        }
                    }
                }
            }
            return null;
        }
        if (res.typ === WeaponItemTokenTyps.NAME) {
            let br = BracketHelper.tryParse(res.endToken.next, BracketParseAttr.NO, 100);
            if (br !== null && br.isChar('(')) {
                let alt = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                if (MiscHelper.canBeEqualCyrAndLatSS(res.value, alt)) {
                    res.altValue = alt;
                    res.endToken = br.endToken;
                }
            }
        }
        return res;
    }
    
    static _TryParse(t, prev, afterConj, attachHigh = false) {
        if (t === null) 
            return null;
        if (BracketHelper.isBracket(t, true)) {
            let wit = WeaponItemToken._TryParse(t.next, prev, afterConj, attachHigh);
            if (wit !== null) {
                if (wit.endToken.next === null) {
                    wit.beginToken = t;
                    return wit;
                }
                if (BracketHelper.isBracket(wit.endToken.next, true)) {
                    wit.beginToken = t;
                    wit.endToken = wit.endToken.next;
                    return wit;
                }
            }
        }
        let tok = WeaponItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok !== null) {
            let res = new WeaponItemToken(t, tok.endToken);
            res.typ = WeaponItemTokenTyps.of(tok.termin.tag);
            if (res.typ === WeaponItemTokenTyps.NOUN) {
                res.value = tok.termin.canonicText;
                if (tok.termin.tag2 !== null) 
                    res.isDoubt = true;
                for (let tt = res.endToken.next; tt !== null; tt = tt.next) {
                    if (tt.whitespacesBeforeCount > 2) 
                        break;
                    let wit = WeaponItemToken._TryParse(tt, null, false, false);
                    if (wit !== null) {
                        if (wit.typ === WeaponItemTokenTyps.BRAND) {
                            res.innerTokens.push(wit);
                            res.endToken = (tt = wit.endToken);
                            continue;
                        }
                        break;
                    }
                    if (!(tt instanceof TextToken)) 
                        break;
                    let mc = tt.getMorphClassInDictionary();
                    if (mc.equals(MorphClass.ADJECTIVE)) {
                        if (res.altValue === null) 
                            res.altValue = res.value;
                        if (res.altValue.endsWith(res.value)) 
                            res.altValue = res.altValue.substring(0, 0 + res.altValue.length - res.value.length);
                        res.altValue = (res.altValue + tt.term + " " + res.value);
                        res.endToken = tt;
                        continue;
                    }
                    break;
                }
                return res;
            }
            if (res.typ === WeaponItemTokenTyps.BRAND || res.typ === WeaponItemTokenTyps.NAME) {
                res.value = tok.termin.canonicText;
                return res;
            }
            if (res.typ === WeaponItemTokenTyps.MODEL) {
                res.value = tok.termin.canonicText;
                if (tok.termin.tag2 instanceof Array) {
                    let li = Utils.as(tok.termin.tag2, Array);
                    for (const to of li) {
                        let wit = WeaponItemToken._new2857(t, tok.endToken, WeaponItemTokenTyps.of(to.tag), to.canonicText, tok.beginToken === tok.endToken);
                        res.innerTokens.push(wit);
                        if (to.additionalVars !== null && to.additionalVars.length > 0) 
                            wit.altValue = to.additionalVars[0].canonicText;
                    }
                }
                res._correctModel();
                return res;
            }
        }
        let nnn = MiscHelper.checkNumberPrefix(t);
        if (nnn !== null) {
            let tit = TransItemToken._attachNumber(nnn, true);
            if (tit !== null) {
                let res = WeaponItemToken._new2858(t, tit.endToken, WeaponItemTokenTyps.NUMBER);
                res.value = tit.value;
                res.altValue = tit.altValue;
                return res;
            }
        }
        if (((t instanceof TextToken) && t.chars.isLetter && t.chars.isAllUpper) && (t.lengthChar < 4)) {
            if ((t.next !== null && ((t.next.isHiphen || t.next.isChar('.'))) && (t.next.whitespacesAfterCount < 2)) && (t.next.next instanceof NumberToken)) {
                let res = WeaponItemToken._new2859(t, t.next, WeaponItemTokenTyps.MODEL, true);
                res.value = t.term;
                res._correctModel();
                return res;
            }
            if ((t.next instanceof NumberToken) && !t.isWhitespaceAfter) {
                let res = WeaponItemToken._new2859(t, t, WeaponItemTokenTyps.MODEL, true);
                res.value = t.term;
                res._correctModel();
                return res;
            }
            if (t.term === "СП" && (t.whitespacesAfterCount < 3) && (t.next instanceof TextToken)) {
                let pp = WeaponItemToken._TryParse(t.next, null, false, false);
                if (pp !== null && ((pp.typ === WeaponItemTokenTyps.MODEL || pp.typ === WeaponItemTokenTyps.BRAND))) {
                    let res = WeaponItemToken._new2858(t, t, WeaponItemTokenTyps.NOUN);
                    res.value = "ПИСТОЛЕТ";
                    res.altValue = "СЛУЖЕБНЫЙ ПИСТОЛЕТ";
                    return res;
                }
            }
        }
        if (((t instanceof TextToken) && t.chars.isLetter && !t.chars.isAllLower) && t.lengthChar > 2) {
            let ok = false;
            if (prev !== null && ((prev.typ === WeaponItemTokenTyps.NOUN || prev.typ === WeaponItemTokenTyps.MODEL || prev.typ === WeaponItemTokenTyps.BRAND))) 
                ok = true;
            else if (prev === null && t.previous !== null && t.previous.isCommaAnd) 
                ok = true;
            if (ok) {
                let res = WeaponItemToken._new2859(t, t, WeaponItemTokenTyps.NAME, true);
                res.value = t.term;
                if ((t.next !== null && t.next.isHiphen && (t.next.next instanceof TextToken)) && t.next.next.chars.equals(t.chars)) {
                    res.value = (res.value + "-" + t.next.next.term);
                    res.endToken = t.next.next;
                }
                if (prev !== null && prev.typ === WeaponItemTokenTyps.NOUN) 
                    res.typ = WeaponItemTokenTyps.BRAND;
                if (res.endToken.next !== null && res.endToken.next.isHiphen && (res.endToken.next.next instanceof NumberToken)) {
                    res.typ = WeaponItemTokenTyps.MODEL;
                    res._correctModel();
                }
                else if (!res.endToken.isWhitespaceAfter && (res.endToken.next instanceof NumberToken)) {
                    res.typ = WeaponItemTokenTyps.MODEL;
                    res._correctModel();
                }
                return res;
            }
        }
        if (t.isValue("МАРКА", null)) {
            let res = WeaponItemToken._TryParse(t.next, prev, afterConj, false);
            if (res !== null && res.typ === WeaponItemTokenTyps.BRAND) {
                res.beginToken = t;
                return res;
            }
            if (BracketHelper.canBeStartOfSequence(t.next, true, false)) {
                let br = BracketHelper.tryParse(t.next, BracketParseAttr.NO, 100);
                if (br !== null) 
                    return WeaponItemToken._new2863(t, br.endToken, WeaponItemTokenTyps.BRAND, MiscHelper.getTextValue(br.beginToken, br.endToken, GetTextAttr.NO));
            }
            if (((t instanceof TextToken) && (t.next instanceof TextToken) && t.next.lengthChar > 1) && !t.next.chars.isAllLower) 
                return WeaponItemToken._new2863(t, t.next, WeaponItemTokenTyps.BRAND, t.term);
        }
        if (t.isValue("КАЛИБР", "КАЛІБР")) {
            let tt1 = t.next;
            if (tt1 !== null && ((tt1.isHiphen || tt1.isChar(':')))) 
                tt1 = tt1.next;
            let num = NumbersWithUnitToken.tryParse(tt1, null, NumberWithUnitParseAttr.NO);
            if (num !== null && num.singleVal !== null) 
                return WeaponItemToken._new2863(t, num.endToken, WeaponItemTokenTyps.CALIBER, NumberHelper.doubleToString(num.singleVal));
        }
        if (t instanceof NumberToken) {
            let num = NumbersWithUnitToken.tryParse(t, null, NumberWithUnitParseAttr.NO);
            if (num !== null && num.singleVal !== null) {
                if (num.units.length === 1 && num.units[0].unit !== null && num.units[0].unit.nameCyr === "мм") 
                    return WeaponItemToken._new2863(t, num.endToken, WeaponItemTokenTyps.CALIBER, NumberHelper.doubleToString(num.singleVal));
                if (num.endToken.next !== null && num.endToken.next.isValue("КАЛИБР", "КАЛІБР")) 
                    return WeaponItemToken._new2863(t, num.endToken.next, WeaponItemTokenTyps.CALIBER, NumberHelper.doubleToString(num.singleVal));
            }
        }
        if (t.isValue("ПРОИЗВОДСТВО", "ВИРОБНИЦТВО")) {
            let tt1 = t.next;
            if (tt1 !== null && ((tt1.isHiphen || tt1.isChar(':')))) 
                tt1 = tt1.next;
            if (tt1 instanceof ReferentToken) {
                if ((tt1.getReferent() instanceof OrganizationReferent) || (tt1.getReferent() instanceof GeoReferent)) 
                    return WeaponItemToken._new2868(t, tt1, WeaponItemTokenTyps.DEVELOPER, tt1.getReferent());
            }
        }
        return null;
    }
    
    _correctModel() {
        let tt = this.endToken.next;
        if (tt === null || tt.whitespacesBeforeCount > 2) 
            return;
        if (tt.isValue(":\\/.", null) || tt.isHiphen) 
            tt = tt.next;
        if (tt instanceof NumberToken) {
            let tmp = new StringBuilder();
            tmp.append(tt.value);
            let isLat = LanguageHelper.isLatinChar(this.value[0]);
            this.endToken = tt;
            for (tt = tt.next; tt !== null; tt = tt.next) {
                if ((tt instanceof TextToken) && tt.lengthChar === 1 && tt.chars.isLetter) {
                    if (!tt.isWhitespaceBefore || ((tt.previous !== null && tt.previous.isHiphen))) {
                        let ch = tt.term[0];
                        this.endToken = tt;
                        let ch2 = String.fromCharCode(0);
                        if (LanguageHelper.isLatinChar(ch) && !isLat) {
                            ch2 = LanguageHelper.getCyrForLat(ch);
                            if (ch2 !== (String.fromCharCode(0))) 
                                ch = ch2;
                        }
                        else if (LanguageHelper.isCyrillicChar(ch) && isLat) {
                            ch2 = LanguageHelper.getLatForCyr(ch);
                            if (ch2 !== (String.fromCharCode(0))) 
                                ch = ch2;
                        }
                        tmp.append(ch);
                        continue;
                    }
                }
                break;
            }
            this.value = (this.value + "-" + tmp.toString());
            this.altValue = MiscHelper.createCyrLatAlternative(this.value);
        }
        if (!this.endToken.isWhitespaceAfter && this.endToken.next !== null && ((this.endToken.next.isHiphen || this.endToken.next.isCharOf("\\/")))) {
            if (!this.endToken.next.isWhitespaceAfter && (this.endToken.next.next instanceof NumberToken)) {
                this.endToken = this.endToken.next.next;
                this.value = (this.value + "-" + this.endToken.value);
                if (this.altValue !== null) 
                    this.altValue = (this.altValue + "-" + this.endToken.value);
            }
        }
    }
    
    static initialize() {
        if (WeaponItemToken.m_Ontology !== null) 
            return;
        WeaponItemToken.m_Ontology = new TerminCollection();
        let t = null;
        let tt = null;
        let li = [ ];
        t = Termin._new170("ПИСТОЛЕТ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("РЕВОЛЬВЕР", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("ВИНТОВКА", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("РУЖЬЕ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new349("АВТОМАТ", WeaponItemTokenTyps.NOUN, 1);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new349("КАРАБИН", WeaponItemTokenTyps.NOUN, 1);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new381("ПИСТОЛЕТ-ПУЛЕМЕТ", "ПИСТОЛЕТ-ПУЛЕМЕТ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("ПУЛЕМЕТ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("ГРАНАТОМЕТ", WeaponItemTokenTyps.NOUN);
        t.addVariant("СТРЕЛКОВО ГРАНАТОМЕТНЫЙ КОМПЛЕКС", false);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("ОГНЕМЕТ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("МИНОМЕТ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new361("ПЕРЕНОСНОЙ ЗЕНИТНО РАКЕТНЫЙ КОМПЛЕКС", "ПЗРК", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new361("ПРОТИВОТАНКОВЫЙ РАКЕТНЫЙ КОМПЛЕКС", "ПТРК", WeaponItemTokenTyps.NOUN);
        t.addVariant("ПЕРЕНОСНОЙ ПРОТИВОТАНКОВЫЙ РАКЕТНЫЙ КОМПЛЕКС", false);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("АВИАЦИОННАЯ ПУШКА", WeaponItemTokenTyps.NOUN);
        t.addVariant("АВИАПУШКА", false);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("НАРУЧНИКИ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("БРОНЕЖИЛЕТ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("ГРАНАТА", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("ЛИМОНКА", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("НОЖ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new170("ВЗРЫВАТЕЛЬ", WeaponItemTokenTyps.NOUN);
        WeaponItemToken.m_Ontology.add(t);
        for (const s of ["МАКАРОВ", "КАЛАШНИКОВ", "СИМОНОВ", "СТЕЧКИН", "ШМАЙСЕР", "МОСИН", "СЛОСТИН", "НАГАН", "МАКСИМ", "ДРАГУНОВ", "СЕРДЮКОВ", "ЯРЫГИН", "НИКОНОВ", "МАУЗЕР", "БРАУНИНГ", "КОЛЬТ", "ВИНЧЕСТЕР"]) {
            WeaponItemToken.m_Ontology.add(Termin._new170(s, WeaponItemTokenTyps.BRAND));
        }
        for (const s of ["УЗИ"]) {
            WeaponItemToken.m_Ontology.add(Termin._new170(s, WeaponItemTokenTyps.NAME));
        }
        t = Termin._new2891("ТУЛЬСКИЙ ТОКАРЕВА", "ТТ", "ТТ", WeaponItemTokenTyps.MODEL);
        li = new Array();
        li.push(Termin._new170("ПИСТОЛЕТ", WeaponItemTokenTyps.NOUN));
        li.push(Termin._new170("ТОКАРЕВ", WeaponItemTokenTyps.BRAND));
        t.tag2 = li;
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new2891("ПИСТОЛЕТ МАКАРОВА", "ПМ", "ПМ", WeaponItemTokenTyps.MODEL);
        li = new Array();
        li.push(Termin._new170("ПИСТОЛЕТ", WeaponItemTokenTyps.NOUN));
        li.push(Termin._new170("МАКАРОВ", WeaponItemTokenTyps.BRAND));
        t.tag2 = li;
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new2891("ПИСТОЛЕТ МАКАРОВА МОДЕРНИЗИРОВАННЫЙ", "ПММ", "ПММ", WeaponItemTokenTyps.MODEL);
        li = new Array();
        li.push((tt = Termin._new170("ПИСТОЛЕТ", WeaponItemTokenTyps.NOUN)));
        tt.addVariant("МОДЕРНИЗИРОВАННЫЙ ПИСТОЛЕТ", false);
        li.push(Termin._new170("МАКАРОВ", WeaponItemTokenTyps.BRAND));
        t.tag2 = li;
        WeaponItemToken.m_Ontology.add(t);
        t = Termin._new2891("АВТОМАТ КАЛАШНИКОВА", "АК", "АК", WeaponItemTokenTyps.MODEL);
        li = new Array();
        li.push(Termin._new170("АВТОМАТ", WeaponItemTokenTyps.NOUN));
        li.push(Termin._new170("КАЛАШНИКОВ", WeaponItemTokenTyps.BRAND));
        t.tag2 = li;
        WeaponItemToken.m_Ontology.add(t);
    }
    
    static _new2857(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new WeaponItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.isInternal = _arg5;
        return res;
    }
    
    static _new2858(_arg1, _arg2, _arg3) {
        let res = new WeaponItemToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2859(_arg1, _arg2, _arg3, _arg4) {
        let res = new WeaponItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isDoubt = _arg4;
        return res;
    }
    
    static _new2863(_arg1, _arg2, _arg3, _arg4) {
        let res = new WeaponItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new2868(_arg1, _arg2, _arg3, _arg4) {
        let res = new WeaponItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ref = _arg4;
        return res;
    }
    
    static static_constructor() {
        WeaponItemToken.m_Ontology = null;
    }
}


WeaponItemToken.static_constructor();

module.exports = WeaponItemToken