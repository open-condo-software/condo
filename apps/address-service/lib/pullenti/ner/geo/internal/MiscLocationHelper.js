/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const Stream = require("./../../../unisharp/Stream");
const MemoryStream = require("./../../../unisharp/MemoryStream");

const MorphNumber = require("./../../../morph/MorphNumber");
const AddressItemType = require("./../../address/internal/AddressItemType");
const MorphGender = require("./../../../morph/MorphGender");
const GetTextAttr = require("./../../core/GetTextAttr");
const MetaToken = require("./../../MetaToken");
const StreetItemType = require("./../../address/internal/StreetItemType");
const MiscHelper = require("./../../core/MiscHelper");
const MorphLang = require("./../../../morph/MorphLang");
const Termin = require("./../../core/Termin");
const GeoReferent = require("./../GeoReferent");
const MorphDeserializer = require("./../../../morph/internal/MorphDeserializer");
const TerminCollection = require("./../../core/TerminCollection");
const CityItemTokenItemType = require("./CityItemTokenItemType");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const Token = require("./../../Token");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const TextToken = require("./../../TextToken");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");
const NumberToken = require("./../../NumberToken");
const ReferentToken = require("./../../ReferentToken");
const StreetReferent = require("./../../address/StreetReferent");
const GeoTokenData = require("./GeoTokenData");

class MiscLocationHelper {
    
    static isUserParamAddress(t) {
        if (t === null) 
            return false;
        if (t.kit.sofa.userParams !== null) {
            if (t.kit.sofa.userParams.includes("ADDRESS") || t.kit.sofa.userParams.includes("GARADDRESS")) 
                return true;
        }
        return false;
    }
    
    static isUserParamGarAddress(t) {
        if (t === null) 
            return false;
        if (t.kit.sofa.userParams !== null) {
            if (t.kit.sofa.userParams.includes("GARADDRESS")) 
                return true;
        }
        return false;
    }
    
    static checkNameLong(mt) {
        const StreetItemToken = require("./../../address/internal/StreetItemToken");
        const TerrItemToken = require("./TerrItemToken");
        const CityItemToken = require("./CityItemToken");
        if (mt === null || mt.whitespacesAfterCount > 2) 
            return null;
        if (!MiscLocationHelper.isUserParamAddress(mt)) 
            return null;
        if (mt.beginToken !== mt.endToken) 
            return null;
        let t = mt.endToken.next;
        if (t === null) 
            return null;
        let mc = t.getMorphClassInDictionary();
        if (((mc.isPreposition || t.isAnd)) && t.next !== null) 
            t = t.next;
        if (t instanceof NumberToken) 
            return null;
        let ok = false;
        if (t.next === null || t.isNewlineAfter) 
            ok = true;
        else if (t.next.isComma) 
            ok = true;
        if (t instanceof TextToken) {
            mc = t.getMorphClassInDictionary();
            if (!t.chars.isLetter || (t.lengthChar < 2)) 
                return null;
            if (mc.isAdjective) 
                ok = false;
            else {
                if ((mc.isProperSurname && !t.isValue("ГОРА", null) && !t.isValue("ГЛИНКА", null)) && !MiscLocationHelper.isUserParamGarAddress(t)) 
                    return null;
                if (t.isValue("УЛ", null)) 
                    return null;
                if (MiscLocationHelper.checkTerritory(t) !== null && !t.isValue("САД", null)) 
                    return null;
                if (mc.isNoun || mc.isProperGeo) {
                }
                else if (mc.isUndefined && t.chars.isAllLower) {
                }
                else 
                    ok = false;
            }
        }
        if (ok) {
            if (mt instanceof StreetItemToken) {
                if (StreetItemToken.checkKeyword(t)) 
                    return null;
            }
        }
        else if (MiscLocationHelper.NAME_CHECKER !== null) {
            let str = MiscHelper.getTextValue(mt.beginToken, t, GetTextAttr.NO);
            let isStreet = true;
            if ((mt instanceof CityItemToken) || (mt instanceof TerrItemToken)) 
                isStreet = false;
            if (MiscLocationHelper.NAME_CHECKER.check(str, isStreet)) 
                ok = true;
        }
        if (t.isNewlineAfter && MiscLocationHelper.isUserParamGarAddress(t)) {
            ok = true;
            if (t.isValue("ГОРА", null)) {
            }
            else {
                let rt = t.kit.processReferent("PERSON", mt.endToken, null);
                if (rt !== null && rt.endToken === t) 
                    ok = false;
            }
        }
        if (ok) 
            return t;
        return null;
    }
    
