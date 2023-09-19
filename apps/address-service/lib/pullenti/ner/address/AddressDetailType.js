/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Детализация местоположения
 */
class AddressDetailType {

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
        if(val instanceof AddressDetailType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(AddressDetailType.mapStringToEnum.containsKey(val))
                return AddressDetailType.mapStringToEnum.get(val);
            return null;
        }
        if(AddressDetailType.mapIntToEnum.containsKey(val))
            return AddressDetailType.mapIntToEnum.get(val);
        let it = new AddressDetailType(val, val.toString());
        AddressDetailType.mapIntToEnum.put(val, it);
        AddressDetailType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return AddressDetailType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return AddressDetailType.m_Values;
    }
    static static_constructor() {
        AddressDetailType.mapIntToEnum = new Hashtable();
        AddressDetailType.mapStringToEnum = new Hashtable();
        AddressDetailType.UNDEFINED = new AddressDetailType(0, "UNDEFINED");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.UNDEFINED.value(), AddressDetailType.UNDEFINED); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.UNDEFINED.m_str.toUpperCase(), AddressDetailType.UNDEFINED); 
        AddressDetailType.CROSS = new AddressDetailType(1, "CROSS");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.CROSS.value(), AddressDetailType.CROSS); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.CROSS.m_str.toUpperCase(), AddressDetailType.CROSS); 
        AddressDetailType.NEAR = new AddressDetailType(2, "NEAR");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.NEAR.value(), AddressDetailType.NEAR); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.NEAR.m_str.toUpperCase(), AddressDetailType.NEAR); 
        AddressDetailType.HOSTEL = new AddressDetailType(3, "HOSTEL");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.HOSTEL.value(), AddressDetailType.HOSTEL); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.HOSTEL.m_str.toUpperCase(), AddressDetailType.HOSTEL); 
        AddressDetailType.NORTH = new AddressDetailType(4, "NORTH");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.NORTH.value(), AddressDetailType.NORTH); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.NORTH.m_str.toUpperCase(), AddressDetailType.NORTH); 
        AddressDetailType.SOUTH = new AddressDetailType(5, "SOUTH");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.SOUTH.value(), AddressDetailType.SOUTH); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.SOUTH.m_str.toUpperCase(), AddressDetailType.SOUTH); 
        AddressDetailType.WEST = new AddressDetailType(6, "WEST");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.WEST.value(), AddressDetailType.WEST); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.WEST.m_str.toUpperCase(), AddressDetailType.WEST); 
        AddressDetailType.EAST = new AddressDetailType(7, "EAST");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.EAST.value(), AddressDetailType.EAST); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.EAST.m_str.toUpperCase(), AddressDetailType.EAST); 
        AddressDetailType.NORTHWEST = new AddressDetailType(8, "NORTHWEST");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.NORTHWEST.value(), AddressDetailType.NORTHWEST); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.NORTHWEST.m_str.toUpperCase(), AddressDetailType.NORTHWEST); 
        AddressDetailType.NORTHEAST = new AddressDetailType(9, "NORTHEAST");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.NORTHEAST.value(), AddressDetailType.NORTHEAST); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.NORTHEAST.m_str.toUpperCase(), AddressDetailType.NORTHEAST); 
        AddressDetailType.SOUTHWEST = new AddressDetailType(10, "SOUTHWEST");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.SOUTHWEST.value(), AddressDetailType.SOUTHWEST); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.SOUTHWEST.m_str.toUpperCase(), AddressDetailType.SOUTHWEST); 
        AddressDetailType.SOUTHEAST = new AddressDetailType(11, "SOUTHEAST");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.SOUTHEAST.value(), AddressDetailType.SOUTHEAST); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.SOUTHEAST.m_str.toUpperCase(), AddressDetailType.SOUTHEAST); 
        AddressDetailType.CENTRAL = new AddressDetailType(12, "CENTRAL");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.CENTRAL.value(), AddressDetailType.CENTRAL); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.CENTRAL.m_str.toUpperCase(), AddressDetailType.CENTRAL); 
        AddressDetailType.LEFT = new AddressDetailType(13, "LEFT");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.LEFT.value(), AddressDetailType.LEFT); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.LEFT.m_str.toUpperCase(), AddressDetailType.LEFT); 
        AddressDetailType.RIGHT = new AddressDetailType(14, "RIGHT");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.RIGHT.value(), AddressDetailType.RIGHT); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.RIGHT.m_str.toUpperCase(), AddressDetailType.RIGHT); 
        AddressDetailType.RANGE = new AddressDetailType(15, "RANGE");
        AddressDetailType.mapIntToEnum.put(AddressDetailType.RANGE.value(), AddressDetailType.RANGE); 
        AddressDetailType.mapStringToEnum.put(AddressDetailType.RANGE.m_str.toUpperCase(), AddressDetailType.RANGE); 
        AddressDetailType.m_Values = Array.from(AddressDetailType.mapIntToEnum.values);
        AddressDetailType.m_Keys = Array.from(AddressDetailType.mapIntToEnum.keys);
    }
}


AddressDetailType.static_constructor();

module.exports = AddressDetailType