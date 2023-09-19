/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип строения
 */
class AddressBuildingType {

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
        if(val instanceof AddressBuildingType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(AddressBuildingType.mapStringToEnum.containsKey(val))
                return AddressBuildingType.mapStringToEnum.get(val);
            return null;
        }
        if(AddressBuildingType.mapIntToEnum.containsKey(val))
            return AddressBuildingType.mapIntToEnum.get(val);
        let it = new AddressBuildingType(val, val.toString());
        AddressBuildingType.mapIntToEnum.put(val, it);
        AddressBuildingType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return AddressBuildingType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return AddressBuildingType.m_Values;
    }
    static static_constructor() {
        AddressBuildingType.mapIntToEnum = new Hashtable();
        AddressBuildingType.mapStringToEnum = new Hashtable();
        AddressBuildingType.UNDEFINED = new AddressBuildingType(0, "UNDEFINED");
        AddressBuildingType.mapIntToEnum.put(AddressBuildingType.UNDEFINED.value(), AddressBuildingType.UNDEFINED); 
        AddressBuildingType.mapStringToEnum.put(AddressBuildingType.UNDEFINED.m_str.toUpperCase(), AddressBuildingType.UNDEFINED); 
        AddressBuildingType.BUILDING = new AddressBuildingType(1, "BUILDING");
        AddressBuildingType.mapIntToEnum.put(AddressBuildingType.BUILDING.value(), AddressBuildingType.BUILDING); 
        AddressBuildingType.mapStringToEnum.put(AddressBuildingType.BUILDING.m_str.toUpperCase(), AddressBuildingType.BUILDING); 
        AddressBuildingType.CONSTRUCTION = new AddressBuildingType(2, "CONSTRUCTION");
        AddressBuildingType.mapIntToEnum.put(AddressBuildingType.CONSTRUCTION.value(), AddressBuildingType.CONSTRUCTION); 
        AddressBuildingType.mapStringToEnum.put(AddressBuildingType.CONSTRUCTION.m_str.toUpperCase(), AddressBuildingType.CONSTRUCTION); 
        AddressBuildingType.LITER = new AddressBuildingType(3, "LITER");
        AddressBuildingType.mapIntToEnum.put(AddressBuildingType.LITER.value(), AddressBuildingType.LITER); 
        AddressBuildingType.mapStringToEnum.put(AddressBuildingType.LITER.m_str.toUpperCase(), AddressBuildingType.LITER); 
        AddressBuildingType.m_Values = Array.from(AddressBuildingType.mapIntToEnum.values);
        AddressBuildingType.m_Keys = Array.from(AddressBuildingType.mapIntToEnum.keys);
    }
}


AddressBuildingType.static_constructor();

module.exports = AddressBuildingType