    static prepareAllData(t0) {
        
    }
    
    static tryParseNpt(t) {
        if (t === null) 
            return null;
        return NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
    }
    
    static checkTerritory(t) {
        const AddressItemToken = require("./../../address/internal/AddressItemToken");
        if (!(t instanceof TextToken)) 
            return null;
        let tok = MiscLocationHelper.m_Terrs.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return null;
        if (tok.termin.canonicText === "ТЕРРИТОРИЯ") {
            if (t.previous !== null && t.previous.isValue("ФЕДЕРАЛЬНЫЙ", null)) 
                return null;
        }
        if (tok.termin.canonicText === "УЧАСТОК") {
            if (!MiscLocationHelper.isUserParamAddress(t)) 
                return null;
            let ait = AddressItemToken.tryParsePureItem(t, null, null);
            if ((ait !== null && !Utils.isNullOrEmpty(ait.value) && (ait.value.length < 4)) && Utils.isDigit(ait.value[0])) 
                return null;
        }
        let tt2 = tok.endToken;
        let tok2 = MiscLocationHelper.m_Terrs.tryParse(tt2.next, TerminParseAttr.NO);
        if (tok2 !== null) 
            tt2 = tok2.endToken;
        let npt = MiscLocationHelper.tryParseNpt(tt2.next);
        if (npt !== null && npt.endToken.isValue("ЗЕМЛЯ", null)) 
            tt2 = npt.endToken;
        if (tt2.next !== null) {
            if (tt2.next.isValue("БЫВШИЙ", null) || tt2.next.isValue("РАЙОН", null)) 
                tt2 = tt2.next;
            else if (tt2.next.isValue("БЫВШ", null)) {
                tt2 = tt2.next;
                if (tt2.next !== null && tt2.next.isChar('.')) 
                    tt2 = tt2.next;
            }
        }
        return tt2;
    }
    
    static checkGeoObjectBefore(t, pureGeo = false) {
        const AddressReferent = require("./../../address/AddressReferent");
        if (t === null) 
            return false;
        for (let tt = t.previous; tt !== null; tt = tt.previous) {
            if ((tt.isCharOf(",.;:") || tt.isHiphen || tt.isAnd) || tt.morph._class.isConjunction || tt.morph._class.isPreposition) 
                continue;
            if (MiscLocationHelper.m_Terrs.tryParse(tt, TerminParseAttr.NO) !== null) 
                continue;
            if (MiscLocationHelper.m_GeoBefore.tryParse(tt, TerminParseAttr.NO) !== null) 
                return true;
            if (tt.lengthChar === 2 && (tt instanceof TextToken) && tt.chars.isAllUpper) {
                let term = tt.term;
                if (!Utils.isNullOrEmpty(term) && term[0] === 'Р') 
                    return true;
            }
            let rt = Utils.as(tt, ReferentToken);
            if (rt !== null) {
                if (rt.referent instanceof GeoReferent) 
                    return true;
                if (!pureGeo) {
                    if ((rt.referent instanceof AddressReferent) || (rt.referent instanceof StreetReferent)) 
                        return true;
                }
            }
            break;
        }
        return false;
    }
    
