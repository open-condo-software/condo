/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const VacanceItemType = require("./VacanceItemType");
const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaVacance = require("./MetaVacance");

/**
 * Элемент вакансии
 */
class VacanceItemReferent extends Referent {
    
    constructor() {
        super(VacanceItemReferent.OBJ_TYPENAME);
        this.instanceOf = MetaVacance.GLOBAL_META;
    }
    
    get typ() {
        let str = this.getStringValue(VacanceItemReferent.ATTR_TYPE);
        if (str === null) 
            return VacanceItemType.UNDEFINED;
        try {
            return VacanceItemType.of(str);
        } catch (ex2856) {
        }
        return VacanceItemType.UNDEFINED;
    }
    set typ(_value) {
        this.addSlot(VacanceItemReferent.ATTR_TYPE, _value.toString().toLowerCase(), true, 0);
        return _value;
    }
    
    get value() {
        return this.getStringValue(VacanceItemReferent.ATTR_VALUE);
    }
    set value(_value) {
        this.addSlot(VacanceItemReferent.ATTR_VALUE, _value, true, 0);
        return _value;
    }
    
    get ref() {
        return Utils.as(this.getSlotValue(VacanceItemReferent.ATTR_REF), Referent);
    }
    set ref(_value) {
        this.addSlot(VacanceItemReferent.ATTR_REF, _value, true, 0);
        return _value;
    }
    
    get expired() {
        return this.getStringValue(VacanceItemReferent.ATTR_EXPIRED) === "true";
    }
    set expired(_value) {
        this.addSlot(VacanceItemReferent.ATTR_EXPIRED, (_value ? "true" : null), true, 0);
        return _value;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let tmp = new StringBuilder();
        tmp.append(MetaVacance.TYPES.convertInnerValueToOuterValue(this.getStringValue(VacanceItemReferent.ATTR_TYPE), null)).append(": ");
        if (this.value !== null) 
            tmp.append(this.value);
        else if (this.ref !== null) {
            tmp.append(this.ref.toStringEx(shortVariant, lang, lev + 1));
            if (this.typ === VacanceItemType.MONEY) {
                for (const s of this.slots) {
                    if (s.typeName === VacanceItemReferent.ATTR_REF && s.value !== this.ref) {
                        tmp.append("-").append(s.value.toStringEx(shortVariant, lang, lev + 1));
                        break;
                    }
                }
            }
        }
        if (this.expired) 
            tmp.append(" (не актуальна)");
        return tmp.toString();
    }
    
    static static_constructor() {
        VacanceItemReferent.OBJ_TYPENAME = "VACANCY";
        VacanceItemReferent.ATTR_TYPE = "TYPE";
        VacanceItemReferent.ATTR_VALUE = "VALUE";
        VacanceItemReferent.ATTR_REF = "REF";
        VacanceItemReferent.ATTR_EXPIRED = "EXPIRED";
    }
}


VacanceItemReferent.static_constructor();

module.exports = VacanceItemReferent