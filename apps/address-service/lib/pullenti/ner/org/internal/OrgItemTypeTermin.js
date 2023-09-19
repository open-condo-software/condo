/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const MorphLang = require("./../../../morph/MorphLang");
const Termin = require("./../../core/Termin");
const OrgProfile = require("./../OrgProfile");
const OrgItemTypeTyp = require("./OrgItemTypeTyp");

class OrgItemTypeTermin extends Termin {
    
    constructor(s, _lang = null, p1 = OrgProfile.UNDEFINED, p2 = OrgProfile.UNDEFINED) {
        super(s, _lang, false);
        this.m_Typ = OrgItemTypeTyp.UNDEFINED;
        this.mustBePartofName = false;
        this.isPurePrefix = false;
        this.canBeNormalDep = false;
        this.canHasNumber = false;
        this.canHasSingleName = false;
        this.canHasLatinName = false;
        this.mustHasCapitalName = false;
        this.isTop = false;
        this.canBeSingleGeo = false;
        this.isDoubtWord = false;
        this.coeff = 0;
        this.profiles = new Array();
        if (p1 !== OrgProfile.UNDEFINED) 
            this.profiles.push(p1);
        if (p2 !== OrgProfile.UNDEFINED) 
            this.profiles.push(p2);
    }
    
    get typ() {
        if (this.isPurePrefix) 
            return OrgItemTypeTyp.PREFIX;
        return this.m_Typ;
    }
    set typ(value) {
        if (value === OrgItemTypeTyp.PREFIX) {
            this.isPurePrefix = true;
            this.m_Typ = OrgItemTypeTyp.ORG;
        }
        else {
            this.m_Typ = value;
            if (this.m_Typ === OrgItemTypeTyp.DEP || this.m_Typ === OrgItemTypeTyp.DEPADD) {
                if (!this.profiles.includes(OrgProfile.UNIT)) 
                    this.profiles.push(OrgProfile.UNIT);
            }
        }
        return value;
    }
    
    get profile() {
        return OrgProfile.UNDEFINED;
    }
    set profile(value) {
        this.profiles.push(value);
        return value;
    }
    
    copyFrom(it) {
        this.profiles.splice(this.profiles.length, 0, ...it.profiles);
        this.isPurePrefix = it.isPurePrefix;
        this.canBeNormalDep = it.canBeNormalDep;
        this.canHasNumber = it.canHasNumber;
        this.canHasSingleName = it.canHasSingleName;
        this.canHasLatinName = it.canHasLatinName;
        this.mustBePartofName = it.mustBePartofName;
        this.mustHasCapitalName = it.mustHasCapitalName;
        this.isTop = it.isTop;
        this.canBeNormalDep = it.canBeNormalDep;
        this.canBeSingleGeo = it.canBeSingleGeo;
        this.isDoubtWord = it.isDoubtWord;
        this.coeff = it.coeff;
    }
    
    static deserializeSrc(xml, set) {
        let res = new Array();
        let isSet = xml.local_name === "set";
        if (isSet) 
            res.push((set = new OrgItemTypeTermin(null)));
        if (xml.attributes === null) 
            return res;
        for (const a of xml.attributes) {
            let nam = a.local_name;
            if (!nam.startsWith("name")) 
                continue;
            let _lang = MorphLang.RU;
            if (nam === "nameUa") 
                _lang = MorphLang.UA;
            else if (nam === "nameEn") 
                _lang = MorphLang.EN;
            let it = null;
            for (const s of Utils.splitString(a.value, ';', false)) {
                if (!Utils.isNullOrEmpty(s)) {
                    if (it === null) {
                        res.push((it = new OrgItemTypeTermin(s, _lang)));
                        if (set !== null) 
                            it.copyFrom(set);
                    }
                    else 
                        it.addVariant(s, false);
                }
            }
        }
        for (const a of xml.attributes) {
            let nam = a.local_name;
            if (nam.startsWith("name")) 
                continue;
            if (nam.startsWith("abbr")) {
                let _lang = MorphLang.RU;
                if (nam === "abbrUa") 
                    _lang = MorphLang.UA;
                else if (nam === "abbrEn") 
                    _lang = MorphLang.EN;
                for (const r of res) {
                    if (r.lang.equals(_lang)) 
                        r.acronym = a.value;
                }
                continue;
            }
            if (nam === "profile") {
                let li = new Array();
                for (const s of Utils.splitString(a.value, ';', false)) {
                    try {
                        let p = OrgProfile.of(s);
                        if (p !== OrgProfile.UNDEFINED) 
                            li.push(p);
                    } catch (ex) {
                    }
                }
                for (const r of res) {
                    r.profiles = li;
                }
                continue;
            }
            if (nam === "coef") {
                let v = Utils.parseFloat(a.value);
                for (const r of res) {
                    r.coeff = v;
                }
                continue;
            }
            if (nam === "partofname") {
                for (const r of res) {
                    r.mustBePartofName = a.value === "true";
                }
                continue;
            }
            if (nam === "top") {
                for (const r of res) {
                    r.isTop = a.value === "true";
                }
                continue;
            }
            if (nam === "geo") {
                for (const r of res) {
                    r.canBeSingleGeo = a.value === "true";
                }
                continue;
            }
            if (nam === "purepref") {
                for (const r of res) {
                    r.isPurePrefix = a.value === "true";
                }
                continue;
            }
            if (nam === "number") {
                for (const r of res) {
                    r.canHasNumber = a.value === "true";
                }
                continue;
            }
            throw new Error("Unknown Org Type Tag: " + a.name);
        }
        return res;
    }
    
