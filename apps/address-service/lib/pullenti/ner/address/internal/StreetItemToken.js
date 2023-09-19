/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const GeoTokenData = require("./../../geo/internal/GeoTokenData");
const ReferentToken = require("./../../ReferentToken");
const StreetKind = require("./../StreetKind");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const CityItemTokenItemType = require("./../../geo/internal/CityItemTokenItemType");
const MorphGender = require("./../../../morph/MorphGender");
const MorphLang = require("./../../../morph/MorphLang");
const Condition = require("./../../geo/internal/Condition");
const AddressReferent = require("./../AddressReferent");
const MorphClass = require("./../../../morph/MorphClass");
const MorphCase = require("./../../../morph/MorphCase");
const StreetReferent = require("./../StreetReferent");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const MorphNumber = require("./../../../morph/MorphNumber");
const NumberExType = require("./../../core/NumberExType");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const StreetItemType = require("./StreetItemType");
const AddressDetailType = require("./../AddressDetailType");
const AddressItemType = require("./AddressItemType");
const Token = require("./../../Token");
const Referent = require("./../../Referent");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const MorphologyService = require("./../../../morph/MorphologyService");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const Termin = require("./../../core/Termin");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumberHelper = require("./../../core/NumberHelper");
const TextToken = require("./../../TextToken");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const GeoAnalyzerData = require("./../../geo/internal/GeoAnalyzerData");
const NumberSpellingType = require("./../../NumberSpellingType");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const DateReferent = require("./../../date/DateReferent");
const TerminCollection = require("./../../core/TerminCollection");
const GeoReferent = require("./../../geo/GeoReferent");
const GeoTokenType = require("./../../geo/internal/GeoTokenType");
const BracketHelper = require("./../../core/BracketHelper");

class StreetItemToken extends MetaToken {
    
    static tryParseList(t, maxCount = 10, ad = null) {
        const GeoAnalyzer = require("./../../geo/GeoAnalyzer");
        if (t === null) 
            return null;
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (ad.sLevel > 2) 
            return null;
        ad.sLevel++;
        let res = StreetItemToken._tryParseList(t, maxCount, ad);
        ad.sLevel--;
        return res;
    }
    
    static _tryParseList(t, maxCount, ad) {
        const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
        const NumToken = require("./../../geo/internal/NumToken");
        const AddressItemToken = require("./AddressItemToken");
        const CityItemToken = require("./../../geo/internal/CityItemToken");
        const StreetDefineHelper = require("./StreetDefineHelper");
        let res = null;
        let sit = StreetItemToken.tryParse(t, null, false, ad);
        if (sit !== null) {
            res = new Array();
            res.push(sit);
            t = sit.endToken.next;
        }
        else {
            res = StreetItemToken.tryParseSpec(t, null);
            if (res === null) 
                return null;
            sit = res[res.length - 1];
            t = sit.endToken.next;
            let sit2 = StreetItemToken.tryParse(t, null, false, null);
            if (sit2 !== null && sit2.typ === StreetItemType.NOUN) {
            }
            else if (AddressItemToken.checkHouseAfter(t, false, true)) {
            }
            else 
                return null;
        }
        for (; t !== null; t = (t === null ? null : t.next)) {
            if (maxCount > 0 && res.length >= maxCount) 
                break;
            if (t.isNewlineBefore) {
                if (t.newlinesBeforeCount > 1) 
                    break;
                if (((t.whitespacesAfterCount < 15) && sit !== null && sit.typ === StreetItemType.NOUN) && t.chars.isCapitalUpper) {
                }
                else {
                    let ok = false;
                    if (res.length === 1 && res[0].typ === StreetItemType.NAME) {
                        let sit1 = StreetItemToken.tryParse(sit.endToken.next, sit, false, ad);
                        if (sit1 !== null && sit1.typ === StreetItemType.NOUN) {
                            let sit2 = StreetItemToken.tryParse(sit1.endToken.next, sit1, false, ad);
                            if (sit2 === null) 
                                ok = true;
                        }
                    }
                    if (!ok) 
                        break;
                }
            }
            if (t.isHiphen && sit !== null && ((sit.typ === StreetItemType.NAME || sit.typ === StreetItemType.STDNAME || (sit.typ === StreetItemType.STDADJECTIVE)))) {
                let sit1 = StreetItemToken.tryParse(t.next, sit, false, ad);
                if (sit1 === null) {
                    let num = NumberHelper.tryParseRoman(t.next);
                    if (num !== null) {
                        sit = StreetItemToken._new464(t, num.endToken, StreetItemType.NUMBER, num.value, true);
                        res.push(sit);
                        t = sit.endToken;
                        continue;
                    }
                    break;
                }
                if (sit1.typ === StreetItemType.NUMBER) {
                    let tt = sit1.endToken.next;
                    if (tt !== null && tt.isComma) 
                        tt = tt.next;
                    let ok = false;
                    let ait = AddressItemToken.tryParsePureItem(tt, null, null);
                    if (ait !== null) {
                        if (ait.typ === AddressItemType.HOUSE) 
                            ok = true;
                    }
                    if (!ok) {
                        if (res.length === 2 && res[0].typ === StreetItemType.NOUN) {
                            if (res[0].termin.canonicText === "МИКРОРАЙОН") 
                                ok = true;
                        }
                    }
                    if (!ok && t.isHiphen) 
                        ok = true;
                    if (ok) {
                        sit = sit1;
                        res.push(sit);
                        t = sit.endToken;
                        sit.numberHasPrefix = true;
                        continue;
                    }
                }
                if (sit1.typ !== StreetItemType.NAME && sit1.typ !== StreetItemType.NAME) {
                    if (sit1.typ === StreetItemType.NOUN && sit1.nounCanBeName) {
                    }
                    else 
                        break;
                }
                if (t.isWhitespaceBefore && t.isWhitespaceAfter) 
                    break;
                if (res[0].beginToken.previous !== null) {
                    let aaa = AddressItemToken.tryParsePureItem(res[0].beginToken.previous, null, null);
                    if (aaa !== null && aaa.typ === AddressItemType.DETAIL && aaa.detailType === AddressDetailType.CROSS) 
                        break;
                }
                sit = sit1;
                res.push(sit);
                t = sit.endToken;
                continue;
            }
            else if (t.isHiphen && sit !== null && sit.typ === StreetItemType.NUMBER) {
                let sit1 = StreetItemToken.tryParse(t.next, null, false, ad);
                if (sit1 !== null && (((sit1.typ === StreetItemType.STDADJECTIVE || sit1.typ === StreetItemType.STDNAME || sit1.typ === StreetItemType.NAME) || sit1.typ === StreetItemType.NOUN))) {
                    sit.numberHasPrefix = true;
                    sit = sit1;
                    res.push(sit);
                    t = sit.endToken;
                    continue;
                }
            }
            if (t.isChar('.') && sit !== null && sit.typ === StreetItemType.NOUN) {
                if (t.whitespacesAfterCount > 1) 
                    break;
                sit = StreetItemToken.tryParse(t.next, null, false, ad);
                if (sit === null) 
                    break;
                if (sit.typ === StreetItemType.NUMBER || sit.typ === StreetItemType.STDADJECTIVE) {
                    let sit1 = StreetItemToken.tryParse(sit.endToken.next, null, false, ad);
                    if (sit1 !== null && ((sit1.typ === StreetItemType.STDADJECTIVE || sit1.typ === StreetItemType.STDNAME || sit1.typ === StreetItemType.NAME))) {
                    }
                    else if (!MiscLocationHelper.isUserParamAddress(sit)) 
                        break;
                    else {
                        let ai = AddressItemToken.tryParsePureItem(t.next, null, null);
                        if (ai !== null && ai.typ !== AddressItemType.NUMBER) 
                            break;
                    }
                }
                else if (sit.typ !== StreetItemType.NAME && sit.typ !== StreetItemType.STDNAME && sit.typ !== StreetItemType.AGE) 
                    break;
                if (t.previous.getMorphClassInDictionary().isNoun) {
                    if (!sit.isInDictionary) {
                        let tt = sit.endToken.next;
                        let hasHouse = false;
                        for (; tt !== null; tt = tt.next) {
                            if (tt.isNewlineBefore) 
                                break;
                            if (tt.isComma) 
                                continue;
                            let ai = AddressItemToken.tryParsePureItem(tt, null, null);
                            if (ai !== null && ((ai.typ === AddressItemType.HOUSE || ai.typ === AddressItemType.BUILDING || ai.typ === AddressItemType.CORPUS))) {
                                hasHouse = true;
                                break;
                            }
                            if (tt instanceof NumberToken) {
                                hasHouse = true;
                                break;
                            }
                            let vv = StreetItemToken.tryParse(tt, null, false, ad);
                            if (vv === null || vv.typ === StreetItemType.NOUN) 
                                break;
                            tt = vv.endToken;
                        }
                        if (!hasHouse) 
                            break;
                    }
                    if (t.previous.previous !== null) {
                        let npt11 = MiscLocationHelper.tryParseNpt(t.previous.previous);
                        if (npt11 !== null && npt11.endToken === t.previous) 
                            break;
                    }
                }
                res.push(sit);
            }
            else {
                sit = StreetItemToken.tryParse(t, res[res.length - 1], false, ad);
                if (sit === null) {
                    let spli = StreetItemToken.tryParseSpec(t, res[res.length - 1]);
                    if (spli !== null && spli.length > 0) {
                        res.splice(res.length, 0, ...spli);
                        t = spli[spli.length - 1].endToken;
                        continue;
                    }
                    if (((t instanceof TextToken) && ((res.length === 2 || res.length === 3)) && res[0].typ === StreetItemType.NOUN) && res[1].typ === StreetItemType.NUMBER && (((t.term === "ГОДА" || t.term === "МАЯ" || t.term === "МАРТА") || t.term === "СЪЕЗДА"))) {
                        res.push((sit = StreetItemToken._new455(t, t, StreetItemType.STDNAME, t.term)));
                        continue;
                    }
                    sit = res[res.length - 1];
                    if (t === null) 
                        break;
                    if (sit.typ === StreetItemType.NOUN && ((sit.termin.canonicText === "МИКРОРАЙОН" || sit.termin.canonicText === "МІКРОРАЙОН")) && (t.whitespacesBeforeCount < 2)) {
                        let tt1 = t;
                        if (tt1.isHiphen && tt1.next !== null) 
                            tt1 = tt1.next;
                        if (BracketHelper.isBracket(tt1, true) && tt1.next !== null) 
                            tt1 = tt1.next;
                        let tt2 = tt1.next;
                        let br = false;
                        if (BracketHelper.isBracket(tt2, true)) {
                            tt2 = tt2.next;
                            br = true;
                        }
                        if (((tt1 instanceof TextToken) && tt1.lengthChar === 1 && tt1.chars.isLetter) && ((AddressItemToken.checkHouseAfter(tt2, false, true) || tt2 === null))) {
                            sit = StreetItemToken._new455(t, (br ? tt1.next : tt1), StreetItemType.NAME, tt1.term);
                            let ch1 = AddressItemToken.correctChar(sit.value[0]);
                            if ((ch1.charCodeAt(0)) !== 0 && ch1 !== sit.value[0]) 
                                sit.altValue = (ch1);
                            res.push(sit);
                            break;
                        }
                    }
                    if (t.isComma && (((sit.typ === StreetItemType.NAME || sit.typ === StreetItemType.STDNAME || sit.typ === StreetItemType.STDPARTOFNAME) || sit.typ === StreetItemType.STDADJECTIVE || ((sit.typ === StreetItemType.NUMBER && res.length > 1 && (((res[res.length - 2].typ === StreetItemType.NAME || res[res.length - 2].typ === StreetItemType.STDNAME || res[res.length - 2].typ === StreetItemType.STDADJECTIVE) || res[res.length - 2].typ === StreetItemType.STDPARTOFNAME))))))) {
                        let sit2 = StreetItemToken.tryParse(t.next, null, false, ad);
                        if (sit2 !== null && sit2.typ === StreetItemType.NOUN) {
                            let ttt = sit2.endToken.next;
                            if (ttt !== null && ttt.isComma) 
                                ttt = ttt.next;
                            let add = AddressItemToken.tryParsePureItem(ttt, null, null);
                            if (add !== null && ((add.typ === AddressItemType.HOUSE || add.typ === AddressItemType.CORPUS || add.typ === AddressItemType.BUILDING))) {
                                res.push(sit2);
                                t = sit2.endToken;
                                continue;
                            }
                        }
                    }
                    else if (t.isComma && sit.typ === StreetItemType.NOUN && sit.termin.canonicText.includes("КВАРТАЛ")) {
                        let num = NumToken.tryParse(t.next, GeoTokenType.STREET);
                        if (num !== null && num.isCadasterNumber) 
                            continue;
                    }
                    if (BracketHelper.canBeStartOfSequence(t, true, false)) {
                        let sit1 = res[res.length - 1];
                        if (sit1.typ === StreetItemType.NOUN && ((sit1.nounIsDoubtCoef === 0 || (((t.next instanceof TextToken) && !t.next.chars.isAllLower))))) {
                            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                            if (br !== null && (br.lengthChar < 50)) {
                                let sit2 = StreetItemToken.tryParse(t.next, null, false, ad);
                                if (sit2 !== null && sit2.endToken.next === br.endToken) {
                                    if (sit2.value === null && sit2.typ === StreetItemType.NAME) 
                                        sit2.value = MiscHelper.getTextValue(sit2.beginToken, sit2.endToken, GetTextAttr.NO);
                                    sit2.beginToken = t;
                                    sit2.isInBrackets = true;
                                    t = sit2.endToken = br.endToken;
                                    res.push(sit2);
                                    continue;
                                }
                                res.push(StreetItemToken._new467(t, br.endToken, StreetItemType.NAME, MiscHelper.getTextValue(t, br.endToken, GetTextAttr.NO), true));
                                t = br.endToken;
                                continue;
                            }
                        }
                    }
                    if (t.isHiphen && (t.next instanceof NumberToken) && t.next.intValue !== null) {
                        sit = res[res.length - 1];
                        if (sit.typ === StreetItemType.NOUN && (((sit.termin.canonicText === "КВАРТАЛ" || sit.termin.canonicText === "МИКРОРАЙОН" || sit.termin.canonicText === "ГОРОДОК") || sit.termin.canonicText === "МІКРОРАЙОН"))) {
                            sit = StreetItemToken._new468(t, t.next, StreetItemType.NUMBER, t.next.value, t.next.typ, true);
                            res.push(sit);
                            t = t.next;
                            continue;
                        }
                    }
                    if ((((t.isChar(':') || t.isHiphen)) && res.length === 1 && res[0].typ === StreetItemType.NOUN) && (t.whitespacesAfterCount < 3)) 
                        continue;
                    if ((t.isComma && res.length === 1 && res[0].typ === StreetItemType.NOUN) && MiscLocationHelper.isUserParamAddress(t)) {
                        sit = StreetItemToken.tryParse(t.next, null, false, null);
                        if (sit !== null && ((sit.typ === StreetItemType.NAME || sit.typ === StreetItemType.STDNAME || sit.typ === StreetItemType.STDADJECTIVE))) {
                            res.push(sit);
                            t = sit.endToken;
                            continue;
                        }
                    }
                    break;
                }
                res.push(sit);
                if (sit.typ === StreetItemType.NAME) {
                    let cou = 0;
                    let jj = 0;
                    for (jj = res.length - 1; jj >= 0; jj--) {
                        if (res[jj].typ === StreetItemType.NAME) 
                            cou++;
                        else 
                            break;
                    }
                    if (cou > 4) {
                        if (jj < 0) 
                            return null;
                        res.splice(jj, res.length - jj);
                        break;
                    }
                    if (res.length > 1 && res[0].typ === StreetItemType.NOUN && res[0].isRoad) {
                        let tt = sit.endToken.next;
                        if (tt !== null) {
                            if (tt.isValue("Ш", null) || tt.isValue("ШОССЕ", null) || tt.isValue("ШОС", null)) {
                                sit = sit.clone();
                                res[res.length - 1] = sit;
                                sit.endToken = tt;
                                if (tt.next !== null && tt.next.isChar('.') && tt.lengthChar <= 3) 
                                    sit.endToken = sit.endToken.next;
                            }
                        }
                    }
                }
            }
            t = sit.endToken;
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === StreetItemType.NAME && ((res[i + 1].altTyp === StreetItemType.STDPARTOFNAME || res[i + 1].typ === StreetItemType.STDPARTOFNAME))) {
                let r = res[i].clone();
                if (r.value === null) 
                    r.value = MiscHelper.getTextValueOfMetaToken(r, GetTextAttr.NO);
                r.misc = (res[i + 1].value != null ? res[i + 1].value : MiscHelper.getTextValueOfMetaToken(res[i + 1], GetTextAttr.NO));
                r.endToken = res[i + 1].endToken;
                res[i] = r;
                res.splice(i + 1, 1);
            }
            else if (res[i + 1].typ === StreetItemType.NAME && ((res[i].altTyp === StreetItemType.STDPARTOFNAME || res[i].typ === StreetItemType.STDPARTOFNAME))) {
                let r = res[i + 1].clone();
                if (r.value === null) 
                    r.value = MiscHelper.getTextValueOfMetaToken(r, GetTextAttr.NO);
                r.misc = (res[i].value != null ? res[i].value : MiscHelper.getTextValueOfMetaToken(res[i], GetTextAttr.NO));
                r.beginToken = res[i].beginToken;
                res[i] = r;
                res.splice(i + 1, 1);
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === StreetItemType.NAME && res[i + 1].typ === StreetItemType.NAME && (res[i].whitespacesAfterCount < 3)) {
                let isProp = false;
                let isPers = false;
                if (res[i].beginToken.morph._class.isNoun) {
                    let rt = res[i].kit.processReferent("PERSON", res[i].beginToken, null);
                    if (rt !== null) {
                        if (rt.referent.typeName === "PERSONPROPERTY") 
                            isProp = true;
                        else if (rt.endToken === res[i + 1].endToken) 
                            isPers = true;
                    }
                }
                if ((i === 0 && ((!isProp && !isPers)) && ((i + 2) < res.length)) && res[i + 2].typ === StreetItemType.NOUN && !res[i].beginToken.morph._class.isAdjective) {
                    if (MiscLocationHelper.checkGeoObjectBefore(res[0].beginToken, false) && res[0].endToken.next === res[1].beginToken && (res[0].whitespacesAfterCount < 2)) {
                    }
                    else {
                        res.splice(i, 1);
                        i--;
                        continue;
                    }
                }
                if (res[i].morph._class.isAdjective && res[i + 1].morph._class.isAdjective && !isPers) {
                    if (res[i].endToken.next.isHiphen) {
                    }
                    else if (i === 1 && res[0].typ === StreetItemType.NOUN && res.length === 3) {
                    }
                    else if (i === 0 && res.length === 3 && res[2].typ === StreetItemType.NOUN) {
                    }
                    else 
                        continue;
                }
                if (res[i].chars.value !== res[i + 1].chars.value) {
                    let rt = res[0].kit.processReferent("ORGANIZATION", res[i + 1].beginToken, null);
                    if (rt !== null) {
                        res.splice(i + 1, res.length - i - 1);
                        continue;
                    }
                }
                let r = res[i].clone();
                if (r.value === null) 
                    r.value = MiscHelper.getTextValueOfMetaToken(res[i], GetTextAttr.NO);
                let tt1 = res[i + 1].endToken;
                let mc1 = res[i].beginToken.getMorphClassInDictionary();
                let mc2 = tt1.getMorphClassInDictionary();
                if ((tt1.isValue("БОР", null) || tt1.isValue("САД", null) || tt1.isValue("ПАРК", null)) || tt1.previous.isHiphen) 
                    r.value = MiscHelper.getTextValue(res[i].beginToken, res[i + 1].endToken, GetTextAttr.NO);
                else if (((mc1.isProperName && !mc2.isProperName)) || ((!mc1.isProperSurname && mc2.isProperSurname))) {
                    if (r.misc === null) 
                        r.misc = r.value;
                    r.value = (res[i + 1].value != null ? res[i + 1].value : MiscHelper.getTextValueOfMetaToken(res[i + 1], GetTextAttr.NO));
                }
                else if (((mc2.isProperName && !mc1.isProperName)) || ((!mc2.isProperSurname && mc1.isProperSurname))) {
                    if (r.misc === null) 
                        r.misc = MiscHelper.getTextValueOfMetaToken(res[i + 1], GetTextAttr.NO);
                }
                else 
                    r.value = MiscHelper.getTextValue(res[i].beginToken, res[i + 1].endToken, GetTextAttr.NO);
                if (r.value.includes("-")) 
                    r.value = Utils.replaceString(r.value, '-', ' ');
                r.ortoTerr = res[i + 1].ortoTerr;
                r.endToken = res[i + 1].endToken;
                r.existStreet = null;
                r.isInDictionary = res[i + 1].isInDictionary || res[i].isInDictionary;
                res[i] = r;
                res.splice(i + 1, 1);
                i--;
            }
            else if ((res[i].typ === StreetItemType.NOUN && res[i + 1].typ === StreetItemType.NOUN && res[i].termin === res[i + 1].termin) && (res[i].whitespacesAfterCount < 3)) {
                let r = res[i].clone();
                r.endToken = res[i + 1].endToken;
                res.splice(i + 1, 1);
                i--;
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === StreetItemType.STDADJECTIVE && res[i].endToken.isChar('.') && res[i + 1]._isSurname()) {
                let r = res[i + 1].clone();
                r.value = res[i + 1].beginToken.term;
                r.altValue = MiscHelper.getTextValue(res[i].beginToken, res[i + 1].endToken, GetTextAttr.NO);
                r.beginToken = res[i].beginToken;
                r.stdAdjVersion = res[i];
                res[i + 1] = r;
                res.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if ((res[i + 1].typ === StreetItemType.STDADJECTIVE && res[i + 1].endToken.isChar('.') && res[i + 1].beginToken.lengthChar === 1) && !res[i].beginToken.chars.isAllLower) {
                if (res[i]._isSurname()) {
                    if (i === (res.length - 2) || res[i + 2].typ !== StreetItemType.NOUN) {
                        let r = res[i].clone();
                        if (r.value === null) 
                            r.value = MiscHelper.getTextValueOfMetaToken(r, GetTextAttr.NO);
                        r.endToken = res[i + 1].endToken;
                        r.stdAdjVersion = res[i + 1];
                        res[i] = r;
                        res.splice(i + 1, 1);
                        break;
                    }
                }
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === StreetItemType.NAME || res[i].typ === StreetItemType.STDNAME || res[i].typ === StreetItemType.STDADJECTIVE) {
                if (res[i + 1].typ === StreetItemType.NOUN && !res[i + 1].isAbridge && res[i + 1].termin.canonicText !== "УЛИЦА") {
                    let res0 = Array.from(res);
                    res0.splice(0, i + 1);
                    let rtt = StreetDefineHelper.tryParseStreet(res0, false, false, false, null);
                    if (rtt !== null) 
                        continue;
                    let i0 = -1;
                    if (i === 1 && res[0].typ === StreetItemType.NOUN && res.length === 3) 
                        i0 = 0;
                    else if (i === 0 && res.length === 3 && res[2].typ === StreetItemType.NOUN) 
                        i0 = 2;
                    if (i0 < 0) 
                        continue;
                    if (res[i0].termin === res[i + 1].termin) 
                        continue;
                    let r = res[i].clone();
                    r.altValue = (res[i].value != null ? res[i].value : MiscHelper.getTextValue(res[i].beginToken, res[i].endToken, GetTextAttr.NO));
                    if (res[i].typ === StreetItemType.STDADJECTIVE) {
                        let adjs = MiscLocationHelper.getStdAdjFull(res[i].beginToken, res[i + 1].morph.gender, res[i + 1].morph.number, true);
                        if (adjs !== null && adjs.length > 0) 
                            r.altValue = adjs[0];
                    }
                    r.value = (r.altValue + " " + res[i + 1].termin.canonicText);
                    r.typ = StreetItemType.STDNAME;
                    r.endToken = res[i + 1].endToken;
                    res[i] = r;
                    let rr = res[i0].clone();
                    rr.altTermin = res[i + 1].termin;
                    res[i0] = rr;
                    res.splice(i + 1, 1);
                    i--;
                }
            }
        }
        if ((res.length >= 3 && res[0].typ === StreetItemType.NOUN && res[0].termin.canonicText === "КВАРТАЛ") && ((res[1].typ === StreetItemType.NAME || res[1].typ === StreetItemType.STDNAME)) && res[2].typ === StreetItemType.NOUN) {
            if (res.length === 3 || res[3].typ === StreetItemType.NUMBER) {
                let res0 = Array.from(res);
                res0.splice(0, 2);
                let rtt = StreetDefineHelper.tryParseStreet(res0, false, false, false, null);
                if (rtt === null || res0[0].chars.isCapitalUpper) {
                    let r = res[1].clone();
                    r.value = (MiscHelper.getTextValueOfMetaToken(res[1], GetTextAttr.NO) + " " + res[2].termin.canonicText);
                    r.endToken = res[2].endToken;
                    res[1] = r;
                    res.splice(2, 1);
                }
            }
        }
        if ((res.length >= 3 && res[0].typ === StreetItemType.NOUN && res[0].termin.canonicText === "КВАРТАЛ") && ((res[2].typ === StreetItemType.NAME || res[2].typ === StreetItemType.STDNAME)) && res[1].typ === StreetItemType.NOUN) {
            if (res.length === 3 || res[3].typ === StreetItemType.NUMBER) {
                let r = res[1].clone();
                r.value = (MiscHelper.getTextValueOfMetaToken(res[2], GetTextAttr.NO) + " " + res[1].termin.canonicText);
                r.endToken = res[2].endToken;
                r.typ = StreetItemType.NAME;
                res[1] = r;
                res.splice(2, 1);
            }
        }
        if ((res.length >= 3 && res[0].typ === StreetItemType.NUMBER && !res[0].isNumberKm) && res[1].typ === StreetItemType.NOUN) {
            if (!MiscLocationHelper.isUserParamAddress(res[0]) && res[2].typ !== StreetItemType.STDNAME && res[2].typ !== StreetItemType.FIX) {
                let nt = Utils.as(res[0].beginToken, NumberToken);
                if (nt !== null && nt.typ === NumberSpellingType.DIGIT && nt.morph._class.isUndefined) 
                    return null;
            }
        }
        let ii0 = -1;
        let ii1 = -1;
        if (res.length > 0 && res[0].typ === StreetItemType.NOUN && res[0].isRoad) {
            ii0 = (ii1 = 0);
            if (((ii0 + 1) < res.length) && res[ii0 + 1].typ === StreetItemType.NUMBER && res[ii0 + 1].isNumberKm) 
                ii0++;
        }
        else if ((res.length > 1 && res[0].typ === StreetItemType.NUMBER && res[0].isNumberKm) && res[1].typ === StreetItemType.NOUN && res[1].isRoad) 
            ii0 = (ii1 = 1);
        if (ii0 >= 0) {
            if (res.length === (ii0 + 1)) {
                let tt = res[ii0].endToken.next;
                let num = StreetItemToken._tryAttachRoadNum(tt);
                if (num !== null) {
                    res.push(num);
                    tt = num.endToken.next;
                    res[0].isAbridge = false;
                }
                if (tt !== null && (tt.getReferent() instanceof GeoReferent)) {
                    let g1 = Utils.as(tt.getReferent(), GeoReferent);
                    tt = tt.next;
                    if (tt !== null && tt.isHiphen) 
                        tt = tt.next;
                    let g2 = (tt === null ? null : Utils.as(tt.getReferent(), GeoReferent));
                    if (g2 !== null) {
                        if (g1.isCity && g2.isCity) {
                            let nam = StreetItemToken._new469(res[0].endToken.next, tt, StreetItemType.NAME);
                            nam.value = (g1.toStringEx(true, tt.kit.baseLanguage, 0) + " - " + g2.toStringEx(true, tt.kit.baseLanguage, 0)).toUpperCase();
                            nam.altValue = (g2.toStringEx(true, tt.kit.baseLanguage, 0) + " - " + g1.toStringEx(true, tt.kit.baseLanguage, 0)).toUpperCase();
                            res.push(nam);
                        }
                    }
                }
                else if (BracketHelper.isBracket(tt, false)) {
                    let br = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                    if (br !== null) {
                        let nam = StreetItemToken._new470(tt, br.endToken, StreetItemType.NAME, true);
                        nam.value = MiscHelper.getTextValue(tt.next, br.endToken, GetTextAttr.NO);
                        res.push(nam);
                    }
                }
            }
            else if ((res.length === (ii0 + 2) && res[ii0 + 1].typ === StreetItemType.NAME && res[ii0 + 1].endToken.next !== null) && res[ii0 + 1].endToken.next.isHiphen) {
                let tt = res[ii0 + 1].endToken.next.next;
                let g2 = (tt === null ? null : Utils.as(tt.getReferent(), GeoReferent));
                let te = null;
                let name2 = null;
                if (g2 === null && tt !== null) {
                    let rt = tt.kit.processReferent("GEO", tt, null);
                    if (rt !== null) {
                        te = rt.endToken;
                        name2 = rt.referent.toStringEx(true, te.kit.baseLanguage, 0);
                    }
                    else {
                        let cits2 = CityItemToken.tryParseList(tt, 2, null);
                        if (cits2 !== null) {
                            if (cits2.length === 1 && ((cits2[0].typ === CityItemTokenItemType.PROPERNAME || cits2[0].typ === CityItemTokenItemType.CITY))) {
                                if (cits2[0].ontoItem !== null) 
                                    name2 = cits2[0].ontoItem.canonicText;
                                else 
                                    name2 = cits2[0].value;
                                te = cits2[0].endToken;
                            }
                        }
                    }
                }
                else if (g2 !== null) {
                    te = tt;
                    name2 = g2.toStringEx(true, te.kit.baseLanguage, 0);
                }
                if (((g2 !== null && g2.isCity)) || ((g2 === null && name2 !== null))) {
                    let r = res[ii0 + 1].clone();
                    r.altValue = (name2 + " - " + ((res[ii0 + 1].value != null ? res[ii0 + 1].value : res[ii0 + 1].getSourceText()))).toUpperCase();
                    r.value = (((res[ii0 + 1].value != null ? res[ii0 + 1].value : res[ii0 + 1].getSourceText())) + " - " + name2).toUpperCase();
                    r.endToken = te;
                    res[ii0 + 1] = r;
                }
            }
            let nn = StreetItemToken._tryAttachRoadNum(res[res.length - 1].endToken.next);
            if (nn !== null) {
                res.push(nn);
                res[ii1].isAbridge = false;
            }
            if (res.length > (ii0 + 1) && res[ii0 + 1].typ === StreetItemType.NAME && res[ii1].termin.canonicText === "АВТОДОРОГА") {
                if (res[ii0 + 1].beginToken.isValue("ФЕДЕРАЛЬНЫЙ", null)) 
                    return null;
                let npt = MiscLocationHelper.tryParseNpt(res[ii0 + 1].beginToken);
                if (npt !== null && npt.adjectives.length > 0) {
                    if (npt.endToken.isValue("ЗНАЧЕНИЕ", null)) 
                        return null;
                }
            }
        }
        while (res.length > 1) {
            let it = res[res.length - 1];
            if (!it.isWhitespaceBefore) 
                break;
            let it0 = (res.length > 1 ? res[res.length - 2] : null);
            if (it.typ === StreetItemType.NUMBER && !it.numberHasPrefix && !it.isNumberKm) {
                if (it.beginToken instanceof NumberToken) {
                    if (res.length === 2 && res[0].typ === StreetItemType.NOUN) 
                        break;
                    if (!it.beginToken.morph._class.isAdjective || it.beginToken.morph._class.isNoun) {
                        if (AddressItemToken.checkHouseAfter(it.endToken.next, false, true)) 
                            it.numberHasPrefix = true;
                        else if (it0 !== null && it0.typ === StreetItemType.NOUN && (((it0.termin.canonicText === "МИКРОРАЙОН" || it0.termin.canonicText === "МІКРОРАЙОН" || it0.termin.canonicText === "КВАРТАЛ") || it0.termin.canonicText === "ГОРОДОК"))) {
                            let ait = AddressItemToken.tryParsePureItem(it.beginToken, null, null);
                            if (ait !== null && ait.typ === AddressItemType.NUMBER && ait.endChar > it.endChar) {
                                it.numberType = NumberSpellingType.UNDEFINED;
                                it.value = ait.value;
                                it.endToken = ait.endToken;
                                it.typ = StreetItemType.NAME;
                            }
                        }
                        else if (it0 !== null && it0.termin !== null && it0.termin.canonicText === "ПОЧТОВОЕ ОТДЕЛЕНИЕ") 
                            it.numberHasPrefix = true;
                        else if (it0 !== null && it0.beginToken.isValue("ЛИНИЯ", null)) 
                            it.numberHasPrefix = true;
                        else if (res.length === 2 && res[0].typ === StreetItemType.NOUN && (res[0].whitespacesAfterCount < 2)) {
                        }
                        else if (it.beginToken.morph._class.isAdjective && it.beginToken.typ === NumberSpellingType.WORDS && it.beginToken.chars.isCapitalUpper) 
                            it.numberHasPrefix = true;
                        else if (it.beginToken.previous.isHiphen) 
                            it.numberHasPrefix = true;
                        else {
                            res.splice(res.length - 1, 1);
                            continue;
                        }
                    }
                    else 
                        it.numberHasPrefix = true;
                }
            }
            break;
        }
        if (res.length === 0) 
            return null;
        for (let i = 0; i < res.length; i++) {
            if (res[i].nextItem !== null) 
                res.splice(i + 1, 0, res[i].nextItem);
        }
        for (let i = 0; i < res.length; i++) {
            if ((res[i].typ === StreetItemType.NOUN && res[i].chars.isCapitalUpper && (((res[i].termin.canonicText === "НАБЕРЕЖНАЯ" || res[i].termin.canonicText === "МИКРОРАЙОН" || res[i].termin.canonicText === "НАБЕРЕЖНА") || res[i].termin.canonicText === "МІКРОРАЙОН" || res[i].termin.canonicText === "ГОРОДОК"))) && res[i].beginToken.isValue(res[i].termin.canonicText, null)) {
                let ok = false;
                if (i > 0 && ((res[i - 1].typ === StreetItemType.NOUN || res[i - 1].typ === StreetItemType.STDADJECTIVE))) 
                    ok = true;
                else if (i > 1 && ((res[i - 1].typ === StreetItemType.STDADJECTIVE || res[i - 1].typ === StreetItemType.NUMBER)) && res[i - 2].typ === StreetItemType.NOUN) 
                    ok = true;
                if (ok) {
                    let r = res[i].clone();
                    r.typ = StreetItemType.NAME;
                    res[i] = r;
                }
            }
        }
        let last = res[res.length - 1];
        for (let kk = 0; kk < 2; kk++) {
            let ttt = last.endToken.next;
            if (((last.typ === StreetItemType.NAME && ttt !== null && ttt.lengthChar === 1) && ttt.chars.isAllUpper && (ttt.whitespacesBeforeCount < 2)) && ttt.next !== null && ttt.next.isChar('.')) {
                if (AddressItemToken.tryParsePureItem(ttt, null, null) !== null) 
                    break;
                last = last.clone();
                last.endToken = ttt.next;
                res[res.length - 1] = last;
            }
        }
        if (res.length > 1) {
            if (res[res.length - 1].org !== null) {
                if (res.length === 2 && res[0].typ === StreetItemType.NOUN) {
                }
                else 
                    res.splice(res.length - 1, 1);
            }
        }
        if (res.length === 0) 
            return null;
        return res;
    }
    
