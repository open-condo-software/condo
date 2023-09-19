/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const AddressReferent = require("./../../ner/address/AddressReferent");
const LanguageHelper = require("./../../morph/LanguageHelper");
const TextToken = require("./../../ner/TextToken");
const SourceOfAnalysis = require("./../../ner/SourceOfAnalysis");
const MiscLocationHelper = require("./../../ner/geo/internal/MiscLocationHelper");
const ReferentsEqualType = require("./../../ner/core/ReferentsEqualType");
const OrganizationReferent = require("./../../ner/org/OrganizationReferent");
const StreetItemToken = require("./../../ner/address/internal/StreetItemToken");
const AddrLevel = require("./../AddrLevel");
const Referent = require("./../../ner/Referent");
const ProcessorService = require("./../../ner/ProcessorService");
const GarStatus = require("./../GarStatus");
const StreetKind = require("./../../ner/address/StreetKind");
const AreaAttributes = require("./../AreaAttributes");
const GeoReferent = require("./../../ner/geo/GeoReferent");
const StreetReferent = require("./../../ner/address/StreetReferent");
const StreetDefineHelper = require("./../../ner/address/internal/StreetDefineHelper");

class NameAnalyzer {
    
    constructor() {
        this.status = GarStatus.ERROR;
        this.ref = null;
        this.types = null;
        this.strings = null;
        this.stringsEx = null;
        this.doubtStrings = null;
        this.miscs = null;
        this.level = AddrLevel.UNDEFINED;
        this.sec = null;
    }
    
    toString() {
        let tmp = new StringBuilder();
        this.outInfo(tmp);
        return tmp.toString();
    }
    
    initByReferent(r, garRegime) {
        this.ref = r;
        this.strings = new Array();
        this.doubtStrings = new Array();
        if (garRegime) 
            this.stringsEx = new Array();
        else 
            this.stringsEx = null;
        if ((this.ref instanceof GeoReferent) && Utils.compareStrings(this.ref.toString(), "ДНР", true) === 0) {
            this.ref = new GeoReferent();
            this.ref.addSlot(GeoReferent.ATTR_TYPE, "республика", false, 0);
            this.ref.addSlot(GeoReferent.ATTR_NAME, "ДОНЕЦКАЯ", false, 0);
            this.level = AddrLevel.REGIONAREA;
        }
        else if ((this.ref instanceof GeoReferent) && Utils.compareStrings(this.ref.toString(), "ЛНР", true) === 0) {
            this.ref = new GeoReferent();
            this.ref.addSlot(GeoReferent.ATTR_TYPE, "республика", false, 0);
            this.ref.addSlot(GeoReferent.ATTR_NAME, "ЛУГАНСКАЯ", false, 0);
            this.level = AddrLevel.REGIONAREA;
        }
        NameAnalyzer.getStrings(this.ref, this.strings, this.doubtStrings, this.stringsEx);
        this.types = this.ref.getStringValues((this.ref instanceof StreetReferent ? StreetReferent.ATTR_TYPE : GeoReferent.ATTR_TYPE));
        if (this.ref instanceof StreetReferent) {
            let num = this.ref.numbers;
            if (num !== null && num.endsWith("км")) {
                if (this.ref.names.length > 0) {
                    this.sec = new NameAnalyzer();
                    let s1 = new StreetReferent();
                    s1.addSlot(StreetReferent.ATTR_NUMBER, num, false, 0);
                    this.sec.initByReferent(s1, garRegime);
                    this.level = AddrLevel.TERRITORY;
                    r.addSlot(StreetReferent.ATTR_NUMBER, null, true, 0);
                    this.strings.splice(0, this.strings.length);
                    this.doubtStrings.splice(0, this.doubtStrings.length);
                    if (this.stringsEx !== null) 
                        this.stringsEx.splice(0, this.stringsEx.length);
                    NameAnalyzer.getStrings(r, this.strings, this.doubtStrings, this.stringsEx);
                    r.addSlot(StreetReferent.ATTR_NUMBER, num, true, 0);
                }
                else 
                    this.types.push("километр");
            }
        }
        if (this.level === AddrLevel.UNDEFINED) 
            this.level = NameAnalyzer.calcLevel(this.ref);
        this.miscs = this.ref.getStringValues("MISC");
        if (this.miscs.length > 0) {
            let addMisc = new Array();
            for (const m of this.miscs) {
                let s = null;
                if (m.includes("гараж")) 
                    s = "гаражи";
                else if (m.includes("садов") || m.includes("дачн")) 
                    s = "дачи";
                else if (m.includes("жилищ")) 
                    s = "жилье";
                else if (m.includes("месторожде")) 
                    s = "месторождение";
                if (s !== null && !addMisc.includes(s)) 
                    addMisc.push(s);
            }
            let hasUp = false;
            for (const m of this.miscs) {
                if (Utils.isUpperCase(m[0])) 
                    hasUp = true;
            }
            if (hasUp) {
                for (let i = this.miscs.length - 1; i >= 0; i--) {
                    if (!Utils.isUpperCase(this.miscs[i][0]) && this.miscs[i].indexOf(' ') > 0) 
                        this.miscs.splice(i, 1);
                }
            }
            if (addMisc.length > 0) {
                for (const m of addMisc) {
                    if (!this.miscs.includes(m)) 
                        this.miscs.push(m);
                }
            }
            if (this.ref instanceof StreetReferent) {
                if (this.ref.kind === StreetKind.ROAD) 
                    this.miscs.push("дорога");
            }
        }
        this.status = GarStatus.OK;
    }
    
