/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const MorphNumber = require("./../../../morph/MorphNumber");
const MorphWordForm = require("./../../../morph/MorphWordForm");
const MetaToken = require("./../../MetaToken");
const MorphClass = require("./../../../morph/MorphClass");
const MiscHelper = require("./../../core/MiscHelper");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const GetTextAttr = require("./../../core/GetTextAttr");
const Referent = require("./../../Referent");
const BracketHelper = require("./../../core/BracketHelper");
const MorphologyService = require("./../../../morph/MorphologyService");
const MorphCase = require("./../../../morph/MorphCase");
const MorphBaseInfo = require("./../../../morph/MorphBaseInfo");
const Termin = require("./../../core/Termin");
const OrgTypToken = require("./../../geo/internal/OrgTypToken");
const Token = require("./../../Token");
const GeoReferent = require("./../../geo/GeoReferent");
const AddressItemType = require("./AddressItemType");
const TextToken = require("./../../TextToken");
const ReferentToken = require("./../../ReferentToken");
const StreetItemType = require("./StreetItemType");
const MorphGender = require("./../../../morph/MorphGender");
const NumberSpellingType = require("./../../NumberSpellingType");
const StreetKind = require("./../StreetKind");
const NumberToken = require("./../../NumberToken");
const StreetReferent = require("./../StreetReferent");
const MiscLocationHelper = require("./../../geo/internal/MiscLocationHelper");
const NumberHelper = require("./../../core/NumberHelper");
const StreetItemToken = require("./StreetItemToken");
const AddressItemToken = require("./AddressItemToken");

class StreetDefineHelper {
    
    static checkStreetAfter(t) {
        if (t === null) 
            return false;
        while (t !== null && ((t.isCharOf(",;") || t.morph._class.isPreposition))) {
            t = t.next;
        }
        let li = StreetItemToken.tryParseList(t, 10, null);
        if (li === null) 
            return false;
        let rt = StreetDefineHelper.tryParseStreet(li, false, false, false, null);
        if (rt !== null && rt.beginToken === t) 
            return true;
        else 
            return false;
    }
    
    static tryParseExtStreet(sli) {
        let a = StreetDefineHelper.tryParseStreet(sli, true, false, false, null);
        if (a !== null) 
            return new ReferentToken(a.referent, a.beginToken, a.endToken);
        return null;
    }
    
