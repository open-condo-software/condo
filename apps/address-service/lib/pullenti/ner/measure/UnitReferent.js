/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const ReferentsEqualType = require("./../core/ReferentsEqualType");
const LanguageHelper = require("./../../morph/LanguageHelper");
const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const UnitMeta = require("./internal/UnitMeta");

/**
 * Единица измерения вместе с множителем
 * 
 */
class UnitReferent extends Referent {
    
    constructor() {
        super(UnitReferent.OBJ_TYPENAME);
        this.m_Unit = null;
        this.instanceOf = UnitMeta.GLOBAL_META;
    }
    
    get parentReferent() {
        return Utils.as(this.getSlotValue(UnitReferent.ATTR_BASEUNIT), Referent);
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let nam = null;
        for (let l = 0; l < 2; l++) {
            for (const s of this.slots) {
                if (((s.typeName === UnitReferent.ATTR_NAME && shortVariant)) || ((s.typeName === UnitReferent.ATTR_FULLNAME && !shortVariant))) {
                    let val = Utils.asString(s.value);
                    if (lang !== null && !lang.isUndefined && l === 0) {
                        if (lang.isRu !== LanguageHelper.isCyrillic(val)) 
                            continue;
                    }
                    nam = val;
                    break;
                }
            }
            if (nam !== null) 
                break;
        }
        if (nam === null) 
            nam = this.getStringValue(UnitReferent.ATTR_NAME);
        let pow = this.getStringValue(UnitReferent.ATTR_POW);
        if (Utils.isNullOrEmpty(pow) || lev > 0) 
            return (nam != null ? nam : "?");
        let res = (pow[0] !== '-' ? (nam + pow) : (nam + "<" + pow + ">"));
        if (!shortVariant && this.isUnknown) 
            res = "(?)" + res;
        return res;
    }
    
    get isUnknown() {
        return this.getStringValue(UnitReferent.ATTR_UNKNOWN) === "true";
    }
    set isUnknown(value) {
        this.addSlot(UnitReferent.ATTR_UNKNOWN, (value ? "true" : null), true, 0);
        return value;
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let ur = Utils.as(obj, UnitReferent);
        if (ur === null) 
            return false;
        for (const s of this.slots) {
            if (ur.findSlot(s.typeName, s.value, true) === null) 
                return false;
        }
        for (const s of ur.slots) {
            if (this.findSlot(s.typeName, s.value, true) === null) 
                return false;
        }
        return true;
    }
    
    static static_constructor() {
        UnitReferent.OBJ_TYPENAME = "MEASUREUNIT";
        UnitReferent.ATTR_FULLNAME = "FULLNAME";
        UnitReferent.ATTR_NAME = "NAME";
        UnitReferent.ATTR_POW = "POW";
        UnitReferent.ATTR_BASEFACTOR = "BASEFACTOR";
        UnitReferent.ATTR_BASEUNIT = "BASEUNIT";
        UnitReferent.ATTR_UNKNOWN = "UNKNOWN";
    }
}


UnitReferent.static_constructor();

module.exports = UnitReferent