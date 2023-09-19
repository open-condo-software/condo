/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Termin = require("./../core/Termin");
const IntOntologyItem = require("./../core/IntOntologyItem");
const ResumeItemType = require("./ResumeItemType");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaResume = require("./MetaResume");
const Referent = require("./../Referent");

/**
 * Элемент резюме
 */
class ResumeItemReferent extends Referent {
    
    constructor() {
        super(ResumeItemReferent.OBJ_TYPENAME);
        this.instanceOf = MetaResume.GLOBAL_META;
    }
    
    get typ() {
        let str = this.getStringValue(ResumeItemReferent.ATTR_TYPE);
        if (str === null) 
            return ResumeItemType.UNDEFINED;
        try {
            return ResumeItemType.of(str);
        } catch (ex2753) {
        }
        return ResumeItemType.UNDEFINED;
    }
    set typ(_value) {
        this.addSlot(ResumeItemReferent.ATTR_TYPE, _value.toString().toLowerCase(), true, 0);
        return _value;
    }
    
    get value() {
        return this.getStringValue(ResumeItemReferent.ATTR_VALUE);
    }
    set value(_value) {
        this.addSlot(ResumeItemReferent.ATTR_VALUE, _value, true, 0);
        return _value;
    }
    
    get ref() {
        return Utils.as(this.getSlotValue(ResumeItemReferent.ATTR_REF), Referent);
    }
    set ref(_value) {
        this.addSlot(ResumeItemReferent.ATTR_REF, _value, true, 0);
        return _value;
    }
    
    get expired() {
        return this.getStringValue(ResumeItemReferent.ATTR_EXPIRED) === "true";
    }
    set expired(_value) {
        this.addSlot(ResumeItemReferent.ATTR_EXPIRED, (_value ? "true" : null), true, 0);
        return _value;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let tmp = new StringBuilder();
        tmp.append(MetaResume.TYPES.convertInnerValueToOuterValue(this.getStringValue(ResumeItemReferent.ATTR_TYPE), null)).append(": ");
        if (this.value !== null) 
            tmp.append(this.value);
        else if (this.ref !== null) 
            tmp.append(this.ref.toStringEx(shortVariant, lang, lev + 1));
        if (this.expired) 
            tmp.append(" (не актуально)");
        return tmp.toString();
    }
    
    createOntologyItem() {
        let oi = new IntOntologyItem(this);
        oi.termins.push(new Termin(this.value));
        return oi;
    }
    
    static static_constructor() {
        ResumeItemReferent.OBJ_TYPENAME = "RESUME";
        ResumeItemReferent.ATTR_TYPE = "TYPE";
        ResumeItemReferent.ATTR_VALUE = "VALUE";
        ResumeItemReferent.ATTR_REF = "REF";
        ResumeItemReferent.ATTR_EXPIRED = "EXPIRED";
    }
}


ResumeItemReferent.static_constructor();

module.exports = ResumeItemReferent