    static tryParseStreet(sli, extOntoRegim = false, forMetro = false, streetBefore = false, crossStreet = null) {
        if (sli === null || sli.length === 0) 
            return null;
        if ((sli.length === 2 && sli[0].typ === StreetItemType.NUMBER && sli[1].typ === StreetItemType.NOUN) && sli[1].isAbridge) {
            if (MiscLocationHelper.checkGeoObjectBefore(sli[0].beginToken, false)) {
            }
            else if (StreetItemToken._isRegion(sli[1].termin.canonicText) && MiscLocationHelper.isUserParamAddress(sli[1])) {
            }
            else 
                return null;
        }
        if ((sli.length === 2 && sli[0].typ === StreetItemType.NOUN && sli[0].nounIsDoubtCoef > 1) && sli[0].beginToken.isValue("КВ", null) && sli[1].typ === StreetItemType.NUMBER) {
            let at = AddressItemToken.tryParsePureItem(sli[0].beginToken, null, null);
            if (at !== null && at.value !== null) {
                let ttt = at.endToken.next;
                if (ttt !== null && ttt.isComma) 
                    ttt = ttt.next;
                let next = AddressItemToken.tryParsePureItem(ttt, null, null);
                if (next !== null && next.typ === AddressItemType.PLOT) {
                }
                else 
                    return null;
            }
        }
        if (((sli.length === 4 && sli[0].typ === StreetItemType.NOUN && sli[1].typ === StreetItemType.NUMBER) && sli[2].typ === StreetItemType.NOUN && sli[0].termin === sli[2].termin) && ((sli[3].typ === StreetItemType.NAME || sli[3].typ === StreetItemType.STDNAME || sli[3].typ === StreetItemType.STDADJECTIVE))) 
            sli.splice(2, 1);
        if (sli.length === 2 && sli[0].typ === StreetItemType.NOUN && sli[1].typ === StreetItemType.FIX) 
            return StreetDefineHelper._tryParseFix(sli);
        if ((sli.length === 3 && sli[1].typ === StreetItemType.FIX && sli[2].typ === StreetItemType.NOUN) && (((sli[0].typ === StreetItemType.NUMBER || sli[0].typ === StreetItemType.NAME || sli[0].typ === StreetItemType.STDADJECTIVE) || sli[0].typ === StreetItemType.STDNAME))) {
            let tmp = new Array();
            tmp.push(sli[0]);
            tmp.push(sli[2]);
            let res1 = StreetDefineHelper.tryParseStreet(tmp, extOntoRegim, forMetro, streetBefore, crossStreet);
            if (res1 === null) 
                return null;
            tmp.splice(0, tmp.length);
            tmp.push(sli[1]);
            let res2 = StreetDefineHelper.tryParseStreet(tmp, extOntoRegim, forMetro, streetBefore, crossStreet);
            if (res2 !== null) 
                res1.ortoTerr = res2;
            return res1;
        }
        let i = 0;
        let j = 0;
        let notDoubt = false;
        let isTerr = false;
        for (i = 0; i < sli.length; i++) {
            if (i === 0 && sli[i].typ === StreetItemType.FIX && ((sli.length === 1 || sli[1].typ !== StreetItemType.NOUN || sli[0].org !== null))) 
                return StreetDefineHelper._tryParseFix(sli);
            else if (sli[i].typ === StreetItemType.NOUN) {
                if (sli.length === 1 && sli[0].nounCanBeName && MiscLocationHelper.isUserParamAddress(sli[0])) 
                    continue;
                if (sli[i].termin.canonicText === "МЕТРО") {
                    if ((i + 1) < sli.length) {
                        let sli1 = new Array();
                        for (let ii = i + 1; ii < sli.length; ii++) {
                            sli1.push(sli[ii]);
                        }
                        let str1 = StreetDefineHelper.tryParseStreet(sli1, extOntoRegim, true, false, null);
                        if (str1 !== null) {
                            str1.beginToken = sli[i].beginToken;
                            str1.isDoubt = sli[i].isAbridge;
                            if (sli[i + 1].isInBrackets) 
                                str1.isDoubt = false;
                            return str1;
                        }
                    }
                    else if (i === 1 && sli[0].typ === StreetItemType.NAME) {
                        forMetro = true;
                        break;
                    }
                    if (i === 0 && sli.length > 0) {
                        forMetro = true;
                        break;
                    }
                    return null;
                }
                if (i === 0 && (i + 1) >= sli.length && ((sli[i].termin.canonicText === "ВОЕННЫЙ ГОРОДОК" || sli[i].termin.canonicText === "ПРОМЗОНА"))) {
                    let stri0 = new StreetReferent();
                    stri0.addTyp("микрорайон");
                    stri0.addSlot(StreetReferent.ATTR_NAME, sli[i].termin.canonicText, false, 0);
                    return AddressItemToken._new440(AddressItemType.STREET, sli[0].beginToken, sli[0].endToken, stri0, true);
                }
                if (i === 0 && (i + 1) >= sli.length && sli[i].termin.canonicText === "МИКРОРАЙОН") {
                    let stri0 = new StreetReferent();
                    stri0.kind = StreetKind.AREA;
                    stri0.addSlot(StreetReferent.ATTR_TYPE, sli[i].termin.canonicText.toLowerCase(), false, 0);
                    return AddressItemToken._new440(AddressItemType.STREET, sli[0].beginToken, sli[0].endToken, stri0, true);
                }
                if (sli[i].termin.canonicText === "ПЛОЩАДЬ" || sli[i].termin.canonicText === "ПЛОЩА") {
                    let tt = sli[i].endToken.next;
                    if (tt !== null && ((tt.isHiphen || tt.isChar(':')))) 
                        tt = tt.next;
                    let nex = NumberHelper.tryParseNumberWithPostfix(tt);
                    if (nex !== null) 
                        return null;
                    if (i > 0 && sli[i - 1].value === "ПРОЕКТИРУЕМЫЙ") 
                        return null;
                }
                break;
            }
        }
        if (i >= sli.length) 
            return StreetDefineHelper.tryDetectNonNoun(sli, extOntoRegim, forMetro, streetBefore, crossStreet);
        let name = null;
        let number = null;
        let age = null;
        let adj = null;
        let noun = sli[i];
        let altNoun = null;
        let isMicroRaion = StreetItemToken._isRegion(noun.termin.canonicText);
        let isProezd = false;
        let before = 0;
        let after = 0;
        for (j = 0; j < i; j++) {
            if (((sli[j].typ === StreetItemType.NAME || sli[j].typ === StreetItemType.STDNAME || sli[j].typ === StreetItemType.FIX) || sli[j].typ === StreetItemType.STDADJECTIVE || sli[j].typ === StreetItemType.STDPARTOFNAME) || sli[j].typ === StreetItemType.AGE) 
                before++;
            else if (sli[j].typ === StreetItemType.NUMBER) {
                if (sli[j].isNewlineAfter) 
                    return null;
                if (sli[j].numberType !== NumberSpellingType.UNDEFINED && sli[j].beginToken.morph._class.isAdjective) 
                    before++;
                else if (isMicroRaion || notDoubt) 
                    before++;
                else if (sli[i].numberHasPrefix || sli[i].isNumberKm) 
                    before++;
                else if (MiscLocationHelper.isUserParamAddress(sli[i])) 
                    before++;
            }
            else 
                before++;
        }
        for (j = i + 1; j < sli.length; j++) {
            if (before > 0 && sli[j].isNewlineBefore) 
                break;
            else if (((sli[j].typ === StreetItemType.NAME || sli[j].typ === StreetItemType.STDNAME || sli[j].typ === StreetItemType.FIX) || sli[j].typ === StreetItemType.STDADJECTIVE || sli[j].typ === StreetItemType.STDPARTOFNAME) || sli[j].typ === StreetItemType.AGE) 
                after++;
            else if (sli[j].typ === StreetItemType.NUMBER) {
                if (sli[j].numberType !== NumberSpellingType.UNDEFINED && sli[j].beginToken.morph._class.isAdjective) 
                    after++;
                else if (isMicroRaion || notDoubt) 
                    after++;
                else if (sli[j].numberHasPrefix || sli[j].isNumberKm) 
                    after++;
                else if (extOntoRegim) 
                    after++;
                else if (sli.length === 2 && sli[0].typ === StreetItemType.NOUN && j === 1) 
                    after++;
                else if ((sli.length > 2 && sli[0].typ === StreetItemType.NOUN && sli[1].typ === StreetItemType.NOUN) && j === 2) 
                    after++;
                else if ((sli.length === 3 && sli[0].typ === StreetItemType.NOUN && sli[2].typ === StreetItemType.NOUN) && j === 1) 
                    after++;
                else if (((j + 1) < sli.length) && sli[j + 1].typ === StreetItemType.NOUN) 
                    after++;
            }
            else if (sli[j].typ === StreetItemType.NOUN) {
                let isReg = StreetItemToken._isRegion(sli[j].termin.canonicText);
                if (((j === (i + 1) || j === (sli.length - 1))) && altNoun === null && !isReg) 
                    altNoun = sli[j];
                else if (altNoun === null && ((sli[i].termin.canonicText === "ПРОЕЗД" || ((sli[j].termin.canonicText === "ПРОЕЗД" || sli[j].termin.canonicText === "НАБЕРЕЖНАЯ")))) && !isMicroRaion) {
                    altNoun = sli[j];
                    isProezd = true;
                }
                else if (j === 1 && sli.length === 3 && sli[2].typ === StreetItemType.NUMBER) 
                    altNoun = sli[j];
                else if (((j + 1) < sli.length) && !sli[j].isNewlineAfter) 
                    break;
                else 
                    altNoun = sli[j];
            }
            else 
                after++;
        }
        let rli = new Array();
        let n0 = 0;
        let n1 = 0;
        if (before > after) {
            if (noun.termin.canonicText === "МЕТРО") 
                return null;
            if (noun.termin.canonicText === "КВАРТАЛ" && !extOntoRegim && !streetBefore) {
                if (sli[0].typ === StreetItemType.NUMBER && sli.length === 2) {
                    if (!AddressItemToken.checkHouseAfter(sli[1].endToken.next, false, false)) {
                        if (!MiscLocationHelper.checkGeoObjectBefore(sli[0].beginToken, false)) 
                            return null;
                        if (sli[0].beginToken.previous !== null && sli[0].beginToken.previous.getMorphClassInDictionary().isPreposition) 
                            return null;
                    }
                }
            }
            let tt = sli[0].beginToken;
            if (tt === sli[0].endToken && noun.beginToken === sli[0].endToken.next && !MiscLocationHelper.isUserParamAddress(sli[0])) {
                if (!tt.morph._class.isAdjective && !(tt instanceof NumberToken)) {
                    if ((sli[0].isNewlineBefore || !MiscLocationHelper.checkGeoObjectBefore(sli[0].beginToken, false) || noun.morph._case.isGenitive) || noun.morph._case.isInstrumental) {
                        let ok = false;
                        if (AddressItemToken.checkHouseAfter(noun.endToken.next, false, true)) 
                            ok = true;
                        else if (noun.endToken.next === null) 
                            ok = true;
                        else if (noun.isNewlineAfter && MiscLocationHelper.checkGeoObjectBefore(sli[0].beginToken, false)) 
                            ok = true;
                        if (!ok) {
                            if ((noun.chars.isLatinLetter && noun.chars.isCapitalUpper && sli[0].chars.isLatinLetter) && sli[0].chars.isCapitalUpper) 
                                ok = true;
                        }
                        if (!ok) 
                            return null;
                    }
                }
            }
            n0 = 0;
            n1 = i - 1;
        }
        else if (i === 1 && sli[0].typ === StreetItemType.NUMBER) {
            if (!sli[0].isWhitespaceAfter) 
                return null;
            number = sli[0].value;
            if (sli[0].isNumberKm) 
                number += "км";
            n0 = i + 1;
            n1 = sli.length - 1;
            rli.push(sli[0]);
            rli.push(sli[i]);
        }
        else if (after > before) {
            n0 = i + 1;
            n1 = sli.length - 1;
            rli.push(sli[i]);
            if (altNoun !== null && altNoun === sli[i + 1]) {
                rli.push(sli[i + 1]);
                n0++;
            }
        }
        else if (after === 0) {
            if (altNoun === null || sli.length !== 2) 
                return null;
            n0 = 1;
            n1 = 0;
        }
        else if ((sli.length > 2 && ((sli[0].typ === StreetItemType.NAME || sli[0].typ === StreetItemType.STDADJECTIVE || sli[0].typ === StreetItemType.STDNAME)) && sli[1].typ === StreetItemType.NOUN) && sli[2].typ === StreetItemType.NUMBER) {
            n0 = 0;
            n1 = 0;
            let num = false;
            let tt2 = sli[2].endToken.next;
            if (sli[2].isNumberKm) 
                num = true;
            else if (sli[0].beginToken.previous !== null && sli[0].beginToken.previous.isValue("КИЛОМЕТР", null)) {
                sli[2].isNumberKm = true;
                num = true;
            }
            else if (sli[2].beginToken.previous.isComma) {
            }
            else if (sli[2].beginToken !== sli[2].endToken) 
                num = true;
            else if (AddressItemToken.checkHouseAfter(sli[2].endToken.next, false, true)) 
                num = true;
            else if (sli[2].morph._class.isAdjective && (sli[2].whitespacesBeforeCount < 2)) {
                if (sli[2].endToken.next === null || sli[2].endToken.isComma || sli[2].isNewlineAfter) 
                    num = true;
            }
            if (num) {
                number = sli[2].value;
                if (sli[2].isNumberKm) 
                    number += "км";
                rli.push(sli[2]);
            }
            else 
                sli.splice(2, sli.length - 2);
        }
        else if ((sli.length > 2 && sli[0].typ === StreetItemType.STDADJECTIVE && sli[1].typ === StreetItemType.NOUN) && sli[2].typ === StreetItemType.STDNAME) {
            n0 = 0;
            n1 = -1;
            rli.push(sli[0]);
            rli.push(sli[2]);
            adj = sli[0];
            name = sli[2];
        }
        else 
            return null;
        let secNumber = null;
        for (j = n0; j <= n1; j++) {
            if (sli[j].typ === StreetItemType.NUMBER) {
                if (sli[j].isNewlineBefore && j > 0) 
                    break;
                if (number !== null) {
                    if (name !== null && name.typ === StreetItemType.STDNAME) {
                        secNumber = sli[j].value;
                        if (sli[j].isNumberKm) 
                            secNumber += "км";
                        rli.push(sli[j]);
                        continue;
                    }
                    if (((j + 1) < sli.length) && sli[j + 1].typ === StreetItemType.STDNAME) {
                        secNumber = sli[j].value;
                        if (sli[j].isNumberKm) 
                            secNumber += "км";
                        rli.push(sli[j]);
                        continue;
                    }
                    break;
                }
                if (sli[j].numberType === NumberSpellingType.DIGIT && !sli[j].beginToken.morph._class.isAdjective && !sli[j].endToken.morph._class.isAdjective) {
                    if (sli[j].whitespacesBeforeCount > 2 && j > 0) 
                        break;
                    let nval = 0;
                    let wrapnval442 = new RefOutArgWrapper();
                    Utils.tryParseInt(sli[j].value, wrapnval442);
                    nval = wrapnval442.value;
                    if (nval > 20) {
                        if (j > n0) {
                            if (((j + 1) < sli.length) && ((sli[j + 1].typ === StreetItemType.NOUN || sli[j + 1].value === "ГОДА"))) {
                            }
                            else if ((j + 1) === sli.length && sli[j].beginToken.previous.isHiphen) {
                                let tt = sli[j].endToken.next;
                                if (tt !== null && tt.isComma) 
                                    tt = tt.next;
                                let ait = AddressItemToken.tryParsePureItem(tt, null, null);
                                if (ait !== null && ait.typ === AddressItemType.HOUSE) {
                                }
                                else if (MiscLocationHelper.isUserParamGarAddress(sli[j])) {
                                }
                                else 
                                    break;
                            }
                            else 
                                break;
                        }
                    }
                    if (j === n0 && n0 > 0) {
                    }
                    else if (j === n0 && n0 === 0 && sli[j].whitespacesAfterCount === 1) {
                    }
                    else if (sli[j].numberHasPrefix || sli[j].isNumberKm) {
                    }
                    else if (j === n1 && ((n1 + 1) < sli.length) && sli[n1 + 1].typ === StreetItemType.NOUN) {
                    }
                    else if (!sli[j].isWhitespaceBefore) {
                    }
                    else 
                        break;
                }
                number = sli[j].value;
                if (sli[j].isNumberKm) 
                    number += "км";
                rli.push(sli[j]);
            }
            else if (sli[j].typ === StreetItemType.AGE) {
                if (age !== null) 
                    break;
                age = sli[j].value;
                rli.push(sli[j]);
            }
            else if (sli[j].typ === StreetItemType.STDADJECTIVE) {
                if (adj !== null) {
                    if (j === (sli.length - 1) && !sli[j].isAbridge && name === null) {
                        name = sli[j];
                        rli.push(sli[j]);
                        continue;
                    }
                    else 
                        return null;
                }
                adj = sli[j];
                rli.push(sli[j]);
            }
            else if (sli[j].typ === StreetItemType.NAME || sli[j].typ === StreetItemType.STDNAME || sli[j].typ === StreetItemType.FIX) {
                if (name !== null) {
                    if (j > 1 && sli[j - 2].typ === StreetItemType.NOUN) {
                        if (name.nounCanBeName && sli[j - 2].termin.canonicText === "УЛИЦА" && j === (sli.length - 1)) 
                            noun = name;
                        else if ((isMicroRaion && sli[j - 1].termin !== null && StreetItemToken._isRegion(sli[j - 1].termin.canonicText)) && j === (sli.length - 1)) 
                            noun = name;
                        else 
                            break;
                    }
                    else if (i < j) 
                        break;
                    else 
                        return null;
                }
                name = sli[j];
                rli.push(sli[j]);
            }
            else if (sli[j].typ === StreetItemType.STDPARTOFNAME && j === n1) {
                if (name !== null) 
                    break;
                name = sli[j];
                rli.push(sli[j]);
            }
            else if (sli[j].typ === StreetItemType.NOUN) {
                if ((sli[0] === noun && ((noun.termin.canonicText === "УЛИЦА" || noun.termin.canonicText === "ВУЛИЦЯ")) && j > 0) && name === null) {
                    altNoun = noun;
                    noun = sli[j];
                    rli.push(sli[j]);
                }
                else if (sli[j] === altNoun) 
                    rli.push(sli[j]);
                else 
                    break;
            }
        }
        if (((n1 < i) && number === null && ((i + 1) < sli.length)) && sli[i + 1].typ === StreetItemType.NUMBER && sli[i + 1].numberHasPrefix) {
            number = sli[i + 1].value;
            rli.push(sli[i + 1]);
        }
        else if ((((i < n0) && ((name !== null || adj !== null)) && (j < sli.length)) && sli[j].typ === StreetItemType.NOUN && ((noun.termin.canonicText === "УЛИЦА" || noun.termin.canonicText === "ВУЛИЦЯ"))) && (((sli[j].termin.canonicText === "ПЛОЩАДЬ" || sli[j].termin.canonicText === "БУЛЬВАР" || sli[j].termin.canonicText === "ПЛОЩА") || sli[j].termin.canonicText === "МАЙДАН" || (j + 1) === sli.length))) {
            altNoun = noun;
            noun = sli[j];
            rli.push(sli[j]);
        }
        if ((altNoun !== null && name === null && number === null) && age === null && adj === null) {
            if (noun.termin.canonicText === "УЛИЦА") {
                name = altNoun;
                altNoun = null;
            }
            else if (altNoun.termin.canonicText === "УЛИЦА") {
                name = noun;
                noun = altNoun;
                altNoun = null;
            }
            else if (altNoun.nounCanBeName) {
                name = altNoun;
                altNoun = null;
            }
            if (name !== null) 
                rli.push(name);
        }
        if (altNoun !== null && altNoun.termin.canonicText === "УЛИЦА" && StreetItemToken._isRegion(noun.termin.canonicText)) {
            altNoun = null;
            isMicroRaion = true;
        }
        if (name === null) {
            if (number === null && age === null && adj === null) 
                return null;
            if (noun.isAbridge && !MiscLocationHelper.isUserParamAddress(noun)) {
                if (isMicroRaion || notDoubt) {
                }
                else if (noun.termin !== null && ((noun.termin.canonicText === "ПРОЕЗД" || noun.termin.canonicText === "ПРОЇЗД"))) {
                }
                else if (adj === null || adj.isAbridge) 
                    return null;
            }
            if (adj !== null && adj.isAbridge) {
                if (!noun.isAbridge && MiscLocationHelper.isUserParamAddress(adj)) {
                }
                else if (altNoun !== null) {
                }
                else 
                    return null;
            }
        }
        if (!rli.includes(noun)) 
            rli.push(noun);
        if (altNoun !== null && !rli.includes(altNoun)) 
            rli.push(altNoun);
        let street = new StreetReferent();
        if (!forMetro) {
            street.addTyp(noun.termin.canonicText.toLowerCase());
            if (noun.altTermin !== null) {
                if (noun.altTermin.canonicText === "ПРОСПЕКТ" && number !== null) {
                }
                else 
                    street.addSlot(StreetReferent.ATTR_TYPE, noun.altTermin.canonicText.toLowerCase(), false, 0);
            }
            if (altNoun !== null) {
                street.addTyp(altNoun.termin.canonicText.toLowerCase());
                if (altNoun.altTermin !== null) 
                    street.addTyp(altNoun.altTermin.canonicText.toLowerCase());
            }
        }
        else 
            street.addTyp("метро");
        street.tag = noun;
        let res = AddressItemToken._new293(AddressItemType.STREET, rli[0].beginToken, rli[0].endToken, street);
        if (noun.termin.canonicText === "ЛИНИЯ") {
            if (number === null) {
                if (MiscLocationHelper.checkGeoObjectBefore(sli[0].beginToken, false)) {
                }
                else 
                    return null;
            }
            res.isDoubt = true;
        }
        else if (noun.termin.canonicText === "ПУНКТ") {
            if (!MiscLocationHelper.checkGeoObjectBefore(sli[0].beginToken, false)) 
                return null;
            if (name === null || number !== null) 
                return null;
        }
        for (const r of rli) {
            if (res.beginChar > r.beginChar) 
                res.beginToken = r.beginToken;
            if (res.endChar < r.endChar) 
                res.endToken = r.endToken;
        }
        if (forMetro && rli.includes(noun) && noun.termin.canonicText === "МЕТРО") 
            Utils.removeItem(rli, noun);
        if (noun.isAbridge && (noun.lengthChar < 4)) 
            res.isDoubt = true;
        else if (noun.nounIsDoubtCoef > 0 && !notDoubt && !MiscLocationHelper.isUserParamAddress(noun)) {
            res.isDoubt = true;
            if ((name !== null && name.endChar > noun.endChar && noun.chars.isAllLower) && !name.chars.isAllLower && !(name.beginToken instanceof ReferentToken)) {
                let npt2 = MiscLocationHelper.tryParseNpt(name.beginToken);
                if (npt2 !== null && npt2.endChar > name.endChar) {
                }
                else if (AddressItemToken.checkHouseAfter(res.endToken.next, false, false)) 
                    res.isDoubt = false;
                else if (name.chars.isCapitalUpper && noun.nounIsDoubtCoef === 1) 
                    res.isDoubt = false;
            }
        }
        let nameBase = new StringBuilder();
        let nameAlt = new StringBuilder();
        let nameAlt2 = null;
        let gen = noun.termin.gender;
        let adjGen = MorphGender.UNDEFINED;
        if (number !== null) {
            street.numbers = number;
            if (secNumber !== null) 
                street.numbers = secNumber;
        }
        if (age !== null) 
            street.numbers = age;
        let miscs = null;
        if (name !== null && name.value !== null) {
            if (name.value.indexOf(' ') > 0 && name.beginToken.next === name.endToken) {
                let ty = OrgTypToken.tryParse(name.endToken, false, null);
                if (ty !== null && ty.vals.length > 0) {
                    name = name.clone();
                    name.altValue = null;
                    name.endToken = name.endToken.previous;
                    miscs = ty.vals;
                    name.value = name.value.substring(0, 0 + name.value.indexOf(' '));
                }
                else {
                    let nn = StreetItemToken.tryParse(name.endToken, null, false, null);
                    if (nn !== null && nn.typ === StreetItemType.NOUN && nn.termin.canonicText !== "МОСТ") {
                        name = name.clone();
                        name.altValue = null;
                        name.value = name.value.substring(0, 0 + name.value.indexOf(' '));
                        name.endToken = name.endToken.previous;
                        street.addTyp(nn.termin.canonicText.toLowerCase());
                        let ss = street.findSlot(StreetReferent.ATTR_TYPE, "улица", true);
                        if (ss !== null) 
                            Utils.removeItem(street.slots, ss);
                    }
                }
            }
            if (name.altValue !== null && nameAlt.length === 0) 
                nameAlt.append(nameBase.toString()).append(" ").append(name.altValue);
            nameBase.append(" ").append(name.value);
        }
        else if ((name !== null && name.termin !== null && number !== null) && (StreetItemType.of(name.termin.tag)) === StreetItemType.NOUN) 
            street.addTyp(name.termin.canonicText.toLowerCase());
        else if (name !== null) {
            let isAdj = false;
            if (name.endToken instanceof TextToken) {
                for (const wf of name.endToken.morph.items) {
                    if ((wf instanceof MorphWordForm) && wf.isInDictionary) {
                        isAdj = wf._class.isAdjective | wf._class.isProperGeo;
                        adjGen = wf.gender;
                        break;
                    }
                    else if (wf._class.isAdjective | wf._class.isProperGeo) 
                        isAdj = true;
                }
            }
            if (isAdj) {
                let tmp = new StringBuilder();
                let vars = new Array();
                for (let t = name.beginToken; t !== null; t = t.next) {
                    let tt = Utils.as(t, TextToken);
                    if (tt === null) 
                        break;
                    if (tmp.length > 0 && tmp.charAt(tmp.length - 1) !== ' ') 
                        tmp.append(' ');
                    if (t === name.endToken) {
                        let isPadez = false;
                        if (!noun.isAbridge) {
                            if (!noun.morph._case.isUndefined && !noun.morph._case.isNominative) 
                                isPadez = true;
                            else if (noun.termin.canonicText === "ШОССЕ" || noun.termin.canonicText === "ШОСЕ") 
                                isPadez = true;
                        }
                        if (res.beginToken.previous !== null && res.beginToken.previous.morph._class.isPreposition) 
                            isPadez = true;
                        if (isProezd) 
                            isPadez = true;
                        if (!isPadez) {
                            tmp.append(tt.term);
                            break;
                        }
                        for (const wf of tt.morph.items) {
                            if (((wf._class.isAdjective || wf._class.isProperGeo)) && ((wf.gender.value()) & (gen.value())) !== (MorphGender.UNDEFINED.value())) {
                                if (noun.morph._case.isUndefined || !(MorphCase.ooBitand(wf._case, noun.morph._case)).isUndefined) {
                                    let wff = Utils.as(wf, MorphWordForm);
                                    if (wff === null) 
                                        continue;
                                    if (gen === MorphGender.MASCULINE && wff.normalCase.endsWith("ОЙ")) 
                                        continue;
                                    if (wff.normalCase.endsWith("СКИ")) 
                                        continue;
                                    if (!vars.includes(wff.normalCase)) 
                                        vars.push(wff.normalCase);
                                }
                            }
                        }
                        if (!vars.includes(tt.term) && sli.indexOf(name) > sli.indexOf(noun)) 
                            vars.push(tt.term);
                        if (vars.length === 0) 
                            vars.push(tt.term);
                        if (isProezd) {
                            let nnn = tt.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false);
                            if (nnn === null) 
                                nnn = tt.lemma;
                            if (!vars.includes(nnn)) 
                                vars.push(nnn);
                        }
                        break;
                    }
                    if (!tt.isHiphen) 
                        tmp.append(tt.term);
                }
                if (vars.length === 0) 
                    nameBase.append(" ").append(tmp.toString());
                else {
                    let head = nameBase.toString();
                    nameBase.append(" ").append(tmp.toString()).append(vars[0]);
                    let src = MiscHelper.getTextValueOfMetaToken(name, GetTextAttr.NO);
                    let ii = vars.indexOf(src);
                    if (ii > 1) {
                        vars.splice(ii, 1);
                        vars.splice(1, 0, src);
                    }
                    else if (ii < 0) 
                        vars.splice(1, 0, src);
                    if (vars.length > 1) {
                        nameAlt.length = 0;
                        nameAlt.append(head).append(" ").append(tmp.toString()).append(vars[1]);
                    }
                    if (vars.length > 2) 
                        nameAlt2 = (head + " " + tmp.toString() + vars[2]);
                }
            }
            else {
                let strNam = null;
                let nits = new Array();
                let hasAdj = false;
                let hasProperName = false;
                for (let t = name.beginToken; t !== null && t.endChar <= name.endChar; t = t.next) {
                    if (t.morph._class.isAdjective || t.morph._class.isConjunction) 
                        hasAdj = true;
                    if ((t instanceof TextToken) && !t.isHiphen) {
                        if (name.termin !== null) {
                            nits.push(name.termin.canonicText);
                            break;
                        }
                        else if (!t.chars.isLetter && nits.length > 0) 
                            nits[nits.length - 1] += t.term;
                        else {
                            nits.push(t.term);
                            if (t === name.beginToken && t.getMorphClassInDictionary().isProperName) 
                                hasProperName = true;
                        }
                    }
                    else if ((t instanceof ReferentToken) && name.termin === null) 
                        nits.push(t.getSourceText().toUpperCase());
                }
                if (!hasAdj && !hasProperName && !name.isInDictionary) 
                    nits.sort();
                strNam = nits.join(" ");
                if (hasProperName && nits.length === 2) {
                    nameAlt.length = 0;
                    nameAlt.append(nameBase.toString()).append(" ").append(nits[1]);
                }
                nameBase.append(" ").append(strNam);
                if (name.org !== null && name.org.referent.findSlot("NUMBER", null, true) !== null) 
                    street.addSlot("NUMBER", name.org.referent.getStringValue("NUMBER"), false, 0);
            }
        }
        let adjStr = null;
        let adjStr2 = null;
        let adjCanBeInitial = false;
        if (adj !== null) {
            let s = null;
            let ss = null;
            if (adjGen === MorphGender.UNDEFINED && name !== null && ((name.morph.number.value()) & (MorphNumber.PLURAL.value())) === (MorphNumber.UNDEFINED.value())) {
                if (name.morph.gender === MorphGender.FEMINIE || name.morph.gender === MorphGender.MASCULINE || name.morph.gender === MorphGender.NEUTER) 
                    adjGen = name.morph.gender;
            }
            if (name !== null && ((name.morph.number.value()) & (MorphNumber.PLURAL.value())) !== (MorphNumber.UNDEFINED.value())) {
                try {
                    s = MorphologyService.getWordform(adj.termin.canonicText, MorphBaseInfo._new444(MorphClass.ADJECTIVE, MorphNumber.PLURAL));
                    if (adj.altTermin !== null) 
                        ss = MorphologyService.getWordform(adj.altTermin.canonicText, MorphBaseInfo._new444(MorphClass.ADJECTIVE, MorphNumber.PLURAL));
                } catch (ex) {
                }
            }
            else if (adjGen !== MorphGender.UNDEFINED) {
                try {
                    s = MorphologyService.getWordform(adj.termin.canonicText, MorphBaseInfo._new446(MorphClass.ADJECTIVE, adjGen));
                    if (adj.altTermin !== null) 
                        ss = MorphologyService.getWordform(adj.altTermin.canonicText, MorphBaseInfo._new446(MorphClass.ADJECTIVE, adjGen));
                } catch (ex) {
                }
            }
            else if (((adj.morph.gender.value()) & (gen.value())) === (MorphGender.UNDEFINED.value())) {
                try {
                    let ggg = noun.termin.gender;
                    s = MorphologyService.getWordform(adj.termin.canonicText, MorphBaseInfo._new446(MorphClass.ADJECTIVE, ggg));
                    if (adj.altTermin !== null) 
                        ss = MorphologyService.getWordform(adj.altTermin.canonicText, MorphBaseInfo._new446(MorphClass.ADJECTIVE, ggg));
                } catch (ex) {
                }
            }
            else 
                try {
                    s = MorphologyService.getWordform(adj.termin.canonicText, MorphBaseInfo._new446(MorphClass.ADJECTIVE, gen));
                    if (adj.altTermin !== null) 
                        ss = MorphologyService.getWordform(adj.altTermin.canonicText, MorphBaseInfo._new446(MorphClass.ADJECTIVE, gen));
                } catch (ex) {
                }
            adjStr = s;
            adjStr2 = ss;
            if (name !== null) {
                if (adj.endToken.isChar('.') && adj.lengthChar <= 3 && !adj.beginToken.chars.isAllLower) 
                    adjCanBeInitial = true;
            }
        }
        let s1 = nameBase.toString().trim();
        let s2 = nameAlt.toString().trim();
        if ((s1.length < 3) && street.kind !== StreetKind.ROAD) {
            if (street.numbers !== null) {
                if (adjStr !== null) {
                    if (adj.isAbridge) 
                        return null;
                    street.addSlot(StreetReferent.ATTR_NAME, adjStr, false, 0);
                }
                else if (MiscLocationHelper.isUserParamAddress(res) && s1.length > 0) 
                    street.addSlot(StreetReferent.ATTR_NAME, s1, false, 0);
            }
            else if (adjStr === null) {
                if (s1.length < 1) 
                    return null;
                if (isMicroRaion || MiscLocationHelper.isUserParamAddress(res)) {
                    street.addSlot(StreetReferent.ATTR_NAME, s1, false, 0);
                    if (!Utils.isNullOrEmpty(s2)) 
                        street.addSlot(StreetReferent.ATTR_NAME, s2, false, 0);
                }
                else 
                    return null;
            }
            else {
                if (adj.isAbridge && !MiscLocationHelper.isUserParamAddress(adj) && altNoun === null) 
                    return null;
                street.addSlot(StreetReferent.ATTR_NAME, adjStr, false, 0);
            }
        }
        else if (adjCanBeInitial) {
            street.addSlot(StreetReferent.ATTR_NAME, s1, false, 0);
            street.addSlot(StreetReferent.ATTR_NAME, MiscHelper.getTextValue(adj.beginToken, name.endToken, GetTextAttr.NO), false, 0);
            street.addSlot(StreetReferent.ATTR_NAME, (adjStr + " " + s1), false, 0);
            if (adjStr2 !== null) 
                street.addSlot(StreetReferent.ATTR_NAME, (adjStr2 + " " + s1), false, 0);
        }
        else if (adjStr === null) {
            if (!Utils.isNullOrEmpty(s1)) 
                street.addSlot(StreetReferent.ATTR_NAME, s1, false, 0);
        }
        else {
            street.addSlot(StreetReferent.ATTR_NAME, (adjStr + " " + s1), false, 0);
            if (adjStr2 !== null) 
                street.addSlot(StreetReferent.ATTR_NAME, (adjStr2 + " " + s1), false, 0);
        }
        if (nameAlt.length > 0) {
            s1 = nameAlt.toString().trim();
            if (adjStr === null) 
                street.addSlot(StreetReferent.ATTR_NAME, s1, false, 0);
            else {
                street.addSlot(StreetReferent.ATTR_NAME, (adjStr + " " + s1), false, 0);
                if (adjStr2 !== null) 
                    street.addSlot(StreetReferent.ATTR_NAME, (adjStr2 + " " + s1), false, 0);
            }
        }
        if (nameAlt2 !== null) {
            if (adjStr === null) {
                if (forMetro && noun !== null) 
                    street.addSlot(StreetReferent.ATTR_NAME, (altNoun.termin.canonicText + " " + nameAlt2.trim()), false, 0);
                else 
                    street.addSlot(StreetReferent.ATTR_NAME, nameAlt2.trim(), false, 0);
            }
            else {
                street.addSlot(StreetReferent.ATTR_NAME, (adjStr + " " + nameAlt2.trim()), false, 0);
                if (adjStr2 !== null) 
                    street.addSlot(StreetReferent.ATTR_NAME, (adjStr2 + " " + nameAlt2.trim()), false, 0);
            }
        }
        if (name !== null && name.altValue2 !== null) 
            street.addSlot(StreetReferent.ATTR_NAME, name.altValue2, false, 0);
        if ((name !== null && adj === null && name.existStreet !== null) && !forMetro) {
            for (const n of name.existStreet.names) {
                street.addSlot(StreetReferent.ATTR_NAME, n, false, 0);
            }
        }
        if (miscs !== null) {
            for (const m of miscs) {
                street.addSlot(StreetReferent.ATTR_MISC, m, false, 0);
            }
        }
        if (altNoun !== null && !forMetro) 
            street.addTyp(altNoun.termin.canonicText.toLowerCase());
        if (noun.termin.canonicText === "ПЛОЩАДЬ" || noun.termin.canonicText === "КВАРТАЛ" || noun.termin.canonicText === "ПЛОЩА") {
            res.isDoubt = true;
            if (name !== null && name.isInDictionary) 
                res.isDoubt = false;
            else if (altNoun !== null || forMetro || adj !== null) 
                res.isDoubt = false;
            else if (name !== null && StreetItemToken.checkStdName(name.beginToken) !== null) 
                res.isDoubt = false;
            else if (res.beginToken.previous === null || MiscLocationHelper.checkGeoObjectBefore(res.beginToken.previous, false)) {
                if (res.endToken.next === null || AddressItemToken.checkHouseAfter(res.endToken.next, false, true)) 
                    res.isDoubt = false;
            }
        }
        if (name !== null && adj === null && name.stdAdjVersion !== null) {
            let nams = street.names;
            for (const n of nams) {
                if (n.indexOf(' ') < 0) {
                    let adjs = MiscLocationHelper.getStdAdjFull(name.stdAdjVersion.beginToken, noun.termin.gender, MorphNumber.SINGULAR, false);
                    if (adjs !== null && adjs.length > 0) {
                        for (const a of adjs) {
                            street.addSlot(StreetReferent.ATTR_NAME, (a + " " + n), false, 0);
                        }
                    }
                    else {
                        street.addSlot(StreetReferent.ATTR_NAME, (name.stdAdjVersion.termin.canonicText + " " + n), false, 0);
                        if (name.stdAdjVersion.altTermin !== null) 
                            street.addSlot(StreetReferent.ATTR_NAME, (name.stdAdjVersion.altTermin.canonicText + " " + n), false, 0);
                    }
                }
            }
        }
        if (LanguageHelper.endsWith(noun.termin.canonicText, "ГОРОДОК")) {
            street.kind = StreetKind.AREA;
            for (const s of street.slots) {
                if (s.typeName === StreetReferent.ATTR_TYPE) 
                    street.uploadSlot(s, "микрорайон");
                else if (s.typeName === StreetReferent.ATTR_NAME) 
                    street.uploadSlot(s, (noun.termin.canonicText + " " + s.value));
            }
            if (street.findSlot(StreetReferent.ATTR_NAME, null, true) === null) 
                street.addSlot(StreetReferent.ATTR_NAME, noun.termin.canonicText, false, 0);
        }
        let t1 = res.endToken.next;
        if (t1 !== null && t1.isComma) 
            t1 = t1.next;
        let non = StreetItemToken.tryParse(t1, null, false, null);
        if (non !== null && non.typ === StreetItemType.NOUN && street.typs.length > 0) {
            if (AddressItemToken.checkHouseAfter(non.endToken.next, false, true)) {
                street.correct();
                let nams = street.names;
                for (const t of street.typs) {
                    if (t !== "улица") {
                        for (const n of nams) {
                            street.addSlot(StreetReferent.ATTR_NAME, (t.toUpperCase() + " " + n), false, 0);
                        }
                    }
                }
                street.addSlot(StreetReferent.ATTR_TYPE, non.termin.canonicText.toLowerCase(), false, 0);
                res.endToken = non.endToken;
            }
        }
        if (street.findSlot(StreetReferent.ATTR_NAME, "ПРОЕКТИРУЕМЫЙ", true) !== null && street.numbers === null) {
            if (non !== null && non.typ === StreetItemType.NUMBER) {
                street.numbers = non.value;
                res.endToken = non.endToken;
            }
            else {
                let ttt = MiscHelper.checkNumberPrefix(res.endToken.next);
                if (ttt !== null) {
                    non = StreetItemToken.tryParse(ttt, null, false, null);
                    if (non !== null && non.typ === StreetItemType.NUMBER) {
                        street.numbers = non.value;
                        res.endToken = non.endToken;
                    }
                }
            }
        }
        if (res.isDoubt) {
            if (noun.isRoad) {
                street.kind = StreetKind.ROAD;
                let num = street.numbers;
                if (num !== null && num.includes("км")) 
                    res.isDoubt = false;
                else if (AddressItemToken.checkKmAfter(res.endToken.next)) 
                    res.isDoubt = false;
                else if (AddressItemToken.checkKmBefore(res.beginToken.previous)) 
                    res.isDoubt = false;
            }
            else if (noun.termin.canonicText === "ПРОЕЗД" && street.findSlot(StreetReferent.ATTR_NAME, "ПРОЕКТИРУЕМЫЙ", true) !== null) 
                res.isDoubt = false;
            for (let tt0 = res.beginToken.previous; tt0 !== null; tt0 = tt0.previous) {
                if (tt0.isCharOf(",.") || tt0.isCommaAnd) 
                    continue;
                let str0 = Utils.as(tt0.getReferent(), StreetReferent);
                if (str0 !== null) 
                    res.isDoubt = false;
                break;
            }
            if (res.isDoubt) {
                if (BracketHelper.canBeStartOfSequence(res.beginToken.previous, true, false) && BracketHelper.canBeEndOfSequence(res.endToken.next, true, null, false)) 
                    return null;
                if (isProezd) 
                    res.isDoubt = false;
                else if (AddressItemToken.checkHouseAfter(res.endToken.next, false, false)) 
                    res.isDoubt = false;
                else if (AddressItemToken.checkStreetAfter(res.endToken.next, false)) 
                    res.isDoubt = false;
                else if (MiscLocationHelper.checkGeoObjectBefore(res.beginToken, false)) 
                    res.isDoubt = false;
                for (let ttt = res.beginToken.next; ttt !== null && ttt.endChar <= res.endChar; ttt = ttt.next) {
                    if (ttt.isNewlineBefore) 
                        res.isDoubt = true;
                }
            }
        }
        if (noun.termin.canonicText === "КВАРТАЛ" && (res.whitespacesAfterCount < 2) && number === null) {
            let ait = AddressItemToken.tryParsePureItem(res.endToken.next, null, null);
            if (ait !== null && ait.typ === AddressItemType.NUMBER && ait.value !== null) {
                street.addSlot(StreetReferent.ATTR_NUMBER, ait.value, false, 0);
                res.endToken = ait.endToken;
            }
        }
        if (age !== null && street.findSlot(StreetReferent.ATTR_NAME, null, true) === null) 
            street.addSlot(StreetReferent.ATTR_NAME, "ЛЕТ", false, 0);
        if (name !== null) 
            street.addMisc(name.misc);
        if (street.numbers === null && ((street.kind === StreetKind.ROAD || street.kind === StreetKind.RAILWAY))) {
            t1 = res.endToken.next;
            if (t1 !== null && t1.isComma) 
                t1 = t1.next;
            let sit = StreetItemToken.tryParse(t1, null, false, null);
            if (sit !== null && sit.isNumberKm) {
                res.endToken = sit.endToken;
                street.numbers = sit.value + "км";
            }
        }
        for (const r of rli) {
            if (r.ortoTerr !== null) {
                res.ortoTerr = r.ortoTerr;
                break;
            }
        }
        if (noun.isRoad) {
            let nam2 = StreetItemToken.tryParseSpec(res.endToken.next, noun);
            if (nam2 !== null && nam2.length === 1 && nam2[0].isRoadName) {
                res.endToken = nam2[0].endToken;
                street.addName(nam2[0]);
            }
        }
        return res;
    }
    
    static tryDetectNonNoun(sli, ontoRegim, forMetro, streetBefore, crossStreet) {
        const OrgItemToken = require("./../../geo/internal/OrgItemToken");
        if (sli.length > 1 && sli[sli.length - 1].typ === StreetItemType.NUMBER && !sli[sli.length - 1].numberHasPrefix) 
            sli.splice(sli.length - 1, 1);
        let street = null;
        if (sli.length === 1 && ((sli[0].typ === StreetItemType.NAME || sli[0].typ === StreetItemType.STDNAME || sli[0].typ === StreetItemType.STDADJECTIVE)) && ((ontoRegim || forMetro))) {
            let s = MiscHelper.getTextValue(sli[0].beginToken, sli[0].endToken, GetTextAttr.NO);
            if (s === null) 
                return null;
            if (!forMetro && !sli[0].isInDictionary && sli[0].existStreet === null) {
                let tt = sli[0].endToken.next;
                if (tt !== null && tt.isComma) 
                    tt = tt.next;
                let ait1 = AddressItemToken.tryParsePureItem(tt, null, null);
                if (ait1 !== null && ((ait1.typ === AddressItemType.NUMBER || ait1.typ === AddressItemType.HOUSE))) {
                }
                else if (((tt === null || tt.isComma || tt.isNewlineBefore)) && MiscLocationHelper.isUserParamAddress(sli[0])) {
                }
                else 
                    return null;
            }
            street = new StreetReferent();
            if (forMetro) 
                street.addSlot(StreetReferent.ATTR_TYPE, "метро", false, 0);
            if (sli[0].value !== null) 
                street.addSlot(StreetReferent.ATTR_NAME, sli[0].value, false, 0);
            if (sli[0].altValue !== null) 
                street.addSlot(StreetReferent.ATTR_NAME, sli[0].altValue, false, 0);
            if (sli[0].altValue2 !== null) 
                street.addSlot(StreetReferent.ATTR_NAME, sli[0].altValue2, false, 0);
            street.addMisc(sli[0].misc);
            street.addSlot(StreetReferent.ATTR_NAME, s, false, 0);
            let res0 = AddressItemToken._new440(AddressItemType.STREET, sli[0].beginToken, sli[0].endToken, street, true);
            if (sli[0].isInBrackets) 
                res0.isDoubt = false;
            return res0;
        }
        if ((sli.length === 1 && sli[0].typ === StreetItemType.NUMBER && sli[0].isNumberKm) && MiscLocationHelper.isUserParamAddress(sli[0])) {
            street = new StreetReferent();
            street.numbers = sli[0].value + "км";
            let res0 = AddressItemToken._new440(AddressItemType.STREET, sli[0].beginToken, sli[0].endToken, street, true);
            return res0;
        }
        if ((sli.length === 1 && sli[0].typ === StreetItemType.NUMBER && sli[0].beginToken.morph._class.isAdjective) && MiscLocationHelper.isUserParamAddress(sli[0])) {
            if (streetBefore) 
                return null;
            street = new StreetReferent();
            street.numbers = sli[0].value;
            let res0 = AddressItemToken._new440(AddressItemType.STREET, sli[0].beginToken, sli[0].endToken, street, true);
            return res0;
        }
        let i1 = 0;
        if (sli.length === 1 && (((sli[0].typ === StreetItemType.STDNAME || sli[0].typ === StreetItemType.NAME || sli[0].typ === StreetItemType.STDADJECTIVE) || ((sli[0].typ === StreetItemType.NOUN && sli[0].nounCanBeName))))) {
            if (!ontoRegim) {
                let isStreetBefore = streetBefore;
                let tt = sli[0].beginToken.previous;
                let sBefor = null;
                if ((tt !== null && tt.isCommaAnd && tt.previous !== null) && (tt.previous.getReferent() instanceof StreetReferent)) {
                    isStreetBefore = true;
                    sBefor = Utils.as(tt.previous.getReferent(), StreetReferent);
                }
                let cou = 0;
                for (tt = sli[0].endToken.next; tt !== null; tt = tt.next) {
                    if (!tt.isCommaAnd || tt.next === null) 
                        break;
                    let sli2 = StreetItemToken.tryParseList(tt.next, 10, null);
                    if (sli2 === null) 
                        break;
                    let noun = null;
                    let empty = true;
                    for (const si of sli2) {
                        if (si.typ === StreetItemType.NOUN) 
                            noun = si;
                        else if ((si.typ === StreetItemType.NAME || si.typ === StreetItemType.STDNAME || si.typ === StreetItemType.NUMBER) || si.typ === StreetItemType.STDADJECTIVE) 
                            empty = false;
                    }
                    if (empty) 
                        break;
                    if (noun === null) {
                        if (tt.isAnd && !isStreetBefore) 
                            break;
                        if ((++cou) > 4) 
                            break;
                        tt = sli2[sli2.length - 1].endToken;
                        continue;
                    }
                    if (!tt.isAnd && !isStreetBefore) 
                        break;
                    if (noun === sli2[0]) {
                        if (sBefor !== null && (sBefor.tag instanceof StreetItemToken)) 
                            noun = Utils.as(sBefor.tag, StreetItemToken);
                        else if (sBefor !== null && sBefor.typs.length > 0) {
                            noun = StreetItemToken._new455(tt, tt, StreetItemType.NOUN, sBefor.typs[0]);
                            noun.termin = new Termin(sBefor.typs[0]);
                        }
                        else 
                            break;
                    }
                    let tmp = new Array();
                    tmp.push(sli[0]);
                    tmp.push(noun);
                    let re = StreetDefineHelper.tryParseStreet(tmp, false, forMetro, false, null);
                    if (re !== null) {
                        re.beginToken = sli[0].beginToken;
                        re.endToken = sli[0].endToken;
                        return re;
                    }
                }
                if (crossStreet !== null) 
                    i1 = 0;
                else if (sBefor !== null && (sBefor.tag instanceof StreetItemToken)) {
                    let tmp = new Array();
                    tmp.push(sli[0]);
                    tmp.push(Utils.as(sBefor.tag, StreetItemToken));
                    let re = StreetDefineHelper.tryParseStreet(tmp, false, forMetro, false, null);
                    if (re !== null) {
                        re.beginToken = sli[0].beginToken;
                        re.endToken = sli[0].endToken;
                        return re;
                    }
                }
            }
            if (sli[0].whitespacesAfterCount < 2) {
                let tt = MiscLocationHelper.checkTerritory(sli[0].endToken.next);
                if (tt !== null) {
                    let ok1 = false;
                    if ((tt.isNewlineAfter || tt.next === null || tt.next.isComma) || tt.next.isChar(')')) 
                        ok1 = true;
                    else if (AddressItemToken.checkHouseAfter(tt.next, false, false)) 
                        ok1 = true;
                    else if (AddressItemToken.checkStreetAfter(tt.next, false)) 
                        ok1 = true;
                    if (ok1) {
                        street = new StreetReferent();
                        street.addTyp("территория");
                        street.kind = StreetKind.AREA;
                        street.addSlot(StreetReferent.ATTR_NAME, (sli[0].value != null ? sli[0].value : MiscHelper.getTextValueOfMetaToken(sli[0], GetTextAttr.NO)), false, 0);
                        if (sli[0].altValue !== null) 
                            street.addSlot(StreetReferent.ATTR_NAME, sli[0].altValue, false, 0);
                        if (sli[0].altValue2 !== null) 
                            street.addSlot(StreetReferent.ATTR_NAME, sli[0].altValue2, false, 0);
                        street.addMisc(sli[0].misc);
                        return AddressItemToken._new293(AddressItemType.STREET, sli[0].beginToken, tt, street);
                    }
                }
            }
            if (!MiscLocationHelper.isUserParamAddress(sli[0]) && !streetBefore) {
                if (MiscLocationHelper.checkGeoObjectBefore(sli[0].beginToken, false)) {
                }
                else if (AddressItemToken.checkHouseAfter(sli[0].endToken.next, false, false)) {
                    let tt2 = sli[0].endToken.next;
                    if (tt2.isComma) 
                        tt2 = tt2.next;
                    let ait = AddressItemToken.tryParsePureItem(tt2, null, null);
                    if ((ait !== null && ((ait.typ === AddressItemType.HOUSE || ait.typ === AddressItemType.BUILDING || ait.typ === AddressItemType.CORPUS)) && !Utils.isNullOrEmpty(ait.value)) && ait.value !== "0" && Utils.isDigit(ait.value[0])) {
                    }
                    else 
                        return null;
                }
                else 
                    return null;
            }
        }
        else if (sli.length === 2 && ((sli[0].typ === StreetItemType.STDADJECTIVE || sli[0].typ === StreetItemType.NUMBER || sli[0].typ === StreetItemType.AGE)) && ((sli[1].typ === StreetItemType.STDNAME || sli[1].typ === StreetItemType.NAME))) {
            if (streetBefore) {
                let ait = AddressItemToken.tryParsePureItem(sli[0].beginToken, null, null);
                if (ait !== null && ait.value !== null) 
                    return null;
            }
            if (sli[0].typ === StreetItemType.NUMBER && sli[1].typ === StreetItemType.NAME) {
                if (AddressItemToken.tryParsePureItem(sli[1].beginToken, null, null) !== null) 
                    return null;
            }
            i1 = 1;
        }
        else if (sli.length === 2 && ((sli[0].typ === StreetItemType.STDNAME || sli[0].typ === StreetItemType.NAME)) && ((sli[1].typ === StreetItemType.NUMBER || sli[1].typ === StreetItemType.STDADJECTIVE))) {
            if (!MiscLocationHelper.isUserParamAddress(sli[0])) 
                return null;
            i1 = 0;
        }
        else if ((sli.length === 3 && ((sli[0].typ === StreetItemType.STDNAME || sli[0].typ === StreetItemType.NAME)) && sli[1].typ === StreetItemType.NUMBER) && sli[2].typ === StreetItemType.STDNAME) 
            i1 = 0;
        else if (sli.length === 1 && sli[0].typ === StreetItemType.NUMBER && sli[0].isNumberKm) {
            for (let tt = sli[0].beginToken.previous; tt !== null; tt = tt.previous) {
                if (tt.lengthChar === 1) 
                    continue;
                let geo = Utils.as(tt.getReferent(), GeoReferent);
                if (geo === null) 
                    break;
                let ok1 = false;
                if (geo.findSlot(GeoReferent.ATTR_TYPE, "станция", true) !== null) 
                    ok1 = true;
                if (ok1) {
                    street = new StreetReferent();
                    street.addSlot(StreetReferent.ATTR_NUMBER, (sli[0].value + "км"), false, 0);
                    let res0 = AddressItemToken._new440(AddressItemType.STREET, sli[0].beginToken, sli[0].endToken, street, true);
                    if (sli[0].isInBrackets) 
                        res0.isDoubt = false;
                    return res0;
                }
            }
            return null;
        }
        else 
            return null;
        let val = sli[i1].value;
        let altVal = sli[i1].altValue;
        if (altVal === val) 
            altVal = null;
        let miscs = null;
        if (val !== null && val.indexOf(' ') > 0 && sli[i1].beginToken.next === sli[i1].endToken) {
            let ty = OrgTypToken.tryParse(sli[i1].endToken, false, null);
            if (ty !== null && ty.vals.length > 0) {
                altVal = null;
                miscs = ty.vals;
                val = val.substring(0, 0 + val.indexOf(' '));
            }
        }
        if (sli[i1].value === null && sli[i1].termin !== null && sli[i1].typ === StreetItemType.NOUN) 
            val = sli[i1].termin.canonicText;
        let stdAdjProb = sli[i1].stdAdjVersion;
        if (val === null) {
            if (sli[i1].existStreet !== null) {
                let names = sli[i1].existStreet.names;
                if (names.length > 0) {
                    val = names[0];
                    if (names.length > 1) 
                        altVal = names[1];
                }
            }
            else {
                let te = Utils.as(sli[i1].beginToken, TextToken);
                if (te !== null) {
                    for (const wf of te.morph.items) {
                        if (wf._class.isAdjective && wf.gender === MorphGender.FEMINIE && !wf.containsAttr("к.ф.", null)) {
                            val = wf.normalCase;
                            break;
                        }
                    }
                }
                if (i1 > 0 && sli[0].typ === StreetItemType.AGE) 
                    val = MiscHelper.getTextValueOfMetaToken(sli[i1], GetTextAttr.NO);
                else {
                    altVal = MiscHelper.getTextValueOfMetaToken(sli[i1], GetTextAttr.NO);
                    if (val === null && te.morph._class.isAdjective) {
                        val = altVal;
                        altVal = null;
                    }
                }
                if (sli.length > 1 && val === null && altVal !== null) {
                    val = altVal;
                    altVal = null;
                }
            }
        }
        let veryDoubt = false;
        if (val === null && sli.length === 1 && sli[0].chars.isCapitalUpper) {
            veryDoubt = true;
            let t0 = sli[0].beginToken.previous;
            if (t0 !== null && t0.isChar(',')) 
                t0 = t0.previous;
            if ((t0 instanceof ReferentToken) && (t0.getReferent() instanceof GeoReferent)) 
                val = MiscHelper.getTextValue(sli[0].beginToken, sli[0].endToken, GetTextAttr.NO);
        }
        if (val === null) 
            return null;
        let t = sli[sli.length - 1].endToken.next;
        if (t !== null && t.isChar(',')) 
            t = t.next;
        if (t === null) {
            if (!MiscLocationHelper.isUserParamAddress(sli[0])) 
                return null;
        }
        let ok = false;
        let doubt = true;
        if (sli[i1].termin !== null && (StreetItemType.of(sli[i1].termin.tag)) === StreetItemType.FIX) {
            ok = true;
            doubt = false;
        }
        else if (((sli[i1].existStreet !== null || sli[0].existStreet !== null)) && sli[0].beginToken !== sli[i1].endToken) {
            ok = true;
            doubt = false;
            if (t.kit.processReferent("PERSON", sli[0].beginToken, null) !== null) {
                if (AddressItemToken.checkHouseAfter(t, false, false)) {
                }
                else 
                    doubt = true;
            }
        }
        else if (crossStreet !== null) 
            ok = true;
        else if (t === null) 
            ok = true;
        else if (t.isCharOf("\\/")) 
            ok = true;
        else if (AddressItemToken.checkHouseAfter(t, false, false)) {
            if (t.previous !== null) {
                if (t.previous.isValue("АРЕНДА", "ОРЕНДА") || t.previous.isValue("СДАЧА", "ЗДАЧА") || t.previous.isValue("СЪЕМ", "ЗНІМАННЯ")) 
                    return null;
            }
            let vv = MiscLocationHelper.tryParseNpt(t.previous);
            if (vv !== null && vv.endChar >= t.beginChar) 
                return null;
            ok = true;
        }
        else if (MiscLocationHelper.isUserParamAddress(t) && ((t.isNewlineBefore || t.isValue("Д", null)))) 
            ok = true;
        else if (sli[0].typ === StreetItemType.AGE && MiscLocationHelper.isUserParamAddress(sli[0])) 
            ok = true;
        else if ((t.isChar('(') && (t.next instanceof ReferentToken) && (t.next.getReferent() instanceof GeoReferent)) && t.next.getReferent().isCity) 
            ok = true;
        else {
            let ait = AddressItemToken.tryParsePureItem(t, null, null);
            if (ait === null) 
                return null;
            if (ait.typ === AddressItemType.HOUSE && ait.value !== null) 
                ok = true;
            else if (veryDoubt) 
                return null;
            else if (((val === "ТАБЛИЦА" || val === "РИСУНОК" || val === "ДИАГРАММА") || val === "ТАБЛИЦЯ" || val === "МАЛЮНОК") || val === "ДІАГРАМА") 
                return null;
            else if ((ait.typ === AddressItemType.NUMBER && (ait.beginToken.whitespacesBeforeCount < 4) && crossStreet === null) && sli[0].typ !== StreetItemType.AGE) {
                let nt = Utils.as(ait.beginToken, NumberToken);
                if ((nt === null || nt.intValue === null || nt.typ !== NumberSpellingType.DIGIT) || nt.morph._class.isAdjective) 
                    return null;
                if (ait.endToken.next !== null && !ait.endToken.isNewlineAfter) {
                    let mc = ait.endToken.next.getMorphClassInDictionary();
                    if (mc.isAdjective || mc.isNoun) 
                        return null;
                }
                if (nt.intValue > 100) 
                    return null;
                if (!MiscLocationHelper.isUserParamAddress(ait)) {
                    let nex = NumberHelper.tryParseNumberWithPostfix(ait.beginToken);
                    if (nex !== null) 
                        return null;
                }
                for (t = sli[0].beginToken.previous; t !== null; t = t.previous) {
                    if (t.isNewlineAfter) 
                        break;
                    if (t.getReferent() instanceof GeoReferent) {
                        ok = true;
                        break;
                    }
                    if (t.isChar(',')) 
                        continue;
                    if (t.isChar('.')) 
                        break;
                    let ait0 = AddressItemToken.tryParsePureItem(t, null, null);
                    if (ait !== null) {
                        if (ait.typ === AddressItemType.PREFIX) {
                            ok = true;
                            break;
                        }
                    }
                    if (t.chars.isLetter) 
                        break;
                }
                if (!ok) {
                    if (MiscLocationHelper.isUserParamAddress(sli[0])) 
                        ok = true;
                }
            }
        }
        if (!ok) 
            return null;
        let ooo = OrgItemToken.tryParse(sli[0].beginToken, null);
        if (ooo === null && sli.length > 1) 
            ooo = OrgItemToken.tryParse(sli[1].beginToken, null);
        if (ooo !== null) 
            return null;
        street = new StreetReferent();
        if (crossStreet !== null) {
            for (const ty of crossStreet.typs) {
                street.addSlot(StreetReferent.ATTR_TYPE, ty, false, 0);
            }
        }
        if (sli.length > 1) {
            if (sli[0].typ === StreetItemType.NUMBER || sli[0].typ === StreetItemType.AGE) 
                street.numbers = sli[0].value;
            else if (sli[1].typ === StreetItemType.NUMBER || sli[1].typ === StreetItemType.AGE) 
                street.numbers = sli[1].value;
            else {
                let adjs = null;
                if (sli[0].typ === StreetItemType.STDADJECTIVE) {
                    adjs = MiscLocationHelper.getStdAdjFull(sli[0].beginToken, sli[1].morph.gender, sli[1].morph.number, true);
                    if (adjs === null) 
                        adjs = MiscLocationHelper.getStdAdjFull(sli[0].beginToken, MorphGender.FEMINIE, MorphNumber.SINGULAR, false);
                }
                else if (sli[1].typ === StreetItemType.STDADJECTIVE) {
                    adjs = MiscLocationHelper.getStdAdjFull(sli[1].beginToken, sli[0].morph.gender, sli[0].morph.number, true);
                    if (adjs === null) 
                        adjs = MiscLocationHelper.getStdAdjFull(sli[1].beginToken, MorphGender.FEMINIE, MorphNumber.SINGULAR, false);
                }
                if (adjs !== null) {
                    if (adjs.length > 1) 
                        altVal = (adjs[1] + " " + val);
                    if (sli[0].isAbridge) 
                        altVal = (adjs[0] + " " + val);
                    else 
                        val = (adjs[0] + " " + val);
                }
            }
        }
        street.addSlot(StreetReferent.ATTR_NAME, val, false, 0);
        if (altVal !== null) 
            street.addSlot(StreetReferent.ATTR_NAME, altVal, false, 0);
        if (miscs !== null) {
            for (const m of miscs) {
                street.addSlot(StreetReferent.ATTR_MISC, m, false, 0);
            }
        }
        if (stdAdjProb !== null) {
            let adjs = MiscLocationHelper.getStdAdjFull(stdAdjProb.beginToken, MorphGender.UNDEFINED, MorphNumber.UNDEFINED, true);
            if (adjs !== null) {
                for (const a of adjs) {
                    street.addSlot(StreetReferent.ATTR_NAME, (a + " " + val), false, 0);
                    if (altVal !== null) 
                        street.addSlot(StreetReferent.ATTR_NAME, (a + " " + altVal), false, 0);
                }
            }
            else {
                street.addSlot(StreetReferent.ATTR_NAME, (stdAdjProb.termin.canonicText + " " + val), false, 0);
                if (altVal !== null) 
                    street.addSlot(StreetReferent.ATTR_NAME, (stdAdjProb.termin.canonicText + " " + altVal), false, 0);
                if (stdAdjProb.altTermin !== null) {
                    street.addSlot(StreetReferent.ATTR_NAME, (stdAdjProb.altTermin.canonicText + " " + val), false, 0);
                    if (altVal !== null) 
                        street.addSlot(StreetReferent.ATTR_NAME, (stdAdjProb.altTermin.canonicText + " " + altVal), false, 0);
                }
            }
        }
        street.addMisc(sli[0].misc);
        if (sli.length > 1) 
            street.addMisc(sli[1].misc);
        let t00 = sli[0].beginToken;
        if (street.kind === StreetKind.UNDEFINED) {
            let cou = 0;
            for (let tt = sli[0].beginToken.previous; tt !== null && (cou < 4); tt = tt.previous,cou++) {
                if (tt.whitespacesAfterCount > 2) 
                    break;
                let te = MiscLocationHelper.checkTerritory(tt);
                if (te !== null && te.next === sli[0].beginToken) {
                    street.addTyp("территория");
                    street.kind = StreetKind.AREA;
                    t00 = tt;
                    break;
                }
            }
        }
        return AddressItemToken._new440(AddressItemType.STREET, t00, sli[sli.length - 1].endToken, street, doubt);
    }
    
    static _tryParseFix(sits) {
        if ((sits.length === 2 && sits[0].typ === StreetItemType.NOUN && sits[1].typ === StreetItemType.FIX) && sits[1].city !== null) {
            let str = new StreetReferent();
            str.addTyp(sits[0].termin.canonicText.toLowerCase());
            if (sits[0].altTermin !== null) 
                str.addTyp(sits[0].altTermin.canonicText.toLowerCase());
            for (const s of sits[1].city.slots) {
                if (s.typeName === GeoReferent.ATTR_NAME) 
                    str.addSlot(StreetReferent.ATTR_NAME, s.value, false, 0);
                else if (s.typeName === GeoReferent.ATTR_TYPE || s.typeName === GeoReferent.ATTR_MISC) 
                    str.addSlot(StreetReferent.ATTR_MISC, s.value, false, 0);
            }
            return AddressItemToken._new293(AddressItemType.STREET, sits[0].beginToken, sits[1].endToken, str);
        }
        if (sits.length < 1) 
            return null;
        if ((sits.length === 2 && !sits[0].isRoad && sits[0].typ === StreetItemType.NOUN) && sits[1].org !== null) {
            if (sits[0].termin.canonicText === "ПЛОЩАДЬ" && !MiscLocationHelper.isUserParamAddress(sits[0])) 
                return null;
            let o = sits[1].org;
            let str = new StreetReferent();
            str.addTyp(sits[0].termin.canonicText.toLowerCase());
            let noOrg = false;
            for (const s of o.referent.slots) {
                if (s.typeName === "NAME" || s.typeName === "NUMBER") 
                    str.addSlot(s.typeName, s.value, false, 0);
                else if (s.typeName === "TYPE") {
                    let ty = Utils.asString(s.value);
                    if (ty === "кадастровый квартал") {
                        noOrg = true;
                        str.addSlot(StreetReferent.ATTR_TYPE, null, true, 0);
                        str.addTyp(ty);
                        continue;
                    }
                    if (ty === "владение" || ty === "участок") 
                        noOrg = true;
                    str.addMisc(ty);
                }
            }
            if (StreetItemToken._isRegion(sits[0].termin.canonicText)) 
                str.kind = StreetKind.AREA;
            let re = new AddressItemToken(AddressItemType.STREET, sits[0].beginToken, sits[1].endToken);
            re.referent = str;
            return re;
        }
        if (sits[0].org !== null) {
            let o = sits[0].org;
            let str = new StreetReferent();
            str.addTyp("территория");
            let noOrg = o.notOrg;
            for (const s of o.referent.slots) {
                if (s.typeName === "NAME" || s.typeName === "NUMBER") 
                    str.addSlot(s.typeName, s.value, false, 0);
                else if (s.typeName === "TYPE") {
                    let ty = Utils.asString(s.value);
                    if (ty === "кадастровый квартал") {
                        noOrg = true;
                        str.addSlot(StreetReferent.ATTR_TYPE, null, true, 0);
                        str.addTyp(ty);
                        continue;
                    }
                    if (ty === "владение" || ty === "участок") 
                        noOrg = true;
                    str.addMisc(ty);
                }
            }
            let b = sits[0].beginToken;
            let e = sits[0].endToken;
            if (sits.length === 2 && sits[1].typ === StreetItemType.NOUN) {
                if (AddressItemToken.checkStreetAfter(e.next, false)) {
                }
                else {
                    str.kind = StreetKind.UNDEFINED;
                    str.addSlot(StreetReferent.ATTR_TYPE, null, true, 0);
                    str.addTyp(sits[1].termin.canonicText.toLowerCase());
                    if (sits[1].altTermin !== null) 
                        str.addTyp(sits[1].altTermin.canonicText.toLowerCase());
                    e = sits[1].endToken;
                    if (str.findSlot(StreetReferent.ATTR_NAME, null, true) === null && str.findSlot(StreetReferent.ATTR_NUMBER, null, true) === null) {
                        let mi = str.findSlot(StreetReferent.ATTR_MISC, null, true);
                        if (mi !== null) {
                            Utils.removeItem(str.slots, mi);
                            str.addSlot(StreetReferent.ATTR_NAME, mi.value.toUpperCase(), false, 0);
                        }
                    }
                    return AddressItemToken._new293(AddressItemType.STREET, b, e, str);
                }
            }
            if (noOrg || o.referent.findSlot("TYPE", null, true) === null) 
                str.kind = StreetKind.AREA;
            else {
                str.kind = StreetKind.ORG;
                str.addSlot(StreetReferent.ATTR_REF, o.referent, false, 0);
                str.addExtReferent(sits[0].org);
            }
            if (sits[0].lengthChar > 500) {
            }
            let re = new AddressItemToken(AddressItemType.STREET, b, e);
            re.referent = str;
            if (o.notOrg) 
                str.kind = StreetKind.AREA;
            re.refToken = o;
            re.refTokenIsGsk = o.isGsk || o.hasTerrKeyword;
            re.refTokenIsMassive = o.notOrg;
            re.isDoubt = o.isDoubt;
            if (!o.isGsk && !o.hasTerrKeyword) {
                if (!AddressItemToken.checkHouseAfter(sits[0].endToken.next, false, false)) {
                    if (!MiscLocationHelper.isUserParamAddress(sits[0])) 
                        re.isDoubt = true;
                }
            }
            return re;
        }
        if (sits[0].isRailway) {
            let str = new StreetReferent();
            str.kind = StreetKind.RAILWAY;
            str.addSlot(StreetReferent.ATTR_TYPE, "железная дорога", false, 0);
            str.addSlot(StreetReferent.ATTR_NAME, Utils.replaceString(sits[0].value, " ЖЕЛЕЗНАЯ ДОРОГА", ""), false, 0);
            let t0 = sits[0].beginToken;
            let t1 = sits[0].endToken;
            if (sits.length > 1 && sits[1].typ === StreetItemType.NUMBER) {
                let num = sits[1].value;
                if (t0.previous !== null && ((t0.previous.isValue("КИЛОМЕТР", null) || t0.previous.isValue("КМ", null)))) {
                    t0 = t0.previous;
                    str.addSlot(StreetReferent.ATTR_NUMBER, num + "км", false, 0);
                    t1 = sits[1].endToken;
                }
                else if (sits[1].isNumberKm) {
                    str.addSlot(StreetReferent.ATTR_NUMBER, num + "км", false, 0);
                    t1 = sits[1].endToken;
                }
            }
            else if (sits[0].nounIsDoubtCoef > 1) 
                return null;
            return AddressItemToken._new293(AddressItemType.STREET, t0, t1, str);
        }
        if (sits[0].termin === null) 
            return null;
        if (sits[0].termin.acronym === "МКАД") {
            let str = new StreetReferent();
            str.kind = StreetKind.ROAD;
            str.addSlot(StreetReferent.ATTR_TYPE, "автодорога", false, 0);
            str.addSlot(StreetReferent.ATTR_NAME, "МОСКОВСКАЯ КОЛЬЦЕВАЯ", false, 0);
            let t0 = sits[0].beginToken;
            let t1 = sits[0].endToken;
            if (sits.length > 1 && sits[1].typ === StreetItemType.NUMBER) {
                let num = sits[1].value;
                if (t0.previous !== null && ((t0.previous.isValue("КИЛОМЕТР", null) || t0.previous.isValue("КМ", null)))) {
                    t0 = t0.previous;
                    str.addSlot(StreetReferent.ATTR_NUMBER, num + "км", false, 0);
                    t1 = sits[1].endToken;
                }
                else if (sits[1].isNumberKm) {
                    str.addSlot(StreetReferent.ATTR_NUMBER, num + "км", false, 0);
                    t1 = sits[1].endToken;
                }
            }
            return AddressItemToken._new293(AddressItemType.STREET, t0, t1, str);
        }
        if (MiscLocationHelper.checkGeoObjectBefore(sits[0].beginToken, false) || AddressItemToken.checkHouseAfter(sits[0].endToken.next, false, true)) {
            let str = new StreetReferent();
            str.addSlot(StreetReferent.ATTR_NAME, sits[0].termin.canonicText, false, 0);
            return AddressItemToken._new293(AddressItemType.STREET, sits[0].beginToken, sits[0].endToken, str);
        }
        return null;
    }
    
    static tryParseSecondStreet(t1, t2) {
        let sli = StreetItemToken.tryParseList(t1, 10, null);
        if (sli === null || (sli.length < 1) || sli[0].typ !== StreetItemType.NOUN) 
            return null;
        let sli2 = StreetItemToken.tryParseList(t2, 10, null);
        if (sli2 === null || sli2.length === 0) 
            return null;
        sli2.splice(0, 0, sli[0]);
        let res = StreetDefineHelper.tryParseStreet(sli2, true, false, false, null);
        if (res === null) 
            return null;
        res.beginToken = sli2[1].beginToken;
        return res;
    }
}


module.exports = StreetDefineHelper