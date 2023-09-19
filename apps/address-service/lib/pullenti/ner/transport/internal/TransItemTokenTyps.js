/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class TransItemTokenTyps {

    constructor(val, str) {
        this.m_val = val;
        this.m_str = str;
    }
    toString() {
        return this.m_str;
    }
    value() {
        return this.m_val;
    }
    static of(val) {
        if(val instanceof TransItemTokenTyps) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(TransItemTokenTyps.mapStringToEnum.containsKey(val))
                return TransItemTokenTyps.mapStringToEnum.get(val);
            return null;
        }
        if(TransItemTokenTyps.mapIntToEnum.containsKey(val))
            return TransItemTokenTyps.mapIntToEnum.get(val);
        let it = new TransItemTokenTyps(val, val.toString());
        TransItemTokenTyps.mapIntToEnum.put(val, it);
        TransItemTokenTyps.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return TransItemTokenTyps.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return TransItemTokenTyps.m_Values;
    }
    static static_constructor() {
        TransItemTokenTyps.mapIntToEnum = new Hashtable();
        TransItemTokenTyps.mapStringToEnum = new Hashtable();
        TransItemTokenTyps.NOUN = new TransItemTokenTyps(0, "NOUN");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.NOUN.value(), TransItemTokenTyps.NOUN); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.NOUN.m_str.toUpperCase(), TransItemTokenTyps.NOUN); 
        TransItemTokenTyps.BRAND = new TransItemTokenTyps(1, "BRAND");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.BRAND.value(), TransItemTokenTyps.BRAND); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.BRAND.m_str.toUpperCase(), TransItemTokenTyps.BRAND); 
        TransItemTokenTyps.MODEL = new TransItemTokenTyps(2, "MODEL");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.MODEL.value(), TransItemTokenTyps.MODEL); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.MODEL.m_str.toUpperCase(), TransItemTokenTyps.MODEL); 
        TransItemTokenTyps.NUMBER = new TransItemTokenTyps(3, "NUMBER");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.NUMBER.value(), TransItemTokenTyps.NUMBER); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.NUMBER.m_str.toUpperCase(), TransItemTokenTyps.NUMBER); 
        TransItemTokenTyps.NAME = new TransItemTokenTyps(4, "NAME");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.NAME.value(), TransItemTokenTyps.NAME); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.NAME.m_str.toUpperCase(), TransItemTokenTyps.NAME); 
        TransItemTokenTyps.ORG = new TransItemTokenTyps(5, "ORG");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.ORG.value(), TransItemTokenTyps.ORG); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.ORG.m_str.toUpperCase(), TransItemTokenTyps.ORG); 
        TransItemTokenTyps.ROUTE = new TransItemTokenTyps(6, "ROUTE");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.ROUTE.value(), TransItemTokenTyps.ROUTE); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.ROUTE.m_str.toUpperCase(), TransItemTokenTyps.ROUTE); 
        TransItemTokenTyps.CLASS = new TransItemTokenTyps(7, "CLASS");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.CLASS.value(), TransItemTokenTyps.CLASS); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.CLASS.m_str.toUpperCase(), TransItemTokenTyps.CLASS); 
        TransItemTokenTyps.DATE = new TransItemTokenTyps(8, "DATE");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.DATE.value(), TransItemTokenTyps.DATE); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.DATE.m_str.toUpperCase(), TransItemTokenTyps.DATE); 
        TransItemTokenTyps.GEO = new TransItemTokenTyps(9, "GEO");
        TransItemTokenTyps.mapIntToEnum.put(TransItemTokenTyps.GEO.value(), TransItemTokenTyps.GEO); 
        TransItemTokenTyps.mapStringToEnum.put(TransItemTokenTyps.GEO.m_str.toUpperCase(), TransItemTokenTyps.GEO); 
        TransItemTokenTyps.m_Values = Array.from(TransItemTokenTyps.mapIntToEnum.values);
        TransItemTokenTyps.m_Keys = Array.from(TransItemTokenTyps.mapIntToEnum.keys);
    }
}


TransItemTokenTyps.static_constructor();

module.exports = TransItemTokenTyps