/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const NumberToken = require("./../../NumberToken");
const TerminParseAttr = require("./../../core/TerminParseAttr");
const MetaToken = require("./../../MetaToken");
const ReferentToken = require("./../../ReferentToken");
const GetTextAttr = require("./../../core/GetTextAttr");
const Token = require("./../../Token");
const MiscHelper = require("./../../core/MiscHelper");
const Termin = require("./../../core/Termin");
const CityItemTokenItemType = require("./CityItemTokenItemType");
const MorphClass = require("./../../../morph/MorphClass");
const AddressDetailType = require("./../../address/AddressDetailType");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const MorphGender = require("./../../../morph/MorphGender");
const MorphNumber = require("./../../../morph/MorphNumber");
const TextToken = require("./../../TextToken");
const BracketHelper = require("./../../core/BracketHelper");
const CityAttachHelper = require("./CityAttachHelper");
const AddressHouseType = require("./../../address/AddressHouseType");
const GeoReferent = require("./../GeoReferent");
const GeoTokenType = require("./GeoTokenType");
const StreetItemType = require("./../../address/internal/StreetItemType");
const TerrItemToken = require("./TerrItemToken");
const TerminCollection = require("./../../core/TerminCollection");
const StreetItemToken = require("./../../address/internal/StreetItemToken");
const GeoAnalyzer = require("./../GeoAnalyzer");
const GeoTokenData = require("./GeoTokenData");
const MiscLocationHelper = require("./MiscLocationHelper");
const AddressItemType = require("./../../address/internal/AddressItemType");
const NumToken = require("./NumToken");
const AddressItemToken = require("./../../address/internal/AddressItemToken");
const NameToken = require("./NameToken");
const OrgTypToken = require("./OrgTypToken");
const CityItemToken = require("./CityItemToken");

class OrgItemToken extends ReferentToken {
    
    constructor(r, b, e) {
        super(r, b, e, null);
        this.isDoubt = false;
        this.hasTerrKeyword = false;
        this.keywordAfter = false;
        this.isGsk = false;
        this.notOrg = false;
        this.notGeo = false;
    }
    
    setGsk() {
        this.isGsk = false;
        if (this.notOrg) {
            this.isGsk = true;
            return;
        }
        for (const s of this.referent.slots) {
            if (s.typeName === "TYPE" && ((typeof s.value === 'string' || s.value instanceof String))) {
                let ty = Utils.asString(s.value);
                if ((((((((ty.includes("товарищество") || ty.includes("кооператив") || ty.includes("коллектив")) || LanguageHelper.endsWithEx(ty, "поселок", " отдыха", " часть", null) || ty.includes("партнерство")) || ty.includes("объединение") || ty.includes("бизнес")) || ty.includes("офисн") || ((ty.includes("станция") && !ty.includes("заправоч")))) || ty.includes("аэропорт") || ty.includes("пансионат")) || ty.includes("санаторий") || ty.includes("база")) || ty.includes("урочище") || ty.includes("кадастровый")) || ty.includes("лесничество")) {
                    this.isGsk = true;
                    return;
                }
                if (ty === "АОЗТ" || ty === "пядь") {
                    this.isGsk = true;
                    return;
                }
                if (ty.includes("хозяйство")) {
                    if (ty.includes("кресьян") || ty.includes("фермер")) {
                        this.isGsk = true;
                        return;
                    }
                }
            }
            else if (s.typeName === "NAME" && ((typeof s.value === 'string' || s.value instanceof String))) {
                let nam = Utils.asString(s.value);
                if (LanguageHelper.endsWithEx(nam, "ГЭС", "АЭС", "ТЭС", null)) {
                    this.isGsk = true;
                    return;
                }
            }
        }
    }
    
    toString() {
        let tmp = new StringBuilder();
        if (this.isDoubt) 
            tmp.append("? ");
        if (this.hasTerrKeyword) 
            tmp.append("Terr ");
        if (this.isGsk) 
            tmp.append("Gsk ");
        if (this.notOrg) 
            tmp.append("NotOrg ");
        if (this.notGeo) 
            tmp.append("NotGeo ");
        tmp.append(this.referent.toString());
        return tmp.toString();
    }
    
    static prepareAllData(t0) {
        if (!OrgItemToken.SPEED_REGIME) 
            return;
        let ad = GeoAnalyzer.getData(t0);
        if (ad === null) 
            return;
        ad.oRegime = false;
        for (let t = t0; t !== null; t = t.next) {
            let d = Utils.as(t.tag, GeoTokenData);
            let org = OrgItemToken.tryParse(t, ad);
            if (org !== null) {
                if (d === null) 
                    d = new GeoTokenData(t);
                d.org = org;
                if (org.hasTerrKeyword || org.notGeo || ((org.isGsk && !org.keywordAfter && !org.notOrg))) {
                    for (let tt = org.beginToken; tt !== null && tt.endChar <= org.endChar; tt = tt.next) {
                        let dd = Utils.as(tt.tag, GeoTokenData);
                        if (dd === null) 
                            dd = new GeoTokenData(tt);
                        dd.noGeo = true;
                    }
                    if (!org.hasTerrKeyword) 
                        t = org.endToken;
                }
            }
        }
        ad.oRegime = true;
    }
    
    static tryParse(t, ad = null) {
        if (!(t instanceof TextToken)) 
            return null;
        if (ad === null) 
            ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (OrgItemToken.SPEED_REGIME && ((ad.oRegime || ad.allRegime))) {
            if ((t instanceof TextToken) && t.isChar('м')) {
            }
            else {
                let d = Utils.as(t.tag, GeoTokenData);
                if (d !== null) 
                    return d.org;
                return null;
            }
        }
        if (ad.oLevel > 1) 
            return null;
        ad.oLevel++;
        let res = OrgItemToken._TryParse(t, false, 0, ad);
        if (res !== null) 
            res._tryParseDetails();
        ad.oLevel--;
        return res;
    }
    