    static initialize() {
        const NameToken = require("./../../geo/internal/NameToken");
        if (StreetItemToken.m_Ontology !== null) 
            return;
        StreetItemToken.m_Ontology = new TerminCollection();
        StreetItemToken.m_OntologyEx = new TerminCollection();
        StreetItemToken.m_StdOntMisc = new TerminCollection();
        StreetItemToken.m_StdAdj = new TerminCollection();
        let t = null;
        t = Termin._new471("УЛИЦА", StreetItemType.NOUN, MorphGender.FEMINIE);
        t.addAbridge("УЛ.");
        t.addAbridge("УЛЮ");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new472("ВУЛИЦЯ", StreetItemType.NOUN, MorphLang.UA, MorphGender.FEMINIE);
        t.addAbridge("ВУЛ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("STREET", StreetItemType.NOUN);
        t.addAbridge("ST.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ПЛОЩАДЬ", StreetItemType.NOUN, 1, MorphGender.FEMINIE);
        t.addAbridge("ПЛ.");
        t.addAbridge("ПЛОЩ.");
        t.addAbridge("ПЛ-ДЬ");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("ПЛОЩА", StreetItemType.NOUN, MorphLang.UA, 1, MorphGender.FEMINIE);
        t.addAbridge("ПЛ.");
        t.addAbridge("ПЛОЩ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("МАЙДАН", StreetItemType.NOUN, 0, MorphGender.MASCULINE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("SQUARE", StreetItemType.NOUN);
        t.addAbridge("SQ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ПРОЕЗД", StreetItemType.NOUN, 1, MorphGender.MASCULINE);
        t.addAbridge("ПР.");
        t.addAbridge("П-Д");
        t.addAbridge("ПР-Д");
        t.addAbridge("ПР-ЗД");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("ПРОЕЗД", StreetItemType.NOUN, MorphLang.UA, 1, MorphGender.MASCULINE);
        t.addAbridge("ПР.");
        t.addAbridge("П-Д");
        t.addAbridge("ПР-Д");
        t.addAbridge("ПР-ЗД");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ЛИНИЯ", StreetItemType.NOUN, 2, MorphGender.FEMINIE);
        t.addAbridge("ЛИН.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("ЛІНІЯ", StreetItemType.NOUN, MorphLang.UA, 2, MorphGender.FEMINIE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("РЯД", StreetItemType.NOUN, 2, MorphGender.MASCULINE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ОЧЕРЕДЬ", StreetItemType.NOUN, 2, MorphGender.FEMINIE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ПАНЕЛЬ", StreetItemType.NOUN, 2, MorphGender.FEMINIE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("КУСТ", StreetItemType.NOUN, 2, MorphGender.MASCULINE);
        t.addVariant("КУСТ ГАЗОВЫХ СКВАЖИН", false);
        t.addVariant("КУСТОВАЯ ПЛОЩАДКА СКВАЖИН", false);
        t.addVariant("КУСТ СКВАЖИН", false);
        StreetItemToken.m_Ontology.add(t);
        StreetItemToken.m_Prospect = (t = Termin._new474("ПРОСПЕКТ", StreetItemType.NOUN, 0, MorphGender.MASCULINE));
        t.addAbridge("ПРОС.");
        t.addAbridge("ПРКТ");
        t.addAbridge("ПРОСП.");
        t.addAbridge("ПР-Т");
        t.addAbridge("ПР-КТ");
        t.addAbridge("П-Т");
        t.addAbridge("П-КТ");
        t.addAbridge("ПР Т");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ПЕРЕУЛОК", StreetItemType.NOUN, 0, MorphGender.MASCULINE);
        t.addAbridge("ПЕР.");
        t.addAbridge("ПЕР-К");
        t.addAbridge("П-К");
        t.addVariant("ПРЕУЛОК", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ПРОУЛОК", StreetItemType.NOUN, 0, MorphGender.MASCULINE);
        t.addAbridge("ПРОУЛ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("ПРОВУЛОК", StreetItemType.NOUN, MorphLang.UA, 0, MorphGender.MASCULINE);
        t.addAbridge("ПРОВ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new349("LANE", StreetItemType.NOUN, 0);
        t.addAbridge("LN.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ТУПИК", StreetItemType.NOUN, 1, MorphGender.MASCULINE);
        t.addAbridge("ТУП.");
        t.addAbridge("Т.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("БУЛЬВАР", StreetItemType.NOUN, 0, MorphGender.MASCULINE);
        t.addAbridge("БУЛЬВ.");
        t.addAbridge("БУЛ.");
        t.addAbridge("Б-Р");
        t.addAbridge("Б-РЕ");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new349("BOULEVARD", StreetItemType.NOUN, 0);
        t.addAbridge("BLVD");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new349("СКВЕР", StreetItemType.NOUN, 1);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("НАБЕРЕЖНАЯ", StreetItemType.NOUN, 0, MorphGender.FEMINIE);
        t.addAbridge("НАБ.");
        t.addAbridge("НАБЕР.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("НАБЕРЕЖНА", StreetItemType.NOUN, MorphLang.UA, 0, MorphGender.FEMINIE);
        t.addAbridge("НАБ.");
        t.addAbridge("НАБЕР.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("АЛЛЕЯ", StreetItemType.NOUN, 0, MorphGender.FEMINIE);
        t.addAbridge("АЛ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("АЛЕЯ", StreetItemType.NOUN, MorphLang.UA, 0, MorphGender.FEMINIE);
        t.addAbridge("АЛ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new349("ALLEY", StreetItemType.NOUN, 0);
        t.addAbridge("ALY.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("АВЕНЮ", StreetItemType.NOUN, 0, MorphGender.FEMINIE);
        t.addVariant("АВЕНЬЮ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ПРОСЕКА", StreetItemType.NOUN, 1, MorphGender.FEMINIE);
        t.addVariant("ПРОСЕК", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("ПРОСІКА", StreetItemType.NOUN, MorphLang.UA, 1, MorphGender.FEMINIE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ТРАКТ", StreetItemType.NOUN, 1, MorphGender.NEUTER);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ШОССЕ", StreetItemType.NOUN, 1, MorphGender.NEUTER);
        t.addAbridge("Ш.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("ШОСЕ", StreetItemType.NOUN, MorphLang.UA, 1, MorphGender.NEUTER);
        t.addAbridge("Ш.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new349("ROAD", StreetItemType.NOUN, 1);
        t.addAbridge("RD.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("МИКРОРАЙОН", StreetItemType.NOUN, 0, MorphGender.MASCULINE);
        t.addAbridge("МКР.");
        t.addAbridge("МИКР-Н");
        t.addAbridge("МИКР.");
        t.addAbridge("МКР-Н");
        t.addAbridge("МКР-ОН");
        t.addAbridge("МКРН.");
        t.addAbridge("М-Н");
        t.addAbridge("М-ОН");
        t.addAbridge("М.Р-Н");
        t.addAbridge("МИКР-ОН");
        t.addVariant("МИКРОН", false);
        t.addAbridge("М/Р");
        t.addVariant("МІКРОРАЙОН", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("КВАРТАЛ", StreetItemType.NOUN, 2, MorphGender.MASCULINE);
        t.addAbridge("КВАРТ.");
        t.addAbridge("КВ-Л");
        t.addAbridge("КВ.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("КАДАСТРОВЫЙ КВАРТАЛ", StreetItemType.NOUN, 2, MorphGender.MASCULINE);
        t.addAbridge("КАД.КВАРТ.");
        t.addAbridge("КАД.КВ-Л");
        t.addAbridge("КАД.КВ.");
        t.addAbridge("КАД.КВАРТАЛ");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("ТОРФЯНОЙ УЧАСТОК", StreetItemType.NOUN, 2, MorphGender.MASCULINE);
        t.addVariant("ТОРФУЧАСТОК", false);
        t.addVariant("ТОРФОУЧАСТОК", false);
        t.addAbridge("ТОРФ.УЧАСТОК");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new474("МОСТ", StreetItemType.NOUN, 2, MorphGender.MASCULINE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("МІСТ", StreetItemType.NOUN, MorphLang.UA, 2, MorphGender.MASCULINE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new349("PLAZA", StreetItemType.NOUN, 1);
        t.addAbridge("PLZ");
        StreetItemToken.m_Ontology.add(t);
        StreetItemToken.m_Metro = (t = Termin._new514("СТАНЦИЯ МЕТРО", "МЕТРО", StreetItemType.NOUN, 0, MorphGender.FEMINIE));
        t.addVariant("СТАНЦІЯ МЕТРО", false);
        t.addAbridge("СТ.МЕТРО");
        t.addAbridge("СТ.М.");
        t.addAbridge("МЕТРО");
        StreetItemToken.m_Ontology.add(t);
        StreetItemToken.m_Road = (t = Termin._new515("АВТОДОРОГА", StreetItemType.NOUN, "ФАД", 0, MorphGender.FEMINIE));
        t.addVariant("ФЕДЕРАЛЬНАЯ АВТОДОРОГА", false);
        t.addVariant("АВТОМОБИЛЬНАЯ ДОРОГА", false);
        t.addVariant("АВТОТРАССА", false);
        t.addVariant("ФЕДЕРАЛЬНАЯ ТРАССА", false);
        t.addVariant("ФЕДЕР ТРАССА", false);
        t.addVariant("АВТОМАГИСТРАЛЬ", false);
        t.addAbridge("А/Д");
        t.addAbridge("ФЕДЕР.ТРАССА");
        t.addAbridge("ФЕД.ТРАССА");
        t.addVariant("ГОСТРАССА", false);
        t.addVariant("ГОС.ТРАССА", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new514("ДОРОГА", "АВТОДОРОГА", StreetItemType.NOUN, 1, MorphGender.FEMINIE);
        t.addVariant("ТРАССА", false);
        t.addVariant("МАГИСТРАЛЬ", false);
        t.addAbridge("ДОР.");
        t.addVariant("ДОР", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new475("АВТОДОРОГА", StreetItemType.NOUN, MorphLang.UA, 0, MorphGender.FEMINIE);
        t.addVariant("ФЕДЕРАЛЬНА АВТОДОРОГА", false);
        t.addVariant("АВТОМОБІЛЬНА ДОРОГА", false);
        t.addVariant("АВТОТРАСА", false);
        t.addVariant("ФЕДЕРАЛЬНА ТРАСА", false);
        t.addVariant("АВТОМАГІСТРАЛЬ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new518("ДОРОГА", "АВТОДОРОГА", StreetItemType.NOUN, MorphLang.UA, 1, MorphGender.FEMINIE);
        t.addVariant("ТРАСА", false);
        t.addVariant("МАГІСТРАЛЬ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new519("МОСКОВСКАЯ КОЛЬЦЕВАЯ АВТОМОБИЛЬНАЯ ДОРОГА", "МКАД", StreetItemType.FIX, MorphGender.FEMINIE);
        t.addVariant("МОСКОВСКАЯ КОЛЬЦЕВАЯ АВТОДОРОГА", false);
        StreetItemToken.m_Ontology.add(t);
        StreetItemToken.m_Ontology.add(Termin._new170("САДОВОЕ КОЛЬЦО", StreetItemType.FIX));
        StreetItemToken.m_Ontology.add(Termin._new170("БУЛЬВАРНОЕ КОЛЬЦО", StreetItemType.FIX));
        StreetItemToken.m_Ontology.add(Termin._new170("ТРАНСПОРТНОЕ КОЛЬЦО", StreetItemType.FIX));
        t = Termin._new523("ПОЧТОВОЕ ОТДЕЛЕНИЕ", StreetItemType.NOUN, "ОПС", MorphGender.NEUTER);
        t.addAbridge("П.О.");
        t.addAbridge("ПОЧТ.ОТД.");
        t.addAbridge("ПОЧТОВ.ОТД.");
        t.addAbridge("ПОЧТОВОЕ ОТД.");
        t.addAbridge("П/О");
        t.addVariant("ОТДЕЛЕНИЕ ПОЧТОВОЙ СВЯЗИ", false);
        t.addVariant("ПОЧТАМТ", false);
        t.addVariant("ГЛАВПОЧТАМТ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new471("БУДКА", StreetItemType.NOUN, MorphGender.FEMINIE);
        t.addVariant("ЖЕЛЕЗНОДОРОЖНАЯ БУДКА", false);
        t.addAbridge("Ж/Д БУДКА");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new471("КАЗАРМА", StreetItemType.NOUN, MorphGender.FEMINIE);
        t.addVariant("ЖЕЛЕЗНОДОРОЖНАЯ КАЗАРМА", false);
        t.addAbridge("Ж/Д КАЗАРМА");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new471("СТОЯНКА", StreetItemType.NOUN, MorphGender.FEMINIE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new471("ПУНКТ", StreetItemType.NOUN, MorphGender.MASCULINE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new471("РАЗЪЕЗД", StreetItemType.NOUN, MorphGender.MASCULINE);
        t.addAbridge("РЗД");
        t.addAbridge("Ж/Д РАЗЪЕЗД");
        t.addVariant("ЖЕЛЕЗНОДОРОЖНЫЙ РАЗЪЕЗД", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new471("ЗАЕЗД", StreetItemType.NOUN, MorphGender.MASCULINE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new471("ПЕРЕЕЗД", StreetItemType.NOUN, MorphGender.MASCULINE);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("БОЛЬШОЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("БОЛ.");
        t.addAbridge("Б.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("ВЕЛИКИЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("ВЕЛ.");
        t.addAbridge("В.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("МАЛЫЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("МАЛ.");
        t.addAbridge("М.");
        t.addVariant("МАЛИЙ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("СРЕДНИЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("СРЕД.");
        t.addAbridge("СР.");
        t.addAbridge("С.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new348("СЕРЕДНІЙ", StreetItemType.STDADJECTIVE, MorphLang.UA);
        t.addAbridge("СЕРЕД.");
        t.addAbridge("СЕР.");
        t.addAbridge("С.");
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("ВЕРХНИЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("ВЕРХН.");
        t.addAbridge("ВЕРХ.");
        t.addAbridge("ВЕР.");
        t.addAbridge("В.");
        t.addVariant("ВЕРХНІЙ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("НИЖНИЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("НИЖН.");
        t.addAbridge("НИЖ.");
        t.addAbridge("Н.");
        t.addVariant("НИЖНІЙ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("СТАРЫЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("СТАР.");
        t.addAbridge("СТ.");
        t.addVariant("СТАРИЙ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("НОВЫЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("НОВ.");
        t.addAbridge("Н.");
        t.addVariant("НОВИЙ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("КРАСНЫЙ", StreetItemType.STDADJECTIVE);
        t.addAbridge("КРАСН.");
        t.addAbridge("КР.");
        t.addAbridge("КРАС.");
        t.addVariant("ЧЕРВОНИЙ", false);
        StreetItemToken.m_Ontology.add(t);
        t = Termin._new170("НОМЕР", StreetItemType.STDADJECTIVE);
        t.addAbridge("N");
        t.addAbridge("№");
        t.addAbridge("НОМ.");
        StreetItemToken.m_Ontology.add(t);
        for (const s of ["ПРОЕКТИРУЕМЫЙ", "ЮНЫХ ЛЕНИНЦЕВ;ЮН. ЛЕНИНЦЕВ", "МАРКСА И ЭНГЕЛЬСА;КАРЛА МАРКСА И ФРИДРИХА ЭНГЕЛЬСА", "БАКИНСКИХ КОМИССАРОВ;БАК.КОМИССАРОВ;Б.КОМИССАРОВ", "САККО И ВАНЦЕТТИ", "СЕРП И МОЛОТ", "ЗАВОДА СЕРП И МОЛОТ", "ШАРЛЯ ДЕ ГОЛЛЯ;ДЕ ГОЛЛЯ", "МИНИНА И ПОЖАРСКОГО", "ХО ШИ МИНА;ХОШИМИНА", "ЗОИ И АЛЕКСАНДРА КОСМОДЕМЬЯНСКИХ;З.И А.КОСМОДЕМЬЯНСКИХ;З.А.КОСМОДЕМЬЯНСКИХ", "АРМАНД;ИНЕССЫ АРМАНД", "МИРА", "СВОБОДЫ", "РИМСКОГО-КОРСАКОВА", "ПЕТРА И ПАВЛА"]) {
            let pp = Utils.splitString(s, ';', false);
            t = Termin._new385(pp[0], StreetItemType.STDNAME, true);
            for (let kk = 1; kk < pp.length; kk++) {
                if (pp[kk].indexOf('.') > 0) 
                    t.addAbridge(pp[kk]);
                else 
                    t.addVariant(pp[kk], false);
            }
            StreetItemToken.m_Ontology.add(t);
        }
        for (const s of NameToken.standardNames) {
            let pp = Utils.splitString(s, ';', false);
            t = Termin._new385(pp[0], StreetItemType.STDNAME, true);
            for (let kk = 1; kk < pp.length; kk++) {
                if (pp[kk].indexOf('.') > 0) 
                    t.addAbridge(pp[kk]);
                else if (t.acronym === null && (pp[kk].length < 4)) 
                    t.acronym = pp[kk];
                else 
                    t.addVariant(pp[kk], false);
            }
            StreetItemToken.m_Ontology.add(t);
        }
        for (const s of ["МАРТА", "МАЯ", "ОКТЯБРЯ", "НОЯБРЯ", "БЕРЕЗНЯ", "ТРАВНЯ", "ЖОВТНЯ", "ЛИСТОПАДА", "ДОРОЖКА", "ЛУЧ", "НАДЕЛ", "ПОЛЕ", "СКЛОН"]) {
            StreetItemToken.m_Ontology.add(Termin._new170(s, StreetItemType.STDNAME));
        }
        for (const s of ["МАРШАЛА", "ГЕНЕРАЛА", "ГЕНЕРАЛ-МАЙОРА", "ГЕНЕРАЛ-ЛЕЙТЕНАНТА", "ГЕНЕРАЛ-ПОЛКОВНИКА", "АДМИРАЛА", "КОНТРАДМИРАЛА", "КОСМОНАВТА", "ЛЕТЧИКА", "ПОГРАНИЧНИКА", "ПУТЕШЕСТВЕННИКА", "ПАРТИЗАНА", "АТАМАНА", "ТАНКИСТА", "АВИАКОНСТРУКТОРА", "АРХИТЕКТОРА", "ГЛАВНОГО АРХИТЕКТОРА", "СКУЛЬПТОРА", "ХУДОЖНИКА", "КОНСТРУКТОРА", "ГЛАВНОГО КОНСТРУКТОРА", "АКАДЕМИКА", "ПРОФЕССОРА", "КОМПОЗИТОРА", "ПИСАТЕЛЯ", "ПОЭТА", "ДИРИЖЕРА", "ГЕРОЯ", "БРАТЬЕВ", "ЛЕЙТЕНАНТА", "СТАРШЕГО ЛЕЙТЕНАНТА", "КАПИТАНА", "КАПИТАНА-ЛЕЙТЕНАНТА", "МАЙОРА", "ПОДПОЛКОВНИКА", "ПОЛКОВНИКА", "СЕРЖАНТА", "МЛАДШЕГО СЕРЖАНТА", "СТАРШЕГО СЕРЖАНТА", "ЕФРЕЙТОРА", "СТАРШИНЫ", "ПРАПОРЩИКА", "СТАРШЕГО ПРАПОРЩИКА", "ПОЛИТРУКА", "ПОЛИЦИИ", "МИЛИЦИИ", "ГВАРДИИ", "АРМИИ", "МИТРОПОЛИТА", "ПАТРИАРХА", "ИЕРЕЯ", "ПРОТОИЕРЕЯ", "МОНАХА", "СВЯТОГО", "СВЯТИТЕЛЯ"]) {
            StreetItemToken.m_StdOntMisc.add(new Termin(s));
            t = Termin._new170(s, StreetItemType.STDPARTOFNAME);
            if (s === "СВЯТОГО" || s === "СВЯТИТЕЛЯ") {
                t.addAbridge("СВ.");
                t.addAbridge("СВЯТ.");
            }
            else {
                t.addAllAbridges(0, 0, 2);
                t.addAllAbridges(2, 5, 0);
                if (s === "ПРОФЕССОРА") 
                    t.addVariant("ПРОФЕСОРА", false);
            }
            StreetItemToken.m_Ontology.add(t);
        }
        for (const s of ["МАРШАЛА", "ГЕНЕРАЛА", "ГЕНЕРАЛ-МАЙОРА", "ГЕНЕРАЛ-ЛЕЙТЕНАНТА", "ГЕНЕРАЛ-ПОЛКОВНИКА", "АДМІРАЛА", "КОНТРАДМІРАЛА", "КОСМОНАВТА", "ЛЬОТЧИКА", " ПРИКОРДОННИКА", " МАНДРІВНИКА", "ПАРТИЗАНА", "ОТАМАНА", "ТАНКІСТА", "АВІАКОНСТРУКТОРА", "АРХІТЕКТОРА", "СКУЛЬПТОРА", "ХУДОЖНИКА", "КОНСТРУКТОРА", "АКАДЕМІКА", "ПРОФЕСОРА", "КОМПОЗИТОРА", "ПИСЬМЕННИКА", "ПОЕТА", "ДИРИГЕНТА", "ГЕРОЯ", "ЛЕЙТЕНАНТА", "КАПІТАНА", "КАПІТАНА-ЛЕЙТЕНАНТА", "МАЙОРА", "ПІДПОЛКОВНИКА", "ПОЛКОВНИКА", "СЕРЖАНТА", "ЄФРЕЙТОРА", " СТАРШИНИ", " ПРАПОРЩИКА", "ПОЛІТРУКА", "ПОЛІЦІЇ", "МІЛІЦІЇ", "ГВАРДІЇ", "АРМІЇ", "МИТРОПОЛИТА", "ПАТРІАРХА", "ІЄРЕЯ", "ПРОТОІЄРЕЯ", "ЧЕНЦЯ", "СВЯТОГО", "СВЯТИТЕЛЯ"]) {
            StreetItemToken.m_StdOntMisc.add(new Termin(s));
            t = Termin._new348(s, StreetItemType.STDPARTOFNAME, MorphLang.UA);
            if (s === "СВЯТОГО" || s === "СВЯТИТЕЛЯ") {
                t.addAbridge("СВ.");
                t.addAbridge("СВЯТ.");
            }
            else {
                t.addAllAbridges(0, 0, 2);
                t.addAllAbridges(2, 5, 0);
                t.addAbridge("ГЛ." + s);
                t.addAbridge("ГЛАВ." + s);
            }
            StreetItemToken.m_Ontology.add(t);
        }
        t = Termin._new170("ЛЕНИНСКИЕ ГОРЫ", StreetItemType.FIX);
        StreetItemToken.m_Ontology.add(t);
        for (const s of ["КРАСНЫЙ", "СОВЕТСТКИЙ", "ЛЕНИНСКИЙ"]) {
            StreetItemToken.m_StdAdj.add(new Termin(s));
        }
    }
    
    static checkStdName(t) {
        if (t === null) 
            return null;
        if (StreetItemToken.m_StdAdj.tryParse(t, TerminParseAttr.NO) !== null) 
            return t;
        let tok = StreetItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return null;
        if ((StreetItemType.of(tok.termin.tag)) === StreetItemType.STDNAME) 
            return tok.endToken;
        return null;
    }
    
    static checkKeyword(t) {
        if (t === null) 
            return false;
        let tok = StreetItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return false;
        return (StreetItemType.of(tok.termin.tag)) === StreetItemType.NOUN;
    }
    
    static checkOnto(t) {
        if (t === null) 
            return false;
        let tok = StreetItemToken.m_OntologyEx.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return false;
        return true;
    }
    
    static _isRegion(txt) {
        txt = txt.toUpperCase();
        for (const v of StreetItemToken.m_RegTails) {
            if (LanguageHelper.endsWith(txt, v)) 
                return true;
        }
        return false;
    }
    
    static _isSpec(txt) {
        txt = txt.toUpperCase();
        for (const v of StreetItemToken.m_SpecTails) {
            if (LanguageHelper.endsWith(txt, v)) 
                return true;
        }
        return false;
    }
    
    constructor(begin, end) {
        super(begin, end, null);
        this.typ = StreetItemType.NOUN;
        this.altTyp = StreetItemType.NOUN;
        this.termin = null;
        this.altTermin = null;
        this.existStreet = null;
        this.numberType = NumberSpellingType.UNDEFINED;
        this.numberHasPrefix = false;
        this.isNumberKm = false;
        this.value = null;
        this.altValue = null;
        this.altValue2 = null;
        this.misc = null;
        this.isAbridge = false;
        this.isInDictionary = false;
        this.isInBrackets = false;
        this.hasStdSuffix = false;
        this.nounIsDoubtCoef = 0;
        this.nounCanBeName = false;
        this.isRoadName = false;
        this.stdAdjVersion = null;
        this.nextItem = null;
        this.isRailway = false;
        this.cond = null;
        this.noGeoInThisToken = false;
        this.org = null;
        this.ortoTerr = null;
        this.city = null;
    }
    
    get isRoad() {
        if (this.termin === null) 
            return false;
        if ((this.termin.canonicText === "АВТОДОРОГА" || this.termin.canonicText === "ШОССЕ" || this.termin.canonicText === "ТРАКТ") || this.termin.canonicText === "АВТОШЛЯХ" || this.termin.canonicText === "ШОСЕ") 
            return true;
        return false;
    }
    
    clone() {
        let res = new StreetItemToken(this.beginToken, this.endToken);
        res.morph = this.morph;
        res.typ = this.typ;
        res.altTyp = this.altTyp;
        res.termin = this.termin;
        res.altTermin = this.altTermin;
        res.value = this.value;
        res.altValue = this.altValue;
        res.altValue2 = this.altValue2;
        res.isRailway = this.isRailway;
        res.isRoadName = this.isRoadName;
        res.nounCanBeName = this.nounCanBeName;
        res.nounIsDoubtCoef = this.nounIsDoubtCoef;
        res.hasStdSuffix = this.hasStdSuffix;
        res.isInBrackets = this.isInBrackets;
        res.isAbridge = this.isAbridge;
        res.isInDictionary = this.isInDictionary;
        res.existStreet = this.existStreet;
        res.misc = this.misc;
        res.numberType = this.numberType;
        res.numberHasPrefix = this.numberHasPrefix;
        res.isNumberKm = this.isNumberKm;
        res.cond = this.cond;
        res.org = this.org;
        if (this.ortoTerr !== null) 
            res.ortoTerr = this.ortoTerr.clone();
        res.city = this.city;
        if (this.stdAdjVersion !== null) 
            res.stdAdjVersion = this.stdAdjVersion.clone();
        if (this.nextItem !== null) 
            res.nextItem = this.nextItem.clone();
        return res;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(this.typ.toString());
        if (this.value !== null) {
            res.append(" ").append(this.value);
            if (this.altValue !== null) 
                res.append("/").append(this.altValue);
            if (this.isNumberKm) 
                res.append("км");
        }
        if (this.misc !== null) 
            res.append(" <").append(this.misc).append(">");
        if (this.existStreet !== null) 
            res.append(" ").append(this.existStreet.toString());
        if (this.termin !== null) {
            res.append(" ").append(this.termin.toString());
            if (this.altTermin !== null) 
                res.append("/").append(this.altTermin.toString());
        }
        else 
            res.append(" ").append(super.toString());
        if (this.org !== null) 
            res.append(" Org: ").append(this.org);
        if (this.isAbridge) 
            res.append(" (?)");
        if (this.ortoTerr !== null) 
            res.append(" TERR: ").append(this.ortoTerr);
        if (this.stdAdjVersion !== null) 
            res.append(" + (?) ").append(this.stdAdjVersion.toString());
        if (this.nextItem !== null) 
            res.append(" + ").append(this.nextItem.toString());
        return res.toString();
    }
    
    _isSurname() {
        if (this.typ !== StreetItemType.NAME) 
            return false;
        if (!(this.endToken instanceof TextToken)) 
            return false;
        let nam = this.endToken.term;
        if (nam.length > 4) {
            if (LanguageHelper.endsWithEx(nam, "А", "Я", "КО", "ЧУКА")) {
                if (!LanguageHelper.endsWithEx(nam, "АЯ", "ЯЯ", null, null)) {
                    let mc = this.endToken.getMorphClassInDictionary();
                    if (!mc.isNoun) 
                        return true;
                }
            }
        }
        return false;
    }
    
    static prepareAllData(t0) {
        const GeoAnalyzer = require("./../../geo/GeoAnalyzer");
        if (!StreetItemToken.SPEED_REGIME) 
            return;
        let ad = GeoAnalyzer.getData(t0);
        if (ad === null) 
            return;
        ad.sRegime = false;
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, GeoTokenData);
            let prev = null;
            let kk = 0;
            for (let tt = t.previous; tt !== null && (kk < 10); tt = tt.previous,kk++) {
                let dd = Utils.as(tt.tag, GeoTokenData);
                if (dd === null || dd.street === null) 
                    continue;
                if (dd.street.endToken.next === t) 
                    prev = dd.street;
                if (t.previous !== null && t.previous.isHiphen && dd.street.endToken.next === t.previous) 
                    prev = dd.street;
            }
            let str = StreetItemToken.tryParse(t, prev, false, ad);
            if (str !== null) {
                if (d === null) 
                    d = new GeoTokenData(t);
                d.street = str;
                if (str.noGeoInThisToken) {
                    if (((prev !== null && prev.typ === StreetItemType.NOUN)) || StreetItemToken.checkKeyword(str.endToken.next)) {
                        for (let tt = str.beginToken; tt !== null && tt.endChar <= str.endChar; tt = tt.next) {
                            let dd = Utils.as(tt.tag, GeoTokenData);
                            if (dd === null) 
                                dd = new GeoTokenData(tt);
                            dd.noGeo = true;
                        }
                    }
                }
                if ((prev !== null && prev.typ === StreetItemType.NOUN && str.typ === StreetItemType.NOUN) && str.termin === prev.termin) 
                    prev.endToken = str.endToken;
            }
        }
        ad.sRegime = true;
    }
    
    static tryParse(t, prev = null, inSearch = false, ad = null) {
        const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
        const GeoAnalyzer = require("./../../geo/GeoAnalyzer");
        const AddressItemToken = require("./AddressItemToken");
        if (t === null) 
            return null;
        if ((t instanceof TextToken) && t.lengthChar === 1 && t.isCharOf(",.:")) 
            return null;
        if (ad === null) 
            ad = Utils.as(GeoAnalyzer.getData(t), GeoAnalyzerData);
        if (ad === null) 
            return null;
        if ((StreetItemToken.SPEED_REGIME && ((ad.sRegime || ad.allRegime)) && !inSearch) && !(t instanceof ReferentToken)) {
            if ((t instanceof TextToken) && t.isChar('м')) {
            }
            else {
                let d = Utils.as(t.tag, GeoTokenData);
                if (d === null) 
                    return null;
                if (d.street !== null) {
                    if (d.street.cond === null) 
                        return d.street;
                    if (d.street.cond.check()) 
                        return d.street;
                    return null;
                }
                if (d.org !== null) 
                    return StreetItemToken._new294(t, d.org.endToken, StreetItemType.FIX, d.org);
                return null;
            }
        }
        if (ad.sLevel > 3) 
            return null;
        ad.sLevel++;
        let res = StreetItemToken._tryParse(t, false, prev, inSearch);
        if (res !== null && res.typ !== StreetItemType.NOUN) {
            if (res.typ === StreetItemType.NAME && res.beginToken === res.endToken && (res.beginToken instanceof TextToken)) {
                let tt2 = Utils.as(res.beginToken, TextToken);
                if (tt2.term === "ИЖС" || tt2.term === "ЛПХ" || tt2.term === "ДУБЛЬ") {
                    ad.sLevel--;
                    return null;
                }
                let ait = AddressItemToken.tryParsePureItem(t, null, null);
                if ((ait !== null && ait.typ === AddressItemType.HOUSE && ait.value !== null) && ait.value !== "0") {
                    ad.sLevel--;
                    return null;
                }
            }
            let tt = Utils.as(res.endToken.next, TextToken);
            if (tt !== null && res.typ === StreetItemType.NUMBER && tt.isValue("ОТДЕЛЕНИЕ", null)) {
                res.endToken = tt;
                res.numberHasPrefix = true;
            }
            else if (tt !== null && res.typ === StreetItemType.NUMBER && tt.isChar('+')) {
                let res2 = StreetItemToken._tryParse(tt.next, false, prev, inSearch);
                if (res2 !== null && res2.typ === StreetItemType.NUMBER) {
                    res.endToken = res2.endToken;
                    res.value = (res.value + "+" + res2.value);
                }
            }
            else if (tt !== null && tt.isChar('(')) {
                if (res.value === null) 
                    res.value = MiscHelper.getTextValue(res.beginToken, res.endToken, GetTextAttr.NO);
                let ait = AddressItemToken.tryParse(tt.next, false, null, null);
                if ((ait !== null && ait.typ === AddressItemType.STREET && ait.endToken.next !== null) && ait.endToken.next.isChar(')')) {
                    res.ortoTerr = ait.clone();
                    res.ortoTerr.endToken = ait.endToken.next;
                    res.endToken = res.ortoTerr.endToken;
                }
                else {
                    let sit = StreetItemToken.tryParse(tt.next, null, false, null);
                    if ((sit !== null && ((sit.typ === StreetItemType.NAME || sit.typ === StreetItemType.STDNAME)) && sit.endToken.next !== null) && sit.endToken.next.isChar(')')) {
                        ait = new AddressItemToken(AddressItemType.STREET, tt.next, sit.endToken);
                        let stre = new StreetReferent();
                        stre.kind = StreetKind.AREA;
                        stre.addTyp("территория");
                        stre.addName(sit);
                        ait.referent = stre;
                        res.ortoTerr = ait;
                        res.endToken = sit.endToken.next;
                    }
                }
            }
            if (res.beginToken === res.endToken && ((res.typ === StreetItemType.NAME || res.typ === StreetItemType.STDNAME || res.typ === StreetItemType.STDPARTOFNAME))) {
                let end = MiscLocationHelper.checkNameLong(res);
                if ((end instanceof ReferentToken) && (end.getReferent() instanceof DateReferent)) 
                    end = null;
                if (end !== null && StreetItemToken.checkKeyword(end)) 
                    end = null;
                if (end !== null) {
                    res.endToken = end;
                    if (res.value === null) 
                        res.value = MiscHelper.getTextValue(res.beginToken, end, GetTextAttr.NO);
                    else {
                        res.value = (res.value + " " + MiscHelper.getTextValue(res.beginToken.next, end, GetTextAttr.NO));
                        if (res.altValue !== null) 
                            res.altValue = (res.altValue + " " + MiscHelper.getTextValue(res.beginToken.next, end, GetTextAttr.NO));
                    }
                    if (res.beginToken.next === res.endToken) {
                        let mc = res.beginToken.getMorphClassInDictionary();
                        let mc1 = res.endToken.getMorphClassInDictionary();
                        if (((mc.isProperName && !res.beginToken.isValue("СЛАВА", null))) || mc1.isProperSurname) {
                            res.altValue2 = res.altValue;
                            res.altValue = MiscHelper.getTextValue(end, end, GetTextAttr.NO);
                        }
                        else if (mc.isProperSurname && mc1.isProperName) {
                            res.altValue2 = res.altValue;
                            res.altValue = MiscHelper.getTextValue(res.beginToken, res.beginToken, GetTextAttr.NO);
                        }
                    }
                }
            }
        }
        if ((res !== null && res.typ === StreetItemType.NUMBER && prev !== null) && prev.typ === StreetItemType.NOUN && prev.termin.canonicText === "РЯД") {
            if (res.endToken.next !== null && ((res.endToken.next.isValue("ЛИНИЯ", null) || res.endToken.next.isValue("БЛОК", null)))) {
                let _next = StreetItemToken._tryParse(res.endToken.next.next, true, prev, inSearch);
                if (_next !== null && _next.typ === StreetItemType.NUMBER && !Utils.isNullOrEmpty(_next.value)) {
                    if (Utils.isLetter(_next.value[0])) 
                        res.value += _next.value;
                    else 
                        res.value = (res.value + "/" + _next.value);
                    res.endToken = _next.endToken;
                }
            }
        }
        if ((res !== null && res.typ === StreetItemType.NUMBER && prev !== null) && prev.typ === StreetItemType.NOUN && ((prev.termin.canonicText === "БЛОК" || prev.termin.canonicText === "ЛИНИЯ"))) {
            if (res.endToken.next !== null && res.endToken.next.isValue("РЯД", null)) {
                let _next = StreetItemToken._tryParse(res.endToken.next.next, true, prev, inSearch);
                if (_next !== null && _next.typ === StreetItemType.NUMBER && !Utils.isNullOrEmpty(_next.value)) {
                    let tok = StreetItemToken.m_Ontology.tryParse(res.endToken.next, TerminParseAttr.NO);
                    if (tok !== null && tok.termin.canonicText === "РЯД") 
                        prev.termin = tok.termin;
                    if (Utils.isDigit(_next.value[0]) === Utils.isDigit(res.value[res.value.length - 1])) 
                        res.value = (_next.value + "/" + res.value);
                    else 
                        res.value = (_next.value + res.value);
                    res.endToken = _next.endToken;
                }
            }
        }
        if (res !== null && res.isRoad) {
            for (let tt = res.endToken.next; tt !== null; tt = tt.next) {
                let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null) {
                    if (npt.endToken.isValue("ПОЛЬЗОВАНИЕ", null) || npt.endToken.isValue("ЗНАЧЕНИЕ", null)) {
                        res.endToken = (tt = npt.endToken);
                        continue;
                    }
                }
                break;
            }
        }
        if ((res === null && t.isChar('(') && MiscLocationHelper.isUserParamAddress(t)) && StreetItemToken.m_Ontology.tryParse(t.next, TerminParseAttr.NO) !== null) {
            let _next = StreetItemToken.tryParse(t.next, null, false, null);
            if ((_next !== null && _next.typ === StreetItemType.NOUN && _next.endToken.next !== null) && _next.endToken.next.isChar(')')) {
                _next.beginToken = t;
                _next.endToken = _next.endToken.next;
                res = _next;
            }
        }
        ad.sLevel--;
        return res;
    }
    
    static _tryParse(t, ignoreOnto, prev, inSearch) {
        const GeoAnalyzer = require("./../../geo/GeoAnalyzer");
        const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
        const TerrItemToken = require("./../../geo/internal/TerrItemToken");
        const NumToken = require("./../../geo/internal/NumToken");
        const AddressItemToken = require("./AddressItemToken");
        const CityItemToken = require("./../../geo/internal/CityItemToken");
        const NameToken = require("./../../geo/internal/NameToken");
        const OrgItemToken = require("./../../geo/internal/OrgItemToken");
        if (t === null) 
            return null;
        if (prev !== null && prev.isRoad) {
            let res1 = StreetItemToken.tryParseSpec(t, prev);
            if (res1 !== null && res1[0].typ === StreetItemType.NAME) 
                return res1[0];
        }
        if ((prev === null && t.next !== null && t.next.isHiphen) && MiscLocationHelper.isUserParamAddress(t)) {
            let res1 = StreetItemToken.tryParseSpec(t, prev);
            if (res1 !== null && res1[0].typ === StreetItemType.NAME) 
                return res1[0];
        }
        if (t.isValue("ТЕР", null)) {
        }
        if ((t.isValue("А", null) || t.isValue("АД", null) || t.isValue("АВТ", null)) || t.isValue("АВТОДОР", null)) {
            let tt1 = t;
            if (t.isValue("А", null)) {
                tt1 = t.next;
                if (tt1 !== null && tt1.isCharOf("\\/")) 
                    tt1 = tt1.next;
                if (tt1 !== null && ((tt1.isValue("Д", null) || tt1.isValue("М", null)))) {
                }
                else 
                    tt1 = null;
            }
            else if (tt1.next !== null && tt1.next.isChar('.')) 
                tt1 = tt1.next;
            if (tt1 !== null) {
                let res = StreetItemToken._new549(t, tt1, StreetItemType.NOUN, StreetItemToken.m_Road);
                if (prev !== null && ((prev.isRoadName || prev.isRoad))) 
                    return res;
                let _next = StreetItemToken.tryParse(tt1.next, res, false, null);
                if (_next !== null && _next.isRoadName) 
                    return res;
                if (t.previous !== null) {
                    if (t.previous.isValue("КМ", null) || t.previous.isValue("КИЛОМЕТР", null)) 
                        return res;
                }
            }
        }
        if ((((t.isValue("Ж", null) || t.isValue("ЖЕЛ", null))) && t.next !== null && t.next.isCharOf("\\/")) && (t.next.next instanceof TextToken) && t.next.next.isValue("ДОРОЖНЫЙ", null)) 
            return StreetItemToken._new455(t, t.next.next, StreetItemType.NAME, "ЖЕЛЕЗНО" + t.next.next.term);
        if ((((t.isValue("ФЕДЕРАЛЬНЫЙ", null) || t.isValue("ГОСУДАРСТВЕННЫЙ", null) || t.isValue("АВТОМОБИЛЬНЫЙ", null)) || t.isValue("ФЕД", null) || t.isValue("ФЕДЕРАЛ", null)) || t.isValue("ГОС", null) || t.isValue("АВТО", null)) || t.isValue("АВТОМОБ", null)) {
            let tt2 = t.next;
            if (tt2 !== null && tt2.isChar('.')) 
                tt2 = tt2.next;
            let tok2 = StreetItemToken.m_Ontology.tryParse(tt2, TerminParseAttr.NO);
            if (tok2 !== null && tok2.termin.canonicText === "АВТОДОРОГА") 
                return StreetItemToken._new549(t, tok2.endToken, StreetItemType.NOUN, tok2.termin);
        }
        if (t.isHiphen && prev !== null && prev.typ === StreetItemType.NAME) {
            let num = NumberHelper.tryParseRoman(t.next);
            if (num !== null) 
                return StreetItemToken._new464(t, num.endToken, StreetItemType.NUMBER, num.value, true);
        }
        let t0 = t;
        let tn = null;
        let org1 = OrgItemToken.tryParse(t, null);
        if (org1 !== null) {
            if (org1.isGsk || !org1.isDoubt || org1.hasTerrKeyword) 
                return StreetItemToken._new294(t0, org1.endToken, StreetItemType.FIX, org1);
            if (BracketHelper.isBracket(t, true)) {
                let _next = StreetItemToken.tryParse(t.next, prev, false, null);
                if (_next !== null) {
                    if (BracketHelper.isBracket(_next.endToken.next, true)) {
                        if (_next.typ === StreetItemType.NAME && _next.value === null) 
                            _next.value = MiscHelper.getTextValueOfMetaToken(_next, GetTextAttr.NO);
                        _next.beginToken = t0;
                        _next.endToken = _next.endToken.next;
                    }
                    return _next;
                }
            }
        }
        let geo1 = Utils.as(t.getReferent(), GeoReferent);
        if (geo1 !== null && geo1.isCity && MiscLocationHelper.isUserParamAddress(t)) {
            for (const ty of geo1.typs) {
                if ((ty === "поселок" || ty === "станция" || ty === "слобода") || ty === "хутор") 
                    return StreetItemToken._new554(t0, t, StreetItemType.FIX, geo1);
            }
        }
        if (t instanceof TextToken) {
            if (t.isValue("ТЕРРИТОРИЯ", null) || t.term === "ТЕР" || t.term === "ТЕРР") 
                return null;
        }
        let nnn2 = NumToken.tryParse(t, GeoTokenType.STREET);
        if (nnn2 !== null && ((nnn2.hasPrefix || nnn2.isCadasterNumber))) 
            return StreetItemToken._new555(t, nnn2.endToken, nnn2.value, StreetItemType.NUMBER, true);
        if (prev !== null) {
        }
        let hasNamed = false;
        if (t.isValue("ИМЕНИ", "ІМЕНІ")) 
            tn = t;
        else if (t.isValue("ПАМЯТИ", "ПАМЯТІ")) {
            let nam = NameToken.tryParse(t, GeoTokenType.STREET, 0, false);
            if (nam !== null && nam.endToken !== t && nam.number === null) {
            }
            else if (t.isNewlineAfter || ((t.next !== null && t.next.isComma))) {
            }
            else 
                tn = t;
        }
        else if (t.isValue("ИМ", null) || t.isValue("ІМ", null)) {
            tn = t;
            if (tn.next !== null && tn.next.isChar('.')) 
                tn = tn.next;
        }
        if (tn !== null) {
            if (tn.next === null || tn.newlinesAfterCount > 1) 
                return null;
            t = tn.next;
            tn = t;
            hasNamed = true;
        }
        if (t.isValue("ДВАЖДЫ", null) || t.isValue("ТРИЖДЫ", null) || t.isValue("ЧЕТЫРЕЖДЫ", null)) {
            if (t.next !== null) 
                t = t.next;
        }
        if (t.isValue("ГЕРОЙ", null)) {
            let ters = TerrItemToken.tryParseList(t.next, 3, null);
            if (ters !== null && ters.length > 0) {
                let tt1 = null;
                if (ters[0].ontoItem !== null) 
                    tt1 = ters[0].endToken.next;
                else if (ters[0].terminItem !== null && ters.length > 1 && ters[1].ontoItem !== null) 
                    tt1 = ters[1].endToken.next;
                let nnn = StreetItemToken.tryParse(tt1, prev, inSearch, null);
                if (nnn !== null && nnn.typ === StreetItemType.NAME) 
                    return nnn;
            }
        }
        if (t.isValue("НЕЗАВИСИМОСТЬ", null)) {
            let ters = TerrItemToken.tryParseList(t.next, 3, null);
            if (ters !== null && ters.length > 0) {
                let tok2 = null;
                if (ters[0].ontoItem !== null) 
                    tok2 = ters[0];
                else if (ters[0].terminItem !== null && ters.length > 1 && ters[1].ontoItem !== null) 
                    tok2 = ters[1];
                if (tok2 !== null) {
                    let res = StreetItemToken._new469(t, tok2.endToken, StreetItemType.NAME);
                    res.value = ("НЕЗАВИСИМОСТИ " + tok2.ontoItem.canonicText);
                    return res;
                }
            }
        }
        if (t.isValue("ЖУКОВА", null)) {
        }
        if (t instanceof ReferentToken) {
            let res1 = StreetItemToken.tryParseSpec(t, prev);
            if (res1 !== null && ((res1.length === 1 || res1[0].typ === StreetItemType.NAME))) 
                return res1[0];
            if ((res1 !== null && res1.length === 2 && res1[0].typ === StreetItemType.NUMBER) && ((res1[1].typ === StreetItemType.NAME || res1[1].typ === StreetItemType.STDNAME))) {
                res1[0].nextItem = res1[1];
                return res1[0];
            }
        }
        let nt = NumberHelper.tryParseAge(t);
        if (nt !== null && nt.intValue !== null) 
            return StreetItemToken._new557(nt.beginToken, nt.endToken, StreetItemType.AGE, nt.value, NumberSpellingType.AGE);
        if ((((nt = Utils.as(t, NumberToken)))) !== null) {
            if (nt.intValue === null) {
                if (prev !== null && prev.typ === StreetItemType.NOUN) {
                }
                else 
                    return null;
            }
            else if (nt.intValue === 0) {
                if (prev !== null && prev.typ === StreetItemType.NOUN) {
                }
                else {
                    let _next = StreetItemToken.tryParse(nt.next, null, false, null);
                    if (_next !== null && _next.typ === StreetItemType.NOUN) {
                    }
                    else 
                        return null;
                }
            }
            let res = StreetItemToken._new558(nt, nt, StreetItemType.NUMBER, nt.value, nt.typ, nt.morph);
            res.value = nt.value;
            if (prev !== null && prev.typ === StreetItemType.NOUN && ((prev.termin.canonicText === "РЯД" || prev.termin.canonicText === "ЛИНИЯ"))) {
                let ait = AddressItemToken.tryParsePureItem(t, null, null);
                if (ait !== null && ait.typ === AddressItemType.NUMBER) {
                    res.value = ait.value;
                    res.endToken = ait.endToken;
                    return res;
                }
            }
            let nnn = NumToken.tryParse(t, GeoTokenType.STREET);
            if (nnn !== null) {
                res.value = nnn.value;
                t = res.endToken = nnn.endToken;
            }
            let nex = NumberHelper.tryParseNumberWithPostfix(t);
            if (nex !== null) {
                if (nex.exTyp === NumberExType.KILOMETER) {
                    res.isNumberKm = true;
                    res.endToken = nex.endToken;
                    let tt2 = res.endToken.next;
                    let hasBr = false;
                    while (tt2 !== null) {
                        if (tt2.isHiphen || tt2.isChar('+')) 
                            tt2 = tt2.next;
                        else if (tt2.isChar('(')) {
                            hasBr = true;
                            tt2 = tt2.next;
                        }
                        else 
                            break;
                    }
                    let nex2 = NumberHelper.tryParseNumberWithPostfix(tt2);
                    if (nex2 !== null && nex2.exTyp === NumberExType.METER) {
                        res.endToken = nex2.endToken;
                        if (hasBr && res.endToken.next !== null && res.endToken.next.isChar(')')) 
                            res.endToken = res.endToken.next;
                        let mm = NumberHelper.doubleToString(nex2.realValue / (1000));
                        if (mm.startsWith("0.")) 
                            res.value += mm.substring(1);
                    }
                    let ait = AddressItemToken.tryParsePureItem(t, null, null);
                    if (ait !== null && ait.typ === AddressItemType.DETAIL) 
                        return null;
                }
                else {
                    let nex2 = StreetItemToken.tryParse(res.endToken.next, null, false, null);
                    if (nex2 !== null && nex2.typ === StreetItemType.NOUN && nex2.endChar > nex.endChar) {
                    }
                    else 
                        return null;
                }
            }
            if (t.next !== null && t.next.isHiphen && (t.next.next instanceof NumberToken)) {
                nex = NumberHelper.tryParseNumberWithPostfix(t.next.next);
                if (nex !== null) {
                    if (nex.exTyp === NumberExType.KILOMETER) {
                        res.isNumberKm = true;
                        res.endToken = nex.endToken;
                        res.value = (res.value + "-" + nex.value);
                    }
                    else 
                        return null;
                }
            }
            let aaa = AddressItemToken.tryParsePureItem(t, null, null);
            if (aaa !== null && aaa.typ === AddressItemType.NUMBER && aaa.endChar > (t.endChar + 1)) {
                let _next = StreetItemToken.tryParse(res.endToken.next, null, false, null);
                if (_next !== null && ((_next.typ === StreetItemType.NAME || _next.typ === StreetItemType.STDNAME))) {
                }
                else if (prev !== null && prev.typ === StreetItemType.NOUN && (((t.next.isHiphen || prev.termin.canonicText === "КВАРТАЛ" || prev.termin.canonicText === "ЛИНИЯ") || prev.termin.canonicText === "АЛЛЕЯ" || prev.termin.canonicText === "ДОРОГА"))) {
                    if (StreetItemToken.m_Ontology.tryParse(aaa.endToken, TerminParseAttr.NO) !== null) {
                    }
                    else {
                        res.endToken = aaa.endToken;
                        res.value = aaa.value;
                        res.numberType = NumberSpellingType.UNDEFINED;
                    }
                }
                else 
                    return null;
            }
            if (nt.typ === NumberSpellingType.WORDS && nt.morph._class.isAdjective) {
                let npt2 = MiscLocationHelper.tryParseNpt(t);
                if (npt2 !== null && npt2.endChar > t.endChar && npt2.morph.number !== MorphNumber.SINGULAR) {
                    if (t.next !== null && !t.next.chars.isAllLower) {
                    }
                    else 
                        return null;
                }
            }
            if (!res.isNumberKm && prev !== null && prev.beginToken.isValue("КИЛОМЕТР", null)) 
                res.isNumberKm = true;
            else if (prev !== null && prev.typ === StreetItemType.NOUN && !res.isWhitespaceAfter) {
                for (let tt1 = res.endToken.next; tt1 !== null; tt1 = tt1.next) {
                    if (tt1.isWhitespaceBefore) 
                        break;
                    if (tt1 instanceof NumberToken) {
                        res.value += tt1.value;
                        res.endToken = tt1;
                    }
                    else if (tt1.isHiphen) {
                        res.value += "-";
                        res.endToken = tt1;
                    }
                    else if ((tt1 instanceof TextToken) && tt1.chars.isLetter && tt1.lengthChar === 1) {
                        let ch = tt1.term[0];
                        let ch1 = LanguageHelper.getCyrForLat(ch);
                        if ((ch1.charCodeAt(0)) !== 0) 
                            ch = ch1;
                        res.value = (res.value + ch);
                        res.endToken = tt1;
                    }
                    else 
                        break;
                }
            }
            if (res.value.endsWith("-")) 
                res.value = res.value.substring(0, 0 + res.value.length - 1);
            if (res.endToken.next !== null && ((res.endToken.next.isValue("СЕКТОР", null) || res.endToken.next.isValue("ЗОНА", null)))) {
                let tt1 = res.endToken.next.next;
                if ((tt1 instanceof TextToken) && tt1.lengthChar === 1 && tt1.chars.isLetter) {
                    let ch = tt1.term[0];
                    let ch1 = LanguageHelper.getCyrForLat(ch);
                    if ((ch1.charCodeAt(0)) !== 0) 
                        ch = ch1;
                    res.value = (res.value + ch);
                    res.endToken = tt1;
                }
                else if (tt1 instanceof NumberToken) {
                    res.value = (res.value + "-" + tt1.value);
                    res.endToken = tt1;
                }
            }
            return res;
        }
        let ntt = MiscHelper.checkNumberPrefix(t);
        if ((ntt !== null && (ntt instanceof NumberToken) && prev !== null) && ntt.intValue !== null) 
            return StreetItemToken._new468(t, ntt, StreetItemType.NUMBER, ntt.value, ntt.typ, true);
        let rrr = OrgItemToken.tryParseRailway(t);
        if (rrr !== null) 
            return rrr;
        if ((t instanceof ReferentToken) && t.beginToken === t.endToken && !t.chars.isAllLower) {
            if (prev !== null && prev.typ === StreetItemType.NOUN) {
                if (((prev.morph.number.value()) & (MorphNumber.PLURAL.value())) === (MorphNumber.UNDEFINED.value())) 
                    return StreetItemToken._new455(t, t, StreetItemType.NAME, MiscHelper.getTextValueOfMetaToken(Utils.as(t, ReferentToken), GetTextAttr.NO));
            }
        }
        if (t.isValue("ЧАСТЬ", null) || t.isValue("УГОЛ", null)) 
            return null;
        let tt = Utils.as(t, TextToken);
        let npt = null;
        if (tt !== null && tt.morph._class.isAdjective) {
            if (tt.chars.isCapitalUpper || MiscLocationHelper.isUserParamAddress(tt) || ((prev !== null && prev.typ === StreetItemType.NUMBER && tt.isValue("ТРАНСПОРТНЫЙ", null)))) {
                npt = MiscLocationHelper.tryParseNpt(tt);
                if (npt !== null && MiscHelper.getTextValueOfMetaToken(npt.noun, GetTextAttr.NO).includes("-")) 
                    npt = null;
                else if (npt !== null && npt.adjectives.length > 0 && ((npt.adjectives[0].isNewlineAfter || npt.noun.isNewlineBefore))) 
                    npt = null;
                if (npt !== null && AddressItemToken.tryParsePureItem(npt.endToken, null, null) !== null) 
                    npt = null;
                let tte = tt.next;
                if (npt !== null && npt.adjectives.length === 1) 
                    tte = npt.endToken;
                if (tte !== null) {
                    if (((((((((tte.isValue("ВАЛ", null) || tte.isValue("ПОЛЕ", null) || tte.isValue("МАГИСТРАЛЬ", null)) || tte.isValue("СПУСК", null) || tte.isValue("ВЗВОЗ", null)) || tte.isValue("РЯД", null) || tte.isValue("СЛОБОДА", null)) || tte.isValue("РОЩА", null) || tte.isValue("ПРУД", null)) || tte.isValue("СЪЕЗД", null) || tte.isValue("КОЛЬЦО", null)) || tte.isValue("МАГІСТРАЛЬ", null) || tte.isValue("УЗВІЗ", null)) || tte.isValue("ЛІНІЯ", null) || tte.isValue("УЗВІЗ", null)) || tte.isValue("ГАЙ", null) || tte.isValue("СТАВОК", null)) || tte.isValue("ЗЇЗД", null) || tte.isValue("КІЛЬЦЕ", null)) {
                        let sit = StreetItemToken._new561(tt, tte, true);
                        sit.typ = StreetItemType.NAME;
                        if (npt === null || npt.adjectives.length === 0) 
                            sit.value = MiscHelper.getTextValue(tt, tte, GetTextAttr.NO);
                        else if (npt.morph._case.isGenitive) {
                            sit.value = MiscHelper.getTextValue(tt, tte, GetTextAttr.NO);
                            sit.altValue = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                        }
                        else 
                            sit.value = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                        let tok2 = StreetItemToken.m_Ontology.tryParse(tt, TerminParseAttr.NO);
                        if (tok2 !== null && tok2.termin !== null && tok2.endToken === tte) 
                            sit.termin = tok2.termin;
                        return sit;
                    }
                }
                if (npt !== null && npt.beginToken !== npt.endToken && npt.adjectives.length <= 1) {
                    let oo = StreetItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
                    if (oo !== null && (StreetItemType.of(oo.termin.tag)) === StreetItemType.NOUN) 
                        npt = null;
                }
                if (npt !== null && npt.endToken.isValue("ВЕРХ", null)) 
                    npt = null;
                if (npt !== null) {
                    let ait = AddressItemToken.tryParsePureItem(t, null, null);
                    if (ait !== null && ait.detailType !== AddressDetailType.UNDEFINED) 
                        npt = null;
                }
                if (npt !== null && npt.beginToken !== npt.endToken && npt.adjectives.length <= 1) {
                    let tt1 = npt.endToken.next;
                    let ok = MiscLocationHelper.isUserParamAddress(npt);
                    if (npt.isNewlineAfter) 
                        ok = true;
                    else if (tt1 !== null && tt1.isComma) {
                        ok = true;
                        tt1 = tt1.next;
                    }
                    let sti1 = StreetItemToken.tryParse(tt1, null, false, null);
                    if (sti1 !== null && sti1.typ === StreetItemType.NOUN) 
                        ok = true;
                    else if (tt1 !== null && tt1.isHiphen && (tt1.next instanceof NumberToken)) 
                        ok = true;
                    else {
                        let ait = AddressItemToken.tryParsePureItem(tt1, null, null);
                        if (ait !== null) {
                            if (ait.typ === AddressItemType.HOUSE) 
                                ok = true;
                            else if (ait.typ === AddressItemType.NUMBER) {
                                let ait2 = AddressItemToken.tryParsePureItem(npt.endToken, null, null);
                                if (ait2 === null) 
                                    ok = true;
                            }
                        }
                    }
                    if (ok) {
                        sti1 = StreetItemToken.tryParse(npt.endToken, null, false, null);
                        if (sti1 !== null && sti1.typ === StreetItemType.NOUN) 
                            ok = sti1.nounIsDoubtCoef >= 2 && sti1.termin.canonicText !== "КВАРТАЛ";
                        else {
                            let tok2 = StreetItemToken.m_Ontology.tryParse(npt.endToken, TerminParseAttr.NO);
                            if (tok2 !== null) {
                                let _typ = StreetItemType.of(tok2.termin.tag);
                                if (_typ === StreetItemType.NOUN || _typ === StreetItemType.STDPARTOFNAME || _typ === StreetItemType.STDADJECTIVE) 
                                    ok = false;
                            }
                        }
                    }
                    if (ok) {
                        let sit = new StreetItemToken(tt, npt.endToken);
                        sit.typ = StreetItemType.NAME;
                        sit.value = MiscHelper.getTextValue(tt, npt.endToken, GetTextAttr.NO);
                        sit.altValue = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                        return sit;
                    }
                }
            }
        }
        if (tt !== null && (tt.next instanceof TextToken) && ((tt.next.chars.isCapitalUpper || MiscLocationHelper.isUserParamAddress(tt)))) {
            if ((tt.isValue("ВАЛ", null) || tt.isValue("ПОЛЕ", null) || tt.isValue("КОЛЬЦО", null)) || tt.isValue("КІЛЬЦЕ", null)) {
                let sit = StreetItemToken.tryParse(tt.next, null, false, null);
                if (sit !== null && sit.typ === StreetItemType.NAME) {
                    if (sit.value !== null) 
                        sit.value = (sit.value + " " + tt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
                    else 
                        sit.value = (sit.getSourceText().toUpperCase() + " " + tt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
                    if (sit.altValue !== null) 
                        sit.altValue = (sit.altValue + " " + tt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
                    sit.beginToken = tt;
                    return sit;
                }
            }
        }
        if (((tt !== null && tt.lengthChar === 1 && tt.chars.isAllLower) && tt.next !== null && tt.next.isChar('.')) && tt.kit.baseLanguage.isRu) {
            if (tt.isValue("М", null) || tt.isValue("M", null)) {
                if (prev !== null && prev.typ === StreetItemType.NOUN) {
                }
                else if (!inSearch) {
                    let tok1 = StreetItemToken.m_Ontology.tryParse(tt, TerminParseAttr.NO);
                    if (tok1 !== null && tok1.termin.canonicText === "МИКРОРАЙОН") 
                        return StreetItemToken._new562(tt, tok1.endToken, tok1.termin, StreetItemType.NOUN);
                    if (NameToken.checkInitial(tt) !== null || MiscLocationHelper.isUserParamAddress(tt)) {
                    }
                    else 
                        return StreetItemToken._new563(tt, tt.next, StreetItemToken.m_Metro, StreetItemType.NOUN, true);
                }
            }
        }
        let ot = null;
        if (!MiscLocationHelper.isUserParamAddress(t)) {
            if (t.kit.ontology !== null && ot === null) {
                let ots = t.kit.ontology.attachToken(AddressReferent.OBJ_TYPENAME, t);
                if (ots !== null) 
                    ot = ots[0];
            }
            if (ot !== null && ot.beginToken === ot.endToken && ot.morph._class.isAdjective) {
                let tok0 = StreetItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
                if (tok0 !== null) {
                    if ((StreetItemType.of(tok0.termin.tag)) === StreetItemType.STDADJECTIVE) 
                        ot = null;
                }
            }
        }
        if (ot !== null) {
            let res0 = StreetItemToken._new564(ot.beginToken, ot.endToken, StreetItemType.NAME, Utils.as(ot.item.referent, StreetReferent), ot.morph, true);
            return res0;
        }
        if (prev !== null && prev.typ === StreetItemType.NOUN && prev.termin.canonicText === "ПРОЕЗД") {
            if (t.isValue("ПР", null)) {
                let res1 = StreetItemToken._new455(t, t, StreetItemType.NAME, "ПРОЕКТИРУЕМЫЙ");
                if (t.next !== null && t.next.isChar('.')) 
                    res1.endToken = t.next;
                return res1;
            }
        }
        let tok = (ignoreOnto ? null : StreetItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO));
        let tokEx = (ignoreOnto ? null : StreetItemToken.m_OntologyEx.tryParse(t, TerminParseAttr.NO));
        if (tok === null) 
            tok = tokEx;
        else if (tokEx !== null && tokEx.endChar > tok.endChar) 
            tok = tokEx;
        if (tok !== null && (t instanceof TextToken) && ((t.term === "ДОРОГАЯ" || t.term === "ДОРОГОЙ"))) 
            tok = null;
        if ((tok !== null && t.lengthChar === 1 && t.isValue("Б", null)) && (t.previous instanceof NumberToken) && t.previous.value === "26") 
            tok = null;
        if ((tok !== null && tok.termin.canonicText === "БЛОК" && (t instanceof TextToken)) && tok.endToken === t) {
            if (t.term === "БЛОКА") 
                tok = null;
            else if (t.chars.isAllLower) {
            }
            else if (prev !== null && prev.typ === StreetItemType.NOUN && prev.termin.canonicText === "РЯД") {
            }
            else {
                let ait = AddressItemToken.tryParsePureItem(t.next, null, null);
                if (ait !== null && ait.typ === AddressItemType.NUMBER) {
                }
                else 
                    tok = null;
            }
        }
        if (tok !== null && tok.termin.canonicText === "СЕКЦИЯ") {
            if (prev !== null) 
                tok = null;
        }
        if (tok !== null && tok.beginToken === tok.endToken) {
            if (((StreetItemType.of(tok.termin.tag)) === StreetItemType.NAME || t.isValue("ГАРАЖНО", null) || t.lengthChar === 1) || t.isValue("СТ", null)) {
                let _org = OrgItemToken.tryParse(t, null);
                if (_org !== null) {
                    tok = null;
                    if (t.lengthChar < 3) 
                        return StreetItemToken._new294(t, _org.endToken, StreetItemType.FIX, _org);
                }
            }
            else if ((StreetItemType.of(tok.termin.tag)) === StreetItemType.STDADJECTIVE && (t instanceof TextToken) && t.term.endsWith("О")) 
                tok = null;
            else if ((StreetItemType.of(tok.termin.tag)) === StreetItemType.NOUN && t.isValue("САД", null) && t.previous !== null) {
                if (t.previous.isValue("ДЕТСКИЙ", null)) 
                    tok = null;
                else if (t.previous.isHiphen && t.previous.previous !== null && t.previous.previous.isValue("ЯСЛИ", null)) 
                    tok = null;
            }
        }
        if (tok !== null && !ignoreOnto) {
            if ((StreetItemType.of(tok.termin.tag)) === StreetItemType.NUMBER) {
                if ((tok.endToken.next instanceof NumberToken) && tok.endToken.next.intValue !== null) 
                    return StreetItemToken._new567(t, tok.endToken.next, StreetItemType.NUMBER, tok.endToken.next.value, tok.endToken.next.typ, true, tok.morph);
                return null;
            }
            if (tt === null) 
                return null;
            let abr = true;
            switch (StreetItemType.of(tok.termin.tag)) { 
            case StreetItemType.STDADJECTIVE: {
                let tt3 = NameToken.checkInitial(tok.beginToken);
                if (tt3 !== null) {
                    let _next = StreetItemToken.tryParse(tt3, prev, inSearch, null);
                    if (_next !== null && _next.typ !== StreetItemType.NOUN) {
                        if (_next.value === null) 
                            _next.value = MiscHelper.getTextValueOfMetaToken(_next, GetTextAttr.NO);
                        _next.beginToken = t0;
                        return _next;
                    }
                }
                if (tt.chars.isAllLower && prev === null && !inSearch) {
                    if (!MiscLocationHelper.isUserParamAddress(tok)) 
                        return null;
                }
                if (tt.isValue(tok.termin.canonicText, null)) 
                    abr = false;
                else if (tt.lengthChar === 1) {
                    if (!tt.isWhitespaceBefore && !tt.previous.isCharOf(":,.")) 
                        break;
                    if (!tok.endToken.isChar('.')) {
                        let oo2 = false;
                        if (!tt.chars.isAllUpper && !inSearch) {
                            if ((tt.isCharOf("мб") && (tt.previous instanceof TextToken) && tt.previous.chars.isCapitalUpper) && AddressItemToken.checkHouseAfter(tt.next, false, false)) 
                                oo2 = true;
                            else 
                                break;
                        }
                        if (tok.endToken.isNewlineAfter && prev !== null && prev.typ !== StreetItemType.NOUN) 
                            oo2 = true;
                        else if (inSearch) 
                            oo2 = true;
                        else {
                            let _next = StreetItemToken.tryParse(tok.endToken.next, null, false, null);
                            if (_next !== null && ((_next.typ === StreetItemType.NAME || _next.typ === StreetItemType.NOUN))) 
                                oo2 = true;
                            else if (AddressItemToken.checkHouseAfter(tok.endToken.next, false, true) && prev !== null) 
                                oo2 = true;
                        }
                        if (oo2) 
                            return StreetItemToken._new568(tok.beginToken, tok.endToken, StreetItemType.STDADJECTIVE, tok.termin, abr, tok.morph);
                        break;
                    }
                    let tt2 = tok.endToken.next;
                    if (tt2 !== null && tt2.isHiphen) 
                        tt2 = tt2.next;
                    if (tt2 instanceof TextToken) {
                        if (tt2.lengthChar === 1 && tt2.chars.isAllUpper) 
                            break;
                        if (tt2.chars.isCapitalUpper) {
                            let isSur = false;
                            let txt = tt2.term;
                            if (LanguageHelper.endsWith(txt, "ОГО")) 
                                isSur = true;
                            else 
                                for (const wf of tt2.morph.items) {
                                    if (wf._class.isProperSurname && wf.isInDictionary) {
                                        if (wf._case.isGenitive) {
                                            isSur = true;
                                            break;
                                        }
                                    }
                                }
                            if (isSur) 
                                break;
                        }
                    }
                }
                let res1 = StreetItemToken._new568(tok.beginToken, tok.endToken, StreetItemType.STDADJECTIVE, tok.termin, abr, tok.morph);
                let toks = StreetItemToken.m_Ontology.tryParseAll(tok.beginToken, TerminParseAttr.NO);
                if (toks !== null && toks.length > 1) 
                    res1.altTermin = toks[1].termin;
                return res1;
            }
            case StreetItemType.NOUN: {
                if ((tt.isValue(tok.termin.canonicText, null) || tok.endToken.isValue(tok.termin.canonicText, null) || tt.isValue("УЛ", null)) || tok.termin.canonicText === "НАБЕРЕЖНАЯ") 
                    abr = false;
                else if (tok.beginToken !== tok.endToken && ((tok.beginToken.next.isHiphen || tok.beginToken.next.isCharOf("/\\")))) {
                }
                else if (!tt.chars.isAllLower && tt.lengthChar === 1) 
                    break;
                else if (tt.lengthChar === 1) {
                    if (!tt.isWhitespaceBefore) {
                        if (tt.previous !== null && tt.previous.isCharOf(",")) {
                        }
                        else 
                            return null;
                    }
                    if (tok.endToken.isChar('.')) {
                    }
                    else if (tok.beginToken !== tok.endToken && tok.beginToken.next !== null && ((tok.beginToken.next.isHiphen || tok.beginToken.next.isCharOf("/\\")))) {
                    }
                    else if (tok.lengthChar > 5) {
                    }
                    else if (tok.beginToken === tok.endToken && tt.isValue("Ш", null) && tt.chars.isAllLower) {
                        if (prev !== null && ((prev.typ === StreetItemType.NAME || prev.typ === StreetItemType.STDNAME || prev.typ === StreetItemType.STDPARTOFNAME))) {
                        }
                        else {
                            let sii = StreetItemToken.tryParse(tt.next, null, false, null);
                            if (sii !== null && (((sii.typ === StreetItemType.NAME || sii.typ === StreetItemType.STDNAME || sii.typ === StreetItemType.STDPARTOFNAME) || sii.typ === StreetItemType.AGE))) {
                            }
                            else 
                                return null;
                        }
                    }
                    else 
                        return null;
                }
                else if (tt.term === "КВ" && !tok.endToken.isValue("Л", null)) {
                    if (prev !== null && prev.typ === StreetItemType.NUMBER) 
                        return null;
                    let ait = AddressItemToken.tryParsePureItem(tok.endToken.next, null, null);
                    if (ait !== null && ait.typ === AddressItemType.NUMBER) {
                        if (AddressItemToken.checkHouseAfter(ait.endToken.next, false, false)) {
                        }
                        else if (AddressItemToken.checkStreetAfter(ait.endToken.next, false)) {
                        }
                        else 
                            return null;
                    }
                    else if (tok.endToken.next !== null && tok.endToken.next.isValue("НЕТ", null)) 
                        return null;
                }
                if ((tok.endToken === tok.beginToken && !t.chars.isAllLower && t.morph._class.isProperSurname) && t.chars.isCyrillicLetter) {
                    if (((t.morph.number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value()) && !MiscLocationHelper.isUserParamAddress(t)) 
                        return null;
                }
                if (tt.term === "ДОРОГОЙ" || tt.term === "РЯДОМ") 
                    return null;
                let alt = null;
                if (tok.beginToken.isValue("ПР", null) && ((tok.beginToken === tok.endToken || tok.beginToken.next.isChar('.')))) 
                    alt = StreetItemToken.m_Prospect;
                let res = StreetItemToken._new570(tok.beginToken, tok.endToken, StreetItemType.NOUN, tok.termin, alt, abr, tok.morph, ((typeof tok.termin.tag2 === 'number' || tok.termin.tag2 instanceof Number) ? tok.termin.tag2 : 0));
                let mc = tok.beginToken.getMorphClassInDictionary();
                if ((!abr && tok.beginToken === tok.endToken && tok.beginToken.chars.isCapitalUpper) && ((mc.isNoun || mc.isAdjective))) {
                    if (tok.morph._case.isNominative && !tok.morph._case.isGenitive) 
                        res.nounCanBeName = true;
                    else if ((t.next !== null && t.next.isHiphen && (t.next.next instanceof NumberToken)) && !t.chars.isAllLower) 
                        res.nounCanBeName = true;
                }
                if (res.isRoad) {
                    let _next = StreetItemToken._tryParse(res.endToken.next, false, null, false);
                    if (_next !== null && _next.isRoad) {
                        res.endToken = _next.endToken;
                        res.nounIsDoubtCoef = 0;
                        res.isAbridge = false;
                    }
                }
                return res;
            }
            case StreetItemType.STDNAME: {
                let isPostOff = tok.termin.canonicText === "ПОЧТОВОЕ ОТДЕЛЕНИЕ" || tok.termin.canonicText === "ПРОЕКТИРУЕМЫЙ";
                if (((t.lengthChar === 1 && t.next !== null && t.next.isChar('.')) && t.next.next !== null && t.next.next.lengthChar === 1) && t.next.next.next.endChar <= tok.endChar) {
                    let _next = StreetItemToken._tryParse(tok.endToken.next, ignoreOnto, prev, inSearch);
                    if (_next !== null && ((_next.typ === StreetItemType.NAME || _next.typ === StreetItemType.STDNAME))) {
                        _next.value = MiscHelper.getTextValueOfMetaToken(_next, GetTextAttr.NO);
                        _next.beginToken = t;
                        return _next;
                    }
                }
                if (tok.beginToken.chars.isAllLower && !isPostOff && tok.endToken.chars.isAllLower) {
                    if (StreetItemToken.checkKeyword(tok.endToken.next)) {
                    }
                    else if (prev !== null && ((prev.typ === StreetItemType.NUMBER || prev.typ === StreetItemType.NOUN || prev.typ === StreetItemType.AGE))) {
                    }
                    else if (MiscLocationHelper.isUserParamAddress(tok)) {
                    }
                    else 
                        return null;
                }
                let sits = StreetItemToken._new571(tok.beginToken, tok.endToken, StreetItemType.STDNAME, tok.morph, tok.termin.canonicText);
                if (tok.termin.additionalVars !== null && tok.termin.additionalVars.length > 0 && !tok.termin.additionalVars[0].canonicText.startsWith("ПАРТ")) {
                    if (tok.termin.additionalVars[0].canonicText.indexOf(' ') < 0) {
                        sits.altValue = sits.value;
                        sits.value = tok.termin.additionalVars[0].canonicText;
                    }
                    else 
                        sits.altValue = tok.termin.additionalVars[0].canonicText;
                    let ii = sits.altValue.indexOf(sits.value);
                    if (ii >= 0) {
                        if (ii > 0) 
                            sits.misc = sits.altValue.substring(0, 0 + ii).trim();
                        else 
                            sits.misc = sits.altValue.substring(sits.value.length).trim();
                        sits.altValue = null;
                    }
                }
                if (tok.beginToken !== tok.endToken && !isPostOff) {
                    if (tok.beginToken.next === tok.endToken) {
                        if (tok.endToken.getMorphClassInDictionary().isNoun && tok.beginToken.getMorphClassInDictionary().isAdjective) {
                        }
                        else if (((StreetItemToken.m_StdOntMisc.tryParse(tok.beginToken, TerminParseAttr.NO) !== null || tok.beginToken.getMorphClassInDictionary().isProperName || (tok.beginToken.lengthChar < 4))) && tok.endToken.lengthChar > 2 && ((tok.endToken.morph._class.isProperSurname || !tok.endToken.getMorphClassInDictionary().isProperName))) 
                            sits.altValue2 = MiscHelper.getTextValue(tok.endToken, tok.endToken, GetTextAttr.NO);
                        else if (((tok.endToken.getMorphClassInDictionary().isProperName || StreetItemToken.m_StdOntMisc.tryParse(tok.endToken, TerminParseAttr.NO) !== null)) && (tok.beginToken.morph._class.isProperSurname)) 
                            sits.altValue2 = MiscHelper.getTextValue(tok.beginToken, tok.beginToken, GetTextAttr.NO);
                    }
                }
                return sits;
            }
            case StreetItemType.STDPARTOFNAME: {
                let tt1 = tok.endToken;
                let vvv = tok.termin.canonicText;
                if ((tt1.next instanceof NumberToken) && tt1.next.next !== null && tt1.next.next.isValue("РАНГ", null)) 
                    tt1 = tt1.next.next;
                let tok2 = StreetItemToken.m_Ontology.tryParse(tt1.next, TerminParseAttr.NO);
                if (tok2 !== null && (StreetItemType.of(tok2.termin.tag)) === StreetItemType.STDPARTOFNAME) {
                    tt1 = tok2.endToken;
                    vvv = (vvv + " " + tok2.termin.canonicText);
                }
                let sit = StreetItemToken.tryParse(tt1.next, null, false, null);
                if (sit !== null && sit.typ === StreetItemType.STDADJECTIVE && tt1.next.lengthChar === 1) 
                    sit = StreetItemToken.tryParse(sit.endToken.next, null, false, null);
                if (sit === null || tt1.whitespacesAfterCount > 3) {
                    for (const m of tok.morph.items) {
                        if (m.number === MorphNumber.PLURAL && m._case.isGenitive) 
                            return StreetItemToken._new571(tok.beginToken, tt1, StreetItemType.NAME, tok.morph, MiscHelper.getTextValueOfMetaToken(tok, GetTextAttr.NO));
                    }
                    return StreetItemToken._new573(tok.beginToken, tt1, StreetItemType.STDPARTOFNAME, tok.morph, tok.termin);
                }
                if (sit.typ !== StreetItemType.NAME && sit.typ !== StreetItemType.NOUN && sit.typ !== StreetItemType.STDNAME) 
                    return null;
                if (sit.typ === StreetItemType.NOUN) {
                    if (tok.morph.number === MorphNumber.PLURAL) 
                        return StreetItemToken._new574(tok.beginToken, tt1, StreetItemType.NAME, StreetItemType.STDPARTOFNAME, tok.morph, MiscHelper.getTextValueOfMetaToken(tok, GetTextAttr.NO));
                    else 
                        return StreetItemToken._new575(tok.beginToken, tt1, StreetItemType.NAME, StreetItemType.STDPARTOFNAME, tok.morph, tok.termin);
                }
                if (sit.value !== null) 
                    sit.misc = vvv;
                else if (sit.existStreet === null) {
                    if (vvv === "ГЕРОЯ") {
                        if (sit.beginToken.getMorphClassInDictionary().isProperSurname) 
                            sit.value = MiscHelper.getTextValueOfMetaToken(sit, GetTextAttr.NO);
                        else 
                            sit.value = "ГЕРОЕВ " + MiscHelper.getTextValueOfMetaToken(sit, GetTextAttr.NO);
                    }
                    else {
                        sit.misc = vvv;
                        sit.value = MiscHelper.getTextValueOfMetaToken(sit, GetTextAttr.NO);
                    }
                }
                sit.beginToken = tok.beginToken;
                return sit;
            }
            case StreetItemType.NAME: {
                if (tok.beginToken.chars.isAllLower) {
                    if (prev !== null && prev.typ === StreetItemType.STDADJECTIVE) {
                    }
                    else if (prev !== null && prev.typ === StreetItemType.NOUN && AddressItemToken.checkHouseAfter(tok.endToken.next, true, false)) {
                    }
                    else if (t.isValue("ПРОЕКТИРУЕМЫЙ", null) || t.isValue("МИРА", null)) {
                    }
                    else {
                        let nex = StreetItemToken.tryParse(tok.endToken.next, null, false, null);
                        if (nex !== null && nex.typ === StreetItemType.NOUN) {
                            let tt2 = nex.endToken.next;
                            while (tt2 !== null && tt2.isCharOf(",.")) {
                                tt2 = tt2.next;
                            }
                            if (tt2 === null || tt2.whitespacesBeforeCount > 1) 
                                return null;
                            if (AddressItemToken.checkHouseAfter(tt2, false, true)) {
                            }
                            else 
                                return null;
                        }
                        else 
                            return null;
                    }
                }
                let sit0 = StreetItemToken.tryParse(tok.beginToken, prev, true, null);
                if (sit0 !== null && sit0.typ === StreetItemType.NAME && sit0.endChar > tok.endChar) {
                    sit0.isInDictionary = true;
                    return sit0;
                }
                let sit1 = StreetItemToken._new576(tok.beginToken, tok.endToken, StreetItemType.NAME, tok.morph, true);
                if ((!tok.isWhitespaceAfter && tok.endToken.next !== null && tok.endToken.next.isHiphen) && !tok.endToken.next.isWhitespaceAfter) {
                    let sit2 = StreetItemToken.tryParse(tok.endToken.next.next, null, false, null);
                    if (sit2 !== null && ((sit2.typ === StreetItemType.NAME || sit2.typ === StreetItemType.STDPARTOFNAME || sit2.typ === StreetItemType.STDNAME))) 
                        sit1.endToken = sit2.endToken;
                }
                if (npt !== null && (sit1.endChar < npt.endChar) && StreetItemToken.m_Ontology.tryParse(npt.endToken, TerminParseAttr.NO) === null) {
                    let sit2 = StreetItemToken._tryParse(t, true, prev, inSearch);
                    if (sit2 !== null && sit2.endChar > sit1.endChar) 
                        return sit2;
                }
                return sit1;
            }
            case StreetItemType.FIX: {
                return StreetItemToken._new577(tok.beginToken, tok.endToken, StreetItemType.FIX, tok.morph, true, tok.termin);
            }
            }
        }
        if (tt !== null && ((tt.isValue("КИЛОМЕТР", null) || tt.isValue("КМ", null)))) {
            let tt1 = tt;
            if (tt1.next !== null && tt1.next.isChar('.')) 
                tt1 = tt1.next;
            if ((tt1.whitespacesAfterCount < 3) && (tt1.next instanceof NumberToken)) {
                let sit = StreetItemToken._new469(tt, tt1.next, StreetItemType.NUMBER);
                sit.value = tt1.next.value;
                sit.numberType = tt1.next.typ;
                sit.isNumberKm = true;
                let isPlus = false;
                let tt2 = sit.endToken.next;
                if (tt2 !== null && ((tt2.isHiphen || tt2.isChar('+')))) {
                    isPlus = tt2.isChar('+');
                    tt2 = tt2.next;
                }
                let nex2 = NumberHelper.tryParseNumberWithPostfix(tt2);
                if (nex2 !== null && nex2.exTyp === NumberExType.METER) {
                    sit.endToken = nex2.endToken;
                    let mm = NumberHelper.doubleToString(nex2.realValue / (1000));
                    if (mm.startsWith("0.")) 
                        sit.value += mm.substring(1);
                }
                else if ((tt2 instanceof NumberToken) && isPlus) {
                    let dw = tt2.realValue;
                    if (dw > 0 && (dw < 1000)) {
                        sit.endToken = tt2;
                        let mm = NumberHelper.doubleToString(dw / (1000));
                        if (mm.startsWith("0.")) 
                            sit.value += mm.substring(1);
                    }
                }
                return sit;
            }
            let _next = StreetItemToken.tryParse(tt.next, null, inSearch, null);
            if (_next !== null && ((_next.isRailway || _next.isRoad))) {
                _next.beginToken = tt;
                return _next;
            }
        }
        let tokn = NameToken.M_ONTO.tryParse(tt, TerminParseAttr.NO);
        if (tokn !== null) 
            return StreetItemToken._new455(tt, tokn.endToken, StreetItemType.NAME, tokn.termin.canonicText);
        if (tt !== null) {
            if (((tt.isValue("РЕКА", null) || tt.isValue("РЕЧКА", "РІЧКА"))) && tt.next !== null && ((!tt.next.chars.isAllLower || MiscLocationHelper.isUserParamAddress(tt)))) {
                let nam = NameToken.tryParse(tt.next, GeoTokenType.CITY, 0, false);
                if (nam !== null && nam.name !== null && nam.number === null) 
                    return StreetItemToken._new580(tt, nam.endToken, StreetItemType.NAME, tt.morph, "реки", nam.name);
            }
            if ((tt.isValue("Р", null) && prev !== null && prev.termin !== null) && prev.termin.canonicText === "НАБЕРЕЖНАЯ") {
                let tt2 = tt.next;
                if (tt2 !== null && tt2.isChar('.')) 
                    tt2 = tt2.next;
                let nam = NameToken.tryParse(tt2, GeoTokenType.CITY, 0, false);
                if (nam !== null && nam.name !== null && nam.number === null) 
                    return StreetItemToken._new580(tt, nam.endToken, StreetItemType.NAME, tt.morph, "реки", nam.name);
            }
            if (tt.isValue("КАДАСТРОВЫЙ", null)) {
                let _next = StreetItemToken.tryParse(tt.next, prev, inSearch, null);
                if (_next !== null && _next.typ === StreetItemType.NOUN && _next.termin.canonicText === "КВАРТАЛ") {
                    _next.beginToken = tt;
                    return _next;
                }
            }
            if ((t.previous instanceof NumberToken) && t.previous.value === "26") {
                if (tt.isValue("БАКИНСКИЙ", null) || "БАКИНСК".startsWith(tt.term)) {
                    let tt2 = tt;
                    if (tt2.next !== null && tt2.next.isChar('.')) 
                        tt2 = tt2.next;
                    if (tt2.next instanceof TextToken) {
                        tt2 = tt2.next;
                        if (tt2.isValue("КОМИССАР", null) || tt2.isValue("КОММИССАР", null) || "КОМИС".startsWith(tt2.term)) {
                            if (tt2.next !== null && tt2.next.isChar('.')) 
                                tt2 = tt2.next;
                            let sit = StreetItemToken._new582(tt, tt2, StreetItemType.STDNAME, true, "БАКИНСКИХ КОМИССАРОВ", tt2.morph);
                            return sit;
                        }
                    }
                }
            }
            if ((tt.next !== null && ((tt.next.isChar('.') || ((tt.next.isHiphen && tt.lengthChar === 1)))) && ((!tt.chars.isAllLower || MiscLocationHelper.isUserParamAddress(tt)))) && (tt.next.whitespacesAfterCount < 3) && (tt.next.next instanceof TextToken)) {
                let tt1 = tt.next.next;
                if (tt1 !== null && tt1.isHiphen && tt1.next !== null) 
                    tt1 = tt1.next;
                if (tt.lengthChar === 1 && tt1.lengthChar === 1 && (tt1.next instanceof TextToken)) {
                    if (tt1.isAnd && tt1.next.chars.isAllUpper && tt1.next.lengthChar === 1) 
                        tt1 = tt1.next;
                    if ((tt1.chars.isAllUpper && tt1.next.isChar('.') && (tt1.next.whitespacesAfterCount < 3)) && (tt1.next.next instanceof TextToken)) 
                        tt1 = tt1.next.next;
                    else if ((tt1.chars.isAllUpper && (tt1.whitespacesAfterCount < 3) && (tt1.next instanceof TextToken)) && !tt1.next.chars.isAllLower) 
                        tt1 = tt1.next;
                }
                let sit = StreetItemToken.tryParse(tt1, null, false, null);
                if (sit !== null) {
                    let ait = AddressItemToken.tryParsePureItem(tt, null, null);
                    if (ait !== null) {
                        if (ait.value !== null && ait.value !== "0") 
                            sit = null;
                    }
                }
                if (sit !== null && (tt1 instanceof TextToken)) {
                    let str = tt1.term;
                    let ok = false;
                    let mc = tt1.getMorphClassInDictionary();
                    let cla = tt.next.next.getMorphClassInDictionary();
                    if (sit.isInDictionary) 
                        ok = true;
                    else if (sit._isSurname() || cla.isProperSurname) 
                        ok = true;
                    else if (LanguageHelper.endsWith(str, "ОЙ") && ((cla.isProperSurname || ((sit.typ === StreetItemType.NAME && sit.isInDictionary))))) 
                        ok = true;
                    else if (LanguageHelper.endsWithEx(str, "ГО", "ИХ", "ЫХ", null)) 
                        ok = true;
                    else if ((tt1.isWhitespaceBefore && !mc.isUndefined && !mc.isProperSurname) && !mc.isProperName) {
                        if (AddressItemToken.checkHouseAfter(sit.endToken.next, false, true)) 
                            ok = true;
                    }
                    else if (prev !== null && prev.typ === StreetItemType.NOUN && ((!prev.isAbridge || prev.lengthChar > 2))) 
                        ok = true;
                    else if ((prev !== null && prev.typ === StreetItemType.NAME && sit.typ === StreetItemType.NOUN) && AddressItemToken.checkHouseAfter(sit.endToken.next, false, true)) 
                        ok = true;
                    else if (sit.typ === StreetItemType.NAME && AddressItemToken.checkHouseAfter(sit.endToken.next, false, true)) {
                        if (MiscLocationHelper.checkGeoObjectBefore(tt, false)) 
                            ok = true;
                        else {
                            let ad = GeoAnalyzer.getData(t);
                            if (!ad.sRegime && StreetItemToken.SPEED_REGIME) {
                                ok = true;
                                sit.cond = Condition._new583(tt, true);
                            }
                        }
                    }
                    if (!ok && MiscLocationHelper.isUserParamAddress(tt) && ((sit.typ === StreetItemType.NAME || sit.typ === StreetItemType.STDADJECTIVE))) {
                        let sit1 = StreetItemToken.tryParse(sit.endToken.next, null, false, null);
                        if (sit1 !== null && sit1.typ === StreetItemType.NOUN) 
                            ok = true;
                        else if (AddressItemToken.checkHouseAfter(sit.endToken.next, true, false)) 
                            ok = true;
                        else if (sit.endToken.isNewlineAfter) 
                            ok = true;
                    }
                    if (ok) {
                        sit.beginToken = tt;
                        if (sit.value === null) 
                            sit.value = str;
                        if (tok !== null && (StreetItemType.of(tok.termin.tag)) === StreetItemType.STDADJECTIVE && !hasNamed) {
                            if ((tok.endToken.next instanceof TextToken) && tok.endToken.next.lengthChar === 1 && tok.endToken.next.chars.isLetter) {
                            }
                            else {
                                sit.stdAdjVersion = StreetItemToken._new584(tok.beginToken, tok.endToken, StreetItemType.STDADJECTIVE, tok.termin, true);
                                let toks2 = StreetItemToken.m_Ontology.tryParseAll(tok.beginToken, TerminParseAttr.NO);
                                if (toks2 !== null && toks2.length > 1) 
                                    sit.stdAdjVersion.altTermin = toks2[1].termin;
                            }
                        }
                        return sit;
                    }
                }
            }
            if (tt.chars.isCyrillicLetter && tt.lengthChar > 1 && !tt.morph._class.isPreposition) {
                if (((tt.isValue("ОБЪЕЗД", null) || tt.isValue("ОБХОД", null))) && tt.next !== null) {
                    if (prev === null) 
                        return null;
                    if (prev.isRoad) {
                        let cits = CityItemToken.tryParseList(tt.next, 3, null);
                        if (cits !== null && (cits.length < 3)) {
                            let resr = StreetItemToken._new585(tt, cits[cits.length - 1].endToken, StreetItemType.NAME, true);
                            for (const ci of cits) {
                                if (ci.typ === CityItemTokenItemType.CITY || ci.typ === CityItemTokenItemType.PROPERNAME) {
                                    resr.value = "ОБЪЕЗД " + MiscHelper.getTextValueOfMetaToken(ci, GetTextAttr.NO);
                                    break;
                                }
                            }
                            if (resr.value !== null) 
                                return resr;
                        }
                    }
                }
                if ((tt.isValue("ГЕРОЙ", null) || tt.isValue("ЗАЩИТНИК", "ЗАХИСНИК") || tt.isValue("ОБРАЗОВАНИЕ", null)) || tt.isValue("ОСВОБОДИТЕЛЬ", "ВИЗВОЛИТЕЛЬ") || tt.isValue("КОНСТИТУЦИЯ", null)) {
                    let tt2 = null;
                    if ((tt.next instanceof ReferentToken) && (tt.next.getReferent() instanceof GeoReferent)) 
                        tt2 = tt.next;
                    else {
                        let npt2 = MiscLocationHelper.tryParseNpt(tt.next);
                        if (npt2 !== null && npt2.morph._case.isGenitive) 
                            tt2 = npt2.endToken;
                        else {
                            let tee = TerrItemToken.checkOntoItem(tt.next);
                            if (tee !== null) 
                                tt2 = tee.endToken;
                            else if ((((tee = CityItemToken.checkOntoItem(tt.next)))) !== null) 
                                tt2 = tee.endToken;
                        }
                    }
                    if (tt2 !== null) {
                        let re = StreetItemToken._new586(tt, tt2, StreetItemType.STDPARTOFNAME, MiscHelper.getTextValue(tt, tt2, GetTextAttr.NO), true);
                        let sit = StreetItemToken.tryParse(tt2.next, null, false, null);
                        if (sit === null || sit.typ !== StreetItemType.NAME) {
                            let ok2 = false;
                            if (sit !== null && ((sit.typ === StreetItemType.STDADJECTIVE || sit.typ === StreetItemType.NOUN))) 
                                ok2 = true;
                            else if (AddressItemToken.checkHouseAfter(tt2.next, false, true)) 
                                ok2 = true;
                            else if (tt2.isNewlineAfter) 
                                ok2 = true;
                            if (ok2) {
                                sit = StreetItemToken._new469(tt, tt2, StreetItemType.NAME);
                                sit.value = MiscHelper.getTextValue(tt, tt2, GetTextAttr.NO);
                                if (!tt.isValue("ОБРАЗОВАНИЕ", null)) 
                                    sit.noGeoInThisToken = true;
                                return sit;
                            }
                            return re;
                        }
                        if (sit.value === null) 
                            sit.value = MiscHelper.getTextValueOfMetaToken(sit, GetTextAttr.NO);
                        if (sit.altValue === null) {
                            sit.altValue = sit.value;
                            sit.value = (re.value + " " + sit.value);
                        }
                        else 
                            sit.value = (re.value + " " + sit.value);
                        sit.beginToken = tt;
                        return sit;
                    }
                }
                let ani = NumberHelper.tryParseAnniversary(t);
                if (ani !== null) 
                    return StreetItemToken._new588(t, ani.endToken, StreetItemType.AGE, NumberSpellingType.AGE, ani.value);
                let num1 = NumToken.tryParse(t, GeoTokenType.STREET);
                if (num1 !== null) 
                    return StreetItemToken._new588(t, num1.endToken, StreetItemType.NUMBER, NumberSpellingType.ROMAN, num1.value);
                if (prev !== null && prev.typ === StreetItemType.NOUN) {
                }
                else {
                    let _org = OrgItemToken.tryParse(t, null);
                    if (_org !== null) {
                        if (_org.isGsk || _org.hasTerrKeyword) 
                            return StreetItemToken._new294(t, _org.endToken, StreetItemType.FIX, _org);
                    }
                }
                let ok1 = false;
                let _cond = null;
                if (!tt.chars.isAllLower) {
                    let ait = AddressItemToken.tryParsePureItem(tt, null, null);
                    if (ait !== null) {
                        if (tt.next !== null && tt.next.isHiphen) 
                            ok1 = true;
                        else if (tt.isValue("БЛОК", null) || tt.isValue("ДОС", null) || ait.endToken.isValue("БЛОК", null)) 
                            ok1 = true;
                    }
                    else 
                        ok1 = true;
                }
                else if (prev !== null && ((prev.typ === StreetItemType.NOUN || ((prev.typ === StreetItemType.STDADJECTIVE && t.previous.isHiphen)) || ((prev.typ === StreetItemType.NUMBER && MiscLocationHelper.isUserParamAddress(prev)))))) {
                    if (AddressItemToken.checkHouseAfter(tt.next, false, false)) {
                        if (!AddressItemToken.checkHouseAfter(tt, false, false)) 
                            ok1 = true;
                    }
                    if (!ok1) {
                        let tt1 = prev.beginToken.previous;
                        if (tt1 !== null && tt1.isComma) 
                            tt1 = tt1.previous;
                        if (tt1 !== null && (tt1.getReferent() instanceof GeoReferent)) 
                            ok1 = true;
                        else if (MiscLocationHelper.isUserParamAddress(prev) && !AddressItemToken.checkHouseAfter(tt, false, false)) 
                            ok1 = true;
                        else if (t.previous !== null && t.previous.isHiphen) 
                            ok1 = true;
                        else {
                            let ad = GeoAnalyzer.getData(t);
                            if (!ad.sRegime && StreetItemToken.SPEED_REGIME) {
                                ok1 = true;
                                _cond = Condition._new583(prev.beginToken, true);
                            }
                        }
                    }
                }
                else if (tt.whitespacesAfterCount < 2) {
                    let nex = StreetItemToken.m_Ontology.tryParse(tt.next, TerminParseAttr.NO);
                    if (nex !== null && nex.termin !== null) {
                        if (nex.termin.canonicText === "ПЛОЩАДЬ") {
                            if (tt.isValue("ОБЩИЙ", null)) 
                                return null;
                        }
                        let tt1 = tt.previous;
                        if (tt1 !== null && tt1.isComma) 
                            tt1 = tt1.previous;
                        if (tt1 !== null && (tt1.getReferent() instanceof GeoReferent)) 
                            ok1 = true;
                        else if (AddressItemToken.checkHouseAfter(nex.endToken.next, false, false)) 
                            ok1 = true;
                        else if (MiscLocationHelper.isUserParamAddress(tt)) 
                            ok1 = true;
                    }
                    else if (MiscLocationHelper.isUserParamAddress(tt) && tt.lengthChar > 3) {
                        if (AddressItemToken.tryParsePureItem(tt, null, null) === null) 
                            ok1 = true;
                    }
                }
                else if (tt.isNewlineAfter && tt.lengthChar > 2 && MiscLocationHelper.isUserParamAddress(tt)) 
                    ok1 = true;
                if (ok1) {
                    let dc = tt.getMorphClassInDictionary();
                    if (dc.isAdverb && !MiscLocationHelper.isUserParamAddress(tt)) {
                        if (!(dc.isProper)) {
                            if (tt.next !== null && tt.next.isHiphen) {
                            }
                            else 
                                return null;
                        }
                    }
                    let res = StreetItemToken._new592(tt, tt, StreetItemType.NAME, tt.morph, _cond);
                    if ((tt.next !== null && (tt.next.isHiphen) && (tt.next.next instanceof TextToken)) && !tt.isWhitespaceAfter && !tt.next.isWhitespaceAfter) {
                        let ok2 = AddressItemToken.checkHouseAfter(tt.next.next.next, false, false) || tt.next.next.isNewlineAfter;
                        if (!ok2) {
                            let te2 = StreetItemToken.tryParse(tt.next.next.next, null, false, null);
                            if (te2 !== null && te2.typ === StreetItemType.NOUN) 
                                ok2 = true;
                        }
                        if (((!ok2 && tt.next.isHiphen && !tt.isWhitespaceAfter) && !tt.next.isWhitespaceAfter && (tt.next.next instanceof TextToken)) && tt.next.next.lengthChar > 3) 
                            ok2 = true;
                        if (ok2) {
                            res.endToken = tt.next.next;
                            res.value = (MiscHelper.getTextValue(tt, tt, GetTextAttr.NO) + " " + MiscHelper.getTextValue(res.endToken, res.endToken, GetTextAttr.NO));
                        }
                    }
                    else if ((tt.whitespacesAfterCount < 2) && (tt.next instanceof TextToken) && tt.next.chars.isLetter) {
                        if (tt.next.isValue("БИ", null)) {
                            if (res.value === null) 
                                res.value = MiscHelper.getTextValue(tt, tt, GetTextAttr.NO);
                            res.endToken = tt.next;
                            res.value = (res.value + " " + tt.next.term);
                            if (res.altValue !== null) 
                                res.altValue = (res.altValue + " " + tt.next.term);
                        }
                        else if (!AddressItemToken.checkHouseAfter(tt.next, false, false) || tt.next.isNewlineAfter) {
                            let tt1 = tt.next;
                            let isPref = false;
                            if ((tt1 instanceof TextToken) && tt1.chars.isAllLower) {
                                if (tt1.isValue("ДЕ", null) || tt1.isValue("ЛА", null)) {
                                    tt1 = tt1.next;
                                    isPref = true;
                                }
                            }
                            let nn = StreetItemToken.tryParse(tt1, null, false, null);
                            if (nn === null || nn.typ === StreetItemType.NAME) {
                                npt = MiscLocationHelper.tryParseNpt(tt);
                                if (npt !== null) {
                                    if (npt.beginToken === npt.endToken) 
                                        npt = null;
                                    else if (StreetItemToken.m_Ontology.tryParse(npt.endToken, TerminParseAttr.NO) !== null) 
                                        npt = null;
                                }
                                if (npt !== null && ((npt.isNewlineAfter || AddressItemToken.checkHouseAfter(npt.endToken.next, false, false) || ((npt.endToken.next !== null && npt.endToken.next.isCommaAnd))))) {
                                    res.endToken = npt.endToken;
                                    if (npt.morph._case.isGenitive) {
                                        res.value = MiscHelper.getTextValueOfMetaToken(npt, GetTextAttr.NO);
                                        res.altValue = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                                    }
                                    else {
                                        res.value = npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                                        res.altValue = MiscHelper.getTextValueOfMetaToken(npt, GetTextAttr.NO);
                                    }
                                }
                                else if ((tt1.lengthChar > 2 && AddressItemToken.checkHouseAfter(tt1.next, false, false) && tt1.chars.isCyrillicLetter === tt.chars.isCyrillicLetter) && (t.whitespacesAfterCount < 2)) {
                                    if (tt1.morph._class.isVerb && !tt1.isValue("ДАЛИ", null)) {
                                    }
                                    else if (npt === null && !tt1.chars.isAllLower && !isPref) {
                                    }
                                    else {
                                        res.endToken = tt1;
                                        res.value = (MiscHelper.getTextValue(res.beginToken, res.beginToken, GetTextAttr.NO) + " " + MiscHelper.getTextValue(res.endToken, res.endToken, GetTextAttr.NO));
                                    }
                                }
                                else if ((nn !== null && t.lengthChar > 3 && nn.beginToken === nn.endToken) && t.getMorphClassInDictionary().isProperName && nn.beginToken.morph._class.isProperSurname) {
                                    res.endToken = nn.endToken;
                                    res.value = MiscHelper.getTextValueOfMetaToken(nn, GetTextAttr.NO);
                                    res.misc = MiscHelper.getTextValue(t, t, GetTextAttr.NO);
                                }
                            }
                            else if (nn.typ === StreetItemType.NOUN) {
                                let gen = nn.termin.gender;
                                if (gen === MorphGender.UNDEFINED) {
                                    npt = MiscLocationHelper.tryParseNpt(tt);
                                    if (npt !== null && npt.endToken === nn.endToken) 
                                        gen = npt.morph.gender;
                                    else if (prev !== null && prev.typ === StreetItemType.NOUN) 
                                        gen = prev.termin.gender;
                                }
                                else 
                                    for (const ii of tt.morph.items) {
                                        if (((ii._class.isProperSurname || ii._class.isNoun)) && ii._case.isGenitive && (ii instanceof MorphWordForm)) {
                                            if (ii.isInDictionary) {
                                                gen = MorphGender.UNDEFINED;
                                                break;
                                            }
                                        }
                                    }
                                if (gen !== MorphGender.UNDEFINED && ((!nn.morph._case.isNominative || nn.morph.number !== MorphNumber.SINGULAR))) {
                                    res.value = MiscHelper.getTextValue(res.beginToken, res.endToken, GetTextAttr.NO);
                                    let _var = null;
                                    try {
                                        _var = MorphologyService.getWordform(res.value, MorphBaseInfo._new593(MorphCase.NOMINATIVE, MorphClass.ADJECTIVE, MorphNumber.SINGULAR, gen));
                                    } catch (ex) {
                                    }
                                    if (_var !== null && _var.endsWith("ОЙ") && !res.beginToken.getMorphClassInDictionary().isAdjective) {
                                        if (gen === MorphGender.MASCULINE) 
                                            _var = _var.substring(0, 0 + _var.length - 2) + "ЫЙ";
                                        else if (gen === MorphGender.NEUTER) 
                                            _var = _var.substring(0, 0 + _var.length - 2) + "ОЕ";
                                        else if (gen === MorphGender.FEMINIE) 
                                            _var = _var.substring(0, 0 + _var.length - 2) + "АЯ";
                                    }
                                    if (_var !== null && _var !== res.value) {
                                        res.altValue = res.value;
                                        res.value = _var;
                                    }
                                }
                            }
                        }
                    }
                    if (res !== null && res.typ === StreetItemType.NAME && (res.whitespacesAfterCount < 2)) {
                        tt = Utils.as(res.endToken.next, TextToken);
                        if (NameToken.checkInitialBack(tt)) {
                            if (res.value === null) 
                                res.value = MiscHelper.getTextValueOfMetaToken(res, GetTextAttr.NO);
                            if (tt.next !== null && tt.next.isChar('.')) 
                                tt = Utils.as(tt.next, TextToken);
                            res.endToken = tt;
                            tt = Utils.as(res.endToken.next, TextToken);
                            if ((((res.whitespacesAfterCount < 2) && tt !== null && tt.lengthChar === 1) && tt.chars.isAllUpper && tt.next !== null) && tt.next.isChar('.')) 
                                res.endToken = tt.next;
                            tt = Utils.as(res.endToken.next, TextToken);
                        }
                        else if ((tt !== null && tt.lengthChar === 1 && tt.chars.isAllUpper) && tt.next !== null && tt.next.isChar('.')) {
                            if (StreetItemToken.tryParse(tt, null, false, null) !== null || AddressItemToken.checkHouseAfter(tt, false, false)) {
                            }
                            else {
                                let rt = tt.kit.processReferent("PERSON", tt, null);
                                if (rt === null) {
                                    if (res.value === null) 
                                        res.value = MiscHelper.getTextValueOfMetaToken(res, GetTextAttr.NO);
                                    res.endToken = tt.next;
                                    tt = Utils.as(res.endToken.next, TextToken);
                                    if (((res.whitespacesAfterCount < 2) && tt !== null && tt.lengthChar === 1) && tt.chars.isAllUpper) {
                                        if (tt.next !== null && tt.next.isChar('.')) 
                                            res.endToken = tt.next;
                                        else if (tt.next === null || tt.next.isComma) 
                                            res.endToken = tt;
                                    }
                                }
                            }
                        }
                        if (tt !== null && tt.getMorphClassInDictionary().isProperName) {
                            let rt = tt.kit.processReferent("PERSON", res.beginToken, null);
                            if (rt !== null) {
                                let ok2 = false;
                                if (rt.endToken === tt) 
                                    ok2 = true;
                                else if (rt.endToken === tt.next && tt.next.getMorphClassInDictionary().isProperSecname) 
                                    ok2 = true;
                                if (ok2) {
                                    if (res.value === null) 
                                        res.value = MiscHelper.getTextValueOfMetaToken(res, GetTextAttr.NO);
                                    res.endToken = rt.endToken;
                                    if (res.beginToken !== res.endToken) {
                                        let mc1 = res.beginToken.getMorphClassInDictionary();
                                        let mc2 = res.endToken.getMorphClassInDictionary();
                                        if (((mc1.isProperName && !mc2.isProperName)) || ((!mc1.isProperSurname && mc2.isProperSurname))) {
                                            res.misc = res.value;
                                            res.value = MiscHelper.getTextValue(res.endToken, res.endToken, GetTextAttr.NO);
                                        }
                                        else if (mc1.isProperName && mc2.isProperSurname) {
                                            res.misc = res.value;
                                            res.value = MiscHelper.getTextValue(res.endToken, res.endToken, GetTextAttr.NO);
                                        }
                                        else 
                                            res.misc = MiscHelper.getTextValue(res.endToken, res.endToken, GetTextAttr.NO);
                                    }
                                }
                            }
                        }
                    }
                    if (res.beginToken === res.endToken) {
                        let nn = MiscLocationHelper.tryAttachNordWest(res.beginToken);
                        if (nn !== null && nn.endChar > res.endChar) {
                            res.endToken = nn.endToken;
                            res.value = Utils.replaceString(MiscHelper.getTextValueOfMetaToken(res, GetTextAttr.NO), " - ", " ");
                        }
                    }
                    return res;
                }
            }
            if (tt.isValue("№", null) || tt.isValue("НОМЕР", null) || tt.isValue("НОМ", null)) {
                let tt1 = tt.next;
                if (tt1 !== null && tt1.isChar('.')) 
                    tt1 = tt1.next;
                if ((tt1 instanceof NumberToken) && tt1.intValue !== null) 
                    return StreetItemToken._new594(tt, tt1, StreetItemType.NUMBER, tt1.typ, tt1.value, true);
            }
            if (tt.isHiphen && (tt.next instanceof NumberToken) && tt.next.intValue !== null) {
                if (prev !== null && prev.typ === StreetItemType.NOUN) {
                    if ((prev.nounCanBeName || prev.termin.canonicText === "МИКРОРАЙОН" || prev.termin.canonicText === "КВАРТАЛ") || LanguageHelper.endsWith(prev.termin.canonicText, "ГОРОДОК")) 
                        return StreetItemToken._new594(tt, tt.next, StreetItemType.NUMBER, tt.next.typ, tt.next.value, true);
                }
            }
            if (((tt instanceof TextToken) && tt.lengthChar === 1 && (tt.whitespacesBeforeCount < 2)) && tt.chars.isLetter && tt.chars.isAllUpper) {
                if (prev !== null && prev.typ === StreetItemType.NOUN) {
                    if (prev.termin.canonicText === "МИКРОРАЙОН" || prev.termin.canonicText === "КВАРТАЛ" || LanguageHelper.endsWith(prev.termin.canonicText, "ГОРОДОК")) 
                        return StreetItemToken._new455(tt, tt, StreetItemType.NAME, tt.term);
                    if ((prev.termin.canonicText === "РЯД" || prev.termin.canonicText === "БЛОК" || prev.termin.canonicText === "ЛИНИЯ") || prev.termin.canonicText === "ПАНЕЛЬ") {
                        let res = StreetItemToken._new455(tt, tt, StreetItemType.NUMBER, tt.term);
                        let tt2 = tt.next;
                        if (tt2 !== null && tt2.isHiphen) 
                            tt2 = tt2.next;
                        if ((tt2 instanceof NumberToken) && (tt.whitespacesAfterCount < 3)) {
                            let ait = AddressItemToken.tryParsePureItem(tt2, null, null);
                            if (ait !== null && ait.typ === AddressItemType.NUMBER) {
                                res.value = (ait.value + res.value);
                                res.endToken = ait.endToken;
                            }
                        }
                        return res;
                    }
                    if (MiscLocationHelper.isUserParamAddress(tt)) {
                        let _next = StreetItemToken.tryParse(tt.next, prev, inSearch, null);
                        if (_next !== null && _next.typ === StreetItemType.NAME) {
                            _next = _next.clone();
                            _next.value = MiscHelper.getTextValueOfMetaToken(_next, GetTextAttr.NO);
                            _next.beginToken = tt;
                            return _next;
                        }
                    }
                }
            }
        }
        let r = (t === null ? null : t.getReferent());
        if (r instanceof GeoReferent) {
            let geo = Utils.as(r, GeoReferent);
            if (prev !== null && prev.typ === StreetItemType.NOUN) {
                if (AddressItemToken.checkHouseAfter(t.next, false, false)) {
                    let res1 = StreetItemToken.tryParse(t.beginToken, prev, false, null);
                    if (res1 !== null && res1.endChar === t.endChar) {
                        res1 = res1.clone();
                        res1.beginToken = res1.endToken = t;
                        return res1;
                    }
                    let res = StreetItemToken._new455(t, t, StreetItemType.NAME, MiscHelper.getTextValue(t, t, GetTextAttr.NO));
                    return res;
                }
            }
        }
        if (((tt instanceof TextToken) && tt.chars.isCapitalUpper && tt.chars.isLatinLetter) && (tt.whitespacesAfterCount < 2)) {
            if (MiscHelper.isEngArticle(tt)) 
                return null;
            let tt2 = tt.next;
            if (MiscHelper.isEngAdjSuffix(tt2)) 
                tt2 = tt2.next.next;
            let tok1 = StreetItemToken.m_Ontology.tryParse(tt2, TerminParseAttr.NO);
            if (tok1 !== null) 
                return StreetItemToken._new571(tt, tt2.previous, StreetItemType.NAME, tt.morph, tt.term);
        }
        if (((tt !== null && tt.isValue("ПОДЪЕЗД", null) && prev !== null) && prev.isRoad && tt.next !== null) && tt.next.isValue("К", null) && tt.next.next !== null) {
            let sit = StreetItemToken._new469(tt, tt.next, StreetItemType.NAME);
            sit.isRoadName = true;
            let t1 = tt.next.next;
            let g1 = null;
            for (; t1 !== null; t1 = t1.next) {
                if (t1.whitespacesBeforeCount > 3) 
                    break;
                if ((((g1 = Utils.as(t1.getReferent(), GeoReferent)))) !== null) 
                    break;
                if (t1.isChar('.') || (t1.lengthChar < 3)) 
                    continue;
                if ((t1.lengthChar < 4) && t1.chars.isAllLower) 
                    continue;
                break;
            }
            if (g1 !== null) {
                sit.endToken = t1;
                let nams = g1.getStringValues(GeoReferent.ATTR_NAME);
                if (nams === null || nams.length === 0) 
                    return null;
                sit.value = "ПОДЪЕЗД - " + nams[0];
                if (nams.length > 1) 
                    sit.altValue = "ПОДЪЕЗД - " + nams[1];
                return sit;
            }
            if ((t1 instanceof TextToken) && (t1.whitespacesBeforeCount < 2) && t1.chars.isCapitalUpper) {
                let cit = CityItemToken.tryParse(t1, null, true, null);
                if (cit !== null && ((cit.typ === CityItemTokenItemType.PROPERNAME || cit.typ === CityItemTokenItemType.CITY))) {
                    sit.endToken = cit.endToken;
                    sit.value = "ПОДЪЕЗД - " + cit.value;
                    return sit;
                }
            }
        }
        if (tt !== null && tt.lengthChar === 1) {
            let t1 = NameToken.checkInitial(tt);
            if (t1 !== null) {
                let res = StreetItemToken.tryParse(t1, null, false, null);
                if (res !== null) {
                    if (res.value === null) 
                        res.value = MiscHelper.getTextValueOfMetaToken(res, GetTextAttr.NO);
                    res.beginToken = tt;
                    return res;
                }
            }
        }
        return null;
    }
    
    static tryParseSpec(t, prev) {
        const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
        const CityItemToken = require("./../../geo/internal/CityItemToken");
        const NumToken = require("./../../geo/internal/NumToken");
        if (t === null) 
            return null;
        let res = null;
        let sit = null;
        if (t.getReferent() instanceof DateReferent) {
            let dr = Utils.as(t.getReferent(), DateReferent);
            if (!(t.beginToken instanceof NumberToken)) 
                return null;
            if (dr.year === 0 && dr.day > 0 && dr.month > 0) {
                res = new Array();
                res.push(StreetItemToken._new601(t, t, StreetItemType.NUMBER, true, NumberSpellingType.DIGIT, dr.day.toString()));
                let tmp = dr.toStringEx(false, t.morph.language, 0);
                let i = tmp.indexOf(' ');
                res.push((sit = StreetItemToken._new455(t, t, StreetItemType.STDNAME, tmp.substring(i + 1).toUpperCase())));
                sit.chars.isCapitalUpper = true;
                return res;
            }
            if (dr.year > 0 && dr.month === 0) {
                res = new Array();
                res.push(StreetItemToken._new601(t, t, StreetItemType.NUMBER, true, NumberSpellingType.DIGIT, dr.year.toString()));
                res.push((sit = StreetItemToken._new455(t, t, StreetItemType.STDNAME, (t.morph.language.isUa ? "РОКУ" : "ГОДА"))));
                sit.chars.isCapitalUpper = true;
                return res;
            }
            return null;
        }
        if (prev !== null && prev.typ === StreetItemType.AGE) {
            res = new Array();
            if (t.getReferent() instanceof GeoReferent) 
                res.push((sit = StreetItemToken._new605(t, t, StreetItemType.NAME, t.getSourceText().toUpperCase(), t.getReferent().toStringEx(true, t.kit.baseLanguage, 0).toUpperCase())));
            else if (t.isValue("ГОРОД", null) || t.isValue("МІСТО", null)) 
                res.push((sit = StreetItemToken._new455(t, t, StreetItemType.NAME, "ГОРОДА")));
            else 
                return null;
            return res;
        }
        if (prev !== null && prev.typ === StreetItemType.NOUN) {
            let num = NumToken.tryParse(t, GeoTokenType.STREET);
            if (num !== null) {
                res = new Array();
                res.push((sit = StreetItemToken._new455(num.beginToken, num.endToken, StreetItemType.NUMBER, num.value)));
                return res;
            }
        }
        let canBeRoad = false;
        if (prev !== null && prev.isRoad && (t.whitespacesBeforeCount < 3)) 
            canBeRoad = true;
        else if ((prev === null && t.next !== null && t.next.isHiphen) && MiscLocationHelper.isUserParamAddress(t)) {
            let cou = 5;
            for (let tt = t.next; tt !== null && cou > 0; tt = tt.next,cou--) {
                if (tt.whitespacesBeforeCount > 3) 
                    break;
                if ((tt instanceof NumberToken) || tt.isComma) 
                    break;
                let sit1 = StreetItemToken.tryParse(tt, null, false, null);
                if (sit1 !== null && sit1.typ === StreetItemType.NOUN) {
                    if (sit1.isRoad) 
                        canBeRoad = true;
                    break;
                }
            }
        }
        if (canBeRoad) {
            let vals = null;
            let t1 = null;
            let br = false;
            for (let tt = t; tt !== null; tt = tt.next) {
                if (tt.whitespacesBeforeCount > 3) 
                    break;
                if (BracketHelper.isBracket(tt, false)) {
                    if (tt === t) {
                        br = true;
                        continue;
                    }
                    break;
                }
                let val = null;
                if (tt.getReferent() instanceof GeoReferent) {
                    let rt = Utils.as(tt, ReferentToken);
                    if (rt.beginToken === rt.endToken && (rt.endToken instanceof TextToken)) 
                        val = rt.endToken.term;
                    else 
                        val = tt.getReferent().toStringEx(true, tt.kit.baseLanguage, 0).toUpperCase();
                    t1 = tt;
                }
                else if ((tt instanceof TextToken) && tt.chars.isCapitalUpper) {
                    let cit = CityItemToken.tryParse(tt, null, true, null);
                    if (cit !== null && cit.orgRef === null && ((cit.typ === CityItemTokenItemType.PROPERNAME || cit.typ === CityItemTokenItemType.CITY))) {
                        val = (cit.value != null ? cit.value : (cit !== null && cit.ontoItem !== null ? cit.ontoItem.canonicText : null));
                        t1 = (tt = cit.endToken);
                    }
                    else 
                        break;
                }
                else 
                    break;
                if (vals === null) 
                    vals = new Array();
                if (val.indexOf('-') > 0 && (tt instanceof TextToken)) 
                    vals.splice(vals.length, 0, ...Utils.splitString(val, '-', false));
                else 
                    vals.push(val);
                if (tt.next !== null && tt.next.isHiphen) 
                    tt = tt.next;
                else 
                    break;
            }
            if (vals !== null) {
                let ok = false;
                if (vals.length > 1) 
                    ok = true;
                else if (MiscLocationHelper.checkGeoObjectBefore(t, false)) 
                    ok = true;
                else {
                    let sit1 = StreetItemToken.tryParse(t1.next, null, false, null);
                    if (sit1 !== null && sit1.typ === StreetItemType.NUMBER && sit1.isNumberKm) 
                        ok = true;
                }
                if (ok) {
                    if (br) {
                        if (BracketHelper.isBracket(t1.next, false)) 
                            t1 = t1.next;
                    }
                    res = new Array();
                    if (prev !== null) {
                        prev.nounIsDoubtCoef = 0;
                        prev.isAbridge = false;
                    }
                    res.push((sit = StreetItemToken._new469(t, t1, StreetItemType.NAME)));
                    if (vals.length === 1) 
                        sit.value = vals[0];
                    else if (vals.length === 2) {
                        sit.value = (vals[0] + " - " + vals[1]);
                        sit.altValue = (vals[1] + " - " + vals[0]);
                    }
                    else if (vals.length === 3) {
                        sit.value = (vals[0] + " - " + vals[1] + " - " + vals[2]);
                        sit.altValue = (vals[2] + " - " + vals[1] + " - " + vals[0]);
                    }
                    else if (vals.length === 4) {
                        sit.value = (vals[0] + " - " + vals[1] + " - " + vals[2] + " - " + vals[3]);
                        sit.altValue = (vals[3] + " - " + vals[2] + " - " + vals[1] + " - " + vals[0]);
                    }
                    else 
                        return null;
                    return res;
                }
            }
            if (((t instanceof TextToken) && t.lengthChar === 1 && t.chars.isLetter) && t.next !== null) {
                if (t.isValue("К", null) || t.isValue("Д", null)) 
                    return null;
                let tt = t.next;
                if (tt.isHiphen && tt.next !== null) 
                    tt = tt.next;
                if (tt instanceof NumberToken) {
                    res = new Array();
                    prev.nounIsDoubtCoef = 0;
                    res.push((sit = StreetItemToken._new469(t, tt, StreetItemType.NAME)));
                    let ch = t.term[0];
                    let ch0 = LanguageHelper.getCyrForLat(ch);
                    if ((ch0.charCodeAt(0)) !== 0) 
                        ch = ch0;
                    sit.value = (ch + tt.value);
                    sit.isRoadName = true;
                    tt = tt.next;
                    if (tt !== null && tt.isHiphen && (tt.next instanceof NumberToken)) {
                        sit.endToken = tt.next;
                        tt = tt.next.next;
                    }
                    let br1 = BracketHelper.tryParse(tt, BracketParseAttr.NO, 100);
                    if (br1 !== null && (br1.lengthChar < 15)) {
                        sit.endToken = br1.endToken;
                        sit.altValue = MiscHelper.getTextValue(tt.next, sit.endToken.previous, GetTextAttr.NO);
                    }
                    else if (tt !== null && tt.lengthChar > 2 && !tt.chars.isAllLower) {
                        if ((((((tt.isValue("ДОН", null) || tt.isValue("КАВКАЗ", null) || tt.isValue("УРАЛ", null)) || tt.isValue("БЕЛАРУСЬ", null) || tt.isValue("УКРАИНА", null)) || tt.isValue("КРЫМ", null) || tt.isValue("ВОЛГА", null)) || tt.isValue("ХОЛМОГОРЫ", null) || tt.isValue("БАЛТИЯ", null)) || tt.isValue("РОССИЯ", null) || tt.isValue("НЕВА", null)) || tt.isValue("КОЛА", null) || tt.isValue("КАСПИЙ", null)) {
                            sit.endToken = tt;
                            sit.altValue = MiscHelper.getTextValue(tt, tt, GetTextAttr.NO);
                        }
                        else {
                            let nnn = StreetItemToken.tryParseSpec(tt, prev);
                            if (nnn !== null && nnn.length === 1 && nnn[0].typ === StreetItemType.NAME) {
                                sit.endToken = nnn[0].endToken;
                                sit.altValue = nnn[0].value;
                                sit.altValue2 = nnn[0].altValue;
                            }
                        }
                    }
                    return res;
                }
            }
        }
        return null;
    }
    
    static _tryAttachRoadNum(t) {
        if (t === null) 
            return null;
        if (!t.chars.isLetter || t.lengthChar !== 1) 
            return null;
        let tt = t.next;
        if (tt !== null && tt.isHiphen) 
            tt = tt.next;
        if (!(tt instanceof NumberToken)) 
            return null;
        let res = StreetItemToken._new469(t, tt, StreetItemType.NAME);
        res.value = (t.getSourceText().toUpperCase() + tt.value);
        return res;
    }
    
    static _new294(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.org = _arg4;
        return res;
    }
    
    static _new455(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        return res;
    }
    
    static _new464(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.numberHasPrefix = _arg5;
        return res;
    }
    
    static _new467(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.isInBrackets = _arg5;
        return res;
    }
    
    static _new468(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.numberType = _arg5;
        res.numberHasPrefix = _arg6;
        return res;
    }
    
    static _new469(_arg1, _arg2, _arg3) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new470(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isInBrackets = _arg4;
        return res;
    }
    
    static _new549(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.termin = _arg4;
        return res;
    }
    
    static _new554(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.city = _arg4;
        return res;
    }
    
    static _new555(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.value = _arg3;
        res.typ = _arg4;
        res.numberHasPrefix = _arg5;
        return res;
    }
    
    static _new557(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.numberType = _arg5;
        return res;
    }
    
    static _new558(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.numberType = _arg5;
        res.morph = _arg6;
        return res;
    }
    
    static _new561(_arg1, _arg2, _arg3) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.hasStdSuffix = _arg3;
        return res;
    }
    
    static _new562(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.termin = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new563(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.termin = _arg3;
        res.typ = _arg4;
        res.isAbridge = _arg5;
        return res;
    }
    
    static _new564(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.existStreet = _arg4;
        res.morph = _arg5;
        res.isInDictionary = _arg6;
        return res;
    }
    
    static _new567(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.numberType = _arg5;
        res.numberHasPrefix = _arg6;
        res.morph = _arg7;
        return res;
    }
    
    static _new568(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.termin = _arg4;
        res.isAbridge = _arg5;
        res.morph = _arg6;
        return res;
    }
    
    static _new570(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.termin = _arg4;
        res.altTermin = _arg5;
        res.isAbridge = _arg6;
        res.morph = _arg7;
        res.nounIsDoubtCoef = _arg8;
        return res;
    }
    
    static _new571(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        res.value = _arg5;
        return res;
    }
    
    static _new573(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        res.termin = _arg5;
        return res;
    }
    
    static _new574(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.altTyp = _arg4;
        res.morph = _arg5;
        res.value = _arg6;
        return res;
    }
    
    static _new575(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.altTyp = _arg4;
        res.morph = _arg5;
        res.termin = _arg6;
        return res;
    }
    
    static _new576(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        res.isInDictionary = _arg5;
        return res;
    }
    
    static _new577(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        res.isInDictionary = _arg5;
        res.termin = _arg6;
        return res;
    }
    
    static _new580(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        res.misc = _arg5;
        res.value = _arg6;
        return res;
    }
    
    static _new582(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isInDictionary = _arg4;
        res.value = _arg5;
        res.morph = _arg6;
        return res;
    }
    
    static _new584(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.termin = _arg4;
        res.isAbridge = _arg5;
        return res;
    }
    
    static _new585(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isRoadName = _arg4;
        return res;
    }
    
    static _new586(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.noGeoInThisToken = _arg5;
        return res;
    }
    
    static _new588(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.numberType = _arg4;
        res.value = _arg5;
        return res;
    }
    
    static _new592(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.morph = _arg4;
        res.cond = _arg5;
        return res;
    }
    
    static _new594(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.numberType = _arg4;
        res.value = _arg5;
        res.numberHasPrefix = _arg6;
        return res;
    }
    
    static _new601(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.numberHasPrefix = _arg4;
        res.numberType = _arg5;
        res.value = _arg6;
        return res;
    }
    
    static _new605(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.value = _arg4;
        res.altValue = _arg5;
        return res;
    }
    
    static _new1269(_arg1, _arg2, _arg3, _arg4) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isRailway = _arg4;
        return res;
    }
    
    static _new1270(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new StreetItemToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isRailway = _arg4;
        res.nounIsDoubtCoef = _arg5;
        return res;
    }
    
    static static_constructor() {
        StreetItemToken.m_Ontology = null;
        StreetItemToken.m_OntologyEx = null;
        StreetItemToken.m_StdOntMisc = null;
        StreetItemToken.m_StdAdj = null;
        StreetItemToken.m_Prospect = null;
        StreetItemToken.m_Metro = null;
        StreetItemToken.m_Road = null;
        StreetItemToken.m_Block = null;
        StreetItemToken.m_RegTails = ["ГОРОДОК", "РАЙОН", "МАССИВ", "МАСИВ", "КОМПЛЕКС", "ЗОНА", "КВАРТАЛ", "ОТДЕЛЕНИЕ", "ПАРК", "МЕСТНОСТЬ", "РАЗЪЕЗД", "УРОЧИЩЕ", "САД", "МЕСТОРОЖДЕНИЕ"];
        StreetItemToken.m_SpecTails = ["БУДКА", "КАЗАРМА"];
        StreetItemToken.SPEED_REGIME = false;
    }
}


StreetItemToken.static_constructor();

module.exports = StreetItemToken