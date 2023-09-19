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
class GarLevel {

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
        if(val instanceof GarLevel) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(GarLevel.mapStringToEnum.containsKey(val))
                return GarLevel.mapStringToEnum.get(val);
            return null;
        }
        if(GarLevel.mapIntToEnum.containsKey(val))
            return GarLevel.mapIntToEnum.get(val);
        let it = new GarLevel(val, val.toString());
        GarLevel.mapIntToEnum.put(val, it);
        GarLevel.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return GarLevel.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return GarLevel.m_Values;
    }
    static static_constructor() {
        GarLevel.mapIntToEnum = new Hashtable();
        GarLevel.mapStringToEnum = new Hashtable();
        GarLevel.UNDEFINED = new GarLevel(0, "UNDEFINED");
        GarLevel.mapIntToEnum.put(GarLevel.UNDEFINED.value(), GarLevel.UNDEFINED); 
        GarLevel.mapStringToEnum.put(GarLevel.UNDEFINED.m_str.toUpperCase(), GarLevel.UNDEFINED); 
        GarLevel.REGION = new GarLevel(1, "REGION");
        GarLevel.mapIntToEnum.put(GarLevel.REGION.value(), GarLevel.REGION); 
        GarLevel.mapStringToEnum.put(GarLevel.REGION.m_str.toUpperCase(), GarLevel.REGION); 
        GarLevel.ADMINAREA = new GarLevel(2, "ADMINAREA");
        GarLevel.mapIntToEnum.put(GarLevel.ADMINAREA.value(), GarLevel.ADMINAREA); 
        GarLevel.mapStringToEnum.put(GarLevel.ADMINAREA.m_str.toUpperCase(), GarLevel.ADMINAREA); 
        GarLevel.MUNICIPALAREA = new GarLevel(3, "MUNICIPALAREA");
        GarLevel.mapIntToEnum.put(GarLevel.MUNICIPALAREA.value(), GarLevel.MUNICIPALAREA); 
        GarLevel.mapStringToEnum.put(GarLevel.MUNICIPALAREA.m_str.toUpperCase(), GarLevel.MUNICIPALAREA); 
        GarLevel.SETTLEMENT = new GarLevel(4, "SETTLEMENT");
        GarLevel.mapIntToEnum.put(GarLevel.SETTLEMENT.value(), GarLevel.SETTLEMENT); 
        GarLevel.mapStringToEnum.put(GarLevel.SETTLEMENT.m_str.toUpperCase(), GarLevel.SETTLEMENT); 
        GarLevel.CITY = new GarLevel(5, "CITY");
        GarLevel.mapIntToEnum.put(GarLevel.CITY.value(), GarLevel.CITY); 
        GarLevel.mapStringToEnum.put(GarLevel.CITY.m_str.toUpperCase(), GarLevel.CITY); 
        GarLevel.LOCALITY = new GarLevel(6, "LOCALITY");
        GarLevel.mapIntToEnum.put(GarLevel.LOCALITY.value(), GarLevel.LOCALITY); 
        GarLevel.mapStringToEnum.put(GarLevel.LOCALITY.m_str.toUpperCase(), GarLevel.LOCALITY); 
        GarLevel.DISTRICT = new GarLevel(14, "DISTRICT");
        GarLevel.mapIntToEnum.put(GarLevel.DISTRICT.value(), GarLevel.DISTRICT); 
        GarLevel.mapStringToEnum.put(GarLevel.DISTRICT.m_str.toUpperCase(), GarLevel.DISTRICT); 
        GarLevel.AREA = new GarLevel(7, "AREA");
        GarLevel.mapIntToEnum.put(GarLevel.AREA.value(), GarLevel.AREA); 
        GarLevel.mapStringToEnum.put(GarLevel.AREA.m_str.toUpperCase(), GarLevel.AREA); 
        GarLevel.STREET = new GarLevel(8, "STREET");
        GarLevel.mapIntToEnum.put(GarLevel.STREET.value(), GarLevel.STREET); 
        GarLevel.mapStringToEnum.put(GarLevel.STREET.m_str.toUpperCase(), GarLevel.STREET); 
        GarLevel.PLOT = new GarLevel(9, "PLOT");
        GarLevel.mapIntToEnum.put(GarLevel.PLOT.value(), GarLevel.PLOT); 
        GarLevel.mapStringToEnum.put(GarLevel.PLOT.m_str.toUpperCase(), GarLevel.PLOT); 
        GarLevel.BUILDING = new GarLevel(10, "BUILDING");
        GarLevel.mapIntToEnum.put(GarLevel.BUILDING.value(), GarLevel.BUILDING); 
        GarLevel.mapStringToEnum.put(GarLevel.BUILDING.m_str.toUpperCase(), GarLevel.BUILDING); 
        GarLevel.ROOM = new GarLevel(11, "ROOM");
        GarLevel.mapIntToEnum.put(GarLevel.ROOM.value(), GarLevel.ROOM); 
        GarLevel.mapStringToEnum.put(GarLevel.ROOM.m_str.toUpperCase(), GarLevel.ROOM); 
        GarLevel.CARPLACE = new GarLevel(17, "CARPLACE");
        GarLevel.mapIntToEnum.put(GarLevel.CARPLACE.value(), GarLevel.CARPLACE); 
        GarLevel.mapStringToEnum.put(GarLevel.CARPLACE.m_str.toUpperCase(), GarLevel.CARPLACE); 
        GarLevel.m_Values = Array.from(GarLevel.mapIntToEnum.values);
        GarLevel.m_Keys = Array.from(GarLevel.mapIntToEnum.keys);
    }
}


GarLevel.static_constructor();

module.exports = GarLevel