    static checkGeoObjectBeforeBrief(t, ad = null) {
        const AddressReferent = require("./../../address/AddressReferent");
        const GeoAnalyzer = require("./../GeoAnalyzer");
        if (t === null) 
            return false;
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return false;
        let miss = 0;
        for (let tt = t.previous; tt !== null; tt = tt.previous) {
            if (tt.isNewlineAfter) 
                break;
            if (tt.isCharOf(",.;") || tt.isHiphen || tt.morph._class.isConjunction) 
                continue;
            if (MiscLocationHelper.checkTerritory(tt) !== null) 
                return true;
            let rt = Utils.as(tt, ReferentToken);
            if (rt !== null) {
                if ((rt.referent instanceof GeoReferent) || (rt.referent instanceof AddressReferent) || (rt.referent instanceof StreetReferent)) 
                    return true;
                break;
            }
            let d = Utils.as(tt.tag, GeoTokenData);
            if (d !== null) {
                if (d.cit !== null && ((d.cit.typ === CityItemTokenItemType.NOUN || d.cit.typ === CityItemTokenItemType.CITY))) 
                    return true;
                if (d.terr !== null && ((d.terr.terminItem !== null || d.terr.ontoItem !== null))) 
                    return true;
                if (d.street !== null && d.street.typ === StreetItemType.NOUN && d.street.nounIsDoubtCoef === 0) 
                    return true;
            }
            if ((++miss) > 2) 
                break;
        }
        return false;
    }
    