    static mergeObjects(hi, lo) {
        return null;
    }
    
    tryCreateAlternative(_sec, prev, next) {
        let street = Utils.as(this.ref, StreetReferent);
        if (street !== null) {
            let name = street.getStringValue(StreetReferent.ATTR_NAME);
            let typs = street.typs;
            if (!_sec && street.numbers !== null && name === "МИКРОРАЙОН") {
                let sr = new StreetReferent();
                sr.addSlot(StreetReferent.ATTR_TYPE, name.toLowerCase(), false, 0);
                sr.numbers = street.numbers;
                sr.kind = StreetKind.AREA;
                let alt = new NameAnalyzer();
                alt.initByReferent(sr, false);
                return alt;
            }
            else if ((name === null && !_sec && street.numbers !== null) && ((typs.includes("микрорайон") || typs.includes("набережная")))) {
                let sr = new StreetReferent();
                sr.addSlot(StreetReferent.ATTR_NAME, (typs.includes("микрорайон") ? "МИКРОРАЙОН" : "НАБЕРЕЖНАЯ"), false, 0);
                sr.numbers = street.numbers;
                let alt = new NameAnalyzer();
                alt.initByReferent(sr, false);
                return alt;
            }
        }
        let geo = Utils.as(this.ref, GeoReferent);
        if (geo !== null) {
            let typs = geo.typs;
            if (typs.length === 1 && ((typs[0] === "район" || typs[0] === "муниципальный район" || typs[0] === "населенный пункт"))) {
                let num = geo.getStringValue("NUMBER");
                if (!_sec) {
                    let geo2 = new GeoReferent();
                    geo2.addSlot(GeoReferent.ATTR_TYPE, "населенный пункт", false, 0);
                    for (const s of geo.getStringValues(GeoReferent.ATTR_NAME)) {
                        geo2.addSlot(GeoReferent.ATTR_NAME, s, false, 0);
                    }
                    if (num !== null) 
                        geo2.addSlot("NUMBER", num, false, 0);
                    let alt = new NameAnalyzer();
                    alt.initByReferent(geo2, false);
                    return alt;
                }
                else {
                    if (prev !== null && prev.level === AddrLevel.REGIONAREA) 
                        return null;
                    if (next !== null && next.level === AddrLevel.STREET) 
                        return null;
                    let sr = new StreetReferent();
                    for (const s of geo.getStringValues(GeoReferent.ATTR_NAME)) {
                        sr.addSlot(StreetReferent.ATTR_NAME, s, false, 0);
                    }
                    if (num !== null) 
                        sr.addSlot(StreetReferent.ATTR_NUMBER, num, false, 0);
                    let alt = new NameAnalyzer();
                    alt.initByReferent(sr, false);
                    return alt;
                }
            }
            if (geo.isCity && !typs.includes("город")) {
                if (prev !== null && ((prev.level === AddrLevel.CITY || prev.level === AddrLevel.REGIONCITY || prev.level === AddrLevel.LOCALITY))) {
                    if (next !== null && ((next.level === AddrLevel.STREET || next.level === AddrLevel.TERRITORY))) 
                        return null;
                    let sr = new StreetReferent();
                    for (const s of geo.getStringValues(GeoReferent.ATTR_NAME)) {
                        sr.addSlot(StreetReferent.ATTR_NAME, s, false, 0);
                    }
                    for (const ty of typs) {
                        sr.addSlot(StreetReferent.ATTR_MISC, ty, false, 0);
                    }
                    let num = geo.getStringValue("NUMBER");
                    if (num !== null) 
                        sr.addSlot(StreetReferent.ATTR_NUMBER, num, false, 0);
                    let alt = new NameAnalyzer();
                    alt.initByReferent(sr, false);
                    return alt;
                }
            }
        }
        return null;
    }
    
