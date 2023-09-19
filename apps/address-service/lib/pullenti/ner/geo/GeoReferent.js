/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphLang = require("./../../morph/MorphLang");
const LanguageHelper = require("./../../morph/LanguageHelper");
const IntOntologyItem = require("./../core/IntOntologyItem");
const MiscHelper = require("./../core/MiscHelper");
const Termin = require("./../core/Termin");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaGeo = require("./internal/MetaGeo");
const Referent = require("./../Referent");

/**
 * Сущность, описывающая территорию как административную единицу. 
 * Это страны, автономные образования, области, административные районы, населённые пункты и пр.
 * 
 */
class GeoReferent extends Referent {
    
    constructor() {
        super(GeoReferent.OBJ_TYPENAME);
        this.m_TmpBits = 0;
        this.m_Typs = null;
        this.m_Higher = null;
        this.instanceOf = MetaGeo.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        return this._ToString(shortVariant, lang, true, lev);
    }
    
    _ToString(shortVariant, lang, outCladr, lev) {
        if (this.isUnion && !this.isState) {
            let res = new StringBuilder();
            res.append(this.getStringValue(GeoReferent.ATTR_TYPE));
            for (const s of this.slots) {
                if (s.typeName === GeoReferent.ATTR_REF && (s.value instanceof Referent)) 
                    res.append("; ").append(s.value.toStringEx(true, lang, 0));
            }
            return res.toString();
        }
        let name = MiscHelper.convertFirstCharUpperAndOtherLower(this._getName(lang !== null && lang.isEn));
        if (!shortVariant) {
            if (!this.isState) {
                if (this.isCity && this.isRegion) {
                }
                else {
                    let typ = this.getStringValue(GeoReferent.ATTR_TYPE);
                    if (typ !== null) {
                        if (this.isState) {
                            let i = typ.lastIndexOf(' ');
                            if (i > 0) 
                                typ = typ.substring(i + 1);
                        }
                        name = (typ + " " + name);
                    }
                }
            }
        }
        if (!shortVariant && outCladr) {
            let kladr = this.getSlotValue(GeoReferent.ATTR_FIAS);
            if (kladr instanceof Referent) 
                name = (name + " (ФИАС: " + (Utils.notNull(kladr.getStringValue("GUID"), "?")) + ")");
            let bti = this.getStringValue(GeoReferent.ATTR_BTI);
            if (bti !== null) 
                name = (name + " (БТИ " + bti + ")");
        }
        if (!shortVariant && this.higher !== null && (lev < 10)) {
            if (((this.higher.isCity && this.isRegion)) || ((this.findSlot(GeoReferent.ATTR_TYPE, "город", true) === null && this.findSlot(GeoReferent.ATTR_TYPE, "місто", true) === null && this.isCity))) 
                return (name + "; " + this.higher._ToString(false, lang, false, lev + 1));
        }
        return name;
    }
    
    _getName(cyr) {
        let name = null;
        for (let i = 0; i < 2; i++) {
            for (const s of this.slots) {
                if (s.typeName === GeoReferent.ATTR_NAME) {
                    let v = s.value.toString();
                    if (Utils.isNullOrEmpty(v)) 
                        continue;
                    if (i === 0) {
                        if (!LanguageHelper.isCyrillicChar(v[0])) {
                            if (cyr) 
                                continue;
                        }
                        else if (!cyr) 
                            continue;
                    }
                    if (name === null) 
                        name = v;
                    else if (name.length > v.length) {
                        if ((v.length < 4) && (name.length < 20)) {
                        }
                        else if (name[name.length - 1] === 'В') {
                        }
                        else 
                            name = v;
                    }
                    else if ((name.length < 4) && v.length >= 4 && (v.length < 10)) 
                        name = v;
                }
            }
            if (name !== null) 
                break;
        }
        if (name === "МОЛДОВА") 
            name = "МОЛДАВИЯ";
        else if (name === "БЕЛАРУСЬ") 
            name = "БЕЛОРУССИЯ";
        else if (name === "АПСНЫ") 
            name = "АБХАЗИЯ";
        if (this.isCity) {
            let misc = this.getStringValue(GeoReferent.ATTR_MISC);
            if (misc !== null && !name.includes(misc.toUpperCase())) 
                name = (misc.toUpperCase() + " " + name);
        }
        return (name != null ? name : "?");
    }
    
