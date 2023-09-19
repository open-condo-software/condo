/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const MeasureKind = require("./MeasureKind");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const Referent = require("./../Referent");
const UnitReferent = require("./UnitReferent");
const ReferentClass = require("./../metadata/ReferentClass");
const MeasureMeta = require("./internal/MeasureMeta");
const NumberHelper = require("./../core/NumberHelper");
const MeasureHelper = require("./internal/MeasureHelper");

/**
 * Величина или диапазон величин, измеряемая в некоторых единицах
 * 
 */
class MeasureReferent extends Referent {
    
    constructor() {
        super(MeasureReferent.OBJ_TYPENAME);
        this.instanceOf = MeasureMeta.GLOBAL_META;
    }
    
    get template() {
        return Utils.notNull(this.getStringValue(MeasureReferent.ATTR_TEMPLATE), "1");
    }
    set template(value) {
        this.addSlot(MeasureReferent.ATTR_TEMPLATE, value, true, 0);
        return value;
    }
    
    get doubleValues() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === MeasureReferent.ATTR_VALUE && ((typeof s.value === 'string' || s.value instanceof String))) {
                let d = 0;
                let wrapd1747 = new RefOutArgWrapper();
                let inoutres1748 = MeasureHelper.tryParseDouble(Utils.asString(s.value), wrapd1747);
                d = wrapd1747.value;
                if (inoutres1748) 
                    res.push(d);
            }
        }
        return res;
    }
    
    addValue(d) {
        this.addSlot(MeasureReferent.ATTR_VALUE, NumberHelper.doubleToString(d), false, 0);
    }
    
    get units() {
        let res = new Array();
        for (const s of this.slots) {
            if (s.typeName === MeasureReferent.ATTR_UNIT && (s.value instanceof UnitReferent)) 
                res.push(Utils.as(s.value, UnitReferent));
        }
        return res;
    }
    
    get kind() {
        let str = this.getStringValue(MeasureReferent.ATTR_KIND);
        if (str === null) 
            return MeasureKind.UNDEFINED;
        try {
            return MeasureKind.of(str);
        } catch (ex1749) {
        }
        return MeasureKind.UNDEFINED;
    }
    set kind(value) {
        if (value !== MeasureKind.UNDEFINED) 
            this.addSlot(MeasureReferent.ATTR_KIND, value.toString().toUpperCase(), true, 0);
        return value;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder(this.template);
        let vals = new Array();
        for (const s of this.slots) {
            if (s.typeName === MeasureReferent.ATTR_VALUE) {
                if ((typeof s.value === 'string' || s.value instanceof String)) {
                    let val = Utils.asString(s.value);
                    if (val === "NaN") 
                        val = "?";
                    vals.push(val);
                }
                else if (s.value instanceof Referent) 
                    vals.push(s.value.toStringEx(true, lang, 0));
            }
        }
        for (let i = res.length - 1; i >= 0; i--) {
            let ch = res.charAt(i);
            if (!Utils.isDigit(ch)) 
                continue;
            let j = ((ch.charCodeAt(0)) - ('1'.charCodeAt(0)));
            if ((j < 0) || j >= vals.length) 
                continue;
            res.remove(i, 1);
            res.insert(i, vals[j]);
        }
        res.append(this.outUnits(lang));
        if (!shortVariant) {
            let nam = this.getStringValue(MeasureReferent.ATTR_NAME);
            if (nam !== null) 
                res.append(" - ").append(nam);
            for (const s of this.slots) {
                if (s.typeName === MeasureReferent.ATTR_REF && (s.value instanceof MeasureReferent)) 
                    res.append(" / ").append(s.value.toStringEx(true, lang, 0));
            }
            let ki = this.kind;
            if (ki !== MeasureKind.UNDEFINED) 
                res.append(" (").append(ki.toString().toUpperCase()).append(")");
        }
        return res.toString();
    }
    
    /**
     * Вывести только единицы измерения
     * @param lang язык
     * @return строка с результатом
     */
    outUnits(lang = null) {
        let uu = this.units;
        if (uu.length === 0) 
            return "";
        let res = new StringBuilder();
        res.append(uu[0].toStringEx(true, lang, 0));
        for (let i = 1; i < uu.length; i++) {
            let pow = uu[i].getStringValue(UnitReferent.ATTR_POW);
            if (!Utils.isNullOrEmpty(pow) && pow[0] === '-') {
                res.append("/").append(uu[i].toStringEx(true, lang, 1));
                if (pow !== "-1") 
                    res.append("<").append(pow.substring(1)).append(">");
            }
            else 
                res.append("*").append(uu[i].toStringEx(true, lang, 0));
        }
        return res.toString();
    }
    
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        let mr = Utils.as(obj, MeasureReferent);
        if (mr === null) 
            return false;
        if (this.template !== mr.template) 
            return false;
        let vals1 = this.getStringValues(MeasureReferent.ATTR_VALUE);
        let vals2 = mr.getStringValues(MeasureReferent.ATTR_VALUE);
        if (vals1.length !== vals2.length) 
            return false;
        for (let i = 0; i < vals2.length; i++) {
            if (vals1[i] !== vals2[i]) 
                return false;
        }
        let units1 = this.units;
        let units2 = mr.units;
        if (units1.length !== units2.length) 
            return false;
        for (let i = 0; i < units2.length; i++) {
            if (units1[i] !== units2[i]) 
                return false;
        }
        for (const s of this.slots) {
            if (s.typeName === MeasureReferent.ATTR_REF || s.typeName === MeasureReferent.ATTR_NAME) {
                if (mr.findSlot(s.typeName, s.value, true) === null) 
                    return false;
            }
        }
        for (const s of mr.slots) {
            if (s.typeName === MeasureReferent.ATTR_REF || s.typeName === MeasureReferent.ATTR_NAME) {
                if (this.findSlot(s.typeName, s.value, true) === null) 
                    return false;
            }
        }
        return true;
    }
    
    static static_constructor() {
        MeasureReferent.OBJ_TYPENAME = "MEASURE";
        MeasureReferent.ATTR_TEMPLATE = "TEMPLATE";
        MeasureReferent.ATTR_VALUE = "VALUE";
        MeasureReferent.ATTR_UNIT = "UNIT";
        MeasureReferent.ATTR_REF = "REF";
        MeasureReferent.ATTR_NAME = "NAME";
        MeasureReferent.ATTR_KIND = "KIND";
    }
}


MeasureReferent.static_constructor();

module.exports = MeasureReferent