    processEx(go) {
        let aa = Utils.as(go.attrs, AreaAttributes);
        this.process(aa.names, aa.types[0]);
    }
    
    process(names, typ) {
        this.strings = null;
        this.status = GarStatus.ERROR;
        this.ref = null;
        if (typ === "чувашия") {
            typ = "республика";
            names[0] = "Чувашская Республика";
        }
        let bestCoef = 10000;
        let bestRef = null;
        let bestSecRef = null;
        let bestRef2 = null;
        for (let nn = 0; nn < names.length; nn++) {
            let name = NameAnalyzer.correctFiasName(names[nn]);
            for (let jj = nn + 1; jj < names.length; jj++) {
                if (names[jj] === name) {
                    names.splice(jj, 1);
                    jj--;
                }
            }
            if (name.includes("Капотня")) {
            }
            if (name === "ЖСТ Чаевод квартал Питомник-2") {
            }
            if (name.indexOf('/') > 0) {
                let ar = null;
                try {
                    ar = ProcessorService.getEmptyProcessor().process(SourceOfAnalysis._new160(name, "GARADDRESS"), null, null);
                } catch (ex165) {
                    continue;
                }
                for (let t = ar.firstToken; t !== null; t = t.next) {
                    if (t.isChar('/')) {
                        if (!(t.previous instanceof TextToken) || !(t.next instanceof TextToken)) 
                            continue;
                        if ((t.endChar + 5) > name.length) 
                            break;
                        if (t.beginChar < 10) 
                            break;
                        if (!t.chars.isCapitalUpper) 
                            break;
                        let n1 = name.substring(0, 0 + t.beginChar).trim();
                        let n2 = name.substring(t.beginChar + 1).trim();
                        name = (names[nn] = n1);
                        names.splice(nn + 1, 0, n2);
                        break;
                    }
                }
            }
            if (Utils.isNullOrEmpty(name)) 
                continue;
            name = NameAnalyzer._corrName(name);
            if (typ === "муниципальный округ") {
                if (name.startsWith("поселение ")) 
                    name = name.substring(10).trim();
            }
            if (name.includes("Олимп.дер")) 
                name = "улица Олимпийская Деревня";
            else if (Utils.compareStrings("ЛЕНИНСКИЕ ГОРЫ", name, true) === 0) 
                name = "улица " + name;
            for (let k = 0; k < 1; k++) {
                if (k > 0 && Utils.isNullOrEmpty(typ)) 
                    continue;
                let txt = (Utils.isNullOrEmpty(typ) ? name : (k === 1 ? (typ + " \"" + name + "\"") : (typ + " " + name)));
                if (Utils.compareStrings((typ != null ? typ : ""), "километр", true) === 0 && (((name.length < 6) || !Utils.isDigit(name[0])))) 
                    txt = (name + " " + typ);
                let txt0 = txt;
                let ncheck = MiscLocationHelper.NAME_CHECKER;
                MiscLocationHelper.NAME_CHECKER = null;
                let ar = null;
                try {
                    ar = ProcessorService.getStandardProcessor().process(SourceOfAnalysis._new160(txt, "GARADDRESS"), null, null);
                } catch (ex) {
                }
                MiscLocationHelper.NAME_CHECKER = ncheck;
                let r = null;
                let r2 = null;
                if (ar === null) 
                    continue;
                for (let ii = ar.entities.length - 1; ii >= 0; ii--) {
                    if (ar.entities[ii] instanceof GeoReferent) {
                        let geo = Utils.as(ar.entities[ii], GeoReferent);
                        if (geo.findSlot("NAME", "МОСКВА", true) !== null) {
                            if (Utils.compareStrings("МОСКВА", name, true) === 0) {
                            }
                            else 
                                continue;
                        }
                        if (geo.occurrence.length === 0 || geo.occurrence[0].beginChar > 8) 
                            continue;
                        if (r === null) 
                            r = geo;
                    }
                    else if (ar.entities[ii] instanceof StreetReferent) {
                        if (r === null) 
                            r = ar.entities[ii];
                        else if (ar.entities[ii].higher === r) 
                            r = ar.entities[ii];
                    }
                    else if (ar.entities[ii] instanceof AddressReferent) {
                        let aa = Utils.as(ar.entities[ii], AddressReferent);
                        if (aa.block !== null) {
                            r2 = new StreetReferent();
                            r2.addSlot(StreetReferent.ATTR_TYPE, "блок", false, 0);
                            r2.addSlot(StreetReferent.ATTR_NUMBER, aa.block, false, 0);
                            r2.occurrence.splice(r2.occurrence.length, 0, ...aa.occurrence);
                        }
                    }
                    else {
                    }
                }
                let co = 0;
                if (r === null) {
                    if ((name.indexOf(' ') < 0) && (name.indexOf('.') < 0) && Utils.isNullOrEmpty(typ)) {
                        r = new StreetReferent();
                        r.addSlot(StreetReferent.ATTR_NAME, name.toUpperCase(), false, 0);
                        r.addSlot(StreetReferent.ATTR_TYPE, "улица", false, 0);
                        co = 10;
                    }
                    else {
                        let ar1 = null;
                        try {
                            ar1 = ProcessorService.getStandardProcessor().process(new SourceOfAnalysis(txt0), null, null);
                        } catch (ex167) {
                        }
                        if (ar1 !== null && ar1.firstToken !== null) {
                            if (txt0.includes("линия")) {
                            }
                            let strs = StreetItemToken.tryParseList(ar1.firstToken, 10, null);
                            let rt = StreetDefineHelper.tryParseExtStreet(strs);
                            if (rt !== null && rt.endToken.next === null) {
                                txt = txt0;
                                r = rt.referent;
                            }
                        }
                        if (r === null) 
                            continue;
                    }
                }
                else if (r.occurrence.length > 0) {
                    if (r.occurrence[0].endChar < (txt.length - 1)) {
                        if (r2 !== null && r2.occurrence.length > 0 && r2.occurrence[0].endChar >= (txt.length - 1)) {
                        }
                        else 
                            co += (txt.length - 1 - r.occurrence[0].endChar);
                    }
                }
                if (co < bestCoef) {
                    bestCoef = co;
                    bestRef = r;
                    bestSecRef = r2;
                    bestRef2 = null;
                    if (bestCoef === 0) 
                        break;
                }
                else if (co === bestCoef) {
                    if (bestRef2 === null) 
                        bestRef2 = r;
                    else if (bestRef2.canBeEquals(bestRef, ReferentsEqualType.WITHINONETEXT)) 
                        bestRef2 = r;
                }
            }
            if (bestRef !== null) {
                this.ref = bestRef;
                this.initByReferent(this.ref, true);
                if (bestCoef > 0) 
                    this.status = GarStatus.WARNING;
                let secRef = null;
                if (this.ref instanceof StreetReferent) {
                    let str = Utils.as(this.ref, StreetReferent);
                    if (str.higher !== null) 
                        secRef = str.higher;
                    else {
                        let geo = Utils.as(str.getSlotValue("GEO"), GeoReferent);
                        if (geo !== null && geo.findSlot("NAME", "Москва", true) === null) 
                            secRef = geo;
                    }
                }
                if (secRef !== null) {
                    this.sec = new NameAnalyzer();
                    this.sec.initByReferent(this.ref, true);
                    this.initByReferent(secRef, true);
                }
                else if (bestSecRef !== null) {
                    this.sec = new NameAnalyzer();
                    this.sec.initByReferent(bestSecRef, true);
                }
            }
            if (this.status === GarStatus.OK && this.level === AddrLevel.UNDEFINED) 
                this.status = GarStatus.WARNING;
            if (this.sec !== null) {
                if (this.sec.sec !== null) 
                    this.status = GarStatus.ERROR;
                else if (this.sec.status !== GarStatus.OK) 
                    this.status = this.sec.status;
                if (this.status === GarStatus.OK) 
                    this.status = GarStatus.OK2;
            }
        }
    }
    
