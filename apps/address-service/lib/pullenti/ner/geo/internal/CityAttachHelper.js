/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const MorphNumber = require("./../../../morph/MorphNumber");
const GetTextAttr = require("./../../core/GetTextAttr");
const MorphGender = require("./../../../morph/MorphGender");
const ProperNameHelper = require("./../../core/ProperNameHelper");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const MorphClass = require("./../../../morph/MorphClass");
const DateReferent = require("./../../date/DateReferent");
const MetaToken = require("./../../MetaToken");
const NumberToken = require("./../../NumberToken");
const MiscHelper = require("./../../core/MiscHelper");
const TerrItemToken = require("./TerrItemToken");
const GeoOwnerHelper = require("./GeoOwnerHelper");
const NumberSpellingType = require("./../../NumberSpellingType");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const StreetReferent = require("./../../address/StreetReferent");
const AddressItemType = require("./../../address/internal/AddressItemType");
const Token = require("./../../Token");
const ProcessorService = require("./../../ProcessorService");
const Referent = require("./../../Referent");
const CityItemTokenItemType = require("./CityItemTokenItemType");
const ReferentToken = require("./../../ReferentToken");
const TextToken = require("./../../TextToken");
const BracketHelper = require("./../../core/BracketHelper");
const StreetItemType = require("./../../address/internal/StreetItemType");
const AnalyzerDataWithOntology = require("./../../core/AnalyzerDataWithOntology");
const GeoReferent = require("./../GeoReferent");
const StreetItemToken = require("./../../address/internal/StreetItemToken");
const SourceOfAnalysis = require("./../../SourceOfAnalysis");
const MiscLocationHelper = require("./MiscLocationHelper");
const AddressItemToken = require("./../../address/internal/AddressItemToken");
const CityItemToken = require("./CityItemToken");
const StreetDefineHelper = require("./../../address/internal/StreetDefineHelper");

class CityAttachHelper {
    
    static tryDefine(li, ad, always = false) {
        const OrgItemToken = require("./OrgItemToken");
        if (li === null) 
            return null;
        let oi = null;
        if (li.length > 2 && li[0].typ === CityItemTokenItemType.MISC && li[1].typ === CityItemTokenItemType.NOUN) {
            li[1].doubtful = false;
            li.splice(0, 1);
        }
        let res = null;
        if (res === null && li.length > 1) {
            res = CityAttachHelper.try4(li);
            if (res !== null && res.endChar <= li[1].endChar) 
                res = null;
        }
        if (res === null) {
            let wrapoi1183 = new RefOutArgWrapper();
            res = CityAttachHelper.try1(li, wrapoi1183, ad);
            oi = wrapoi1183.value;
        }
        if (res === null) {
            let wrapoi1184 = new RefOutArgWrapper();
            res = CityAttachHelper._tryNounName(li, wrapoi1184, false);
            oi = wrapoi1184.value;
        }
        if (res === null) {
            let wrapoi1185 = new RefOutArgWrapper();
            res = CityAttachHelper._tryNameExist(li, wrapoi1185, false);
            oi = wrapoi1185.value;
        }
        if (res === null) 
            res = CityAttachHelper.try4(li);
        if (res === null && always) {
            let wrapoi1186 = new RefOutArgWrapper();
            res = CityAttachHelper._tryNounName(li, wrapoi1186, true);
            oi = wrapoi1186.value;
        }
        if (res === null && always) {
            if (OrgItemToken.tryParse(li[0].beginToken, ad) !== null) {
            }
            else {
                let wrapoi1187 = new RefOutArgWrapper();
                res = CityAttachHelper._tryNameExist(li, wrapoi1187, true);
                oi = wrapoi1187.value;
            }
        }
        if ((res === null && li.length === 1 && li[0].typ === CityItemTokenItemType.NOUN) && li[0].geoObjectBefore && (li[0].whitespacesAfterCount < 3)) {
            let rt = Utils.as(li[0].endToken.next, ReferentToken);
            if ((rt !== null && rt.beginToken === rt.endToken && !rt.beginToken.chars.isAllLower) && (rt.beginToken instanceof TextToken)) {
                let nam = CityItemToken.tryParse(rt.beginToken, null, false, null);
                if (nam !== null && nam.endToken === rt.endToken && ((nam.typ === CityItemTokenItemType.PROPERNAME || nam.typ === CityItemTokenItemType.CITY))) {
                    let t = li[0].kit.debedToken(rt);
                    let g = new GeoReferent();
                    g.addTyp(li[0].value);
                    g.addName(nam.value);
                    g.addName(nam.altValue);
                    return new ReferentToken(g, li[0].beginToken, rt.endToken);
                }
            }
        }
        if (res === null) 
            return null;
        if (res !== null && res.morph !== null) {
        }
        if (res.beginToken.previous instanceof TextToken) {
            if (res.beginToken.previous.isValue("ТЕРРИТОРИЯ", null)) {
                res.beginToken = res.beginToken.previous;
                res.morph = res.beginToken.morph;
            }
            if ((BracketHelper.canBeStartOfSequence(res.beginToken.previous, false, false) && BracketHelper.canBeEndOfSequence(res.endToken.next, false, null, false) && res.beginToken.previous.previous !== null) && res.beginToken.previous.previous.isValue("ТЕРРИТОРИЯ", null)) {
                res.beginToken = res.beginToken.previous.previous;
                res.morph = res.beginToken.morph;
                res.endToken = res.endToken.next;
            }
        }
        let city2 = null;
        for (const s of res.referent.slots) {
            if (s.typeName === GeoReferent.ATTR_NAME) {
                let val = Utils.asString(s.value);
                if (val.indexOf(' ') < 0) 
                    continue;
                if (val.indexOf('-') > 0) 
                    continue;
                try {
                    let ar1 = ProcessorService.getEmptyProcessor().process(new SourceOfAnalysis(val), null, null);
                    for (let tt = ar1.firstToken; tt !== null; tt = tt.next) {
                        let cit = CityItemToken.tryParse(tt, null, false, null);
                        if (cit !== null && cit.typ === CityItemTokenItemType.NOUN) {
                            if (cit.value === "СЛОБОДА" || cit.value === "ВЫСЕЛКИ") 
                                continue;
                            if (city2 === null) {
                                city2 = new GeoReferent();
                                for (const ty of res.referent.typs) {
                                    city2.addTyp(ty);
                                }
                            }
                            city2.addTyp(cit.value.toLowerCase());
                            if (tt !== ar1.firstToken) 
                                city2.addSlot(GeoReferent.ATTR_NAME, val.substring(0, 0 + tt.previous.endChar + 1), false, 0);
                            else if (cit.endToken.next !== null) 
                                city2.addSlot(GeoReferent.ATTR_NAME, val.substring(cit.endToken.next.beginChar), false, 0);
                            else 
                                city2 = null;
                        }
                    }
                } catch (ex1188) {
                }
            }
        }
        if (city2 !== null) 
            res.referent = city2;
        return res;
    }
    
