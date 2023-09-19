/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class StreetItemType {

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
        if(val instanceof StreetItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(StreetItemType.mapStringToEnum.containsKey(val))
                return StreetItemType.mapStringToEnum.get(val);
            return null;
        }
        if(StreetItemType.mapIntToEnum.containsKey(val))
            return StreetItemType.mapIntToEnum.get(val);
        let it = new StreetItemType(val, val.toString());
        StreetItemType.mapIntToEnum.put(val, it);
        StreetItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return StreetItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return StreetItemType.m_Values;
    }
    static static_constructor() {
        StreetItemType.mapIntToEnum = new Hashtable();
        StreetItemType.mapStringToEnum = new Hashtable();
        StreetItemType.NOUN = new StreetItemType(0, "NOUN");
        StreetItemType.mapIntToEnum.put(StreetItemType.NOUN.value(), StreetItemType.NOUN); 
        StreetItemType.mapStringToEnum.put(StreetItemType.NOUN.m_str.toUpperCase(), StreetItemType.NOUN); 
        StreetItemType.NAME = new StreetItemType(1, "NAME");
        StreetItemType.mapIntToEnum.put(StreetItemType.NAME.value(), StreetItemType.NAME); 
        StreetItemType.mapStringToEnum.put(StreetItemType.NAME.m_str.toUpperCase(), StreetItemType.NAME); 
        StreetItemType.NUMBER = new StreetItemType(2, "NUMBER");
        StreetItemType.mapIntToEnum.put(StreetItemType.NUMBER.value(), StreetItemType.NUMBER); 
        StreetItemType.mapStringToEnum.put(StreetItemType.NUMBER.m_str.toUpperCase(), StreetItemType.NUMBER); 
        StreetItemType.STDADJECTIVE = new StreetItemType(3, "STDADJECTIVE");
        StreetItemType.mapIntToEnum.put(StreetItemType.STDADJECTIVE.value(), StreetItemType.STDADJECTIVE); 
        StreetItemType.mapStringToEnum.put(StreetItemType.STDADJECTIVE.m_str.toUpperCase(), StreetItemType.STDADJECTIVE); 
        StreetItemType.STDNAME = new StreetItemType(4, "STDNAME");
        StreetItemType.mapIntToEnum.put(StreetItemType.STDNAME.value(), StreetItemType.STDNAME); 
        StreetItemType.mapStringToEnum.put(StreetItemType.STDNAME.m_str.toUpperCase(), StreetItemType.STDNAME); 
        StreetItemType.STDPARTOFNAME = new StreetItemType(5, "STDPARTOFNAME");
        StreetItemType.mapIntToEnum.put(StreetItemType.STDPARTOFNAME.value(), StreetItemType.STDPARTOFNAME); 
        StreetItemType.mapStringToEnum.put(StreetItemType.STDPARTOFNAME.m_str.toUpperCase(), StreetItemType.STDPARTOFNAME); 
        StreetItemType.AGE = new StreetItemType(6, "AGE");
        StreetItemType.mapIntToEnum.put(StreetItemType.AGE.value(), StreetItemType.AGE); 
        StreetItemType.mapStringToEnum.put(StreetItemType.AGE.m_str.toUpperCase(), StreetItemType.AGE); 
        StreetItemType.FIX = new StreetItemType(7, "FIX");
        StreetItemType.mapIntToEnum.put(StreetItemType.FIX.value(), StreetItemType.FIX); 
        StreetItemType.mapStringToEnum.put(StreetItemType.FIX.m_str.toUpperCase(), StreetItemType.FIX); 
        StreetItemType.m_Values = Array.from(StreetItemType.mapIntToEnum.values);
        StreetItemType.m_Keys = Array.from(StreetItemType.mapIntToEnum.keys);
    }
}


StreetItemType.static_constructor();

module.exports = StreetItemType