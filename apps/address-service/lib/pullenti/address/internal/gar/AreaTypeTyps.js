/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class AreaTypeTyps {

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
        if(val instanceof AreaTypeTyps) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(AreaTypeTyps.mapStringToEnum.containsKey(val))
                return AreaTypeTyps.mapStringToEnum.get(val);
            return null;
        }
        if(AreaTypeTyps.mapIntToEnum.containsKey(val))
            return AreaTypeTyps.mapIntToEnum.get(val);
        let it = new AreaTypeTyps(val, val.toString());
        AreaTypeTyps.mapIntToEnum.put(val, it);
        AreaTypeTyps.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return AreaTypeTyps.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return AreaTypeTyps.m_Values;
    }
    static static_constructor() {
        AreaTypeTyps.mapIntToEnum = new Hashtable();
        AreaTypeTyps.mapStringToEnum = new Hashtable();
        AreaTypeTyps.UNDEFINED = new AreaTypeTyps(0, "UNDEFINED");
        AreaTypeTyps.mapIntToEnum.put(AreaTypeTyps.UNDEFINED.value(), AreaTypeTyps.UNDEFINED); 
        AreaTypeTyps.mapStringToEnum.put(AreaTypeTyps.UNDEFINED.m_str.toUpperCase(), AreaTypeTyps.UNDEFINED); 
        AreaTypeTyps.REGION = new AreaTypeTyps(1, "REGION");
        AreaTypeTyps.mapIntToEnum.put(AreaTypeTyps.REGION.value(), AreaTypeTyps.REGION); 
        AreaTypeTyps.mapStringToEnum.put(AreaTypeTyps.REGION.m_str.toUpperCase(), AreaTypeTyps.REGION); 
        AreaTypeTyps.CITY = new AreaTypeTyps(2, "CITY");
        AreaTypeTyps.mapIntToEnum.put(AreaTypeTyps.CITY.value(), AreaTypeTyps.CITY); 
        AreaTypeTyps.mapStringToEnum.put(AreaTypeTyps.CITY.m_str.toUpperCase(), AreaTypeTyps.CITY); 
        AreaTypeTyps.VILLAGE = new AreaTypeTyps(3, "VILLAGE");
        AreaTypeTyps.mapIntToEnum.put(AreaTypeTyps.VILLAGE.value(), AreaTypeTyps.VILLAGE); 
        AreaTypeTyps.mapStringToEnum.put(AreaTypeTyps.VILLAGE.m_str.toUpperCase(), AreaTypeTyps.VILLAGE); 
        AreaTypeTyps.ORG = new AreaTypeTyps(4, "ORG");
        AreaTypeTyps.mapIntToEnum.put(AreaTypeTyps.ORG.value(), AreaTypeTyps.ORG); 
        AreaTypeTyps.mapStringToEnum.put(AreaTypeTyps.ORG.m_str.toUpperCase(), AreaTypeTyps.ORG); 
        AreaTypeTyps.STREET = new AreaTypeTyps(5, "STREET");
        AreaTypeTyps.mapIntToEnum.put(AreaTypeTyps.STREET.value(), AreaTypeTyps.STREET); 
        AreaTypeTyps.mapStringToEnum.put(AreaTypeTyps.STREET.m_str.toUpperCase(), AreaTypeTyps.STREET); 
        AreaTypeTyps.m_Values = Array.from(AreaTypeTyps.mapIntToEnum.values);
        AreaTypeTyps.m_Keys = Array.from(AreaTypeTyps.mapIntToEnum.keys);
    }
}


AreaTypeTyps.static_constructor();

module.exports = AreaTypeTyps