    outInfo(tmp) {
        if (this.status === GarStatus.ERROR && this.sec === null) {
            tmp.append("ошибка");
            return;
        }
        tmp.append(String(this.level)).append(" ");
        if (this.types !== null) {
            for (let i = 0; i < this.types.length; i++) {
                tmp.append((i > 0 ? "/" : "")).append(this.types[i]);
            }
        }
        if (this.strings !== null && this.strings.length > 0) {
            tmp.append(" <");
            for (let i = 0; i < this.strings.length; i++) {
                tmp.append((i > 0 ? ", " : "")).append(this.strings[i]);
            }
            tmp.append(">");
        }
        if (this.miscs !== null && this.miscs.length > 0) {
            tmp.append(" [");
            for (let i = 0; i < this.miscs.length; i++) {
                tmp.append((i > 0 ? ", " : "")).append(this.miscs[i]);
            }
            tmp.append("]");
        }
        if (this.sec !== null) {
            tmp.append(" + ");
            this.sec.outInfo(tmp);
        }
        if (this.status === GarStatus.WARNING) 
            tmp.append(" (неточность при анализе)");
        else if (this.status === GarStatus.ERROR) 
            tmp.append(" (ОШИБКА)");
    }
    
    static calcLevel(r) {
        const RegionHelper = require("./RegionHelper");
        let geo = Utils.as(r, GeoReferent);
        let res = AddrLevel.UNDEFINED;
        if (geo !== null) {
            if (geo.isState) 
                return AddrLevel.COUNTRY;
            if (geo.isCity) {
                res = AddrLevel.LOCALITY;
                for (const ty of geo.typs) {
                    if (ty === "город" || ty === "місто") {
                        res = AddrLevel.CITY;
                        let nam = geo.getStringValue(GeoReferent.ATTR_NAME);
                        if (nam === "МОСКВА" || nam === "САНКТ-ПЕТЕРБУРГ" || nam === "СЕВАСТОПОЛЬ") 
                            res = AddrLevel.REGIONCITY;
                        break;
                    }
                    else if (ty === "городское поселение" || ty === "сельское поселение") {
                        res = AddrLevel.SETTLEMENT;
                        break;
                    }
                    else if (ty === "населенный пункт" && geo.typs.length === 1) {
                        let nam = geo.getStringValue(GeoReferent.ATTR_NAME);
                        if (RegionHelper.isBigCity(nam) !== null) 
                            res = AddrLevel.CITY;
                    }
                    else if (ty === "улус") 
                        res = AddrLevel.DISTRICT;
                }
            }
            else if (geo.isRegion) {
                res = AddrLevel.DISTRICT;
                for (const ty of geo.typs) {
                    if ((ty === "городской округ" || ty === "муниципальный район" || ty === "муниципальный округ") || ty === "федеральная территория") {
                        res = AddrLevel.DISTRICT;
                        break;
                    }
                    else if (ty === "район" || ty === "автономный округ") {
                        res = AddrLevel.DISTRICT;
                        break;
                    }
                    else if (ty === "область" || ty === "край") {
                        res = AddrLevel.REGIONAREA;
                        break;
                    }
                    else if (ty === "сельский округ") {
                        res = AddrLevel.SETTLEMENT;
                        break;
                    }
                    else if (ty === "республика") {
                        res = AddrLevel.REGIONAREA;
                        break;
                    }
                }
            }
            return res;
        }
        let street = Utils.as(r, StreetReferent);
        if (street !== null) {
            res = AddrLevel.STREET;
            let ki = r.kind;
            if (ki === StreetKind.AREA || ki === StreetKind.ORG) 
                res = AddrLevel.TERRITORY;
        }
        if (r instanceof OrganizationReferent) 
            return AddrLevel.TERRITORY;
        return res;
    }
    