    static _TryParse(t, afterTerr, lev, ad) {
        if (lev > 3 || t === null || t.isComma) 
            return null;
        let tt2 = MiscLocationHelper.checkTerritory(t);
        if (tt2 !== null && tt2.next !== null) {
            tt2 = tt2.next;
            let br = false;
            if (BracketHelper.isBracket(tt2, true)) {
                br = true;
                tt2 = tt2.next;
            }
            if (tt2 === null || lev > 3) 
                return null;
            let re2 = OrgItemToken._TryParse(tt2, true, lev + 1, ad);
            if (re2 === null && tt2 !== null && tt2.isValue("ВЛАДЕНИЕ", null)) 
                re2 = OrgItemToken._TryParse(tt2.next, true, lev + 1, ad);
            if (re2 !== null) {
                let a = t.kit.processor.findAnalyzer("GEO");
                if (a !== null && !MiscLocationHelper.isUserParamAddress(t)) {
                    let rt = a.processReferent(tt2, null);
                    if (rt !== null) 
                        return null;
                }
                for (let tt = tt2; tt !== null && tt.endChar <= re2.endChar; tt = tt.next) {
                    let sit = StreetItemToken.tryParse(tt, null, false, null);
                    if (sit !== null && sit.typ === StreetItemType.NOUN && ((sit.isRoad || sit.isRailway))) 
                        return null;
                }
                if (tt2.isValue("ВЛАДЕНИЕ", null)) 
                    re2.referent.addSlot("TYPE", "владение", false, 0);
                re2.beginToken = t;
                if (br && BracketHelper.canBeEndOfSequence(re2.endToken.next, false, null, false)) 
                    re2.endToken = re2.endToken.next;
                re2.hasTerrKeyword = true;
                return re2;
            }
            else if ((t instanceof TextToken) && ((t.term.startsWith("ТЕР") || t.term.startsWith("ПЛОЩ"))) && (tt2.whitespacesBeforeCount < 3)) {
                let nam1 = NameToken.tryParse(tt2, GeoTokenType.ORG, 0, true);
                if (nam1 !== null && ((nam1.name !== null || ((nam1.number !== null && MiscLocationHelper.isUserParamAddress(tt2)))))) {
                    if (StreetItemToken.checkKeyword(tt2)) 
                        return null;
                    if (t.next !== nam1.endToken && StreetItemToken.checkKeyword(nam1.endToken)) 
                        return null;
                    if (TerrItemToken.checkKeyword(tt2) !== null) 
                        return null;
                    if (t.next !== nam1.endToken && TerrItemToken.checkKeyword(nam1.endToken) !== null) 
                        return null;
                    let ter = TerrItemToken.checkOntoItem(tt2);
                    if (ter !== null) {
                        let _geo = Utils.as(ter.item.referent, GeoReferent);
                        if (_geo.isCity || _geo.isState) 
                            return null;
                    }
                    if (CityItemToken.checkKeyword(tt2) !== null) 
                        return null;
                    if (CityItemToken.checkOntoItem(tt2) !== null) 
                        return null;
                    let tt = nam1.endToken;
                    let ok = false;
                    if (tt.isNewlineAfter) 
                        ok = true;
                    else if (tt.next !== null && ((tt.next.isComma || tt.next.isChar(')')))) 
                        ok = true;
                    else if (AddressItemToken.checkHouseAfter(tt2, false, false)) 
                        ok = true;
                    else {
                        let ait = AddressItemToken.tryParsePureItem(nam1.endToken.next, null, null);
                        if (ait !== null && ait.typ !== AddressItemType.NUMBER) 
                            ok = true;
                        else {
                            let a2 = AddressItemToken.tryParse(nam1.endToken.next, false, null, ad);
                            if (a2 !== null) {
                                let a1 = AddressItemToken.tryParse(tt2, false, null, ad);
                                if (a1 === null || (a1.endChar < a2.endChar)) 
                                    ok = true;
                            }
                        }
                    }
                    if (ok) {
                        let org1 = t.kit.createReferent("ORGANIZATION");
                        if (nam1.name !== null) 
                            org1.addSlot("NAME", nam1.name, false, 0);
                        if (nam1.number !== null) 
                            org1.addSlot("NUMBER", nam1.number, false, 0);
                        if (tt2.previous !== null && tt2.previous.isValue("ВЛАДЕНИЕ", null)) 
                            org1.addSlot("TYPE", "владение", false, 0);
                        let res1 = new OrgItemToken(org1, t, nam1.endToken);
                        res1.data = t.kit.getAnalyzerDataByAnalyzerName("ORGANIZATION");
                        res1.hasTerrKeyword = true;
                        return res1;
                    }
                }
                let rt = t.kit.processReferent("NAMEDENTITY", tt2, null);
                if (rt !== null) {
                    let res1 = new OrgItemToken(rt.referent, t, rt.endToken);
                    res1.data = t.kit.getAnalyzerDataByAnalyzerName("NAMEDENTITY");
                    res1.hasTerrKeyword = true;
                    return res1;
                }
            }
            if (!t.isValue("САД", null)) 
                return null;
        }
        let typAfter = false;
        let doubt0 = false;
        let tokTyp = OrgTypToken.tryParse(t, afterTerr, ad);
        let nam = null;
        let ignoreNum = false;
        if (tokTyp === null) {
            let num = NumToken.tryParse(t, GeoTokenType.ORG);
            if (num !== null && num.hasSpecWord) {
                let _next = OrgItemToken.tryParse(num.endToken.next, ad);
                if (_next !== null && _next.referent.findSlot("NUMBER", null, true) === null) {
                    _next.beginToken = t;
                    _next.referent.addSlot("NUMBER", num.value, false, 0);
                    return _next;
                }
            }
            let ait = AddressItemToken.tryParsePureItem(t, null, null);
            if ((ait !== null && ait.typ === AddressItemType.HOUSE && ait.houseType === AddressHouseType.ESTATE) && ait.value !== null) {
                let ok3 = false;
                if (afterTerr) 
                    ok3 = true;
                else if (AddressItemToken.checkStreetAfter(ait.endToken.next, false)) 
                    ok3 = true;
                if (ok3) {
                    let org3 = t.kit.createReferent("ORGANIZATION");
                    org3.addSlot("TYPE", "владение", false, 0);
                    let num3 = new StringBuilder();
                    let nam3 = new StringBuilder();
                    for (const ch of ait.value) {
                        if (Utils.isDigit(ch)) 
                            num3.append(ch);
                        else if (Utils.isLetter(ch)) 
                            nam3.append(ch);
                    }
                    if (num3.length > 0) 
                        org3.addSlot("NUMBER", num3.toString(), false, 0);
                    if (nam3.length > 0) 
                        org3.addSlot("NAME", nam3.toString(), false, 0);
                    let res3 = new OrgItemToken(org3, t, ait.endToken);
                    res3.data = t.kit.getAnalyzerDataByAnalyzerName("ORGANIZATION");
                    res3.notOrg = true;
                    res3.hasTerrKeyword = afterTerr;
                    res3.notGeo = true;
                    return res3;
                }
            }
            let ok = 0;
            if (BracketHelper.canBeStartOfSequence(t, true, false)) 
                ok = 2;
            else if (t.isValue("ИМ", null) || t.isValue("ИМЕНИ", null)) 
                ok = 2;
            else if ((t instanceof TextToken) && !t.chars.isAllLower && t.lengthChar > 1) 
                ok = 1;
            else if (afterTerr) 
                ok = 1;
            if (ok === 0) 
                return null;
            if (CityItemToken.checkKeyword(t) !== null) 
                return null;
            if (CityItemToken.checkOntoItem(t) !== null) 
                return null;
            if ((t.lengthChar > 5 && (t instanceof TextToken) && !t.chars.isAllUpper) && !t.chars.isAllLower && !t.chars.isCapitalUpper) {
                let namm = t.getSourceText();
                if (Utils.isUpperCase(namm[0]) && Utils.isUpperCase(namm[1])) {
                    for (let i = 0; i < namm.length; i++) {
                        if (Utils.isLowerCase(namm[i]) && i > 2) {
                            let abbr = namm.substring(0, 0 + i - 1);
                            let te = Termin._new1262(abbr, abbr);
                            let li = OrgTypToken.findTerminByAcronym(abbr);
                            if (li !== null && li.length > 0) {
                                nam = new NameToken(t, t);
                                nam.name = t.term.substring(i - 1);
                                tokTyp = new OrgTypToken(t, t);
                                tokTyp.vals.push(li[0].canonicText.toLowerCase());
                                tokTyp.vals.push(abbr);
                                nam.tryAttachNumber();
                                break;
                            }
                        }
                    }
                }
            }
            if (nam === null) {
                if (afterTerr) 
                    ok = 2;
                if (ok < 2) {
                    let kk = 0;
                    for (let tt = t.next; tt !== null && (kk < 5); tt = tt.next,kk++) {
                        if (tt.isNewlineBefore) 
                            break;
                        let ty22 = OrgTypToken.tryParse(tt, false, ad);
                        if (ty22 === null || ty22.isDoubt || ty22.canBeSingle) 
                            continue;
                        ok = 2;
                        break;
                    }
                }
                if (ok < 2) 
                    return null;
                typAfter = true;
                nam = NameToken.tryParse(t, GeoTokenType.ORG, 0, false);
                if (nam === null) 
                    return null;
                tokTyp = OrgTypToken.tryParse(nam.endToken.next, afterTerr, ad);
                if (tokTyp === null && !afterTerr && MiscLocationHelper.isUserParamAddress(t)) {
                    tt2 = MiscLocationHelper.checkTerritory(nam.endToken.next);
                    if (tt2 !== null && tt2.next !== null) {
                        tokTyp = OrgTypToken.tryParse(tt2.next, true, ad);
                        if (tokTyp !== null) {
                            let nam2 = NameToken.tryParse(tokTyp.endToken.next, GeoTokenType.ORG, 0, false);
                            if (nam2 !== null && nam2.name !== null) 
                                tokTyp = null;
                        }
                    }
                }
                if (nam.name === null && nam.miscTyp === null) {
                    if (nam.number !== null && tokTyp !== null) {
                    }
                    else if (afterTerr) {
                    }
                    else 
                        return null;
                }
                if (tokTyp !== null) {
                    if (nam.beginToken === nam.endToken) {
                        let mc = nam.getMorphClassInDictionary();
                        if (mc.isConjunction || mc.isPreposition || mc.isPronoun) 
                            return null;
                    }
                    let rt2 = OrgItemToken.tryParse(tokTyp.beginToken, null);
                    if (rt2 !== null && rt2.isDoubt) 
                        rt2 = null;
                    if (rt2 !== null) {
                        if (MiscLocationHelper.checkTerritory(tokTyp.endToken.next) !== null) {
                            let rt3 = OrgItemToken.tryParse(tokTyp.endToken.next, ad);
                            if (rt3 !== null) 
                                rt2 = null;
                        }
                    }
                    let nam2 = NameToken.tryParse(tokTyp.endToken.next, GeoTokenType.ORG, 0, false);
                    if (tokTyp.isNewlineAfter) 
                        nam2 = null;
                    if (rt2 !== null && rt2.endChar > tokTyp.endChar) {
                        if (nam2 === null || nam2.endToken !== rt2.endToken) 
                            return null;
                        if (((nam.number === null && nam2.name === null && nam2.number !== null)) || (((nam.name === null && nam.number !== null && nam2.number === null) && nam2.name !== null))) {
                            if (nam2.number !== null) 
                                nam.number = nam2.number;
                            if (nam2.name !== null) 
                                nam.name = nam2.name;
                            tokTyp = tokTyp.clone();
                            tokTyp.endToken = nam2.endToken;
                        }
                        else 
                            return null;
                    }
                    else if ((nam.number === null && nam2 !== null && nam2.name === null) && nam2.number !== null) {
                        nam.number = nam2.number;
                        tokTyp = tokTyp.clone();
                        tokTyp.endToken = nam2.endToken;
                    }
                    nam.endToken = tokTyp.endToken;
                    doubt0 = true;
                }
                else if (nam.name !== null || nam.miscTyp !== null) {
                    let busines = false;
                    if (nam.miscTyp !== null) {
                    }
                    else if (nam.name.endsWith("ПЛАЗА") || nam.name.startsWith("БИЗНЕС")) 
                        busines = true;
                    else if (afterTerr && MiscLocationHelper.isUserParamAddress(nam)) {
                        if (StreetItemToken.checkKeyword(nam.beginToken)) 
                            return null;
                    }
                    else if (nam.beginToken === nam.endToken) 
                        return null;
                    else if (nam.name !== null && nam.name.length === 1 && nam.number === null) 
                        return null;
                    else if (BracketHelper.canBeStartOfSequence(nam.beginToken, false, false) && MiscLocationHelper.isUserParamAddress(nam)) {
                    }
                    else if ((((tokTyp = OrgTypToken.tryParse(nam.endToken, false, ad)))) === null) 
                        return null;
                    else if (nam.morph._case.isGenitive && !nam.morph._case.isNominative) {
                        nam.name = Utils.replaceString(MiscHelper.getTextValueOfMetaToken(nam, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE), "-", " ");
                        if (tokTyp !== null && tokTyp.vals.length > 0) {
                            if (Utils.endsWithString(nam.name, tokTyp.vals[0], true)) 
                                nam.name = nam.name.substring(0, 0 + nam.name.length - tokTyp.vals[0].length).trim();
                        }
                    }
                    if (tokTyp === null) {
                        tokTyp = new OrgTypToken(t, t);
                        if (busines) {
                            tokTyp.vals.push("бизнес центр");
                            tokTyp.vals.push("БЦ");
                        }
                        else if (t.previous !== null && t.previous.isValue("САД", null)) 
                            tokTyp.vals.push("сад");
                        else if (nam.miscTyp !== null) 
                            tokTyp.vals.push(nam.miscTyp);
                    }
                    nam.isDoubt = tokTyp.vals.length === 0;
                    doubt0 = tokTyp.vals.length === 0;
                }
                else 
                    return null;
            }
        }
        else {
            if (tokTyp.whitespacesAfterCount > 3 && !tokTyp.isNewlineAfter) 
                return null;
            let tt3 = MiscLocationHelper.checkTerritory(tokTyp.endToken.next);
            if (tt3 !== null) {
                tokTyp = tokTyp.clone();
                tokTyp.endToken = tt3;
                afterTerr = true;
                let tokTyp2 = OrgTypToken.tryParse(tokTyp.endToken.next, true, ad);
                if (tokTyp2 !== null && !tokTyp2.isDoubt) 
                    tokTyp.mergeWith(tokTyp2);
            }
            else {
                let tokTyp2 = OrgTypToken.tryParse(tokTyp.endToken.next, true, ad);
                if (tokTyp2 !== null && tokTyp2.beginToken === tokTyp2.endToken) {
                    let mc = tokTyp2.beginToken.getMorphClassInDictionary();
                    if (!mc.isUndefined) 
                        tokTyp2 = null;
                }
                if (tokTyp2 !== null && !tokTyp2.isDoubt) {
                    tokTyp = tokTyp.clone();
                    tokTyp.mergeWith(tokTyp2);
                }
            }
            if (BracketHelper.isBracket(tokTyp.endToken.next, true)) {
                let tokTyp2 = OrgTypToken.tryParse(tokTyp.endToken.next.next, afterTerr, ad);
                if (tokTyp2 !== null && !tokTyp2.isDoubt) {
                    tokTyp = tokTyp.clone();
                    tokTyp.isDoubt = false;
                    nam = NameToken.tryParse(tokTyp2.endToken.next, GeoTokenType.ORG, 0, false);
                    if (nam !== null && BracketHelper.canBeEndOfSequence(nam.endToken.next, false, null, false)) {
                        tokTyp.mergeWith(tokTyp2);
                        nam.endToken = nam.endToken.next;
                    }
                    else if (nam !== null && BracketHelper.canBeEndOfSequence(nam.endToken, false, null, false)) 
                        tokTyp.mergeWith(tokTyp2);
                    else 
                        nam = null;
                }
            }
        }
        if (OrgItemToken.m_Onto.tryParse(tokTyp.endToken.next, TerminParseAttr.NO) !== null) {
        }
        else if (StreetItemToken.checkKeyword(tokTyp.endToken.next) && !tokTyp.endToken.next.chars.isCapitalUpper) {
        }
        else {
            if (nam === null && (tokTyp.whitespacesAfterCount < 3)) 
                nam = NameToken.tryParse(tokTyp.endToken.next, GeoTokenType.ORG, 0, true);
            if ((nam === null && tokTyp.endToken.next !== null && tokTyp.chars.isAllUpper) && tokTyp.endToken.next.isHiphen && !tokTyp.isWhitespaceAfter) {
                nam = NameToken.tryParse(tokTyp.endToken.next.next, GeoTokenType.ORG, 0, true);
                if (nam !== null) {
                    if (nam.chars.isAllLower || (nam.lengthChar < 4)) 
                        nam = null;
                }
            }
            if (nam === null) {
                let ok = false;
                if (afterTerr && MiscLocationHelper.isUserParamAddress(tokTyp)) 
                    ok = true;
                else if (tokTyp.canBeSingle) 
                    ok = true;
                else if (tokTyp.beginToken !== tokTyp.endToken) {
                    if (MiscLocationHelper.checkGeoObjectBefore(tokTyp.beginToken, false)) 
                        ok = true;
                    else if (MiscLocationHelper.isUserParamAddress(tokTyp) && ((tokTyp.endToken.isNewlineAfter || tokTyp.endToken.next.isComma))) 
                        ok = true;
                    else if (AddressItemToken.checkHouseAfter(tokTyp.endToken.next, false, false)) 
                        ok = true;
                }
                if (!ok) 
                    return null;
                if (tokTyp.vals[0].endsWith("район")) 
                    return null;
            }
        }
        if (tokTyp.isDoubt && ((nam === null || nam.isDoubt || nam.chars.isAllUpper))) 
            return null;
        if (((tokTyp.lengthChar < 3) && nam !== null && nam.name === null) && nam.pref === null) {
            if (afterTerr || MiscLocationHelper.isUserParamAddress(tokTyp)) {
            }
            else 
                return null;
        }
        if (((tokTyp.beginToken.isValue("СП", null) || tokTyp.beginToken.isValue("ГП", null))) && nam !== null) {
            let tt = nam.endToken.next;
            if (tt !== null && tt.isComma) 
                tt = tt.next;
            if (AddressItemToken.checkHouseAfter(tt, false, false)) {
            }
            else if (CityItemToken.checkKeyword(tt) !== null) 
                return null;
        }
        let org = t.kit.createReferent("ORGANIZATION");
        let res = new OrgItemToken(org, t, (nam !== null ? nam.endToken : tokTyp.endToken));
        res.data = t.kit.getAnalyzerDataByAnalyzerName("ORGANIZATION");
        res.hasTerrKeyword = afterTerr;
        res.isDoubt = doubt0 || tokTyp.isDoubt || nam === null;
        res.keywordAfter = typAfter;
        res.notOrg = tokTyp.notOrg;
        res.notGeo = tokTyp.notGeo;
        if (tokTyp.canBeSingle) {
            org.addSlot("NAME", tokTyp.vals[0].toUpperCase(), false, 0);
            res.isDoubt = false;
            res.isGsk = true;
            return res;
        }
        for (const ty of tokTyp.vals) {
            org.addSlot("TYPE", ty, false, 0);
            if (ty === "поле") 
                res.isDoubt = true;
        }
        let ignoreNext = false;
        if ((res.whitespacesAfterCount < 3) && res.endToken.next !== null) {
            let ttt = MiscLocationHelper.checkTerritory(res.endToken.next);
            if (ttt !== null && OrgItemToken._TryParse(ttt.next, true, lev + 1, ad) === null) {
                res.endToken = ttt;
                ignoreNext = true;
            }
            else if (nam !== null) {
                let tokTyp2 = OrgTypToken.tryParse(res.endToken.next, false, null);
                if (tokTyp2 !== null) {
                    let rrr2 = OrgItemToken._TryParse(res.endToken.next, false, lev + 1, ad);
                    if (rrr2 === null || rrr2.endChar <= tokTyp2.endChar) {
                        res.endToken = tokTyp2.endToken;
                        for (const ty of tokTyp2.vals) {
                            org.addSlot("TYPE", ty, false, 0);
                        }
                    }
                }
            }
        }
        if (((res.whitespacesAfterCount < 3) && nam !== null && (res.endToken.next instanceof TextToken)) && res.endToken.next.lengthChar === 1 && res.endToken.next.chars.isLetter) {
            let tt3 = res.endToken.next;
            if (((tt3.next !== null && tt3.next.isChar('.') && (tt3.next.next instanceof TextToken)) && tt3.next.next.chars.isLetter && tt3.next.next.lengthChar === 1) && tt3.next.next.next !== null && tt3.next.next.next.isChar('.')) 
                res.endToken = tt3.next.next.next;
        }
        if ((res.whitespacesAfterCount < 3) && !tokTyp.notOrg) {
            let tt = res.endToken.next;
            let _next = OrgItemToken._TryParse(tt, false, lev + 1, ad);
            if (_next !== null) {
                let merge = true;
                if (_next.isGsk) {
                    merge = false;
                    if ((nam !== null && nam.name !== null && nam.number === null) && _next.referent.findSlot("NAME", null, true) === null && _next.referent.findSlot("NUMBER", null, true) !== null) {
                        for (const ty of org.getStringValues("TYPE")) {
                            if (_next.referent.findSlot("TYPE", ty, true) !== null) 
                                merge = true;
                        }
                    }
                }
                if (merge) {
                    res.endToken = _next.endToken;
                    for (const s of _next.referent.slots) {
                        res.referent.addSlot(s.typeName, s.value, false, 0);
                    }
                }
                ignoreNext = true;
            }
            else {
                if (tt !== null && tt.isValue("ПРИ", null)) 
                    tt = tt.next;
                let rt = t.kit.processReferent("ORGANIZATION", tt, null);
                if (rt !== null) {
                }
                if (rt !== null) {
                    res.endToken = rt.endToken;
                    let ter = TerrItemToken.checkOntoItem(res.endToken.next);
                    if (ter !== null) 
                        res.endToken = ter.endToken;
                    ignoreNext = true;
                }
            }
        }
        let suffName = null;
        if (!ignoreNext && (res.whitespacesAfterCount < 2) && !tokTyp.notOrg) {
            let tokTyp2 = OrgTypToken.tryParse(res.endToken.next, true, ad);
            if (tokTyp2 !== null) {
                res.endToken = tokTyp2.endToken;
                if (tokTyp2.isDoubt && nam.name !== null) 
                    suffName = tokTyp2.vals[0];
                else 
                    for (const ty of tokTyp2.vals) {
                        org.addSlot("TYPE", ty, false, 0);
                    }
                if (nam !== null && nam.number === null) {
                    let nam2 = NameToken.tryParse(res.endToken.next, GeoTokenType.ORG, 0, false);
                    if ((nam2 !== null && nam2.number !== null && nam2.name === null) && nam2.pref === null) {
                        nam.number = nam2.number;
                        res.endToken = nam2.endToken;
                    }
                }
            }
        }
        if (nam === null) {
            res.setGsk();
            return res;
        }
        if (nam !== null && nam.name !== null) {
            if (nam.pref !== null) {
                org.addSlot("NAME", (nam.pref + " " + nam.name), false, 0);
                if (suffName !== null) 
                    org.addSlot("NAME", (nam.pref + " " + nam.name + " " + suffName), false, 0);
            }
            else {
                org.addSlot("NAME", nam.name, false, 0);
                if (suffName !== null) 
                    org.addSlot("NAME", (nam.name + " " + suffName), false, 0);
            }
        }
        else if (nam.pref !== null) 
            org.addSlot("NAME", nam.pref, false, 0);
        else if (nam.number !== null && (res.whitespacesAfterCount < 2)) {
            let nam2 = NameToken.tryParse(res.endToken.next, GeoTokenType.ORG, 0, false);
            if (nam2 !== null && nam2.name !== null && nam2.number === null) {
                res.endToken = nam2.endToken;
                org.addSlot("NAME", nam2.name, false, 0);
            }
        }
        if (nam.number !== null) 
            org.addSlot("NUMBER", nam.number, false, 0);
        else if (res.endToken.next !== null && res.endToken.next.isHiphen && (res.endToken.next.next instanceof NumberToken)) {
            let nam2 = NameToken.tryParse(res.endToken.next.next, GeoTokenType.ORG, 0, false);
            if (nam2 !== null && nam2.number !== null && nam2.name === null) {
                org.addSlot("NUMBER", nam2.number, false, 0);
                res.endToken = nam2.endToken;
            }
        }
        let ok1 = false;
        let cou = 0;
        for (let tt = res.beginToken; tt !== null && tt.endChar <= res.endChar; tt = tt.next) {
            if ((tt instanceof TextToken) && tt.lengthChar > 1) {
                if (nam !== null && tt.beginChar >= nam.beginChar && tt.endChar <= nam.endChar) {
                    if (tokTyp !== null && tt.beginChar >= tokTyp.beginChar && tt.endChar <= tokTyp.endChar) {
                    }
                    else 
                        cou++;
                }
                if (!tt.chars.isAllLower) 
                    ok1 = true;
            }
            else if (tt instanceof ReferentToken) 
                ok1 = true;
        }
        res.setGsk();
        if (!ok1) {
            if (!res.isGsk && !res.hasTerrKeyword && !MiscLocationHelper.isUserParamAddress(res)) 
                return null;
        }
        if (cou > 4) 
            return null;
        if (tokTyp !== null && tokTyp.beginToken.isValue("СП", null)) {
            tt2 = res.endToken.next;
            if (tt2 !== null && tt2.isComma) 
                tt2 = tt2.next;
            let cits = CityItemToken.tryParseList(tt2, 3, null);
            if (cits !== null && cits.length === 2 && cits[0].typ === CityItemTokenItemType.NOUN) 
                return null;
        }
        if (tokTyp !== null && tokTyp.beginToken.isValue("МАГАЗИН", null)) 
            return null;
        if (res.notOrg && (res.whitespacesAfterCount < 2)) {
            let tt = res.endToken.next;
            if ((tt instanceof TextToken) && tt.lengthChar === 1 && ((tt.isValue("П", null) || tt.isValue("Д", null)))) {
                if (!AddressItemToken.checkHouseAfter(tt, false, false)) {
                    res.endToken = res.endToken.next;
                    if (res.endToken.next !== null && res.endToken.next.isChar('.')) 
                        res.endToken = res.endToken.next;
                }
            }
        }
        if (tokTyp !== null && tokTyp.vals.includes("лесничество") && MiscLocationHelper.isUserParamAddress(tokTyp)) {
            tt2 = tokTyp.endToken.next;
            if (tt2 !== null && tt2.isComma) 
                tt2 = tt2.next;
            let ait = AddressItemToken.tryParsePureItem(tt2, null, null);
            if (ait !== null && ait.typ === AddressItemType.FLAT && ait.value !== null) {
                org.addSlot("NUMBER", ait.value, false, 0);
                res.endToken = ait.endToken;
                for (tt2 = res.endToken.next; tt2 !== null; tt2 = tt2.next) {
                    if (!tt2.isCommaAnd) 
                        break;
                    ait = AddressItemToken.tryParsePureItem(tt2.next, null, null);
                    if (ait === null || ait.value === null) 
                        break;
                    if (ait.typ !== AddressItemType.NUMBER && ait.typ !== AddressItemType.FLAT) 
                        break;
                    org.addSlot("NUMBER", ait.value, false, 0);
                    res.endToken = (tt2 = ait.endToken);
                }
            }
            else {
                let nu = NumToken.tryParse(tt2, GeoTokenType.ORG);
                if (nu !== null) {
                    org.addSlot("NUMBER", nu.value, false, 0);
                    res.endToken = nu.endToken;
                }
                else {
                    let sit = StreetItemToken.tryParse(tt2, null, false, null);
                    if (sit !== null && sit.typ === StreetItemType.NOUN && sit.termin.canonicText.includes("КВАРТАЛ")) {
                        for (tt2 = sit.endToken.next; tt2 !== null; tt2 = tt2.next) {
                            let num = NumToken.tryParse(tt2, GeoTokenType.ORG);
                            if (num === null) 
                                break;
                            org.addSlot("NUMBER", num.value, false, 0);
                            res.endToken = num.endToken;
                            tt2 = num.endToken.next;
                            if (tt2 === null) 
                                break;
                            if (!tt2.isCommaAnd) 
                                break;
                        }
                    }
                }
            }
        }
        return res;
    }
    
