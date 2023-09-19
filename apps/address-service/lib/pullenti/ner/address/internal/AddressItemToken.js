/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const Referent = require("./../../Referent");
const StreetItemType = require("./StreetItemType");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const GeoTokenData = require("./../../geo/internal/GeoTokenData");
const MorphGender = require("./../../../morph/MorphGender");
const MorphNumber = require("./../../../morph/MorphNumber");
const MetaToken = require("./../../MetaToken");
const AddressHouseType = require("./../AddressHouseType");
const ProcessorService = require("./../../ProcessorService");
const DateReferent = require("./../../date/DateReferent");
const MorphLang = require("./../../../morph/MorphLang");
const SourceOfAnalysis = require("./../../SourceOfAnalysis");
const AddressReferent = require("./../AddressReferent");
const GeoTokenType = require("./../../geo/internal/GeoTokenType");
const Token = require("./../../Token");
const NumberExType = require("./../../core/NumberExType");
const AddressItemType = require("./AddressItemType");
const ReferentToken = require("./../../ReferentToken");
const GeoReferent = require("./../../geo/GeoReferent");
const AddressDetailType = require("./../AddressDetailType");
const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
const BracketHelper = require("./../../core/BracketHelper");
const NumberSpellingType = require("./../../NumberSpellingType");
const Termin = require("./../../core/Termin");
const AddressBuildingType = require("./../AddressBuildingType");
const MiscHelper = require("./../../core/MiscHelper");
const StreetKind = require("./../StreetKind");
const TextToken = require("./../../TextToken");
const NumberToken = require("./../../NumberToken");
const TerminCollection = require("./../../core/TerminCollection");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const GeoAnalyzer = require("./../../geo/GeoAnalyzer");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const BracketParseAttr = require("./../../core/BracketParseAttr");
const StreetItemToken = require("./StreetItemToken");
const StreetReferent = require("./../StreetReferent");
const NumberHelper = require("./../../core/NumberHelper");
const TerrItemToken = require("./../../geo/internal/TerrItemToken");
const NumToken = require("./../../geo/internal/NumToken");

class AddressItemToken extends MetaToken {
    
    static tryParseList(t, maxCount = 20) {
        if (t === null) 
            return null;
        let ad = GeoAnalyzer.getData(t);
        if (ad !== null) {
            if (ad.level > 0) 
                return null;
            ad.level++;
        }
        let res = AddressItemToken.tryParseListInt(t, maxCount);
        if (ad !== null) 
            ad.level--;
        if (res !== null && res.length === 0) 
            return null;
        return res;
    }
    