    static correctFiasName(name) {
        if (name === null) 
            return null;
        let ii = name.indexOf(", находящ");
        if (ii < 0) 
            ii = name.indexOf(",находящ");
        if (ii > 0) 
            name = name.substring(0, 0 + ii).trim();
        if (name.includes("Г СК ")) 
            name = Utils.replaceString(name, "Г СК ", "ГСК ");
        return name;
    }
    
    static corrName(str) {
        let res = new StringBuilder();
        NameAnalyzer._corrName2(res, str.toUpperCase());
        return res.toString();
    }
    
    static _corrName2(res, str) {
        let corr = 0;
        for (let i = 0; i < str.length; i++) {
            let ch = str[i];
            if (ch === 'Ь' || ch === 'Ъ') {
                corr++;
                continue;
            }
            if (Utils.isLetterOrDigit(ch) || ch === ' ' || ch === '-') {
                if (ch === '-') {
                    ch = ' ';
                    corr++;
                }
                if (i > 0 && res.length > 0 && res.charAt(res.length - 1) === ch) {
                    corr++;
                    continue;
                }
                res.append(ch);
            }
        }
        if (str.length > 4 && res.length > 4) {
            let ch1 = res.charAt(res.length - 1);
            let ch2 = res.charAt(res.length - 2);
            let ch3 = res.charAt(res.length - 3);
            if (LanguageHelper.isCyrillicVowel(ch1) || ch1 === 'Й') {
                if (!LanguageHelper.isCyrillicVowel(ch2)) {
                    if (ch2 === 'Г' && ch3 === 'О') 
                        res.length = res.length - 2;
                    res.setCharAt(res.length - 1, '@');
                }
                else if (!LanguageHelper.isCyrillicVowel(ch3)) {
                    res.length = res.length - 1;
                    res.setCharAt(res.length - 1, '@');
                }
            }
        }
        return corr;
    }
    
