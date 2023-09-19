/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const LanguageHelper = require("./../../morph/LanguageHelper");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaWeapon = require("./internal/MetaWeapon");
const MiscHelper = require("./../core/MiscHelper");

/**
 * Сущность - оружие
 * 
 */
class WeaponReferent extends Referent {
    
    constructor() {
        super(WeaponReferent.OBJ_TYPENAME);
        this.instanceOf = MetaWeapon.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        let str = null;
        for (const s of this.slots) {
            if (s.typeName === WeaponReferent.ATTR_TYPE) {
                let n = String(s.value);
                if (str === null || (n.length < str.length)) 
                    str = n;
            }
        }
        if (str !== null) 
            res.append(str.toLowerCase());
        if ((((str = this.getStringValue(WeaponReferent.ATTR_BRAND)))) !== null) 
            res.append(" ").append(MiscHelper.convertFirstCharUpperAndOtherLower(str));
        if ((((str = this.getStringValue(WeaponReferent.ATTR_MODEL)))) !== null) 
            res.append(" ").append(str);
        if ((((str = this.getStringValue(WeaponReferent.ATTR_NAME)))) !== null) {
            res.append(" \"").append(MiscHelper.convertFirstCharUpperAndOtherLower(str)).append("\"");
            for (const s of this.slots) {
                if (s.typeName === WeaponReferent.ATTR_NAME && str !== (String(s.value))) {
                    if (LanguageHelper.isCyrillicChar(str[0]) !== LanguageHelper.isCyrillicChar(String(s.value)[0])) {
                        res.append(" (").append(MiscHelper.convertFirstCharUpperAndOtherLower(String(s.value))).append(")");
                        break;
                    }
                }
            }
        }
        if ((((str = this.getStringValue(WeaponReferent.ATTR_NUMBER)))) !== null) 
            res.append(", номер ").append(str);
        return res.toString();
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let tr = Utils.as(obj, WeaponReferent);
        if (tr === null) 
            return false;
        let s1 = this.getStringValue(WeaponReferent.ATTR_NUMBER);
        let s2 = tr.getStringValue(WeaponReferent.ATTR_NUMBER);
        if (s1 !== null || s2 !== null) {
            if (s1 === null || s2 === null) {
                if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                    return false;
            }
            else {
                if (s1 !== s2) 
                    return false;
                return true;
            }
        }
        let eqTypes = false;
        for (const t of this.getStringValues(WeaponReferent.ATTR_TYPE)) {
            if (tr.findSlot(WeaponReferent.ATTR_TYPE, t, true) !== null) {
                eqTypes = true;
                break;
            }
        }
        if (!eqTypes) 
            return false;
        s1 = this.getStringValue(WeaponReferent.ATTR_BRAND);
        s2 = tr.getStringValue(WeaponReferent.ATTR_BRAND);
        if (s1 !== null || s2 !== null) {
            if (s1 === null || s2 === null) {
                if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                    return false;
            }
            else if (s1 !== s2) 
                return false;
        }
        s1 = this.getStringValue(WeaponReferent.ATTR_MODEL);
        s2 = tr.getStringValue(WeaponReferent.ATTR_MODEL);
        if (s1 !== null || s2 !== null) {
            if (s1 === null || s2 === null) {
                if (typ === ReferentsEqualType.DIFFERENTTEXTS) 
                    return false;
            }
            else {
                if (this.findSlot(WeaponReferent.ATTR_MODEL, s2, true) !== null) 
                    return true;
                if (tr.findSlot(WeaponReferent.ATTR_MODEL, s1, true) !== null) 
                    return true;
                return false;
            }
        }
        for (const s of this.slots) {
            if (s.typeName === WeaponReferent.ATTR_NAME) {
                if (tr.findSlot(WeaponReferent.ATTR_NAME, s.value, true) !== null) 
                    return true;
            }
        }
        if (s1 !== null && s2 !== null) 
            return true;
        return false;
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        super.mergeSlots(obj, mergeStatistic);
    }
    
    static static_constructor() {
        WeaponReferent.OBJ_TYPENAME = "WEAPON";
        WeaponReferent.ATTR_TYPE = "TYPE";
        WeaponReferent.ATTR_BRAND = "BRAND";
        WeaponReferent.ATTR_MODEL = "MODEL";
        WeaponReferent.ATTR_NAME = "NAME";
        WeaponReferent.ATTR_NUMBER = "NUMBER";
        WeaponReferent.ATTR_DATE = "DATE";
        WeaponReferent.ATTR_REF = "REF";
        WeaponReferent.ATTR_CALIBER = "CALIBER";
    }
}


WeaponReferent.static_constructor();

module.exports = WeaponReferent