    static _new1835(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1, _arg2, _arg3);
        res.coeff = _arg4;
        res.typ = _arg5;
        res.isTop = _arg6;
        res.canBeSingleGeo = _arg7;
        return res;
    }
    
    static _new1838(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.profile = _arg3;
        res.coeff = _arg4;
        return res;
    }
    
    static _new1839(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.profile = _arg4;
        res.coeff = _arg5;
        return res;
    }
    
    static _new1840(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.profile = _arg3;
        res.coeff = _arg4;
        res.canBeSingleGeo = _arg5;
        return res;
    }
    
    static _new1843(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.profile = _arg4;
        return res;
    }
    
    static _new1844(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.profile = _arg4;
        res.canBeNormalDep = _arg5;
        return res;
    }
    
    static _new1845(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new1846(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canBeSingleGeo = _arg4;
        return res;
    }
    
    static _new1847(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canBeSingleGeo = _arg5;
        return res;
    }
    
    static _new1853(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.isTop = _arg4;
        res.canBeSingleGeo = _arg5;
        return res;
    }
    
    static _new1855(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.isTop = _arg5;
        res.canBeSingleGeo = _arg6;
        return res;
    }
    
    static _new1856(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        return res;
    }
    
    static _new1858(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        return res;
    }
    
    static _new1861(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new1863(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canBeSingleGeo = _arg4;
        res.canBeNormalDep = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1865(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canBeSingleGeo = _arg4;
        res.canHasNumber = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1866(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canBeSingleGeo = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new1867(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canBeSingleGeo = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1869(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canBeSingleGeo = _arg5;
        res.canHasNumber = _arg6;
        res.profile = _arg7;
        return res;
    }
    
    static _new1876(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.acronym = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1877(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new1878(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new1881(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.lang = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1890(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.profile = _arg4;
        res.canBeSingleGeo = _arg5;
        return res;
    }
    
    static _new1891(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.isDoubtWord = _arg4;
        return res;
    }
    
    static _new1892(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.isDoubtWord = _arg5;
        return res;
    }
    
    static _new1895(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new1900(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.acronym = _arg3;
        res.profile = _arg4;
        res.canBeSingleGeo = _arg5;
        res.canHasNumber = _arg6;
        return res;
    }
    
    static _new1904(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.profile = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new1905(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.profile = _arg4;
        res.typ = _arg5;
        res.canHasNumber = _arg6;
        return res;
    }
    
    static _new1908(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.profile = _arg4;
        res.canHasNumber = _arg5;
        res.canHasLatinName = _arg6;
        return res;
    }
    
    static _new1914(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.acronym = _arg3;
        res.typ = _arg4;
        res.profile = _arg5;
        res.canBeSingleGeo = _arg6;
        res.canHasNumber = _arg7;
        return res;
    }
    
    static _new1915(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canBeNormalDep = _arg4;
        res.canBeSingleGeo = _arg5;
        res.canHasSingleName = _arg6;
        res.canHasLatinName = _arg7;
        res.profile = _arg8;
        return res;
    }
    
    static _new1921(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1933(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.acronym = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.canBeSingleGeo = _arg6;
        res.profile = _arg7;
        return res;
    }
    
    static _new1935(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        res.profile = _arg5;
        res.canHasLatinName = _arg6;
        return res;
    }
    
    static _new1941(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.isDoubtWord = _arg3;
        return res;
    }
    
    static _new1944(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasNumber = _arg5;
        res.profile = _arg6;
        res.canHasLatinName = _arg7;
        return res;
    }
    
    static _new1945(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.acronym = _arg5;
        res.canHasNumber = _arg6;
        res.profile = _arg7;
        res.canHasLatinName = _arg8;
        return res;
    }
    
    static _new1946(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasNumber = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1960(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        res.acronym = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1961(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.acronym = _arg6;
        res.profile = _arg7;
        return res;
    }
    
    static _new1962(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        return res;
    }
    
    static _new1972(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.profile = _arg7;
        return res;
    }
    
    static _new1973(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.canHasLatinName = _arg6;
        res.canHasSingleName = _arg7;
        res.profile = _arg8;
        return res;
    }
    
    static _new1976(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.isTop = _arg4;
        res.canHasSingleName = _arg5;
        res.canHasLatinName = _arg6;
        res.canBeSingleGeo = _arg7;
        res.profile = _arg8;
        return res;
    }
    
    static _new1977(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.isTop = _arg5;
        res.canHasSingleName = _arg6;
        res.canHasLatinName = _arg7;
        res.canBeSingleGeo = _arg8;
        return res;
    }
    
    static _new1981(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        return res;
    }
    
    static _new1982(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new1983(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasNumber = _arg6;
        return res;
    }
    
    static _new1984(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new1985(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.profile = _arg7;
        return res;
    }
    
    static _new1986(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.mustBePartofName = _arg4;
        return res;
    }
    
    static _new1987(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canonicText = _arg4;
        return res;
    }
    
    static _new1989(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.mustBePartofName = _arg5;
        return res;
    }
    
    static _new1990(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canonicText = _arg5;
        return res;
    }
    
    static _new1996(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        return res;
    }
    
    static _new1997(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.canHasLatinName = _arg6;
        res.canHasSingleName = _arg7;
        return res;
    }
    
    static _new2000(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new2002(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.coeff = _arg3;
        res.canBeSingleGeo = _arg4;
        res.canHasSingleName = _arg5;
        return res;
    }
    
    static _new2003(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.typ = _arg3;
        res.coeff = _arg4;
        res.canBeSingleGeo = _arg5;
        res.canHasSingleName = _arg6;
        return res;
    }
    
    static _new2004(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new2005(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.acronym = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2007(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.isDoubtWord = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new2008(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.isDoubtWord = _arg5;
        res.canHasNumber = _arg6;
        return res;
    }
    
    static _new2009(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.acronym = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new2010(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.acronym = _arg4;
        res.typ = _arg5;
        res.canHasNumber = _arg6;
        return res;
    }
    
    static _new2015(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new2022(_arg1, _arg2) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        return res;
    }
    
    static _new2023(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2025(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.isDoubtWord = _arg4;
        return res;
    }
    
    static _new2030(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.isDoubtWord = _arg3;
        res.canHasNumber = _arg4;
        return res;
    }
    
    static _new2031(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.isDoubtWord = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new2032(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.coeff = _arg3;
        res.canHasNumber = _arg4;
        res.canHasSingleName = _arg5;
        return res;
    }
    
    static _new2034(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.acronym = _arg2;
        res.typ = _arg3;
        res.coeff = _arg4;
        res.canHasNumber = _arg5;
        res.canHasSingleName = _arg6;
        return res;
    }
    
    static _new2035(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.coeff = _arg4;
        res.canHasNumber = _arg5;
        res.canHasSingleName = _arg6;
        return res;
    }
    
    static _new2037(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.acronym = _arg2;
        res.typ = _arg3;
        res.canBeNormalDep = _arg4;
        return res;
    }
    
    static _new2040(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.acronym = _arg3;
        res.typ = _arg4;
        res.canBeNormalDep = _arg5;
        return res;
    }
    
    static _new2043(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canBeNormalDep = _arg3;
        return res;
    }
    
    static _new2044(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canBeNormalDep = _arg4;
        return res;
    }
    
    static _new2056(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.acronym = _arg2;
        res.typ = _arg3;
        res.canBeNormalDep = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2057(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canBeNormalDep = _arg3;
        res.profile = _arg4;
        return res;
    }
    
    static _new2058(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canBeNormalDep = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2062(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasNumber = _arg3;
        res.isDoubtWord = _arg4;
        return res;
    }
    
    static _new2063(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasNumber = _arg3;
        res.isDoubtWord = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        return res;
    }
    
    static _new2064(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        res.isDoubtWord = _arg5;
        res.canHasLatinName = _arg6;
        res.canHasSingleName = _arg7;
        return res;
    }
    
    static _new2071(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasNumber = _arg3;
        return res;
    }
    
    static _new2072(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasNumber = _arg4;
        return res;
    }
    
    static _new2073(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.profile = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new2074(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.profile = _arg4;
        res.acronym = _arg5;
        return res;
    }
    
    static _new2080(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.acronym = _arg3;
        res.profile = _arg4;
        return res;
    }
    
    static _new2083(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.acronym = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2087(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.profile = _arg3;
        return res;
    }
    
    static _new2104(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.acronym = _arg3;
        return res;
    }
    
    static _new2106(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new2208(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.acronym = _arg3;
        res.acronymCanBeLower = _arg4;
        res.canBeSingleGeo = _arg5;
        return res;
    }
    
    static _new2209(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.acronym = _arg3;
        res.canHasLatinName = _arg4;
        return res;
    }
    
    static _new2212(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasLatinName = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new2213(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.acronym = _arg5;
        return res;
    }
    
    static _new2216(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasLatinName = _arg3;
        return res;
    }
    
    static _new2221(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasLatinName = _arg3;
        res.acronym = _arg4;
        res.acronymSmart = _arg5;
        return res;
    }
    
    static _new2232(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.acronym = _arg5;
        res.acronymSmart = _arg6;
        return res;
    }
    
    static _new2250(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.acronym = _arg3;
        res.acronymSmart = _arg4;
        return res;
    }
    
    static _new2253(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasLatinName = _arg3;
        res.acronym = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2254(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.acronym = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new2257(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasLatinName = _arg3;
        res.profile = _arg4;
        return res;
    }
    
    static _new2258(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2260(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        return res;
    }
    
    static _new2264(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasLatinName = _arg5;
        return res;
    }
    
    static _new2268(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasLatinName = _arg3;
        res.canHasNumber = _arg4;
        res.acronym = _arg5;
        return res;
    }
    
    static _new2269(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasNumber = _arg5;
        res.acronym = _arg6;
        return res;
    }
    
    static _new2274(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.acronym = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasNumber = _arg5;
        return res;
    }
    
    static _new2288(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasNumber = _arg6;
        return res;
    }
    
    static _new2289(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        return res;
    }
    
    static _new2290(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.profile = _arg3;
        res.canHasLatinName = _arg4;
        res.coeff = _arg5;
        return res;
    }
    
    static _new2291(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasSingleName = _arg4;
        res.canHasLatinName = _arg5;
        return res;
    }
    
    static _new2292(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.profile = _arg4;
        res.canHasSingleName = _arg5;
        res.canHasLatinName = _arg6;
        return res;
    }
    
    static _new2293(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.profile = _arg5;
        res.canHasSingleName = _arg6;
        res.canHasLatinName = _arg7;
        return res;
    }
    
    static _new2294(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasSingleName = _arg5;
        res.canHasLatinName = _arg6;
        return res;
    }
    
    static _new2295(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasSingleName = _arg4;
        res.canHasLatinName = _arg5;
        res.mustHasCapitalName = _arg6;
        return res;
    }
    
    static _new2296(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasSingleName = _arg5;
        res.canHasLatinName = _arg6;
        res.mustHasCapitalName = _arg7;
        return res;
    }
    
    static _new2299(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canBeNormalDep = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2301(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canBeNormalDep = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new2302(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasSingleName = _arg3;
        res.canHasLatinName = _arg4;
        res.isDoubtWord = _arg5;
        return res;
    }
    
    static _new2304(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasSingleName = _arg4;
        res.canHasLatinName = _arg5;
        res.isDoubtWord = _arg6;
        res.profile = _arg7;
        return res;
    }
    
    static _new2305(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasSingleName = _arg3;
        res.canHasLatinName = _arg4;
        res.isDoubtWord = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new2306(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasSingleName = _arg3;
        res.canHasLatinName = _arg4;
        res.profile = _arg5;
        return res;
    }
    
    static _new2307(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasSingleName = _arg4;
        res.canHasLatinName = _arg5;
        res.isDoubtWord = _arg6;
        return res;
    }
    
    static _new2308(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.coeff = _arg3;
        res.canHasSingleName = _arg4;
        return res;
    }
    
    static _new2309(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.coeff = _arg4;
        res.canHasSingleName = _arg5;
        return res;
    }
    
    static _new2321(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        return res;
    }
    
    static _new2322(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        return res;
    }
    
    static _new2323(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.canBeSingleGeo = _arg7;
        return res;
    }
    
    static _new2324(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.acronym = _arg5;
        res.canHasLatinName = _arg6;
        res.canHasSingleName = _arg7;
        res.canBeSingleGeo = _arg8;
        return res;
    }
    
    static _new2331(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        res.mustHasCapitalName = _arg6;
        return res;
    }
    
    static _new2332(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        res.mustHasCapitalName = _arg6;
        return res;
    }
    
    static _new2333(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.coeff = _arg4;
        res.canHasLatinName = _arg5;
        return res;
    }
    
    static _new2334(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1, _arg2, _arg3);
        res.typ = _arg4;
        res.coeff = _arg5;
        res.canHasLatinName = _arg6;
        return res;
    }
    
    static _new2342(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1, _arg2, _arg3);
        res.typ = _arg4;
        res.coeff = _arg5;
        res.canHasLatinName = _arg6;
        res.acronym = _arg7;
        return res;
    }
    
    static _new2346(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.canHasLatinName = _arg3;
        res.canHasSingleName = _arg4;
        res.mustHasCapitalName = _arg5;
        res.canHasNumber = _arg6;
        return res;
    }
    
    static _new2347(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        res.mustHasCapitalName = _arg6;
        res.canHasNumber = _arg7;
        return res;
    }
    
    static _new2348(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        res.mustHasCapitalName = _arg6;
        res.profile = _arg7;
        return res;
    }
    
    static _new2349(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.mustHasCapitalName = _arg7;
        res.profile = _arg8;
        return res;
    }
    
    static _new2353(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.lang = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.mustHasCapitalName = _arg7;
        return res;
    }
    
    static _new2354(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.acronym = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.mustHasCapitalName = _arg7;
        return res;
    }
    
    static _new2356(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        res.mustHasCapitalName = _arg6;
        res.canHasNumber = _arg7;
        return res;
    }
    
    static _new2357(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.acronym = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.mustHasCapitalName = _arg7;
        res.canHasNumber = _arg8;
        return res;
    }
    
    static _new2359(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.mustHasCapitalName = _arg7;
        res.canHasNumber = _arg8;
        return res;
    }
    
    static _new2362(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasSingleName = _arg5;
        res.canBeSingleGeo = _arg6;
        return res;
    }
    
    static _new2363(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.canBeSingleGeo = _arg7;
        return res;
    }
    
    static _new2371(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.acronym = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.canHasNumber = _arg7;
        return res;
    }
    
    static _new2372(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8) {
        let res = new OrgItemTypeTermin(_arg1);
        res.acronym = _arg2;
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        res.canHasSingleName = _arg6;
        res.mustHasCapitalName = _arg7;
        res.canHasNumber = _arg8;
        return res;
    }
    
    static _new2377(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2);
        res.coeff = _arg3;
        res.typ = _arg4;
        res.canHasLatinName = _arg5;
        return res;
    }
    
    static _new2378(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.typ = _arg3;
        res.canHasLatinName = _arg4;
        res.canHasNumber = _arg5;
        res.profile = _arg6;
        return res;
    }
    
    static _new2382(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new OrgItemTypeTermin(_arg1);
        res.coeff = _arg2;
        res.canBeNormalDep = _arg3;
        res.typ = _arg4;
        res.canHasNumber = _arg5;
        res.canBeSingleGeo = _arg6;
        return res;
    }
    
    static _new2394(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new OrgItemTypeTermin(_arg1, _arg2, _arg3);
        res.canHasLatinName = _arg4;
        res.coeff = _arg5;
        return res;
    }
    
    static _new2399(_arg1, _arg2, _arg3) {
        let res = new OrgItemTypeTermin(_arg1);
        res.canHasLatinName = _arg2;
        res.coeff = _arg3;
        return res;
    }
    
    static _new2403(_arg1, _arg2, _arg3, _arg4) {
        let res = new OrgItemTypeTermin(_arg1);
        res.typ = _arg2;
        res.coeff = _arg3;
        res.canHasLatinName = _arg4;
        return res;
    }
}


module.exports = OrgItemTypeTermin