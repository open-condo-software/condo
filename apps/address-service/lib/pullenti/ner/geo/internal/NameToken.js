/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphGender = require("./../../../morph/MorphGender");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphNumber = require("./../../../morph/MorphNumber");
const NumberExType = require("./../../core/NumberExType");
const TextToken = require("./../../TextToken");
const NumberSpellingType = require("./../../NumberSpellingType");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const Termin = require("./../../core/Termin");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const TerrItemToken = require("./TerrItemToken");
const NumToken = require("./NumToken");
const BracketSequenceToken = require("./../../core/BracketSequenceToken");
const AddressItemType = require("./../../address/internal/AddressItemType");
const GeoTokenType = require("./GeoTokenType");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const BracketHelper = require("./../../core/BracketHelper");
const MiscLocationHelper = require("./MiscLocationHelper");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const ReferentToken = require("./../../ReferentToken");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const NumberHelper = require("./../../core/NumberHelper");
const StreetItemToken = require("./../../address/internal/StreetItemToken");
const AddressItemToken = require("./../../address/internal/AddressItemToken");

class NameToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.name = null;
        this.number = null;
        this.pref = null;
        this.miscTyp = null;
        this.isDoubt = false;
        this.isEponym = false;
        this.m_lev = 0;
        this.m_typ = GeoTokenType.ANY;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.isDoubt) 
            res.append("? ");
        if (this.pref !== null) 
            res.append(this.pref).append(" ");
        if (this.name !== null) 
            res.append("\"").append(this.name).append("\"");
        if (this.number !== null) 
            res.append(" N").append(this.number);
        return res.toString();
    }
    
    static tryParse(t, ty, lev, afterTyp = false) {
        const OrgTypToken = require("./OrgTypToken");
        if (t === null || lev > 3) 
            return null;
        let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
        if (br === null && BracketHelper.isBracket(t, true) && MiscLocationHelper.isUserParamAddress(t)) {
            for (let tt = t.next; tt !== null; tt = tt.next) {
                if (!BracketHelper.isBracket(tt, true)) 
                    continue;
                if ((tt.endChar - t.beginChar) > 30) 
                    break;
                if (BracketHelper.tryParse(tt, BracketParseAttr.NO, 100) !== null) 
                    break;
                br = new BracketSequenceToken(t, tt);
                break;
            }
        }
        let res = null;
        let ttt = null;
        let num = null;
        let ttok = null;
        if (br !== null) {
            if (!BracketHelper.isBracket(t, true)) 
                return null;
            let ait = AddressItemToken.tryParsePureItem(t.next, null, null);
            if (ait !== null && ait.typ !== AddressItemType.NUMBER && ait.endToken.next === br.endToken) 
                return null;
            let nam = NameToken.tryParse(t.next, ty, lev + 1, false);
            if (nam !== null && nam.endToken.next === br.endToken) {
                res = nam;
                nam.beginToken = t;
                nam.endToken = br.endToken;
                res.isDoubt = false;
            }
            else {
                res = new NameToken(t, br.endToken);
                let tt = br.endToken.previous;
                if (tt instanceof NumberToken) {
                    res.number = tt.value;
                    tt = tt.previous;
                    if (tt !== null && tt.isHiphen) 
                        tt = tt.previous;
                }
                if (tt !== null && tt.beginChar > br.beginChar) 
                    res.name = MiscHelper.getTextValue(t.next, tt, GetTextAttr.NO);
            }
        }
        else if ((t instanceof ReferentToken) && t.beginToken === t.endToken && !t.beginToken.chars.isAllLower) {
            res = NameToken._new1244(t, t, true);
            res.name = MiscHelper.getTextValueOfMetaToken(Utils.as(t, ReferentToken), GetTextAttr.NO);
        }
        else if (((ttt = MiscHelper.checkNumberPrefix(t))) instanceof NumberToken) {
            res = NameToken._new1245(t, ttt, ttt.value);
            if (ttt.whitespacesAfterCount < 2) {
                let ttt3 = ttt.next;
                if (ttt3 !== null && ttt3.isHiphen) 
                    ttt3 = ttt3.next;
                let nam = NameToken.tryParse(ttt3, ty, lev + 1, false);
                if (nam !== null && nam.name !== null && nam.number === null) {
                    res.name = nam.name;
                    res.endToken = nam.endToken;
                }
            }
        }
        else if ((((num = NumberHelper.tryParseAge(t)))) !== null) 
            res = NameToken._new1246(t, num.endToken, num.value + " ЛЕТ");
        else if ((((num = NumberHelper.tryParseAnniversary(t)))) !== null) 
            res = NameToken._new1246(t, num.endToken, num.value + " ЛЕТ");
        else if (t instanceof NumberToken) {
            let nn = NumberHelper.tryParseNumberWithPostfix(t);
            if (nn !== null && !MiscLocationHelper.isUserParamAddress(t)) {
                if (nn.exTyp !== NumberExType.UNDEFINED) 
                    return null;
            }
            res = NameToken._new1245(t, t, t.value);
            if ((t.whitespacesAfterCount < 3) && afterTyp) {
                let _next = NameToken.tryParse(t.next, ty, lev + 1, afterTyp);
                if (_next !== null && _next.number === null && _next.name !== null) {
                    _next.number = res.number;
                    _next.beginToken = res.beginToken;
                    res = _next;
                }
            }
            if (t.next !== null && t.next.isHiphen && !t.next.isWhitespaceAfter) {
                let _next = NameToken.tryParse(t.next.next, ty, lev + 1, afterTyp);
                if (_next !== null && _next.number === null && _next.name !== null) {
                    _next.number = res.number;
                    _next.beginToken = res.beginToken;
                    res = _next;
                }
            }
        }
        else if (t.isHiphen && (t.next instanceof NumberToken)) {
            num = NumberHelper.tryParseAge(t.next);
            if (num === null) 
                num = NumberHelper.tryParseAnniversary(t.next);
            if (num !== null) 
                res = NameToken._new1246(t, num.endToken, num.value + " ЛЕТ");
            else 
                res = NameToken._new1250(t, t.next, t.next.value, true);
        }
        else if ((t instanceof ReferentToken) && t.getReferent().typeName === "DATE") {
            let year = t.getReferent().getStringValue("YEAR");
            if (year !== null) 
                res = NameToken._new1246(t, t, year + " ГОДА");
            else {
                let mon = t.getReferent().getStringValue("MONTH");
                let day = t.getReferent().getStringValue("DAY");
                if (day !== null && mon === null && t.getReferent().parentReferent !== null) 
                    mon = t.getReferent().parentReferent.getStringValue("MONTH");
                if (mon !== null) 
                    res = NameToken._new1252(t, t, t.getReferent().toString().toUpperCase());
            }
        }
        else if (!(t instanceof TextToken)) 
            return null;
        else if (t.lengthChar === 1) {
            if ((t.getMorphClassInDictionary().isPreposition && t.chars.isAllUpper && t.whitespacesAfterCount > 0) && (t.whitespacesAfterCount < 3) && (t.next instanceof TextToken)) {
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSEPREPOSITION, 0, null);
                if (npt !== null && npt.endToken !== t) 
                    return NameToken._new1253(t, npt.endToken, true, MiscHelper.getTextValue(t, npt.endToken, GetTextAttr.NO));
            }
            if ((t.chars.isAllUpper && t.next !== null && t.next.isHiphen) && (t.next.next instanceof TextToken)) 
                return NameToken._new1253(t, t.next.next, true, MiscHelper.getTextValue(t, t.next.next, GetTextAttr.NO));
            let ok = false;
            if (t.isNewlineAfter || t.next === null) 
                ok = true;
            else if (t.next.isComma) 
                ok = true;
            else if (t.previous !== null && t.previous.isValue("СЕКТОР", null)) 
                ok = true;
            if (ty === GeoTokenType.ORG && ok && t.chars.isLetter) 
                return NameToken._new1252(t, t, t.term);
            if ((((ty !== GeoTokenType.ORG && ty !== GeoTokenType.STRONG)) || !t.chars.isAllUpper || !t.chars.isLetter) || t.isWhitespaceAfter) 
                return null;
            let _next = NameToken.tryParse(t.next, ty, lev + 1, false);
            if (_next !== null && _next.number !== null && _next.name === null) {
                res = _next;
                res.beginToken = t;
                res.name = t.term;
            }
            else if (t.next !== null && t.next.isChar('.')) {
                let nam = new StringBuilder();
                nam.append(t.term);
                let t1 = t.next;
                for (let tt = t1.next; tt !== null; tt = tt.next) {
                    if (!(tt instanceof TextToken) || tt.lengthChar !== 1 || !tt.chars.isLetter) 
                        break;
                    if (tt.next === null || !tt.next.isChar('.')) 
                        break;
                    nam.append(tt.term);
                    tt = tt.next;
                    t1 = tt;
                }
                if (nam.length >= 3) 
                    res = NameToken._new1252(t, t1, nam.toString());
                else {
                    let rt = t.kit.processReferent("PERSON", t, null);
                    if (rt !== null) {
                        res = NameToken._new1252(t, rt.endToken, rt.referent.getStringValue("LASTNAME"));
                        if (res.name === null) 
                            res.name = rt.referent.toStringEx(false, null, 0).toUpperCase();
                        else 
                            for (let tt = t; tt !== null && tt.endChar <= rt.endChar; tt = tt.next) {
                                if ((tt instanceof TextToken) && tt.isValue(res.name, null)) {
                                    res.name = tt.term;
                                    break;
                                }
                            }
                    }
                }
            }
        }
        else if (t.term === "ИМЕНИ" || t.term === "ИМ") {
            let tt = t.next;
            if (t.isValue("ИМ", null) && tt !== null && tt.isChar('.')) 
                tt = tt.next;
            let nam = NameToken.tryParse(tt, GeoTokenType.STRONG, lev + 1, false);
            if (nam !== null) {
                nam.beginToken = t;
                nam.isDoubt = false;
                nam.isEponym = true;
                res = nam;
            }
        }
        else if ((((ttok = NameToken.M_ONTO.tryParse(t, TerminParseAttr.NO)))) !== null) {
            res = NameToken._new1252(t, ttok.endToken, ttok.termin.canonicText);
            let tt = ttok.endToken.next;
            if (tt !== null && tt.isValue("СССР", null)) 
                res.endToken = tt;
        }
        else if (t.isValue("ОТДЕЛЕНИЕ", null)) {
            res = NameToken.tryParse(t.next, ty, lev + 1, afterTyp);
            if (res !== null) 
                res.beginToken = t;
        }
        else {
            if (afterTyp && ((t.morph._class.isProperSurname || t.getMorphClassInDictionary().isProperName))) {
                let rt = t.kit.processReferent("PERSON", t, null);
                if (rt !== null) {
                    res = new NameToken(t, rt.endToken);
                    let sur = rt.referent.getStringValue("LASTNAME");
                    if (sur !== null) {
                        for (let tt = t; tt !== null && tt.endChar <= rt.endChar; tt = tt.next) {
                            if ((tt instanceof TextToken) && tt.isValue(sur, null)) {
                                res.name = tt.term;
                                break;
                            }
                        }
                    }
                    if (res.name === null) 
                        res.name = MiscHelper.getTextValueOfMetaToken(rt, GetTextAttr.NO);
                }
            }
            if (res === null) {
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.endToken.isValue("КВАРТАЛ", null)) {
                    if (npt.beginToken === npt.endToken || npt.beginToken.isValue("КАДАСТРОВЫЙ", null)) {
                        let num2 = NumToken.tryParse(npt.endToken.next, ty);
                        if (num2 !== null && num2.isCadasterNumber) {
                            res = NameToken._new1245(t, num2.endToken, num2.value);
                            res.miscTyp = "кадастровый квартал";
                            if ((res.whitespacesAfterCount < 2) && !BracketHelper.isBracket(res.endToken.next, false)) {
                                if (res.endToken.next.isValue("ЛЕСНОЙ", null)) {
                                    res.endToken = res.endToken.next;
                                    res.name = "ЛЕСНОЙ";
                                }
                            }
                            return res;
                        }
                    }
                }
                if (npt !== null && npt.beginToken === npt.endToken) 
                    npt = null;
                if (npt !== null) {
                    let ttt2 = OrgTypToken.tryParse(npt.endToken, false, null);
                    if (ttt2 !== null && ttt2.endChar > npt.endChar) 
                        npt = null;
                    else if (ttt2 !== null && !afterTyp && !npt.morph._case.isGenitive) 
                        npt = null;
                    else if (npt.adjectives.length > 1 && OrgTypToken.tryParse(npt.endToken.previous, false, null) !== null) 
                        npt = null;
                }
                if (npt !== null && npt.endToken.chars.isAllLower) {
                    if (t.chars.isAllLower) 
                        npt = null;
                    else if (StreetItemToken.checkKeyword(npt.endToken)) {
                        if (npt.morph.number === MorphNumber.PLURAL) {
                        }
                        else if (npt.endToken.isValue("САД", null) || npt.endToken.isValue("ПАРК", null)) {
                        }
                        else 
                            npt = null;
                    }
                }
                if (npt !== null) 
                    res = NameToken._new1260(t, npt.endToken, npt.morph, Utils.replaceString(MiscHelper.getTextValueOfMetaToken(npt, GetTextAttr.NO), "-", " "));
                else if (!t.chars.isAllLower || t.isValue("МЕСТНОСТЬ", null) || ((afterTyp && MiscLocationHelper.isUserParamAddress(t)))) {
                    if (TerrItemToken.checkKeyword(t) !== null) {
                        if (t.chars.isCapitalUpper && afterTyp) {
                        }
                        else 
                            return null;
                    }
                    let ait = AddressItemToken.tryParsePureItem(t, null, null);
                    if ((ait !== null && ait.typ !== AddressItemType.NUMBER && ait.value !== null) && ait.value !== "0") 
                        return null;
                    res = NameToken._new1261(t, t, t.term, t.morph);
                    if (t.chars.isAllLower) 
                        res.isDoubt = true;
                    if ((((LanguageHelper.endsWith(res.name, "ОВ") || LanguageHelper.endsWith(res.name, "ВО"))) && (t.next instanceof TextToken) && !t.next.chars.isAllLower) && t.next.lengthChar > 1 && !t.next.getMorphClassInDictionary().isUndefined) {
                        if (StreetItemToken.checkKeyword(t.next)) {
                        }
                        else if (OrgTypToken.tryParse(t.next, false, null) !== null) {
                        }
                        else {
                            res.endToken = t.next;
                            res.name = (res.name + " " + t.next.term);
                            res.morph = t.next.morph;
                        }
                    }
                    if ((t.whitespacesAfterCount < 2) && (t.next instanceof TextToken) && t.next.chars.isLetter) {
                        let ok = false;
                        if (MiscLocationHelper.checkTerritory(t.next) !== null) {
                        }
                        else if (t.next.lengthChar >= 3 && t.next.getMorphClassInDictionary().isUndefined) 
                            ok = true;
                        else if (MiscLocationHelper.checkNameLong(res) !== null) 
                            ok = true;
                        else if (MiscLocationHelper.checkTerritory(t.next) !== null) {
                        }
                        else if (StreetItemToken.checkKeyword(t.next)) {
                        }
                        else {
                            let ok1 = false;
                            if ((((t.next.lengthChar < 4) || t.getMorphClassInDictionary().isUndefined)) && t.next.chars.equals(t.chars)) 
                                ok1 = true;
                            else if (t.isValue("МЕСТНОСТЬ", null) && !t.next.chars.isAllLower) 
                                ok = true;
                            else if (!t.next.chars.isAllLower || !AddressItemToken.checkHouseAfter(t.next, false, false)) {
                                if (MiscLocationHelper.checkTerritory(t.next) === null) {
                                    if (t.next.isNewlineAfter || t.next.next.isComma || AddressItemToken.checkHouseAfter(t.next.next, false, false)) 
                                        ok = true;
                                }
                                if (!ok && t.next.next !== null) {
                                    let typ = OrgTypToken.tryParse(t.next.next, false, null);
                                    if (typ !== null && typ.notOrg) 
                                        ok = true;
                                    else if (t.next.next.isValue("МАССИВ", null)) 
                                        ok = true;
                                }
                            }
                            if (ok1) {
                                let _next = NameToken.tryParse(t.next, ty, lev + 1, false);
                                if (_next === null || _next.beginToken === _next.endToken) 
                                    ok = true;
                            }
                        }
                        if (!ok && t.next.getMorphClassInDictionary().isAdjective) {
                            let mc = t.getMorphClassInDictionary();
                            if (mc.isNoun || mc.isProperGeo) {
                                if (((t.morph.gender.value()) & (t.next.morph.gender.value())) !== (MorphGender.UNDEFINED.value())) {
                                    let tt = t.next.next;
                                    if (tt === null) 
                                        ok = true;
                                    else if (tt.isComma || tt.isNewlineAfter) 
                                        ok = true;
                                    else if (AddressItemToken.checkHouseAfter(tt, false, false)) 
                                        ok = true;
                                    else if (AddressItemToken.checkStreetAfter(tt, false)) 
                                        ok = true;
                                }
                            }
                        }
                        if (ok) {
                            if (OrgTypToken.tryParse(t.next, false, null) !== null) 
                                ok = false;
                        }
                        if (ok) {
                            let tt = MiscLocationHelper.checkNameLong(res);
                            if (tt === null) 
                                tt = t.next;
                            res.name = (res.name + " " + MiscHelper.getTextValue(res.endToken.next, tt, GetTextAttr.NO));
                            res.endToken = tt;
                        }
                        else {
                            let lat = NumberHelper.tryParseRoman(t.next);
                            if (lat !== null && lat.typ === NumberSpellingType.ROMAN) {
                                res.number = lat.value;
                                res.endToken = lat.endToken;
                            }
                        }
                    }
                }
                if (res !== null && res.endToken.isValue("УСАДЬБА", null) && (res.whitespacesAfterCount < 2)) {
                    let res1 = NameToken.tryParse(res.endToken.next, ty, lev + 1, false);
                    if (res1 !== null && res1.name !== null) {
                        res.endToken = res1.endToken;
                        res.name = (res.name + " " + res1.name);
                    }
                }
            }
        }
        if (res === null || res.whitespacesAfterCount > 2) 
            return res;
        ttt = res.endToken.next;
        if (ttt !== null && ttt.isHiphen) {
            num = NumberHelper.tryParseAge(ttt.next);
            if (num === null) 
                num = NumberHelper.tryParseAnniversary(ttt.next);
            if (num !== null) {
                res.pref = num.value + " ЛЕТ";
                res.endToken = num.endToken;
            }
            else if ((ttt.next instanceof NumberToken) && res.number === null) {
                res.number = ttt.next.value;
                res.endToken = ttt.next;
            }
            else if (res.number === null) {
                let nt = NumberHelper.tryParseRoman(ttt.next);
                if (nt !== null) {
                    res.number = nt.value;
                    res.endToken = nt.endToken;
                }
            }
            if ((ttt === res.endToken.next && (ttt.next instanceof TextToken) && !ttt.isWhitespaceAfter) && res.name !== null) {
                res.name = (res.name + " " + ttt.next.term);
                res.endToken = ttt.next;
            }
        }
        else if ((((num = NumberHelper.tryParseAge(ttt)))) !== null) {
            res.pref = num.value + " ЛЕТ";
            res.endToken = num.endToken;
        }
        else if ((((num = NumberHelper.tryParseAnniversary(ttt)))) !== null) {
            res.pref = num.value + " ЛЕТ";
            res.endToken = num.endToken;
        }
        else if (ttt instanceof NumberToken) {
            let ok = false;
            if (ty === GeoTokenType.ORG && (ttt.whitespacesBeforeCount < 2)) 
                ok = true;
            if (ok) {
                if (StreetItemToken.checkKeyword(ttt.next)) 
                    ok = false;
                else if (ttt.next !== null) {
                    if (ttt.next.isValue("КМ", null) || ttt.next.isValue("КИЛОМЕТР", null)) 
                        ok = false;
                }
            }
            if (ok) {
                res.number = ttt.value;
                res.endToken = ttt;
            }
        }
        if (res.number === null && res.endToken.next !== null) {
            let nnn = NumToken.tryParse(res.endToken.next, ty);
            if (nnn !== null && nnn.hasPrefix) {
                res.number = nnn.value;
                res.endToken = nnn.endToken;
            }
            else if (nnn === null && res.endToken.next.isComma && (res.endToken.next.whitespacesAfterCount < 3)) {
                nnn = NumToken.tryParse(res.endToken.next.next, ty);
                if (nnn !== null && nnn.hasSpecWord) {
                    res.number = nnn.value;
                    res.endToken = nnn.endToken;
                }
            }
        }
        if ((res.whitespacesAfterCount < 3) && res.name === null && BracketHelper.canBeStartOfSequence(res.endToken.next, false, false)) {
            let nam = NameToken.tryParse(res.endToken.next, ty, lev + 1, false);
            if (nam !== null) {
                res.name = nam.name;
                res.endToken = nam.endToken;
                res.isDoubt = false;
            }
        }
        if (res.pref !== null && res.name === null && res.number === null) {
            let nam = NameToken.tryParse(res.endToken.next, ty, lev + 1, false);
            if (nam !== null && nam.name !== null && nam.pref === null) {
                res.name = nam.name;
                res.number = nam.number;
                res.endToken = nam.endToken;
            }
        }
        res.m_lev = lev;
        res.m_typ = ty;
        if (res.whitespacesAfterCount < 3) {
            let nn = NameToken.M_ONTO.tryParse(res.endToken.next, TerminParseAttr.NO);
            if (nn !== null) {
                res.endToken = nn.endToken;
                res.name = (res.name + " " + MiscHelper.getTextValueOfMetaToken(nn, GetTextAttr.NO));
            }
        }
        if (res.name !== null && res.beginToken === res.endToken) {
            let end = MiscLocationHelper.checkNameLong(res);
            if (end !== null) {
                if (OrgTypToken.tryParse(res.endToken.next, false, null) === null) {
                    res.endToken = end;
                    res.name = (res.name + " " + MiscHelper.getTextValue(res.beginToken.next, end, GetTextAttr.NO));
                }
            }
        }
        res.tryAttachNumber();
        return res;
    }
    
    static checkInitial(t) {
        if (!(t instanceof TextToken) || t.lengthChar > 2 || !t.chars.isLetter) 
            return null;
        let term = t.term;
        let t1 = t.next;
        if (t1 !== null && ((t1.isCharOf(".,") || t1.isHiphen))) 
            t1 = t1.next;
        else if (t.chars.isAllLower) 
            return null;
        if (t1 === null) 
            return null;
        if (NameToken.checkInitialAndSurname(term, t1)) 
            return t1;
        return null;
    }
    
    static checkInitialBack(t) {
        if (!(t instanceof TextToken) || t.whitespacesBeforeCount > 2) 
            return false;
        if (t.lengthChar > 2 || !t.chars.isLetter) 
            return false;
        if (t.next !== null && t.next.isChar('.')) {
        }
        else if (!t.chars.isAllUpper) 
            return false;
        return NameToken.checkInitialAndSurname(t.term, t.previous);
    }
    
    static checkInitialAndSurname(ini, sur) {
        if (sur === null || sur === null) 
            return false;
        if (ini === "А") {
            if ((((((((sur.isValue("МАТРОСОВ", null) || sur.isValue("ПУШКИН", null) || sur.isValue("УЛЬЯНОВ", null)) || sur.isValue("СУВОРОВ", null) || sur.isValue("АХМАТОВА", null)) || sur.isValue("КАДЫРОВ", null) || sur.isValue("АБУБАКАРОВ", null)) || sur.isValue("АЛИША", null) || sur.isValue("БЛОК", null)) || sur.isValue("ГАЙДАР", null) || sur.isValue("НЕВСКИЙ", null)) || sur.isValue("НЕВСКИЙ", null) || sur.isValue("СУЛТАН", null)) || sur.isValue("ТОЛСТОЙ", null) || sur.isValue("ШЕРИПОВ", null)) || sur.isValue("ГРИН", null)) 
                return true;
        }
        if (ini === "Б") {
            if (sur.isValue("ХМЕЛЬНИЦКИЙ", null)) 
                return true;
        }
        if (ini === "В" || ini === "B") {
            if (((((sur.isValue("ЛЕНИН", null) || sur.isValue("ТЕРЕШКОВА", null) || sur.isValue("УЛЬЯНОВ", null)) || sur.isValue("ВЫСОЦКИЙ", null) || sur.isValue("ПАСТЕРНАК", null)) || sur.isValue("ЧАПАЕВ", null) || sur.isValue("ЧКАЛОВ", null)) || sur.isValue("ЭМИРОВ", null) || sur.isValue("ШУКШИН", null)) || sur.isValue("МАЯКОВСКИЙ", null)) 
                return true;
        }
        if (ini === "Г") {
            if (((sur.isValue("ЖУКОВ", null) || sur.isValue("ИБРАГИМОВ", null) || sur.isValue("ТУКАЙ", null)) || sur.isValue("ЦАДАС", null) || sur.isValue("ТИТОВ", null)) || sur.isValue("УСПЕНСКИЙ", null) || sur.isValue("ГАМИДОВ", null)) 
                return true;
        }
        if (ini === "Д") {
            if (sur.isValue("УЛЬЯНОВ", null) || sur.isValue("ДОНСКОЙ", null)) 
                return true;
        }
        if (ini === "Е") {
            if (sur.isValue("ПУГАЧЕВ", null) || sur.isValue("ЭМИН", null) || sur.isValue("КОТИН", null)) 
                return true;
        }
        if (ini === "З") {
            if (sur.isValue("КОСМОДЕМЬЯНСКАЯ", null)) 
                return true;
        }
        if (ini === "И") {
            if (((sur.isValue("ФРАНКО", null) || sur.isValue("ШАМИЛЬ", null) || sur.isValue("АЙВАЗОВСКИЙ", null)) || sur.isValue("ТУРГЕНЕВ", null) || sur.isValue("АРМАНД", null)) || sur.isValue("КАЗАК", null)) 
                return true;
        }
        if (ini === "К") {
            if (sur.isValue("МАРКС", null) || sur.isValue("ЛИБКНЕХТ", null) || sur.isValue("ЦЕТКИН", null)) 
                return true;
        }
        if (ini === "Л") {
            if ((sur.isValue("ТОЛСТОЙ", null) || sur.isValue("ЧАЙКИНА", null) || sur.isValue("ШЕВЦОВА", null)) || sur.isValue("УКРАИНКА", null)) 
                return true;
        }
        if (ini === "М" || ini === "M") {
            if ((((((((((sur.isValue("ГОРЬКИЙ", null) || sur.isValue("АЛИЕВ", null) || sur.isValue("БУЛГАКОВ", null)) || sur.isValue("ДЖАЛИЛЬ", null) || sur.isValue("КАРИМ", null)) || sur.isValue("КУТУЗОВ", null) || sur.isValue("ЛЕРМОНТОВ", null)) || sur.isValue("ЦВЕТАЕВА", null) || sur.isValue("ГАДЖИЕВ", null)) || sur.isValue("ЯРАГСКИЙ", null) || sur.isValue("ГАФУРИ", null)) || sur.isValue("РАСКОВА", null) || sur.isValue("УЛЬЯНОВА", null)) || sur.isValue("ЛОМОНОСОВА", null) || sur.isValue("ФРУНЗЕ", null)) || sur.isValue("ШОЛОХОВА", null) || sur.isValue("ТОРЕЗ", null)) || sur.isValue("ЖУКОВ", null) || sur.isValue("РОКОССОВСКИЙ", null)) || sur.isValue("ВАСИЛЕВСКИЙ", null) || sur.isValue("ТИМОШЕНКО", null)) 
                return true;
        }
        if (ini === "Н") {
            if ((sur.isValue("ГОГОЛЬ", null) || sur.isValue("КРУПСКАЯ", null) || sur.isValue("ОСТРОВСКИЙ", null)) || sur.isValue("САМУРСКИЙ", null)) 
                return true;
        }
        if (ini === "О") {
            if (sur.isValue("КОШЕВОЙ", null) || sur.isValue("ДУНДИЧ", null) || sur.isValue("ШМИДТ", null)) 
                return true;
        }
        if (ini === "П") {
            if (sur instanceof TextToken) {
                if (sur.term === "САВЕЛЬЕВОЙ") 
                    return true;
            }
            if ((sur.isValue("МОРОЗОВ", null) || sur.isValue("КОРЧАГИН", null) || sur.isValue("ОСИПЕНКО", null)) || sur.isValue("ЛУМУМБА", null) || sur.isValue("ГАМЗАТОВ", null)) 
                return true;
        }
        if (ini === "Р") {
            if (sur.isValue("ЛЮКСЕМБУРГ", null) || sur.isValue("КАДЫРОВ", null) || sur.isValue("ЗОРГЕ", null)) 
                return true;
        }
        if ((ini === "СТ" || ini === "CT" || ini === "С") || ini === "C") {
            if (((((sur.isValue("РАЗИН", null) || sur.isValue("ХАЛТУРИН", null) || sur.isValue("ЕСЕНИН", null)) || sur.isValue("ЛАЗО", null) || sur.isValue("КИРОВ", null)) || sur.isValue("ОРДЖОНИКИДЗЕ", null) || sur.isValue("ПЕТРОВСКАЯ", null)) || sur.isValue("ЮЛАЕВ", null) || sur.isValue("РАДОНЕЖСКИЙ", null)) || sur.isValue("ПЕТРОВСКАЯ", null) || sur.isValue("КОВАЛЕВСКАЯ", null)) 
                return true;
        }
        if (ini === "Т") {
            if (sur.isValue("ШЕВЧЕНКО", null) || sur.isValue("ХАХЛЫНОВА", null) || sur.isValue("ФРУНЗЕ", null)) 
                return true;
        }
        if (ini === "У") {
            if (sur.isValue("ГРОМОВА", null) || sur.isValue("АЛИЕВ", null) || sur.isValue("БУЙНАКСКИЙ", null)) 
                return true;
        }
        if (ini === "Х" || ini === "X") {
            if (sur.isValue("АХМЕТОВ", null) || sur.isValue("ТАКТАШ", null) || sur.isValue("ДАВЛЕТШИНА", null)) 
                return true;
        }
        if (ini === "Ч") {
            if (sur.isValue("АЙТМАТОВ", null)) 
                return true;
        }
        if (ini === "Ш") {
            if (sur.isValue("УСМАНОВ", null) || sur.isValue("БАБИЧ", null) || sur.isValue("РУСТАВЕЛИ", null)) 
                return true;
        }
        if (ini === "Ю") {
            if (sur.isValue("ГАГАРИН", null) || sur.isValue("АКАЕВ", null) || sur.isValue("ФУЧИК", null)) 
                return true;
        }
        return false;
    }
    
    tryAttachNumber() {
        if (this.whitespacesAfterCount > 1) 
            return;
        if (this.number === null && this.endToken.next !== null && this.m_lev === 0) {
            let tt = this.endToken.next;
            let _pref = false;
            if (tt.isValue("БРИГАДА", null) || tt.isValue("ОТДЕЛЕНИЕ", null) || tt.isValue("ОЧЕРЕДЬ", null)) 
                tt = tt.next;
            else if (tt.isValue("ОТД", null)) {
                tt = tt.next;
                if (tt !== null && tt.isChar('.')) 
                    tt = tt.next;
            }
            let nam2 = NameToken.tryParse(tt, this.m_typ, this.m_lev + 1, false);
            if ((nam2 !== null && nam2.number !== null && nam2.name === null) && nam2.pref === null) {
                if (tt === this.endToken.next && StreetItemToken.checkKeyword(nam2.endToken.next)) {
                }
                else {
                    this.number = nam2.number;
                    this.endToken = nam2.endToken;
                }
            }
            else if (nam2 !== null && nam2.isEponym) {
                this.endToken = nam2.endToken;
                if (this.name === null) 
                    this.name = nam2.name;
                else 
                    this.name = (this.name + " " + nam2.name);
                if (nam2.number !== null) 
                    this.number = nam2.number;
            }
        }
        if ((this.m_typ === GeoTokenType.ORG && (this.endToken instanceof NumberToken) && this.number === this.endToken.value) && !this.isWhitespaceAfter) {
            let tmp = new StringBuilder(this.number);
            let delim = null;
            for (let tt = this.endToken.next; tt !== null; tt = tt.next) {
                if (tt.isWhitespaceBefore) 
                    break;
                if (tt.isCharOf(",.") || tt.isTableControlChar) 
                    break;
                if (tt.isCharOf("\\/")) {
                    delim = "/";
                    continue;
                }
                else if (tt.isHiphen) {
                    delim = "-";
                    continue;
                }
                if ((tt instanceof NumberToken) && tt.typ === NumberSpellingType.DIGIT) {
                    if (delim !== null) 
                        tmp.append(delim);
                    delim = null;
                    tmp.append(tt.value);
                    this.endToken = tt;
                    continue;
                }
                if ((tt instanceof TextToken) && tt.lengthChar === 1 && tt.chars.isLetter) {
                    if (delim !== null && Utils.isLetter(tmp.charAt(tmp.length - 1))) 
                        tmp.append(delim);
                    delim = null;
                    tmp.append(tt.term);
                    this.endToken = tt;
                    continue;
                }
                break;
            }
            this.number = tmp.toString();
        }
        if ((this.m_typ === GeoTokenType.ORG && (this.endToken instanceof NumberToken) && this.endToken.next !== null) && this.number === this.endToken.value && (this.whitespacesAfterCount < 3)) {
            let t1 = this.endToken.next;
            if (t1.isValue("БРИГАДА", null) || t1.isValue("ОЧЕРЕДЬ", null) || t1.isValue("ОТДЕЛЕНИЕ", null)) {
                if (t1.next instanceof NumberToken) 
                    return;
                if (MiscHelper.checkNumberPrefix(t1.next) !== null) 
                    return;
                this.endToken = t1;
            }
        }
        if (this.number !== null && (this.endToken instanceof NumberToken)) {
            let tt = this.endToken.next;
            if (((tt instanceof TextToken) && tt.chars.isLetter && tt.lengthChar === 1) && (tt.whitespacesBeforeCount < 3)) {
                let ok = false;
                if (!tt.isWhitespaceBefore) 
                    ok = true;
                else if (tt.isNewlineAfter) 
                    ok = true;
                else if (tt.next.isComma) 
                    ok = true;
                if (ok) {
                    let ch = tt.term[0];
                    let ch1 = LanguageHelper.getCyrForLat(ch);
                    if ((ch1.charCodeAt(0)) !== 0) 
                        ch = ch1;
                    this.number = (this.number + ch);
                    this.endToken = tt;
                }
            }
        }
    }
    
    static initialize() {
        NameToken.M_ONTO = new TerminCollection();
        let t = Termin._new1262("МИНИСТЕРСТВО ОБОРОНЫ", "МО");
        NameToken.M_ONTO.add(t);
        for (const s of NameToken.standardNames) {
            let pp = Utils.splitString(s, ';', false);
            t = Termin._new1210(pp[0], true);
            for (let kk = 1; kk < pp.length; kk++) {
                if (pp[kk].indexOf('.') > 0) 
                    t.addAbridge(Utils.replaceString(pp[kk], '.', ' '));
                else if (t.acronym === null && (pp[kk].length < 4)) 
                    t.acronym = pp[kk];
                else 
                    t.addVariant(pp[kk], false);
            }
            NameToken.M_ONTO.add(t);
        }
        t = new Termin("ПАРТСЪЕЗДА");
        t.addAbridge("П/СЪЕЗДА");
        t.addVariant("ПАРТИЙНОГО СЪЕЗДА", false);
        t.addAbridge("ПАРТ.СЪЕЗДА");
        NameToken.M_ONTO.add(t);
    }
    
    static _new1244(_arg1, _arg2, _arg3) {
        let res = new NameToken(_arg1, _arg2);
        res.isDoubt = _arg3;
        return res;
    }
    
    static _new1245(_arg1, _arg2, _arg3) {
        let res = new NameToken(_arg1, _arg2);
        res.number = _arg3;
        return res;
    }
    
    static _new1246(_arg1, _arg2, _arg3) {
        let res = new NameToken(_arg1, _arg2);
        res.pref = _arg3;
        return res;
    }
    
    static _new1250(_arg1, _arg2, _arg3, _arg4) {
        let res = new NameToken(_arg1, _arg2);
        res.number = _arg3;
        res.isDoubt = _arg4;
        return res;
    }
    
    static _new1252(_arg1, _arg2, _arg3) {
        let res = new NameToken(_arg1, _arg2);
        res.name = _arg3;
        return res;
    }
    
    static _new1253(_arg1, _arg2, _arg3, _arg4) {
        let res = new NameToken(_arg1, _arg2);
        res.isDoubt = _arg3;
        res.name = _arg4;
        return res;
    }
    
    static _new1260(_arg1, _arg2, _arg3, _arg4) {
        let res = new NameToken(_arg1, _arg2);
        res.morph = _arg3;
        res.name = _arg4;
        return res;
    }
    
    static _new1261(_arg1, _arg2, _arg3, _arg4) {
        let res = new NameToken(_arg1, _arg2);
        res.name = _arg3;
        res.morph = _arg4;
        return res;
    }
    
    static static_constructor() {
        NameToken.M_ONTO = null;
        NameToken.standardNames = ["ЭНГЕЛЬСА;ФРИДРИХА ЭНГЕЛЬСА;ФРИД.ЭНГЕЛЬСА;ФР.ЭНГЕЛЬСА;Ф.ЭНГЕЛЬСА", "МАРКСА;КАРЛА МАРКСА;К.МАРКСА", "ЛИБКНЕХТА;КАРЛА ЛИБКНЕХТА;К.ЛИБКНЕХТА", "ЛЮКСЕМБУРГ;РОЗЫ ЛЮКСЕМБУРГ;Р.ЛЮКСЕМБУРГ", "УЧАСТНИКОВ ВОВ;УЧАСТНИКОВ ВЕЛИКОЙ ОТЕЧЕСТВЕННОЙ ВОЙНЫ", "ТРУД И ОТДЫХ", "СЪЕЗДА КПСС;ПАРТСЪЕЗДА КПСС", "ПОБЕДЫ;ВЕЛИКОЙ ПОБЕДЫ;ВЕЛ.ПОБЕДЫ;В.ПОБЕДЫ", "КРАСНОЙ АРМИИ;КР.АРМИИ", "СОВЕТСКОЙ АРМИИ;СОВ.АРМИИ;СА", "СОВЕТСКОЙ ВЛАСТИ;СОВ.ВЛАСТИ", "СА И ВМФ;СОВЕТСКОЙ АРМИИ И ВОЕННО МОРСКОГО ФЛОТА", "ВОЕННО МОРСКОЙ ФЛОТ;ВМФ", "МОЛОДАЯ ГВАРДИЯ", "ЗАЩИТНИКИ БЕЛОГО ДОМА", "ЗАРЯ ВОСТОКА", "ЗАРЯ КОММУНИЗМА", "ДРУЖБЫ НАРОДОВ", "ВЕТЕРАН ВС;ВЕТЕРАН ВООРУЖЕННЫХ СИЛ", "ВЕТЕРАН МО;ВЕТЕРАН МИНИСТЕРСТВА ОБОРОНЫ", "ГОРКИ ЛЕНИНСКИЕ", "ГОРОДОК ПИСАТЕЛЕЙ ПЕРЕДЕЛКИНО", "СВЕТЛЫЙ ПУТЬ ЛЕНИНА", "ЗАВЕТЫ ИЛЬИЧА", "СЕРП И МОЛОТ", "СОЦТРУДА;СОЦ.ТРУДА;СОЦИАЛИСТИЧЕСКОГО ТРУДА", "ПАРИЖСКОЙ КОММУНЫ;П.КОММУНЫ;ПАР.КОММУНЫ;ПАРИЖ.КОММУНЫ", "АЛМА-АТИНСКАЯ;А.АТИНСКАЯ;АЛМАТИНСКАЯ", "КИМ ИР СЕНА;КИМ ИРСЕНА", "ХО ШИ МИНА;ХОШИМИНА;ХО ШИМИНА", "ДРУЖБЫ НАРОДОВ;ДР.НАРОДОВ;ДРУЖ.НАРОДОВ", "КИРИЛЛА И МЕФОДИЯ;КИРИЛА И МЕФОДИЯ", "ПАМЯТИ И СЛАВЫ"];
    }
}


NameToken.static_constructor();

module.exports = NameToken