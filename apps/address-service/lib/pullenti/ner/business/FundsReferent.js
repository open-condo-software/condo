/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Referent = require("./../Referent");
const NumberHelper = require("./../core/NumberHelper");
const ReferentsEqualType = require("./../core/ReferentsEqualType");
const FundsKind = require("./FundsKind");
const ReferentClass = require("./../metadata/ReferentClass");
const MiscHelper = require("./../core/MiscHelper");
const OrganizationReferent = require("./../org/OrganizationReferent");
const FundsMeta = require("./internal/FundsMeta");
const MoneyReferent = require("./../money/MoneyReferent");

/**
 * Ценные бумаги (акции, доли в уставном капитале и пр.)
 * 
 */
class FundsReferent extends Referent {
    
    constructor() {
        super(FundsReferent.OBJ_TYPENAME);
        this.instanceOf = FundsMeta.GLOBAL_META;
    }
    
    toStringEx(shortVariant, lang, lev = 0) {
        let res = new StringBuilder();
        if (this.typ !== null) 
            res.append(MiscHelper.convertFirstCharUpperAndOtherLower(this.typ));
        else {
            let _kind = this.getStringValue(FundsReferent.ATTR_KIND);
            if (_kind !== null) 
                _kind = Utils.asString(FundsMeta.GLOBAL_META.kindFeature.convertInnerValueToOuterValue(_kind, null));
            if (_kind !== null) 
                res.append(MiscHelper.convertFirstCharUpperAndOtherLower(_kind));
            else 
                res.append("?");
        }
        if (this.source !== null) 
            res.append("; ").append(this.source.toStringEx(shortVariant, lang, 0));
        if (this.count > 0) 
            res.append("; кол-во ").append(this.count);
        if (this.percent > 0) 
            res.append("; ").append(this.percent).append("%");
        if (!shortVariant) {
            if (this.sum !== null) 
                res.append("; ").append(this.sum.toStringEx(false, lang, 0));
            if (this.price !== null) 
                res.append("; номинал ").append(this.price.toStringEx(false, lang, 0));
        }
        return res.toString();
    }
    
    get parentReferent() {
        return this.source;
    }
    
    get kind() {
        let s = this.getStringValue(FundsReferent.ATTR_KIND);
        if (s === null) 
            return FundsKind.UNDEFINED;
        try {
            let res = FundsKind.of(s);
            if (res instanceof FundsKind) 
                return FundsKind.of(res);
        } catch (ex662) {
        }
        return FundsKind.UNDEFINED;
    }
    set kind(value) {
        if (value !== FundsKind.UNDEFINED) 
            this.addSlot(FundsReferent.ATTR_KIND, value.toString(), true, 0);
        else 
            this.addSlot(FundsReferent.ATTR_KIND, null, true, 0);
        return value;
    }
    
    get source() {
        return Utils.as(this.getSlotValue(FundsReferent.ATTR_SOURCE), OrganizationReferent);
    }
    set source(value) {
        this.addSlot(FundsReferent.ATTR_SOURCE, value, true, 0);
        return value;
    }
    
    get typ() {
        return this.getStringValue(FundsReferent.ATTR_TYPE);
    }
    set typ(value) {
        this.addSlot(FundsReferent.ATTR_TYPE, value, true, 0);
        return value;
    }
    
    get percent() {
        let val = this.getStringValue(FundsReferent.ATTR_PERCENT);
        if (val === null) 
            return 0;
        let res = NumberHelper.stringToDouble(val);
        if (res === null) 
            return 0;
        return res;
    }
    set percent(value) {
        if (value > 0) 
            this.addSlot(FundsReferent.ATTR_PERCENT, NumberHelper.doubleToString(value), true, 0);
        else 
            this.addSlot(FundsReferent.ATTR_PERCENT, null, true, 0);
        return value;
    }
    
    get count() {
        let val = this.getStringValue(FundsReferent.ATTR_COUNT);
        if (val === null) 
            return 0;
        let v = 0;
        let wrapv663 = new RefOutArgWrapper();
        let inoutres664 = Utils.tryParseInt(val, wrapv663);
        v = wrapv663.value;
        if (!inoutres664) 
            return 0;
        return v;
    }
    set count(value) {
        this.addSlot(FundsReferent.ATTR_COUNT, value.toString(), true, 0);
        return value;
    }
    
    get sum() {
        return Utils.as(this.getSlotValue(FundsReferent.ATTR_SUM), MoneyReferent);
    }
    set sum(value) {
        this.addSlot(FundsReferent.ATTR_SUM, value, true, 0);
        return value;
    }
    
    get price() {
        return Utils.as(this.getSlotValue(FundsReferent.ATTR_PRICE), MoneyReferent);
    }
    set price(value) {
        this.addSlot(FundsReferent.ATTR_PRICE, value, true, 0);
        return value;
    }
    
    canBeEquals(obj, _typ = ReferentsEqualType.WITHINONETEXT) {
        let f = Utils.as(obj, FundsReferent);
        if (f === null) 
            return false;
        if (this.kind !== f.kind) 
            return false;
        if (this.typ !== null && f.typ !== null) {
            if (this.typ !== f.typ) 
                return false;
        }
        if (this.source !== f.source) 
            return false;
        if (this.count !== f.count) 
            return false;
        if (this.percent !== f.percent) 
            return false;
        if (this.sum !== f.sum) 
            return false;
        return true;
    }
    
    checkCorrect() {
        if (this.kind === FundsKind.UNDEFINED) 
            return false;
        for (const s of this.slots) {
            if (s.typeName !== FundsReferent.ATTR_TYPE && s.typeName !== FundsReferent.ATTR_KIND) 
                return true;
        }
        return false;
    }
    
    static static_constructor() {
        FundsReferent.OBJ_TYPENAME = "FUNDS";
        FundsReferent.ATTR_KIND = "KIND";
        FundsReferent.ATTR_TYPE = "TYPE";
        FundsReferent.ATTR_SOURCE = "SOURCE";
        FundsReferent.ATTR_PERCENT = "PERCENT";
        FundsReferent.ATTR_COUNT = "COUNT";
        FundsReferent.ATTR_SUM = "SUM";
        FundsReferent.ATTR_PRICE = "PRICE";
    }
}


FundsReferent.static_constructor();

module.exports = FundsReferent