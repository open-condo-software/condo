/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const ReferentsEqualType = require("./../core/ReferentsEqualType");
const LanguageHelper = require("./../../morph/LanguageHelper");
const MetaPhone = require("./internal/MetaPhone");
const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const PhoneKind = require("./PhoneKind");

/**
 * Сущность - телефонный номер
 * 
 */
class PhoneReferent extends Referent {
    
    constructor() {
        super(PhoneReferent.OBJ_TYPENAME);
        this.m_Template = null;
        this.instanceOf = MetaPhone.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        let res = new StringBuilder();
        if (this.countryCode !== null) 
            res.append((this.countryCode !== "8" ? "+" : "")).append(this.countryCode).append(" ");
        let num = this.number;
        if (num !== null && num.length >= 9) {
            let cou = 3;
            if (num.length >= 11) 
                cou = num.length - 7;
            res.append("(").append(num.substring(0, 0 + cou)).append(") ");
            num = num.substring(cou);
        }
        else if (num !== null && num.length === 8) {
            res.append("(").append(num.substring(0, 0 + 2)).append(") ");
            num = num.substring(2);
        }
        if (num === null) 
            res.append("???-??-??");
        else {
            res.append(num);
            if (num.length > 5) {
                res.insert(res.length - 4, '-');
                res.insert(res.length - 2, '-');
            }
        }
        if (this.addNumber !== null) 
            res.append(" (доб.").append(this.addNumber).append(")");
        return res.toString();
    }
    
    get number() {
        return this.getStringValue(PhoneReferent.ATTR_NUNBER);
    }
    set number(value) {
        this.addSlot(PhoneReferent.ATTR_NUNBER, value, true, 0);
        return value;
    }
    
    get addNumber() {
        return this.getStringValue(PhoneReferent.ATTR_ADDNUMBER);
    }
    set addNumber(value) {
        this.addSlot(PhoneReferent.ATTR_ADDNUMBER, value, true, 0);
        return value;
    }
    
    get countryCode() {
        return this.getStringValue(PhoneReferent.ATTR_COUNTRYCODE);
    }
    set countryCode(value) {
        this.addSlot(PhoneReferent.ATTR_COUNTRYCODE, value, true, 0);
        return value;
    }
    
    get kind() {
        let str = this.getStringValue(PhoneReferent.ATTR_KIND);
        if (str === null) 
            return PhoneKind.UNDEFINED;
        try {
            return PhoneKind.of(str);
        } catch (ex) {
            return PhoneKind.UNDEFINED;
        }
    }
    set kind(value) {
        if (value !== PhoneKind.UNDEFINED) 
            this.addSlot(PhoneReferent.ATTR_KIND, value.toString().toLowerCase(), true, 0);
        return value;
    }
    
    getCompareStrings() {
        let num = this.number;
        if (num === null) 
            return null;
        if (num.length > 9) 
            num = num.substring(9);
        let res = new Array();
        res.push(num);
        let add = this.addNumber;
        if (add !== null) 
            res.push((num + "*" + add));
        return res;
    }
    
    canBeEquals(obj, typ) {
        return this._canBeEqual(obj, typ, false);
    }
    
    _canBeEqual(obj, typ, ignoreAddNumber) {
        let ph = Utils.as(obj, PhoneReferent);
        if (ph === null) 
            return false;
        if (ph.countryCode !== null && this.countryCode !== null) {
            if (ph.countryCode !== this.countryCode) 
                return false;
        }
        if (ignoreAddNumber) {
            if (this.addNumber !== null && ph.addNumber !== null) {
                if (ph.addNumber !== this.addNumber) 
                    return false;
            }
        }
        else if (this.addNumber !== null || ph.addNumber !== null) {
            if (this.addNumber !== ph.addNumber) 
                return false;
        }
        if (this.number === null || ph.number === null) 
            return false;
        if (this.number === ph.number) 
            return true;
        if (typ !== ReferentsEqualType.DIFFERENTTEXTS) {
            if (LanguageHelper.endsWith(this.number, ph.number) || LanguageHelper.endsWith(ph.number, this.number)) 
                return true;
        }
        return false;
    }
    
    canBeGeneralFor(obj) {
        if (!this._canBeEqual(obj, ReferentsEqualType.WITHINONETEXT, true)) 
            return false;
        let ph = Utils.as(obj, PhoneReferent);
        if (this.countryCode !== null && ph.countryCode === null) 
            return false;
        if (this.addNumber === null) {
            if (ph.addNumber !== null) 
                return false;
        }
        else if (ph.addNumber === null) 
            return false;
        if (LanguageHelper.endsWith(ph.number, this.number)) 
            return true;
        return false;
    }
    
    mergeSlots(obj, mergeStatistic = true) {
        let ph = Utils.as(obj, PhoneReferent);
        if (ph === null) 
            return;
        if (ph.countryCode !== null && this.countryCode === null) 
            this.countryCode = ph.countryCode;
        if (ph.number !== null && LanguageHelper.endsWith(ph.number, this.number)) 
            this.number = ph.number;
    }
    
    correct() {
        if (this.kind === PhoneKind.UNDEFINED) {
            if (this.findSlot(PhoneReferent.ATTR_ADDNUMBER, null, true) !== null) 
                this.kind = PhoneKind.WORK;
            else if (this.countryCode === null || this.countryCode === "7") {
                let num = this.number;
                if (num.length === 10 && num[0] === '9') 
                    this.kind = PhoneKind.MOBILE;
            }
        }
    }
    
    static static_constructor() {
        PhoneReferent.OBJ_TYPENAME = "PHONE";
        PhoneReferent.ATTR_NUNBER = "NUMBER";
        PhoneReferent.ATTR_KIND = "KIND";
        PhoneReferent.ATTR_COUNTRYCODE = "COUNTRYCODE";
        PhoneReferent.ATTR_ADDNUMBER = "ADDNUMBER";
    }
}


PhoneReferent.static_constructor();

module.exports = PhoneReferent