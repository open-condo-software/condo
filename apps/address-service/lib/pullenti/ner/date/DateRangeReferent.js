/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const DateReferent = require("./DateReferent");
const MetaDateRange = require("./internal/MetaDateRange");

/**
 * Сущность, представляющая диапазон дат
 * 
 */
class DateRangeReferent extends Referent {
    
    constructor() {
        super(DateRangeReferent.OBJ_TYPENAME);
        this.instanceOf = MetaDateRange.GLOBAL_META;
    }
    
    get dateFrom() {
        return Utils.as(this.getSlotValue(DateRangeReferent.ATTR_FROM), DateReferent);
    }
    set dateFrom(value) {
        this.addSlot(DateRangeReferent.ATTR_FROM, value, true, 0);
        return value;
    }
    
    get dateTo() {
        return Utils.as(this.getSlotValue(DateRangeReferent.ATTR_TO), DateReferent);
    }
    set dateTo(value) {
        this.addSlot(DateRangeReferent.ATTR_TO, value, true, 0);
        return value;
    }
    
    get isRelative() {
        if (this.dateFrom !== null && this.dateFrom.isRelative) 
            return true;
        if (this.dateTo !== null && this.dateTo.isRelative) 
            return true;
        return false;
    }
    
    /**
     * Вычислить диапазон дат (если не диапазон, то from = to)
     * @param now текущая дата-время
     * @param from результирующее начало диапазона
     * @param to результирующий конец диапазона
     * @param tense время (-1 - прошлое, 0 - любое, 1 - будущее) - используется 
     * при неоднозначных случаях. 
     * Например, 7 сентября, а сейчас лето, то какой это год? При +1 - этот, при -1 - предыдущий
     * @return признак корректности
     */
    calculateDateRange(now, from, to, tense = 0) {
        const DateRelHelper = require("./internal/DateRelHelper");
        let inoutres1158 = DateRelHelper.calculateDateRange2(this, now, from, to, tense);
        return inoutres1158;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        const DateRelHelper = require("./internal/DateRelHelper");
        if (this.isRelative && !shortVariant) {
            let res = new StringBuilder();
            res.append(this.toStringEx(true, lang, lev));
            DateRelHelper.appendToString2(this, res);
            return res.toString();
        }
        let fr = (this.dateFrom === null ? null : this.dateFrom._ToString(shortVariant, lang, lev, 1));
        let to = (this.dateTo === null ? null : this.dateTo._ToString(shortVariant, lang, lev, 2));
        if (fr !== null && to !== null) 
            return (fr + " " + (this.dateTo.century > 0 && this.dateTo.year === 0 ? to : to.toLowerCase()));
        if (fr !== null) 
            return fr.toString();
        if (to !== null) 
            return to;
        return ((lang.isUa ? 'з' : 'с') + " ? по ?");
    }
    
    canBeEquals(obj, typ) {
        let dr = Utils.as(obj, DateRangeReferent);
        if (dr === null) 
            return false;
        if (this.dateFrom !== null) {
            if (!this.dateFrom.canBeEquals(dr.dateFrom, typ)) 
                return false;
        }
        else if (dr.dateFrom !== null) 
            return false;
        if (this.dateTo !== null) {
            if (!this.dateTo.canBeEquals(dr.dateTo, typ)) 
                return false;
        }
        else if (dr.dateTo !== null) 
            return false;
        return true;
    }
    
    get quarterNumber() {
        if (this.dateFrom === null || this.dateTo === null || this.dateFrom.year !== this.dateTo.year) 
            return 0;
        let m1 = this.dateFrom.month;
        let m2 = this.dateTo.month;
        if (m1 === 1 && m2 === 3) 
            return 1;
        if (m1 === 4 && m2 === 6) 
            return 2;
        if (m1 === 7 && m2 === 9) 
            return 3;
        if (m1 === 10 && m2 === 12) 
            return 4;
        return 0;
    }
    
    get halfyearNumber() {
        if (this.dateFrom === null || this.dateTo === null || this.dateFrom.year !== this.dateTo.year) 
            return 0;
        let m1 = this.dateFrom.month;
        let m2 = this.dateTo.month;
        if (m1 === 1 && m2 === 6) 
            return 1;
        if (m1 === 7 && m2 === 12) 
            return 2;
        return 0;
    }
    
    static _new1071(_arg1, _arg2) {
        let res = new DateRangeReferent();
        res.dateFrom = _arg1;
        res.dateTo = _arg2;
        return res;
    }
    
    static _new1077(_arg1) {
        let res = new DateRangeReferent();
        res.dateTo = _arg1;
        return res;
    }
    
    static _new1078(_arg1) {
        let res = new DateRangeReferent();
        res.dateFrom = _arg1;
        return res;
    }
    
    static static_constructor() {
        DateRangeReferent.OBJ_TYPENAME = "DATERANGE";
        DateRangeReferent.ATTR_FROM = "FROM";
        DateRangeReferent.ATTR_TO = "TO";
    }
}


DateRangeReferent.static_constructor();

module.exports = DateRangeReferent