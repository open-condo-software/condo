/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const GetTextAttr = require("./../core/GetTextAttr");
const MetaToken = require("./../MetaToken");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const IntOntologyItem = require("./../core/IntOntologyItem");
const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaStreet = require("./internal/MetaStreet");
const MiscHelper = require("./../core/MiscHelper");
const GeoReferent = require("./../geo/GeoReferent");
const StreetKind = require("./StreetKind");
const Termin = require("./../core/Termin");

/**
 * Сущность: улица, проспект, площадь, шоссе и т.п. Выделяется анализатором AddressAnalyzer.
 * 
 */
class StreetReferent extends Referent {
    
    constructor() {
        super(StreetReferent.OBJ_TYPENAME);
        this.m_Typs = null;
        this.m_Higher = null;
        this.instanceOf = MetaStreet.globalMeta;
    }
    
    get typs() {
        if (this.m_Typs !== null) {
            let cou = 0;
            for (const s of this.slots) {
                if (s.typeName === StreetReferent.ATTR_TYPE) 
                    cou++;
            }
            if (cou === this.m_Typs.length) 
                return this.m_Typs;
        }
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === StreetReferent.ATTR_TYPE) 
                res.push(String(s.value));
        }
        this.m_Typs = res;
        return res;
    }
    
    get names() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === StreetReferent.ATTR_NAME) 
                res.push(String(s.value));
        }
        return res;
    }
    
    get numbers() {
        let nums = this.getStringValues(StreetReferent.ATTR_NUMBER);
        if (nums === null || nums.length === 0) 
            return null;
        if (nums.length === 1) 
            return nums[0];
        nums.sort();
        let tmp = new StringBuilder();
        for (const n of nums) {
            if (tmp.length > 0) 
                tmp.append("+");
            tmp.append(n);
        }
        return tmp.toString();
    }
    set numbers(value) {
        if (value === null) 
            return value;
        let i = value.indexOf('+');
        if (i > 0) {
            this.numbers = value.substring(0, 0 + i);
            this.numbers = value.substring(i + 1);
        }
        else 
            this.addSlot(StreetReferent.ATTR_NUMBER, value, false, 0);
        return value;
    }
    
    get higher() {
        return this.m_Higher;
    }
    set higher(value) {
        if (value === this) 
            return value;
        if (value !== null) {
            let d = value;
            let li = new Array();
            for (; d !== null; d = d.higher) {
                if (d === this) 
                    return value;
                else if (d.toString() === this.toString()) 
                    return value;
                if (li.includes(d)) 
                    return value;
                li.push(d);
            }
        }
        this.addSlot(StreetReferent.ATTR_HIGHER, null, true, 0);
        if (value !== null) 
            this.addSlot(StreetReferent.ATTR_HIGHER, value, true, 0);
        this.m_Higher = value;
        return value;
    }
    
    get geos() {
        let res = new Array();
        for (const a of this.slots) {
            if (a.typeName === StreetReferent.ATTR_GEO && (a.value instanceof GeoReferent)) 
                res.push(Utils.as(a.value, GeoReferent));
        }
        return res;
    }
    
    get city() {
        for (const g of this.geos) {
            if (g.isCity) 
                return g;
            else if (g.higher !== null && g.higher.isCity) 
                return g.higher;
        }
        return null;
    }
    
    get parentReferent() {
        let hi = this.higher;
        if (hi !== null) 
            return hi;
        return Utils.as(this.getSlotValue(StreetReferent.ATTR_GEO), GeoReferent);
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let tmp = new StringBuilder();
        let nam = this.getStringValue(StreetReferent.ATTR_NAME);
        let misc = null;
        let _typs = this.typs;
        let ki = this.kind;
        if (_typs.length > 0) {
            for (let i = 0; i < _typs.length; i++) {
                if (nam !== null && nam.includes(_typs[i].toUpperCase())) 
                    continue;
                if (tmp.length > 0) 
                    tmp.append('/');
                tmp.append(_typs[i]);
            }
        }
        else 
            tmp.append((lang !== null && lang.isUa ? "вулиця" : "улица"));
        let num = this.numbers;
        if ((num !== null && !num.includes("км") && ki !== StreetKind.ORG) && ki !== StreetKind.AREA) 
            tmp.append(" ").append(num);
        let miscs = this.getStringValues(StreetReferent.ATTR_MISC);
        for (const m of miscs) {
            if (Utils.isUpperCase(m[0]) && (m.length < 4)) {
                tmp.append(" ").append(m);
                misc = m;
                break;
            }
        }
        if (misc === null && miscs.length > 0) {
            if (nam !== null && nam.includes(miscs[0].toUpperCase())) {
            }
            else 
                tmp.append(" ").append(MiscHelper.convertFirstCharUpperAndOtherLower(miscs[0]));
            misc = miscs[0];
        }
        if (nam !== null) 
            tmp.append(" ").append(MiscHelper.convertFirstCharUpperAndOtherLower(nam));
        if (num !== null && ((num.includes("км") || num.indexOf(':') > 0 || num.indexOf('-') > 0))) 
            tmp.append(" ").append(num);
        else if (num !== null && ((ki === StreetKind.ORG || ki === StreetKind.AREA))) 
            tmp.append("-").append(num);
        if (!shortVariant && this.city !== null) 
            tmp.append("; ").append(this.city.toStringEx(true, lang, lev + 1));
        return tmp.toString();
    }
    
    get kind() {
        let str = this.getStringValue(StreetReferent.ATTR_KIND);
        if (str === null) 
            return StreetKind.UNDEFINED;
        try {
            return StreetKind.of(str);
        } catch (ex614) {
        }
        return StreetKind.UNDEFINED;
    }
    set kind(value) {
        if (value === StreetKind.UNDEFINED) 
            this.addSlot(StreetReferent.ATTR_KIND, null, true, 0);
        else 
            this.addSlot(StreetReferent.ATTR_KIND, value.toString().toUpperCase(), true, 0);
        return value;
    }
    
    addTyp(typ) {
        const StreetItemToken = require("./internal/StreetItemToken");
        this.addSlot(StreetReferent.ATTR_TYPE, typ, false, 0);
        if (this.kind === StreetKind.UNDEFINED) {
            if (typ === "железная дорога") 
                this.kind = StreetKind.RAILWAY;
            else if (typ.includes("дорога") || typ === "шоссе") 
                this.kind = StreetKind.ROAD;
            else if (typ.includes("метро")) 
                this.kind = StreetKind.METRO;
            else if (typ === "территория") 
                this.kind = StreetKind.AREA;
            else if (StreetItemToken._isRegion(typ)) 
                this.kind = StreetKind.AREA;
            else if (StreetItemToken._isSpec(typ)) 
                this.kind = StreetKind.SPEC;
        }
    }
    
    addName(sit) {
        this.addSlot(StreetReferent.ATTR_NAME, (sit.value != null ? sit.value : MiscHelper.getTextValueOfMetaToken(sit, GetTextAttr.NO)), false, 0);
        if (sit.altValue !== null) 
            this.addSlot(StreetReferent.ATTR_NAME, sit.altValue, false, 0);
        if (sit.altValue2 !== null) 
            this.addSlot(StreetReferent.ATTR_NAME, sit.altValue2, false, 0);
    }
    
    addMisc(v) {
        if (v !== null) 
            this.addSlot(StreetReferent.ATTR_MISC, v, false, 0);
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        return this._canBeEquals(obj, typ, false, 0);
    }
    
    _canBeEquals(obj, typ, ignoreGeo, level) {
        if (level > 5) 
            return false;
        level++;
        let ret = this._canBeEquals2(obj, typ, ignoreGeo, level);
        level--;
        return ret;
    }
    
    _canBeEquals2(obj, typ, ignoreGeo, level) {
        let stri = Utils.as(obj, StreetReferent);
        if (stri === null) 
            return false;
        if (this.kind !== stri.kind) 
            return false;
        let typs1 = this.typs;
        let typs2 = stri.typs;
        let ok = false;
        if (typs1.length > 0 && typs2.length > 0) {
            for (const t of typs1) {
                if (typs2.includes(t)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) 
                return false;
        }
        let num = this.numbers;
        let num1 = stri.numbers;
        if (num !== null || num1 !== null) {
            if (num === null || num1 === null) 
                return false;
            if (num !== num1) 
                return false;
        }
        let names1 = this.names;
        let names2 = stri.names;
        if (names1.length > 0 || names2.length > 0) {
            ok = false;
            for (const n of names1) {
                if (names2.includes(n)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) 
                return false;
        }
        if (this.higher !== null && stri.higher !== null) {
            if (!this.higher._canBeEquals(stri.higher, typ, ignoreGeo, level)) 
                return false;
        }
        if (ignoreGeo) 
            return true;
        let geos1 = this.geos;
        let geos2 = stri.geos;
        if (geos1.length > 0 && geos2.length > 0) {
            ok = false;
            for (const g1 of geos1) {
                for (const g2 of geos2) {
                    if (g1.canBeEquals(g2, typ)) {
                        ok = true;
                        break;
                    }
                }
            }
            if (!ok) {
                if (this.city !== null && stri.city !== null) 
                    ok = this.city.canBeEquals(stri.city, typ);
            }
            if (!ok) 
                return false;
        }
        return true;
    }
    
    addSlot(attrName, attrValue, clearOldValue, statCount = 0) {
        if (attrName === StreetReferent.ATTR_NAME && ((typeof attrValue === 'string' || attrValue instanceof String))) {
            let str = Utils.asString(attrValue);
            if (str.indexOf('.') > 0) {
                for (let i = 1; i < (str.length - 1); i++) {
                    if (str[i] === '.' && str[i + 1] !== ' ') 
                        str = str.substring(0, 0 + i + 1) + " " + str.substring(i + 1);
                }
            }
            attrValue = str;
        }
        return super.addSlot(attrName, attrValue, clearOldValue, statCount);
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        super.mergeSlots(obj, mergeStatistic);
    }
    
    canBeGeneralFor(obj) {
        if (!this._canBeEquals(obj, ReferentsEqualType.WITHINONETEXT, true, 0)) 
            return false;
        let geos1 = this.geos;
        let geos2 = obj.geos;
        if (geos2.length === 0 || geos1.length > 0) 
            return false;
        return true;
    }
    
    createOntologyItem() {
        let oi = new IntOntologyItem(this);
        let _names = this.names;
        for (const n of _names) {
            oi.termins.push(new Termin(n));
        }
        return oi;
    }
    
    correct() {
        let _names = this.names;
        for (let i = _names.length - 1; i >= 0; i--) {
            let ss = _names[i];
            let jj = ss.indexOf(' ');
            if (jj < 0) 
                continue;
            if (ss.lastIndexOf(' ') !== jj) 
                continue;
            let pp = Utils.splitString(ss, ' ', false);
            if (pp.length === 2) {
                let ss2 = (pp[1] + " " + pp[0]);
                if (!_names.includes(ss2)) 
                    this.addSlot(StreetReferent.ATTR_NAME, ss2, false, 0);
            }
        }
    }
    
    static static_constructor() {
        StreetReferent.OBJ_TYPENAME = "STREET";
        StreetReferent.ATTR_TYPE = "TYP";
        StreetReferent.ATTR_KIND = "KIND";
        StreetReferent.ATTR_NAME = "NAME";
        StreetReferent.ATTR_NUMBER = "NUMBER";
        StreetReferent.ATTR_HIGHER = "HIGHER";
        StreetReferent.ATTR_GEO = "GEO";
        StreetReferent.ATTR_REF = "REF";
        StreetReferent.ATTR_MISC = "MISC";
        StreetReferent.ATTR_FIAS = "FIAS";
        StreetReferent.ATTR_BTI = "BTI";
        StreetReferent.ATTR_OKM = "OKM";
    }
}


StreetReferent.static_constructor();

module.exports = StreetReferent