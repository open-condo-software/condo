/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Тип детализирующего указателя
 */
class DetailType {

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
        if(val instanceof DetailType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(DetailType.mapStringToEnum.containsKey(val))
                return DetailType.mapStringToEnum.get(val);
            return null;
        }
        if(DetailType.mapIntToEnum.containsKey(val))
            return DetailType.mapIntToEnum.get(val);
        let it = new DetailType(val, val.toString());
        DetailType.mapIntToEnum.put(val, it);
        DetailType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return DetailType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return DetailType.m_Values;
    }
    static static_constructor() {
        DetailType.mapIntToEnum = new Hashtable();
        DetailType.mapStringToEnum = new Hashtable();
        DetailType.UNDEFINED = new DetailType(0, "UNDEFINED");
        DetailType.mapIntToEnum.put(DetailType.UNDEFINED.value(), DetailType.UNDEFINED); 
        DetailType.mapStringToEnum.put(DetailType.UNDEFINED.m_str.toUpperCase(), DetailType.UNDEFINED); 
        DetailType.NEAR = new DetailType(1, "NEAR");
        DetailType.mapIntToEnum.put(DetailType.NEAR.value(), DetailType.NEAR); 
        DetailType.mapStringToEnum.put(DetailType.NEAR.m_str.toUpperCase(), DetailType.NEAR); 
        DetailType.NORTH = new DetailType(2, "NORTH");
        DetailType.mapIntToEnum.put(DetailType.NORTH.value(), DetailType.NORTH); 
        DetailType.mapStringToEnum.put(DetailType.NORTH.m_str.toUpperCase(), DetailType.NORTH); 
        DetailType.EAST = new DetailType(3, "EAST");
        DetailType.mapIntToEnum.put(DetailType.EAST.value(), DetailType.EAST); 
        DetailType.mapStringToEnum.put(DetailType.EAST.m_str.toUpperCase(), DetailType.EAST); 
        DetailType.SOUTH = new DetailType(4, "SOUTH");
        DetailType.mapIntToEnum.put(DetailType.SOUTH.value(), DetailType.SOUTH); 
        DetailType.mapStringToEnum.put(DetailType.SOUTH.m_str.toUpperCase(), DetailType.SOUTH); 
        DetailType.WEST = new DetailType(5, "WEST");
        DetailType.mapIntToEnum.put(DetailType.WEST.value(), DetailType.WEST); 
        DetailType.mapStringToEnum.put(DetailType.WEST.m_str.toUpperCase(), DetailType.WEST); 
        DetailType.NORTHWEST = new DetailType(6, "NORTHWEST");
        DetailType.mapIntToEnum.put(DetailType.NORTHWEST.value(), DetailType.NORTHWEST); 
        DetailType.mapStringToEnum.put(DetailType.NORTHWEST.m_str.toUpperCase(), DetailType.NORTHWEST); 
        DetailType.NORTHEAST = new DetailType(7, "NORTHEAST");
        DetailType.mapIntToEnum.put(DetailType.NORTHEAST.value(), DetailType.NORTHEAST); 
        DetailType.mapStringToEnum.put(DetailType.NORTHEAST.m_str.toUpperCase(), DetailType.NORTHEAST); 
        DetailType.SOUTHWEST = new DetailType(8, "SOUTHWEST");
        DetailType.mapIntToEnum.put(DetailType.SOUTHWEST.value(), DetailType.SOUTHWEST); 
        DetailType.mapStringToEnum.put(DetailType.SOUTHWEST.m_str.toUpperCase(), DetailType.SOUTHWEST); 
        DetailType.SOUTHEAST = new DetailType(9, "SOUTHEAST");
        DetailType.mapIntToEnum.put(DetailType.SOUTHEAST.value(), DetailType.SOUTHEAST); 
        DetailType.mapStringToEnum.put(DetailType.SOUTHEAST.m_str.toUpperCase(), DetailType.SOUTHEAST); 
        DetailType.CENTRAL = new DetailType(10, "CENTRAL");
        DetailType.mapIntToEnum.put(DetailType.CENTRAL.value(), DetailType.CENTRAL); 
        DetailType.mapStringToEnum.put(DetailType.CENTRAL.m_str.toUpperCase(), DetailType.CENTRAL); 
        DetailType.LEFT = new DetailType(11, "LEFT");
        DetailType.mapIntToEnum.put(DetailType.LEFT.value(), DetailType.LEFT); 
        DetailType.mapStringToEnum.put(DetailType.LEFT.m_str.toUpperCase(), DetailType.LEFT); 
        DetailType.RIGHT = new DetailType(12, "RIGHT");
        DetailType.mapIntToEnum.put(DetailType.RIGHT.value(), DetailType.RIGHT); 
        DetailType.mapStringToEnum.put(DetailType.RIGHT.m_str.toUpperCase(), DetailType.RIGHT); 
        DetailType.KMRANGE = new DetailType(13, "KMRANGE");
        DetailType.mapIntToEnum.put(DetailType.KMRANGE.value(), DetailType.KMRANGE); 
        DetailType.mapStringToEnum.put(DetailType.KMRANGE.m_str.toUpperCase(), DetailType.KMRANGE); 
        DetailType.m_Values = Array.from(DetailType.mapIntToEnum.values);
        DetailType.m_Keys = Array.from(DetailType.mapIntToEnum.keys);
    }
}


DetailType.static_constructor();

module.exports = DetailType