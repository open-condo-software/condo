/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const ReferentsEqualType = require("./../core/ReferentsEqualType");
const ReferentClass = require("./../metadata/ReferentClass");
const Referent = require("./../Referent");
const MetaPersonIdentity = require("./internal/MetaPersonIdentity");

/**
 * Удостоверение личности (паспорт и пр.)
 */
class PersonIdentityReferent extends Referent {
    
    constructor() {
        super(PersonIdentityReferent.OBJ_TYPENAME);
        this.instanceOf = MetaPersonIdentity.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        res.append(Utils.notNull(this.typ, "?"));
        if (this.number !== null) 
            res.append(" №").append(this.number);
        if (this.state !== null) 
            res.append(", ").append(this.state.toStringEx(true, lang, lev + 1));
        if (!shortVariant) {
            let dat = this.getStringValue(PersonIdentityReferent.ATTR_DATE);
            let _org = this.getStringValue(PersonIdentityReferent.ATTR_ORG);
            if (dat !== null || _org !== null) {
                res.append(", выдан");
                if (dat !== null) 
                    res.append(" ").append(dat);
                if (_org !== null) 
                    res.append(" ").append(_org);
            }
        }
        return res.toString();
    }
    
    get typ() {
        return this.getStringValue(PersonIdentityReferent.ATTR_TYPE);
    }
    set typ(value) {
        this.addSlot(PersonIdentityReferent.ATTR_TYPE, value, true, 0);
        return value;
    }
    
    get number() {
        return this.getStringValue(PersonIdentityReferent.ATTR_NUMBER);
    }
    set number(value) {
        this.addSlot(PersonIdentityReferent.ATTR_NUMBER, value, true, 0);
        return value;
    }
    
    get state() {
        return Utils.as(this.getSlotValue(PersonIdentityReferent.ATTR_STATE), Referent);
    }
    set state(value) {
        this.addSlot(PersonIdentityReferent.ATTR_STATE, value, true, 0);
        return value;
    }
    
    get address() {
        return Utils.as(this.getSlotValue(PersonIdentityReferent.ATTR_ADDRESS), Referent);
    }
    set address(value) {
        this.addSlot(PersonIdentityReferent.ATTR_ADDRESS, value, true, 0);
        return value;
    }
    
    canBeEquals(obj, _typ = ReferentsEqualType.WITHINONETEXT) {
        let id = Utils.as(obj, PersonIdentityReferent);
        if (id === null) 
            return false;
        if (this.typ !== id.typ) 
            return false;
        if (this.number !== id.number) 
            return false;
        if (this.state !== null && id.state !== null) {
            if (this.state !== id.state) 
                return false;
        }
        return true;
    }
    
    static static_constructor() {
        PersonIdentityReferent.OBJ_TYPENAME = "PERSONIDENTITY";
        PersonIdentityReferent.ATTR_TYPE = "TYPE";
        PersonIdentityReferent.ATTR_NUMBER = "NUMBER";
        PersonIdentityReferent.ATTR_DATE = "DATE";
        PersonIdentityReferent.ATTR_ORG = "ORG";
        PersonIdentityReferent.ATTR_STATE = "STATE";
        PersonIdentityReferent.ATTR_ADDRESS = "ADDRESS";
    }
}


PersonIdentityReferent.static_constructor();

module.exports = PersonIdentityReferent