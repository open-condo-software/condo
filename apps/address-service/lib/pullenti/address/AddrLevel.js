/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Уровень адресного объекта
 */
class AddrLevel {

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
        if(val instanceof AddrLevel) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(AddrLevel.mapStringToEnum.containsKey(val))
                return AddrLevel.mapStringToEnum.get(val);
            return null;
        }
        if(AddrLevel.mapIntToEnum.containsKey(val))
            return AddrLevel.mapIntToEnum.get(val);
        let it = new AddrLevel(val, val.toString());
        AddrLevel.mapIntToEnum.put(val, it);
        AddrLevel.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return AddrLevel.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return AddrLevel.m_Values;
    }
    static static_constructor() {
        AddrLevel.mapIntToEnum = new Hashtable();
        AddrLevel.mapStringToEnum = new Hashtable();
        AddrLevel.UNDEFINED = new AddrLevel(0, "UNDEFINED");
        AddrLevel.mapIntToEnum.put(AddrLevel.UNDEFINED.value(), AddrLevel.UNDEFINED); 
        AddrLevel.mapStringToEnum.put(AddrLevel.UNDEFINED.m_str.toUpperCase(), AddrLevel.UNDEFINED); 
        AddrLevel.COUNTRY = new AddrLevel(1, "COUNTRY");
        AddrLevel.mapIntToEnum.put(AddrLevel.COUNTRY.value(), AddrLevel.COUNTRY); 
        AddrLevel.mapStringToEnum.put(AddrLevel.COUNTRY.m_str.toUpperCase(), AddrLevel.COUNTRY); 
        AddrLevel.REGIONAREA = new AddrLevel(2, "REGIONAREA");
        AddrLevel.mapIntToEnum.put(AddrLevel.REGIONAREA.value(), AddrLevel.REGIONAREA); 
        AddrLevel.mapStringToEnum.put(AddrLevel.REGIONAREA.m_str.toUpperCase(), AddrLevel.REGIONAREA); 
        AddrLevel.REGIONCITY = new AddrLevel(3, "REGIONCITY");
        AddrLevel.mapIntToEnum.put(AddrLevel.REGIONCITY.value(), AddrLevel.REGIONCITY); 
        AddrLevel.mapStringToEnum.put(AddrLevel.REGIONCITY.m_str.toUpperCase(), AddrLevel.REGIONCITY); 
        AddrLevel.DISTRICT = new AddrLevel(4, "DISTRICT");
        AddrLevel.mapIntToEnum.put(AddrLevel.DISTRICT.value(), AddrLevel.DISTRICT); 
        AddrLevel.mapStringToEnum.put(AddrLevel.DISTRICT.m_str.toUpperCase(), AddrLevel.DISTRICT); 
        AddrLevel.SETTLEMENT = new AddrLevel(5, "SETTLEMENT");
        AddrLevel.mapIntToEnum.put(AddrLevel.SETTLEMENT.value(), AddrLevel.SETTLEMENT); 
        AddrLevel.mapStringToEnum.put(AddrLevel.SETTLEMENT.m_str.toUpperCase(), AddrLevel.SETTLEMENT); 
        AddrLevel.CITY = new AddrLevel(6, "CITY");
        AddrLevel.mapIntToEnum.put(AddrLevel.CITY.value(), AddrLevel.CITY); 
        AddrLevel.mapStringToEnum.put(AddrLevel.CITY.m_str.toUpperCase(), AddrLevel.CITY); 
        AddrLevel.CITYDISTRICT = new AddrLevel(7, "CITYDISTRICT");
        AddrLevel.mapIntToEnum.put(AddrLevel.CITYDISTRICT.value(), AddrLevel.CITYDISTRICT); 
        AddrLevel.mapStringToEnum.put(AddrLevel.CITYDISTRICT.m_str.toUpperCase(), AddrLevel.CITYDISTRICT); 
        AddrLevel.LOCALITY = new AddrLevel(8, "LOCALITY");
        AddrLevel.mapIntToEnum.put(AddrLevel.LOCALITY.value(), AddrLevel.LOCALITY); 
        AddrLevel.mapStringToEnum.put(AddrLevel.LOCALITY.m_str.toUpperCase(), AddrLevel.LOCALITY); 
        AddrLevel.TERRITORY = new AddrLevel(9, "TERRITORY");
        AddrLevel.mapIntToEnum.put(AddrLevel.TERRITORY.value(), AddrLevel.TERRITORY); 
        AddrLevel.mapStringToEnum.put(AddrLevel.TERRITORY.m_str.toUpperCase(), AddrLevel.TERRITORY); 
        AddrLevel.STREET = new AddrLevel(10, "STREET");
        AddrLevel.mapIntToEnum.put(AddrLevel.STREET.value(), AddrLevel.STREET); 
        AddrLevel.mapStringToEnum.put(AddrLevel.STREET.m_str.toUpperCase(), AddrLevel.STREET); 
        AddrLevel.PLOT = new AddrLevel(11, "PLOT");
        AddrLevel.mapIntToEnum.put(AddrLevel.PLOT.value(), AddrLevel.PLOT); 
        AddrLevel.mapStringToEnum.put(AddrLevel.PLOT.m_str.toUpperCase(), AddrLevel.PLOT); 
        AddrLevel.BUILDING = new AddrLevel(12, "BUILDING");
        AddrLevel.mapIntToEnum.put(AddrLevel.BUILDING.value(), AddrLevel.BUILDING); 
        AddrLevel.mapStringToEnum.put(AddrLevel.BUILDING.m_str.toUpperCase(), AddrLevel.BUILDING); 
        AddrLevel.APARTMENT = new AddrLevel(13, "APARTMENT");
        AddrLevel.mapIntToEnum.put(AddrLevel.APARTMENT.value(), AddrLevel.APARTMENT); 
        AddrLevel.mapStringToEnum.put(AddrLevel.APARTMENT.m_str.toUpperCase(), AddrLevel.APARTMENT); 
        AddrLevel.ROOM = new AddrLevel(14, "ROOM");
        AddrLevel.mapIntToEnum.put(AddrLevel.ROOM.value(), AddrLevel.ROOM); 
        AddrLevel.mapStringToEnum.put(AddrLevel.ROOM.m_str.toUpperCase(), AddrLevel.ROOM); 
        AddrLevel.m_Values = Array.from(AddrLevel.mapIntToEnum.values);
        AddrLevel.m_Keys = Array.from(AddrLevel.mapIntToEnum.keys);
    }
}


AddrLevel.static_constructor();

module.exports = AddrLevel