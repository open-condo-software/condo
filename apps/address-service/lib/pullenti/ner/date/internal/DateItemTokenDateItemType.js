/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class DateItemTokenDateItemType {

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
        if(val instanceof DateItemTokenDateItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(DateItemTokenDateItemType.mapStringToEnum.containsKey(val))
                return DateItemTokenDateItemType.mapStringToEnum.get(val);
            return null;
        }
        if(DateItemTokenDateItemType.mapIntToEnum.containsKey(val))
            return DateItemTokenDateItemType.mapIntToEnum.get(val);
        let it = new DateItemTokenDateItemType(val, val.toString());
        DateItemTokenDateItemType.mapIntToEnum.put(val, it);
        DateItemTokenDateItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return DateItemTokenDateItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return DateItemTokenDateItemType.m_Values;
    }
    static static_constructor() {
        DateItemTokenDateItemType.mapIntToEnum = new Hashtable();
        DateItemTokenDateItemType.mapStringToEnum = new Hashtable();
        DateItemTokenDateItemType.NUMBER = new DateItemTokenDateItemType(0, "NUMBER");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.NUMBER.value(), DateItemTokenDateItemType.NUMBER); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.NUMBER.m_str.toUpperCase(), DateItemTokenDateItemType.NUMBER); 
        DateItemTokenDateItemType.YEAR = new DateItemTokenDateItemType(1, "YEAR");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.YEAR.value(), DateItemTokenDateItemType.YEAR); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.YEAR.m_str.toUpperCase(), DateItemTokenDateItemType.YEAR); 
        DateItemTokenDateItemType.MONTH = new DateItemTokenDateItemType(2, "MONTH");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.MONTH.value(), DateItemTokenDateItemType.MONTH); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.MONTH.m_str.toUpperCase(), DateItemTokenDateItemType.MONTH); 
        DateItemTokenDateItemType.DAY = new DateItemTokenDateItemType(3, "DAY");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.DAY.value(), DateItemTokenDateItemType.DAY); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.DAY.m_str.toUpperCase(), DateItemTokenDateItemType.DAY); 
        DateItemTokenDateItemType.DELIM = new DateItemTokenDateItemType(4, "DELIM");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.DELIM.value(), DateItemTokenDateItemType.DELIM); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.DELIM.m_str.toUpperCase(), DateItemTokenDateItemType.DELIM); 
        DateItemTokenDateItemType.HOUR = new DateItemTokenDateItemType(5, "HOUR");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.HOUR.value(), DateItemTokenDateItemType.HOUR); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.HOUR.m_str.toUpperCase(), DateItemTokenDateItemType.HOUR); 
        DateItemTokenDateItemType.MINUTE = new DateItemTokenDateItemType(6, "MINUTE");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.MINUTE.value(), DateItemTokenDateItemType.MINUTE); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.MINUTE.m_str.toUpperCase(), DateItemTokenDateItemType.MINUTE); 
        DateItemTokenDateItemType.SECOND = new DateItemTokenDateItemType(7, "SECOND");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.SECOND.value(), DateItemTokenDateItemType.SECOND); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.SECOND.m_str.toUpperCase(), DateItemTokenDateItemType.SECOND); 
        DateItemTokenDateItemType.HALFYEAR = new DateItemTokenDateItemType(8, "HALFYEAR");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.HALFYEAR.value(), DateItemTokenDateItemType.HALFYEAR); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.HALFYEAR.m_str.toUpperCase(), DateItemTokenDateItemType.HALFYEAR); 
        DateItemTokenDateItemType.QUARTAL = new DateItemTokenDateItemType(9, "QUARTAL");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.QUARTAL.value(), DateItemTokenDateItemType.QUARTAL); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.QUARTAL.m_str.toUpperCase(), DateItemTokenDateItemType.QUARTAL); 
        DateItemTokenDateItemType.POINTER = new DateItemTokenDateItemType(10, "POINTER");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.POINTER.value(), DateItemTokenDateItemType.POINTER); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.POINTER.m_str.toUpperCase(), DateItemTokenDateItemType.POINTER); 
        DateItemTokenDateItemType.CENTURY = new DateItemTokenDateItemType(11, "CENTURY");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.CENTURY.value(), DateItemTokenDateItemType.CENTURY); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.CENTURY.m_str.toUpperCase(), DateItemTokenDateItemType.CENTURY); 
        DateItemTokenDateItemType.TENYEARS = new DateItemTokenDateItemType(12, "TENYEARS");
        DateItemTokenDateItemType.mapIntToEnum.put(DateItemTokenDateItemType.TENYEARS.value(), DateItemTokenDateItemType.TENYEARS); 
        DateItemTokenDateItemType.mapStringToEnum.put(DateItemTokenDateItemType.TENYEARS.m_str.toUpperCase(), DateItemTokenDateItemType.TENYEARS); 
        DateItemTokenDateItemType.m_Values = Array.from(DateItemTokenDateItemType.mapIntToEnum.values);
        DateItemTokenDateItemType.m_Keys = Array.from(DateItemTokenDateItemType.mapIntToEnum.keys);
    }
}


DateItemTokenDateItemType.static_constructor();

module.exports = DateItemTokenDateItemType