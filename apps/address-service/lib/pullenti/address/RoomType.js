/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Типы помещений
 */
class RoomType {

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
        if(val instanceof RoomType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(RoomType.mapStringToEnum.containsKey(val))
                return RoomType.mapStringToEnum.get(val);
            return null;
        }
        if(RoomType.mapIntToEnum.containsKey(val))
            return RoomType.mapIntToEnum.get(val);
        let it = new RoomType(val, val.toString());
        RoomType.mapIntToEnum.put(val, it);
        RoomType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return RoomType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return RoomType.m_Values;
    }
    static static_constructor() {
        RoomType.mapIntToEnum = new Hashtable();
        RoomType.mapStringToEnum = new Hashtable();
        RoomType.UNDEFINED = new RoomType(0, "UNDEFINED");
        RoomType.mapIntToEnum.put(RoomType.UNDEFINED.value(), RoomType.UNDEFINED); 
        RoomType.mapStringToEnum.put(RoomType.UNDEFINED.m_str.toUpperCase(), RoomType.UNDEFINED); 
        RoomType.SPACE = new RoomType(1, "SPACE");
        RoomType.mapIntToEnum.put(RoomType.SPACE.value(), RoomType.SPACE); 
        RoomType.mapStringToEnum.put(RoomType.SPACE.m_str.toUpperCase(), RoomType.SPACE); 
        RoomType.FLAT = new RoomType(2, "FLAT");
        RoomType.mapIntToEnum.put(RoomType.FLAT.value(), RoomType.FLAT); 
        RoomType.mapStringToEnum.put(RoomType.FLAT.m_str.toUpperCase(), RoomType.FLAT); 
        RoomType.OFFICE = new RoomType(3, "OFFICE");
        RoomType.mapIntToEnum.put(RoomType.OFFICE.value(), RoomType.OFFICE); 
        RoomType.mapStringToEnum.put(RoomType.OFFICE.m_str.toUpperCase(), RoomType.OFFICE); 
        RoomType.ROOM = new RoomType(4, "ROOM");
        RoomType.mapIntToEnum.put(RoomType.ROOM.value(), RoomType.ROOM); 
        RoomType.mapStringToEnum.put(RoomType.ROOM.m_str.toUpperCase(), RoomType.ROOM); 
        RoomType.PANTY = new RoomType(6, "PANTY");
        RoomType.mapIntToEnum.put(RoomType.PANTY.value(), RoomType.PANTY); 
        RoomType.mapStringToEnum.put(RoomType.PANTY.m_str.toUpperCase(), RoomType.PANTY); 
        RoomType.PAVILION = new RoomType(9, "PAVILION");
        RoomType.mapIntToEnum.put(RoomType.PAVILION.value(), RoomType.PAVILION); 
        RoomType.mapStringToEnum.put(RoomType.PAVILION.m_str.toUpperCase(), RoomType.PAVILION); 
        RoomType.GARAGE = new RoomType(13, "GARAGE");
        RoomType.mapIntToEnum.put(RoomType.GARAGE.value(), RoomType.GARAGE); 
        RoomType.mapStringToEnum.put(RoomType.GARAGE.m_str.toUpperCase(), RoomType.GARAGE); 
        RoomType.CARPLACE = new RoomType(100, "CARPLACE");
        RoomType.mapIntToEnum.put(RoomType.CARPLACE.value(), RoomType.CARPLACE); 
        RoomType.mapStringToEnum.put(RoomType.CARPLACE.m_str.toUpperCase(), RoomType.CARPLACE); 
        RoomType.m_Values = Array.from(RoomType.mapIntToEnum.values);
        RoomType.m_Keys = Array.from(RoomType.mapIntToEnum.keys);
    }
}


RoomType.static_constructor();

module.exports = RoomType