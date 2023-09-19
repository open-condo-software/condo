/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class GeoTokenType {

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
        if(val instanceof GeoTokenType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(GeoTokenType.mapStringToEnum.containsKey(val))
                return GeoTokenType.mapStringToEnum.get(val);
            return null;
        }
        if(GeoTokenType.mapIntToEnum.containsKey(val))
            return GeoTokenType.mapIntToEnum.get(val);
        let it = new GeoTokenType(val, val.toString());
        GeoTokenType.mapIntToEnum.put(val, it);
        GeoTokenType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return GeoTokenType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return GeoTokenType.m_Values;
    }
    static static_constructor() {
        GeoTokenType.mapIntToEnum = new Hashtable();
        GeoTokenType.mapStringToEnum = new Hashtable();
        GeoTokenType.ANY = new GeoTokenType(0, "ANY");
        GeoTokenType.mapIntToEnum.put(GeoTokenType.ANY.value(), GeoTokenType.ANY); 
        GeoTokenType.mapStringToEnum.put(GeoTokenType.ANY.m_str.toUpperCase(), GeoTokenType.ANY); 
        GeoTokenType.ORG = new GeoTokenType(1, "ORG");
        GeoTokenType.mapIntToEnum.put(GeoTokenType.ORG.value(), GeoTokenType.ORG); 
        GeoTokenType.mapStringToEnum.put(GeoTokenType.ORG.m_str.toUpperCase(), GeoTokenType.ORG); 
        GeoTokenType.STREET = new GeoTokenType(2, "STREET");
        GeoTokenType.mapIntToEnum.put(GeoTokenType.STREET.value(), GeoTokenType.STREET); 
        GeoTokenType.mapStringToEnum.put(GeoTokenType.STREET.m_str.toUpperCase(), GeoTokenType.STREET); 
        GeoTokenType.CITY = new GeoTokenType(3, "CITY");
        GeoTokenType.mapIntToEnum.put(GeoTokenType.CITY.value(), GeoTokenType.CITY); 
        GeoTokenType.mapStringToEnum.put(GeoTokenType.CITY.m_str.toUpperCase(), GeoTokenType.CITY); 
        GeoTokenType.TERR = new GeoTokenType(4, "TERR");
        GeoTokenType.mapIntToEnum.put(GeoTokenType.TERR.value(), GeoTokenType.TERR); 
        GeoTokenType.mapStringToEnum.put(GeoTokenType.TERR.m_str.toUpperCase(), GeoTokenType.TERR); 
        GeoTokenType.STRONG = new GeoTokenType(5, "STRONG");
        GeoTokenType.mapIntToEnum.put(GeoTokenType.STRONG.value(), GeoTokenType.STRONG); 
        GeoTokenType.mapStringToEnum.put(GeoTokenType.STRONG.m_str.toUpperCase(), GeoTokenType.STRONG); 
        GeoTokenType.HOUSE = new GeoTokenType(6, "HOUSE");
        GeoTokenType.mapIntToEnum.put(GeoTokenType.HOUSE.value(), GeoTokenType.HOUSE); 
        GeoTokenType.mapStringToEnum.put(GeoTokenType.HOUSE.m_str.toUpperCase(), GeoTokenType.HOUSE); 
        GeoTokenType.m_Values = Array.from(GeoTokenType.mapIntToEnum.values);
        GeoTokenType.m_Keys = Array.from(GeoTokenType.mapIntToEnum.keys);
    }
}


GeoTokenType.static_constructor();

module.exports = GeoTokenType