    static tryParseRailway(t) {
        if (!(t instanceof TextToken) || !t.chars.isLetter) 
            return null;
        if (t.isValue("ДОРОГА", null) && (t.whitespacesAfterCount < 3)) {
            let _next = OrgItemToken.tryParseRailway(t.next);
            if (_next !== null) {
                _next.beginToken = t;
                return _next;
            }
        }
        let ad = GeoAnalyzer.getData(t);
        if (ad === null) 
            return null;
        if (ad.oLevel > 0) 
            return null;
        ad.oLevel++;
        let res = OrgItemToken._tryParseRailway(t);
        ad.oLevel--;
        return res;
    }
    
    static _tryParseRailwayOrg(t) {
        if (t === null) 
            return null;
        let cou = 0;
        let ok = false;
        for (let tt = t; tt !== null && (cou < 4); tt = tt.next,cou++) {
            if (tt instanceof TextToken) {
                let val = tt.term;
                if (val === "Ж" || val.startsWith("ЖЕЛЕЗ")) {
                    ok = true;
                    break;
                }
                if (LanguageHelper.endsWith(val, "ЖД")) {
                    ok = true;
                    break;
                }
            }
        }
        if (!ok) 
            return null;
        let rt = t.kit.processReferent("ORGANIZATION", t, null);
        if (rt === null) 
            return null;
        for (const ty of rt.referent.getStringValues("TYPE")) {
            if (ty.endsWith("дорога")) 
                return rt;
        }
        return null;
    }
    