    static try1(li, oi, ad) {
        const OrgItemToken = require("./OrgItemToken");
        oi.value = null;
        if (li === null || (li.length < 1)) 
            return null;
        else if (li[0].typ !== CityItemTokenItemType.CITY) {
            if (li.length === 1) 
                return null;
            if (li[0].typ !== CityItemTokenItemType.PROPERNAME || li[1].typ !== CityItemTokenItemType.NOUN) 
                return null;
            if (li.length === 2) {
            }
            else if (((li.length >= 3 || MiscLocationHelper.isUserParamAddress(li[0]))) && li[2].typ === CityItemTokenItemType.PROPERNAME) {
                if (li[2].doubtful) 
                    li.splice(2, li.length - 2);
                else if (AddressItemToken.checkStreetAfter(li[2].beginToken, false)) 
                    li.splice(2, li.length - 2);
                else 
                    return null;
            }
            else 
                return null;
        }
        else if (li.length > 2 && li[1].typ === CityItemTokenItemType.NOUN && ((li[2].typ === CityItemTokenItemType.PROPERNAME || li[2].typ === CityItemTokenItemType.CITY))) {
            if (li[1].value !== "ГОРОД") 
                li.splice(1, 2);
        }
        let i = 1;
        oi.value = li[0].ontoItem;
        let ok = !li[0].doubtful;
        if ((ok && li[0].ontoItem !== null && li[0].ontoItem.miscAttr === null) && ad !== null) {
            if (li[0].ontoItem.owner !== ad.localOntology && !li[0].ontoItem.owner.isExtOntology) {
                if (li[0].beginToken.previous !== null && li[0].beginToken.previous.isValue("В", null)) {
                }
                else 
                    ok = false;
            }
        }
        if (li.length === 1 && li[0].beginToken.morph._class.isAdjective) {
            let sits = StreetItemToken.tryParseList(li[0].beginToken, 3, null);
            if (sits !== null && sits.length === 2 && sits[1].typ === StreetItemType.NOUN) 
                return null;
        }
        let typ = null;
        let alttyp = null;
        let mc = li[0].morph;
        if (i < li.length) {
            if (li[i].typ === CityItemTokenItemType.NOUN) {
                let at = null;
                if (!li[i].chars.isAllLower && (li[i].whitespacesAfterCount < 2)) {
                    if (StreetItemToken.checkKeyword(li[i].endToken.next)) {
                        at = AddressItemToken.tryParse(li[i].beginToken, false, null, null);
                        if (at !== null) {
                            let at2 = AddressItemToken.tryParse(li[i].endToken.next, false, null, null);
                            if (at2 !== null && at2.typ === AddressItemType.STREET) 
                                at = null;
                        }
                    }
                }
                if (at === null) {
                    typ = li[i].value;
                    alttyp = li[i].altValue;
                    if (li[i].beginToken.isValue("СТ", null) && li[i].beginToken.chars.isAllUpper) 
                        return null;
                    if ((i + 1) === li.length) {
                        if (li[i].doubtful) {
                            if (li[0].chars.isLatinLetter) 
                                return null;
                            let rt1 = li[0].kit.processReferent("PERSON", li[0].beginToken, null);
                            if (rt1 !== null && rt1.referent.typeName === "PERSON") 
                                return null;
                        }
                        ok = true;
                        if (!li[i].morph._case.isUndefined) 
                            mc = li[i].morph;
                        i++;
                    }
                    else if (ok) 
                        i++;
                    else {
                        let tt0 = li[0].beginToken.previous;
                        if ((tt0 instanceof TextToken) && (tt0.whitespacesAfterCount < 3)) {
                            if (tt0.isValue("МЭР", "МЕР") || tt0.isValue("ГЛАВА", null) || tt0.isValue("ГРАДОНАЧАЛЬНИК", null)) {
                                ok = true;
                                i++;
                            }
                        }
                    }
                }
            }
        }
        if (!ok && oi.value !== null && (oi.value.canonicText.length < 4)) 
            return null;
        if (!ok && li[0].beginToken.morph._class.isProperName) 
            return null;
        if (!ok) {
            if (!MiscHelper.isExistsInDictionary(li[0].beginToken, li[0].endToken, MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.ooBitor(MorphClass.NOUN, MorphClass.PRONOUN)))) {
                ok = li[0].geoObjectBefore || li[i - 1].geoObjectAfter;
                if (ok && li[0].beginToken === li[0].endToken) {
                    let mcc = li[0].beginToken.getMorphClassInDictionary();
                    if (mcc.isProperName || mcc.isProperSurname) 
                        ok = false;
                    else if (li[0].geoObjectBefore && (li[0].whitespacesAfterCount < 2)) {
                        let ad1 = AddressItemToken.tryParse(li[0].beginToken, false, null, null);
                        if (ad1 !== null && ad1.typ === AddressItemType.STREET) {
                            let ad2 = AddressItemToken.tryParse(li[0].endToken.next, false, null, null);
                            if (ad2 === null || ad2.typ !== AddressItemType.STREET) 
                                ok = false;
                        }
                        else if (OrgItemToken.tryParse(li[0].beginToken, null) !== null) 
                            ok = false;
                    }
                }
            }
            if (ok) {
                if (li[0].kit.processReferent("PERSON", li[0].beginToken, null) !== null) 
                    ok = false;
            }
        }
        if (!ok) 
            ok = CityAttachHelper.checkYearAfter(li[0].endToken.next);
        if (!ok && ((!li[0].beginToken.morph._class.isAdjective || li[0].beginToken !== li[0].endToken))) 
            ok = CityAttachHelper.checkCityAfter(li[0].endToken.next);
        if (!ok) 
            return null;
        if (i < li.length) 
            li.splice(i, li.length - i);
        let rt = null;
        if (oi.value === null) {
            if (li[0].value !== null && li[0].higherGeo !== null) {
                let cap = new GeoReferent();
                cap.addName(li[0].value);
                cap.addTypCity(li[0].kit.baseLanguage, li[0].typ === CityItemTokenItemType.CITY);
                cap.addMisc(li[0].misc);
                cap.addMisc(li[0].misc2);
                cap.higher = li[0].higherGeo;
                if (typ !== null) 
                    cap.addTyp(typ);
                if (alttyp !== null) 
                    cap.addTyp(alttyp);
                rt = new ReferentToken(cap, li[0].beginToken, li[0].endToken);
            }
            else {
                if (li[0].value === null) 
                    return null;
                if (typ === null) {
                    if ((li.length === 1 && li[0].beginToken.previous !== null && li[0].beginToken.previous.isHiphen) && (li[0].beginToken.previous.previous instanceof ReferentToken) && (li[0].beginToken.previous.previous.getReferent() instanceof GeoReferent)) {
                    }
                    else 
                        return null;
                }
                else {
                    if (!LanguageHelper.endsWithEx(typ, "ПУНКТ", "ПОСЕЛЕНИЕ", "ПОСЕЛЕННЯ", "ПОСЕЛОК")) {
                        if (!LanguageHelper.endsWith(typ, "CITY")) {
                            if (typ === "СТАНЦИЯ" && (MiscLocationHelper.checkGeoObjectBefore(li[0].beginToken, false))) {
                            }
                            else if (li.length > 1 && li[1].typ === CityItemTokenItemType.NOUN && li[0].typ === CityItemTokenItemType.CITY) {
                            }
                            else if (li.length === 2 && li[1].typ === CityItemTokenItemType.NOUN && li[0].typ === CityItemTokenItemType.PROPERNAME) {
                                if (li[0].geoObjectBefore || li[1].geoObjectAfter) {
                                }
                                else if ((li[0].beginToken.previous !== null && li[0].beginToken.previous.isChar('(') && li[1].endToken.next !== null) && li[1].endToken.next.isChar(')')) {
                                }
                                else if (MiscLocationHelper.isUserParamAddress(li[0]) && ((li[1].beginToken.isValue(li[1].value, null) || li[0].isNewlineBefore))) {
                                }
                                else 
                                    return null;
                            }
                            else 
                                return null;
                        }
                    }
                    if ((li.length > 1 && li[0].beginToken.morph._class.isAdjective && !li[0].beginToken.morph.containsAttr("к.ф.", null)) && li[1].morph.gender !== MorphGender.UNDEFINED) 
                        li[0].value = ProperNameHelper.getNameEx(li[0].beginToken, li[0].endToken, MorphClass.ADJECTIVE, li[1].morph._case, li[1].morph.gender, false, false);
                }
            }
        }
        else if (oi.value.referent instanceof GeoReferent) {
            let city = Utils.as(oi.value.referent.clone(), GeoReferent);
            city.occurrence.splice(0, city.occurrence.length);
            rt = ReferentToken._new1092(city, li[0].beginToken, li[li.length - 1].endToken, mc);
        }
        else if (typ === null) 
            typ = oi.value.typ;
        if (rt === null) {
            if (li.length === 1 && li[0].typ === CityItemTokenItemType.CITY && OrgItemToken.tryParse(li[0].beginToken, null) !== null) 
                return null;
            let city = new GeoReferent();
            city.addName((oi.value === null ? li[0].value : oi.value.canonicText));
            city.addMisc(li[0].misc);
            city.addMisc(li[0].misc2);
            if (typ !== null) 
                city.addTyp(typ);
            else 
                city.addTypCity(li[0].kit.baseLanguage, oi.value !== null);
            if (alttyp !== null) 
                city.addTyp(alttyp);
            rt = ReferentToken._new1092(city, li[0].beginToken, li[li.length - 1].endToken, mc);
        }
        if ((rt.referent instanceof GeoReferent) && li.length === 1 && rt.referent.isCity) {
            if (rt.beginToken.previous !== null && rt.beginToken.previous.isValue("Г", null)) 
                rt.beginToken = rt.beginToken.previous;
            else if ((rt.beginToken.previous !== null && rt.beginToken.previous.isChar('.') && rt.beginToken.previous.previous !== null) && rt.beginToken.previous.previous.isValue("Г", null)) 
                rt.beginToken = rt.beginToken.previous.previous;
            else if (rt.endToken.next !== null && (rt.whitespacesAfterCount < 2) && rt.endToken.next.isValue("Г", null)) {
                rt.endToken = rt.endToken.next;
                if (rt.endToken.next !== null && rt.endToken.next.isChar('.')) 
                    rt.endToken = rt.endToken.next;
            }
        }
        return rt;
    }
    
    static _tryNounName(li, oi, always) {
        const OrgItemToken = require("./OrgItemToken");
        oi.value = null;
        if (li === null || (li.length < 2) || ((li[0].typ !== CityItemTokenItemType.NOUN && li[0].typ !== CityItemTokenItemType.MISC))) 
            return null;
        let ok = !li[0].doubtful;
        if (ok && li[0].typ === CityItemTokenItemType.MISC) 
            ok = false;
        let typ = (li[0].typ === CityItemTokenItemType.MISC ? null : li[0].value);
        let typ2 = (li[0].typ === CityItemTokenItemType.MISC ? null : li[0].altValue);
        let probAdj = null;
        let i1 = 1;
        if ((typ !== null && li[i1].typ === CityItemTokenItemType.NOUN && ((i1 + 1) < li.length)) && li[0].whitespacesAfterCount <= 1 && (((LanguageHelper.endsWith(typ, "ПОСЕЛОК") || LanguageHelper.endsWith(typ, "СЕЛИЩЕ") || typ === "ДЕРЕВНЯ") || typ === "СЕЛО"))) {
            if (li[i1].beginToken === li[i1].endToken) {
                let ooo = OrgItemToken.tryParse(li[i1].beginToken, null);
                if (ooo !== null) 
                    return null;
            }
            typ2 = li[i1].value;
            if (typ2 === "СТАНЦИЯ" && li[i1].beginToken.isValue("СТ", null) && ((i1 + 1) < li.length)) {
                let m = li[i1 + 1].morph;
                if (m.number === MorphNumber.PLURAL) 
                    probAdj = "СТАРЫЕ";
                else if (m.gender === MorphGender.FEMINIE) 
                    probAdj = "СТАРАЯ";
                else if (m.gender === MorphGender.MASCULINE) 
                    probAdj = "СТАРЫЙ";
                else 
                    probAdj = "СТАРОЕ";
            }
            i1++;
        }
        let name = (li[i1].value != null ? li[i1].value : ((li[i1].ontoItem === null ? null : li[i1].ontoItem.canonicText)));
        if (li[i1].ontoItem !== null && MiscLocationHelper.isUserParamAddress(li[i1]) && li[i1].beginToken === li[i1].endToken) {
            if (li[i1].beginToken.isValue(li[i1].ontoItem.canonicText, null)) 
                name = MiscHelper.getTextValueOfMetaToken(li[i1], GetTextAttr.NO);
        }
        let altName = li[i1].altValue;
        if (name === null) 
            return null;
        let mc = li[0].morph;
        if (i1 === 1 && li[i1].typ === CityItemTokenItemType.CITY && ((((li[0].value === "ГОРОД" && ((li[i1].ontoItem === null || li[i1].ontoItem.referent === null || li[i1].ontoItem.referent.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null)))) || li[0].value === "МІСТО" || li[0].typ === CityItemTokenItemType.MISC))) {
            if (typ === null && ((i1 + 1) < li.length) && li[i1 + 1].typ === CityItemTokenItemType.NOUN) 
                return null;
            oi.value = li[i1].ontoItem;
            if (oi.value !== null && !MiscLocationHelper.isUserParamAddress(li[i1])) 
                name = oi.value.canonicText;
            if (name.length > 2 || oi.value.miscAttr !== null) {
                if (!li[1].doubtful || ((oi.value !== null && oi.value.miscAttr !== null))) 
                    ok = true;
                else if (!ok && !li[1].isNewlineBefore) {
                    if (li[0].geoObjectBefore || li[1].geoObjectAfter) 
                        ok = true;
                    else if (StreetDefineHelper.checkStreetAfter(li[1].endToken.next)) 
                        ok = true;
                    else if (li[1].endToken.next !== null && (li[1].endToken.next.getReferent() instanceof DateReferent)) 
                        ok = true;
                    else if ((li[1].whitespacesBeforeCount < 2) && li[1].ontoItem !== null) {
                        if (li[1].isNewlineAfter) 
                            ok = true;
                        else 
                            ok = true;
                    }
                }
                if (li[1].doubtful && li[1].endToken.next !== null && li[1].endToken.chars.equals(li[1].endToken.next.chars)) 
                    ok = false;
                if (li[0].beginToken.previous !== null && li[0].beginToken.previous.isValue("В", null)) 
                    ok = true;
            }
            if (!ok) 
                ok = CityAttachHelper.checkYearAfter(li[1].endToken.next);
            if (!ok) 
                ok = CityAttachHelper.checkCityAfter(li[1].endToken.next);
            if (!ok && MiscLocationHelper.isUserParamAddress(li[0])) 
                ok = true;
        }
        else if (li[i1].typ === CityItemTokenItemType.PROPERNAME || li[i1].typ === CityItemTokenItemType.CITY || li[i1].canBeName) {
            if (((li[0].value === "АДМИНИСТРАЦИЯ" || li[0].value === "АДМІНІСТРАЦІЯ")) && i1 === 1) 
                return null;
            if (li[i1].value === "ВЛАДИМИР" && li[i1].endToken.next !== null && li[i1].endToken.next.isValue("ЛЕНИН", null)) 
                return null;
            if (li[i1].isNewlineBefore) {
                if (li.length !== 2) 
                    return null;
            }
            if (!li[0].doubtful) {
                ok = true;
                if (name.length < 2) 
                    ok = false;
                else if ((name.length < 3) && li[0].morph.number !== MorphNumber.SINGULAR) 
                    ok = false;
                if (li[i1].doubtful && !li[i1].geoObjectAfter && !li[0].geoObjectBefore) {
                    if (li[i1].morph._case.isGenitive) {
                        if (li[i1].endToken.next === null || MiscLocationHelper.checkGeoObjectAfter(li[i1].endToken.next, false, false) || AddressItemToken.checkHouseAfter(li[i1].endToken.next, false, true)) {
                        }
                        else if (li[0].beginToken.previous === null || MiscLocationHelper.checkGeoObjectBefore(li[0].beginToken, false)) {
                        }
                        else 
                            ok = false;
                    }
                    if (ok) {
                        let rt0 = li[i1].kit.processReferent("PERSONPROPERTY", li[0].beginToken.previous, null);
                        if (rt0 !== null) {
                            let rt1 = li[i1].kit.processReferent("PERSON", li[i1].beginToken, null);
                            if (rt1 !== null) 
                                ok = false;
                        }
                    }
                }
                let npt = MiscLocationHelper.tryParseNpt(li[i1].beginToken);
                if (npt !== null && npt.endToken.isValue("КИЛОМЕТР", null)) 
                    npt = null;
                if (npt !== null) {
                    if (npt.endToken.endChar > li[i1].endChar && npt.adjectives.length > 0 && !npt.adjectives[0].endToken.next.isComma) {
                        ok = false;
                        let li2 = Array.from(li);
                        li2.splice(0, i1 + 1);
                        if (li2.length > 1) {
                            let oi2 = null;
                            let wrapoi21191 = new RefOutArgWrapper();
                            let inoutres1192 = CityAttachHelper._tryNounName(li2, wrapoi21191, false);
                            oi2 = wrapoi21191.value;
                            if (inoutres1192 !== null) 
                                ok = true;
                            else if (li2.length === 2 && li2[0].typ === CityItemTokenItemType.NOUN && ((li2[1].typ === CityItemTokenItemType.PROPERNAME || li2[1].typ === CityItemTokenItemType.CITY))) 
                                ok = true;
                        }
                        if (!ok) {
                            if (OrgItemToken.tryParse(li[i1].endToken.next, null) !== null) 
                                ok = true;
                            else if (li2.length === 1 && li2[0].typ === CityItemTokenItemType.NOUN && OrgItemToken.tryParse(li2[0].endToken.next, null) !== null) 
                                ok = true;
                        }
                    }
                    if (ok && TerrItemToken.m_UnknownRegions.tryParse(npt.endToken, TerminParseAttr.FULLWORDSONLY) !== null) {
                        let ok1 = false;
                        if (li[0].beginToken.previous !== null) {
                            let ttt = li[0].beginToken.previous;
                            if (ttt.isComma && ttt.previous !== null) 
                                ttt = ttt.previous;
                            let _geo = Utils.as(ttt.getReferent(), GeoReferent);
                            if (_geo !== null && !_geo.isCity) 
                                ok1 = true;
                        }
                        if (npt.endToken.next !== null) {
                            let ttt = npt.endToken.next;
                            if (ttt.isComma && ttt.next !== null) 
                                ttt = ttt.next;
                            let _geo = Utils.as(ttt.getReferent(), GeoReferent);
                            if (_geo !== null && !_geo.isCity) 
                                ok1 = true;
                            else if (AddressItemToken.checkHouseAfter(ttt, false, false)) 
                                ok1 = true;
                            else if (CityAttachHelper.checkStreetAfter(ttt)) 
                                ok1 = true;
                        }
                        else 
                            ok1 = true;
                        if (!ok1) 
                            return null;
                    }
                }
                if (li[0].value === "ПОРТ") {
                    if (li[i1].chars.isAllUpper || li[i1].chars.isLatinLetter) 
                        return null;
                }
            }
            else if (li[0].geoObjectBefore) 
                ok = true;
            else if (li[i1].geoObjectAfter && !li[i1].isNewlineAfter) 
                ok = true;
            else 
                ok = CityAttachHelper.checkYearAfter(li[i1].endToken.next);
            if (!ok) 
                ok = CityAttachHelper.checkStreetAfter(li[i1].endToken.next);
            if (!ok && li[0].beginToken.previous !== null && li[0].beginToken.previous.isValue("В", null)) 
                ok = true;
            if ((!ok && li.length === 2 && li[1].typ === CityItemTokenItemType.CITY) && li[0].beginToken !== li[0].endToken) 
                ok = true;
        }
        else 
            return null;
        if (!ok && !always) {
            if (li.length === 3 && li[2].typ === CityItemTokenItemType.NOUN) {
            }
            else if (MiscLocationHelper.isUserParamAddress(li[0])) {
            }
            else if (MiscLocationHelper.checkNearBefore(li[0].beginToken, null) === null) 
                return null;
        }
        let city = new GeoReferent();
        if (oi.value !== null && oi.value.referent !== null) {
            city = Utils.as(oi.value.referent.clone(), GeoReferent);
            city.occurrence.splice(0, city.occurrence.length);
        }
        if (li.length > (i1 + 1)) {
            if (li.length === (i1 + 2) && li[i1 + 1].typ === CityItemTokenItemType.NOUN) 
                typ2 = li[i1 + 1].value;
            else 
                li.splice(i1 + 1, li.length - i1 - 1);
        }
        if (!li[0].morph._case.isUndefined && li[0].morph.gender !== MorphGender.UNDEFINED) {
            if (li[i1].endToken.morph._class.isAdjective && li[i1].beginToken === li[i1].endToken && li[i1].ontoItem === null) {
                let nam = ProperNameHelper.getNameEx(li[i1].beginToken, li[i1].endToken, MorphClass.ADJECTIVE, li[0].morph._case, li[0].morph.gender, false, false);
                if (nam !== null && nam !== name) {
                    if (name.endsWith("ГО") || name.endsWith("ОЙ")) 
                        altName = nam;
                    else {
                        if (li[i1].endToken.getMorphClassInDictionary().isUndefined) 
                            altName = name;
                        name = nam;
                    }
                }
            }
        }
        if (typ === "НАСЕЛЕННЫЙ ПУНКТ" && name.endsWith("КМ")) {
            let ait = AddressItemToken.tryParse(li[1].beginToken, false, null, null);
            if (ait !== null && ait.typ === AddressItemType.STREET) {
                let ss = Utils.as(ait.referent, StreetReferent);
                ss.addSlot(StreetReferent.ATTR_NUMBER, null, true, 0);
                name = (name + " " + ss.toString().toUpperCase());
                li[1].endToken = ait.endToken;
            }
        }
        if (li[0].morph._case.isNominative && li[0].typ !== CityItemTokenItemType.MISC) {
            if (altName !== null) 
                city.addName(altName);
            altName = null;
        }
        city.addName(name);
        if (probAdj !== null) 
            city.addName(probAdj + " " + name);
        if (altName !== null) {
            city.addName(altName);
            if (probAdj !== null) 
                city.addName(probAdj + " " + altName);
        }
        if (typ !== null) {
            if ((typ === "ДЕРЕВНЯ" && !MiscLocationHelper.checkGeoObjectBefore(li[0].beginToken, false) && li[0].beginToken.isValue("Д", null)) && li[1].ontoItem !== null) 
                typ = "ГОРОД";
            city.addTyp(typ);
        }
        else if (!city.isCity) 
            city.addTypCity(li[0].kit.baseLanguage, true);
        if (typ2 !== null) 
            city.addTyp(typ2.toLowerCase());
        if (li[0].higherGeo !== null && GeoOwnerHelper.canBeHigher(li[0].higherGeo, city, null, null)) 
            city.higher = li[0].higherGeo;
        if (li[0].typ === CityItemTokenItemType.MISC) 
            li.splice(0, 1);
        if (i1 < li.length) {
            city.addMisc(li[i1].misc);
            city.addMisc(li[i1].misc2);
        }
        let res = ReferentToken._new1092(city, li[0].beginToken, li[li.length - 1].endToken, mc);
        let num = null;
        if (res.endToken.next !== null && res.endToken.next.isHiphen && (res.endToken.next.next instanceof NumberToken)) 
            num = Utils.as(res.endToken.next.next, NumberToken);
        else if ((res.endToken.next instanceof NumberToken) && (res.whitespacesAfterCount < 3)) {
            if (AddressItemToken.checkStreetAfter(res.endToken.next, false)) {
            }
            else {
                let tt1 = res.endToken.next.next;
                let ok1 = false;
                if (tt1 === null || tt1.isNewlineBefore) 
                    ok1 = true;
                else if (AddressItemToken.checkStreetAfter(tt1, false)) 
                    ok1 = true;
                if (ok1) 
                    num = Utils.as(res.endToken.next, NumberToken);
            }
        }
        if ((num !== null && num.typ === NumberSpellingType.DIGIT && !num.morph._class.isAdjective) && num.intValue !== null && (num.intValue < 100)) {
            for (const s of city.slots) {
                if (s.typeName === GeoReferent.ATTR_NAME) 
                    city.uploadSlot(s, (String(s.value) + "-" + num.value));
            }
            res.endToken = num;
        }
        if (li[0].beginToken === li[0].endToken && li[0].beginToken.isValue("ГОРОДОК", null)) {
            if (AddressItemToken.checkHouseAfter(res.endToken.next, true, false)) 
                return null;
        }
        if (li[0].typ === CityItemTokenItemType.NOUN && li[0].lengthChar === 1 && !(li[1].beginToken instanceof TextToken)) 
            return null;
        return res;
    }
    
    static _tryNameExist(li, oi, always) {
        const OrgItemToken = require("./OrgItemToken");
        oi.value = null;
        if (li === null || li.length === 0) 
            return null;
        if (li[0].typ === CityItemTokenItemType.CITY) {
        }
        else if (li[0].typ === CityItemTokenItemType.PROPERNAME && li.length === 1 && ((MiscLocationHelper.isUserParamAddress(li[0]) || li[0].misc !== null))) {
            let ttt = li[0].beginToken.previous;
            while (ttt !== null && ttt.isComma) {
                ttt = ttt.previous;
            }
            if (!(ttt instanceof ReferentToken)) 
                return null;
            let _geo = Utils.as(ttt.getReferent(), GeoReferent);
            if (_geo === null) 
                return null;
            if (!_geo.isRegion && !_geo.isState) {
                if (!_geo.isCity || li[0].value === null) 
                    return null;
                if (_geo.findSlot("NAME", li[0].value, true) === null) 
                    return null;
                if (_geo.findSlot("TYPE", "город", true) !== null) 
                    return null;
                if (li.length !== 1) 
                    return null;
                if (AddressItemToken.checkStreetAfter(li[0].beginToken, false)) 
                    return null;
                let ngeo = new GeoReferent();
                ngeo.addName(li[0].value);
                ngeo.addMisc(li[0].misc);
                ngeo.addTyp("населенный пункт");
                return new ReferentToken(ngeo, li[0].beginToken, li[0].endToken);
            }
            else {
                let ait = AddressItemToken.tryParsePureItem(li[0].beginToken, null, null);
                if (ait !== null && ait.endChar > li[0].endChar) 
                    return null;
                if (AddressItemToken.checkStreetAfter(li[0].beginToken, false)) 
                    return null;
            }
        }
        else 
            return null;
        if (li.length === 1 && (li[0].whitespacesAfterCount < 3)) {
            let tt1 = MiscLocationHelper.checkTerritory(li[0].endToken.next);
            if (tt1 !== null) {
                if (tt1.isNewlineAfter || tt1.next === null || tt1.next.isComma) 
                    return null;
                if (AddressItemToken.checkHouseAfter(tt1.next, false, false)) 
                    return null;
                if (AddressItemToken.checkStreetAfter(tt1.next, false)) 
                    return null;
            }
        }
        oi.value = li[0].ontoItem;
        let tt = Utils.as(li[0].beginToken, TextToken);
        if (tt === null) 
            return null;
        let ok = false;
        let nam = (oi.value === null ? li[0].value : oi.value.canonicText);
        if (nam === null) 
            return null;
        if (nam === "РИМ") {
            if (tt.term === "РИМ") {
                if ((tt.next instanceof TextToken) && tt.next.getMorphClassInDictionary().isProperSecname) {
                }
                else 
                    ok = true;
            }
            else if (tt.previous !== null && tt.previous.isValue("В", null) && tt.term === "РИМЕ") 
                ok = true;
            else if (MiscLocationHelper.checkGeoObjectBefore(tt, false)) 
                ok = true;
        }
        else if (oi.value !== null && oi.value.referent !== null && oi.value.owner.isExtOntology) 
            ok = true;
        else if (LanguageHelper.endsWithEx(nam, "ГРАД", "СК", "TOWN", null) || nam.startsWith("SAN")) 
            ok = true;
        else if (li[0].chars.isLatinLetter && li[0].beginToken.previous !== null && ((li[0].beginToken.previous.isValue("IN", null) || li[0].beginToken.previous.isValue("FROM", null)))) 
            ok = true;
        else {
            for (let tt2 = li[0].endToken.next; tt2 !== null; tt2 = tt2.next) {
                if (tt2.isNewlineBefore) 
                    break;
                if ((tt2.isCharOf(",(") || tt2.morph._class.isPreposition || tt2.morph._class.isConjunction) || tt2.morph._class.isMisc) 
                    continue;
                if ((tt2.getReferent() instanceof GeoReferent) && tt2.chars.isCyrillicLetter === li[0].chars.isCyrillicLetter) 
                    ok = true;
                break;
            }
            let ok2 = false;
            if (!ok) {
                for (let tt2 = li[0].beginToken.previous; tt2 !== null; tt2 = tt2.previous) {
                    if (tt2.isNewlineAfter) 
                        break;
                    if ((tt2.isCharOf(",)") || tt2.morph._class.isPreposition || tt2.morph._class.isConjunction) || tt2.morph._class.isMisc) 
                        continue;
                    if ((tt2.getReferent() instanceof GeoReferent) && tt2.chars.isCyrillicLetter === li[0].chars.isCyrillicLetter) 
                        ok = (ok2 = true);
                    if (ok) {
                        let sits = StreetItemToken.tryParseList(li[0].beginToken, 10, null);
                        if (sits !== null && sits.length > 1) {
                            let ss = StreetDefineHelper.tryParseStreet(sits, false, false, false, null);
                            if (ss !== null) {
                                if ((sits.length === 3 && sits[0].typ === StreetItemType.NAME && sits[1].typ === StreetItemType.NUMBER) && sits[2].typ === StreetItemType.NOUN) 
                                    ok = false;
                                else {
                                    sits.splice(0, 1);
                                    if (StreetDefineHelper.tryParseStreet(sits, false, false, false, null) === null) 
                                        ok = false;
                                }
                            }
                        }
                    }
                    if (ok) {
                        if (li.length > 1 && li[1].typ === CityItemTokenItemType.PROPERNAME && (li[1].whitespacesBeforeCount < 3)) 
                            ok = false;
                        else if (!ok2) {
                            let mc = li[0].beginToken.getMorphClassInDictionary();
                            if (mc.isProperName || mc.isProperSurname || mc.isAdjective) 
                                ok = false;
                            else {
                                let npt = MiscLocationHelper.tryParseNpt(li[0].beginToken);
                                if (npt !== null && npt.endChar > li[0].endChar) 
                                    ok = false;
                            }
                        }
                    }
                    if (OrgItemToken.tryParse(li[0].beginToken, null) !== null) {
                        ok = false;
                        break;
                    }
                    if (li[0].doubtful && !MiscLocationHelper.isUserParamAddress(li[0])) {
                        let rt1 = li[0].kit.processReferent("PERSON", li[0].beginToken, null);
                        if (rt1 !== null) 
                            return null;
                    }
                    break;
                }
            }
        }
        if (always) {
            if (li[0].whitespacesBeforeCount > 3 && li[0].doubtful && li[0].beginToken.getMorphClassInDictionary().isProperSurname) {
                let pp = li[0].kit.processReferent("PERSON", li[0].beginToken, null);
                if (pp !== null) 
                    always = false;
            }
        }
        if (li[0].beginToken.chars.isLatinLetter && li[0].beginToken === li[0].endToken) {
            let tt1 = li[0].endToken.next;
            if (tt1 !== null && tt1.isChar(',')) 
                tt1 = tt1.next;
            if (((tt1 instanceof TextToken) && tt1.chars.isLatinLetter && (tt1.lengthChar < 3)) && !tt1.chars.isAllLower) 
                ok = false;
        }
        if (!ok && !always) {
            if (oi.value !== null && MiscLocationHelper.isUserParamAddress(li[0])) {
                if (!li[0].isNewlineBefore) {
                    let t0 = li[0].beginToken.previous;
                    if (t0 !== null && t0.isHiphen) 
                        t0 = t0.previous;
                    if (t0 instanceof NumberToken) 
                        return null;
                    if (StreetItemToken.checkKeyword(t0)) 
                        return null;
                }
            }
            else 
                return null;
        }
        let city = null;
        if (oi.value !== null && (oi.value.referent instanceof GeoReferent) && !oi.value.owner.isExtOntology) {
            city = Utils.as(oi.value.referent.clone(), GeoReferent);
            city.occurrence.splice(0, city.occurrence.length);
        }
        else {
            city = new GeoReferent();
            city.addName(nam);
            if (li[0].altValue !== null) 
                city.addName(li[0].altValue);
            if (oi.value !== null && (oi.value.referent instanceof GeoReferent)) 
                city.mergeSlots2(Utils.as(oi.value.referent, GeoReferent), li[0].kit.baseLanguage);
            if (!city.isCity) 
                city.addTypCity(li[0].kit.baseLanguage, li[0].typ === CityItemTokenItemType.CITY);
        }
        city.addMisc(li[0].misc);
        city.addMisc(li[0].misc2);
        return ReferentToken._new1092(city, li[0].beginToken, li[0].endToken, li[0].morph);
    }
    
    static try4(li) {
        const OrgItemToken = require("./OrgItemToken");
        if ((li.length === 1 && li[0].typ === CityItemTokenItemType.NOUN && li[0].value.includes("ПОСЕЛЕНИЕ")) && (li[0].endToken.next instanceof ReferentToken)) {
            let _geo = Utils.as(li[0].endToken.next.getReferent(), GeoReferent);
            if (_geo !== null && _geo.typs.includes("волость")) {
                let city = new GeoReferent();
                let nam = _geo.getStringValue(GeoReferent.ATTR_NAME);
                city.addName(nam + " ВОЛОСТЬ");
                city.addName(nam);
                city.addTyp(li[0].value.toLowerCase());
                return new ReferentToken(city, li[0].beginToken, li[0].endToken.next);
            }
        }
        if ((li.length > 0 && li[0].typ === CityItemTokenItemType.NOUN && li[0].value !== "ГОРОД") && li[0].value !== "МІСТО" && li[0].value !== "CITY") {
            let ok = false;
            if (MiscLocationHelper.isUserParamAddress(li[0])) 
                ok = true;
            else if (!li[0].doubtful || li[0].geoObjectBefore || li[0].lengthChar > 2) 
                ok = true;
            if (ok) {
                if (li.length > 1 && li[1].orgRef !== null && (li[1].whitespacesBeforeCount < 3)) {
                    let _geo = new GeoReferent();
                    _geo.addTyp(li[0].value);
                    _geo.addMisc(li[0].misc);
                    _geo.addMisc(li[0].misc2);
                    _geo.addOrgReferent(li[1].orgRef.referent);
                    _geo.addExtReferent(li[1].orgRef);
                    return new ReferentToken(_geo, li[0].beginToken, li[1].endToken);
                }
                else if (li[0].whitespacesAfterCount < 3) {
                    let org = OrgItemToken.tryParse(li[0].endToken.next, null);
                    if (org !== null) {
                        if (li.length > 1 && OrgItemToken.tryParse(li[1].endToken.next, null) !== null) {
                        }
                        else {
                            let _geo = new GeoReferent();
                            _geo.addTyp(li[0].value);
                            _geo.addOrgReferent(org.referent);
                            _geo.addExtReferent(org);
                            return new ReferentToken(_geo, li[0].beginToken, org.endToken);
                        }
                    }
                }
            }
        }
        if (li.length === 1 && li[0].typ === CityItemTokenItemType.NOUN && (li[0].whitespacesAfterCount < 3)) {
            let _geo = li[0].endToken.next.getReferent();
            if (_geo !== null && _geo.findSlot(GeoReferent.ATTR_TYPE, "волость", true) !== null && li[0].value.includes("ПОСЕЛЕНИЕ")) {
                let city = new GeoReferent();
                city.addTyp(li[0].value.toLowerCase());
                for (const n of _geo.getStringValues(GeoReferent.ATTR_NAME)) {
                    city.addSlot(GeoReferent.ATTR_NAME, n, false, 0);
                }
                city.addSlot(GeoReferent.ATTR_MISC, "волость", false, 0);
                return new ReferentToken(city, li[0].beginToken, li[0].endToken.next);
            }
        }
        if ((li.length >= 2 && li[0].geoObjectBefore && li[0].typ === CityItemTokenItemType.PROPERNAME) && li[1].typ === CityItemTokenItemType.PROPERNAME && MiscLocationHelper.isUserParamAddress(li[0])) {
            let tt = li[0].beginToken.previous;
            if (tt !== null && tt.isComma) 
                tt = tt.previous;
            if (tt !== null && (tt.getReferent() instanceof GeoReferent) && !tt.getReferent().isCity) {
                if (li[0].beginToken instanceof NumberToken) 
                    return null;
                let aa = AddressItemToken.tryParse(li[1].beginToken, false, null, null);
                if (aa !== null) {
                    let city = new GeoReferent();
                    city.addTyp("населенный пункт");
                    city.addName(li[0].value);
                    if (li[0].altValue !== null) 
                        city.addName(li[0].altValue);
                    return new ReferentToken(city, li[0].beginToken, li[0].endToken);
                }
            }
        }
        return null;
    }
    
    static checkYearAfter(tt) {
        if (tt !== null && ((tt.isComma || tt.isHiphen))) 
            tt = tt.next;
        if (tt !== null && tt.isNewlineAfter) {
            if ((tt instanceof NumberToken) && tt.intValue !== null) {
                let year = tt.intValue;
                if (year > 1990 && (year < 2100)) 
                    return true;
            }
            else if (tt.getReferent() !== null && tt.getReferent().typeName === "DATE") 
                return true;
        }
        return false;
    }
    
    static checkStreetAfter(tt) {
        if (tt !== null && ((tt.isCommaAnd || tt.isHiphen || tt.morph._class.isPreposition))) 
            tt = tt.next;
        if (tt === null) 
            return false;
        let ait = AddressItemToken.tryParse(tt, false, null, null);
        if (ait !== null && ait.typ === AddressItemType.STREET) 
            return true;
        return false;
    }
    
    static checkCityAfter(tt) {
        while (tt !== null && (((tt.isCommaAnd || tt.isHiphen || tt.morph._class.isPreposition) || tt.isChar('.')))) {
            tt = tt.next;
        }
        if (tt === null) 
            return false;
        let cits = CityItemToken.tryParseList(tt, 5, null);
        if (cits === null || cits.length === 0) {
            if (tt.lengthChar === 1 && tt.chars.isAllLower && ((tt.isValue("Д", null) || tt.isValue("П", null)))) {
                let tt1 = tt.next;
                if (tt1 !== null && tt1.isChar('.')) 
                    tt1 = tt1.next;
                let ci = CityItemToken.tryParse(tt1, null, false, null);
                if (ci !== null && ((ci.typ === CityItemTokenItemType.PROPERNAME || ci.typ === CityItemTokenItemType.CITY))) 
                    return true;
            }
            return false;
        }
        if (CityAttachHelper.tryDefine(cits, null, false) !== null) 
            return true;
        if (cits[0].typ === CityItemTokenItemType.NOUN) {
            if (tt.previous !== null && tt.previous.isComma) 
                return true;
            if (cits.length > 1 && ((cits[1].typ === CityItemTokenItemType.CITY || cits[1].typ === CityItemTokenItemType.PROPERNAME))) 
                return true;
        }
        return false;
    }
}


module.exports = CityAttachHelper