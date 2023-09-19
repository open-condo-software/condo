/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class CityItemTokenItemType {

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
        if(val instanceof CityItemTokenItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(CityItemTokenItemType.mapStringToEnum.containsKey(val))
                return CityItemTokenItemType.mapStringToEnum.get(val);
            return null;
        }
        if(CityItemTokenItemType.mapIntToEnum.containsKey(val))
            return CityItemTokenItemType.mapIntToEnum.get(val);
        let it = new CityItemTokenItemType(val, val.toString());
        CityItemTokenItemType.mapIntToEnum.put(val, it);
        CityItemTokenItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return CityItemTokenItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return CityItemTokenItemType.m_Values;
    }
    static static_constructor() {
        CityItemTokenItemType.mapIntToEnum = new Hashtable();
        CityItemTokenItemType.mapStringToEnum = new Hashtable();
        CityItemTokenItemType.PROPERNAME = new CityItemTokenItemType(0, "PROPERNAME");
        CityItemTokenItemType.mapIntToEnum.put(CityItemTokenItemType.PROPERNAME.value(), CityItemTokenItemType.PROPERNAME); 
        CityItemTokenItemType.mapStringToEnum.put(CityItemTokenItemType.PROPERNAME.m_str.toUpperCase(), CityItemTokenItemType.PROPERNAME); 
        CityItemTokenItemType.CITY = new CityItemTokenItemType(1, "CITY");
        CityItemTokenItemType.mapIntToEnum.put(CityItemTokenItemType.CITY.value(), CityItemTokenItemType.CITY); 
        CityItemTokenItemType.mapStringToEnum.put(CityItemTokenItemType.CITY.m_str.toUpperCase(), CityItemTokenItemType.CITY); 
        CityItemTokenItemType.NOUN = new CityItemTokenItemType(2, "NOUN");
        CityItemTokenItemType.mapIntToEnum.put(CityItemTokenItemType.NOUN.value(), CityItemTokenItemType.NOUN); 
        CityItemTokenItemType.mapStringToEnum.put(CityItemTokenItemType.NOUN.m_str.toUpperCase(), CityItemTokenItemType.NOUN); 
        CityItemTokenItemType.MISC = new CityItemTokenItemType(3, "MISC");
        CityItemTokenItemType.mapIntToEnum.put(CityItemTokenItemType.MISC.value(), CityItemTokenItemType.MISC); 
        CityItemTokenItemType.mapStringToEnum.put(CityItemTokenItemType.MISC.m_str.toUpperCase(), CityItemTokenItemType.MISC); 
        CityItemTokenItemType.m_Values = Array.from(CityItemTokenItemType.mapIntToEnum.values);
        CityItemTokenItemType.m_Keys = Array.from(CityItemTokenItemType.mapIntToEnum.keys);
    }
}


CityItemTokenItemType.static_constructor();

module.exports = CityItemTokenItemType