    static _tryParseRailway(t) {
        let rt0 = OrgItemToken._tryParseRailwayOrg(t);
        if (rt0 !== null) {
            let res = StreetItemToken._new1269(t, rt0.endToken, StreetItemType.FIX, true);
            res.value = rt0.referent.getStringValue("NAME");
            t = res.endToken.next;
            if (t !== null && t.isComma) 
                t = t.next;
            let _next = OrgItemToken._tryParseRzdDir(t);
            if (_next !== null) {
                res.endToken = _next.endToken;
                res.value = (res.value + " " + _next.value);
            }
            else if ((t instanceof TextToken) && t.morph._class.isAdjective && !t.chars.isAllLower) {
                let ok = false;
                if (t.isNewlineAfter || t.next === null) 
                    ok = true;
                else if (t.next.isCharOf(".,")) 
                    ok = true;
                else if (AddressItemToken.checkHouseAfter(t.next, false, false) || AddressItemToken.checkKmAfter(t.next)) 
                    ok = true;
                if (ok) {
                    res.value = (res.value + " " + t.term + " НАПРАВЛЕНИЕ");
                    res.endToken = t;
                }
            }
            if (res.value === "РОССИЙСКИЕ ЖЕЛЕЗНЫЕ ДОРОГИ") 
                res.nounIsDoubtCoef = 2;
            return res;
        }
        let dir = OrgItemToken._tryParseRzdDir(t);
        if (dir !== null && dir.nounIsDoubtCoef === 0) 
            return dir;
        return null;
    }
    
