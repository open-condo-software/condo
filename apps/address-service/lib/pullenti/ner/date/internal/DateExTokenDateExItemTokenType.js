/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class DateExTokenDateExItemTokenType {

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
        if(val instanceof DateExTokenDateExItemTokenType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(DateExTokenDateExItemTokenType.mapStringToEnum.containsKey(val))
                return DateExTokenDateExItemTokenType.mapStringToEnum.get(val);
            return null;
        }
        if(DateExTokenDateExItemTokenType.mapIntToEnum.containsKey(val))
            return DateExTokenDateExItemTokenType.mapIntToEnum.get(val);
        let it = new DateExTokenDateExItemTokenType(val, val.toString());
        DateExTokenDateExItemTokenType.mapIntToEnum.put(val, it);
        DateExTokenDateExItemTokenType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return DateExTokenDateExItemTokenType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return DateExTokenDateExItemTokenType.m_Values;
    }
    static static_constructor() {
        DateExTokenDateExItemTokenType.mapIntToEnum = new Hashtable();
        DateExTokenDateExItemTokenType.mapStringToEnum = new Hashtable();
        DateExTokenDateExItemTokenType.UNDEFINED = new DateExTokenDateExItemTokenType(0, "UNDEFINED");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.UNDEFINED.value(), DateExTokenDateExItemTokenType.UNDEFINED); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.UNDEFINED.m_str.toUpperCase(), DateExTokenDateExItemTokenType.UNDEFINED); 
        DateExTokenDateExItemTokenType.CENTURY = new DateExTokenDateExItemTokenType(1, "CENTURY");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.CENTURY.value(), DateExTokenDateExItemTokenType.CENTURY); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.CENTURY.m_str.toUpperCase(), DateExTokenDateExItemTokenType.CENTURY); 
        DateExTokenDateExItemTokenType.DECADE = new DateExTokenDateExItemTokenType(2, "DECADE");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.DECADE.value(), DateExTokenDateExItemTokenType.DECADE); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.DECADE.m_str.toUpperCase(), DateExTokenDateExItemTokenType.DECADE); 
        DateExTokenDateExItemTokenType.YEAR = new DateExTokenDateExItemTokenType(3, "YEAR");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.YEAR.value(), DateExTokenDateExItemTokenType.YEAR); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.YEAR.m_str.toUpperCase(), DateExTokenDateExItemTokenType.YEAR); 
        DateExTokenDateExItemTokenType.HALFYEAR = new DateExTokenDateExItemTokenType(4, "HALFYEAR");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.HALFYEAR.value(), DateExTokenDateExItemTokenType.HALFYEAR); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.HALFYEAR.m_str.toUpperCase(), DateExTokenDateExItemTokenType.HALFYEAR); 
        DateExTokenDateExItemTokenType.QUARTAL = new DateExTokenDateExItemTokenType(5, "QUARTAL");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.QUARTAL.value(), DateExTokenDateExItemTokenType.QUARTAL); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.QUARTAL.m_str.toUpperCase(), DateExTokenDateExItemTokenType.QUARTAL); 
        DateExTokenDateExItemTokenType.SEASON = new DateExTokenDateExItemTokenType(6, "SEASON");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.SEASON.value(), DateExTokenDateExItemTokenType.SEASON); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.SEASON.m_str.toUpperCase(), DateExTokenDateExItemTokenType.SEASON); 
        DateExTokenDateExItemTokenType.MONTH = new DateExTokenDateExItemTokenType(7, "MONTH");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.MONTH.value(), DateExTokenDateExItemTokenType.MONTH); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.MONTH.m_str.toUpperCase(), DateExTokenDateExItemTokenType.MONTH); 
        DateExTokenDateExItemTokenType.WEEK = new DateExTokenDateExItemTokenType(8, "WEEK");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.WEEK.value(), DateExTokenDateExItemTokenType.WEEK); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.WEEK.m_str.toUpperCase(), DateExTokenDateExItemTokenType.WEEK); 
        DateExTokenDateExItemTokenType.DAY = new DateExTokenDateExItemTokenType(9, "DAY");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.DAY.value(), DateExTokenDateExItemTokenType.DAY); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.DAY.m_str.toUpperCase(), DateExTokenDateExItemTokenType.DAY); 
        DateExTokenDateExItemTokenType.DAYOFWEEK = new DateExTokenDateExItemTokenType(10, "DAYOFWEEK");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.DAYOFWEEK.value(), DateExTokenDateExItemTokenType.DAYOFWEEK); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.DAYOFWEEK.m_str.toUpperCase(), DateExTokenDateExItemTokenType.DAYOFWEEK); 
        DateExTokenDateExItemTokenType.HOUR = new DateExTokenDateExItemTokenType(11, "HOUR");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.HOUR.value(), DateExTokenDateExItemTokenType.HOUR); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.HOUR.m_str.toUpperCase(), DateExTokenDateExItemTokenType.HOUR); 
        DateExTokenDateExItemTokenType.MINUTE = new DateExTokenDateExItemTokenType(12, "MINUTE");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.MINUTE.value(), DateExTokenDateExItemTokenType.MINUTE); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.MINUTE.m_str.toUpperCase(), DateExTokenDateExItemTokenType.MINUTE); 
        DateExTokenDateExItemTokenType.WEEKEND = new DateExTokenDateExItemTokenType(13, "WEEKEND");
        DateExTokenDateExItemTokenType.mapIntToEnum.put(DateExTokenDateExItemTokenType.WEEKEND.value(), DateExTokenDateExItemTokenType.WEEKEND); 
        DateExTokenDateExItemTokenType.mapStringToEnum.put(DateExTokenDateExItemTokenType.WEEKEND.m_str.toUpperCase(), DateExTokenDateExItemTokenType.WEEKEND); 
        DateExTokenDateExItemTokenType.m_Values = Array.from(DateExTokenDateExItemTokenType.mapIntToEnum.values);
        DateExTokenDateExItemTokenType.m_Keys = Array.from(DateExTokenDateExItemTokenType.mapIntToEnum.keys);
    }
}


DateExTokenDateExItemTokenType.static_constructor();

module.exports = DateExTokenDateExItemTokenType