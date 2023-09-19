/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const Token = require("./../../Token");
const MetaToken = require("./../../MetaToken");
const MorphGender = require("./../../../morph/MorphGender");
const MorphCase = require("./../../../morph/MorphCase");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MorphClass = require("./../../../morph/MorphClass");
const MorphNumber = require("./../../../morph/MorphNumber");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const MorphCollection = require("./../../MorphCollection");
const NounPhraseParseAttr = require("./../../core/NounPhraseParseAttr");
const TextToken = require("./../../TextToken");
const BracketHelper = require("./../../core/BracketHelper");
const ProperNameHelper = require("./../../core/ProperNameHelper");
const MiscHelper = require("./../../core/MiscHelper");
const AddressItemType = require("./../../address/internal/AddressItemType");
const ReferentToken = require("./../../ReferentToken");
const Referent = require("./../../Referent");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const GeoReferent = require("./../GeoReferent");
const StreetItemType = require("./../../address/internal/StreetItemType");
const CityItemTokenItemType = require("./CityItemTokenItemType");
const GetTextAttr = require("./../../core/GetTextAttr");
const NumberToken = require("./../../NumberToken");
const MiscLocationHelper = require("./MiscLocationHelper");
const StreetItemToken = require("./../../address/internal/StreetItemToken");
const TerrItemToken = require("./TerrItemToken");
const AddressItemToken = require("./../../address/internal/AddressItemToken");
const CityItemToken = require("./CityItemToken");
const CityAttachHelper = require("./CityAttachHelper");
const OrgItemToken = require("./OrgItemToken");
const NounPhraseHelper = require("./../../core/NounPhraseHelper");

class TerrDefineHelper {
    
    static _tryAttachMoscowAO(li, ad) {
        if (li[0].terminItem === null || !li[0].terminItem.isMoscowRegion) 
            return null;
        if (li[0].isDoubt) {
            let ok = false;
            if (CityAttachHelper.checkCityAfter(li[0].endToken.next)) 
                ok = true;
            else {
                let ali = AddressItemToken.tryParseList(li[0].endToken.next, 2);
                if (ali !== null && ali.length > 0 && ali[0].typ === AddressItemType.STREET) 
                    ok = true;
            }
            if (!ok) 
                return null;
        }
        let reg = new GeoReferent();
        let typ = "АДМИНИСТРАТИВНЫЙ ОКРУГ";
        reg.addTyp(typ);
        let name = li[0].terminItem.canonicText;
        if (LanguageHelper.endsWith(name, typ)) 
            name = name.substring(0, 0 + name.length - typ.length - 1).trim();
        reg.addName(name);
        return new ReferentToken(reg, li[0].beginToken, li[0].endToken);
    }
    