    toSortString() {
        let typ = "GEO4";
        if (this.isState) 
            typ = "GEO1";
        else if (this.isRegion) 
            typ = "GEO2";
        else if (this.isCity) 
            typ = "GEO3";
        return typ + this._getName(false);
    }
    
    getCompareStrings() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === GeoReferent.ATTR_NAME) 
                res.push(s.value.toString());
        }
        if (res.length > 0) 
            return res;
        else 
            return super.getCompareStrings();
    }
    
    addName(v) {
        if (v !== null) {
            if (v.indexOf('-') > 0) 
                v = Utils.replaceString(v, " - ", "-");
            this.addSlot(GeoReferent.ATTR_NAME, v.toUpperCase(), false, 0);
        }
    }
    
    addTyp(v) {
        if (v !== null) {
            if (v === "ТЕРРИТОРИЯ" && this.isState) 
                return;
            this.addSlot(GeoReferent.ATTR_TYPE, v.toLowerCase(), false, 0);
        }
    }
    
    addMisc(v) {
        if (v !== null) 
            this.addSlot(GeoReferent.ATTR_MISC, v, false, 0);
    }
    
    addTypCity(lang, city) {
        if (lang.isEn) 
            this.addSlot(GeoReferent.ATTR_TYPE, (city ? "city" : "locality"), false, 0);
        else if (lang.isUa) 
            this.addSlot(GeoReferent.ATTR_TYPE, (city ? "місто" : "населений пункт"), false, 0);
        else 
            this.addSlot(GeoReferent.ATTR_TYPE, (city ? "город" : "населенный пункт"), false, 0);
    }
    
    addTypReg(lang) {
        if (lang.isEn) 
            this.addSlot(GeoReferent.ATTR_TYPE, "region", false, 0);
        else if (lang.isUa) 
            this.addSlot(GeoReferent.ATTR_TYPE, "регіон", false, 0);
        else 
            this.addSlot(GeoReferent.ATTR_TYPE, "регион", false, 0);
    }
    
    addTypState(lang) {
        if (lang.isEn) 
            this.addSlot(GeoReferent.ATTR_TYPE, "country", false, 0);
        else if (lang.isUa) 
            this.addSlot(GeoReferent.ATTR_TYPE, "держава", false, 0);
        else 
            this.addSlot(GeoReferent.ATTR_TYPE, "государство", false, 0);
    }
    
    addTypUnion(lang) {
        if (lang.isEn) 
            this.addSlot(GeoReferent.ATTR_TYPE, "union", false, 0);
        else if (lang.isUa) 
            this.addSlot(GeoReferent.ATTR_TYPE, "союз", false, 0);
        else 
            this.addSlot(GeoReferent.ATTR_TYPE, "союз", false, 0);
    }
    
    addSlot(attrName, attrValue, clearOldValue, statCount = 0) {
        this.m_TmpBits = 0;
        return super.addSlot(attrName, attrValue, clearOldValue, statCount);
    }
    
    uploadSlot(slot, newVal) {
        this.m_TmpBits = 0;
        super.uploadSlot(slot, newVal);
    }
    
    _recalcTmpBits() {
        this.m_TmpBits = 1;
        this.m_Higher = null;
        let hi = Utils.as(this.getSlotValue(GeoReferent.ATTR_HIGHER), GeoReferent);
        if (hi === this || hi === null) {
        }
        else {
            let li = null;
            let err = false;
            for (let r = Utils.as(hi.getSlotValue(GeoReferent.ATTR_HIGHER), Referent); r !== null; r = Utils.as(r.getSlotValue(GeoReferent.ATTR_HIGHER), Referent)) {
                if (r === hi || r === this) {
                    err = true;
                    break;
                }
                if (li === null) 
                    li = new Array();
                else if (li.includes(r)) {
                    err = true;
                    break;
                }
                li.push(r);
            }
            if (!err) 
                this.m_Higher = hi;
        }
        let _isState = -1;
        let isReg = -1;
        let ignore = false;
        for (const t of this.slots) {
            if (t.typeName === GeoReferent.ATTR_TYPE) {
                let val = Utils.asString(t.value);
                if (GeoReferent._isCity(val)) {
                    this.m_TmpBits |= (GeoReferent.bIT_ISCITY);
                    if ((val === "город" || val === "місто" || val === "city") || val === "town") 
                        this.m_TmpBits |= (GeoReferent.bIT_ISBIGCITY);
                    continue;
                }
                if ((val === "государство" || val === "держава" || val === "империя") || val === "імперія" || val === "country") {
                    this.m_TmpBits |= (GeoReferent.bIT_ISSTATE);
                    isReg = 0;
                    continue;
                }
                if (GeoReferent._isRegion(val)) {
                    if (_isState < 0) 
                        _isState = 0;
                    if (isReg < 0) 
                        isReg = 1;
                }
            }
            else if (t.typeName === GeoReferent.ATTR_ALPHA2) {
                this.m_TmpBits = 1 | GeoReferent.bIT_ISSTATE;
                if (this.findSlot(GeoReferent.ATTR_TYPE, "город", true) !== null || this.findSlot(GeoReferent.ATTR_TYPE, "місто", true) !== null || this.findSlot(GeoReferent.ATTR_TYPE, "city", true) !== null) 
                    this.m_TmpBits |= (GeoReferent.bIT_ISBIGCITY | GeoReferent.bIT_ISCITY);
                return;
            }
        }
        if (_isState !== 0) {
            if ((_isState < 0) && (((this.m_TmpBits) & GeoReferent.bIT_ISCITY)) !== 0) {
            }
            else if (!ignore) 
                this.m_TmpBits |= (GeoReferent.bIT_ISSTATE);
        }
        if (isReg !== 0) {
            if ((_isState < 0) && (((this.m_TmpBits) & GeoReferent.bIT_ISCITY)) !== 0) {
            }
            else if (!ignore) 
                this.m_TmpBits |= (GeoReferent.bIT_ISREGION);
        }
    }
    
    get typs() {
        if (this.m_Typs !== null) {
            let cou = 0;
            for (const s of this.slots) {
                if (s.typeName === GeoReferent.ATTR_TYPE) 
                    cou++;
            }
            if (cou === this.m_Typs.length) 
                return this.m_Typs;
        }
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === GeoReferent.ATTR_TYPE) 
                res.push(String(s.value));
        }
        this.m_Typs = res;
        return res;
    }
    
    get isCity() {
        if ((((this.m_TmpBits) & 1)) === 0) 
            this._recalcTmpBits();
        return (((this.m_TmpBits) & GeoReferent.bIT_ISCITY)) !== 0;
    }
    
    get isBigCity() {
        if ((((this.m_TmpBits) & 1)) === 0) 
            this._recalcTmpBits();
        return (((this.m_TmpBits) & GeoReferent.bIT_ISBIGCITY)) !== 0;
    }
    
    get isState() {
        if ((((this.m_TmpBits) & 1)) === 0) 
            this._recalcTmpBits();
        return (((this.m_TmpBits) & GeoReferent.bIT_ISSTATE)) !== 0;
    }
    
    get isRegion() {
        if ((((this.m_TmpBits) & 1)) === 0) 
            this._recalcTmpBits();
        return (((this.m_TmpBits) & GeoReferent.bIT_ISREGION)) !== 0;
    }
    
    get isUnion() {
        for (const s of this.slots) {
            if (s.typeName === GeoReferent.ATTR_TYPE) {
                let v = Utils.asString(s.value);
                if (v.endsWith("союз")) 
                    return true;
            }
        }
        return false;
    }
    
    static _isCity(v) {
        if ((((((((((((((v.includes("поселок") || v.includes("селение") || v.includes("городок")) || v.includes("село") || v.includes("деревня")) || v.includes("станица") || v.includes("пункт")) || v.includes("станция") || v.includes("аул")) || v.includes("улус") || v.includes("наслег")) || v.includes("хутор") || v.includes("слобода")) || v.includes("местечко") || v.includes("усадьба")) || v.includes("починок") || v.includes("заимка")) || v.includes("аал") || v.includes("выселки")) || v.includes("арбан") || v.includes("місто")) || v.includes("селище") || v.includes("сіло")) || v.includes("станиця") || v.includes("станція")) || v.includes("city") || v.includes("municipality")) || v.includes("town")) 
            return true;
        if (v.includes("порт")) 
            return true;
        if (v.includes("город") || v.includes("місто")) {
            if (!GeoReferent._isRegion(v)) 
                return true;
        }
        return false;
    }
    
    static _isRegion(v) {
        if ((((((((((((v.includes("район") || v.includes("штат") || v.includes("область")) || v.includes("волость") || v.includes("провинция")) || v.includes("регион") || v.includes("округ")) || v.includes("край") || v.includes("префектура")) || v.includes("провінція") || v.includes("регіон")) || v.includes("образование") || v.includes("утворення")) || v.includes("автономия") || v.includes("автономія")) || v.includes("district") || v.includes("county")) || v.includes("state") || v.includes("area")) || v.includes("borough") || v.includes("parish")) || v.includes("region") || v.includes("province")) || v.includes("prefecture")) 
            return true;
        if (v.includes("городск") || v.includes("міськ")) {
            if (v.includes("образование") || v.includes("освіта")) 
                return true;
        }
        return false;
    }
    
    get alpha2() {
        return this.getStringValue(GeoReferent.ATTR_ALPHA2);
    }
    set alpha2(value) {
        this.addSlot(GeoReferent.ATTR_ALPHA2, value, true, 0);
        return value;
    }
    
    get higher() {
        if ((((this.m_TmpBits) & 1)) === 0) 
            this._recalcTmpBits();
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
        this.addSlot(GeoReferent.ATTR_HIGHER, null, true, 0);
        if (value !== null) 
            this.addSlot(GeoReferent.ATTR_HIGHER, value, true, 0);
        return value;
    }
    
    static _checkRoundDep(d) {
        if (d === null) 
            return true;
        let d0 = d;
        let li = new Array();
        for (d = d.higher; d !== null; d = d.higher) {
            if (d === d0) 
                return true;
            if (li.includes(d)) 
                return true;
            li.push(d);
        }
        return false;
    }
    
    get topHigher() {
        if (GeoReferent._checkRoundDep(this)) 
            return this;
        for (let hi = this; hi !== null; hi = hi.higher) {
            if (hi.higher === null) 
                return hi;
        }
        return this;
    }
    
    get parentReferent() {
        return this.higher;
    }
    
    containsType(typ) {
        for (const s of this.slots) {
            if (s.typeName === GeoReferent.ATTR_TYPE) {
                let ty = Utils.asString(s.value);
                if (ty === typ) 
                    return true;
                if (Utils.endsWithString(ty, typ, true)) 
                    return true;
                if (Utils.endsWithString(typ, ty, true)) 
                    return true;
            }
        }
        return false;
    }
    
    canBeEquals(obj, typ) {
        let _geo = Utils.as(obj, GeoReferent);
        if (_geo === null) 
            return false;
        if (_geo.alpha2 !== null && _geo.alpha2 === this.alpha2) 
            return true;
        if (this.isCity !== _geo.isCity) 
            return false;
        if (this.isUnion !== _geo.isUnion) 
            return false;
        if (this.isUnion) {
            for (const s of this.slots) {
                if (s.typeName === GeoReferent.ATTR_REF) {
                    if (obj.findSlot(GeoReferent.ATTR_REF, s.value, true) === null) 
                        return false;
                }
            }
            for (const s of obj.slots) {
                if (s.typeName === GeoReferent.ATTR_REF) {
                    if (this.findSlot(GeoReferent.ATTR_REF, s.value, true) === null) 
                        return false;
                }
            }
            return true;
        }
        let ref1 = Utils.as(this.getSlotValue(GeoReferent.ATTR_REF), Referent);
        let ref2 = Utils.as(_geo.getSlotValue(GeoReferent.ATTR_REF), Referent);
        if (ref1 !== null || ref2 !== null) {
            if (ref1 !== ref2) 
                return false;
        }
        let r = this.isRegion || this.isState;
        let r1 = _geo.isRegion || _geo.isState;
        if (r !== r1) 
            return false;
        let eqNames = false;
        for (const s of this.slots) {
            if (s.typeName === GeoReferent.ATTR_NAME) {
                if (_geo.findSlot(s.typeName, s.value, true) !== null) {
                    eqNames = true;
                    break;
                }
            }
        }
        if (!eqNames) 
            return false;{
                let typs1 = this.typs;
                let typs2 = _geo.typs;
                let posel = false;
                if ((typs1.includes("сельское поселение") || typs2.includes("сельское поселение") || typs1.includes("городское поселение")) || typs2.includes("городское поселение")) 
                    posel = true;
                let ok = false;
                for (const t of typs1) {
                    if (typs2.includes(t)) 
                        ok = true;
                    else if (!posel) {
                        for (const tt of typs2) {
                            if (LanguageHelper.endsWith(tt, t) || LanguageHelper.endsWith(t, tt)) 
                                ok = true;
                        }
                    }
                }
                if (!ok) 
                    return false;
            }
        if (this.higher !== null && _geo.higher !== null) {
            if (GeoReferent._checkRoundDep(this) || GeoReferent._checkRoundDep(_geo)) 
                return false;
            if (this.higher.canBeEquals(_geo.higher, typ)) {
            }
            else if (_geo.higher.higher !== null && this.higher.canBeEquals(_geo.higher.higher, typ)) {
            }
            else if (this.higher.higher !== null && this.higher.higher.canBeEquals(_geo.higher, typ)) {
            }
            else 
                return false;
        }
        return true;
    }
    
    mergeSlots2(obj, lang) {
        let mergeStatistic = true;
        for (const s of obj.slots) {
            if (s.typeName === GeoReferent.ATTR_NAME || s.typeName === GeoReferent.ATTR_TYPE) {
                let nam = String(s.value);
                if (LanguageHelper.isLatinChar(nam[0])) {
                    if (!lang.isEn) 
                        continue;
                }
                else if (lang.isEn) 
                    continue;
                if (LanguageHelper.endsWith(nam, " ССР")) 
                    continue;
            }
            this.addSlot(s.typeName, s.value, false, (mergeStatistic ? s.count : 0));
        }
        if (this.findSlot(GeoReferent.ATTR_NAME, null, true) === null && obj.findSlot(GeoReferent.ATTR_NAME, null, true) !== null) {
            for (const s of obj.slots) {
                if (s.typeName === GeoReferent.ATTR_NAME) 
                    this.addSlot(s.typeName, s.value, false, (mergeStatistic ? s.count : 0));
            }
        }
        if (this.findSlot(GeoReferent.ATTR_TYPE, null, true) === null && obj.findSlot(GeoReferent.ATTR_TYPE, null, true) !== null) {
            for (const s of obj.slots) {
                if (s.typeName === GeoReferent.ATTR_TYPE) 
                    this.addSlot(s.typeName, s.value, false, (mergeStatistic ? s.count : 0));
            }
        }
        if (this.isState) {
            for (const s of this.slots) {
                if (s.typeName === GeoReferent.ATTR_TYPE && ((s.value.toString() === "регион" || s.value.toString() === "регіон" || s.value.toString() === "region"))) {
                    Utils.removeItem(this.slots, s);
                    break;
                }
            }
        }
        if (this.isCity) {
            let s = Utils.notNull(this.findSlot(GeoReferent.ATTR_TYPE, "город", true), Utils.notNull(this.findSlot(GeoReferent.ATTR_TYPE, "місто", true), this.findSlot(GeoReferent.ATTR_TYPE, "city", true)));
            if (s !== null) {
                for (const ss of this.slots) {
                    if (ss.typeName === GeoReferent.ATTR_TYPE && ss !== s && GeoReferent._isCity(String(ss.value))) {
                        Utils.removeItem(this.slots, s);
                        break;
                    }
                }
            }
        }
        let has = false;
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].typeName === GeoReferent.ATTR_HIGHER) {
                if (!has) 
                    has = true;
                else {
                    this.slots.splice(i, 1);
                    i--;
                }
            }
        }
        this._mergeExtReferents(obj);
    }
    
    createOntologyItem() {
        let __isCity = this.isCity;
        let oi = new IntOntologyItem(this);
        for (const a of this.slots) {
            if (a.typeName === GeoReferent.ATTR_NAME) {
                let s = a.value.toString();
                let t = new Termin();
                t.initByNormalText(s, null);
                if (__isCity) 
                    t.addStdAbridges();
                oi.termins.push(t);
            }
        }
        return oi;
    }
    
    checkAbbr(abbr) {
        if (abbr.length !== 2) 
            return false;
        let nameq = false;
        let typeq = false;
        let nameq2 = false;
        let typeq2 = false;
        for (const s of this.slots) {
            if (s.typeName === GeoReferent.ATTR_NAME) {
                let val = Utils.asString(s.value);
                let ch = val[0];
                if (ch === abbr[0]) {
                    nameq = true;
                    let ii = val.indexOf(' ');
                    if (ii > 0) {
                        if (abbr[1] === val[ii + 1]) {
                            if (val.indexOf(' ', ii + 1) < 0) 
                                return true;
                        }
                    }
                }
                if (ch === abbr[1]) 
                    nameq2 = true;
            }
            else if (s.typeName === GeoReferent.ATTR_TYPE) {
                let ty = String(s.value);
                if (ty === "государство" || ty === "держава" || ty === "country") 
                    continue;
                let ch = ty[0].toUpperCase();
                if (ch === abbr[1]) 
                    typeq = true;
                if (ch === abbr[0]) 
                    typeq2 = true;
            }
        }
        if (typeq && nameq) 
            return true;
        if (typeq2 && nameq2) 
            return true;
        return false;
    }
    
    // Добавляем ссылку на организацию, также добавляем имена
    addOrgReferent(org) {
        if (org === null) 
            return;
        let nam = false;
        this.addSlot(GeoReferent.ATTR_REF, org, false, 0);
        let _geo = null;
        let specTyp = null;
        let num = org.getStringValue("NUMBER");
        let pref = null;
        for (const s of org.slots) {
            if (s.typeName === "TYPE" && ((typeof s.value === 'string' || s.value instanceof String))) {
                let ty = Utils.asString(s.value);
                this.addMisc(ty);
            }
        }
        for (const s of org.slots) {
            if (s.typeName === "NAME") {
                let val = Utils.asString(s.value);
                if (num !== null) 
                    val = (val + "-" + num);
                if (pref !== null) 
                    this.addName((pref.toUpperCase() + " " + val));
                this.addName(val);
                nam = true;
            }
            else if (s.typeName === "TYPE") {
                let v = Utils.asString(s.value);
                if (v === "СЕЛЬСКИЙ СОВЕТ") 
                    this.addTyp("сельский округ");
                else if (v === "ГОРОДСКОЙ СОВЕТ") 
                    this.addTyp("городской округ");
                else if (v === "ПОСЕЛКОВЫЙ СОВЕТ") 
                    this.addTyp("поселковый округ");
                else if (v === "аэропорт") 
                    specTyp = v.toUpperCase();
            }
            else if (s.typeName === "GEO" && (s.value instanceof GeoReferent)) 
                _geo = Utils.as(s.value, GeoReferent);
        }
        if (!nam) {
            for (const s of org.slots) {
                if (s.typeName === "EPONYM") {
                    if (num === null) 
                        this.addName(s.value.toUpperCase());
                    else 
                        this.addName((s.value.toUpperCase() + "-" + num));
                    nam = true;
                }
            }
        }
        if (!nam && num !== null) {
            for (const s of org.slots) {
                if (s.typeName === "TYPE") {
                    this.addName((s.value.toUpperCase() + "-" + num));
                    nam = true;
                }
            }
        }
        if (_geo !== null && !nam) {
            for (const n of _geo.getStringValues(GeoReferent.ATTR_NAME)) {
                this.addName(n);
                if (specTyp !== null) {
                    this.addName((n + " " + specTyp));
                    this.addName((specTyp + " " + n));
                }
                nam = true;
            }
        }
        if (!nam) 
            this.addName(org.toStringEx(true, MorphLang.UNKNOWN, 0).toUpperCase());
    }
    
    static static_constructor() {
        GeoReferent.OBJ_TYPENAME = "GEO";
        GeoReferent.ATTR_NAME = "NAME";
        GeoReferent.ATTR_TYPE = "TYPE";
        GeoReferent.ATTR_ALPHA2 = "ALPHA2";
        GeoReferent.ATTR_HIGHER = "HIGHER";
        GeoReferent.ATTR_MISC = "MISC";
        GeoReferent.ATTR_REF = "REF";
        GeoReferent.ATTR_FIAS = "FIAS";
        GeoReferent.ATTR_BTI = "BTI";
        GeoReferent.bIT_ISCITY = 2;
        GeoReferent.bIT_ISREGION = 4;
        GeoReferent.bIT_ISSTATE = 8;
        GeoReferent.bIT_ISBIGCITY = 0x10;
    }
}


GeoReferent.static_constructor();

module.exports = GeoReferent