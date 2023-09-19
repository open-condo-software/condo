/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

class NumberItemClass {

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
        if(val instanceof NumberItemClass) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(NumberItemClass.mapStringToEnum.containsKey(val))
                return NumberItemClass.mapStringToEnum.get(val);
            return null;
        }
        if(NumberItemClass.mapIntToEnum.containsKey(val))
            return NumberItemClass.mapIntToEnum.get(val);
        let it = new NumberItemClass(val, val.toString());
        NumberItemClass.mapIntToEnum.put(val, it);
        NumberItemClass.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return NumberItemClass.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return NumberItemClass.m_Values;
    }
    static static_constructor() {
        NumberItemClass.mapIntToEnum = new Hashtable();
        NumberItemClass.mapStringToEnum = new Hashtable();
        NumberItemClass.UNDEFINED = new NumberItemClass(0, "UNDEFINED");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.UNDEFINED.value(), NumberItemClass.UNDEFINED); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.UNDEFINED.m_str.toUpperCase(), NumberItemClass.UNDEFINED); 
        NumberItemClass.HOUSE = new NumberItemClass(1, "HOUSE");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.HOUSE.value(), NumberItemClass.HOUSE); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.HOUSE.m_str.toUpperCase(), NumberItemClass.HOUSE); 
        NumberItemClass.GARAGE = new NumberItemClass(2, "GARAGE");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.GARAGE.value(), NumberItemClass.GARAGE); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.GARAGE.m_str.toUpperCase(), NumberItemClass.GARAGE); 
        NumberItemClass.PLOT = new NumberItemClass(3, "PLOT");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.PLOT.value(), NumberItemClass.PLOT); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.PLOT.m_str.toUpperCase(), NumberItemClass.PLOT); 
        NumberItemClass.FLAT = new NumberItemClass(4, "FLAT");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.FLAT.value(), NumberItemClass.FLAT); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.FLAT.m_str.toUpperCase(), NumberItemClass.FLAT); 
        NumberItemClass.ROOM = new NumberItemClass(5, "ROOM");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.ROOM.value(), NumberItemClass.ROOM); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.ROOM.m_str.toUpperCase(), NumberItemClass.ROOM); 
        NumberItemClass.CARPLACE = new NumberItemClass(6, "CARPLACE");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.CARPLACE.value(), NumberItemClass.CARPLACE); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.CARPLACE.m_str.toUpperCase(), NumberItemClass.CARPLACE); 
        NumberItemClass.SPACE = new NumberItemClass(7, "SPACE");
        NumberItemClass.mapIntToEnum.put(NumberItemClass.SPACE.value(), NumberItemClass.SPACE); 
        NumberItemClass.mapStringToEnum.put(NumberItemClass.SPACE.m_str.toUpperCase(), NumberItemClass.SPACE); 
        NumberItemClass.m_Values = Array.from(NumberItemClass.mapIntToEnum.values);
        NumberItemClass.m_Keys = Array.from(NumberItemClass.mapIntToEnum.keys);
    }
}


NumberItemClass.static_constructor();

module.exports = NumberItemClass