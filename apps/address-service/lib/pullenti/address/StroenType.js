/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Типы строений
 */
class StroenType {

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
        if(val instanceof StroenType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(StroenType.mapStringToEnum.containsKey(val))
                return StroenType.mapStringToEnum.get(val);
            return null;
        }
        if(StroenType.mapIntToEnum.containsKey(val))
            return StroenType.mapIntToEnum.get(val);
        let it = new StroenType(val, val.toString());
        StroenType.mapIntToEnum.put(val, it);
        StroenType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return StroenType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return StroenType.m_Values;
    }
    static static_constructor() {
        StroenType.mapIntToEnum = new Hashtable();
        StroenType.mapStringToEnum = new Hashtable();
        StroenType.UNDEFINED = new StroenType(0, "UNDEFINED");
        StroenType.mapIntToEnum.put(StroenType.UNDEFINED.value(), StroenType.UNDEFINED); 
        StroenType.mapStringToEnum.put(StroenType.UNDEFINED.m_str.toUpperCase(), StroenType.UNDEFINED); 
        StroenType.BUILDING = new StroenType(1, "BUILDING");
        StroenType.mapIntToEnum.put(StroenType.BUILDING.value(), StroenType.BUILDING); 
        StroenType.mapStringToEnum.put(StroenType.BUILDING.m_str.toUpperCase(), StroenType.BUILDING); 
        StroenType.CONSTRUCTION = new StroenType(2, "CONSTRUCTION");
        StroenType.mapIntToEnum.put(StroenType.CONSTRUCTION.value(), StroenType.CONSTRUCTION); 
        StroenType.mapStringToEnum.put(StroenType.CONSTRUCTION.m_str.toUpperCase(), StroenType.CONSTRUCTION); 
        StroenType.LITER = new StroenType(3, "LITER");
        StroenType.mapIntToEnum.put(StroenType.LITER.value(), StroenType.LITER); 
        StroenType.mapStringToEnum.put(StroenType.LITER.m_str.toUpperCase(), StroenType.LITER); 
        StroenType.m_Values = Array.from(StroenType.mapIntToEnum.values);
        StroenType.m_Keys = Array.from(StroenType.mapIntToEnum.keys);
    }
}


StroenType.static_constructor();

module.exports = StroenType