    static _corrName(name) {
        const CorrectionHelper = require("./CorrectionHelper");
        let jj = name.indexOf('(');
        if (jj > 0) 
            name = name.substring(0, 0 + jj).trim();
        let secVar = null;
        let det = null;
        let wrapsecVar168 = new RefOutArgWrapper();
        let wrapdet169 = new RefOutArgWrapper();
        name = CorrectionHelper.correct(name, wrapsecVar168, wrapdet169);
        secVar = wrapsecVar168.value;
        det = wrapdet169.value;
        if (Utils.isDigit(name[name.length - 1])) {
            for (let i = name.length - 1; i > 0; i--) {
                if (!Utils.isDigit(name[i])) {
                    if (name[i] !== '-') 
                        name += "-й";
                    break;
                }
            }
        }
        return name;
    }
    
    static createSearchVariants(res, res1, res2, name, num = null) {
        if (name === null) 
            return;
        let items = new Array();
        let sps = 0;
        let hiphs = 0;
        for (let i = 0; i < name.length; i++) {
            let ch = name[i];
            let j = 0;
            if (Utils.isLetter(ch)) {
                for (j = i; j < name.length; j++) {
                    if (!Utils.isLetter(name[j])) 
                        break;
                }
                if (i === 0 && j === name.length) 
                    items.push(name);
                else 
                    items.push(name.substring(i, i + j - i));
                i = j - 1;
            }
            else if (ch === ' ' || ch === '.') 
                sps++;
            else if (ch === '-') 
                hiphs++;
            else if (Utils.isDigit(ch) && num === null) {
                for (j = i; j < name.length; j++) {
                    if (!Utils.isDigit(name[j])) 
                        break;
                }
                num = name.substring(i, i + j - i);
                i = j - 1;
            }
        }
        let stdAdj = null;
        if (items.length > 1) {
            for (let i = 0; i < items.length; i++) {
                let it = items[i];
                if (it === "И") {
                    items.splice(i, 1);
                    i--;
                    if (items.length === 1) 
                        break;
                    continue;
                }
                for (let k = 0; k < 2; k++) {
                    let adjs = (k === 0 ? NameAnalyzer.m_StdArjsO : NameAnalyzer.m_StdArjsE);
                    let adjsAbbr = (k === 0 ? NameAnalyzer.m_StdArjsOAbbr : NameAnalyzer.m_StdArjsEAbbr);
                    for (let j = 0; j < adjs.length; j++) {
                        let a = adjs[j];
                        if (it.startsWith(a)) {
                            if (it.length === (a.length + 2)) {
                                stdAdj = adjsAbbr[j];
                                items.splice(i, 1);
                                break;
                            }
                            if (it.length === (a.length + 1)) {
                                if (k === 0 && it[a.length] === 'О') {
                                }
                                else if (k === 1 && it[a.length] === 'Е') {
                                }
                                else 
                                    continue;
                                stdAdj = adjsAbbr[j];
                                items.splice(i, 1);
                                break;
                            }
                            if (it.length > (a.length + 3)) {
                                if (k === 0 && it[a.length] === 'О') {
                                }
                                else if (k === 1 && it[a.length] === 'Е') {
                                }
                                else 
                                    continue;
                                stdAdj = adjsAbbr[j];
                                items[i] = it.substring(a.length + 1);
                                break;
                            }
                        }
                    }
                    if (stdAdj !== null) 
                        break;
                }
                if (stdAdj !== null) 
                    break;
            }
        }
        if (items.length > 1) 
            items.sort();
        let pref = null;
        if (stdAdj !== null) {
            pref = stdAdj.toLowerCase();
            if (num !== null) 
                pref += num;
        }
        else if (num !== null) 
            pref = num;
        let tmp = new StringBuilder();
        if (pref !== null) 
            tmp.append(pref);
        for (let i = 0; i < items.length; i++) {
            NameAnalyzer._corrName2(tmp, items[i]);
        }
        let r = tmp.toString();
        if (!res.includes(r)) 
            res.push(r);
        if (items.length === 1 && items[0].endsWith("ОГО")) {
            let rr = r.substring(0, 0 + r.length - 1) + "ОГ@";
            if (!res.includes(rr)) 
                res.push(rr);
        }
        if (res2 !== null && pref !== null) {
            tmp.remove(0, pref.length);
            tmp.append(pref);
            r = tmp.toString();
            if (!res2.includes(r)) 
                res2.push(r);
        }
    }
    