    static _tryParseRzdDir(t) {
        let napr = null;
        let tt0 = null;
        let tt1 = null;
        let val = null;
        let cou = 0;
        for (let tt = t; tt !== null && (cou < 4); tt = tt.next,cou++) {
            if (tt.isCharOf(",.")) 
                continue;
            if (tt.isNewlineBefore) 
                break;
            if (tt.isValue("НАПРАВЛЕНИЕ", null)) {
                napr = tt;
                continue;
            }
            if (tt.isValue("НАПР", null)) {
                if (tt.next !== null && tt.next.isChar('.')) 
                    tt = tt.next;
                napr = tt;
                continue;
            }
            let npt = MiscLocationHelper.tryParseNpt(tt);
            if (npt !== null && npt.adjectives.length > 0 && npt.noun.isValue("КОЛЬЦО", null)) {
                tt0 = tt;
                tt1 = npt.endToken;
                val = npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                break;
            }
            if ((tt instanceof TextToken) && ((!tt.chars.isAllLower || napr !== null)) && ((tt.morph.gender.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                tt0 = (tt1 = tt);
                continue;
            }
            if ((((tt instanceof TextToken) && ((!tt.chars.isAllLower || napr !== null)) && tt.next !== null) && tt.next.isHiphen && (tt.next.next instanceof TextToken)) && ((tt.next.next.morph.gender.value()) & (MorphGender.NEUTER.value())) !== (MorphGender.UNDEFINED.value())) {
                tt0 = tt;
                tt = tt.next.next;
                tt1 = tt;
                continue;
            }
            break;
        }
        if (tt0 === null) 
            return null;
        let res = StreetItemToken._new1270(tt0, tt1, StreetItemType.FIX, true, 1);
        if (val !== null) 
            res.value = val;
        else {
            res.value = tt1.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, MorphGender.NEUTER, false);
            if (tt0 !== tt1) 
                res.value = (tt0.term + " " + res.value);
            res.value += " НАПРАВЛЕНИЕ";
        }
        if (napr !== null && napr.endChar > res.endChar) 
            res.endToken = napr;
        t = res.endToken.next;
        if (t !== null && t.isComma) 
            t = t.next;
        if (t !== null) {
            let rt0 = OrgItemToken._tryParseRailwayOrg(t);
            if (rt0 !== null) {
                res.value = (rt0.referent.getStringValue("NAME") + " " + res.value);
                res.endToken = rt0.endToken;
                res.nounIsDoubtCoef = 0;
            }
        }
        return res;
    }
    
    _tryParseDetails() {
        if (this.whitespacesAfterCount > 2) 
            return;
        let t = this.endToken.next;
        if (t === null) 
            return;
        let tok = OrgItemToken.m_Onto.tryParse(t, TerminParseAttr.NO);
        if (tok !== null) {
            t = tok.endToken.next;
            let cits = CityItemToken.tryParseList(t, 5, null);
            if (cits !== null && cits.length > 1) {
                let rt = CityAttachHelper.tryDefine(cits, null, false);
                if (rt !== null) {
                    this.endToken = rt.endToken;
                    t = this.endToken.next;
                    this._mergeWith(rt.referent);
                }
            }
            let ait = AddressItemToken.tryParse(t, false, null, null);
            if (ait !== null && ait.typ === AddressItemType.STREET && ait.referent !== null) {
                this.endToken = ait.endToken;
                t = this.endToken.next;
                this._mergeWith(ait.referent);
                ait = AddressItemToken.tryParse(t, false, null, null);
                if (ait !== null && ait.typ === AddressItemType.HOUSE && ait.value !== null) {
                    this.referent.addSlot("NUMBER", ait.value, false, 0);
                    this.endToken = ait.endToken;
                    t = this.endToken.next;
                }
            }
            else if ((ait !== null && ait.typ === AddressItemType.HOUSE && ait.houseType !== AddressHouseType.SPECIAL) && ait.value !== null) {
                this.referent.addSlot("NUMBER", ait.value, false, 0);
                this.endToken = ait.endToken;
                t = this.endToken.next;
            }
            if (t === tok.endToken.next) {
                if (t === null || tok.isNewlineAfter) {
                    this.endToken = tok.endToken;
                    return;
                }
                let name = NameToken.tryParse(t, GeoTokenType.ORG, 0, false);
                if (name !== null && name.name !== null && this.referent.findSlot("NAME", null, true) === null) {
                    this.referent.addSlot("NAME", name.name, false, 0);
                    if (name.number !== null) 
                        this.referent.addSlot("NUMBER", name.number, false, 0);
                    this.endToken = name.endToken;
                    t = this.endToken.next;
                }
            }
        }
        else {
            let isGaraz = false;
            for (const s of this.referent.slots) {
                if (s.typeName === "TYPE" && ((typeof s.value === 'string' || s.value instanceof String))) {
                    let ty = Utils.asString(s.value);
                    if (ty.includes("гараж") || ty.includes("автомоб")) {
                        isGaraz = true;
                        break;
                    }
                }
            }
            if (isGaraz) {
                let ait = AddressItemToken.tryParse(t, false, null, null);
                if (ait !== null && ait.typ === AddressItemType.STREET && ait.referent !== null) {
                }
                else if (ait !== null && ait.typ === AddressItemType.HOUSE && ait.value !== null) {
                    this.referent.addSlot("NUMBER", ait.value, false, 0);
                    this.endToken = ait.endToken;
                    t = this.endToken.next;
                }
                else if (ait !== null && ait.detailType === AddressDetailType.NEAR) {
                    let ait2 = AddressItemToken.tryParse(ait.endToken.next, false, null, null);
                    if (ait2 !== null && ait2.typ === AddressItemType.HOUSE && ait2.value !== null) {
                        this.referent.addSlot("NUMBER", ait2.value, false, 0);
                        this.endToken = ait2.endToken;
                        t = this.endToken.next;
                    }
                }
            }
        }
    }
    
    _mergeWith(r) {
        let names = this.referent.getStringValues("NAME");
        for (const n of r.getStringValues("NAME")) {
            if (names.length > 0) {
                for (const n0 of names) {
                    this.referent.addSlot("NAME", (n0 + " " + n), false, 0);
                }
            }
            else 
                this.referent.addSlot("NAME", n, false, 0);
        }
        for (const n of r.getStringValues("NUMBER")) {
            this.referent.addSlot("NUMBER", n, false, 0);
        }
        for (const n of r.getStringValues("MISC")) {
            this.referent.addSlot("MISC", n, false, 0);
        }
    }
    
    static initialize() {
        OrgItemToken.m_Onto = new TerminCollection();
        let t = null;
        t = new Termin("В РАЙОНЕ");
        t.addAbridge("В Р-НЕ");
        OrgItemToken.m_Onto.add(t);
        t = new Termin("РАЙОН");
        t.addAbridge("Р-Н");
        t.addAbridge("Р-ОН");
        OrgItemToken.m_Onto.add(t);
        OrgItemToken.m_Onto.add(new Termin("ПО"));
        OrgItemToken.m_Onto.add(new Termin("ОКОЛО"));
        OrgItemToken.m_Onto.add(new Termin("ВО ДВОРЕ"));
    }
    
    static static_constructor() {
        OrgItemToken.SPEED_REGIME = false;
        OrgItemToken.m_Onto = null;
    }
}


OrgItemToken.static_constructor();

module.exports = OrgItemToken