    static checkGeoObjectAfterBrief(t, ad = null) {
        const CityItemToken = require("./CityItemToken");
        const AddressReferent = require("./../../address/AddressReferent");
        const GeoAnalyzer = require("./../GeoAnalyzer");
        if (t === null) 
            return false;
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return false;
        let miss = 0;
        for (let tt = t.next; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore) 
                break;
            if (tt.isCharOf(",.;") || tt.isHiphen || tt.morph._class.isConjunction) 
                continue;
            if (MiscLocationHelper.checkTerritory(tt) !== null) 
                return true;
            let rt = Utils.as(tt, ReferentToken);
            if (rt !== null) {
                if ((rt.referent instanceof GeoReferent) || (rt.referent instanceof AddressReferent) || (rt.referent instanceof StreetReferent)) 
                    return true;
                break;
            }
            let d = Utils.as(tt.tag, GeoTokenData);
            if (d !== null) {
                if (d.cit !== null && ((d.cit.typ === CityItemTokenItemType.NOUN || d.cit.typ === CityItemTokenItemType.CITY))) 
                    return true;
                if (d.terr !== null && ((d.terr.terminItem !== null || d.terr.ontoItem !== null))) 
                    return true;
                if (d.street !== null && d.street.typ === StreetItemType.NOUN && d.street.nounIsDoubtCoef === 0) 
                    return true;
            }
            if (CityItemToken.checkKeyword(tt) !== null) 
                return true;
            if ((tt instanceof TextToken) && tt.chars.isAllLower) {
                if (!tt.morph._class.isPreposition) 
                    break;
            }
            miss++;
            if (miss > 4) 
                break;
        }
        return false;
    }
    
    static checkGeoObjectAfter(t, dontCheckCity = false, checkTerr = false) {
        const CityItemToken = require("./CityItemToken");
        const AddressReferent = require("./../../address/AddressReferent");
        const TerrItemToken = require("./TerrItemToken");
        const OrgItemToken = require("./OrgItemToken");
        if (t === null) 
            return false;
        let cou = 0;
        for (let tt = t.next; tt !== null; tt = tt.next) {
            if (tt.isCharOf(",.;") || tt.isHiphen || tt.morph._class.isConjunction) 
                continue;
            if (tt.morph._class.isPreposition) {
                if (!dontCheckCity && tt.isValue("С", null) && tt.next !== null) {
                    let ttt = tt.next;
                    if (ttt.isChar('.') && (ttt.whitespacesAfterCount < 3)) 
                        ttt = ttt.next;
                    let cits = CityItemToken.tryParseList(ttt, 3, null);
                    if (cits !== null && cits.length === 1 && ((cits[0].typ === CityItemTokenItemType.PROPERNAME || cits[0].typ === CityItemTokenItemType.CITY))) {
                        if (tt.chars.isAllUpper && !cits[0].chars.isAllUpper) {
                        }
                        else 
                            return true;
                    }
                }
                continue;
            }
            if (MiscLocationHelper.checkTerritory(tt) !== null) 
                return true;
            let rt = Utils.as(tt, ReferentToken);
            if (rt === null) {
                if (!dontCheckCity && cou === 0) {
                    let cits = CityItemToken.tryParseList(tt, 3, null);
                    if ((cits !== null && cits.length >= 2 && cits[0].typ === CityItemTokenItemType.NOUN) && ((cits[1].typ === CityItemTokenItemType.PROPERNAME || cits[1].typ === CityItemTokenItemType.CITY))) {
                        if (cits[0].chars.isAllUpper && !cits[1].chars.isAllUpper) {
                        }
                        else 
                            return true;
                    }
                    if (cits !== null && cits[0].typ === CityItemTokenItemType.NOUN && (cits[0].whitespacesAfterCount < 3)) {
                        if (OrgItemToken.tryParse(cits[0].endToken.next, null) !== null) 
                            return true;
                    }
                }
                if (checkTerr && cou === 0) {
                    let ters = TerrItemToken.tryParseList(tt, 4, null);
                    if (ters !== null) {
                        if (ters.length === 2 && (ters[0].whitespacesAfterCount < 3)) {
                            if (ters[0].terminItem !== null && ters[1].terminItem === null && ters[1].ontoItem === null) 
                                return true;
                            if (ters[1].terminItem !== null && ters[0].terminItem === null) 
                                return true;
                        }
                        if (ters.length === 1 && ters[0].ontoItem !== null) 
                            return true;
                    }
                }
                if ((tt instanceof TextToken) && tt.lengthChar > 2 && cou === 0) {
                    cou++;
                    continue;
                }
                else 
                    break;
            }
            if ((rt.referent instanceof GeoReferent) || (rt.referent instanceof AddressReferent) || (rt.referent instanceof StreetReferent)) 
                return true;
            break;
        }
        return false;
    }
    
    static checkNearBefore(t, ad) {
        const AddressItemToken = require("./../../address/internal/AddressItemToken");
        if (t === null || t.previous === null) 
            return null;
        let cou = 0;
        for (let tt = t.previous; tt !== null && (cou < 5); tt = tt.previous,cou++) {
            if (tt.morph._class.isPreposition && (cou < 2)) {
                if (MiscLocationHelper.m_Near.tryParse(tt, TerminParseAttr.NO) !== null) 
                    return tt;
            }
            let ait = AddressItemToken.tryParsePureItem(tt, null, ad);
            if (ait !== null && ait.typ === AddressItemType.DETAIL) 
                return tt;
        }
        return null;
    }
    
    static checkUnknownRegion(t) {
        const TerrItemToken = require("./TerrItemToken");
        if (!(t instanceof TextToken)) 
            return null;
        let npt = MiscLocationHelper.tryParseNpt(t);
        if (npt === null) 
            return null;
        if (TerrItemToken.m_UnknownRegions.tryParse(npt.endToken, TerminParseAttr.FULLWORDSONLY) !== null) 
            return npt.endToken;
        return null;
    }
    
    static getStdAdjFull(t, gen, num, strict) {
        if (!(t instanceof TextToken)) 
            return null;
        return MiscLocationHelper.getStdAdjFullStr(t.term, gen, num, strict);
    }
    
    static getStdAdjFullStr(v, gen, num, strict) {
        let res = new Array();
        if (v.startsWith("Б")) {
            if (num === MorphNumber.PLURAL) {
                res.push("БОЛЬШИЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("БОЛЬШИЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("БОЛЬШАЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("БОЛЬШОЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("БОЛЬШОЕ");
            }
            if (res.length > 0) 
                return res;
            return null;
        }
        if (v.startsWith("М")) {
            if (num === MorphNumber.PLURAL) {
                res.push("МАЛЫЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("МАЛЫЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("МАЛАЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("МАЛЫЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("МАЛОЕ");
            }
            if (res.length > 0) 
                return res;
            return null;
        }
        if (v.startsWith("В")) {
            if (num === MorphNumber.PLURAL) {
                res.push("ВЕРХНИЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("ВЕРХНИЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("ВЕРХНЯЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("ВЕРХНИЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("ВЕРХНЕЕ");
            }
            if (res.length === 0 && gen === MorphGender.UNDEFINED) 
                res.push("ВЕРХНИЙ");
            if (res.length > 0) 
                return res;
            return null;
        }
        if (v === "Н") {
            let r1 = MiscLocationHelper.getStdAdjFullStr("НОВ", gen, num, strict);
            let r2 = MiscLocationHelper.getStdAdjFullStr("НИЖ", gen, num, strict);
            if (r1 === null && r2 === null) 
                return null;
            if (r1 === null) 
                return r2;
            if (r2 === null) 
                return r1;
            r1.splice(1, 0, r2[0]);
            r2.splice(0, 1);
            r1.splice(r1.length, 0, ...r2);
            return r1;
        }
        if (v === "С" || v === "C") {
            let r1 = MiscLocationHelper.getStdAdjFullStr("СТ", gen, num, strict);
            let r2 = MiscLocationHelper.getStdAdjFullStr("СР", gen, num, strict);
            if (r1 === null && r2 === null) 
                return null;
            if (r1 === null) 
                return r2;
            if (r2 === null) 
                return r1;
            r1.splice(1, 0, r2[0]);
            r2.splice(0, 1);
            r1.splice(r1.length, 0, ...r2);
            return r1;
        }
        if (v.startsWith("НОВ")) {
            if (num === MorphNumber.PLURAL) {
                res.push("НОВЫЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("НОВЫЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("НОВАЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("НОВЫЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("НОВОЕ");
            }
            if (res.length > 0) 
                return res;
            return null;
        }
        if (v.startsWith("НИЖ")) {
            if (num === MorphNumber.PLURAL) {
                res.push("НИЖНИЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("НИЖНИЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("НИЖНЯЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("НИЖНИЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("НИЖНЕЕ");
            }
            if (res.length > 0) 
                return res;
            return null;
        }
        if (v.startsWith("КР")) {
            if (num === MorphNumber.PLURAL) {
                res.push("КРАСНЫЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("КРАСНЫЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("КРАСНАЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("КРАСНЫЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("КРАСНОЕ");
            }
            if (res.length > 0) 
                return res;
            return null;
        }
        if (v.startsWith("СТ")) {
            if (num === MorphNumber.PLURAL) {
                res.push("СТАРЫЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("СТАРЫЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("СТАРАЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("СТАРЫЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("СТАРОЕ");
            }
            if (res.length > 0) 
                return res;
            return null;
        }
        if (v.startsWith("СР")) {
            if (num === MorphNumber.PLURAL) {
                res.push("СРЕДНИЕ");
                return res;
            }
            if (!strict && ((num.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) 
                res.push("СРЕДНИЕ");
            if (((gen.value()) & (MorphGender.FEMINIE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.FEMINIE) 
                    res.push("СРЕДНЯЯ");
            }
            if (((gen.value()) & (MorphGender.MASCULINE.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.MASCULINE) 
                    res.push("СРЕДНИЙ");
            }
            if (((gen.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                if (!strict || gen === MorphGender.NEUTER) 
                    res.push("СРЕДНЕЕ");
            }
            if (res.length > 0) 
                return res;
            return null;
        }
        return null;
    }
    
    static getGeoReferentByName(name) {
        const TerrItemToken = require("./TerrItemToken");
        let res = null;
        let wrapres1241 = new RefOutArgWrapper();
        let inoutres1242 = MiscLocationHelper.m_GeoRefByName.tryGetValue(name, wrapres1241);
        res = wrapres1241.value;
        if (inoutres1242) 
            return res;
        for (const r of TerrItemToken.m_AllStates) {
            if (r.findSlot(null, name, true) !== null) {
                res = Utils.as(r, GeoReferent);
                break;
            }
        }
        MiscLocationHelper.m_GeoRefByName.put(name, res);
        return res;
    }
    
    static tryAttachNordWest(t) {
        if (!(t instanceof TextToken)) 
            return null;
        let tok = MiscLocationHelper.m_Nords.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return null;
        let res = MetaToken._new823(t, t, t.morph);
        let t1 = null;
        if ((t.next !== null && t.next.isHiphen && (t.whitespacesAfterCount < 2)) && (t.next.whitespacesAfterCount < 2)) 
            t1 = t.next.next;
        else if (t.morph._class.isAdjective && (t.whitespacesAfterCount < 2)) 
            t1 = t.next;
        if (t1 !== null) {
            if ((((tok = MiscLocationHelper.m_Nords.tryParse(t1, TerminParseAttr.NO)))) !== null) {
                res.endToken = tok.endToken;
                res.morph = tok.morph;
            }
        }
        return res;
    }
    
    static initialize() {
        if (MiscLocationHelper.m_Nords !== null) 
            return;
        MiscLocationHelper.m_Nords = new TerminCollection();
        for (const s of ["СЕВЕРНЫЙ", "ЮЖНЫЙ", "ЗАПАДНЫЙ", "ВОСТОЧНЫЙ", "ЦЕНТРАЛЬНЫЙ", "БЛИЖНИЙ", "ДАЛЬНИЙ", "СРЕДНИЙ", "СЕВЕР", "ЮГ", "ЗАПАД", "ВОСТОК", "СЕВЕРО", "ЮГО", "ЗАПАДНО", "ВОСТОЧНО", "СЕВЕРОЗАПАДНЫЙ", "СЕВЕРОВОСТОЧНЫЙ", "ЮГОЗАПАДНЫЙ", "ЮГОВОСТОЧНЫЙ"]) {
            MiscLocationHelper.m_Nords.add(new Termin(s, MorphLang.RU, true));
        }
        MiscLocationHelper.m_Near = new TerminCollection();
        for (const s of ["У", "ОКОЛО", "ВБЛИЗИ", "ВБЛИЗИ ОТ", "НЕДАЛЕКО ОТ", "НЕПОДАЛЕКУ ОТ"]) {
            MiscLocationHelper.m_Near.add(new Termin(s));
        }
        MiscLocationHelper.m_GeoBefore = new TerminCollection();
        for (const s of ["ПРОЖИВАТЬ", "ПРОЖИВАТИ", "РОДИТЬ", "НАРОДИТИ", "ЗАРЕГИСТРИРОВАТЬ", "ЗАРЕЄСТРУВАТИ", "АДРЕС", "УРОЖЕНЕЦ", "УРОДЖЕНЕЦЬ", "УРОЖЕНКА", "УРОДЖЕНКА"]) {
            MiscLocationHelper.m_GeoBefore.add(new Termin(s));
        }
        MiscLocationHelper.m_Terrs = new TerminCollection();
        let t = new Termin("ТЕРРИТОРИЯ");
        t.addVariant("ТЕР", false);
        t.addVariant("ТЕРР", false);
        t.addVariant("ТЕРИТОРІЯ", false);
        t.addAbridge("ТЕР.");
        t.addAbridge("ТЕРР.");
        MiscLocationHelper.m_Terrs.add(t);
        MiscLocationHelper.m_Terrs.add(new Termin("ГРАНИЦА"));
        MiscLocationHelper.m_Terrs.add(new Termin("В ГРАНИЦАХ"));
        t = new Termin("УЧАСТОК");
        t.addAbridge("УЧ.");
        t.addAbridge("УЧ-К");
        MiscLocationHelper.m_Terrs.add(t);
        let table = "\nAF\tAFG\nAX\tALA\nAL\tALB\nDZ\tDZA\nAS\tASM\nAD\tAND\nAO\tAGO\nAI\tAIA\nAQ\tATA\nAG\tATG\nAR\tARG\nAM\tARM\nAW\tABW\nAU\tAUS\nAT\tAUT\nAZ\tAZE\nBS\tBHS\nBH\tBHR\nBD\tBGD\nBB\tBRB\nBY\tBLR\nBE\tBEL\nBZ\tBLZ\nBJ\tBEN\nBM\tBMU\nBT\tBTN\nBO\tBOL\nBA\tBIH\nBW\tBWA\nBV\tBVT\nBR\tBRA\nVG\tVGB\nIO\tIOT\nBN\tBRN\nBG\tBGR\nBF\tBFA\nBI\tBDI\nKH\tKHM\nCM\tCMR\nCA\tCAN\nCV\tCPV\nKY\tCYM\nCF\tCAF\nTD\tTCD\nCL\tCHL\nCN\tCHN\nHK\tHKG\nMO\tMAC\nCX\tCXR\nCC\tCCK\nCO\tCOL\nKM\tCOM\nCG\tCOG\nCD\tCOD\nCK\tCOK\nCR\tCRI\nCI\tCIV\nHR\tHRV\nCU\tCUB\nCY\tCYP\nCZ\tCZE\nDK\tDNK\nDJ\tDJI\nDM\tDMA\nDO\tDOM\nEC\tECU\nEG\tEGY\nSV\tSLV\nGQ\tGNQ\nER\tERI\nEE\tEST\nET\tETH\nFK\tFLK\nFO\tFRO\nFJ\tFJI\nFI\tFIN\nFR\tFRA\nGF\tGUF\nPF\tPYF\nTF\tATF\nGA\tGAB\nGM\tGMB\nGE\tGEO\nDE\tDEU\nGH\tGHA\nGI\tGIB\nGR\tGRC\nGL\tGRL\nGD\tGRD\nGP\tGLP\nGU\tGUM\nGT\tGTM\nGG\tGGY\nGN\tGIN\nGW\tGNB\nGY\tGUY\nHT\tHTI\nHM\tHMD\nVA\tVAT\nHN\tHND\nHU\tHUN\nIS\tISL\nIN\tIND\nID\tIDN\nIR\tIRN\nIQ\tIRQ\nIE\tIRL\nIM\tIMN\nIL\tISR\nIT\tITA\nJM\tJAM\nJP\tJPN\nJE\tJEY\nJO\tJOR\nKZ\tKAZ\nKE\tKEN\nKI\tKIR\nKP\tPRK\nKR\tKOR\nKW\tKWT\nKG\tKGZ\nLA\tLAO\nLV\tLVA\nLB\tLBN\nLS\tLSO\nLR\tLBR\nLY\tLBY\nLI\tLIE\nLT\tLTU\nLU\tLUX\nMK\tMKD\nMG\tMDG\nMW\tMWI\nMY\tMYS\nMV\tMDV\nML\tMLI\nMT\tMLT\nMH\tMHL\nMQ\tMTQ\nMR\tMRT\nMU\tMUS\nYT\tMYT\nMX\tMEX\nFM\tFSM\nMD\tMDA\nMC\tMCO\nMN\tMNG\nME\tMNE\nMS\tMSR\nMA\tMAR\nMZ\tMOZ\nMM\tMMR\nNA\tNAM\nNR\tNRU\nNP\tNPL\nNL\tNLD\nAN\tANT\nNC\tNCL\nNZ\tNZL\nNI\tNIC\nNE\tNER\nNG\tNGA\nNU\tNIU\nNF\tNFK\nMP\tMNP\nNO\tNOR\nOM\tOMN\nPK\tPAK\nPW\tPLW\nPS\tPSE\nPA\tPAN\nPG\tPNG\nPY\tPRY\nPE\tPER\nPH\tPHL\nPN\tPCN\nPL\tPOL\nPT\tPRT\nPR\tPRI\nQA\tQAT\nRE\tREU\nRO\tROU\nRU\tRUS\nRW\tRWA\nBL\tBLM\nSH\tSHN\nKN\tKNA\nLC\tLCA\nMF\tMAF\nPM\tSPM\nVC\tVCT\nWS\tWSM\nSM\tSMR\nST\tSTP\nSA\tSAU\nSN\tSEN\nRS\tSRB\nSC\tSYC\nSL\tSLE\nSG\tSGP\nSK\tSVK\nSI\tSVN\nSB\tSLB\nSO\tSOM\nZA\tZAF\nGS\tSGS\nSS\tSSD\nES\tESP\nLK\tLKA\nSD\tSDN\nSR\tSUR\nSJ\tSJM\nSZ\tSWZ\nSE\tSWE\nCH\tCHE\nSY\tSYR\nTW\tTWN\nTJ\tTJK\nTZ\tTZA\nTH\tTHA\nTL\tTLS\nTG\tTGO\nTK\tTKL\nTO\tTON\nTT\tTTO\nTN\tTUN\nTR\tTUR\nTM\tTKM\nTC\tTCA\nTV\tTUV\nUG\tUGA\nUA\tUKR\nAE\tARE\nGB\tGBR\nUS\tUSA\nUM\tUMI\nUY\tURY\nUZ\tUZB\nVU\tVUT\nVE\tVEN\nVN\tVNM\nVI\tVIR\nWF\tWLF\nEH\tESH\nYE\tYEM\nZM\tZMB\nZW\tZWE ";
        for (const s of Utils.splitString(table, '\n', false)) {
            let ss = s.trim();
            if ((ss.length < 6) || !Utils.isWhitespace(ss[2])) 
                continue;
            let cod2 = ss.substring(0, 0 + 2);
            let cod3 = ss.substring(3).trim();
            if (cod3.length !== 3) 
                continue;
            if (!MiscLocationHelper.m_Alpha2_3.containsKey(cod2)) 
                MiscLocationHelper.m_Alpha2_3.put(cod2, cod3);
            if (!MiscLocationHelper.m_Alpha3_2.containsKey(cod3)) 
                MiscLocationHelper.m_Alpha3_2.put(cod3, cod2);
        }
    }
    
    static deflate(zip) {
        let unzip = new MemoryStream(); 
        try {
            let data = new MemoryStream(zip);
            data.position = 0;
            MorphDeserializer.deflateGzip(data, unzip);
            data.close();
            return unzip.toByteArray();
        }
        finally {
            unzip.close();
        }
    }
    
    static static_constructor() {
        MiscLocationHelper.NAME_CHECKER = null;
        MiscLocationHelper.m_GeoRefByName = new Hashtable();
        MiscLocationHelper.m_Terrs = null;
        MiscLocationHelper.m_GeoBefore = null;
        MiscLocationHelper.m_Near = null;
        MiscLocationHelper.m_Nords = null;
        MiscLocationHelper.m_Alpha2_3 = new Hashtable();
        MiscLocationHelper.m_Alpha3_2 = new Hashtable();
    }
}


MiscLocationHelper.static_constructor();

module.exports = MiscLocationHelper