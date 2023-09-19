/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const Referent = require("./../Referent");
const ReferentClass = require("./../metadata/ReferentClass");
const MetaUri = require("./internal/MetaUri");

/**
 * Сущность URI - всё, что укладывается в СХЕМА:ЗНАЧЕНИЕ (www, email, ISBN, УДК, ББК, ICQ и пр.)
 * 
 */
class UriReferent extends Referent {
    
    constructor() {
        super(UriReferent.OBJ_TYPENAME);
        this.instanceOf = MetaUri.globalMeta;
    }
    
    toStringEx(shortVariant, lang = null, lev = 0) {
        if (this.scheme !== null) {
            let split = ":";
            if (this.scheme === "ISBN" || this.scheme === "ББК" || this.scheme === "УДК") 
                split = " ";
            else if (this.scheme === "http" || this.scheme === "ftp" || this.scheme === "https") 
                split = "://";
            return (this.scheme + split + (Utils.notNull(this.value, "?")));
        }
        else 
            return this.value;
    }
    
    get value() {
        return this.getStringValue(UriReferent.ATTR_VALUE);
    }
    set value(_value) {
        let val = _value;
        this.addSlot(UriReferent.ATTR_VALUE, val, true, 0);
        return _value;
    }
    
    get scheme() {
        return this.getStringValue(UriReferent.ATTR_SCHEME);
    }
    set scheme(_value) {
        this.addSlot(UriReferent.ATTR_SCHEME, _value, true, 0);
        return _value;
    }
    
    get detail() {
        return this.getStringValue(UriReferent.ATTR_DETAIL);
    }
    set detail(_value) {
        this.addSlot(UriReferent.ATTR_DETAIL, _value, true, 0);
        return _value;
    }
    
    canBeEquals(obj, typ) {
        let _uri = Utils.as(obj, UriReferent);
        if (_uri === null) 
            return false;
        return Utils.compareStrings(this.value, _uri.value, true) === 0;
    }
    
    static _new2798(_arg1, _arg2) {
        let res = new UriReferent();
        res.scheme = _arg1;
        res.value = _arg2;
        return res;
    }
    
    static _new2801(_arg1, _arg2) {
        let res = new UriReferent();
        res.value = _arg1;
        res.scheme = _arg2;
        return res;
    }
    
    static static_constructor() {
        UriReferent.OBJ_TYPENAME = "URI";
        UriReferent.ATTR_VALUE = "VALUE";
        UriReferent.ATTR_DETAIL = "DETAIL";
        UriReferent.ATTR_SCHEME = "SCHEME";
    }
}


UriReferent.static_constructor();

module.exports = UriReferent