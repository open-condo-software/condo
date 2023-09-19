/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphNumber = require("./../../../morph/MorphNumber");
const MorphClass = require("./../../../morph/MorphClass");
const MorphLang = require("./../../../morph/MorphLang");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const NumberSpellingType = require("./../../NumberSpellingType");
const Token = require("./../../Token");
const MorphGender = require("./../../../morph/MorphGender");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MiscHelper = require("./../../core/MiscHelper");
const TextToken = require("./../../TextToken");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const TransportKind = require("./../TransportKind");
const DateReferent = require("./../../date/DateReferent");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const TransItemTokenTyps = require("./TransItemTokenTyps");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumberToken = require("./../../NumberToken");
const GeoReferent = require("./../../geo/GeoReferent");
const BracketHelper = require("./../../core/BracketHelper");
const ReferentToken = require("./../../ReferentToken");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");

class TransItemToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = TransItemTokenTyps.NOUN;
        this.value = null;
        this.altValue = null;
        this.kind = TransportKind.UNDEFINED;
        this.isDoubt = false;
        this.isAfterConjunction = false;
        this.state = null;
        this.ref = null;
        this.routeItems = null;
    }
    
    toString() {
        return (this.typ.toString() + ": " + ((this.value != null ? this.value : ((this.ref === null ? "" : this.ref.toString())))) + " " + ((this.altValue != null ? this.altValue : "")));
    }
    
    static tryParseList(t, maxCount = 10) {
        let tr = TransItemToken.tryParse(t, null, false, false);
        if (tr === null) 
            return null;
        if ((tr.typ === TransItemTokenTyps.ORG || tr.typ === TransItemTokenTyps.NUMBER || tr.typ === TransItemTokenTyps.CLASS) || tr.typ === TransItemTokenTyps.DATE) 
            return null;
        let tr0 = tr;
        let res = new Array();
        res.push(tr);
        t = tr.endToken.next;
        if (tr.typ === TransItemTokenTyps.NOUN) {
            for (; t !== null; t = t.next) {
                if (t.isChar(':') || t.isHiphen) {
                }
                else 
                    break;
            }
        }
        let andConj = false;
        let brareg = false;
        for (; t !== null; t = t.next) {
            if (maxCount > 0 && res.length >= maxCount) 
                break;
            if (tr0.typ === TransItemTokenTyps.NOUN || tr0.typ === TransItemTokenTyps.ORG) {
                if (t.isHiphen && t.next !== null) 
                    t = t.next;
            }
            tr = TransItemToken.tryParse(t, tr0, false, false);
            if (tr === null) {
                if (BracketHelper.canBeEndOfSequence(t, true, null, false) && t.next !== null) {
                    if (tr0.typ === TransItemTokenTyps.MODEL || tr0.typ === TransItemTokenTyps.BRAND) {
                        let tt1 = t.next;
                        if (tt1 !== null && tt1.isComma) 
                            tt1 = tt1.next;
                        tr = TransItemToken.tryParse(tt1, tr0, false, false);
                    }
                }
            }
            if (tr === null && (t instanceof ReferentToken)) {
                let rt = Utils.as(t, ReferentToken);
                if (rt.beginToken === rt.endToken && (rt.beginToken instanceof TextToken)) {
                    tr = TransItemToken.tryParse(rt.beginToken, tr0, false, false);
                    if (tr !== null && tr.beginToken === tr.endToken) 
                        tr.beginToken = tr.endToken = t;
                }
            }
            if (tr === null && t.isChar('(')) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br !== null) {
                    brareg = true;
                    tr = TransItemToken.tryParse(t.next, tr0, false, false);
                    if (tr !== null) {
                        if (tr.typ !== TransItemTokenTyps.NUMBER && tr.typ !== TransItemTokenTyps.GEO) 
                            tr = null;
                        else if (tr.endToken.next !== null) {
                            tr.beginToken = t;
                            if (tr.endToken.next.isChar(')')) {
                                tr.endToken = tr.endToken.next;
                                brareg = false;
                            }
                        }
                    }
                    if (tr === null) {
                        let tt = br.endToken.next;
                        if (tt !== null && tt.isComma) 
                            tt = tt.next;
                        tr = TransItemToken.tryParse(tt, tr0, false, false);
                        if (tr !== null && tr.typ === TransItemTokenTyps.NUMBER) {
                        }
                        else 
                            tr = null;
                    }
                }
            }
            if (tr === null && t.isHiphen) {
                if (tr0.typ === TransItemTokenTyps.BRAND || tr0.typ === TransItemTokenTyps.MODEL) 
                    tr = TransItemToken.tryParse(t.next, tr0, false, false);
            }
            if (tr === null && t.isComma) {
                if (((tr0.typ === TransItemTokenTyps.NAME || tr0.typ === TransItemTokenTyps.BRAND || tr0.typ === TransItemTokenTyps.MODEL) || tr0.typ === TransItemTokenTyps.CLASS || tr0.typ === TransItemTokenTyps.DATE) || tr0.typ === TransItemTokenTyps.GEO) {
                    tr = TransItemToken.tryParse(t.next, tr0, true, false);
                    if (tr !== null) {
                        if (tr.typ === TransItemTokenTyps.NUMBER) {
                        }
                        else 
                            tr = null;
                    }
                }
            }
            if (tr === null) {
                if (tr0.typ === TransItemTokenTyps.NAME) {
                    if (t.isChar(',')) 
                        tr = TransItemToken.tryParse(t.next, tr0, true, false);
                    else if (t.morph._class.isConjunction && t.isAnd) {
                        tr = TransItemToken.tryParse(t.next, tr0, true, false);
                        andConj = true;
                    }
                }
                if (tr !== null) {
                    if (tr.typ !== TransItemTokenTyps.NAME) 
                        break;
                    tr.isAfterConjunction = true;
                }
            }
            if (t.isCommaAnd && tr === null) {
                let ne = TransItemToken.tryParse(t.next, tr0, true, false);
                if (ne !== null && ne.typ === TransItemTokenTyps.NUMBER) {
                    let exi = false;
                    for (const v of res) {
                        if (v.typ === ne.typ) {
                            exi = true;
                            break;
                        }
                    }
                    if (!exi) 
                        tr = ne;
                }
            }
            if (tr === null && brareg && t.isChar(')')) {
                brareg = false;
                tr0.endToken = t;
                continue;
            }
            if (tr === null && BracketHelper.canBeEndOfSequence(t, true, null, false)) {
                tr0.endToken = t;
                continue;
            }
            if (tr === null) 
                break;
            if (t.isNewlineBefore) {
                if (tr.typ !== TransItemTokenTyps.NUMBER) 
                    break;
            }
            res.push(tr);
            if (tr.typ === TransItemTokenTyps.ORG && tr0.typ === TransItemTokenTyps.NOUN) {
            }
            else 
                tr0 = tr;
            t = tr.endToken;
            if (andConj) 
                break;
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === TransItemTokenTyps.MODEL && res[i + 1].typ === TransItemTokenTyps.MODEL) {
                res[i].endToken = res[i + 1].endToken;
                res[i].value = (res[i].value + (res[i].endToken.next !== null && res[i].endToken.next.isHiphen ? '-' : ' ') + res[i + 1].value);
                res.splice(i + 1, 1);
                i--;
            }
        }
        if ((res.length > 1 && res[0].typ === TransItemTokenTyps.BRAND && res[1].typ === TransItemTokenTyps.MODEL) && res[1].lengthChar === 1 && !(res[1].beginToken instanceof NumberToken)) 
            return null;
        return res;
    }
    
    static tryParse(t, prev, afterConj, attachHigh = false) {
        let res = TransItemToken._TryParse(t, prev, afterConj, attachHigh);
        if (res === null) 
            return null;
        if (res.typ === TransItemTokenTyps.NAME) {
            let br = BracketHelper.tryParse(res.endToken.next, BracketParseAttr.NO, 100);
            if (br !== null && br.beginToken.isChar('(')) {
                let alt = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                if (MiscHelper.canBeEqualCyrAndLatSS(res.value, alt)) {
                    res.altValue = alt;
                    res.endToken = br.endToken;
                }
            }
        }
        if ((res.typ === TransItemTokenTyps.BRAND && t.getMorphClassInDictionary().isProperName && prev === null) && t.chars.isCapitalUpper) {
            let rt = t.kit.processReferent("PERSON", t, null);
            if (rt !== null) 
                return null;
        }
        if (res.typ === TransItemTokenTyps.NOUN && res.value === "судно") {
            if (res.endToken.isValue("СУД", null)) {
                if ((res.whitespacesAfterCount < 3) && BracketHelper.canBeStartOfSequence(res.endToken.next, true, false)) {
                }
                else 
                    return null;
            }
        }
        return res;
    }
    
    static _TryParse(t, prev, afterConj, attachHigh = false) {
        if (t === null) 
            return null;
        let t1 = t;
        if (t1.isChar(',')) 
            t1 = t1.next;
        if (t1 !== null) {
            if (t1.isValue("ПРИНАДЛЕЖАТЬ", "НАЛЕЖАТИ") || t1.isValue("СУДОВЛАДЕЛЕЦ", "СУДНОВЛАСНИК") || t1.isValue("ВЛАДЕЛЕЦ", "ВЛАСНИК")) 
                t1 = t1.next;
        }
        if (t1 instanceof ReferentToken) {
            if (t1.getReferent().typeName === "ORGANIZATION") 
                return TransItemToken._new2759(t, t1, TransItemTokenTyps.ORG, t1.getReferent(), t1.morph);
        }
        if (t1 !== null && t1.isValue("ФЛАГ", null)) {
            let tt = t1.next;
            while (tt !== null) {
                if (tt.isHiphen || tt.isChar(':')) 
                    tt = tt.next;
                else 
                    break;
            }
            if ((tt instanceof ReferentToken) && (tt.getReferent() instanceof GeoReferent)) 
                return TransItemToken._new2760(t, tt, TransItemTokenTyps.GEO, tt.getReferent());
        }
        if (t1 !== null && t1.isValue("ПОРТ", null)) {
            let tt = t1.next;
            for (; tt !== null; tt = tt.next) {
                if (tt.isValue("ПРИПИСКА", null) || tt.isChar(':')) {
                }
                else 
                    break;
            }
            if (tt !== null && (tt.getReferent() instanceof GeoReferent)) 
                return TransItemToken._new2760(t, tt, TransItemTokenTyps.GEO, tt.getReferent());
        }
        let route = false;
        if (t1 !== null && ((t1.isValue("СЛЕДОВАТЬ", "СЛІДУВАТИ") || t1.isValue("ВЫПОЛНЯТЬ", "ВИКОНУВАТИ")))) {
            t1 = t1.next;
            route = true;
        }
        if (t1 !== null && t1.morph._class.isPreposition) 
            t1 = t1.next;
        if (t1 !== null && ((t1.isValue("РЕЙС", null) || t1.isValue("МАРШРУТ", null)))) {
            t1 = t1.next;
            route = true;
        }
        if (t1 instanceof ReferentToken) {
            if (t1.getReferent() instanceof GeoReferent) {
                let _geo = Utils.as(t1.getReferent(), GeoReferent);
                if (_geo.isState || _geo.isCity) {
                    let tit = TransItemToken._new2762(t, t1, TransItemTokenTyps.ROUTE, new Array());
                    tit.routeItems.push(_geo);
                    for (t1 = t1.next; t1 !== null; t1 = t1.next) {
                        if (t1.isHiphen) 
                            continue;
                        if (t1.morph._class.isPreposition || t1.morph._class.isConjunction) 
                            continue;
                        _geo = Utils.as(t1.getReferent(), GeoReferent);
                        if (_geo === null) 
                            break;
                        if (!_geo.isCity && !_geo.isState) 
                            break;
                        tit.routeItems.push(_geo);
                        tit.endToken = t1;
                    }
                    if (tit.routeItems.length > 1 || route) 
                        return tit;
                }
            }
            else if ((t1.getReferent() instanceof DateReferent) && (t1.whitespacesBeforeCount < 3)) {
                let tit = TransItemToken._new2760(t, t1, TransItemTokenTyps.DATE, t1.getReferent());
                if (t1.next !== null) {
                    if (t1.next.isValue("В", null) && t1.next.next !== null && t1.next.next.isChar('.')) 
                        tit.endToken = t1.next.next;
                    else if (t1.next.isValue("ВЫП", null) || t1.next.isValue("ВЫПУСК", null)) {
                        tit.endToken = t1.next;
                        if (t1.next.next !== null && t1.next.next.isChar('.')) 
                            tit.endToken = t1.next.next;
                    }
                }
                return tit;
            }
        }
        if (t instanceof TextToken) {
            let num = MiscHelper.checkNumberPrefix(t);
            if (num !== null) {
                let tit = TransItemToken._attachRusAutoNumber(num);
                if (tit === null) 
                    tit = TransItemToken._attachNumber(num, false);
                if (tit !== null) {
                    tit.beginToken = t;
                    return tit;
                }
            }
            let tok = TransItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
            if (tok === null && ((t.isValue("С", null) || t.isValue("C", null) || t.isValue("ЗА", null)))) 
                tok = TransItemToken.m_Ontology.tryParse(t.next, TerminParseAttr.NO);
            let isBr = false;
            if (tok === null && BracketHelper.isBracket(t, true)) {
                let tok1 = TransItemToken.m_Ontology.tryParse(t.next, TerminParseAttr.NO);
                if (tok1 !== null && BracketHelper.isBracket(tok1.endToken.next, true)) {
                    tok = tok1;
                    tok.beginToken = t;
                    tok.endToken = tok.endToken.next;
                    tok.beginToken = t;
                    isBr = true;
                }
                else if (tok1 !== null) {
                    let tt = Utils.as(tok1.termin, TransItemToken.TransTermin);
                    if (tt.typ === TransItemTokenTyps.BRAND) {
                        tok = tok1;
                        tok.beginToken = t;
                    }
                }
                if (tok !== null && BracketHelper.canBeEndOfSequence(tok.endToken.next, true, null, false)) {
                    tok.endToken = tok.endToken.next;
                    isBr = true;
                }
            }
            if (tok === null && t.isValue("МАРКА", null)) {
                let res1 = TransItemToken._TryParse(t.next, prev, afterConj, false);
                if (res1 !== null) {
                    if (res1.typ === TransItemTokenTyps.NAME || res1.typ === TransItemTokenTyps.BRAND) {
                        res1.beginToken = t;
                        res1.typ = TransItemTokenTyps.BRAND;
                        return res1;
                    }
                }
            }
            if (tok !== null) {
                let tt = Utils.as(tok.termin, TransItemToken.TransTermin);
                let tit = null;
                if (tt.typ === TransItemTokenTyps.NUMBER) {
                    tit = TransItemToken._attachRusAutoNumber(tok.endToken.next);
                    if (tit === null) 
                        tit = TransItemToken._attachNumber(tok.endToken.next, false);
                    if (tit !== null) {
                        tit.beginToken = t;
                        return tit;
                    }
                    else 
                        return null;
                }
                if (tt.isDoubt && !attachHigh) {
                    if (prev === null || prev.typ !== TransItemTokenTyps.NOUN) {
                        if ((prev !== null && prev.typ === TransItemTokenTyps.BRAND && tt.typ === TransItemTokenTyps.BRAND) && Utils.compareStrings(tt.canonicText, prev.value, true) === 0) {
                        }
                        else 
                            return null;
                    }
                }
                if (tt.canonicText === "СУДНО") {
                    if (((tok.morph.number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) {
                        if (!BracketHelper.canBeStartOfSequence(tok.endToken.next, false, false)) 
                            return null;
                    }
                }
                tit = TransItemToken._new2764(tok.beginToken, tok.endToken, tt.kind, tt.typ, tt.isDoubt && !isBr, tok.chars, tok.morph);
                tit.value = tt.canonicText;
                if (tit.typ === TransItemTokenTyps.NOUN) {
                    tit.value = tit.value.toLowerCase();
                    if (((tit.endToken.next !== null && tit.endToken.next.isHiphen && !tit.endToken.isWhitespaceAfter) && (tit.endToken.next.next instanceof TextToken) && !tit.endToken.next.isWhitespaceAfter) && tit.endToken.next.next.getMorphClassInDictionary().isNoun) {
                        tit.endToken = tit.endToken.next.next;
                        tit.value = (tit.value + "-" + (Utils.notNull(tit.endToken.getNormalCaseText(MorphClass.NOUN, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), "?"))).toLowerCase();
                    }
                }
                else 
                    tit.value = tit.value.toUpperCase();
                return tit;
            }
            if (tok === null && t.morph._class.isAdjective) {
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.adjectives.length > 0) {
                    let _state = null;
                    for (let tt = t; tt !== null && tt.previous !== npt.endToken; tt = tt.next) {
                        tok = TransItemToken.m_Ontology.tryParse(tt, TerminParseAttr.NO);
                        if (tok === null && _state === null) 
                            _state = tt.kit.processReferent("GEO", tt, null);
                        if (tok !== null && tok.endToken === npt.endToken) {
                            if (tok.termin.typ === TransItemTokenTyps.NOUN) {
                                let tit = TransItemToken._new2764(t, tok.endToken, tok.termin.kind, TransItemTokenTyps.NOUN, tok.termin.isDoubt, tok.chars, npt.morph);
                                tit.value = tok.termin.canonicText.toLowerCase();
                                tit.altValue = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false).toLowerCase();
                                if (LanguageHelper.endsWithEx(tit.altValue, "суд", "суда", null, null)) {
                                    if (!BracketHelper.canBeStartOfSequence(tok.endToken.next, false, false)) 
                                        continue;
                                }
                                if (_state !== null) {
                                    if (_state.referent.isState) 
                                        tit.state = _state;
                                }
                                return tit;
                            }
                        }
                    }
                }
            }
        }
        if (t !== null && t.isValue("КЛАСС", null) && t.next !== null) {
            let br = BracketHelper.tryParse(t.next, BracketParseAttr.NO, 100);
            if (br !== null) 
                return TransItemToken._new2766(t, br.endToken, TransItemTokenTyps.CLASS, MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO));
        }
        let nt = Utils.as(t, NumberToken);
        if (nt !== null) {
            if (prev === null || nt.typ !== NumberSpellingType.DIGIT) 
                return null;
            if (prev.typ === TransItemTokenTyps.BRAND) 
                return TransItemToken._attachModel(t, false, prev);
            else 
                return null;
        }
        let res = null;
        if ((((res = TransItemToken._attachRusAutoNumber(t)))) !== null) {
            if (!res.isDoubt) 
                return res;
            if (prev !== null && prev.typ === TransItemTokenTyps.NOUN && prev.kind === TransportKind.AUTO) 
                return res;
            if (prev !== null && ((prev.typ === TransItemTokenTyps.BRAND || prev.typ === TransItemTokenTyps.MODEL))) 
                return res;
        }
        t1 = t;
        if (t.isHiphen) 
            t1 = t.next;
        if (prev !== null && prev.typ === TransItemTokenTyps.BRAND && t1 !== null) {
            let tit = TransItemToken._attachModel(t1, true, prev);
            if (tit !== null) {
                tit.beginToken = t;
                return tit;
            }
        }
        if (prev !== null && ((prev.typ === TransItemTokenTyps.NOUN || afterConj))) {
            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
            if (br !== null && br.isQuoteType) {
                let tit = TransItemToken.tryParse(br.beginToken.next, prev, afterConj, false);
                if (tit !== null && tit.endToken.next === br.endToken) {
                    if (!tit.isDoubt || tit.typ === TransItemTokenTyps.BRAND) {
                        tit.beginToken = br.beginToken;
                        tit.endToken = br.endToken;
                        return tit;
                    }
                }
                let s = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                if (!Utils.isNullOrEmpty(s) && (s.length < 30)) {
                    let _chars = 0;
                    let digs = 0;
                    let un = 0;
                    for (const c of s) {
                        if (!Utils.isWhitespace(c)) {
                            if (Utils.isLetter(c)) 
                                _chars++;
                            else if (Utils.isDigit(c)) 
                                digs++;
                            else 
                                un++;
                        }
                    }
                    if (((digs === 0 && un === 0 && t.next.chars.isCapitalUpper)) || prev.kind === TransportKind.SHIP || prev.kind === TransportKind.SPACE) 
                        return TransItemToken._new2766(br.beginToken, br.endToken, TransItemTokenTyps.NAME, s);
                    if (digs > 0 && (_chars < 5)) 
                        return TransItemToken._new2766(br.beginToken, br.endToken, TransItemTokenTyps.MODEL, Utils.replaceString(s, " ", ""));
                }
            }
        }
        if (prev !== null && (((prev.typ === TransItemTokenTyps.NOUN || prev.typ === TransItemTokenTyps.BRAND || prev.typ === TransItemTokenTyps.NAME) || prev.typ === TransItemTokenTyps.MODEL))) {
            let tit = TransItemToken._attachModel(t, prev.typ !== TransItemTokenTyps.NAME, prev);
            if (tit !== null) 
                return tit;
        }
        if (((prev !== null && prev.typ === TransItemTokenTyps.NOUN && prev.kind === TransportKind.AUTO) && (t instanceof TextToken) && t.chars.isLetter) && !t.chars.isAllLower && (t.whitespacesBeforeCount < 2)) {
            let pt = t.kit.processReferent("PERSON", t, null);
            if (pt === null) {
                let tit = TransItemToken._new2769(t, t, TransItemTokenTyps.BRAND);
                tit.value = t.term;
                let mc = t.getMorphClassInDictionary();
                if (mc.isNoun) 
                    tit.isDoubt = true;
                return tit;
            }
        }
        if (((prev !== null && prev.typ === TransItemTokenTyps.NOUN && ((prev.kind === TransportKind.SHIP || prev.kind === TransportKind.SPACE)))) || afterConj) {
            if (t.chars.isCapitalUpper) {
                let ok = true;
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.adjectives.length > 0) 
                    ok = false;
                else {
                    let rt = t.kit.processReferent("PERSON", t, null);
                    if (rt !== null) {
                        if (prev.chars.isCyrillicLetter && rt.chars.isLatinLetter) {
                        }
                        else 
                            ok = false;
                    }
                }
                if (t.getMorphClassInDictionary().isProperSurname) {
                    if (!t.morph._case.isNominative) 
                        ok = false;
                }
                if (ok) {
                    t1 = t;
                    let tit = null;
                    for (let tt = t.next; tt !== null; tt = tt.next) {
                        if (tt.whitespacesBeforeCount > 1) 
                            break;
                        if (!tt.chars.equals(t.chars)) 
                            break;
                        if ((((tit = TransItemToken.tryParse(tt, null, false, false)))) !== null) 
                            break;
                        t1 = tt;
                    }
                    let s = MiscHelper.getTextValue(t, t1, GetTextAttr.NO);
                    if (s !== null) {
                        let res1 = TransItemToken._new2770(t, t1, TransItemTokenTyps.NAME, true, s);
                        if (!t1.isNewlineAfter) {
                            let br = BracketHelper.tryParse(t1.next, BracketParseAttr.NO, 100);
                            if (br !== null) {
                                res1.endToken = br.endToken;
                                res1.altValue = res1.value;
                                res1.value = MiscHelper.getTextValueOfMetaToken(br, GetTextAttr.NO);
                            }
                        }
                        return res1;
                    }
                }
            }
        }
        return null;
    }
    
    static _attachModel(t, canBeFirstWord, prev) {
        let res = TransItemToken._new2769(t, t, TransItemTokenTyps.MODEL);
        let cyr = new StringBuilder();
        let lat = new StringBuilder();
        let t0 = t;
        let num = false;
        for (; t !== null; t = t.next) {
            if (t !== t0 && t.whitespacesBeforeCount > 1) 
                break;
            if (t === t0) {
                if (t.isHiphen || t.chars.isAllLower) {
                    if (prev === null || prev.typ !== TransItemTokenTyps.BRAND) 
                        return null;
                }
            }
            else {
                let pp = TransItemToken.tryParse(t, null, false, false);
                if (pp !== null) 
                    break;
            }
            if (t.isHiphen) {
                num = false;
                continue;
            }
            let nt = Utils.as(t, NumberToken);
            if (nt !== null) {
                if (num) 
                    break;
                num = true;
                if (nt.typ !== NumberSpellingType.DIGIT) 
                    break;
                if (cyr !== null) 
                    cyr.append(nt.value);
                if (lat !== null) 
                    lat.append(nt.value);
                res.endToken = t;
                continue;
            }
            if (t !== t0 && TransItemToken.tryParse(t, null, false, false) !== null) 
                break;
            if (!(t instanceof TextToken)) 
                break;
            if (num && t.isWhitespaceBefore) 
                break;
            num = false;
            let vv = MiscHelper.getCyrLatWord(t, 3);
            if (vv === null) {
                if (canBeFirstWord && t === t0) {
                    if (t.chars.isLetter && t.chars.isCapitalUpper) {
                        if ((((vv = MiscHelper.getCyrLatWord(t, 0)))) !== null) {
                            if (t.morph._case.isGenitive && ((prev === null || prev.typ !== TransItemTokenTyps.BRAND))) 
                                vv = null;
                            else if (prev !== null && prev.typ === TransItemTokenTyps.NOUN && ((prev.kind === TransportKind.SHIP || prev.kind === TransportKind.SPACE))) 
                                vv = null;
                            else 
                                res.isDoubt = true;
                        }
                    }
                    if (((vv === null && (t instanceof TextToken) && !t.chars.isAllLower) && t.chars.isLatinLetter && prev !== null) && prev.typ === TransItemTokenTyps.BRAND) {
                        lat.append(t.term);
                        res.endToken = t;
                        continue;
                    }
                }
                if (vv === null) 
                    break;
            }
            if ((vv.length < 4) || t.morph._class.isPreposition || t.morph._class.isConjunction) {
                if (t.isWhitespaceBefore && t.isWhitespaceAfter) {
                    if (t.previous !== null && !t.previous.isHiphen) {
                        if (t.chars.isAllLower) 
                            break;
                    }
                }
            }
            if (cyr !== null) {
                if (vv.cyrWord !== null) 
                    cyr.append(vv.cyrWord);
                else 
                    cyr = null;
            }
            if (lat !== null) {
                if (vv.latWord !== null) 
                    lat.append(vv.latWord);
                else 
                    lat = null;
            }
            res.endToken = t;
        }
        if (lat === null && cyr === null) 
            return null;
        if (lat !== null && lat.length > 0) {
            res.value = lat.toString();
            if (cyr !== null && cyr.length > 0 && res.value !== cyr.toString()) 
                res.altValue = cyr.toString();
        }
        else if (cyr !== null && cyr.length > 0) 
            res.value = cyr.toString();
        if (Utils.isNullOrEmpty(res.value)) 
            return null;
        if (res.kit.processReferent("PERSON", res.beginToken, null) !== null) 
            return null;
        return res;
    }
    
    static _attachNumber(t, ignoreRegion = false) {
        if (t === null) 
            return null;
        if (BracketHelper.canBeStartOfSequence(t, true, false)) {
            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
            if (br !== null) {
                let res1 = TransItemToken._attachNumber(t.next, false);
                if (res1 !== null && res1.endToken.next === br.endToken) {
                    res1.beginToken = t;
                    res1.endToken = br.endToken;
                    return res1;
                }
            }
        }
        let t0 = t;
        let t1 = t;
        if (t.isValue("НА", null)) {
            let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null && npt.noun.isValue("ФОН", null)) 
                t = npt.endToken.next;
        }
        let res = null;
        for (; t !== null; t = t.next) {
            if (t.isNewlineBefore) 
                break;
            if (t !== t0 && t.whitespacesBeforeCount > 1) 
                break;
            if (t.isHiphen) 
                continue;
            let nt = Utils.as(t, NumberToken);
            if (nt !== null) {
                if (nt.typ !== NumberSpellingType.DIGIT || nt.morph._class.isAdjective) 
                    break;
                if (res === null) 
                    res = new StringBuilder();
                else if (Utils.isDigit(res.charAt(res.length - 1))) 
                    res.append(' ');
                res.append(nt.getSourceText());
                t1 = t;
                continue;
            }
            let tt = Utils.as(t, TextToken);
            if (tt === null) {
                if ((t instanceof MetaToken) && (t.beginToken.lengthChar < 3) && (t.beginToken instanceof TextToken)) 
                    tt = Utils.as(t.beginToken, TextToken);
                else 
                    break;
            }
            if (!tt.chars.isLetter) 
                break;
            if (!tt.chars.isAllUpper && tt.isWhitespaceBefore) 
                break;
            if (tt.lengthChar > 3) 
                break;
            if (res === null) 
                res = new StringBuilder();
            res.append(tt.term);
            t1 = t;
        }
        if (res === null || (res.length < 4)) 
            return null;
        let re = TransItemToken._new2766(t0, t1, TransItemTokenTyps.NUMBER, res.toString());
        if (!ignoreRegion) {
            for (let k = 0, i = res.length - 1; i > 4; i--,k++) {
                if (!Utils.isDigit(res.charAt(i))) {
                    if (res.charAt(i) === ' ' && ((k === 2 || k === 3))) {
                        re.altValue = re.value.substring(i + 1);
                        re.value = re.value.substring(0, 0 + i);
                    }
                    break;
                }
            }
        }
        re.value = Utils.replaceString(re.value, " ", "");
        if (ignoreRegion) 
            re.altValue = MiscHelper.createCyrLatAlternative(re.value);
        return re;
    }
    
    static _attachRusAutoNumber(t) {
        if (BracketHelper.canBeStartOfSequence(t, true, false)) {
            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
            if (br !== null) {
                let res1 = TransItemToken._attachRusAutoNumber(t.next);
                if (res1 !== null && res1.endToken.next === br.endToken) {
                    res1.beginToken = t;
                    res1.endToken = br.endToken;
                    return res1;
                }
            }
        }
        let v1 = MiscHelper.getCyrLatWord(t, 1);
        if (v1 === null || v1.cyrWord === null) 
            return null;
        let t0 = t;
        let doubt = 0;
        if (!t.chars.isAllUpper || t.isWhitespaceAfter) 
            doubt++;
        t = t.next;
        let nt = Utils.as(t, NumberToken);
        if ((nt === null || nt.typ !== NumberSpellingType.DIGIT || nt.morph._class.isAdjective) || (nt.endChar - nt.beginChar) !== 2) 
            return null;
        t = t.next;
        let v2 = MiscHelper.getCyrLatWord(t, 2);
        if (v2 === null || v2.cyrWord === null || v2.length !== 2) 
            return null;
        if (!t.chars.isAllUpper || t.isWhitespaceAfter) 
            doubt++;
        let res = TransItemToken._new2773(t0, t, TransItemTokenTyps.NUMBER, TransportKind.AUTO);
        res.value = (v1.cyrWord + nt.getSourceText() + v2.cyrWord);
        nt = Utils.as(t.next, NumberToken);
        if (((nt !== null && nt.intValue !== null && nt.typ === NumberSpellingType.DIGIT) && !nt.morph._class.isAdjective && nt.intValue !== null) && (nt.intValue < 1000) && (t.whitespacesAfterCount < 2)) {
            let n = nt.value;
            if (n.length < 2) 
                n = "0" + n;
            res.altValue = n;
            res.endToken = nt;
        }
        if (res.endToken.next !== null && res.endToken.next.isValue("RUS", null)) {
            res.endToken = res.endToken.next;
            doubt = 0;
        }
        if (doubt > 1) 
            res.isDoubt = true;
        return res;
    }
    
    static checkNumberKeyword(t) {
        let tok = TransItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return null;
        let tt = Utils.as(tok.termin, TransItemToken.TransTermin);
        if (tt !== null && tt.typ === TransItemTokenTyps.NUMBER) 
            return tok.endToken.next;
        return null;
    }
    
    static initialize() {
        if (TransItemToken.m_Ontology !== null) 
            return;
        TransItemToken.m_Ontology = new TerminCollection();
        let t = null;
        t = TransItemToken.TransTermin._new2774("автомобиль", true, TransItemTokenTyps.NOUN, TransportKind.AUTO);
        t.addAbridge("а-м");
        t.addVariant("автомашина", false);
        t.addVariant("ТРАНСПОРТНОЕ СРЕДСТВО", false);
        t.addVariant("автомобіль", false);
        TransItemToken.m_Ontology.add(t);
        for (const s of ["ВНЕДОРОЖНИК", "ПОЗАШЛЯХОВИК", "АВТОБУС", "МИКРОАВТОБУС", "ГРУЗОВИК", "МОТОЦИКЛ", "МОПЕД"]) {
            TransItemToken.m_Ontology.add(TransItemToken.TransTermin._new2774(s, true, TransItemTokenTyps.NOUN, TransportKind.AUTO));
        }
        t = TransItemToken.TransTermin._new2774("", true, TransItemTokenTyps.NOUN, TransportKind.AUTO);
        t.addAbridge("а-м");
        TransItemToken.m_Ontology.add(t);
        t = TransItemToken.TransTermin._new2777("государственный номер", true, TransItemTokenTyps.NUMBER, "ИМО");
        t.addAbridge("г-н");
        t.addAbridge("н\\з");
        t.addAbridge("г\\н");
        t.addVariant("госномер", false);
        t.addAbridge("гос.номер");
        t.addAbridge("гос.ном.");
        t.addAbridge("г.н.з.");
        t.addAbridge("г.р.з.");
        t.addVariant("ГРЗ", false);
        t.addVariant("ГНЗ", false);
        t.addVariant("регистрационный знак", false);
        t.addAbridge("рег. знак");
        t.addVariant("государственный регистрационный знак", false);
        t.addVariant("бортовой номер", false);
        TransItemToken.m_Ontology.add(t);
        t = TransItemToken.TransTermin._new2778("державний номер", true, TransItemTokenTyps.NUMBER, MorphLang.UA);
        t.addVariant("держномер", false);
        t.addAbridge("держ.номер");
        t.addAbridge("держ.ном.");
        TransItemToken.m_Ontology.add(t);
        t = TransItemToken.TransTermin._new2779("номер", true, TransItemTokenTyps.NUMBER);
        TransItemToken.m_Ontology.add(t);
        for (const s of ["КРУИЗНЫЙ ЛАЙНЕР", "ТЕПЛОХОД", "ПАРОХОД", "ЯХТА", "ЛОДКА", "КАТЕР", "КОРАБЛЬ", "СУДНО", "ПОДВОДНАЯ ЛОДКА", "АПК", "ШХУНА", "ПАРОМ", "КРЕЙСЕР", "АВИАНОСЕЦ", "ЭСМИНЕЦ", "ФРЕГАТ", "ЛИНКОР", "АТОМОХОД", "ЛЕДОКОЛ", "ПЛАВБАЗА", "ТАНКЕР", "СУПЕРТАНКЕР", "СУХОГРУЗ", "ТРАУЛЕР", "РЕФРИЖЕРАТОР"]) {
            TransItemToken.m_Ontology.add((t = TransItemToken.TransTermin._new2774(s, true, TransItemTokenTyps.NOUN, TransportKind.SHIP)));
            if (s === "АПК") 
                t.isDoubt = true;
        }
        for (const s of ["КРУЇЗНИЙ ЛАЙНЕР", "ПАРОПЛАВ", "ПАРОПЛАВ", "ЯХТА", "ЧОВЕН", "КОРАБЕЛЬ", "СУДНО", "ПІДВОДНИЙ ЧОВЕН", "АПК", "ШХУНА", "ПОРОМ", "КРЕЙСЕР", "АВІАНОСЕЦЬ", "ЕСМІНЕЦЬ", "ФРЕГАТ", "ЛІНКОР", "АТОМОХІД", "КРИГОЛАМ", "ПЛАВБАЗА", "ТАНКЕР", "СУПЕРТАНКЕР", "СУХОВАНТАЖ", "ТРАУЛЕР", "РЕФРИЖЕРАТОР"]) {
            TransItemToken.m_Ontology.add((t = TransItemToken.TransTermin._new2781(s, true, TransItemTokenTyps.NOUN, MorphLang.UA, TransportKind.SHIP)));
            if (s === "АПК") 
                t.isDoubt = true;
        }
        for (const s of ["САМОЛЕТ", "АВИАЛАЙНЕР", "ИСТРЕБИТЕЛЬ", "БОМБАРДИРОВЩИК", "ВЕРТОЛЕТ"]) {
            TransItemToken.m_Ontology.add(TransItemToken.TransTermin._new2774(s, true, TransItemTokenTyps.NOUN, TransportKind.FLY));
        }
        for (const s of ["ЛІТАК", "АВІАЛАЙНЕР", "ВИНИЩУВАЧ", "БОМБАРДУВАЛЬНИК", "ВЕРТОЛІТ"]) {
            TransItemToken.m_Ontology.add(TransItemToken.TransTermin._new2781(s, true, TransItemTokenTyps.NOUN, MorphLang.UA, TransportKind.FLY));
        }
        for (const s of ["КОСМИЧЕСКИЙ КОРАБЛЬ", "ЗВЕЗДОЛЕТ", "КОСМИЧЕСКАЯ СТАНЦИЯ", "РАКЕТА-НОСИТЕЛЬ"]) {
            TransItemToken.m_Ontology.add(TransItemToken.TransTermin._new2774(s, true, TransItemTokenTyps.NOUN, TransportKind.SPACE));
        }
        for (const s of ["КОСМІЧНИЙ КОРАБЕЛЬ", "ЗОРЕЛІТ", "КОСМІЧНА СТАНЦІЯ", "РАКЕТА-НОСІЙ"]) {
            TransItemToken.m_Ontology.add(TransItemToken.TransTermin._new2781(s, true, TransItemTokenTyps.NOUN, MorphLang.UA, TransportKind.SPACE));
        }
        TransItemToken._loadBrands(TransItemToken.m_Cars, TransportKind.AUTO);
        TransItemToken._loadBrands(TransItemToken.m_Flys, TransportKind.FLY);
    }
    
    static _loadBrands(str, _kind) {
        let cars = Utils.splitString(str, ';', false);
        let vars = new Array();
        for (const c of cars) {
            let its = Utils.splitString(c, ',', false);
            vars.splice(0, vars.length);
            let doubt = false;
            for (const it of its) {
                let s = it.trim();
                if (!Utils.isNullOrEmpty(s)) {
                    if (s === "true") 
                        doubt = true;
                    else 
                        vars.push(s);
                }
            }
            if (vars.length === 0) 
                continue;
            for (const v of vars) {
                let t = new TransItemToken.TransTermin(v);
                t.canonicText = vars[0];
                t.kind = _kind;
                t.typ = TransItemTokenTyps.BRAND;
                t.isDoubt = doubt;
                TransItemToken.m_Ontology.add(t);
            }
        }
    }
    
    static _new2759(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TransItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ref = _arg4;
        res.morph = _arg5;
        return res;
    }
    
    static _new2760(_arg1, _arg2, _arg3, _arg4) {
        let res = new TransItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.ref = _arg4;
        return res;
    }
    
    static _new2762(_arg1, _arg2, _arg3, _arg4) {
        let res = new TransItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.routeItems = _arg4;
        return res;
    }
    
    static _new2764(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new TransItemToken(_arg1, _arg2);
        res.kind = _arg3;
        res.typ = _arg4;
        res.isDoubt = _arg5;
        res.chars = _arg6;
        res.morph = _arg7;
        return res;
    }
    
    static _new2766(_arg1, _arg2, _arg3, _arg4) {
        let res = new TransItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new2769(_arg1, _arg2, _arg3) {
        let res = new TransItemToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2770(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TransItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isDoubt = _arg4;
        res.value = _arg5;
        return res;
    }
    
    static _new2773(_arg1, _arg2, _arg3, _arg4) {
        let res = new TransItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.kind = _arg4;
        return res;
    }
    
    static static_constructor() {
        TransItemToken.m_Ontology = null;
        TransItemToken.m_Flys = "\n        Boeing, Боинг;\n        Airbus, Аэробус, Эрбас;\n        Ил, Илюшин, true;\n        Ту, Туполев, true;\n        Ан, Антонов, true;\n        Су, Сухой, Sukhoi, Sukhoy, true;\n        Як, Яковлев, true;\n        BAE Systems, БАЕ Системз;\n        ATR, АТР, true;\n        AVIC;\n        Bombardier, Бомбардье;  \n        Britten-Norman, Бриттен-Норман;\n        Cessna, Цессна;\n        Dornier, Дорнье;\n        Embraer, Эмбраер;\n        Fairchild, Fairchild Aerospace, Фэйрчайлд;\n        Fokker, Фоккер;\n        Hawker Beechcraft, Хокер Бичкрафт;\n        Indonesian Aerospace, Индонезиан;\n        Lockheed Martin, Локхид Мартин;\n        LZ Auronautical Industries, LET;\n        Douglas, McDonnell Douglas, Дуглас;\n        NAMC, НАМК;\n        Pilatus, Пилатус, true;\n        Piper Aircraft;\n        Saab, Сааб, true;\n        Shorts, Шортс, true;\n";
        TransItemToken.m_Cars = "\n        AC Cars;\n        Acura, Акура;\n        Abarth;\n        Alfa Romeo, Альфа Ромео;\n        ALPINA, Альпина, true;\n        Ariel Motor, Ариэль Мотор;\n        ARO, true;\n        Artega, true;\n        Aston Martin;\n        AUDI, Ауди;\n        Austin Healey;\n        BAW;\n        Beijing Jeep;\n        Bentley, Бентли;\n        Bitter, Биттер, true;\n        BMW, БМВ;\n        Brilliance;\n        Bristol, Бристоль, true;\n        Bugatti, Бугатти;\n        Buick, Бьюик;\n        BYD, true;\n        Cadillac, Кадиллак, Кадилак;\n        Caterham;\n        Chery, trye;\n        Chevrolet, Шевроле, Шеврале;\n        Chrysler, Крайслер;\n        Citroen, Ситроен, Ситроэн;\n        Dacia;\n        DADI;\n        Daewoo, Дэо;\n        Dodge, Додж;\n        Daihatsu;\n        Daimler, Даймлер;\n        DKW;\n        Derways;\n        Eagle, true;\n        Elfin Sports Cars;\n        FAW, true;\n        Ferrari, Феррари, Ферари;\n        FIAT, Фиат;\n        Fisker Karma;\n        Ford, Форд;\n        Geely;\n        GEO, true;\n        GMC, true;\n        Gonow;\n        Great Wall, true;\n        Gumpert;\n        Hafei;\n        Haima;\n        Honda, Хонда;\n        Horch;\n        Hudson, true;\n        Hummer, Хаммер;\n        Harley, Харлей;\n        Hyundai, Хюндай, Хундай;\n        Infiniti, true;\n        Isuzu, Исузу;\n        Jaguar, Ягуар, true;\n        Jeep, Джип, true;\n        Kia, Киа, true;\n        Koenigsegg;\n        Lamborghini, Ламборджини;\n        Land Rover, Лендровер, Лэндровер;\n        Land Cruiser, Ленд крузер, Лендкрузер, Toyota Land Cruiser, Тойота Ленд крузер, Тойота Лендкрузер;\n        Landwind;\n        Lancia;\n        Lexus, Лексус;\n        Leyland;\n        Lifan;\n        Lincoln, Линкольн, true;\n        Lotus, true;\n        Mahindra;\n        Maserati;\n        Maybach;\n        Mazda, Мазда;\n        Mercedes-Benz, Mercedes, Мерседес, Мэрседес, Мерседес-бенц;\n        Mercury, true;\n        Mini, true;\n        Mitsubishi, Mitsubishi Motors, Мицубиши, Мицубиси;\n        Morgan, true;\n        Nissan, Nissan Motor, Ниссан, Нисан;\n        Opel, Опель;\n        Pagani;\n        Peugeot, Пежо;\n        Plymouth;\n        Pontiac, Понтиак;\n        Porsche, Порше;\n        Renault, Рено;\n        Rinspeed;\n        Rolls-Royce, Роллс-Ройс;\n        SAAB, Сааб;\n        Saleen;\n        Saturn, Сатурн, true;\n        Scion;\n        Seat, true;\n        Skoda, Шкода;\n        Smart, true;\n        Spyker, true;\n        Ssang Yong, Ссанг янг;\n        Subaru, Субару;\n        Suzuki, Судзуки;\n        Tesla, true;\n        Toyota, Тойота, Тоета;\n        Vauxhall;\n        Volkswagen, Фольксваген;\n        Volvo, Вольво;\n        Wartburg;\n        Wiesmann;\n        Yamaha, Ямаха;\n        Zenvo;\n\n        ВАЗ, VAZ;\n        ГАЗ, GAZ, true;\n        ЗАЗ, ZAZ;\n        ЗИЛ, ZIL;\n        АЗЛК, AZLK;\n        Иж, true;\n        Москвич, true;\n        УАЗ, UAZ;\n        ТАГАЗ, TaGAZ;\n        Лада, Жигули, true;\n\n";
    }
}


TransItemToken.TransTermin = class  extends Termin {
    
    constructor(source, addLemmaVariant = false) {
        super(null, null, false);
        this.kind = TransportKind.UNDEFINED;
        this.typ = TransItemTokenTyps.NOUN;
        this.isDoubt = false;
        this.initByNormalText(source, null);
    }
    
    static _new2774(_arg1, _arg2, _arg3, _arg4) {
        let res = new TransItemToken.TransTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.kind = _arg4;
        return res;
    }
    
    static _new2777(_arg1, _arg2, _arg3, _arg4) {
        let res = new TransItemToken.TransTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new2778(_arg1, _arg2, _arg3, _arg4) {
        let res = new TransItemToken.TransTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.lang = _arg4;
        return res;
    }
    
    static _new2779(_arg1, _arg2, _arg3) {
        let res = new TransItemToken.TransTermin(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2781(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TransItemToken.TransTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.lang = _arg4;
        res.kind = _arg5;
        return res;
    }
}


TransItemToken.static_constructor();

module.exports = TransItemToken