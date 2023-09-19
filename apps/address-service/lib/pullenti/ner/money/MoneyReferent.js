/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const ReferentsEqualType = require("./../core/ReferentsEqualType");
const Referent = require("./../Referent");
const NumberHelper = require("./../core/NumberHelper");
const ReferentClass = require("./../metadata/ReferentClass");
const MoneyMeta = require("./internal/MoneyMeta");

/**
 * Сущность - денежная сумма
 * 
 */
class MoneyReferent extends Referent {
    
    constructor() {
        super(MoneyReferent.OBJ_TYPENAME);
        this.instanceOf = MoneyMeta.GLOBAL_META;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        let v = this.getStringValue(MoneyReferent.ATTR_VALUE);
        let r = this.rest;
        if (v !== null || r > 0) {
            res.append((v != null ? v : "0"));
            let cou = 0;
            for (let i = res.length - 1; i > 0; i--) {
                if ((++cou) === 3) {
                    res.insert(i, '.');
                    cou = 0;
                }
            }
        }
        else 
            res.append("?");
        if (r > 0) 
            res.append(",").append(Utils.correctToString((r).toString(10), 2, true));
        res.append(" ").append(this.currency);
        return res.toString();
    }
    
    get currency() {
        return this.getStringValue(MoneyReferent.ATTR_CURRENCY);
    }
    set currency(_value) {
        this.addSlot(MoneyReferent.ATTR_CURRENCY, _value, true, 0);
        return _value;
    }
    
    get value() {
        let val = this.getStringValue(MoneyReferent.ATTR_VALUE);
        if (val === null) 
            return 0;
        let v = 0;
        let wrapv1753 = new RefOutArgWrapper();
        let inoutres1754 = Utils.tryParseFloat(val, wrapv1753);
        v = wrapv1753.value;
        if (!inoutres1754) 
            return 0;
        return v;
    }
    
    get altValue() {
        let val = this.getStringValue(MoneyReferent.ATTR_ALTVALUE);
        if (val === null) 
            return null;
        let v = 0;
        let wrapv1755 = new RefOutArgWrapper();
        let inoutres1756 = Utils.tryParseFloat(val, wrapv1755);
        v = wrapv1755.value;
        if (!inoutres1756) 
            return null;
        return v;
    }
    
    get rest() {
        let val = this.getStringValue(MoneyReferent.ATTR_REST);
        if (val === null) 
            return 0;
        let v = 0;
        let wrapv1757 = new RefOutArgWrapper();
        let inoutres1758 = Utils.tryParseInt(val, wrapv1757);
        v = wrapv1757.value;
        if (!inoutres1758) 
            return 0;
        return v;
    }
    
    get altRest() {
        let val = this.getStringValue(MoneyReferent.ATTR_ALTREST);
        if (val === null) 
            return null;
        let v = 0;
        let wrapv1759 = new RefOutArgWrapper();
        let inoutres1760 = Utils.tryParseInt(val, wrapv1759);
        v = wrapv1759.value;
        if (!inoutres1760) 
            return null;
        return v;
    }
    
    get realValue() {
        return (this.value) + (((this.rest) / (100)));
    }
    set realValue(_value) {
        let val = NumberHelper.doubleToString(_value);
        let ii = val.indexOf('.');
        if (ii > 0) 
            val = val.substring(0, 0 + ii);
        this.addSlot(MoneyReferent.ATTR_VALUE, val, true, 0);
        let re = ((_value - this.value)) * (100);
        this.addSlot(MoneyReferent.ATTR_REST, Math.floor((re + 0.0001)).toString(), true, 0);
        return _value;
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let s = Utils.as(obj, MoneyReferent);
        if (s === null) 
            return false;
        if (s.currency !== this.currency) 
            return false;
        if (s.value !== this.value) 
            return false;
        if (s.rest !== this.rest) 
            return false;
        if (s.altValue !== this.altValue) 
            return false;
        if (s.altRest !== this.altRest) 
            return false;
        return true;
    }
    
    static static_constructor() {
        MoneyReferent.OBJ_TYPENAME = "MONEY";
        MoneyReferent.ATTR_CURRENCY = "CURRENCY";
        MoneyReferent.ATTR_VALUE = "VALUE";
        MoneyReferent.ATTR_ALTVALUE = "ALTVALUE";
        MoneyReferent.ATTR_REST = "REST";
        MoneyReferent.ATTR_ALTREST = "ALTREST";
    }
}


MoneyReferent.static_constructor();

module.exports = MoneyReferent