/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const ReferentsEqualType = require("./../core/ReferentsEqualType");
const MiscHelper = require("./../core/MiscHelper");
const BusinessFactKind = require("./BusinessFactKind");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaBusinessFact = require("./internal/MetaBusinessFact");
const Referent = require("./../Referent");

/**
 * Сущность для бизнес-факта
 * 
 */
class BusinessFactReferent extends Referent {
    
    constructor() {
        super(BusinessFactReferent.OBJ_TYPENAME);
        this.instanceOf = MetaBusinessFact.GLOBAL_META;
    }
    
    get kind() {
        let s = this.getStringValue(BusinessFactReferent.ATTR_KIND);
        if (s === null) 
            return BusinessFactKind.UNDEFINED;
        try {
            let res = BusinessFactKind.of(s);
            if (res instanceof BusinessFactKind) 
                return BusinessFactKind.of(res);
        } catch (ex661) {
        }
        return BusinessFactKind.UNDEFINED;
    }
    set kind(value) {
        if (value !== BusinessFactKind.UNDEFINED) 
            this.addSlot(BusinessFactReferent.ATTR_KIND, value.toString(), true, 0);
        return value;
    }
    
    get typ() {
        let _typ = this.getStringValue(BusinessFactReferent.ATTR_TYPE);
        if (_typ !== null) 
            return _typ;
        let _kind = this.getStringValue(BusinessFactReferent.ATTR_KIND);
        if (_kind !== null) 
            _typ = Utils.asString(MetaBusinessFact.GLOBAL_META.kindFeature.convertInnerValueToOuterValue(_kind, null));
        if (_typ !== null) 
            return _typ.toLowerCase();
        return null;
    }
    set typ(value) {
        this.addSlot(BusinessFactReferent.ATTR_TYPE, value, true, 0);
        return value;
    }
    
    get who() {
        return Utils.as(this.getSlotValue(BusinessFactReferent.ATTR_WHO), Referent);
    }
    set who(value) {
        this.addSlot(BusinessFactReferent.ATTR_WHO, value, true, 0);
        return value;
    }
    
    get who2() {
        let i = 2;
        for (const s of this.slots) {
            if (s.typeName === BusinessFactReferent.ATTR_WHO) {
                if ((--i) === 0) 
                    return Utils.as(s.value, Referent);
            }
        }
        return null;
    }
    set who2(value) {
        this.addSlot(BusinessFactReferent.ATTR_WHO, value, false, 0);
        return value;
    }
    
    get whom() {
        return Utils.as(this.getSlotValue(BusinessFactReferent.ATTR_WHOM), Referent);
    }
    set whom(value) {
        this.addSlot(BusinessFactReferent.ATTR_WHOM, value, true, 0);
        return value;
    }
    
    get when() {
        return Utils.as(this.getSlotValue(BusinessFactReferent.ATTR_WHEN), Referent);
    }
    set when(value) {
        this.addSlot(BusinessFactReferent.ATTR_WHEN, value, true, 0);
        return value;
    }
    
    get whats() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === BusinessFactReferent.ATTR_WHAT && (s.value instanceof Referent)) 
                res.push(Utils.as(s.value, Referent));
        }
        return res;
    }
    
    addWhat(w) {
        if (w instanceof Referent) 
            this.addSlot(BusinessFactReferent.ATTR_WHAT, w, false, 0);
    }
    
    toStringEx(shortVariant, lang, lev = 0) {
        let res = new StringBuilder();
        let _typ = Utils.notNull(this.typ, "Бизнес-факт");
        res.append(MiscHelper.convertFirstCharUpperAndOtherLower(_typ));
        let v = null;
        if (((v = this.getSlotValue(BusinessFactReferent.ATTR_WHO))) instanceof Referent) {
            res.append("; Кто: ").append(v.toStringEx(true, lang, 0));
            if (this.who2 !== null) 
                res.append(" и ").append(this.who2.toStringEx(true, lang, 0));
        }
        if (((v = this.getSlotValue(BusinessFactReferent.ATTR_WHOM))) instanceof Referent) 
            res.append("; Кого: ").append(v.toStringEx(true, lang, 0));
        if (!shortVariant) {
            if ((((v = this.getSlotValue(BusinessFactReferent.ATTR_WHAT)))) !== null) 
                res.append("; Что: ").append(v);
            if (((v = this.getSlotValue(BusinessFactReferent.ATTR_WHEN))) instanceof Referent) 
                res.append("; Когда: ").append(v.toStringEx(shortVariant, lang, 0));
            for (const s of this.slots) {
                if (s.typeName === BusinessFactReferent.ATTR_MISC) 
                    res.append("; ").append(s.value);
            }
        }
        return res.toString();
    }
    
    canBeEquals(obj, _typ = ReferentsEqualType.WITHINONETEXT) {
        let br = Utils.as(obj, BusinessFactReferent);
        if (br === null) 
            return false;
        if (br.kind !== this.kind) 
            return false;
        if (br.typ !== this.typ) 
            return false;
        if (br.who !== this.who || br.whom !== this.whom) 
            return false;
        if (this.when !== null && br.when !== null) {
            if (!this.when.canBeEquals(br.when, ReferentsEqualType.WITHINONETEXT)) 
                return false;
        }
        let mi1 = Utils.as(this.getSlotValue(BusinessFactReferent.ATTR_WHAT), Referent);
        let mi2 = Utils.as(br.getSlotValue(BusinessFactReferent.ATTR_WHAT), Referent);
        if (mi1 !== null && mi2 !== null) {
            if (!mi1.canBeEquals(mi2, ReferentsEqualType.WITHINONETEXT)) 
                return false;
        }
        return true;
    }
    
    static _new649(_arg1) {
        let res = new BusinessFactReferent();
        res.kind = _arg1;
        return res;
    }
    
    static _new660(_arg1, _arg2) {
        let res = new BusinessFactReferent();
        res.kind = _arg1;
        res.typ = _arg2;
        return res;
    }
    
    static static_constructor() {
        BusinessFactReferent.OBJ_TYPENAME = "BUSINESSFACT";
        BusinessFactReferent.ATTR_KIND = "KIND";
        BusinessFactReferent.ATTR_TYPE = "TYPE";
        BusinessFactReferent.ATTR_WHO = "WHO";
        BusinessFactReferent.ATTR_WHOM = "WHOM";
        BusinessFactReferent.ATTR_WHEN = "WHEN";
        BusinessFactReferent.ATTR_WHAT = "WHAT";
        BusinessFactReferent.ATTR_MISC = "MISC";
    }
}


BusinessFactReferent.static_constructor();

module.exports = BusinessFactReferent