    static correctAdj(val) {
        for (let i = 0; i < NameAnalyzer.m_StdArjsE.length; i++) {
            if (val.startsWith(NameAnalyzer.m_StdArjsE[i])) 
                return NameAnalyzer.m_StdArjsEAbbr[i].toLowerCase();
        }
        for (let i = 0; i < NameAnalyzer.m_StdArjsO.length; i++) {
            if (val.startsWith(NameAnalyzer.m_StdArjsO[i])) 
                return NameAnalyzer.m_StdArjsOAbbr[i].toLowerCase();
        }
        return null;
    }
    
    static getStrings(r, res, doubts, revs) {
        if (r === null) 
            return;
        if ((r instanceof GeoReferent) || (r instanceof OrganizationReferent)) {
            let num = r.getStringValue("NUMBER");
            for (const s of r.slots) {
                if (s.typeName === GeoReferent.ATTR_NAME) {
                    let str = Utils.asString(s.value);
                    if (Utils.isNullOrEmpty(str)) 
                        continue;
                    NameAnalyzer.createSearchVariants(res, doubts, revs, str, num);
                    if ((str.length > 3 && !LanguageHelper.isCyrillicVowel(str[str.length - 1]) && str[str.length - 1] !== 'Й') && str[str.length - 1] !== 'Ь') 
                        NameAnalyzer.createSearchVariants(doubts, null, null, str + "А", num);
                }
            }
        }
        else if (r instanceof StreetReferent) {
            let str = Utils.as(r, StreetReferent);
            let num = str.numbers;
            for (const s of r.slots) {
                if (s.typeName === StreetReferent.ATTR_NAME) 
                    NameAnalyzer.createSearchVariants(res, doubts, revs, Utils.asString(s.value), num);
            }
            if (res.length === 0 && num !== null) {
                if (num.endsWith("км")) 
                    num = num.substring(0, 0 + num.length - 2);
                res.push(num);
            }
            if (res.length === 0) {
                let ty = r.getStringValue(StreetReferent.ATTR_TYPE);
                if (ty !== null) 
                    res.push(NameAnalyzer.corrName(ty.toUpperCase()));
            }
        }
        for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < (res.length - 1); j++) {
                if (res[j].length < res[j + 1].length) {
                    let s = res[j];
                    res[j] = res[j + 1];
                    res[j + 1] = s;
                }
            }
        }
    }
    
    calcEqualCoef(na) {
        if (na === null) 
            return -1;
        if (na.level === AddrLevel.TERRITORY && this.level === AddrLevel.TERRITORY) {
            if (((na.ref.findSlot("NAME", null, true) === null || this.ref.findSlot("NAME", null, true) === null)) && this.miscs.length > 0) {
                for (const m of this.miscs) {
                    if (na.miscs.includes(m)) 
                        return 0;
                }
                return -1;
            }
        }
        return 0;
    }
    
    canBeEquals(na) {
        if (na === null) 
            return false;
        let ok = false;
        for (const s of this.strings) {
            if (na.strings.includes(s)) {
                ok = true;
                break;
            }
        }
        if (!ok) 
            return false;
        return true;
    }
    
    static static_constructor() {
        NameAnalyzer.m_StdArjsO = ["СТАР", "НОВ", "МАЛ", "СЕВЕР", "ЮГ", "ЮЖН", "ЗАПАДН", "ВОСТОЧН", "КРАСН", "БЕЛ", "ГЛАВН", "ВЕЛИК"];
        NameAnalyzer.m_StdArjsOAbbr = ["СТ", "НВ", "МЛ", "СВ", "ЮГ", "ЮГ", "ЗП", "ВС", "КР", "БЛ", "ГЛ", "ВЛ"];
        NameAnalyzer.m_StdArjsE = ["ВЕРХН", "НИЖН", "СРЕДН", "БОЛЬШ"];
        NameAnalyzer.m_StdArjsEAbbr = ["ВР", "НЖ", "СР", "БЛ"];
    }
}


NameAnalyzer.static_constructor();

module.exports = NameAnalyzer