    static tryParseListInt(t, maxCount = 20) {
        const OrgItemToken = require("./../../geo/internal/OrgItemToken");
        const GeoOwnerHelper = require("./../../geo/internal/GeoOwnerHelper");
        const StreetDefineHelper = require("./StreetDefineHelper");
        if (t instanceof NumberToken) {
            if (t.intValue === null) 
                return null;
            let v = t.intValue;
            if ((v < 100000) || v >= 10000000) {
                if (t.typ === NumberSpellingType.DIGIT && !t.morph._class.isAdjective) {
                    if (t.next === null || (t.next instanceof NumberToken)) {
                        if (t.previous === null || !t.previous.morph._class.isPreposition) 
                            return null;
                    }
                }
            }
        }
        let it = AddressItemToken.tryParse(t, false, null, null);
        if (it === null) 
            return null;
        if (it.typ === AddressItemType.NUMBER) 
            return null;
        if (it.typ === AddressItemType.KILOMETER && (it.beginToken.previous instanceof NumberToken)) {
            it = it.clone();
            it.beginToken = it.beginToken.previous;
            it.value = it.beginToken.value.toString();
            if (it.beginToken.previous !== null && it.beginToken.previous.morph._class.isPreposition) 
                it.beginToken = it.beginToken.previous;
        }
        if (it.typ === AddressItemType.STREET && it.refToken !== null && !MiscLocationHelper.isUserParamAddress(it)) 
            return null;
        let res = new Array();
        res.push(it);
        if (it.altTyp !== null) 
            res.push(it.altTyp);
        let pref = it.typ === AddressItemType.PREFIX;
        for (t = it.endToken.next; t !== null; t = t.next) {
            if (maxCount > 0 && res.length >= maxCount) 
                break;
            let last = res[res.length - 1];
            if (res.length > 1) {
                if (last.isNewlineBefore && res[res.length - 2].typ !== AddressItemType.PREFIX) {
                    let i = 0;
                    for (i = 0; i < (res.length - 1); i++) {
                        if (res[i].typ === last.typ) {
                            if (i === (res.length - 2) && ((last.typ === AddressItemType.CITY || last.typ === AddressItemType.REGION))) {
                                let jj = 0;
                                for (jj = 0; jj < i; jj++) {
                                    if ((res[jj].typ !== AddressItemType.PREFIX && res[jj].typ !== AddressItemType.ZIP && res[jj].typ !== AddressItemType.REGION) && res[jj].typ !== AddressItemType.COUNTRY) 
                                        break;
                                }
                                if (jj >= i) 
                                    continue;
                            }
                            break;
                        }
                    }
                    if ((i < (res.length - 1)) || last.typ === AddressItemType.ZIP) {
                        Utils.removeItem(res, last);
                        break;
                    }
                }
            }
            if (t.isTableControlChar) 
                break;
            if (t.isChar(',') || t.isChar('|')) 
                continue;
            if (t.isValue("ДУБЛЬ", null)) 
                continue;
            if (t.isCharOf("\\/")) {
                if (t.isNewlineBefore || t.isNewlineAfter) 
                    break;
                if (t.previous !== null && t.previous.isComma) 
                    continue;
                if (last.typ === AddressItemType.STREET && last.isDoubt) 
                    break;
                res.push(AddressItemToken._new288(AddressItemType.DETAIL, t, t, AddressDetailType.CROSS));
                continue;
            }
            if (t.isCharOf(":;") && MiscLocationHelper.isUserParamAddress(t)) 
                continue;
            if (BracketHelper.isBracket(t, false) && t.next !== null && t.next.isComma) 
                continue;
            if (t.isChar('.')) {
                if (t.isNewlineAfter) {
                    if (last.typ === AddressItemType.CITY) {
                        let _next = AddressItemToken.tryParse(t.next, false, null, null);
                        if (_next !== null && _next.typ === AddressItemType.STREET) 
                            continue;
                    }
                    break;
                }
                if (t.previous !== null && t.previous.isChar('.')) {
                    if (t.previous.previous !== null && t.previous.previous.isChar('.')) 
                        break;
                }
                continue;
            }
            if (t.isHiphen || t.isChar('_')) {
                if (((it.typ === AddressItemType.NUMBER || it.typ === AddressItemType.STREET)) && (t.next instanceof NumberToken)) 
                    continue;
                if (MiscLocationHelper.isUserParamAddress(it)) 
                    continue;
                if (it.typ === AddressItemType.CITY) 
                    continue;
            }
            if (it.typ === AddressItemType.DETAIL && it.detailType === AddressDetailType.CROSS) {
                let str1 = AddressItemToken.tryParse(t, true, null, null);
                if (str1 !== null && str1.typ === AddressItemType.STREET) {
                    if (str1.endToken.next !== null && ((str1.endToken.next.isAnd || str1.endToken.next.isHiphen))) {
                        let str2 = AddressItemToken.tryParse(str1.endToken.next.next, true, null, null);
                        if (str2 === null || str2.typ !== AddressItemType.STREET) {
                            str2 = StreetDefineHelper.tryParseSecondStreet(str1.beginToken, str1.endToken.next.next);
                            if (str2 !== null && str2.isDoubt) {
                                str2 = str2.clone();
                                str2.isDoubt = false;
                            }
                        }
                        if (str2 !== null && str2.typ === AddressItemType.STREET) {
                            res.push(str1);
                            res.push(str2);
                            t = str2.endToken;
                            it = str2;
                            continue;
                        }
                    }
                }
            }
            let pre = pref;
            if (it.typ === AddressItemType.KILOMETER || ((it.typ === AddressItemType.HOUSE && it.value !== null))) {
                if (!t.isNewlineBefore) 
                    pre = true;
            }
            let it0 = AddressItemToken.tryParse(t, pre, it, null);
            if (it0 === null) {
                let hous = false;
                let wraphous290 = new RefOutArgWrapper();
                let tt = AddressItemToken.gotoEndOfAddress(t.previous, wraphous290);
                hous = wraphous290.value;
                if (tt !== null && tt.endChar >= t.endChar && tt.next !== null) {
                    if (tt.next.isComma) 
                        tt = tt.next;
                    it0 = AddressItemToken.tryParse(tt.next, pre, it, null);
                    if (it0 === null && hous && it.typ === AddressItemType.STREET) 
                        res.push(AddressItemToken._new289(AddressItemType.HOUSE, t, tt, "0"));
                }
            }
            if (it0 === null && t.getMorphClassInDictionary().isPreposition && (t.whitespacesAfterCount < 3)) {
                it0 = AddressItemToken.tryParse(t.next, pre, it, null);
                if (it0 !== null) {
                    if (it0.typ === AddressItemType.NUMBER) 
                        it0 = null;
                    else if (it0.typ === AddressItemType.BUILDING && t.next.isValue("СТ", null)) 
                        it0 = null;
                }
            }
            if (it0 === null) {
                if (BracketHelper.canBeEndOfSequence(t, true, null, false) && last.typ === AddressItemType.STREET) 
                    continue;
                if (t.isCharOf("\\/") && last.typ === AddressItemType.STREET) 
                    continue;
            }
            if (((it0 === null && t.isChar('(') && (t.next instanceof ReferentToken)) && (t.next.getReferent() instanceof GeoReferent) && t.next.next !== null) && t.next.next.isChar(')')) {
                it0 = AddressItemToken.tryParse(t.next, pre, it, null);
                if (it0 !== null) {
                    it0 = it0.clone();
                    it0.beginToken = t;
                    it0.endToken = it0.endToken.next;
                    let geo0 = Utils.as(t.next.getReferent(), GeoReferent);
                    if (geo0.higher === null) {
                        for (let kk = res.length - 1; kk >= 0; kk--) {
                            if (res[kk].typ === AddressItemType.CITY && (res[kk].referent instanceof GeoReferent)) {
                                if (GeoOwnerHelper.canBeHigher(Utils.as(res[kk].referent, GeoReferent), geo0, null, null) || ((geo0.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null && res[kk].referent.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null))) {
                                    geo0.higher = Utils.as(res[kk].referent, GeoReferent);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (it0 === null) {
                if (t.newlinesBeforeCount > 2) 
                    break;
                if (it.typ === AddressItemType.POSTOFFICEBOX) 
                    break;
                if (t.isHiphen && t.next !== null && t.next.isComma) 
                    continue;
                if (t.isHiphen && (t.next instanceof NumberToken) && MiscLocationHelper.isUserParamAddress(t)) 
                    continue;
                if (t.isValue("НЕТ", null) || t.isValue("ТЕР", null) || t.isValue("ТЕРРИТОРИЯ", null)) 
                    continue;
                let tt1 = StreetItemToken.checkStdName(t);
                if (tt1 !== null) {
                    t = tt1;
                    continue;
                }
                if (t.morph._class.isPreposition) {
                    it0 = AddressItemToken.tryParse(t.next, false, it, null);
                    if (it0 !== null && it0.typ === AddressItemType.BUILDING && it0.beginToken.isValue("СТ", null)) {
                        it0 = null;
                        break;
                    }
                    if (it0 !== null) {
                        if ((it0.typ === AddressItemType.DETAIL && it.typ === AddressItemType.CITY && it.detailMeters > 0) && it.detailType === AddressDetailType.UNDEFINED) {
                            it.detailType = it0.detailType;
                            t = it.endToken = it0.endToken;
                            continue;
                        }
                        if ((it0.typ === AddressItemType.HOUSE || it0.typ === AddressItemType.BUILDING || it0.typ === AddressItemType.CORPUS) || it0.typ === AddressItemType.STREET || it0.typ === AddressItemType.DETAIL) {
                            res.push((it = it0));
                            t = it.endToken;
                            continue;
                        }
                    }
                }
                if (it.typ === AddressItemType.HOUSE || it.typ === AddressItemType.BUILDING || it.typ === AddressItemType.NUMBER) {
                    if ((!t.isWhitespaceBefore && t.lengthChar === 1 && t.chars.isLetter) && !t.isWhitespaceAfter && (t.next instanceof NumberToken)) {
                        let ch = AddressItemToken.correctCharToken(t);
                        if (ch === "К" || ch === "С") {
                            it0 = AddressItemToken._new289((ch === "К" ? AddressItemType.CORPUS : AddressItemType.BUILDING), t, t.next, t.next.value.toString());
                            it = it0;
                            res.push(it);
                            t = it.endToken;
                            let tt = t.next;
                            if (((tt !== null && !tt.isWhitespaceBefore && tt.lengthChar === 1) && tt.chars.isLetter && !tt.isWhitespaceAfter) && (tt.next instanceof NumberToken)) {
                                ch = AddressItemToken.correctCharToken(tt);
                                if (ch === "К" || ch === "С") {
                                    it = AddressItemToken._new289((ch === "К" ? AddressItemType.CORPUS : AddressItemType.BUILDING), tt, tt.next, tt.next.value.toString());
                                    res.push(it);
                                    t = it.endToken;
                                }
                            }
                            continue;
                        }
                    }
                }
                if (t.morph._class.isPreposition) {
                    if ((((t.isValue("У", null) || t.isValue("ВОЗЛЕ", null) || t.isValue("НАПРОТИВ", null)) || t.isValue("НА", null) || t.isValue("В", null)) || t.isValue("ВО", null) || t.isValue("ПО", null)) || t.isValue("ОКОЛО", null)) {
                        if (it0 !== null && it0.typ === AddressItemType.NUMBER) 
                            break;
                        continue;
                    }
                }
                if (t.morph._class.isNoun) {
                    if ((t.isValue("ДВОР", null) || t.isValue("ПОДЪЕЗД", null) || t.isValue("КРЫША", null)) || t.isValue("ПОДВАЛ", null)) 
                        continue;
                }
                if (t.isValue("ТЕРРИТОРИЯ", "ТЕРИТОРІЯ")) 
                    continue;
                if (t.isChar('(') && t.next !== null) {
                    it0 = AddressItemToken.tryParse(t.next, pre, null, null);
                    if (it0 !== null && it0.endToken.next !== null && it0.endToken.next.isChar(')')) {
                        it0 = it0.clone();
                        it0.beginToken = t;
                        it0.endToken = it0.endToken.next;
                        it = it0;
                        res.push(it);
                        t = it.endToken;
                        continue;
                    }
                    let li0 = AddressItemToken.tryParseListInt(t.next, 3);
                    if ((li0 !== null && li0.length > 1 && li0[0].typ !== AddressItemType.DETAIL) && li0[li0.length - 1].endToken.next !== null && li0[li0.length - 1].endToken.next.isChar(')')) {
                        li0[0] = li0[0].clone();
                        li0[0].beginToken = t;
                        li0[li0.length - 1] = li0[li0.length - 1].clone();
                        li0[li0.length - 1].endToken = li0[li0.length - 1].endToken.next;
                        res.splice(res.length, 0, ...li0);
                        it = li0[li0.length - 1];
                        t = it.endToken;
                        continue;
                    }
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null && (br.lengthChar < 100)) {
                        if (t.next.isValue("БЫВШИЙ", null) || t.next.isValue("БЫВШ", null)) {
                            it = new AddressItemToken(AddressItemType.DETAIL, t, br.endToken);
                            res.push(it);
                        }
                        t = br.endToken;
                        continue;
                    }
                }
                let checkKv = false;
                if (t.isValue("КВ", null) || t.isValue("KB", null)) {
                    if (it.typ === AddressItemType.NUMBER && res.length > 1 && res[res.length - 2].typ === AddressItemType.STREET) 
                        checkKv = true;
                    else if ((it.typ === AddressItemType.HOUSE || it.typ === AddressItemType.BUILDING || it.typ === AddressItemType.CORPUS) || it.typ === AddressItemType.CORPUSORFLAT) {
                        for (let jj = res.length - 2; jj >= 0; jj--) {
                            if (res[jj].typ === AddressItemType.STREET || res[jj].typ === AddressItemType.CITY) 
                                checkKv = true;
                        }
                    }
                    if (checkKv) {
                        let tt2 = t.next;
                        if (tt2 !== null && tt2.isChar('.')) 
                            tt2 = tt2.next;
                        let it22 = AddressItemToken.tryParsePureItem(tt2, null, null);
                        if (it22 !== null && it22.typ === AddressItemType.NUMBER) {
                            it22 = it22.clone();
                            it22.beginToken = t;
                            it22.typ = AddressItemType.FLAT;
                            res.push(it22);
                            t = it22.endToken;
                            continue;
                        }
                    }
                }
                if (res[res.length - 1].typ === AddressItemType.CITY) {
                    if (((t.isHiphen || t.isChar('_') || t.isValue("НЕТ", null))) && t.next !== null && t.next.isComma) {
                        let att = AddressItemToken.tryParsePureItem(t.next.next, null, null);
                        if (att !== null) {
                            if (att.typ === AddressItemType.HOUSE || att.typ === AddressItemType.BUILDING || att.typ === AddressItemType.CORPUS) {
                                it = new AddressItemToken(AddressItemType.STREET, t, t);
                                res.push(it);
                                continue;
                            }
                        }
                    }
                }
                if (t.lengthChar === 2 && (t instanceof TextToken) && t.chars.isAllUpper) {
                    let term = t.term;
                    if (!Utils.isNullOrEmpty(term) && term[0] === 'Р') 
                        continue;
                }
                break;
            }
            if (t.whitespacesBeforeCount > 15) {
                if (it0.typ === AddressItemType.STREET && last.typ === AddressItemType.CITY) {
                }
                else 
                    break;
            }
            if (t.isNewlineBefore && it0.typ === AddressItemType.STREET && it0.refToken !== null) {
                if (!it0.refTokenIsGsk) 
                    break;
            }
            if (it0.typ === AddressItemType.STREET && t.isValue("КВ", null)) {
                if (it !== null) {
                    if (it.typ === AddressItemType.HOUSE || it.typ === AddressItemType.BUILDING || it.typ === AddressItemType.CORPUS) {
                        let it2 = AddressItemToken.tryParsePureItem(t, null, null);
                        if (it2 !== null && it2.typ === AddressItemType.FLAT) 
                            it0 = it2;
                    }
                }
            }
            if (it0.typ === AddressItemType.PREFIX) 
                break;
            if (it0.typ === AddressItemType.NUMBER) {
                if (Utils.isNullOrEmpty(it0.value)) 
                    break;
                if (!Utils.isDigit(it0.value[0])) 
                    break;
                let cou = 0;
                for (let i = res.length - 1; i >= 0; i--) {
                    if (res[i].typ === AddressItemType.NUMBER) 
                        cou++;
                    else 
                        break;
                }
                if (cou > 5) 
                    break;
                if (it.isDoubt && t.isNewlineBefore) 
                    break;
            }
            if (it0.typ === AddressItemType.CORPUSORFLAT && it !== null && it.typ === AddressItemType.FLAT) 
                it0.typ = AddressItemType.ROOM;
            if (((((it0.typ === AddressItemType.FLOOR || it0.typ === AddressItemType.POTCH || it0.typ === AddressItemType.BLOCK) || it0.typ === AddressItemType.KILOMETER)) && Utils.isNullOrEmpty(it0.value) && it.typ === AddressItemType.NUMBER) && it.endToken.next === it0.beginToken) {
                it = it.clone();
                res[res.length - 1] = it;
                it.typ = it0.typ;
                it.endToken = it0.endToken;
            }
            else if ((((it.typ === AddressItemType.FLOOR || it.typ === AddressItemType.POTCH)) && Utils.isNullOrEmpty(it.value) && it0.typ === AddressItemType.NUMBER) && it.endToken.next === it0.beginToken) {
                it = it.clone();
                res[res.length - 1] = it;
                it.value = it0.value;
                it.endToken = it0.endToken;
            }
            else {
                it = it0;
                res.push(it);
                if (it.altTyp !== null) 
                    res.push(it.altTyp);
            }
            t = it.endToken;
        }
        if (res.length > 0) {
            it = res[res.length - 1];
            let it0 = (res.length > 1 ? res[res.length - 2] : null);
            if (it.typ === AddressItemType.NUMBER && it0 !== null && it0.refToken !== null) {
                for (const s of it0.refToken.referent.slots) {
                    if (s.typeName === "TYPE") {
                        let ss = Utils.asString(s.value);
                        if (ss.includes("гараж") || ((ss[0] === 'Г' && ss[ss.length - 1] === 'К'))) {
                            if (it0.refToken.referent.findSlot("NAME", "РОСАТОМ", true) !== null) 
                                break;
                            it.typ = AddressItemType.BOX;
                            break;
                        }
                    }
                }
            }
            if (it.typ === AddressItemType.NUMBER || it.typ === AddressItemType.ZIP) {
                let del = false;
                if (it.beginToken.previous !== null && it.beginToken.previous.morph._class.isPreposition) 
                    del = true;
                else if (it.morph._class.isNoun) 
                    del = true;
                if ((!del && it.endToken.whitespacesAfterCount === 1 && it.whitespacesBeforeCount > 0) && it.typ === AddressItemType.NUMBER) {
                    let npt = MiscLocationHelper.tryParseNpt(it.endToken.next);
                    if (npt !== null) 
                        del = true;
                }
                if (del) 
                    res.splice(res.length - 1, 1);
                else if ((it.typ === AddressItemType.NUMBER && it0 !== null && it0.typ === AddressItemType.STREET) && it0.refToken === null) {
                    if (it.beginToken.previous.isChar(',') || it.isNewlineAfter) {
                        it = it.clone();
                        res[res.length - 1] = it;
                        it.typ = AddressItemType.HOUSE;
                        it.isDoubt = true;
                    }
                }
            }
        }
        if (res.length === 0) 
            return null;
        for (const r of res) {
            if (r.typ === AddressItemType.CITY || r.typ === AddressItemType.STREET) {
                let ty = AddressItemToken._findAddrTyp(r.beginToken, r.endChar, 0);
                if (ty !== null) {
                    if (r.detailType === AddressDetailType.UNDEFINED) 
                        r.detailType = ty.detailType;
                    if (ty.detailMeters > 0) 
                        r.detailMeters = ty.detailMeters;
                    if (ty.detailParam !== null) 
                        r.detailParam = ty.detailParam;
                }
            }
        }
        for (let i = 0; i < (res.length - 2); i++) {
            if (res[i].typ === AddressItemType.STREET && res[i + 1].typ === AddressItemType.NUMBER) {
                if ((res[i + 2].typ === AddressItemType.BUILDING || res[i + 2].typ === AddressItemType.CORPUS || res[i + 2].typ === AddressItemType.OFFICE) || res[i + 2].typ === AddressItemType.FLAT) {
                    res[i + 1] = res[i + 1].clone();
                    res[i + 1].typ = AddressItemType.HOUSE;
                }
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === AddressItemType.STREET && res[i + 1].typ === AddressItemType.CITY && (res[i].referent instanceof StreetReferent)) {
                let sr = Utils.as(res[i].referent, StreetReferent);
                if (sr.slots.length !== 2 || sr.kind !== StreetKind.AREA || sr.typs.length !== 1) 
                    continue;
                if (i === 0 && MiscLocationHelper.isUserParamAddress(res[0])) {
                }
                else if (i > 0 && res[i - 1].typ === AddressItemType.CITY) {
                }
                else 
                    continue;
                let tt = res[i + 1].beginToken;
                if (tt instanceof ReferentToken) 
                    tt = tt.beginToken;
                let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.endChar === res[i + 1].endChar) {
                    res[i].endToken = res[i + 1].endToken;
                    sr.addSlot(StreetReferent.ATTR_NAME, npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false), false, 0);
                    res.splice(i + 1, 1);
                    break;
                }
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === AddressItemType.BUILDING && res[i].beginToken === res[i].endToken && res[i].beginToken.lengthChar === 1) {
                if (res[i + 1].typ === AddressItemType.CITY) {
                    res.splice(i, 1);
                    i--;
                }
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === AddressItemType.FLAT && res[i + 1].typ === AddressItemType.STREET && (res[i + 1].refToken instanceof OrgItemToken)) {
                let str = res[i + 1].refToken.toString().toUpperCase();
                if (str.includes("ЛЕСНИЧ")) {
                    res[i + 1].beginToken = res[i].beginToken;
                    res[i + 1].referent.addSlot("NUMBER", res[i].value, false, 0);
                    res.splice(i, 1);
                    break;
                }
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if ((res[i].typ === AddressItemType.STREET && (res[i].referent instanceof StreetReferent) && res[i + 1].typ === AddressItemType.STREET) && (res[i + 1].refToken instanceof OrgItemToken)) {
                let ss = Utils.as(res[i].referent, StreetReferent);
                if (ss.numbers === null || ss.names.length > 0) 
                    continue;
                if (!ss.toString().includes("квартал")) 
                    continue;
                let str = res[i + 1].refToken.toString().toUpperCase();
                if (!str.includes("ЛЕСНИЧ")) 
                    continue;
                res[i + 1].beginToken = res[i].beginToken;
                res[i + 1].referent.addSlot("NUMBER", ss.numbers, false, 0);
                res.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if ((res[i].typ === AddressItemType.STREET && res[i + 1].typ === AddressItemType.KILOMETER && (res[i].referent instanceof StreetReferent)) && res[i].referent.numbers === null) {
                res[i] = res[i].clone();
                res[i].referent.numbers = res[i + 1].value + "км";
                res[i].endToken = res[i + 1].endToken;
                res.splice(i + 1, 1);
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if ((res[i + 1].typ === AddressItemType.STREET && res[i].typ === AddressItemType.KILOMETER && (res[i + 1].referent instanceof StreetReferent)) && res[i + 1].referent.numbers === null) {
                res[i + 1] = res[i + 1].clone();
                res[i + 1].referent.numbers = res[i].value + "км";
                res[i + 1].beginToken = res[i].beginToken;
                res.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < (res.length - 1); i++) {
            if (res[i].typ === AddressItemType.BUILDING && res[i + 1].typ === AddressItemType.BUILDING && (res[i].beginToken instanceof TextToken)) {
                if (res[i].beginToken.term.startsWith("ЗД")) {
                    res[i] = res[i].clone();
                    res[i].typ = AddressItemType.HOUSE;
                }
            }
        }
        for (let i = 0; i < res.length; i++) {
            if (res[i].typ === AddressItemType.PART) {
                if (i > 0 && ((res[i - 1].typ === AddressItemType.HOUSE || res[i - 1].typ === AddressItemType.PLOT))) 
                    continue;
                if (((i + 1) < res.length) && ((res[i + 1].typ === AddressItemType.HOUSE || res[i + 1].typ === AddressItemType.PLOT))) 
                    continue;
                if (i === 0) 
                    return null;
                res.splice(i, res.length - i);
                break;
            }
            else if ((res[i].typ === AddressItemType.NONUMBER && i === (res.length - 1) && i > 0) && res[i - 1].typ === AddressItemType.CITY) {
                res[i] = res[i].clone();
                res[i].typ = AddressItemType.HOUSE;
            }
        }
        if (res.length > 0 && MiscLocationHelper.isUserParamAddress(res[0])) {
            for (let i = 0; i < (res.length - 1); i++) {
                for (let j = i + 1; j < res.length; j++) {
                    if (res[j].isNewlineBefore) 
                        break;
                    if (res[i].typ === res[j].typ && (res[i].referent instanceof GeoReferent) && res[j].referent === res[i].referent) {
                        res.splice(j, 1);
                        j--;
                    }
                }
            }
        }
        while (res.length > 0) {
            let last = res[res.length - 1];
            if (last.typ === AddressItemType.DETAIL && last.detailType === AddressDetailType.CROSS && last.lengthChar === 1) {
                res.splice(res.length - 1, 1);
                continue;
            }
            if (last.typ === AddressItemType.CITY && res.length > 4) {
                let ok = false;
                for (let ii = 0; ii < 3; ii++) {
                    if (res[ii].typ === AddressItemType.CITY) 
                        ok = true;
                }
                if (ok) {
                    res.splice(res.length - 1, 1);
                    continue;
                }
            }
            if (last.typ !== AddressItemType.STREET || !(last.refToken instanceof OrgItemToken)) 
                break;
            if (last.refToken.isGsk || last.refToken.hasTerrKeyword) 
                break;
            if (MiscLocationHelper.isUserParamAddress(last)) 
                break;
            res.splice(res.length - 1, 1);
        }
        if (res.length > 2 && MiscLocationHelper.isUserParamAddress(res[0])) {
            for (let i = 1; i < res.length; i++) {
                if (((res[i - 1].typ === AddressItemType.STREET || res[i - 1].typ === AddressItemType.CITY)) && res[i].typ === AddressItemType.STREET) {
                    let sr = Utils.as(res[i].referent, StreetReferent);
                    if (sr === null) 
                        continue;
                    if ((sr.numbers === null || sr.names.length > 0 || sr.typs.length !== 1) || sr.typs[0] !== "улица") 
                        continue;
                    if ((i + 1) < res.length) 
                        continue;
                    if (res[i - 1].typ === AddressItemType.CITY) {
                        let geo = Utils.as(res[i - 1].referent, GeoReferent);
                        if (geo === null) 
                            continue;
                        if (geo.typs.includes("город")) 
                            continue;
                    }
                    res[i] = res[i].clone();
                    res[i].typ = AddressItemType.HOUSE;
                    res[i].value = sr.numbers;
                    res[i].referent = null;
                }
            }
        }
        for (let i = 0; i < (res.length - 2); i++) {
            if (res[i].typ === AddressItemType.REGION && res[i + 1].typ === AddressItemType.NUMBER && res[i + 2].typ === AddressItemType.CITY) {
                let ok = false;
                for (let j = i + 3; j < res.length; j++) {
                    if (res[j].typ === AddressItemType.STREET || res[j].value !== null) 
                        ok = true;
                }
                if (ok) {
                    res.splice(i + 1, 1);
                    break;
                }
            }
        }
        return res;
    }
    
    constructor(_typ, begin, end) {
        super(begin, end, null);
        this.m_Typ = AddressItemType.PREFIX;
        this.value = null;
        this.referent = null;
        this.refToken = null;
        this.referent2 = null;
        this.refToken2 = null;
        this.refTokenIsGsk = false;
        this.refTokenIsMassive = false;
        this.isDoubt = false;
        this.isGenplan = false;
        this.detailType = AddressDetailType.UNDEFINED;
        this.buildingType = AddressBuildingType.UNDEFINED;
        this.houseType = AddressHouseType.UNDEFINED;
        this.detailMeters = 0;
        this.detailParam = null;
        this.ortoTerr = null;
        this.altTyp = null;
        this.typ = _typ;
    }
    
    get typ() {
        return this.m_Typ;
    }
    set typ(_value) {
        this.m_Typ = _value;
        if (_value === AddressItemType.HOUSE) {
        }
        return _value;
    }
    
    clone() {
        let res = new AddressItemToken(this.typ, this.beginToken, this.endToken);
        res.morph = this.morph;
        res.value = this.value;
        res.referent = this.referent;
        res.refToken = this.refToken;
        res.referent2 = this.referent2;
        res.refToken2 = this.refToken2;
        res.refTokenIsGsk = this.refTokenIsGsk;
        res.refTokenIsMassive = this.refTokenIsMassive;
        res.isDoubt = this.isDoubt;
        res.detailType = this.detailType;
        res.buildingType = this.buildingType;
        res.houseType = this.houseType;
        res.detailMeters = this.detailMeters;
        res.detailParam = this.detailParam;
        res.isGenplan = this.isGenplan;
        if (this.ortoTerr !== null) 
            res.ortoTerr = this.ortoTerr.clone();
        if (this.altTyp !== null) 
            res.altTyp = this.altTyp.clone();
        return res;
    }
    
    get isStreetRoad() {
        if (this.typ !== AddressItemType.STREET) 
            return false;
        if (!(this.referent instanceof StreetReferent)) 
            return false;
        return this.referent.kind === StreetKind.ROAD;
    }
    
    get isStreetDetail() {
        if (this.typ !== AddressItemType.STREET) 
            return false;
        if (!(this.referent instanceof StreetReferent)) 
            return false;
        for (const s of this.referent.getStringValues("MISC")) {
            if (s.includes("бизнес") || s.includes("делов") || s.includes("офис")) 
                return true;
        }
        return false;
    }
    
    get isDigit() {
        if (this.value === "Б/Н" || this.value === "НЕТ") 
            return true;
        if (Utils.isNullOrEmpty(this.value)) 
            return false;
        if (Utils.isDigit(this.value[0]) || this.value[0] === '-') 
            return true;
        if (this.value.length > 1) {
            if (Utils.isLetter(this.value[0]) && Utils.isDigit(this.value[1])) 
                return true;
        }
        if (this.value.length !== 1 || !Utils.isLetter(this.value[0])) 
            return false;
        if (!this.beginToken.chars.isAllLower) 
            return false;
        return true;
    }
    
    get isHouse() {
        return (this.typ === AddressItemType.HOUSE || this.typ === AddressItemType.PLOT || this.typ === AddressItemType.BOX) || this.typ === AddressItemType.BUILDING || this.typ === AddressItemType.CORPUS;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(this.typ.toString()).append(" ").append(((this.value != null ? this.value : "")));
        if (this.referent !== null) 
            res.append(" <").append(this.referent.toString()).append(">");
        if (this.referent2 !== null) 
            res.append(" / <").append(this.referent2.toString()).append(">");
        if (this.detailType !== AddressDetailType.UNDEFINED || this.detailMeters > 0) 
            res.append(" [").append(String(this.detailType)).append(", ").append(this.detailMeters).append("]");
        if (this.ortoTerr !== null) 
            res.append(" TERR: ").append(this.ortoTerr);
        if (this.altTyp !== null) 
            res.append(" ALT: ").append(this.altTyp);
        return res.toString();
    }
    
    static _findAddrTyp(t, maxChar, lev = 0) {
        if (t === null || t.endChar > maxChar) 
            return null;
        if (lev > 5) 
            return null;
        if (t instanceof ReferentToken) {
            let geo = Utils.as(t.getReferent(), GeoReferent);
            if (geo !== null) {
                for (const s of geo.slots) {
                    if (s.typeName === GeoReferent.ATTR_TYPE) {
                        let ty = String(s.value);
                        if (ty.includes("район")) 
                            return null;
                    }
                }
            }
            for (let tt = t.beginToken; tt !== null && tt.endChar <= t.endChar; tt = tt.next) {
                if (tt.endChar > maxChar) 
                    break;
                if (tt.isValue("У", null)) {
                    if (geo.findSlot(GeoReferent.ATTR_TYPE, "улус", true) !== null) 
                        continue;
                }
                let ty = AddressItemToken._findAddrTyp(tt, maxChar, lev + 1);
                if (ty !== null) 
                    return ty;
            }
        }
        else {
            let ai = AddressItemToken._tryAttachDetail(t, null);
            if (ai !== null) {
                if (ai.detailType !== AddressDetailType.UNDEFINED || ai.detailMeters > 0) 
                    return ai;
            }
        }
        return null;
    }
    
    static tryParse(t, prefixBefore = false, prev = null, ad = null) {
        if (t === null) 
            return null;
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (ad.aLevel > 1) 
            return null;
        ad.aLevel++;
        let res = AddressItemToken._TryParse(t, prefixBefore, prev, ad);
        ad.aLevel--;
        if (((res !== null && !res.isWhitespaceAfter && res.endToken.next !== null) && ((res.endToken.next.isHiphen || res.endToken.next.isCharOf("\\/"))) && !res.endToken.next.isWhitespaceAfter) && res.value !== null) {
            if ((res.typ === AddressItemType.HOUSE || res.typ === AddressItemType.BUILDING || res.typ === AddressItemType.CORPUS) || res.typ === AddressItemType.PLOT) {
                let tt = res.endToken.next.next;
                let _next = AddressItemToken.tryParsePureItem(tt, null, null);
                if (_next !== null && _next.typ === AddressItemType.NUMBER) {
                    res = res.clone();
                    res.value = (res.value + (res.endToken.next.isHiphen ? "-" : "/") + _next.value);
                    res.endToken = _next.endToken;
                    tt = res.endToken.next;
                    if ((tt !== null && ((tt.isHiphen || tt.isCharOf("\\/"))) && !tt.isWhitespaceBefore) && !tt.isWhitespaceAfter) {
                        _next = AddressItemToken.tryParsePureItem(tt.next, null, null);
                        if (_next !== null && _next.typ === AddressItemType.NUMBER) {
                            res.value = (res.value + (tt.isHiphen ? "-" : "/") + _next.value);
                            res.endToken = _next.endToken;
                        }
                    }
                }
                else if ((tt instanceof TextToken) && tt.lengthChar === 1 && tt.chars.isAllUpper) {
                    res.value = (res.value + "-" + tt.term);
                    res.endToken = tt;
                }
            }
        }
        return res;
    }
    
    static _TryParse(t, prefixBefore, prev, ad) {
        const StreetDefineHelper = require("./StreetDefineHelper");
        const OrgItemToken = require("./../../geo/internal/OrgItemToken");
        if (t === null) 
            return null;
        if (t instanceof ReferentToken) {
            let rt = Utils.as(t, ReferentToken);
            let ty = null;
            let geo = Utils.as(rt.referent, GeoReferent);
            if ((geo !== null && t.next !== null && t.next.isHiphen) && MiscLocationHelper.isUserParamAddress(t)) {
                let sit = StreetItemToken.tryParseSpec(t, null);
                if (sit !== null && sit[0].typ === StreetItemType.NAME) 
                    geo = null;
            }
            if (geo !== null) {
                if (geo.isCity) 
                    ty = AddressItemType.CITY;
                else if (geo.isState) 
                    ty = AddressItemType.COUNTRY;
                else 
                    ty = AddressItemType.REGION;
                let res = AddressItemToken._new293(ty, t, t, rt.referent);
                if (ty !== AddressItemType.CITY) 
                    return res;
                for (let tt = t.beginToken; tt !== null && tt.endChar <= t.endChar; tt = tt.next) {
                    if (tt instanceof ReferentToken) {
                        if (tt.getReferent() === geo) {
                            let res1 = AddressItemToken._TryParse(tt, false, prev, ad);
                            if (res1 !== null && ((res1.detailMeters > 0 || res1.detailType !== AddressDetailType.UNDEFINED))) {
                                res1.beginToken = res1.endToken = t;
                                return res1;
                            }
                        }
                        continue;
                    }
                    let det = AddressItemToken._tryParsePureItem(tt, false, null);
                    if (det !== null) {
                        if (tt.isValue("У", null) && geo.findSlot(GeoReferent.ATTR_TYPE, "улус", true) !== null) {
                        }
                        else {
                            if (det.detailType !== AddressDetailType.UNDEFINED && res.detailType === AddressDetailType.UNDEFINED) 
                                res.detailType = det.detailType;
                            if (det.detailMeters > 0) 
                                res.detailMeters = det.detailMeters;
                        }
                    }
                }
                return res;
            }
        }
        let kvart = false;
        if (prev !== null) {
            if (t.isValue("КВ", null) || t.isValue("КВАРТ", null)) {
                if ((((prev.typ === AddressItemType.HOUSE || prev.typ === AddressItemType.NUMBER || prev.typ === AddressItemType.BUILDING) || prev.typ === AddressItemType.FLOOR || prev.typ === AddressItemType.POTCH) || prev.typ === AddressItemType.CORPUS || prev.typ === AddressItemType.CORPUSORFLAT) || prev.typ === AddressItemType.DETAIL) 
                    return AddressItemToken.tryParsePureItem(t, prev, null);
                kvart = true;
            }
        }
        if (prev !== null && ((t.isValue("П", null) || t.isValue("ПОЗ", null) || t.isValue("ПОЗИЦИЯ", null)))) {
            if (((MiscLocationHelper.isUserParamAddress(t) || prev.typ === AddressItemType.STREET || prev.typ === AddressItemType.CITY) || prev.typ === AddressItemType.GENPLAN || prev.typ === AddressItemType.PLOT) || prev.typ === AddressItemType.CITY) {
                let tt = t.next;
                if (tt !== null && tt.isChar('.')) 
                    tt = tt.next;
                let _next = AddressItemToken.tryParsePureItem(tt, null, null);
                if (_next !== null && ((_next.typ === AddressItemType.NUMBER || _next.typ === AddressItemType.GENPLAN))) {
                    _next = _next.clone();
                    _next.beginToken = t;
                    _next.isGenplan = true;
                    _next.typ = AddressItemType.NUMBER;
                    return _next;
                }
            }
        }
        let pure = AddressItemToken.tryParsePureItem(t, prev, ad);
        if ((pure !== null && pure.typ !== AddressItemType.NUMBER && pure.typ !== AddressItemType.KILOMETER) && pure.value !== null) {
            if (t.isValue("СТ", null) && OrgItemToken.tryParse(t, null) !== null) {
            }
            else if (kvart) {
                let ttt = pure.endToken.next;
                if (ttt !== null && ttt.isComma) 
                    ttt = ttt.next;
                let _next = AddressItemToken.tryParsePureItem(ttt, null, null);
                if (_next !== null && _next.typ === AddressItemType.PLOT) {
                }
                else 
                    return pure;
            }
            else 
                return pure;
        }
        let tt2 = MiscLocationHelper.checkTerritory(t);
        if (tt2 !== null) {
            let _next = AddressItemToken.tryParse(tt2.next, false, null, null);
            if (_next !== null && _next.typ === AddressItemType.STREET) {
                let ss = Utils.as(_next.referent, StreetReferent);
                if (ss.kind === StreetKind.ROAD || ss.kind === StreetKind.RAILWAY) {
                    _next.beginToken = t;
                    return _next;
                }
            }
        }
        let sli = StreetItemToken.tryParseList(t, 10, ad);
        if (sli !== null) {
            let rt = StreetDefineHelper.tryParseStreet(sli, prefixBefore, false, (prev !== null && prev.typ === AddressItemType.STREET), null);
            if (rt === null && sli[0].typ !== StreetItemType.FIX) {
                let org = OrgItemToken.tryParse(t, null);
                if (org !== null) {
                    let si = StreetItemToken._new294(t, org.endToken, StreetItemType.FIX, org);
                    sli.splice(0, sli.length);
                    sli.push(si);
                    rt = StreetDefineHelper.tryParseStreet(sli, prefixBefore || prev !== null, false, false, null);
                }
                else if (sli.length === 1 && sli[0].typ === StreetItemType.NOUN && !sli[0].isNewlineAfter) {
                    org = OrgItemToken.tryParse(sli[0].endToken.next, null);
                    if (org !== null) {
                        let _typ = sli[0].termin.canonicText.toLowerCase();
                        let si = StreetItemToken._new294(t, org.endToken, StreetItemType.FIX, org);
                        sli.splice(0, sli.length);
                        sli.push(si);
                        rt = StreetDefineHelper.tryParseStreet(sli, prefixBefore || prev !== null, false, false, null);
                        if (rt !== null) {
                            let sr = Utils.as(rt.referent, StreetReferent);
                            sr.addSlot(StreetReferent.ATTR_TYPE, null, true, 0);
                            sr.addTyp(_typ);
                            sr.kind = StreetKind.UNDEFINED;
                        }
                    }
                }
            }
            if ((rt === null && prev !== null && prev.typ === AddressItemType.CITY) && MiscLocationHelper.isUserParamAddress(sli[0])) {
                if (sli.length === 1 && (((sli[0].typ === StreetItemType.NAME || sli[0].typ === StreetItemType.STDNAME || sli[0].typ === StreetItemType.STDADJECTIVE) || ((sli[0].typ === StreetItemType.NUMBER && sli[0].beginToken.morph._class.isAdjective))))) 
                    rt = StreetDefineHelper.tryParseStreet(sli, true, false, false, null);
            }
            if (rt !== null) {
                if (sli.length > 2) {
                }
                if (rt.beginChar > sli[0].beginChar) 
                    return null;
                let crlf = false;
                for (let ttt = rt.beginToken; ttt !== rt.endToken && (ttt.endChar < rt.endChar); ttt = ttt.next) {
                    if (ttt.isNewlineAfter) {
                        crlf = true;
                        break;
                    }
                }
                if (crlf) {
                    for (let ttt = rt.beginToken.previous; ttt !== null; ttt = ttt.previous) {
                        if (ttt.morph._class.isPreposition || ttt.isComma) 
                            continue;
                        if (ttt.getReferent() instanceof GeoReferent) 
                            crlf = false;
                        break;
                    }
                    if (sli[0].typ === StreetItemType.NOUN && sli[0].termin.canonicText.includes("ДОРОГА")) 
                        crlf = false;
                }
                if (crlf) {
                    let aat = AddressItemToken.tryParsePureItem(rt.endToken.next, null, null);
                    if (aat === null) 
                        return null;
                    if (aat.typ !== AddressItemType.HOUSE) 
                        return null;
                }
                if (rt.endToken.next !== null && rt.endToken.next.isCharOf("\\/")) {
                    if (!AddressItemToken.checkHouseAfter(rt.endToken.next.next, false, false)) {
                        let sli2 = StreetItemToken.tryParseList(rt.endToken.next.next, 10, ad);
                        if (sli2 !== null && sli2.length > 0) {
                            let rt2 = StreetDefineHelper.tryParseStreet(sli2, prefixBefore, false, true, Utils.as(rt.referent, StreetReferent));
                            if (rt2 !== null) {
                                rt.endToken = rt2.endToken;
                                rt.referent2 = rt2.referent;
                            }
                        }
                    }
                }
                return rt;
            }
            if (sli.length === 1 && sli[0].typ === StreetItemType.NOUN) {
                let tt = sli[0].endToken.next;
                if (tt !== null && ((tt.isHiphen || tt.isChar('_') || tt.isValue("НЕТ", null)))) {
                    let ttt = tt.next;
                    if (ttt !== null && ttt.isComma) 
                        ttt = ttt.next;
                    let att = AddressItemToken.tryParsePureItem(ttt, null, null);
                    if (att !== null) {
                        if (att.typ === AddressItemType.HOUSE || att.typ === AddressItemType.CORPUS || att.typ === AddressItemType.BUILDING) 
                            return new AddressItemToken(AddressItemType.STREET, t, tt);
                    }
                }
            }
        }
        if (t === null || pure !== null) 
            return pure;
        if ((t.lengthChar === 1 && t.chars.isLetter && prev !== null) && prev.typ === AddressItemType.CITY && MiscLocationHelper.isUserParamAddress(t)) {
            let tt = t.next;
            if (tt !== null && tt.isHiphen) 
                tt = tt.next;
            let ch = AddressItemToken.correctCharToken(t);
            if ((tt instanceof NumberToken) && ch !== null) {
                let micr = new StreetReferent();
                micr.addTyp("микрорайон");
                micr.addSlot(StreetReferent.ATTR_NAME, ch, false, 0);
                micr.addSlot(StreetReferent.ATTR_NUMBER, tt.value, false, 0);
                micr.kind = StreetKind.AREA;
                return AddressItemToken._new296(AddressItemType.STREET, t, tt, micr, new ReferentToken(micr, t, tt));
            }
        }
        return null;
    }
    
    static prepareAllData(t0) {
        if (!AddressItemToken.SPEED_REGIME) 
            return;
        let ad = GeoAnalyzer.getData(t0);
        if (ad === null) 
            return;
        ad.aRegime = false;
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, GeoTokenData);
            let prev = null;
            let kk = 0;
            for (let tt = t.previous; tt !== null && (kk < 10); tt = tt.previous,kk++) {
                let dd = Utils.as(tt.tag, GeoTokenData);
                if (dd === null) 
                    continue;
                if (dd.street !== null) {
                    if (dd.street.endToken.next === t) 
                        prev = dd.addr;
                    else if (t.previous !== null && t.previous.isComma && dd.street.endToken.next === t.previous) 
                        prev = dd.addr;
                }
                else if (dd.addr !== null && (((dd.addr.typ === AddressItemType.HOUSE || dd.addr.typ === AddressItemType.FLAT || dd.addr.typ === AddressItemType.CORPUS) || dd.addr.typ === AddressItemType.BUILDING))) {
                    if (dd.addr.endToken.next === t) 
                        prev = dd.addr;
                    else if (t.previous !== null && t.previous.isComma && dd.addr.endToken.next === t.previous) 
                        prev = dd.addr;
                }
            }
            let str = AddressItemToken.tryParsePureItem(t, prev, null);
            if (str !== null) {
                if (d === null) 
                    d = new GeoTokenData(t);
                d.addr = str;
            }
        }
        ad.aRegime = true;
    }
    
    static tryParsePureItem(t, prev = null, ad = null) {
        const OrgTypToken = require("./../../geo/internal/OrgTypToken");
        if (t === null) 
            return null;
        if (t.isChar(',')) 
            return null;
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return null;
        let maxLevel = 0;
        if ((prev !== null && prev.typ === AddressItemType.STREET && t.lengthChar === 1) && ((t.isValue("С", null) || t.isValue("Д", null)))) 
            maxLevel = 1;
        else if (AddressItemToken.SPEED_REGIME && ((ad.aRegime || ad.allRegime)) && !(t instanceof ReferentToken)) {
            let d = Utils.as(t.tag, GeoTokenData);
            if (d === null) 
                return null;
            if (d.addr === null) 
                return null;
            if (d.addr.houseType === AddressHouseType.ESTATE && d.noGeo) 
                return null;
            let ok = true;
            for (let tt = t; tt !== null && tt.beginChar <= d.addr.endChar; tt = tt.next) {
                if (tt instanceof ReferentToken) {
                    ok = false;
                    maxLevel = 1;
                    break;
                }
            }
            if (ok) 
                return d.addr;
        }
        if (ad.aLevel > (maxLevel + 1)) 
            return null;
        if (ad.level > 1) 
            return null;
        ad.level++;
        let res = AddressItemToken._tryParsePureItem(t, false, prev);
        if (res === null && BracketHelper.isBracket(t, false) && (t.whitespacesAfterCount < 2)) {
            let res1 = AddressItemToken._tryParsePureItem(t.next, false, prev);
            if (res1 !== null && BracketHelper.isBracket(res1.endToken.next, false)) {
                res = res1;
                res.beginToken = t;
                res.endToken = res1.endToken.next;
            }
        }
        if ((res === null && prev !== null && t.lengthChar === 1) && t.isValue("С", null)) {
            if (prev.typ === AddressItemType.CORPUS || prev.typ === AddressItemType.HOUSE || prev.typ === AddressItemType.STREET) {
                let _next = AddressItemToken._tryParsePureItem(t.next, false, null);
                if (_next !== null && _next.typ === AddressItemType.NUMBER) {
                    _next.typ = AddressItemType.BUILDING;
                    _next.beginToken = t;
                    res = _next;
                }
            }
        }
        if (res !== null && res.typ === AddressItemType.DETAIL) {
        }
        else {
            let det = AddressItemToken._tryAttachDetail(t, null);
            if (res === null) 
                res = det;
            else if (det !== null && det.endChar > res.endChar) 
                res = det;
        }
        if ((res !== null && !Utils.isNullOrEmpty(res.value) && Utils.isDigit(res.value[res.value.length - 1])) && MiscLocationHelper.isUserParamAddress(res)) {
            let t1 = res.endToken.next;
            if (((t1 instanceof TextToken) && (t1.whitespacesBeforeCount < 3) && t1.chars.isLetter) && t1.lengthChar === 1) {
                let res2 = AddressItemToken._tryParsePureItem(t1, false, null);
                if (res2 === null) {
                    let sit = StreetItemToken.tryParse(t1, null, false, null);
                    if (sit !== null && sit.typ === StreetItemType.NOUN) {
                    }
                    else {
                        let ch = AddressItemToken.correctCharToken(t1);
                        if (OrgTypToken.tryParse(t1, false, null) !== null) 
                            ch = null;
                        if (ch !== null && ch !== "К" && ch !== "С") {
                            res.value = (res.value + ch);
                            res.endToken = t1;
                        }
                    }
                }
            }
        }
        if ((res !== null && res.typ === AddressItemType.NUMBER && res.endToken.next !== null) && res.endToken.next.isValue("ДОЛЯ", null)) {
            res.endToken = res.endToken.next;
            res.typ = AddressItemType.PART;
            res.value = "1";
        }
        if (res === null && t.getMorphClassInDictionary().isPreposition) {
            let _next = AddressItemToken.tryParsePureItem(t.next, null, null);
            if (_next !== null && _next.typ !== AddressItemType.NUMBER && !t.next.isValue("СТ", null)) {
                _next.beginToken = t;
                res = _next;
            }
        }
        ad.level--;
        return res;
    }
    
    static _tryParsePureItem(t, prefixBefore, prev) {
        const CityItemToken = require("./../../geo/internal/CityItemToken");
        if (t instanceof NumberToken) {
            let n = Utils.as(t, NumberToken);
            if (((n.lengthChar === 6 || n.lengthChar === 5)) && n.typ === NumberSpellingType.DIGIT && !n.morph._class.isAdjective) 
                return AddressItemToken._new289(AddressItemType.ZIP, t, t, n.value.toString());
            let ok = false;
            if ((t.previous !== null && t.previous.morph._class.isPreposition && t.next !== null) && t.next.chars.isLetter && t.next.chars.isAllLower) 
                ok = true;
            else if (t.morph._class.isAdjective && !t.morph._class.isNoun) 
                ok = true;
            let tok0 = AddressItemToken.m_Ontology.tryParse(t.next, TerminParseAttr.NO);
            if (tok0 !== null && (tok0.termin.tag instanceof AddressItemType)) {
                let typ0 = AddressItemType.of(tok0.termin.tag);
                if (tok0.endToken.next === null || tok0.endToken.isNewlineAfter) 
                    ok = true;
                else if (tok0.endToken.next.isComma && (tok0.endToken.next.next instanceof NumberToken) && typ0 === AddressItemType.FLAT) 
                    return AddressItemToken._new289(AddressItemType.HOUSE, t, t, n.value);
                if (typ0 === AddressItemType.FLAT) {
                    if ((t.next instanceof TextToken) && t.next.isValue("КВ", null)) {
                        if (t.next.getSourceText() === "кВ") 
                            return null;
                        let si = StreetItemToken.tryParse(t.next, null, false, null);
                        if (si !== null && si.typ === StreetItemType.NOUN && si.endChar > tok0.endChar) 
                            return null;
                        let suf = NumberHelper.tryParsePostfixOnly(t.next);
                        if (suf !== null) 
                            return null;
                    }
                    if ((tok0.endToken.next instanceof NumberToken) && (tok0.endToken.whitespacesAfterCount < 3)) {
                        if (prev !== null && ((prev.typ === AddressItemType.STREET || prev.typ === AddressItemType.CITY))) 
                            return AddressItemToken._new289(AddressItemType.NUMBER, t, t, n.value.toString());
                    }
                }
                if (tok0.endToken.next instanceof NumberToken) {
                }
                else if (tok0.endToken.next !== null && tok0.endToken.next.isValue("НЕТ", null)) {
                }
                else if ((((typ0 === AddressItemType.KILOMETER || typ0 === AddressItemType.FLOOR || typ0 === AddressItemType.BLOCK) || typ0 === AddressItemType.POTCH || typ0 === AddressItemType.FLAT) || typ0 === AddressItemType.PLOT || typ0 === AddressItemType.BOX) || typ0 === AddressItemType.OFFICE) {
                    let _next = AddressItemToken._tryParsePureItem(tok0.endToken.next, false, null);
                    if (_next !== null && _next.typ === AddressItemType.NUMBER) {
                    }
                    else {
                        _next = AddressItemToken._tryParsePureItem(tok0.endToken, false, null);
                        if (_next !== null && _next.value !== null && _next.value !== "0") {
                        }
                        else 
                            return AddressItemToken._new289(typ0, t, tok0.endToken, n.value.toString());
                    }
                }
            }
        }
        let prepos = false;
        let tok = null;
        if (t !== null && t.morph._class.isPreposition) {
            if ((((tok = AddressItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO)))) === null) {
                if (t.beginChar < t.endChar) 
                    return null;
                if (t.isValue("В", null) && MiscLocationHelper.isUserParamAddress(t)) {
                    let tt = t.next;
                    if (tt !== null && tt.isChar('.')) 
                        tt = tt.next;
                    let num1 = NumToken.tryParse(tt, GeoTokenType.HOUSE);
                    if (num1 !== null) {
                        for (let tt0 = t.previous; tt0 !== null; tt0 = tt0.previous) {
                            if (tt0.isValue("КВАРТАЛ", null) || tt0.isValue("КВ", null) || tt0.isValue("ЛЕСНИЧЕСТВО", null)) 
                                return AddressItemToken._new289(AddressItemType.PLOT, t, num1.endToken, num1.value);
                            if (tt0.isNewlineBefore) 
                                break;
                        }
                    }
                }
                if (!t.isCharOf("КСкс")) 
                    t = t.next;
                prepos = true;
            }
        }
        if (t === null) 
            return null;
        if ((((t instanceof TextToken) && t.lengthChar === 1 && t.chars.isLetter) && !t.isValue("V", null) && !t.isValue("I", null)) && !t.isValue("X", null)) {
            if (t.previous !== null && t.previous.isComma) {
                if (t.isNewlineAfter || t.next.isComma) 
                    return AddressItemToken._new113(AddressItemType.BUILDING, t, t, AddressBuildingType.LITER, t.term);
            }
        }
        if (t.isChar('/')) {
            let _next = AddressItemToken.tryParsePureItem(t.next, prev, null);
            if (_next !== null && _next.endToken.next !== null && _next.endToken.next.isChar('/')) {
                _next.beginToken = t;
                _next.endToken = _next.endToken.next;
                return _next;
            }
            if (_next !== null && _next.endToken.isChar('/')) {
                _next.beginToken = t;
                return _next;
            }
        }
        if (tok === null) 
            tok = AddressItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        let t1 = t;
        let _typ = AddressItemType.NUMBER;
        let houseTyp = AddressHouseType.UNDEFINED;
        let buildTyp = AddressBuildingType.UNDEFINED;
        let tok00 = tok;
        if (tok !== null) {
            if (t.isValue("УЖЕ", null)) 
                return null;
            if (t.isValue("ЛИТЕРА", null)) {
                let str = t.getSourceText();
                if (Utils.isUpperCase(str[str.length - 1]) && Utils.isLowerCase(str[str.length - 2])) 
                    return AddressItemToken._new113(AddressItemType.BUILDING, t, t, AddressBuildingType.LITER, str.substring(str.length - 1));
            }
            if (tok.termin.canonicText === "ТАМ ЖЕ") {
                let cou = 0;
                for (let tt = t.previous; tt !== null; tt = tt.previous) {
                    if (cou > 1000) 
                        break;
                    let r = tt.getReferent();
                    if (r === null) 
                        continue;
                    if (r instanceof AddressReferent) {
                        let g = Utils.as(r.getSlotValue(AddressReferent.ATTR_GEO), GeoReferent);
                        if (g !== null) 
                            return AddressItemToken._new293(AddressItemType.CITY, t, tok.endToken, g);
                        break;
                    }
                    else if (r instanceof GeoReferent) {
                        let g = Utils.as(r, GeoReferent);
                        if (!g.isState) 
                            return AddressItemToken._new293(AddressItemType.CITY, t, tok.endToken, g);
                    }
                }
                return null;
            }
            if (tok.termin.tag instanceof AddressDetailType) 
                return AddressItemToken._tryAttachDetail(t, tok);
            t1 = tok.endToken.next;
            if ((t1 instanceof TextToken) && t1.term.startsWith("ОБ")) {
                tok.endToken = t1;
                t1 = t1.next;
                if (t1 !== null && t1.isChar('.')) {
                    tok.endToken = t1;
                    t1 = t1.next;
                }
            }
            if ((t1 !== null && t1.isChar('(') && (t1.next instanceof TextToken)) && t1.next.term.startsWith("ОБ")) {
                tok.endToken = t1.next;
                t1 = t1.next.next;
                while (t1 !== null) {
                    if (t1.isCharOf(".)")) {
                        tok.endToken = t1;
                        t1 = t1.next;
                    }
                    else 
                        break;
                }
            }
            if (tok.termin.tag instanceof AddressItemType) {
                if (tok.termin.tag2 instanceof AddressHouseType) 
                    houseTyp = AddressHouseType.of(tok.termin.tag2);
                if (tok.termin.tag2 instanceof AddressBuildingType) 
                    buildTyp = AddressBuildingType.of(tok.termin.tag2);
                _typ = AddressItemType.of(tok.termin.tag);
                if (_typ === AddressItemType.PLOT) {
                    if (t.previous !== null && ((t.previous.isValue("СУДЕБНЫЙ", "СУДОВИЙ") || t.previous.isValue("ИЗБИРАТЕЛЬНЫЙ", "ВИБОРЧИЙ")))) 
                        return null;
                }
                if (t1 !== null && t1.isCharOf("\\/") && AddressItemToken.m_Ontology.tryParse(t1.next, TerminParseAttr.NO) !== null) {
                    let aa = AddressItemToken.tryParsePureItem(t1.next, null, null);
                    if (aa !== null && aa.typ !== AddressItemType.NUMBER && aa.value !== null) {
                        let ii = aa.value.indexOf('/');
                        if (ii < 0) 
                            ii = aa.value.indexOf('\\');
                        if (ii > 0) {
                            let res = new AddressItemToken(_typ, t, aa.endToken);
                            res.value = aa.value.substring(0, 0 + ii);
                            res.altTyp = aa;
                            aa.value = aa.value.substring(ii + 1);
                            return res;
                        }
                    }
                }
                if (_typ === AddressItemType.HOUSE && houseTyp === AddressHouseType.SPECIAL) {
                    let tt2 = tok.endToken.next;
                    if (tt2 !== null && tt2.isHiphen) 
                        tt2 = tt2.next;
                    let res = AddressItemToken._new306(_typ, t, tok.endToken, houseTyp, (tok.termin.acronym != null ? tok.termin.acronym : tok.termin.canonicText));
                    let num2 = NumToken.tryParse(tt2, GeoTokenType.ANY);
                    if (num2 !== null && (tt2.whitespacesBeforeCount < 2)) {
                        res.value = (res.value + "-" + num2.value);
                        res.endToken = num2.endToken;
                    }
                    return res;
                }
                if (_typ === AddressItemType.PREFIX) {
                    for (; t1 !== null; t1 = t1.next) {
                        if (((t1.morph._class.isPreposition || t1.morph._class.isConjunction)) && t1.whitespacesAfterCount === 1) 
                            continue;
                        if (t1.isChar(':')) {
                            t1 = t1.next;
                            break;
                        }
                        if (t1.isChar('(')) {
                            let br = BracketHelper.tryParse(t1, BracketParseAttr.NO, 100);
                            if (br !== null && (br.lengthChar < 50)) {
                                t1 = br.endToken;
                                continue;
                            }
                        }
                        if (t1 instanceof TextToken) {
                            if (t1.chars.isAllLower || (t1.whitespacesBeforeCount < 3)) {
                                let npt = MiscLocationHelper.tryParseNpt(t1);
                                if (npt !== null && ((npt.chars.isAllLower || npt.morph._case.isGenitive))) {
                                    if (CityItemToken.checkKeyword(npt.endToken) === null && TerrItemToken.checkKeyword(npt.endToken) === null) {
                                        t1 = npt.endToken;
                                        continue;
                                    }
                                }
                            }
                        }
                        if (t1.isValue("УКАЗАННЫЙ", null) || t1.isValue("ЕГРИП", null) || t1.isValue("ФАКТИЧЕСКИЙ", null)) 
                            continue;
                        if (t1.isComma) {
                            if (t1.next !== null && t1.next.isValue("УКАЗАННЫЙ", null)) 
                                continue;
                        }
                        break;
                    }
                    if (t1 !== null) {
                        let t0 = t;
                        if (((t0.previous !== null && !t0.isNewlineBefore && t0.previous.isChar(')')) && (t0.previous.previous instanceof TextToken) && t0.previous.previous.previous !== null) && t0.previous.previous.previous.isChar('(')) {
                            t = t0.previous.previous.previous.previous;
                            if (t !== null && t.getMorphClassInDictionary().isAdjective && !t.isNewlineAfter) 
                                t0 = t;
                        }
                        let res = new AddressItemToken(AddressItemType.PREFIX, t0, t1.previous);
                        for (let tt = t0.previous; tt !== null; tt = tt.previous) {
                            if (tt.newlinesAfterCount > 3) 
                                break;
                            if (tt.isCommaAnd || tt.isCharOf("().")) 
                                continue;
                            if (!(tt instanceof TextToken)) 
                                break;
                            if (((tt.isValue("ПОЧТОВЫЙ", null) || tt.isValue("ЮРИДИЧЕСКИЙ", null) || tt.isValue("ЮР", null)) || tt.isValue("ФАКТИЧЕСКИЙ", null) || tt.isValue("ФАКТ", null)) || tt.isValue("ПОЧТ", null) || tt.isValue("АДРЕС", null)) 
                                res.beginToken = tt;
                            else 
                                break;
                        }
                        return res;
                    }
                    else 
                        return null;
                }
                else if ((_typ === AddressItemType.CORPUSORFLAT && !tok.isWhitespaceBefore && !tok.isWhitespaceAfter) && tok.beginToken === tok.endToken && tok.beginToken.isValue("К", null)) {
                    if (prev !== null && prev.typ === AddressItemType.FLAT) 
                        _typ = AddressItemType.ROOM;
                    else 
                        _typ = AddressItemType.CORPUS;
                }
                if (_typ === AddressItemType.DETAIL && t.isValue("У", null)) {
                    if (!MiscLocationHelper.checkGeoObjectBefore(t, false)) 
                        return null;
                }
                if (_typ === AddressItemType.FLAT && t.isValue("КВ", null)) {
                    if (t.getSourceText() === "кВ") 
                        return null;
                }
                if (((_typ === AddressItemType.FLAT || _typ === AddressItemType.SPACE || _typ === AddressItemType.OFFICE)) && !(tok.endToken.next instanceof NumberToken)) {
                    let _next = AddressItemToken._tryParsePureItem(tok.endToken.next, false, null);
                    if (_next !== null && _typ !== AddressItemType.OFFICE && ((_next.typ === AddressItemType.PANTRY || _next.typ === AddressItemType.FLAT))) {
                        if (_typ !== _next.typ) 
                            _next.typ = AddressItemType.PANTRY;
                        _next.beginToken = t;
                        return _next;
                    }
                    if (_next !== null && _typ === AddressItemType.OFFICE && ((_next.typ === AddressItemType.SPACE || _next.typ === AddressItemType.FLAT))) {
                        _next.typ = AddressItemType.OFFICE;
                        _next.beginToken = t;
                        return _next;
                    }
                    if (tok.endToken.next !== null && tok.endToken.next.isChar('(')) {
                        let tok2 = AddressItemToken.m_Ontology.tryParse(tok.endToken.next.next, TerminParseAttr.NO);
                        if (tok2 !== null && tok2.endToken.next !== null && tok2.endToken.next.isChar(')')) 
                            t1 = tok2.endToken.next.next;
                    }
                }
                if (_typ === AddressItemType.PANTRY && !(tok.endToken.next instanceof NumberToken)) {
                    let _next = AddressItemToken._tryParsePureItem(tok.endToken.next, false, null);
                    if (_next !== null && ((_next.typ === AddressItemType.SPACE || _next.typ === AddressItemType.FLAT))) {
                        _next.typ = AddressItemType.PANTRY;
                        _next.beginToken = t;
                        return _next;
                    }
                }
                if (_typ === AddressItemType.FLOOR && t1 !== null) {
                    let tt2 = t1;
                    if (tt2 !== null && tt2.isCharOf("\\/")) 
                        tt2 = tt2.next;
                    let _next = AddressItemToken._tryParsePureItem(tt2, prefixBefore, prev);
                    if (_next !== null && _next.value === "подвал") {
                        tt2 = _next.endToken.next;
                        if (tt2 !== null && tt2.isCharOf("\\/")) 
                            tt2 = tt2.next;
                        let num2 = AddressItemToken._tryParsePureItem(tt2, prefixBefore, prev);
                        if (num2 !== null && num2.typ === AddressItemType.NUMBER && num2.value !== null) {
                            num2.typ = _typ;
                            num2.beginToken = t;
                            num2.value = "-" + num2.value;
                            return num2;
                        }
                    }
                }
                if (_typ === AddressItemType.KILOMETER || _typ === AddressItemType.FLOOR || _typ === AddressItemType.POTCH) {
                    if ((tok.endToken.next instanceof NumberToken) || MiscHelper.checkNumberPrefix(tok.endToken.next) !== null) {
                    }
                    else 
                        return new AddressItemToken(_typ, t, tok.endToken);
                }
                if (_typ === AddressItemType.SPACE) {
                    if (tok.termin.tag2 !== null) {
                        let res = AddressItemToken._new289(_typ, t, tok.endToken, tok.termin.canonicText.toLowerCase());
                        if (res.endToken.next !== null && res.endToken.next.isHiphen) {
                            let next2 = AddressItemToken.tryParsePureItem(res.endToken.next.next, null, null);
                            if (next2 !== null && next2.typ === AddressItemType.SPACE) 
                                res.endToken = next2.endToken;
                        }
                        return res;
                    }
                    let _next = AddressItemToken.tryParsePureItem(tok.endToken.next, null, null);
                    if (_next !== null && _next.typ === AddressItemType.SPACE) {
                        _next.beginToken = t;
                        return _next;
                    }
                    let tt = tok.endToken.next;
                    if (tt instanceof TextToken) {
                        if (tt.term.startsWith("Н")) {
                            t1 = tt.next;
                            if (tt.next !== null && tt.next.isChar('.')) 
                                t1 = tt.next.next;
                        }
                    }
                }
                if ((_typ === AddressItemType.HOUSE || _typ === AddressItemType.BUILDING || _typ === AddressItemType.CORPUS) || _typ === AddressItemType.PLOT || _typ === AddressItemType.BOX) {
                    for (let tt2 = t1; tt2 !== null; tt2 = tt2.next) {
                        if (tt2.isComma) 
                            continue;
                        if (tt2.isValue("РАСПОЛОЖЕННЫЙ", null) || tt2.isValue("НАХОДЯЩИЙСЯ", null) || tt2.isValue("ПРИЛЕГАЮЩИЙ", null)) 
                            continue;
                        if (tt2.isValue("ПОДВАЛ", null)) {
                            t1 = tt2.next;
                            continue;
                        }
                        if (tt2.morph._class.isPreposition) 
                            continue;
                        let tok2 = AddressItemToken.m_Ontology.tryParse(tt2, TerminParseAttr.NO);
                        if (tok2 !== null && (tok2.termin.tag instanceof AddressItemType)) {
                            let typ2 = AddressItemType.of(tok2.termin.tag);
                            if (typ2 !== _typ && ((typ2 === AddressItemType.PLOT || ((typ2 === AddressItemType.HOUSE && _typ === AddressItemType.PLOT))))) 
                                return AddressItemToken._new308(_typ, t, tt2.previous, "0", houseTyp);
                            if (_typ === AddressItemType.BOX && typ2 === AddressItemType.SPACE && tok2.termin.canonicText === "ПОДВАЛ") {
                                tt2 = tok2.endToken;
                                t1 = tt2.next;
                                continue;
                            }
                        }
                        if (tt2 instanceof TextToken) {
                            if (tt2.term.startsWith("ДОП")) {
                                t1 = tt2.next;
                                if (t1 !== null && t1.isChar('.')) {
                                    tt2 = tt2.next;
                                    t1 = t1.next;
                                }
                                continue;
                            }
                        }
                        break;
                    }
                }
                if (_typ === AddressItemType.HOUSE && t1 !== null && t1.chars.isLetter) {
                    let _next = AddressItemToken.tryParsePureItem(t1, prev, null);
                    if (_next !== null && ((_next.typ === _typ || _next.typ === AddressItemType.PLOT))) {
                        _next.beginToken = t;
                        return _next;
                    }
                }
                if (_typ === AddressItemType.FLAT && (t1 instanceof TextToken) && ((t1.isValue("М", null) || t1.isValue("M", null)))) {
                    if (t1.next instanceof NumberToken) 
                        t1 = t1.next;
                    else if (t1.next !== null && t1.next.isChar('.') && (t1.next.next instanceof NumberToken)) 
                        t1 = t1.next.next;
                }
                if (_typ === AddressItemType.ROOM && t1 !== null && t1.isCharOf("\\/")) {
                    let _next = AddressItemToken._tryParsePureItem(t1.next, prefixBefore, prev);
                    if (_next !== null && ((_next.typ === AddressItemType.ROOM || _next.typ === AddressItemType.OFFICE))) {
                        _next.beginToken = t;
                        return _next;
                    }
                }
                if (_typ === AddressItemType.FIELD) {
                    let nt2 = NumberHelper.tryParseNumberWithPostfix(t1);
                    if (nt2 !== null && ((nt2.exTyp === NumberExType.METER2 || nt2.exTyp === NumberExType.GEKTAR || nt2.exTyp === NumberExType.AR))) 
                        return AddressItemToken._new289(_typ, t, nt2.endToken, nt2.toString());
                    let re = new AddressItemToken(_typ, t, tok.endToken);
                    let nnn = new StringBuilder();
                    for (let tt = tok.endToken.next; tt !== null; tt = tt.next) {
                        let ll = NumberHelper.tryParseRoman(tt);
                        if (ll !== null && ll.intValue !== null) {
                            if (nnn.length > 0) 
                                nnn.append("-");
                            nnn.append(ll.value);
                            re.endToken = (tt = ll.endToken);
                            continue;
                        }
                        if (tt.isHiphen) 
                            continue;
                        if (tt.isWhitespaceBefore) 
                            break;
                        if (tt instanceof NumberToken) {
                            if (nnn.length > 0) 
                                nnn.append("-");
                            nnn.append(tt.value);
                            re.endToken = tt;
                            continue;
                        }
                        if ((tt instanceof TextToken) && tt.chars.isAllUpper) {
                            if (nnn.length > 0) 
                                nnn.append("-");
                            nnn.append(tt.term);
                            re.endToken = tt;
                            continue;
                        }
                        break;
                    }
                    if (nnn.length > 0) {
                        re.value = nnn.toString();
                        return re;
                    }
                }
                if (_typ === AddressItemType.NONUMBER) 
                    return AddressItemToken._new310(AddressItemType.NONUMBER, t, tok.endToken, "0", false);
                if (_typ === AddressItemType.HOUSE || _typ === AddressItemType.PLOT) {
                    if (t1 !== null && t1.isValue("ЛПХ", null)) 
                        t1 = t1.next;
                }
                if ((_typ !== AddressItemType.NUMBER && (t1 instanceof TextToken) && t1.chars.isLetter) && !t1.chars.isAllUpper) {
                    let _next = AddressItemToken.tryParsePureItem(t1, null, null);
                    if ((_next !== null && _next.typ !== AddressItemType.NUMBER && _next.typ !== AddressItemType.NONUMBER) && _next.value !== null) {
                        _next.beginToken = t;
                        return _next;
                    }
                }
                if (_typ !== AddressItemType.NUMBER) {
                    if ((((t1 === null || tok.isNewlineAfter)) && t.lengthChar > 1 && ((prev !== null || MiscLocationHelper.isUserParamAddress(t)))) && !tok.isNewlineBefore) 
                        return AddressItemToken._new311(_typ, t, tok.endToken, houseTyp, buildTyp, "0");
                }
                if (_typ === AddressItemType.PLOT || _typ === AddressItemType.WELL) {
                    let num1 = NumToken.tryParse(t1, GeoTokenType.HOUSE);
                    if (num1 !== null) 
                        return AddressItemToken._new289(_typ, t, num1.endToken, num1.value);
                }
            }
        }
        if ((t1 !== null && t1.isComma && _typ === AddressItemType.FLAT) && (t1.next instanceof NumberToken)) 
            t1 = t1.next;
        if (t1 !== null && t1.isChar('.') && t1.next !== null) 
            t1 = t1.next;
        if ((t1 !== null && t1 !== t && ((t1.isHiphen || t1.isCharOf("_:")))) && (t1.next instanceof NumberToken)) 
            t1 = t1.next;
        tok = AddressItemToken.m_Ontology.tryParse(t1, TerminParseAttr.NO);
        if (tok !== null && (tok.termin.tag instanceof AddressItemType) && (AddressItemType.of(tok.termin.tag)) === AddressItemType.NUMBER) 
            t1 = tok.endToken.next;
        else if (tok !== null && (tok.termin.tag instanceof AddressItemType) && (AddressItemType.of(tok.termin.tag)) === AddressItemType.NONUMBER) {
            let re0 = AddressItemToken._new313(_typ, t, tok.endToken, "0", houseTyp, buildTyp);
            if (!re0.isWhitespaceAfter && (re0.endToken.next instanceof NumberToken)) {
                re0.endToken = re0.endToken.next;
                re0.value = re0.endToken.value.toString();
            }
            return re0;
        }
        else if (t1 instanceof TextToken) {
            let term = t1.term;
            if (((term.length === 7 && term.startsWith("ЛИТЕРА"))) || ((term.length === 6 && term.startsWith("ЛИТЕР"))) || ((term.length === 4 && term.startsWith("ЛИТ")))) {
                let txt = t1.getSourceText();
                if (((Utils.isLowerCase(txt[0]) && Utils.isUpperCase(txt[txt.length - 1]))) || term.length === 7) {
                    let res1 = new AddressItemToken(AddressItemType.BUILDING, t, t1);
                    res1.buildingType = AddressBuildingType.LITER;
                    res1.value = term.substring(term.length - 1);
                    return res1;
                }
            }
            if (term.startsWith("БЛОК") && term.length > 4) {
                let txt = t1.getSourceText();
                if (Utils.isLowerCase(txt[0]) && Utils.isUpperCase(txt[4])) {
                    let num1 = NumToken.tryParse(t1.next, GeoTokenType.ORG);
                    if (num1 !== null) {
                        let res1 = new AddressItemToken(AddressItemType.BLOCK, t, num1.endToken);
                        res1.value = term.substring(4) + num1.value;
                        return res1;
                    }
                }
            }
            if (_typ === AddressItemType.FLAT && t1 !== null) {
                let tok2 = AddressItemToken.m_Ontology.tryParse(t1, TerminParseAttr.NO);
                if (tok2 === null && t1.isComma) 
                    tok2 = AddressItemToken.m_Ontology.tryParse(t1.next, TerminParseAttr.NO);
                if (tok2 !== null && (AddressItemType.of(tok2.termin.tag)) === AddressItemType.FLAT) 
                    t1 = tok2.endToken.next;
            }
            if (t1 !== null && t1.isValue2("СТРОИТЕЛЬНЫЙ", "НОМЕР")) 
                t1 = t1.next;
            let ttt = MiscHelper.checkNumberPrefix(t1);
            if (ttt !== null) {
                t1 = ttt;
                if (t1.isHiphen || t1.isChar('_')) 
                    t1 = t1.next;
            }
        }
        if (_typ !== AddressItemType.NUMBER) {
            if (t1 !== null && t1.isChar('.') && MiscLocationHelper.isUserParamAddress(t1)) 
                t1 = t1.next;
        }
        if (t1 === null) {
            if (_typ === AddressItemType.GENPLAN) 
                return AddressItemToken._new289(_typ, t, tok00.endToken, "0");
            return null;
        }
        let num = new StringBuilder();
        let nt = Utils.as(t1, NumberToken);
        let re11 = null;
        if (nt !== null) {
            if (nt.intValue === null) 
                return null;
            if (_typ === AddressItemType.ROOM || _typ === AddressItemType.CORPUSORFLAT) {
                let nt2 = NumberHelper.tryParseNumberWithPostfix(t1);
                if (nt2 !== null && nt2.exTyp === NumberExType.METER2) 
                    return AddressItemToken._new289(AddressItemType.ROOM, t, nt2.endToken, nt2.toString());
            }
            if (_typ === AddressItemType.FIELD || _typ === AddressItemType.PLOT) {
                let nt2 = NumberHelper.tryParseNumberWithPostfix(t1);
                if (nt2 !== null && ((nt2.exTyp === NumberExType.METER2 || nt2.exTyp === NumberExType.GEKTAR || nt2.exTyp === NumberExType.AR))) 
                    return AddressItemToken._new289(_typ, t, nt2.endToken, nt2.toString());
            }
            num.append(nt.value);
            if (nt.typ === NumberSpellingType.DIGIT || nt.typ === NumberSpellingType.WORDS) {
                if (((nt.endToken instanceof TextToken) && nt.endToken.term === "Е" && nt.endToken.previous === nt.beginToken) && !nt.endToken.isWhitespaceBefore) 
                    num.append("Е");
                let drob = false;
                let hiph = false;
                let lit = false;
                let et = nt.next;
                if (et !== null && ((et.isCharOf("\\/") || et.isValue("ДРОБЬ", null) || ((et.isChar('.') && MiscLocationHelper.isUserParamAddress(et) && (et.next instanceof NumberToken)))))) {
                    let _next = AddressItemToken.tryParsePureItem(et.next, null, null);
                    if (_next !== null && _next.typ !== AddressItemType.NUMBER && _typ !== AddressItemType.FLAT) {
                        if (_next.typ === _typ && _next.value !== null) {
                            _next.value = (num.toString() + "/" + _next.value);
                            _next.beginToken = t;
                            return _next;
                        }
                        t1 = et;
                    }
                    else {
                        drob = true;
                        et = et.next;
                        if (et !== null && et.isCharOf("\\/")) 
                            et = et.next;
                    }
                }
                else if (et !== null && ((et.isHiphen || et.isChar('_')))) {
                    hiph = true;
                    et = et.next;
                }
                else if ((et !== null && et.isChar('.') && (et.next instanceof NumberToken)) && !et.isWhitespaceAfter) {
                    hiph = true;
                    et = et.next;
                }
                if (et instanceof NumberToken) {
                    if (drob) {
                        let _next = AddressItemToken.tryParsePureItem(et, null, null);
                        if (_next !== null && _next.typ === AddressItemType.NUMBER) {
                            num.append("/").append(_next.value);
                            t1 = _next.endToken;
                            et = t1.next;
                            drob = false;
                        }
                        else {
                            num.append("/").append(et.value);
                            drob = false;
                            t1 = et;
                            et = et.next;
                            if (et !== null && et.isCharOf("\\/") && (et.next instanceof NumberToken)) {
                                t1 = et.next;
                                num.append("/").append(t1.value);
                                et = t1.next;
                            }
                        }
                    }
                    else if ((hiph && !t1.isWhitespaceAfter && (et instanceof NumberToken)) && !et.isWhitespaceBefore) {
                        let numm = AddressItemToken.tryParsePureItem(et, null, null);
                        if (numm !== null && numm.typ === AddressItemType.NUMBER) {
                            let merge = false;
                            if (_typ === AddressItemType.FLAT || _typ === AddressItemType.PLOT || _typ === AddressItemType.OFFICE) 
                                merge = true;
                            else if (_typ === AddressItemType.HOUSE || _typ === AddressItemType.BUILDING || _typ === AddressItemType.CORPUS) {
                                let ttt = numm.endToken.next;
                                if (ttt !== null && ttt.isComma) 
                                    ttt = ttt.next;
                                let numm2 = AddressItemToken.tryParsePureItem(ttt, null, null);
                                if (numm2 !== null) {
                                    if ((numm2.typ === AddressItemType.FLAT || numm2.typ === AddressItemType.BUILDING || ((numm2.typ === AddressItemType.CORPUSORFLAT && numm2.value !== null))) || numm2.typ === AddressItemType.CORPUS) 
                                        merge = true;
                                }
                            }
                            if (merge) {
                                num.append("/").append(numm.value);
                                t1 = numm.endToken;
                                et = t1.next;
                                hiph = false;
                            }
                        }
                    }
                }
                else if (et !== null && ((et.isHiphen || et.isChar('_') || et.isValue("НЕТ", null))) && drob) 
                    t1 = et;
                let ett = et;
                if ((ett !== null && ett.isCharOf(",.") && (ett.whitespacesAfterCount < 2)) && (ett.next instanceof TextToken)) {
                    if (BracketHelper.isBracket(ett.next, false)) 
                        ett = ett.next;
                    else if (ett.next.lengthChar === 1 && ett.next.chars.isLetter && ((ett.next.next === null || ett.next.next.isComma))) {
                        let ch = AddressItemToken.correctCharToken(ett.next);
                        if (ch !== null) {
                            num.append(ch);
                            ett = ett.next;
                            t1 = ett;
                        }
                    }
                }
                if ((BracketHelper.isBracket(ett, false) && (ett.next instanceof TextToken) && ett.next.lengthChar === 1) && ett.next.isLetters && BracketHelper.isBracket(ett.next.next, false)) {
                    let ch = AddressItemToken.correctCharToken(ett.next);
                    if (ch !== null) {
                        num.append(ch);
                        t1 = ett.next.next;
                    }
                    else {
                        let ntt = NumberHelper.tryParseRoman(ett.next);
                        if (ntt !== null) {
                            num.append("/").append(ntt.value);
                            t1 = ett.next.next;
                        }
                    }
                }
                else if (((BracketHelper.isBracket(ett, false) && BracketHelper.isBracket(ett.next, false) && (ett.next.next instanceof TextToken)) && ett.next.next.lengthChar === 1 && ett.next.next.isLetters) && BracketHelper.isBracket(ett.next.next.next, false)) {
                    let ch = AddressItemToken.correctCharToken(ett.next.next);
                    if (ch !== null) {
                        num.append(ch);
                        t1 = ett.next.next.next;
                        while (t1.next !== null && BracketHelper.isBracket(t1.next, false)) {
                            t1 = t1.next;
                        }
                    }
                }
                else if (BracketHelper.canBeStartOfSequence(ett, true, false) && (ett.whitespacesBeforeCount < 2)) {
                    let br = BracketHelper.tryParse(ett, BracketParseAttr.NO, 100);
                    if (br !== null && (br.beginToken.next instanceof TextToken) && br.beginToken.next.next === br.endToken) {
                        let s = AddressItemToken.correctCharToken(br.beginToken.next);
                        if (s !== null) {
                            num.append(s);
                            t1 = br.endToken;
                        }
                    }
                }
                else if ((et instanceof TextToken) && ((et.lengthChar === 1 || ((et.lengthChar === 2 && et.chars.isAllUpper && !et.isWhitespaceBefore)))) && et.chars.isLetter) {
                    let ttt = StreetItemToken.tryParse(et, null, false, null);
                    let s = AddressItemToken.correctCharToken(et);
                    if (ttt !== null && ((ttt.typ === StreetItemType.STDNAME || ttt.typ === StreetItemType.NOUN || ttt.typ === StreetItemType.FIX))) 
                        s = null;
                    else if (TerrItemToken.checkKeyword(et) !== null) 
                        s = null;
                    if (et.isWhitespaceBefore) {
                        let _next = AddressItemToken.tryParsePureItem(et, null, null);
                        if (_next !== null && _next.value !== null) 
                            s = null;
                        else if (et.previous !== null && et.previous.isHiphen && et.previous.isWhitespaceBefore) 
                            s = null;
                    }
                    if (s !== null) {
                        if (((s === "К" || s === "С")) && (et.next instanceof NumberToken) && !et.isWhitespaceAfter) {
                        }
                        else if ((s === "Б" && et.next !== null && et.next.isCharOf("/\\")) && (et.next.next instanceof TextToken) && et.next.next.isValue("Н", null)) 
                            t1 = (et = et.next.next);
                        else {
                            let ok = false;
                            if (drob || hiph || lit) 
                                ok = true;
                            else if (!et.isWhitespaceBefore || ((et.whitespacesBeforeCount === 1 && ((MiscLocationHelper.isUserParamAddress(et) || et.chars.isAllUpper || ((et.isNewlineAfter || ((et.next !== null && et.next.isComma))))))))) {
                                ok = true;
                                if (et.next instanceof NumberToken) {
                                    if (!et.isWhitespaceBefore && et.isWhitespaceAfter) {
                                    }
                                    else 
                                        ok = false;
                                }
                                if (s === "К") {
                                    let tmp = new AddressItemToken(_typ, t, et.previous);
                                    let _next = AddressItemToken.tryParsePureItem(et, tmp, null);
                                    if (_next !== null && _next.value !== null) 
                                        ok = false;
                                }
                                if (s === "И") {
                                    let _next = AddressItemToken.tryParsePureItem(et.next, prev, null);
                                    if (_next !== null && _next.typ === _typ) 
                                        ok = false;
                                }
                            }
                            else if (((et.next === null || et.next.isComma)) && (((et.whitespacesBeforeCount < 2) || MiscLocationHelper.isUserParamAddress(et)))) 
                                ok = true;
                            else if (et.isWhitespaceBefore && et.chars.isAllLower && et.isValue("В", "У")) {
                            }
                            else {
                                let aitNext = AddressItemToken.tryParsePureItem(et.next, null, null);
                                if (aitNext !== null) {
                                    if ((aitNext.typ === AddressItemType.CORPUS || aitNext.typ === AddressItemType.FLAT || aitNext.typ === AddressItemType.BUILDING) || aitNext.typ === AddressItemType.OFFICE || aitNext.typ === AddressItemType.ROOM) 
                                        ok = true;
                                }
                            }
                            if (ok) {
                                num.append(s);
                                t1 = et;
                                if (et.next !== null && et.next.isCharOf("\\/") && et.next.next !== null) {
                                    if (et.next.next instanceof NumberToken) {
                                        num.append("/").append(et.next.next.value);
                                        t1 = (et = et.next.next);
                                    }
                                    else if (et.next.next.isHiphen || et.next.next.isChar('_') || et.next.next.isValue("НЕТ", null)) 
                                        t1 = (et = et.next.next);
                                }
                            }
                        }
                    }
                }
                else if ((et instanceof TextToken) && !et.isWhitespaceBefore) {
                    let val = et.term;
                    if (val === "КМ" && _typ === AddressItemType.HOUSE) {
                        t1 = et;
                        num.append("КМ");
                    }
                    else if (val === "БН") 
                        t1 = et;
                    else if (((val.length === 2 && val[1] === 'Б' && et.next !== null) && et.next.isCharOf("\\/") && et.next.next !== null) && et.next.next.isValue("Н", null)) {
                        num.append(val[0]);
                        t1 = (et = et.next.next);
                    }
                }
                if (!drob && t1.next !== null && t1.next.isCharOf("\\/")) {
                    let _next = AddressItemToken._tryParsePureItem(t1.next.next, false, null);
                    if (_next !== null && _next.typ === AddressItemType.NUMBER) {
                        num.append("/").append(_next.value);
                        t1 = _next.endToken;
                    }
                }
            }
        }
        else if ((((re11 = AddressItemToken._tryAttachVCH(t1, _typ)))) !== null) {
            re11.beginToken = t;
            re11.houseType = houseTyp;
            re11.buildingType = buildTyp;
            return re11;
        }
        else if (((t1 instanceof TextToken) && t1.lengthChar === 2 && t1.isLetters) && !t1.isWhitespaceBefore && (t1.previous instanceof NumberToken)) {
            let src = t1.getSourceText();
            if ((src !== null && src.length === 2 && ((src[0] === 'к' || src[0] === 'k'))) && Utils.isUpperCase(src[1])) {
                let ch = AddressItemToken.correctChar(src[1]);
                if (ch !== (String.fromCharCode(0))) 
                    return AddressItemToken._new289(AddressItemType.CORPUS, t1, t1, (ch));
            }
        }
        else if ((t1 instanceof TextToken) && t1.lengthChar === 1 && t1.isLetters) {
            let ch = AddressItemToken.correctCharToken(t1);
            if (ch !== null) {
                if (_typ === AddressItemType.NUMBER) 
                    return null;
                if (ch === "К" || ch === "С") {
                    if (!t1.isWhitespaceAfter && (t1.next instanceof NumberToken)) 
                        return null;
                }
                if (ch === "С") {
                    let num1 = NumToken.tryParse(t1.next, GeoTokenType.ANY);
                    if (num1 !== null && ((num1.hasPrefix || num1.isCadasterNumber))) 
                        return AddressItemToken._new289(_typ, t, num1.endToken, num1.value);
                }
                if (ch === "Д" && _typ === AddressItemType.PLOT) {
                    let rrr = AddressItemToken.tryParsePureItem(t1, null, null);
                    if (rrr !== null) {
                        rrr.typ = AddressItemType.PLOT;
                        rrr.beginToken = t;
                        return rrr;
                    }
                }
                if (ch === "С" && t1.isWhitespaceAfter) {
                    let _next = AddressItemToken.tryParsePureItem(t1.next, null, null);
                    if (_next !== null && _next.typ === AddressItemType.NUMBER) {
                        let res1 = AddressItemToken._new319(_typ, t, _next.endToken, _next.value, t.morph, houseTyp, buildTyp);
                        return res1;
                    }
                }
                if (prev !== null && ((prev.typ === AddressItemType.HOUSE || prev.typ === AddressItemType.NUMBER || prev.typ === AddressItemType.FLAT)) && MiscLocationHelper.isUserParamAddress(t1)) {
                    if (_typ === AddressItemType.CORPUSORFLAT && prev.typ === AddressItemType.HOUSE) 
                        _typ = AddressItemType.CORPUS;
                }
                else {
                    if (t1.chars.isAllLower && ((t1.morph._class.isPreposition || t1.morph._class.isConjunction))) {
                        if ((t1.whitespacesAfterCount < 2) && t1.next.chars.isLetter) {
                            if (_typ === AddressItemType.HOUSE || _typ === AddressItemType.PLOT || _typ === AddressItemType.BOX) 
                                return AddressItemToken._new289(_typ, t, t1.previous, "0");
                            return null;
                        }
                    }
                    if (t.chars.isAllUpper && t.lengthChar === 1 && t.next.isChar('.')) 
                        return null;
                }
                num.append(ch);
                if ((t1.next !== null && ((t1.next.isHiphen || t1.next.isChar('_'))) && !t1.isWhitespaceAfter) && (t1.next.next instanceof NumberToken) && !t1.next.isWhitespaceAfter) {
                    num.append(t1.next.next.value);
                    t1 = t1.next.next;
                }
                else if ((t1.next instanceof NumberToken) && !t1.isWhitespaceAfter) {
                    num.append(t1.next.value);
                    t1 = t1.next;
                }
                if (num.length === 1 && ((_typ === AddressItemType.OFFICE || _typ === AddressItemType.ROOM))) 
                    return null;
            }
            if ((((_typ === AddressItemType.BOX || _typ === AddressItemType.SPACE || _typ === AddressItemType.PART) || _typ === AddressItemType.CARPLACE || _typ === AddressItemType.WELL)) && num.length === 0) {
                let rom = NumberHelper.tryParseRoman(t1);
                if (rom !== null) 
                    return AddressItemToken._new289(_typ, t, rom.endToken, rom.value.toString());
            }
        }
        else if (((BracketHelper.isBracket(t1, false) && (t1.next instanceof TextToken) && t1.next.lengthChar === 1) && t1.next.isLetters && BracketHelper.isBracket(t1.next.next, false)) && !t1.isWhitespaceAfter && !t1.next.isWhitespaceAfter) {
            let ch = AddressItemToken.correctCharToken(t1.next);
            if (ch === null) 
                return null;
            num.append(ch);
            t1 = t1.next.next;
        }
        else if ((t1 instanceof TextToken) && ((((t1.lengthChar === 1 && ((t1.isHiphen || t1.isChar('_'))))) || t1.isValue("НЕТ", null) || t1.isValue("БН", null))) && (((_typ === AddressItemType.CORPUS || _typ === AddressItemType.CORPUSORFLAT || _typ === AddressItemType.BUILDING) || _typ === AddressItemType.HOUSE || _typ === AddressItemType.FLAT))) {
            while (t1.next !== null && ((t1.next.isHiphen || t1.next.isChar('_'))) && !t1.isWhitespaceAfter) {
                t1 = t1.next;
            }
            let val = null;
            if (!t1.isWhitespaceAfter && (t1.next instanceof NumberToken)) {
                t1 = t1.next;
                val = t1.value.toString();
            }
            if (t1.isValue("БН", null)) 
                val = "0";
            else if (t1.isValue("НЕТ", null)) 
                val = "НЕТ";
            return AddressItemToken._new289(_typ, t, t1, val);
        }
        else {
            if (((_typ === AddressItemType.FLOOR || _typ === AddressItemType.KILOMETER || _typ === AddressItemType.POTCH)) && (t.previous instanceof NumberToken)) 
                return new AddressItemToken(_typ, t, t1.previous);
            if ((t1 instanceof ReferentToken) && (t1.getReferent() instanceof DateReferent)) {
                let nn = AddressItemToken.tryParsePureItem(t1.beginToken, null, null);
                if (nn !== null && nn.endChar === t1.endChar && nn.typ === AddressItemType.NUMBER) {
                    nn.beginToken = t;
                    nn.endToken = t1;
                    nn.typ = _typ;
                    return nn;
                }
            }
            if ((t1 instanceof TextToken) && ((_typ === AddressItemType.HOUSE || _typ === AddressItemType.BUILDING || _typ === AddressItemType.CORPUS))) {
                let ter = t1.term;
                if (ter === "АБ" || ter === "АБВ" || ter === "МГУ") 
                    return AddressItemToken._new313(_typ, t, t1, ter, houseTyp, buildTyp);
                let ccc = AddressItemToken._corrNumber(ter);
                if (ccc !== null) 
                    return AddressItemToken._new313(_typ, t, t1, ccc, houseTyp, buildTyp);
                if (t1.chars.isAllUpper) {
                    if (prev !== null && ((prev.typ === AddressItemType.STREET || prev.typ === AddressItemType.CITY))) 
                        return AddressItemToken._new313(_typ, t, t1, ter, houseTyp, buildTyp);
                    if (_typ === AddressItemType.CORPUS && (t1.lengthChar < 4)) 
                        return AddressItemToken._new313(_typ, t, t1, ter, houseTyp, buildTyp);
                    if (_typ === AddressItemType.BUILDING && buildTyp === AddressBuildingType.LITER && (t1.lengthChar < 4)) 
                        return AddressItemToken._new313(_typ, t, t1, ter, houseTyp, buildTyp);
                }
            }
            if ((_typ === AddressItemType.BOX || _typ === AddressItemType.SPACE || _typ === AddressItemType.PART) || _typ === AddressItemType.CARPLACE || _typ === AddressItemType.WELL) {
                let num1 = NumToken.tryParse(t1, GeoTokenType.ANY);
                if (num1 !== null) 
                    return AddressItemToken._new289(_typ, t, num1.endToken, num1.value);
            }
            if (_typ === AddressItemType.PLOT && t1 !== null) {
                if ((t1.isValue("ОКОЛО", null) || t1.isValue("РЯДОМ", null) || t1.isValue("НАПРОТИВ", null)) || t1.isValue("БЛИЗЬКО", null) || t1.isValue("НАВПАКИ", null)) 
                    return AddressItemToken._new289(_typ, t, t1, t1.getSourceText().toLowerCase());
                let det = AddressItemToken._tryAttachDetail(t1, null);
                if (det !== null) 
                    return AddressItemToken._new289(_typ, t, t1.previous, "0");
            }
            if (t1 !== null && t1.isComma && prev !== null) {
                let _next = AddressItemToken.tryParsePureItem(t1.next, null, null);
                if (_next !== null) {
                    if (_next.typ === AddressItemType.NUMBER || _next.typ === _typ) 
                        return AddressItemToken._new289(_typ, t, _next.endToken, _next.value);
                    if (prev !== null) 
                        return new AddressItemToken(_typ, t, t1.previous);
                }
            }
            if (t1 !== null && t1.isChar('(')) {
                let _next = AddressItemToken.tryParsePureItem(t1.next, prev, null);
                if ((_next !== null && _next.typ === AddressItemType.NUMBER && _next.endToken.next !== null) && _next.endToken.next.isChar(')')) {
                    _next.typ = _typ;
                    _next.beginToken = t;
                    _next.endToken = _next.endToken.next;
                    return _next;
                }
            }
            if (MiscLocationHelper.isUserParamAddress(t1) || _typ !== AddressItemType.NUMBER) {
                let nt1 = NumberHelper.tryParseRoman(t1);
                if (nt1 !== null) 
                    return AddressItemToken._new289(_typ, t, t1, nt1.value);
            }
            if (BracketHelper.isBracket(t1, false) && (t1.next instanceof NumberToken)) {
                let _next = AddressItemToken._tryParsePureItem(t1.next, false, prev);
                if ((_next !== null && _next.typ === AddressItemType.NUMBER && _next.endToken.next !== null) && BracketHelper.isBracket(_next.endToken.next, false)) {
                    _next.beginToken = t;
                    _next.typ = _typ;
                    _next.endToken = _next.endToken.next;
                    return _next;
                }
            }
            if (_typ === AddressItemType.GENPLAN) 
                return AddressItemToken._new289(_typ, t, tok00.endToken, "0");
            if (_typ === AddressItemType.NUMBER && t.isValue("ОБЩЕЖИТИЕ", null)) {
                let num1 = NumToken.tryParse(t.next, GeoTokenType.ANY);
                if (num1 !== null) 
                    return AddressItemToken._new289(AddressItemType.HOUSE, t, num1.endToken, num1.value);
            }
            if (t.chars.isLatinLetter && !t.kit.baseLanguage.isEn) {
                let num2 = NumberHelper.tryParseRoman(t);
                if (num2 !== null) 
                    return AddressItemToken._new289(_typ, t, num2.endToken, num2.value);
            }
            return null;
        }
        if (_typ === AddressItemType.NUMBER && prepos) 
            return null;
        if (t1 === null) {
            t1 = t;
            while (t1.next !== null) {
                t1 = t1.next;
            }
        }
        for (let tt = t.next; tt !== null && tt.endChar <= t1.endChar; tt = tt.next) {
            if (tt.isNewlineBefore && !(tt instanceof NumberToken)) 
                return null;
        }
        if (num.length === 0) {
            if (t.chars.isLatinLetter && ((!t.kit.baseLanguage.isEn || MiscLocationHelper.isUserParamAddress(t)))) {
                let num2 = NumberHelper.tryParseRoman(t);
                if (num2 !== null) 
                    return AddressItemToken._new289(_typ, t, num2.endToken, num2.value);
            }
            return null;
        }
        let res0 = AddressItemToken._new319(_typ, t, t1, num.toString(), t.morph, houseTyp, buildTyp);
        t1 = t1.next;
        if (t1 !== null && t1.isComma) 
            t1 = t1.next;
        if ((t1 instanceof TextToken) && t1.term.startsWith("ОБ")) {
            res0.endToken = t1;
            t1 = t1.next;
            if (t1 !== null && t1.isChar('.')) {
                res0.endToken = t1;
                t1 = t1.next;
            }
            if (res0.typ === AddressItemType.CORPUSORFLAT) 
                res0.typ = AddressItemType.FLAT;
        }
        if ((t1 !== null && t1.isChar('(') && (t1.next instanceof TextToken)) && t1.next.term.startsWith("ОБ")) {
            res0.endToken = t1.next;
            t1 = t1.next.next;
            while (t1 !== null) {
                if (t1.isCharOf(".)")) {
                    res0.endToken = t1;
                    t1 = t1.next;
                }
                else 
                    break;
            }
            if (res0.typ === AddressItemType.CORPUSORFLAT) 
                res0.typ = AddressItemType.FLAT;
        }
        return res0;
    }
    
    static _tryAttachVCH(t, ty) {
        if (t === null) 
            return null;
        let tt = t;
        if ((((tt.isValue("В", null) || tt.isValue("B", null))) && tt.next !== null && tt.next.isCharOf("./\\")) && (tt.next.next instanceof TextToken) && tt.next.next.isValue("Ч", null)) {
            tt = tt.next.next;
            if (tt.next !== null && tt.next.isChar('.')) 
                tt = tt.next;
            let tt2 = MiscHelper.checkNumberPrefix(tt.next);
            if (tt2 !== null) 
                tt = tt2;
            if (tt.next !== null && (tt.next instanceof NumberToken) && (tt.whitespacesAfterCount < 2)) 
                tt = tt.next;
            return AddressItemToken._new289(ty, t, tt, "В/Ч");
        }
        if (((tt.isValue("ВОЙСКОВОЙ", null) || tt.isValue("ВОИНСКИЙ", null))) && tt.next !== null && tt.next.isValue("ЧАСТЬ", null)) {
            tt = tt.next;
            let tt2 = MiscHelper.checkNumberPrefix(tt.next);
            if (tt2 !== null) 
                tt = tt2;
            if (tt.next !== null && (tt.next instanceof NumberToken) && (tt.whitespacesAfterCount < 2)) 
                tt = tt.next;
            return AddressItemToken._new289(ty, t, tt, "В/Ч");
        }
        if (ty === AddressItemType.FLAT) {
            if (tt.whitespacesBeforeCount > 1) 
                return null;
            if (!(tt instanceof TextToken)) 
                return null;
            if (tt.term.startsWith("ОБЩ") || tt.term.startsWith("ВЕД")) {
                if (tt.next !== null && tt.next.isChar('.')) 
                    tt = tt.next;
                let re = AddressItemToken._tryAttachVCH(tt.next, ty);
                if (re !== null) 
                    return re;
                return AddressItemToken._new289(ty, t, tt, "0");
            }
            if (tt.chars.isAllUpper && tt.lengthChar > 1) {
                let re = AddressItemToken._new289(ty, t, tt, tt.term);
                if ((tt.whitespacesAfterCount < 2) && (tt.next instanceof TextToken) && tt.next.chars.isAllUpper) {
                    tt = tt.next;
                    re.endToken = tt;
                    re.value += tt.term;
                }
                return re;
            }
        }
        return null;
    }
    
    static _outDoubeKm(n1, n2) {
        if (n1.intValue === null || n2.intValue === null) 
            return (n1.value + "+" + n2.value);
        let v = n1.realValue + ((n2.realValue / (1000)));
        return NumberHelper.doubleToString(Utils.mathRound(v, 3));
    }
    
    static _tryAttachDetailRange(t) {
        let t1 = t.next;
        if (t1 !== null && t1.isChar('.')) 
            t1 = t1.next;
        if (!(t1 instanceof NumberToken)) 
            return null;
        if (t1.next === null || !t1.next.isChar('+') || !(t1.next.next instanceof NumberToken)) 
            return null;
        let res = AddressItemToken._new288(AddressItemType.DETAIL, t, t1.next.next, AddressDetailType.RANGE);
        res.value = ("км" + AddressItemToken._outDoubeKm(Utils.as(t1, NumberToken), Utils.as(t1.next.next, NumberToken)));
        t1 = t1.next.next.next;
        if (t1 !== null && t1.isHiphen) 
            t1 = t1.next;
        if (t1 !== null && t1.isValue("КМ", null)) {
            t1 = t1.next;
            if (t1 !== null && t1.isChar('.')) 
                t1 = t1.next;
        }
        if (!(t1 instanceof NumberToken)) 
            return null;
        if (t1.next === null || !t1.next.isChar('+') || !(t1.next.next instanceof NumberToken)) 
            return null;
        res.value = (res.value + "-км" + AddressItemToken._outDoubeKm(Utils.as(t1, NumberToken), Utils.as(t1.next.next, NumberToken)));
        res.endToken = t1.next.next;
        return res;
    }
    
    static _tryAttachDetail(t, tok) {
        const OrgItemToken = require("./../../geo/internal/OrgItemToken");
        if (t === null || (t instanceof ReferentToken)) 
            return null;
        if (t.isValue("КМ", null)) {
            let ran = AddressItemToken._tryAttachDetailRange(t);
            if (ran !== null) 
                return ran;
        }
        let tt = t;
        if (t.chars.isCapitalUpper && !t.morph._class.isPreposition) 
            return null;
        if (tok === null) 
            tok = AddressItemToken.m_Ontology.tryParse(t, TerminParseAttr.NO);
        if (tok === null && t.morph._class.isPreposition && t.next !== null) {
            tt = t.next;
            if (tt instanceof NumberToken) {
            }
            else {
                if (tt.chars.isCapitalUpper && !tt.morph._class.isPreposition) 
                    return null;
                tok = AddressItemToken.m_Ontology.tryParse(tt, TerminParseAttr.NO);
            }
        }
        let res = null;
        let firstNum = false;
        if (tok !== null && tok.termin.tag2 !== null && (tok.termin.tag instanceof AddressDetailType)) {
            res = new AddressItemToken(AddressItemType.DETAIL, t, tok.endToken);
            res.detailType = AddressDetailType.of(tok.termin.tag);
            res.detailParam = "часть";
            return res;
        }
        if (tok === null) {
            let mc = tt.getMorphClassInDictionary();
            if (mc.isVerb) {
                let _next = AddressItemToken._tryAttachDetail(tt.next, tok);
                if (_next !== null) {
                    _next.beginToken = t;
                    return _next;
                }
            }
            if (tt instanceof NumberToken) {
                firstNum = true;
                let nex = NumberHelper.tryParseNumberWithPostfix(tt);
                if (nex !== null && ((nex.exTyp === NumberExType.METER || nex.exTyp === NumberExType.KILOMETER))) {
                    res = new AddressItemToken(AddressItemType.DETAIL, t, nex.endToken);
                    let tyy = NumberExType.METER;
                    let wraptyy343 = new RefOutArgWrapper(tyy);
                    res.detailMeters = Math.floor(nex.normalizeValue(wraptyy343));
                    tyy = wraptyy343.value;
                    let tt2 = res.endToken.next;
                    if (tt2 !== null && tt2.isHiphen) 
                        tt2 = tt2.next;
                    let nex2 = NumberHelper.tryParseNumberWithPostfix(tt2);
                    if (nex2 !== null && nex2.exTyp === NumberExType.METER && nex2.intValue !== null) {
                        res.endToken = nex2.endToken;
                        res.detailMeters += nex2.intValue;
                    }
                }
            }
            if (res === null) 
                return null;
        }
        else {
            if (!(tok.termin.tag instanceof AddressDetailType)) 
                return null;
            res = AddressItemToken._new288(AddressItemType.DETAIL, t, tok.endToken, AddressDetailType.of(tok.termin.tag));
        }
        for (tt = res.endToken.next; tt !== null; tt = tt.next) {
            if (tt instanceof ReferentToken) 
                break;
            if (!tt.morph._class.isPreposition) {
                if (tt.chars.isCapitalUpper || tt.chars.isAllUpper) 
                    break;
            }
            tok = AddressItemToken.m_Ontology.tryParse(tt, TerminParseAttr.NO);
            if (tok !== null && (tok.termin.tag instanceof AddressDetailType)) {
                let ty = AddressDetailType.of(tok.termin.tag);
                if (ty !== AddressDetailType.UNDEFINED) {
                    if (ty === AddressDetailType.NEAR && res.detailType !== AddressDetailType.UNDEFINED && res.detailType !== ty) {
                    }
                    else 
                        res.detailType = ty;
                }
                res.endToken = (tt = tok.endToken);
                continue;
            }
            let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) 
                tt = npt.endToken;
            if (((tt.isValue("ОРИЕНТИР", null) || tt.isValue("НАПРАВЛЕНИЕ", null) || tt.isValue("ОТ", null)) || tt.isValue("В", null) || tt.isValue("УСАДЬБА", null)) || tt.isValue("ДВОР", null)) {
                res.endToken = tt;
                continue;
            }
            if (tt.isValue("ЗДАНИЕ", null) || tt.isValue("СТРОЕНИЕ", null) || tt.isValue("ДОМ", null)) {
                let ait = AddressItemToken.tryParsePureItem(tt, null, null);
                if (ait !== null && ait.value !== null) 
                    break;
                if (OrgItemToken.tryParse(tt.next, null) !== null) 
                    break;
                res.endToken = tt;
                continue;
            }
            if (npt !== null && npt.internalNoun !== null) {
                res.endToken = (tt = npt.endToken);
                continue;
            }
            if (((tt.isValue("ГРАНИЦА", null) || tt.isValue("ПРЕДЕЛ", null))) && tt.next !== null) {
                if (tt.next.isValue("УЧАСТОК", null)) {
                    tt = tt.next;
                    res.endToken = tt;
                    continue;
                }
            }
            let mc = tt.getMorphClassInDictionary();
            if (mc.isVerb && !mc.isNoun) 
                continue;
            if ((tt.isComma || mc.isPreposition || tt.isHiphen) || tt.isChar(':')) 
                continue;
            if ((tt instanceof NumberToken) && tt.next !== null) {
                let nex = NumberHelper.tryParseNumberWithPostfix(tt);
                if (nex !== null && ((nex.exTyp === NumberExType.METER || nex.exTyp === NumberExType.KILOMETER))) {
                    res.endToken = (tt = nex.endToken);
                    let tyy = NumberExType.METER;
                    let wraptyy345 = new RefOutArgWrapper(tyy);
                    res.detailMeters = Math.floor(nex.normalizeValue(wraptyy345));
                    tyy = wraptyy345.value;
                    continue;
                }
            }
            break;
        }
        if (firstNum && res.detailType === AddressDetailType.UNDEFINED) 
            return null;
        if (res !== null && res.endToken.next !== null && res.endToken.next.morph._class.isPreposition) {
            if (res.endToken.whitespacesAfterCount === 1 && res.endToken.next.whitespacesAfterCount === 1) 
                res.endToken = res.endToken.next;
        }
        if (res !== null && res.endToken.next !== null) {
            if (res.endToken.next.isHiphen || res.endToken.next.isChar(':')) 
                res.endToken = res.endToken.next;
        }
        return res;
    }
    
    static checkStreetAfter(t, checkThisAndNotNext = false) {
        const OrgItemToken = require("./../../geo/internal/OrgItemToken");
        let cou = 0;
        for (; t !== null && (cou < 4); t = t.next,cou++) {
            if (t.isCharOf(",.") || t.isHiphen || t.morph._class.isPreposition) {
            }
            else 
                break;
        }
        if (t === null) 
            return false;
        let ait = AddressItemToken.tryParse(t, false, null, null);
        if (ait === null || ait.typ !== AddressItemType.STREET) 
            return false;
        if (ait.refToken !== null) {
            if (!ait.refTokenIsGsk) 
                return false;
            let oo = Utils.as(ait.refToken, OrgItemToken);
            if (oo !== null && oo.isDoubt) 
                return false;
        }
        if (!checkThisAndNotNext) 
            return true;
        if (t.next === null || ait.endChar <= t.endChar) 
            return true;
        let ait2 = AddressItemToken.tryParse(t.next, false, null, null);
        if (ait2 === null) 
            return true;
        let aits1 = AddressItemToken.tryParseList(t, 20);
        let aits2 = AddressItemToken.tryParseList(t.next, 20);
        if (aits1 !== null && aits2 !== null) {
            if (aits2[aits2.length - 1].endChar > aits1[aits1.length - 1].endChar) 
                return false;
        }
        return true;
    }
    
    static checkHouseAfter(t, leek = false, pureHouse = false) {
        if (t === null) 
            return false;
        let cou = 0;
        for (; t !== null && (cou < 4); t = t.next,cou++) {
            if (t.isCharOf(",.") || t.morph._class.isPreposition) {
            }
            else 
                break;
        }
        if (t === null) 
            return false;
        if (t.isNewlineBefore) 
            return false;
        let ait = AddressItemToken.tryParsePureItem(t, null, null);
        if (ait !== null) {
            if (ait.value === null || ait.value === "0") 
                return false;
            if (pureHouse) 
                return ait.typ === AddressItemType.HOUSE || ait.typ === AddressItemType.PLOT;
            if (((ait.typ === AddressItemType.HOUSE || ait.typ === AddressItemType.FLOOR || ait.typ === AddressItemType.OFFICE) || ait.typ === AddressItemType.FLAT || ait.typ === AddressItemType.PLOT) || ait.typ === AddressItemType.ROOM || ait.typ === AddressItemType.CORPUS) {
                if (((t instanceof TextToken) && t.chars.isAllUpper && t.next !== null) && t.next.isHiphen && (t.next.next instanceof NumberToken)) 
                    return false;
                if ((t instanceof TextToken) && t.next === ait.endToken && t.next.isHiphen) 
                    return false;
                return true;
            }
            if (leek) {
                if (ait.typ === AddressItemType.NUMBER) 
                    return true;
            }
            if (ait.typ === AddressItemType.NUMBER) {
                let t1 = t.next;
                while (t1 !== null && t1.isCharOf(".,")) {
                    t1 = t1.next;
                }
                ait = AddressItemToken.tryParsePureItem(t1, null, null);
                if (ait !== null && ((((ait.typ === AddressItemType.BUILDING || ait.typ === AddressItemType.CORPUS || ait.typ === AddressItemType.FLAT) || ait.typ === AddressItemType.FLOOR || ait.typ === AddressItemType.OFFICE) || ait.typ === AddressItemType.ROOM))) 
                    return true;
            }
        }
        return false;
    }
    
    static checkKmAfter(t) {
        let cou = 0;
        for (; t !== null && (cou < 4); t = t.next,cou++) {
            if (t.isCharOf(",.") || t.morph._class.isPreposition) {
            }
            else 
                break;
        }
        if (t === null) 
            return false;
        let km = AddressItemToken.tryParsePureItem(t, null, null);
        if (km !== null && km.typ === AddressItemType.KILOMETER) 
            return true;
        if (!(t instanceof NumberToken) || t.next === null) 
            return false;
        if (t.next.isValue("КИЛОМЕТР", null) || t.next.isValue("МЕТР", null) || t.next.isValue("КМ", null)) 
            return true;
        return false;
    }
    
    static checkKmBefore(t) {
        let cou = 0;
        for (; t !== null && (cou < 4); t = t.previous,cou++) {
            if (t.isCharOf(",.")) {
            }
            else if (t.isValue("КМ", null) || t.isValue("КИЛОМЕТР", null) || t.isValue("МЕТР", null)) 
                return true;
        }
        return false;
    }
    
    static correctChar(v) {
        if (v === 'A' || v === 'А') 
            return 'А';
        if (v === 'Б' || v === 'Г') 
            return v;
        if (v === 'B' || v === 'В') 
            return 'В';
        if (v === 'C' || v === 'С') 
            return 'С';
        if (v === 'D' || v === 'Д') 
            return 'Д';
        if (v === 'E' || v === 'Е') 
            return 'Е';
        if (v === 'H' || v === 'Н') 
            return 'Н';
        if (v === 'K' || v === 'К') 
            return 'К';
        return String.fromCharCode(0);
    }
    
    static correctCharToken(t) {
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return null;
        let v = tt.term;
        if (v.length === 1) {
            let corr = AddressItemToken.correctChar(v[0]);
            if (corr !== (String.fromCharCode(0))) 
                return (corr);
            if (t.chars.isCyrillicLetter) 
                return v;
        }
        if (v.length === 2) {
            if (t.chars.isCyrillicLetter) 
                return v;
            let corr = AddressItemToken.correctChar(v[0]);
            let corr2 = AddressItemToken.correctChar(v[1]);
            if (corr !== (String.fromCharCode(0)) && corr2 !== (String.fromCharCode(0))) 
                return (corr + corr2);
        }
        return null;
    }
    
    static _corrNumber(num) {
        if (Utils.isNullOrEmpty(num)) 
            return null;
        if (num[0] !== 'З') 
            return null;
        let res = "3";
        let i = 0;
        for (i = 1; i < num.length; i++) {
            if (num[i] === 'З') 
                res += "3";
            else if (num[i] === 'О') 
                res += "0";
            else 
                break;
        }
        if (i === num.length) 
            return res;
        if ((i + 1) < num.length) 
            return null;
        if (num[i] === 'А' || num[i] === 'Б' || num[i] === 'В') 
            return (res + num[i]);
        return null;
    }
    
    static createAddress(txt) {
        const AddressDefineHelper = require("./AddressDefineHelper");
        let ar = null;
        try {
            ar = ProcessorService.getEmptyProcessor().process(SourceOfAnalysis._new160(txt, "ADDRESS"), null, null);
        } catch (ex) {
            return null;
        }
        if (ar === null) 
            return null;
        AddressItemToken.prepareAllData(ar.firstToken);
        let li = new Array();
        for (let t = ar.firstToken; t !== null; t = t.next) {
            if (t.isCharOf(",.")) 
                continue;
            let ait = AddressItemToken.tryParsePureItem(t, (li.length > 0 ? li[li.length - 1] : null), null);
            if (ait === null) 
                break;
            li.push(ait);
            t = ait.endToken;
        }
        if (li === null || li.length === 0) 
            return null;
        let rt = AddressDefineHelper.tryDefine(li, ar.firstToken, null, true);
        return Utils.as(rt, ReferentToken);
    }
    
    static initialize() {
        if (AddressItemToken.m_Ontology !== null) 
            return;
        StreetItemToken.initialize();
        AddressItemToken.m_Ontology = new TerminCollection();
        let t = null;
        t = Termin._new170("ДОМ", AddressItemType.HOUSE);
        t.addAbridge("Д.");
        t.addVariant("КОТТЕДЖ", false);
        t.addAbridge("КОТ.");
        t.addVariant("ДАЧА", false);
        t.addVariant("ЖИЛОЙ ДОМ", false);
        t.addAbridge("ЖИЛ.ДОМ");
        t.addVariant("ДО ДОМА", false);
        t.addVariant("ДОМ ОФИЦЕРСКОГО СОСТАВА", false);
        t.addVariant("ДОС", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new348("БУДИНОК", AddressItemType.HOUSE, MorphLang.UA);
        t.addAbridge("Б.");
        t.addVariant("КОТЕДЖ", false);
        t.addAbridge("БУД.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ВЛАДЕНИЕ", AddressItemType.HOUSE, AddressHouseType.ESTATE);
        t.addAbridge("ВЛАД.");
        t.addAbridge("ВЛД.");
        t.addAbridge("ВЛ.");
        AddressItemToken.m_Ontology.add(t);
        AddressItemToken.M_OWNER = t;
        t = Termin._new349("ДОМОВЛАДЕНИЕ", AddressItemType.HOUSE, AddressHouseType.HOUSEESTATE);
        t.addVariant("ДОМОВЛАДЕНИЕ", false);
        t.addAbridge("ДВЛД.");
        t.addAbridge("ДМВЛД.");
        t.addVariant("ДОМОВЛ", false);
        t.addVariant("ДОМОВА", false);
        t.addVariant("ДОМОВЛАД", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ПОДЪЕЗД ДОМА", AddressItemType.HOUSE);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ЭТАЖ", AddressItemType.FLOOR);
        t.addAbridge("ЭТ.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ПОДЪЕЗД", AddressItemType.POTCH);
        t.addAbridge("ПОД.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("КОРПУС", AddressItemType.CORPUS);
        t.addAbridge("КОРП.");
        t.addAbridge("КОР.");
        t.addAbridge("Д.КОРП.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("К", AddressItemType.CORPUSORFLAT);
        t.addAbridge("К.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("СТРОЕНИЕ", AddressItemType.BUILDING);
        t.addAbridge("СТРОЕН.");
        t.addAbridge("СТР.");
        t.addAbridge("СТ.");
        t.addAbridge("ПОМ.СТР.");
        t.addAbridge("Д.СТР.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new357("СООРУЖЕНИЕ", "РК", AddressItemType.BUILDING, AddressBuildingType.CONSTRUCTION);
        t.addAbridge("СООР.");
        t.addAbridge("СООРУЖ.");
        t.addAbridge("СООРУЖЕН.");
        t.addVariant("БАШНЯ", false);
        t.addVariant("ЗДАНИЕ", false);
        t.addAbridge("ЗД.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ЛИТЕРА", AddressItemType.BUILDING, AddressBuildingType.LITER);
        t.addAbridge("ЛИТ.");
        t.addVariant("ЛИТЕР", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("УЧАСТОК", AddressItemType.PLOT);
        t.addAbridge("УЧАСТ.");
        t.addAbridge("УЧ.");
        t.addAbridge("УЧ-К");
        t.addAbridge("ДОМ УЧ.");
        t.addAbridge("ДОМ.УЧ.");
        t.addAbridge("У-К");
        t.addVariant("ЗЕМЕЛЬНЫЙ УЧАСТОК", false);
        t.addAbridge("ЗЕМ.УЧ.");
        t.addAbridge("ЗЕМ.УЧ-К");
        t.addAbridge("З/У");
        t.addVariant("ЧАСТЬ ВЫДЕЛА", false);
        t.addVariant("ВЫДЕЛ", false);
        t.addVariant("НАДЕЛ", false);
        t.addVariant("КОНТУР", false);
        t.addAbridge("ЗУ");
        t.addAbridge("ВЫД.");
        AddressItemToken.m_Ontology.add(t);
        AddressItemToken.M_PLOT = t;
        t = Termin._new170("ПОЛЕ", AddressItemType.FIELD);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new361("ГЕНЕРАЛЬНЫЙ ПЛАН", "ГП", AddressItemType.GENPLAN);
        t.addVariant("ГЕНПЛАН", false);
        t.addAbridge("ГЕН.ПЛАН");
        t.addAbridge("Г/П");
        t.addAbridge("Г.П.");
        t.addVariant("ПО ГП", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("КВАРТИРА", AddressItemType.FLAT);
        t.addAbridge("КВАРТ.");
        t.addAbridge("КВАР.");
        t.addAbridge("КВ.");
        t.addAbridge("KB.");
        t.addAbridge("КВ-РА");
        t.addAbridge("КВ.КОМ");
        t.addAbridge("КВ.ОБЩ");
        t.addAbridge("КВ.Ч.");
        t.addAbridge("КВЮ");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ОФИС", AddressItemType.OFFICE);
        t.addAbridge("ОФ.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new348("ОФІС", AddressItemType.OFFICE, MorphLang.UA);
        t.addAbridge("ОФ.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ПАВИЛЬОН", AddressItemType.PAVILION);
        t.addAbridge("ПАВ.");
        t.addVariant("ТОРГОВЫЙ ПАВИЛЬОН", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new348("ПАВІЛЬЙОН", AddressItemType.PAVILION, MorphLang.UA);
        t.addAbridge("ПАВ.");
        t.addVariant("ТОРГОВИЙ ПАВІЛЬЙОН", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("КЛАДОВКА", AddressItemType.PANTRY);
        t.addAbridge("КЛАД.");
        t.addVariant("КЛАДОВАЯ", false);
        t.addVariant("КЛАДОВОЕ ПОМЕЩЕНИЕ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("СЕКЦИЯ", AddressItemType.BLOCK);
        t.addVariant("БЛОК", false);
        t.addVariant("БЛОК БОКС", false);
        t.addAbridge("БЛ.");
        t.addVariant("БЛОК ГАРАЖЕЙ", false);
        t.addVariant("ГАРАЖНЫЙ БЛОК", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("БОКС", AddressItemType.BOX);
        t.addVariant("ГАРАЖ", false);
        t.addAbridge("ГАР.");
        t.addVariant("ГАРАЖНАЯ ЯЧЕЙКА", false);
        t.addAbridge("Г-Ж");
        t.addVariant("ПОДЪЕЗД", false);
        t.addAbridge("ГАРАЖ-БОКС");
        t.addVariant("ИНДИВИДУАЛЬНЫЙ ГАРАЖ", false);
        t.addVariant("ГАРАЖНЫЙ БОКС", false);
        t.addAbridge("ГБ.");
        t.addAbridge("Г.Б.");
        t.addVariant("ЭЛЛИНГ", false);
        t.addVariant("ЭЛИНГ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ЧАСТЬ", AddressItemType.PART);
        t.addAbridge("Ч.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("СКВАЖИНА", AddressItemType.WELL);
        t.addAbridge("СКВАЖ.");
        t.addVariant("СКВАЖИНА ГАЗОКОНДЕНСАТНАЯ ЭКСПЛУАТАЦИОННАЯ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ПОМЕЩЕНИЕ", AddressItemType.SPACE);
        t.addVariant("ПОМЕЩЕНИЕ", false);
        t.addAbridge("ПОМ.");
        t.addAbridge("ПОМЕЩ.");
        t.addVariant("НЕЖИЛОЕ ПОМЕЩЕНИЕ", false);
        t.addAbridge("Н.П.");
        t.addAbridge("НП");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ПОДВАЛ", AddressItemType.SPACE, 1);
        t.addVariant("ПОДВАЛЬНОЕ ПОМЕЩЕНИЕ", false);
        t.addAbridge("ПОДВ.ПОМ.");
        t.addAbridge("ПОДВАЛ.ПОМ.");
        t.addAbridge("ПОДВ.");
        t.addVariant("ПОГРЕБ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("МАСТЕРСКАЯ", AddressItemType.SPACE, 1);
        AddressItemToken.m_Ontology.add(t);
        for (const s of ["АПТЕКА", "МАНСАРДА", "АТЕЛЬЕ", "ЧЕРДАК", "КРЫША", "ОТЕЛЬ", "ГОСТИНИЦА", "САРАЙ", "ПАРИКМАХЕРСКАЯ", "СТОЛОВАЯ", "КАФЕ"]) {
            AddressItemToken.m_Ontology.add(Termin._new349(s, AddressItemType.SPACE, 1));
        }
        t = Termin._new349("МАГАЗИН", AddressItemType.SPACE, 1);
        t.addAbridge("МАГ.");
        t.addAbridge("МАГ-Н");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("МАШИНОМЕСТО", AddressItemType.CARPLACE);
        t.addAbridge("М/М");
        t.addAbridge("МАШ.МЕСТО");
        t.addAbridge("М.МЕСТО");
        t.addAbridge("МАШ.М.");
        t.addVariant("МАШИНО-МЕСТО", false);
        t.addVariant("ПАРКОВОЧНОЕ МЕСТО", false);
        t.addAbridge("ММ");
        t.addAbridge("MM");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("КОМНАТА", AddressItemType.ROOM);
        t.addAbridge("КОМ.");
        t.addAbridge("КОМН.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("КАБИНЕТ", AddressItemType.OFFICE);
        t.addAbridge("КАБ.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("НОМЕР", AddressItemType.NUMBER);
        t.addAbridge("НОМ.");
        t.addAbridge("№");
        t.addAbridge("N");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new381("БЕЗ НОМЕРА", "Б/Н", AddressItemType.NONUMBER);
        t.addVariant("НЕ ОПРЕДЕЛЕНО", false);
        t.addVariant("НЕОПРЕДЕЛЕНО", false);
        t.addVariant("НЕ ЗАДАН", false);
        t.addAbridge("Б.Н.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("АБОНЕНТСКИЙ ЯЩИК", AddressItemType.POSTOFFICEBOX);
        t.addAbridge("А.Я.");
        t.addVariant("ПОЧТОВЫЙ ЯЩИК", false);
        t.addAbridge("П.Я.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new383("ГОРОДСКАЯ СЛУЖЕБНАЯ ПОЧТА", AddressItemType.CSP, "ГСП");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ДОСТАВОЧНЫЙ УЧАСТОК", AddressItemType.DELIVERYAREA);
        t.addAbridge("ДОСТ.УЧАСТОК");
        t.addAbridge("ДОСТ.УЧ.");
        t.addAbridge("ДОСТ.УЧ-К");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new385("АДРЕС", AddressItemType.PREFIX, true);
        t.addVariant("ЮРИДИЧЕСКИЙ АДРЕС", false);
        t.addVariant("ФАКТИЧЕСКИЙ АДРЕС", false);
        t.addAbridge("ЮР.АДРЕС");
        t.addAbridge("ПОЧТ.АДРЕС");
        t.addAbridge("ФАКТ.АДРЕС");
        t.addAbridge("П.АДРЕС");
        t.addVariant("ЮРИДИЧЕСКИЙ/ФАКТИЧЕСКИЙ АДРЕС", false);
        t.addVariant("ЮРИДИЧЕСКИЙ И ФАКТИЧЕСКИЙ АДРЕС", false);
        t.addVariant("ПОЧТОВЫЙ АДРЕС", false);
        t.addVariant("АДРЕС ПРОЖИВАНИЯ", false);
        t.addVariant("МЕСТО НАХОЖДЕНИЯ", false);
        t.addVariant("МЕСТОНАХОЖДЕНИЕ", false);
        t.addVariant("МЕСТОПОЛОЖЕНИЕ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new385("АДРЕСА", AddressItemType.PREFIX, true);
        t.addVariant("ЮРИДИЧНА АДРЕСА", false);
        t.addVariant("ФАКТИЧНА АДРЕСА", false);
        t.addVariant("ПОШТОВА АДРЕСА", false);
        t.addVariant("АДРЕСА ПРОЖИВАННЯ", false);
        t.addVariant("МІСЦЕ ПЕРЕБУВАННЯ", false);
        t.addVariant("ПРОПИСКА", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("КИЛОМЕТР", AddressItemType.KILOMETER);
        t.addAbridge("КИЛОМ.");
        t.addAbridge("КМ.");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("ПЕРЕСЕЧЕНИЕ", AddressDetailType.CROSS);
        t.addVariant("НА ПЕРЕСЕЧЕНИИ", false);
        t.addVariant("ПЕРЕКРЕСТОК", false);
        t.addVariant("УГОЛ", false);
        t.addVariant("НА ПЕРЕКРЕСТКЕ", false);
        AddressItemToken.m_Ontology.add(t);
        AddressItemToken.m_Ontology.add(Termin._new170("НА ТЕРРИТОРИИ", AddressDetailType.NEAR));
        AddressItemToken.m_Ontology.add(Termin._new170("СЕРЕДИНА", AddressDetailType.NEAR));
        AddressItemToken.m_Ontology.add(Termin._new170("ПРИМЫКАТЬ", AddressDetailType.NEAR));
        AddressItemToken.m_Ontology.add(Termin._new170("ГРАНИЧИТЬ", AddressDetailType.NEAR));
        t = Termin._new170("ВБЛИЗИ", AddressDetailType.NEAR);
        t.addVariant("У", false);
        t.addAbridge("ВБЛ.");
        t.addVariant("В БЛИЗИ", false);
        t.addVariant("ВОЗЛЕ", false);
        t.addVariant("ОКОЛО", false);
        t.addVariant("НЕДАЛЕКО ОТ", false);
        t.addVariant("РЯДОМ С", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new170("РАЙОН", AddressDetailType.NEAR);
        t.addAbridge("Р-Н");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new381("В РАЙОНЕ", "РАЙОН", AddressDetailType.NEAR);
        t.addAbridge("В Р-НЕ");
        AddressItemToken.m_Ontology.add(t);
        AddressItemToken.m_Ontology.add(Termin._new170("ПРИМЕРНО", AddressDetailType.UNDEFINED));
        AddressItemToken.m_Ontology.add(Termin._new170("ПОРЯДКА", AddressDetailType.UNDEFINED));
        AddressItemToken.m_Ontology.add(Termin._new170("ПРИБЛИЗИТЕЛЬНО", AddressDetailType.UNDEFINED));
        AddressItemToken.m_Ontology.add(Termin._new170("ОРИЕНТИР", AddressDetailType.UNDEFINED));
        AddressItemToken.m_Ontology.add(Termin._new170("НАПРАВЛЕНИЕ", AddressDetailType.UNDEFINED));
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
        AddressItemToken.m_Ontology.add(Termin._new170("СЕВЕРНЕЕ", AddressDetailType.NORTH));
        AddressItemToken.m_Ontology.add(Termin._new170("СЕВЕР", AddressDetailType.NORTH));
        AddressItemToken.m_Ontology.add(Termin._new170("ЮЖНЕЕ", AddressDetailType.SOUTH));
        AddressItemToken.m_Ontology.add(Termin._new170("ЮГ", AddressDetailType.SOUTH));
        AddressItemToken.m_Ontology.add(Termin._new170("ЗАПАДНЕЕ", AddressDetailType.WEST));
        AddressItemToken.m_Ontology.add(Termin._new170("ЗАПАД", AddressDetailType.WEST));
        AddressItemToken.m_Ontology.add(Termin._new170("ВОСТОЧНЕЕ", AddressDetailType.EAST));
        AddressItemToken.m_Ontology.add(Termin._new170("ВОСТОК", AddressDetailType.EAST));
        AddressItemToken.m_Ontology.add(Termin._new170("СЕВЕРО-ЗАПАДНЕЕ", AddressDetailType.NORTHWEST));
        AddressItemToken.m_Ontology.add(Termin._new170("СЕВЕРО-ЗАПАД", AddressDetailType.NORTHWEST));
        AddressItemToken.m_Ontology.add(Termin._new170("СЕВЕРО-ВОСТОЧНЕЕ", AddressDetailType.NORTHEAST));
        AddressItemToken.m_Ontology.add(Termin._new170("СЕВЕРО-ВОСТОК", AddressDetailType.NORTHEAST));
        AddressItemToken.m_Ontology.add(Termin._new170("ЮГО-ЗАПАДНЕЕ", AddressDetailType.SOUTHWEST));
        AddressItemToken.m_Ontology.add(Termin._new170("ЮГО-ЗАПАД", AddressDetailType.SOUTHWEST));
        AddressItemToken.m_Ontology.add(Termin._new170("ЮГО-ВОСТОЧНЕЕ", AddressDetailType.SOUTHEAST));
        AddressItemToken.m_Ontology.add(Termin._new170("ЮГО-ВОСТОК", AddressDetailType.SOUTHEAST));
        t = Termin._new349("ЦЕНТРАЛЬНАЯ ЧАСТЬ", AddressDetailType.CENTRAL, 1);
        t.addAbridge("ЦЕНТР.ЧАСТЬ");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("СЕВЕРНАЯ ЧАСТЬ", AddressDetailType.NORTH, 1);
        t.addAbridge("СЕВ.ЧАСТЬ");
        t.addAbridge("СЕВЕРН.ЧАСТЬ");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("СЕВЕРО-ВОСТОЧНАЯ ЧАСТЬ", AddressDetailType.NORTHEAST, 1);
        t.addVariant("СЕВЕРОВОСТОЧНАЯ ЧАСТЬ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("СЕВЕРО-ЗАПАДНАЯ ЧАСТЬ", AddressDetailType.NORTHWEST, 1);
        t.addVariant("СЕВЕРОЗАПАДНАЯ ЧАСТЬ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ЮЖНАЯ ЧАСТЬ", AddressDetailType.SOUTH, 1);
        t.addAbridge("ЮЖН.ЧАСТЬ");
        t.addAbridge("ЮЖ.ЧАСТЬ");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ЮГО-ВОСТОЧНАЯ ЧАСТЬ", AddressDetailType.SOUTHEAST, 1);
        t.addVariant("ЮГОВОСТОЧНАЯ ЧАСТЬ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ЮГО-ЗАПАДНАЯ ЧАСТЬ", AddressDetailType.SOUTHWEST, 1);
        t.addVariant("ЮГОЗАПАДНАЯ ЧАСТЬ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ЗАПАДНАЯ ЧАСТЬ", AddressDetailType.WEST, 1);
        t.addAbridge("ЗАП.ЧАСТЬ");
        t.addAbridge("ЗАПАД.ЧАСТЬ");
        t.addAbridge("ЗАПАДН.ЧАСТЬ");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ВОСТОЧНАЯ ЧАСТЬ", AddressDetailType.EAST, 1);
        t.addAbridge("ВОСТ.ЧАСТЬ");
        t.addAbridge("ВОСТОЧ.ЧАСТЬ");
        t.addAbridge("ВОСТОЧН.ЧАСТЬ");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ПРАВАЯ ЧАСТЬ", AddressDetailType.RIGHT, 1);
        t.addAbridge("СПРАВА");
        t.addAbridge("ПРАВ.ЧАСТЬ");
        t.addVariant("ПРАВАЯ СТОРОНА", false);
        t.addAbridge("ПРАВ.СТОРОНА");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new349("ЛЕВАЯ ЧАСТЬ", AddressDetailType.LEFT, 1);
        t.addAbridge("СЛЕВА");
        t.addAbridge("ЛЕВ.ЧАСТЬ");
        t.addVariant("ЛЕВАЯ СТОРОНА", false);
        t.addAbridge("ЛЕВ.СТОРОНА");
        AddressItemToken.m_Ontology.add(t);
        t = new Termin("ТАМ ЖЕ");
        t.addAbridge("ТАМЖЕ");
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("АВТОЗАПРАВОЧНАЯ СТАНЦИЯ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "АЗС", true, true);
        t.addVariant("АВТО ЗАПРАВОЧНАЯ СТАНЦИЯ", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("АВТОНОМНАЯ ТЕПЛОВАЯ СТАНЦИЯ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "АТС", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("ДОРОЖНО РЕМОНТНЫЙ ПУНКТ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "ДРП", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("УСТАНОВКА КОМПЛЕКСНОЙ ПОДГОТОВКИ ГАЗА", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "УКПГ", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("УСТАНОВКА ПРЕДВАРИТЕЛЬНОЙ ПОДГОТОВКИ ГАЗА", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "УППГ", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("ЦЕНТРАЛЬНЫЙ ПУНКТ СБОРА НЕФТИ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "ЦПС", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("КОМПЛЕКТНАЯ ТРАНСФОРМАТОРНАЯ ПОДСТАНЦИЯ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "КТП", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("ТРАНСФОРМАТОРНАЯ ПОДСТАНЦИЯ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "ТП", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("ДИСПЕТЧЕРСКАЯ НЕФТЕПРОВОДНАЯ СЛУЖБА", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "ДНС", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("КУСТОВАЯ НАСОСНАЯ СТАНЦИЯ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "КНС", true, true);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("ЦЕНТРАЛЬНЫЙ РАСПРЕДЕЛИТЕЛЬНЫЙ ПУНКТ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "ЦРП", true, true);
        t.addVariant("ЦРП ТП", false);
        AddressItemToken.m_Ontology.add(t);
        t = Termin._new428("ТРАНСФОРМАТОРНАЯ ПОДСТАНЦИЯ", AddressItemType.HOUSE, AddressHouseType.SPECIAL, "ТП", true, true);
        AddressItemToken.m_Ontology.add(t);
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
    }
    
    static gotoEndOfAddress(t, _isHouse) {
        _isHouse.value = false;
        let brStart = null;
        let brEnd = null;
        let t1 = t;
        for (let tt = t.next; tt !== null; tt = tt.next) {
            if ((tt instanceof NumberToken) || tt.isNewlineBefore) 
                break;
            let ttt = Utils.as(tt, TextToken);
            if (ttt === null) 
                break;
            if (ttt.isChar('(')) 
                brStart = tt;
            if (ttt.isChar(')')) 
                brEnd = tt;
            if (!ttt.chars.isLetter) 
                continue;
            if ((ttt.isValue("ЧАСНЫЙ", null) || ttt.isValue("ЧАСТНЫЙ", null) || ttt.term === "Ч") || ttt.term === "ЧАСТН") {
                let tt2 = ttt.next;
                if (tt2 !== null && tt2.isCharOf(".\\/-")) 
                    tt2 = tt2.next;
                if (tt2 instanceof TextToken) {
                    if ((tt2.isValue("С", null) || tt2.isValue("ДОМ", null) || tt2.isValue("СЕКТ", null)) || tt2.isValue("СЕКТОР", null) || tt2.isValue("Д", null)) {
                        if (tt2.isValue("ДОМ", null)) 
                            _isHouse.value = true;
                        t1 = (tt = tt2);
                        continue;
                    }
                }
            }
            if ((ttt.term === "ЛПХ" || ttt.term === "ИЖС" || ttt.term === "ЖД") || ttt.term === "ПС" || ttt.term === "ВЧ") {
                t1 = tt;
                continue;
            }
            if (ttt.term.startsWith("ОБЩ")) {
                _isHouse.value = true;
                t1 = tt;
                continue;
            }
            if (ttt.term.startsWith("СЕМ") || ttt.term.startsWith("ВЕД")) 
                continue;
            if ((ttt.lengthChar === 3 && ttt.chars.isAllUpper && MiscLocationHelper.isUserParamAddress(ttt)) && NumberHelper.tryParseRoman(ttt) === null) {
                t1 = tt;
                continue;
            }
            if ((ttt.lengthChar === 1 && ttt.next !== null && ttt.next.isCharOf("\\/")) && (ttt.next.next instanceof TextToken) && ttt.next.next.lengthChar === 1) {
                tt = tt.next.next;
                t1 = tt;
                continue;
            }
            break;
        }
        if (brStart !== null && t1.endChar > brStart.beginChar) {
            if (brEnd !== null && brEnd.endChar > t1.endChar) 
                t1 = brEnd;
            else {
                let br = BracketHelper.tryParse(brStart, BracketParseAttr.NO, 100);
                if (br !== null && br.endChar > t1.endChar) 
                    t1 = br.endToken;
            }
        }
        return t1;
    }
    
    static _new113(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.buildingType = _arg4;
        res.value = _arg5;
        return res;
    }
    
    static _new288(_arg1, _arg2, _arg3, _arg4) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.detailType = _arg4;
        return res;
    }
    
    static _new289(_arg1, _arg2, _arg3, _arg4) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.value = _arg4;
        return res;
    }
    
    static _new293(_arg1, _arg2, _arg3, _arg4) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.referent = _arg4;
        return res;
    }
    
    static _new296(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.referent = _arg4;
        res.refToken = _arg5;
        return res;
    }
    
    static _new306(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.houseType = _arg4;
        res.value = _arg5;
        return res;
    }
    
    static _new308(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.value = _arg4;
        res.houseType = _arg5;
        return res;
    }
    
    static _new310(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.value = _arg4;
        res.isDoubt = _arg5;
        return res;
    }
    
    static _new311(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.houseType = _arg4;
        res.buildingType = _arg5;
        res.value = _arg6;
        return res;
    }
    
    static _new313(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.value = _arg4;
        res.houseType = _arg5;
        res.buildingType = _arg6;
        return res;
    }
    
    static _new319(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.value = _arg4;
        res.morph = _arg5;
        res.houseType = _arg6;
        res.buildingType = _arg7;
        return res;
    }
    
    static _new440(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new AddressItemToken(_arg1, _arg2, _arg3);
        res.referent = _arg4;
        res.isDoubt = _arg5;
        return res;
    }
    
    static static_constructor() {
        AddressItemToken.SPEED_REGIME = false;
        AddressItemToken.m_Ontology = null;
        AddressItemToken.M_PLOT = null;
        AddressItemToken.M_OWNER = null;
    }
}


AddressItemToken.static_constructor();

module.exports = AddressItemToken