    static tryDefine(li, ad, attachAlways = false, cits = null, exists = null) {
        if (li === null || li.length === 0) 
            return null;
        let exObj = null;
        let newName = null;
        let adjList = new Array();
        let noun = null;
        let addNoun = null;
        let number = null;
        let rt = TerrDefineHelper._tryAttachMoscowAO(li, ad);
        if (rt !== null) 
            return rt;
        let canBeCityBefore = false;
        let adjTerrBefore = false;
        if (cits !== null) {
            if (cits[0].typ === CityItemTokenItemType.CITY) 
                canBeCityBefore = true;
            else if (cits[0].typ === CityItemTokenItemType.NOUN && cits.length > 1) 
                canBeCityBefore = true;
        }
        let k = 0;
        for (k = 0; k < li.length; k++) {
            if (li[k].ontoItem !== null) {
                if (exObj !== null || newName !== null) 
                    break;
                if (noun !== null) {
                    if (k === 1) {
                        if (noun.terminItem.canonicText === "РАЙОН" || noun.terminItem.canonicText === "ОБЛАСТЬ" || noun.terminItem.canonicText === "СОЮЗ") {
                            if (li[k].ontoItem.referent instanceof GeoReferent) {
                                if (li[k].ontoItem.referent.isState) 
                                    break;
                            }
                            let ok = false;
                            let tt = li[k].endToken.next;
                            if (tt === null) 
                                ok = true;
                            else if (tt.isCharOf(",.")) 
                                ok = true;
                            if ((!ok && li.length >= 4 && li[2].terminItem !== null) && li[3].terminItem === null) 
                                ok = true;
                            if (!ok) 
                                ok = MiscLocationHelper.checkGeoObjectBefore(li[0].beginToken, false);
                            if (!ok) 
                                ok = MiscLocationHelper.checkGeoObjectAfter(li[1].endToken, false, false);
                            if (!ok) {
                                let adr = AddressItemToken.tryParse(tt, false, null, null);
                                if (adr !== null) {
                                    if (adr.typ === AddressItemType.STREET) 
                                        ok = true;
                                }
                            }
                            if (!ok && MiscLocationHelper.isUserParamAddress(tt) && (tt instanceof NumberToken)) 
                                ok = true;
                            if (!ok) 
                                break;
                        }
                        if (li[k].ontoItem !== null) {
                            if (noun.beginToken.isValue("МО", null) || noun.beginToken.isValue("ЛО", null)) 
                                return null;
                        }
                    }
                }
                exObj = li[k];
            }
            else if (li[k].terminItem !== null) {
                if (noun !== null) 
                    break;
                if (li[k].terminItem.isAlwaysPrefix && k > 0) 
                    break;
                if (k > 0 && li[k].isDoubt) {
                    if (li[k].beginToken === li[k].endToken && li[k].beginToken.isValue("ЗАО", null)) 
                        break;
                }
                if (li[k].terminItem.isAdjective || li[k].isGeoInDictionary) 
                    adjList.push(li[k]);
                else {
                    if (exObj !== null) {
                        let _geo = Utils.as(exObj.ontoItem.referent, GeoReferent);
                        if (_geo === null) 
                            break;
                        if (exObj.isAdjective && ((li[k].terminItem.canonicText === "СОЮЗ" || li[k].terminItem.canonicText === "ФЕДЕРАЦИЯ"))) {
                            let str = exObj.ontoItem.toString();
                            if (!str.includes(li[k].terminItem.canonicText)) 
                                break;
                        }
                        if (li[k].terminItem.canonicText === "РАЙОН" || li[k].terminItem.canonicText === "ОКРУГ" || li[k].terminItem.canonicText === "КРАЙ") {
                            let tmp = new StringBuilder();
                            for (const s of _geo.slots) {
                                if (s.typeName === GeoReferent.ATTR_TYPE) 
                                    tmp.append(s.value).append(";");
                            }
                            if (!tmp.toString().toUpperCase().includes(li[k].terminItem.canonicText)) {
                                if (k !== 1 || newName !== null) 
                                    break;
                                newName = li[0];
                                newName.isAdjective = true;
                                newName.ontoItem = null;
                                exObj = null;
                            }
                        }
                    }
                    noun = li[k];
                    if (k === 0 && !li[k].isNewlineBefore) {
                        let tt = TerrItemToken.tryParse(li[k].beginToken.previous, null, null);
                        if (tt !== null && tt.morph._class.isAdjective) 
                            adjTerrBefore = true;
                    }
                }
            }
            else {
                if (exObj !== null) 
                    break;
                if (newName !== null) {
                    if ((k === 2 && li.length === 3 && li[0] === newName) && li[1].terminItem !== null) {
                        if (CityItemToken.checkKeyword(li[2].endToken.next) !== null) 
                            break;
                        if (li[0].beginToken.previous !== null) {
                            let cit = CityItemToken.tryParse(li[0].beginToken.previous, null, false, null);
                            if (cit === null) 
                                cit = CityItemToken.tryParse(li[0].beginToken.previous.previous, null, false, null);
                            if (cit !== null && cit.typ === CityItemTokenItemType.NOUN) 
                                return null;
                        }
                    }
                    if ((k === 2 && newName === li[1] && li.length === 3) && noun !== null) {
                        let cit = CityItemToken.tryParse(newName.beginToken, null, false, null);
                        if (cit !== null && cit.typ === CityItemTokenItemType.NOUN && cit.endToken.next === li[k].beginToken) {
                            if (noun.terminItem.canonicText.includes("МУНИЦИПАЛ")) {
                                let nam = CityItemToken.tryParse(cit.endToken.next, null, false, null);
                                if (nam !== null && ((nam.typ === CityItemTokenItemType.PROPERNAME || nam.typ === CityItemTokenItemType.CITY))) {
                                    if (nam.endToken.next !== null && nam.endToken.next.isAnd) {
                                        let li2 = TerrItemToken.tryParseList(nam.endToken.next.next, 4, null);
                                        if (li2 !== null && li2.length >= 2 && ((li2[0].terminItem !== null || li2[1].terminItem !== null))) {
                                            let geo1 = new GeoReferent();
                                            let rt1 = new ReferentToken(geo1, li[0].beginToken, li2[1].endToken);
                                            geo1.addTyp(noun.terminItem.canonicText);
                                            geo1.addSlot(GeoReferent.ATTR_NAME, MiscHelper.getTextValue(li[1].beginToken, rt1.endToken, GetTextAttr.NO), false, 0);
                                            return rt1;
                                        }
                                    }
                                }
                            }
                        }
                        else 
                            break;
                    }
                    else 
                        break;
                }
                newName = li[k];
            }
        }
        let name = null;
        let altName = null;
        let fullName = null;
        let _morph = null;
        let typVar = null;
        if (exObj !== null && noun !== null) {
            let _geo = Utils.as(exObj.ontoItem.referent, GeoReferent);
            if (_geo !== null && !_geo.isCity && ((_geo.isState || (noun.terminItem.canonicText.length < 3) || _geo.containsType(noun.terminItem.canonicText)))) {
            }
            else {
                newName = exObj;
                exObj = null;
            }
        }
        if (exObj !== null) {
            if (exObj.isAdjective && !exObj.morph.language.isEn && noun === null) {
                if (attachAlways && exObj.endToken.next !== null) {
                    let npt = MiscLocationHelper.tryParseNpt(exObj.beginToken);
                    if (exObj.endToken.next.isCommaAnd) {
                    }
                    else if (npt === null) {
                    }
                    else {
                        let str = StreetItemToken.tryParse(exObj.endToken.next, null, false, null);
                        if (str !== null) {
                            if (str.typ === StreetItemType.NOUN && str.endToken === npt.endToken) 
                                return null;
                        }
                    }
                }
                else if (exObj.beginToken.isValue("ПОДНЕБЕСНЫЙ", null)) {
                }
                else if (MiscLocationHelper.isUserParamAddress(exObj) && exObj.isNewlineBefore && !StreetItemToken.checkKeyword(exObj.endToken.next)) {
                }
                else {
                    let npt = MiscLocationHelper.tryParseNpt(exObj.beginToken);
                    if (npt !== null && npt.endToken !== npt.beginToken) 
                        return null;
                    let ttt = exObj.endToken.next;
                    if (ttt !== null && ttt.isComma && li.length === 1) 
                        ttt = ttt.next;
                    else if (AddressItemToken.checkStreetAfter(exObj.beginToken, false)) 
                        return null;
                    else if (AddressItemToken.checkStreetAfter(exObj.beginToken.previous, false)) 
                        return null;
                    let cit = CityItemToken.tryParseList(ttt, 5, null);
                    if (cit !== null && ((cit[0].typ === CityItemTokenItemType.NOUN || cit[0].typ === CityItemTokenItemType.CITY))) {
                        if (npt !== null && npt.endToken === cit[0].endToken) {
                        }
                        else if (!MiscLocationHelper.isUserParamAddress(exObj)) 
                            return null;
                        else if (cit[0].typ === CityItemTokenItemType.NOUN && ((cit.length === 2 || cit.length === 4)) && ((cit[1].typ === CityItemTokenItemType.CITY || cit[1].typ === CityItemTokenItemType.PROPERNAME))) {
                            if (AddressItemToken.checkStreetAfter(cit[1].beginToken, false)) 
                                return null;
                        }
                        else if (cit[0].typ === CityItemTokenItemType.CITY) {
                        }
                        else 
                            return null;
                    }
                    else if ((cit !== null && cit[0].typ === CityItemTokenItemType.PROPERNAME && cit.length === 2) && cit[1].typ === CityItemTokenItemType.NOUN && exObj.endToken.next.isComma) {
                    }
                    else if (ttt === null || ttt.whitespacesBeforeCount > 4) 
                        return null;
                    else if (MiscLocationHelper.checkGeoObjectAfter(ttt.previous, false, false)) {
                    }
                    else if (!MiscLocationHelper.isUserParamAddress(exObj)) 
                        return null;
                    else if (AddressItemToken.checkHouseAfter(exObj.endToken.next, true, false)) 
                        return null;
                }
            }
            if (noun === null && ((exObj.canBeCity || exObj.canBeSurname))) {
                let cit0 = CityItemToken.tryParseBack(exObj.beginToken.previous, false);
                if (cit0 !== null && cit0.typ !== CityItemTokenItemType.PROPERNAME) 
                    return null;
            }
            if (exObj.isDoubt && noun === null) {
                let ok2 = false;
                if (TerrDefineHelper._canBeGeoAfter(exObj.endToken.next)) 
                    ok2 = true;
                else if (!exObj.canBeSurname && !exObj.canBeCity) {
                    if ((exObj.endToken.next !== null && exObj.endToken.next.isChar(')') && exObj.beginToken.previous !== null) && exObj.beginToken.previous.isChar('(')) 
                        ok2 = true;
                    else if (exObj.chars.isLatinLetter && exObj.beginToken.previous !== null) {
                        if (exObj.beginToken.previous.isValue("IN", null)) 
                            ok2 = true;
                        else if (exObj.beginToken.previous.isValue("THE", null) && exObj.beginToken.previous.previous !== null && exObj.beginToken.previous.previous.isValue("IN", null)) 
                            ok2 = true;
                    }
                }
                if (!ok2) {
                    let cit0 = CityItemToken.tryParseBack(exObj.beginToken.previous, false);
                    if (cit0 !== null && cit0.typ !== CityItemTokenItemType.PROPERNAME) {
                    }
                    else {
                        if (MiscLocationHelper.checkGeoObjectBefore(exObj.beginToken.previous, false)) {
                        }
                        if (exObj.isNewlineBefore && MiscLocationHelper.isUserParamAddress(exObj)) {
                        }
                        else 
                            return null;
                    }
                }
            }
            name = exObj.ontoItem.canonicText;
            _morph = exObj.morph;
        }
        else if (newName !== null && noun === null) {
            if (!MiscLocationHelper.isUserParamAddress(newName)) 
                return null;
            if (li.length !== 1 || !MiscLocationHelper.checkGeoObjectBefore(li[0].beginToken, false)) 
                return null;
            if (!li[0].morph._class.isAdjective) 
                return null;
            let str = li[0].getSourceText();
            if (Utils.endsWithString(str, "О", true)) 
                return null;
            if (Utils.endsWithString(str, "ОЕ", true)) 
                return null;
            if (Utils.endsWithString(str, "АЯ", true)) 
                return null;
            let tt0 = li[0].beginToken.previous;
            while (tt0 !== null && tt0.isComma) {
                tt0 = tt0.previous;
            }
            if (!(tt0 instanceof ReferentToken)) 
                return null;
            let geo0 = Utils.as(tt0.getReferent(), GeoReferent);
            if (geo0 === null) 
                return null;
            if (geo0 !== null && geo0.findSlot(GeoReferent.ATTR_TYPE, "район", true) !== null) 
                return null;
            let cit = CityItemToken.tryParseList(li[0].beginToken, 5, null);
            if (cit !== null && cit.length > 0) {
                if ((cit[0].typ === CityItemTokenItemType.CITY || cit[0].typ === CityItemTokenItemType.NOUN)) 
                    return null;
                if (cit.length === 2 && cit[1].typ === CityItemTokenItemType.NOUN) 
                    return null;
                if (cit.length > 1 && cit[1].typ === CityItemTokenItemType.NOUN) {
                    if (AddressItemToken.checkStreetAfter(cit[1].endToken.next, false)) 
                        return null;
                }
            }
            name = MiscHelper.getTextValueOfMetaToken(li[0], GetTextAttr.NO);
            _morph = li[0].morph;
            typVar = "район";
        }
        else if (newName !== null) {
            for (let j = 1; j < k; j++) {
                if (li[j].isNewlineBefore && ((!li[0].isNewlineBefore || !li[j].isNewlineAfter))) {
                    if (BracketHelper.canBeStartOfSequence(li[j].beginToken, false, false)) {
                    }
                    else {
                        if (j < (k - 1)) 
                            return null;
                        if (li.length === 2 && k === 2) {
                        }
                        else {
                            let li2 = Array.from(li);
                            li2.splice(0, k);
                            let rt2 = TerrDefineHelper.tryDefine(li2, ad, false, null, null);
                            if (rt2 !== null && rt2.endToken === li2[li2.length - 1].endToken) {
                            }
                            else 
                                return null;
                        }
                    }
                }
            }
            _morph = noun.morph;
            if (newName.isAdjective) {
                if (noun.terminItem.acronym === "АО") {
                    if (noun.beginToken !== noun.endToken) 
                        return null;
                    if (newName.morph.gender !== MorphGender.FEMINIE) 
                        return null;
                }
                let geoBefore = null;
                let tt0 = li[0].beginToken.previous;
                if (tt0 !== null && tt0.isCommaAnd) 
                    tt0 = tt0.previous;
                if (!li[0].isNewlineBefore && tt0 !== null) 
                    geoBefore = Utils.as(tt0.getReferent(), GeoReferent);
                if (li.indexOf(noun) < li.indexOf(newName)) {
                    if (noun.terminItem.isState) 
                        return null;
                    if (newName.canBeSurname && geoBefore === null) {
                        if ((MorphCase.ooBitand(noun.morph._case, newName.morph._case)).isUndefined) 
                            return null;
                    }
                    let dontCheck = false;
                    if (MiscHelper.isExistsInDictionary(newName.beginToken, newName.endToken, MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.ooBitor(MorphClass.PRONOUN, MorphClass.VERB)))) {
                        if (noun.beginToken !== newName.beginToken) {
                            if (geoBefore === null) {
                                if (li.length === 2 && TerrDefineHelper._canBeGeoAfter(li[1].endToken.next)) {
                                }
                                else if (li.length === 3 && li[2].terminItem !== null && ((TerrDefineHelper._canBeGeoAfter(li[2].endToken.next) || noun.terminItem.canonicText.includes("МУНИЦИП") || noun.terminItem.canonicText.includes("ГОРОДСК")))) 
                                    addNoun = li[2];
                                else if (li.length === 4 && li[2].terminItem !== null && li[3].terminItem === null) {
                                }
                                else if (newName.isGeoInDictionary) {
                                }
                                else if (newName.endToken.isNewlineAfter) {
                                }
                                else if (AddressItemToken.checkStreetAfter(newName.endToken.next, false)) {
                                }
                                else if (newName.endToken.next !== null && newName.endToken.next.isValue("КИЛОМЕТР", null)) {
                                }
                                else if (OrgItemToken.tryParse(newName.endToken.next, null) !== null) {
                                }
                                else 
                                    return null;
                                dontCheck = true;
                            }
                        }
                    }
                    if (!dontCheck) {
                        let npt = NounPhraseHelper.tryParse(newName.endToken, NounPhraseParseAttr.PARSEPRONOUNS, 0, null);
                        if (npt !== null && npt.endToken !== newName.endToken) {
                            if (li.length === 3 && li[2].terminItem !== null && npt.endToken === li[2].endToken) 
                                addNoun = li[2];
                            else if (li.length === 4 && li[2].terminItem !== null && npt.endToken === li[2].endToken) {
                            }
                            else if (AddressItemToken.checkStreetAfter(npt.endToken, false)) {
                            }
                            else if (MiscLocationHelper.checkGeoObjectAfter(newName.endToken, false, false)) {
                            }
                            else if (npt.endToken.isValue("КИЛОМЕТР", null)) {
                            }
                            else if (OrgItemToken.tryParse(newName.endToken.next, null) !== null) {
                            }
                            else 
                                return null;
                        }
                    }
                    let rtp = newName.kit.processReferent("PERSON", newName.beginToken, null);
                    if (rtp !== null) 
                        return null;
                    if (newName.realName !== null) 
                        name = ProperNameHelper.getNameEx(newName.realName.beginToken, newName.realName.endToken, MorphClass.ADJECTIVE, MorphCase.UNDEFINED, noun.terminItem.gender, false, false);
                    else 
                        name = ProperNameHelper.getNameEx(newName.beginToken, newName.endToken, MorphClass.ADJECTIVE, MorphCase.UNDEFINED, noun.terminItem.gender, false, false);
                    let vvv = MiscHelper.getTextValueOfMetaToken(newName, GetTextAttr.NO);
                    if (vvv.endsWith("ВО")) 
                        name = vvv;
                }
                else {
                    let ok = false;
                    if (((k + 1) < li.length) && li[k].terminItem === null && li[k + 1].terminItem !== null) 
                        ok = true;
                    else if ((k < li.length) && li[k].ontoItem !== null) 
                        ok = true;
                    else if (k === li.length && !newName.isAdjInDictionary) {
                        ok = true;
                        if (noun.terminItem.canonicText === "ТЕРРИТОРИЯ") {
                            let cit1 = CityItemToken.tryParseBack(li[0].beginToken.previous, false);
                            if (cit1 !== null && cit1.typ === CityItemTokenItemType.NOUN) 
                                return null;
                        }
                    }
                    else if (MiscLocationHelper.checkGeoObjectBefore(li[0].beginToken, false) || canBeCityBefore) 
                        ok = true;
                    else if (MiscLocationHelper.checkGeoObjectAfter(li[k - 1].endToken, false, false)) 
                        ok = true;
                    else if (li.length === 3 && k === 2) {
                        let cit = CityItemToken.tryParse(li[2].beginToken, null, false, null);
                        if (cit !== null) {
                            if (cit.typ === CityItemTokenItemType.CITY || cit.typ === CityItemTokenItemType.NOUN) 
                                ok = true;
                        }
                    }
                    else if (li.length === 2) 
                        ok = TerrDefineHelper._canBeGeoAfter(li[li.length - 1].endToken.next);
                    if (!ok && !li[0].isNewlineBefore && !li[0].chars.isAllLower) {
                        let rt00 = li[0].kit.processReferent("PERSONPROPERTY", li[0].beginToken.previous, null);
                        if (rt00 !== null) 
                            ok = true;
                    }
                    if (noun.terminItem !== null && noun.terminItem.isStrong && newName.isAdjective) 
                        ok = true;
                    if (noun.isDoubt && adjList.length === 0 && geoBefore === null) 
                        return null;
                    if (newName.realName !== null) 
                        name = ProperNameHelper.getNameEx(newName.realName.beginToken, newName.realName.endToken, MorphClass.ADJECTIVE, MorphCase.UNDEFINED, noun.terminItem.gender, false, false);
                    else 
                        name = ProperNameHelper.getNameEx(newName.beginToken, newName.endToken, MorphClass.ADJECTIVE, MorphCase.UNDEFINED, noun.terminItem.gender, false, false);
                    let vvv = MiscHelper.getTextValueOfMetaToken(newName, GetTextAttr.NO);
                    if (vvv.endsWith("ВО")) 
                        name = vvv;
                    if (!ok && !attachAlways && !MiscLocationHelper.isUserParamAddress(newName)) {
                        if (MiscHelper.isExistsInDictionary(newName.beginToken, newName.endToken, MorphClass.ooBitor(MorphClass.ADJECTIVE, MorphClass.ooBitor(MorphClass.PRONOUN, MorphClass.VERB)))) {
                            if (exists !== null) {
                                for (const e of exists) {
                                    if (e.findSlot(GeoReferent.ATTR_NAME, name, true) !== null) {
                                        ok = true;
                                        break;
                                    }
                                }
                            }
                            if (!ok) 
                                return null;
                        }
                    }
                    fullName = (ProperNameHelper.getNameEx(li[0].beginToken, noun.beginToken.previous, MorphClass.ADJECTIVE, MorphCase.UNDEFINED, noun.terminItem.gender, false, false) + " " + noun.terminItem.canonicText);
                }
            }
            else {
                if (!attachAlways || ((noun.terminItem !== null && noun.terminItem.canonicText === "ФЕДЕРАЦИЯ"))) {
                    let isLatin = noun.chars.isLatinLetter && newName.chars.isLatinLetter;
                    if (li.indexOf(noun) > li.indexOf(newName)) {
                        if (!isLatin && newName.namedBy === null) 
                            return null;
                    }
                    if (!newName.isDistrictName && newName.namedBy === null && !BracketHelper.canBeStartOfSequence(newName.beginToken, false, false)) {
                        if (adjList.length === 0 && MiscHelper.isExistsInDictionary(newName.beginToken, newName.endToken, MorphClass.ooBitor(MorphClass.NOUN, MorphClass.PRONOUN))) {
                            if (li.length === 2 && noun.isCityRegion && (noun.whitespacesAfterCount < 2)) {
                            }
                            else if (MiscLocationHelper.checkGeoObjectAfter(newName.endToken, false, false)) {
                            }
                            else if (li.length < 3) {
                                if (MiscLocationHelper.isUserParamAddress(li[0])) {
                                }
                                else 
                                    return null;
                            }
                            else {
                                let ii = li.indexOf(newName);
                                let li2 = Array.from(li);
                                li2.splice(0, ii + 1);
                                let rt2 = TerrDefineHelper.tryDefine(li2, ad, false, null, null);
                                if (rt2 === null) 
                                    return null;
                            }
                        }
                        if (!isLatin) {
                            if ((noun.terminItem.isRegion && !attachAlways && ((!adjTerrBefore || newName.isDoubt))) && !noun.isCityRegion && !noun.terminItem.isSpecificPrefix) {
                                if (!MiscLocationHelper.checkGeoObjectBefore(noun.beginToken, false)) {
                                    if (!noun.isDoubt && noun.beginToken !== noun.endToken) {
                                    }
                                    else if ((noun.terminItem.isAlwaysPrefix && li.length === 2 && li[0] === noun) && li[1] === newName) {
                                    }
                                    else if (MiscLocationHelper.isUserParamAddress(li[0])) {
                                    }
                                    else 
                                        return null;
                                }
                            }
                            if (noun.isDoubt && adjList.length === 0) {
                                if (noun.terminItem.acronym === "МО" || noun.terminItem.acronym === "ЛО") {
                                    if (k === (li.length - 1) && li[k].terminItem !== null) {
                                        addNoun = li[k];
                                        k++;
                                    }
                                    else if (li.length === 2 && noun === li[0] && newName.toString().endsWith("совет")) {
                                    }
                                    else 
                                        return null;
                                }
                                else 
                                    return null;
                            }
                            if (newName.beginToken.isValue("КОРОЛЕВ", null)) {
                            }
                            else {
                                let pers = newName.kit.processReferent("PERSON", newName.beginToken, null);
                                if (pers !== null) 
                                    return null;
                            }
                        }
                    }
                }
                if (newName.realName !== null) 
                    name = MiscHelper.getTextValue(newName.realName.beginToken, newName.realName.endToken, GetTextAttr.NO);
                else 
                    name = MiscHelper.getTextValue(newName.beginToken, newName.endToken, GetTextAttr.NO);
                if (newName.namedBy !== null) 
                    name = MiscHelper.getTextValueOfMetaToken(newName.namedBy, GetTextAttr.NO);
                if (newName.beginToken !== newName.endToken) {
                    for (let ttt = newName.beginToken.next; ttt !== null && ttt.endChar <= newName.endChar; ttt = ttt.next) {
                        if (ttt.chars.isLetter) {
                            let ty = TerrItemToken.tryParse(ttt, null, null);
                            if ((ty !== null && ty.terminItem !== null && noun !== null) && ((ty.terminItem.canonicText.includes(noun.terminItem.canonicText) || noun.terminItem.canonicText.includes(ty.terminItem.canonicText)))) {
                                name = MiscHelper.getTextValue(newName.beginToken, ttt.previous, GetTextAttr.NO);
                                break;
                            }
                        }
                    }
                }
                if (adjList.length > 0) {
                    let npt = MiscLocationHelper.tryParseNpt(adjList[0].beginToken);
                    if (npt !== null && npt.endToken === noun.endToken) 
                        altName = (npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false) + " " + name);
                }
            }
        }
        else {
            if ((li.length === 1 && noun !== null && noun.endToken.next !== null) && (noun.endToken.next.getReferent() instanceof GeoReferent)) {
                let g = Utils.as(noun.endToken.next.getReferent(), GeoReferent);
                if (noun.terminItem !== null) {
                    let tyy = noun.terminItem.canonicText.toLowerCase();
                    let ooo = false;
                    if (g.findSlot(GeoReferent.ATTR_TYPE, tyy, true) !== null) 
                        ooo = true;
                    else if (tyy.endsWith("район") && g.findSlot(GeoReferent.ATTR_TYPE, "район", true) !== null) 
                        ooo = true;
                    if (ooo) 
                        return ReferentToken._new1092(g, noun.beginToken, noun.endToken.next, noun.beginToken.morph);
                }
            }
            if ((li.length === 1 && noun === li[0] && li[0].terminItem !== null) && TerrItemToken.tryParse(li[0].endToken.next, null, null) === null && TerrItemToken.tryParse(li[0].beginToken.previous, null, null) === null) {
                if (li[0].morph.number === MorphNumber.PLURAL) 
                    return null;
                let cou = 0;
                let str = li[0].terminItem.canonicText.toLowerCase();
                for (let tt = li[0].beginToken.previous; tt !== null; tt = tt.previous) {
                    if (tt.isNewlineAfter) 
                        cou += 10;
                    else 
                        cou++;
                    if (cou > 500) 
                        break;
                    let g = Utils.as(tt.getReferent(), GeoReferent);
                    if (g === null) 
                        continue;
                    let ok = true;
                    cou = 0;
                    for (tt = li[0].endToken.next; tt !== null; tt = tt.next) {
                        if (tt.isNewlineBefore) 
                            cou += 10;
                        else 
                            cou++;
                        if (cou > 500) 
                            break;
                        let tee = TerrItemToken.tryParse(tt, null, null);
                        if (tee === null) 
                            continue;
                        ok = false;
                        break;
                    }
                    if (ok) {
                        for (let ii = 0; g !== null && (ii < 3); g = g.higher,ii++) {
                            if (g.findSlot(GeoReferent.ATTR_TYPE, str, true) !== null) 
                                return ReferentToken._new1092(g, li[0].beginToken, li[0].endToken, noun.beginToken.morph);
                        }
                    }
                    break;
                }
            }
            if (li.length === 1 && li[0].terminItem !== null && li[0].terminItem.canonicText === "МУНИЦИПАЛЬНЫЙ ОКРУГ") {
                let ait = AddressItemToken.tryParsePureItem(li[0].endToken.next, null, null);
                if (ait !== null && ait.typ === AddressItemType.NUMBER) {
                    number = ait;
                    name = number.value;
                }
            }
            if (name === null) 
                return null;
        }
        let ter = null;
        if (exObj !== null && (exObj.tag instanceof GeoReferent)) 
            ter = Utils.as(exObj.tag, GeoReferent);
        else {
            ter = new GeoReferent();
            if (exObj !== null) {
                let _geo = Utils.as(exObj.ontoItem.referent, GeoReferent);
                if (_geo !== null && !_geo.isCity && (((_geo.isState || noun === null || (noun.terminItem.canonicText.length < 3)) || _geo.containsType(noun.terminItem.canonicText)))) 
                    ter.mergeSlots2(_geo, li[0].kit.baseLanguage);
                else 
                    ter.addName(name);
                if (noun === null && exObj.canBeCity) 
                    ter.addTypCity(li[0].kit.baseLanguage, true);
                else {
                }
            }
            else if (name !== null) {
                ter.addName(name);
                if (altName !== null) 
                    ter.addName(altName);
            }
            if (typVar !== null) 
                ter.addTyp(typVar);
            if (noun !== null) {
                if (noun.terminItem.canonicText === "АО") 
                    ter.addTyp((li[0].kit.baseLanguage.isUa ? "АВТОНОМНИЙ ОКРУГ" : "АВТОНОМНЫЙ ОКРУГ"));
                else if (noun.terminItem.canonicText === "МУНИЦИПАЛЬНОЕ СОБРАНИЕ" || noun.terminItem.canonicText === "МУНІЦИПАЛЬНЕ ЗБОРИ") 
                    ter.addTyp((li[0].kit.baseLanguage.isUa ? "МУНІЦИПАЛЬНЕ УТВОРЕННЯ" : "МУНИЦИПАЛЬНОЕ ОБРАЗОВАНИЕ"));
                else if (noun.terminItem.acronym === "МО" && addNoun !== null) 
                    ter.addTyp(addNoun.terminItem.canonicText);
                else {
                    if (noun.terminItem.canonicText === "СОЮЗ" && exObj !== null && exObj.endChar > noun.endChar) 
                        return ReferentToken._new1092(ter, exObj.beginToken, exObj.endToken, exObj.morph);
                    ter.addTyp(noun.terminItem.canonicText);
                    if (noun.terminItem.isRegion && ter.isState) 
                        ter.addTypReg(li[0].kit.baseLanguage);
                }
                if (noun.terminItem2 !== null) 
                    ter.addTyp(noun.terminItem2.canonicText);
            }
            if (ter.isState && ter.isRegion) {
                for (const a of adjList) {
                    if (a.terminItem.isRegion) {
                        ter.addTypReg(li[0].kit.baseLanguage);
                        break;
                    }
                }
            }
            if (ter.isState) {
                if (fullName !== null) 
                    ter.addName(fullName);
            }
        }
        if (noun === null) {
            while (k > 1 && adjList.includes(li[k - 1])) {
                k--;
            }
        }
        let res = new ReferentToken(ter, li[0].beginToken, li[k - 1].endToken);
        if ((k === 2 && li.length === 3 && noun === li[0]) && li[2].terminItem !== null) {
            if (li[2].terminItem === noun.terminItem || ((li[2].terminItem.canonicText === "АВТОНОМНЫЙ ОКРУГ" && noun.terminItem.canonicText === "АО"))) {
                res.endToken = li[2].endToken;
                k = 3;
            }
        }
        if (noun !== null && noun.morph._class.isNoun) 
            res.morph = noun.morph;
        else {
            res.morph = new MorphCollection();
            for (let ii = 0; ii < k; ii++) {
                for (const v of li[ii].morph.items) {
                    let bi = new MorphBaseInfo();
                    bi.copyFrom(v);
                    if (noun !== null) {
                        if (bi._class.isAdjective) 
                            bi._class = MorphClass.NOUN;
                    }
                    res.morph.addItem(bi);
                }
            }
        }
        if (li[0].terminItem !== null && li[0].terminItem.isSpecificPrefix) 
            res.beginToken = li[0].endToken.next;
        if (addNoun !== null && addNoun.endChar > res.endChar) 
            res.endToken = addNoun.endToken;
        if (number !== null && number.endChar > res.endChar) 
            res.endToken = number.endToken;
        if ((res.beginToken.previous instanceof TextToken) && (res.whitespacesBeforeCount < 2)) {
            let tt = Utils.as(res.beginToken.previous, TextToken);
            if (tt.term === "АР") {
                for (const ty of ter.typs) {
                    if (ty.includes("республика") || ty.includes("республіка")) {
                        res.beginToken = tt;
                        break;
                    }
                }
            }
        }
        if (li.length === 3 && li[1] === noun) {
            if (li[2].terminItem === noun.terminItem) 
                res.endToken = li[2].endToken;
        }
        if (noun !== null && noun.terminItem.canonicText.includes("МЕЖСЕЛЕН")) {
            let tt = res.endToken.next;
            if (tt !== null && tt.isComma) 
                tt = tt.next;
            if ((tt !== null && tt.isValue("НАХОДИТЬСЯ", null) && tt.next !== null) && tt.next.isValue("ВНЕ", null)) {
                for (tt = tt.next.next; tt !== null; tt = tt.next) {
                    let mc = tt.getMorphClassInDictionary();
                    if (!mc.isNoun) 
                        continue;
                    if (tt.isValue("ГРАНИЦА", null) || tt.isValue("ПРЕДЕЛ", null) || tt.isValue("ПОСЕЛЕНИЕ", null)) 
                        res.endToken = tt;
                    else if (!mc.isAdjective) 
                        break;
                }
            }
        }
        if (noun !== null && noun.terminItem.canonicText === "СЕЛЬСКИЙ ОКРУГ") {
            let t0 = res.beginToken.previous;
            if (t0 !== null && ((t0.isValue("ПОСЕЛОК", null) || t0.isValue("ПОСЕЛЕНИЕ", null)))) {
                if (t0.previous !== null && t0.previous.isValue("СЕЛЬСКИЙ", null)) 
                    res.beginToken = t0.previous;
            }
        }
        if (res.endToken.next !== null && res.endToken.next.isHiphen && res.endToken.next.next !== null) {
            let tt = res.endToken.next.next;
            if (ter.toString() === "область Кемеровская") {
                if (tt.isValue("КУЗБАСС", null)) 
                    res.endToken = tt;
            }
            else {
                let next = TerrItemToken.tryParse(tt, null, null);
                if ((next !== null && next.ontoItem !== null && exObj !== null) && next.ontoItem === exObj.ontoItem) 
                    res.endToken = tt;
            }
        }
        if (res.whitespacesAfterCount < 3) {
            let tt = res.endToken.next;
            if (tt !== null && tt.isValue("МУНИЦИПАЛЬНЫЙ", null)) {
                if (NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null) === null) 
                    res.endToken = tt;
            }
            if ((tt instanceof TextToken) && tt.term === "МО") {
                if (ter.toString() === "область Московская") 
                    res.endToken = tt;
            }
            if (((tt instanceof NumberToken) && MiscLocationHelper.isUserParamAddress(tt) && tt.next !== null) && tt.next.isComma) 
                res.endToken = tt;
        }
        return res;
    }
    
    static _canBeGeoAfter(tt) {
        while (tt !== null && ((tt.isComma || BracketHelper.isBracket(tt, true)))) {
            tt = tt.next;
        }
        if (tt === null) 
            return false;
        if (tt.getReferent() instanceof GeoReferent) 
            return true;
        let tli = TerrItemToken.tryParseList(tt, 2, null);
        if (tli !== null && tli.length > 1) {
            if (tli[0].terminItem === null && tli[1].terminItem !== null) 
                return true;
            else if (tli[0].terminItem !== null && tli[1].terminItem === null) 
                return true;
        }
        if (CityAttachHelper.checkCityAfter(tt)) 
            return true;
        if (TerrDefineHelper.tryAttachStateUSATerritory(tt) !== null) 
            return true;
        return false;
    }
    
    static tryAttachStateUSATerritory(t) {
        if (t === null || !t.chars.isLatinLetter) 
            return null;
        let tok = TerrItemToken.m_GeoAbbrs.tryParse(t, TerminParseAttr.NO);
        if (tok === null) 
            return null;
        let g = Utils.as(tok.termin.tag, GeoReferent);
        if (g === null) 
            return null;
        if (tok.endToken.next !== null && tok.endToken.next.isChar('.')) 
            tok.endToken = tok.endToken.next;
        let gg = g.clone();
        gg.occurrence.splice(0, gg.occurrence.length);
        return new ReferentToken(gg, tok.beginToken, tok.endToken);
    }
}


module.exports = TerrDefineHelper