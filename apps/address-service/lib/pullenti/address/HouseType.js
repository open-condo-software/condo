/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Типы домов и участков
 */
class HouseType {

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
        if(val instanceof HouseType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(HouseType.mapStringToEnum.containsKey(val))
                return HouseType.mapStringToEnum.get(val);
            return null;
        }
        if(HouseType.mapIntToEnum.containsKey(val))
            return HouseType.mapIntToEnum.get(val);
        let it = new HouseType(val, val.toString());
        HouseType.mapIntToEnum.put(val, it);
        HouseType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return HouseType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return HouseType.m_Values;
    }
    static static_constructor() {
        HouseType.mapIntToEnum = new Hashtable();
        HouseType.mapStringToEnum = new Hashtable();
        HouseType.UNDEFINED = new HouseType(0, "UNDEFINED");
        HouseType.mapIntToEnum.put(HouseType.UNDEFINED.value(), HouseType.UNDEFINED); 
        HouseType.mapStringToEnum.put(HouseType.UNDEFINED.m_str.toUpperCase(), HouseType.UNDEFINED); 
        HouseType.ESTATE = new HouseType(1, "ESTATE");
        HouseType.mapIntToEnum.put(HouseType.ESTATE.value(), HouseType.ESTATE); 
        HouseType.mapStringToEnum.put(HouseType.ESTATE.m_str.toUpperCase(), HouseType.ESTATE); 
        HouseType.HOUSE = new HouseType(2, "HOUSE");
        HouseType.mapIntToEnum.put(HouseType.HOUSE.value(), HouseType.HOUSE); 
        HouseType.mapStringToEnum.put(HouseType.HOUSE.m_str.toUpperCase(), HouseType.HOUSE); 
        HouseType.HOUSEESTATE = new HouseType(3, "HOUSEESTATE");
        HouseType.mapIntToEnum.put(HouseType.HOUSEESTATE.value(), HouseType.HOUSEESTATE); 
        HouseType.mapStringToEnum.put(HouseType.HOUSEESTATE.m_str.toUpperCase(), HouseType.HOUSEESTATE); 
        HouseType.SPECIAL = new HouseType(4, "SPECIAL");
        HouseType.mapIntToEnum.put(HouseType.SPECIAL.value(), HouseType.SPECIAL); 
        HouseType.mapStringToEnum.put(HouseType.SPECIAL.m_str.toUpperCase(), HouseType.SPECIAL); 
        HouseType.GARAGE = new HouseType(5, "GARAGE");
        HouseType.mapIntToEnum.put(HouseType.GARAGE.value(), HouseType.GARAGE); 
        HouseType.mapStringToEnum.put(HouseType.GARAGE.m_str.toUpperCase(), HouseType.GARAGE); 
        HouseType.PLOT = new HouseType(6, "PLOT");
        HouseType.mapIntToEnum.put(HouseType.PLOT.value(), HouseType.PLOT); 
        HouseType.mapStringToEnum.put(HouseType.PLOT.m_str.toUpperCase(), HouseType.PLOT); 
        HouseType.WELL = new HouseType(7, "WELL");
        HouseType.mapIntToEnum.put(HouseType.WELL.value(), HouseType.WELL); 
        HouseType.mapStringToEnum.put(HouseType.WELL.m_str.toUpperCase(), HouseType.WELL); 
        HouseType.m_Values = Array.from(HouseType.mapIntToEnum.values);
        HouseType.m_Keys = Array.from(HouseType.mapIntToEnum.keys);
    }
}


HouseType.static_constructor();

module.exports = HouseType