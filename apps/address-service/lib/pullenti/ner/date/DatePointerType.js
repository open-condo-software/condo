/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Дополнительные указатели для дат
 */
class DatePointerType {

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
        if(val instanceof DatePointerType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(DatePointerType.mapStringToEnum.containsKey(val))
                return DatePointerType.mapStringToEnum.get(val);
            return null;
        }
        if(DatePointerType.mapIntToEnum.containsKey(val))
            return DatePointerType.mapIntToEnum.get(val);
        let it = new DatePointerType(val, val.toString());
        DatePointerType.mapIntToEnum.put(val, it);
        DatePointerType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return DatePointerType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return DatePointerType.m_Values;
    }
    static static_constructor() {
        DatePointerType.mapIntToEnum = new Hashtable();
        DatePointerType.mapStringToEnum = new Hashtable();
        DatePointerType.NO = new DatePointerType(0, "NO");
        DatePointerType.mapIntToEnum.put(DatePointerType.NO.value(), DatePointerType.NO); 
        DatePointerType.mapStringToEnum.put(DatePointerType.NO.m_str.toUpperCase(), DatePointerType.NO); 
        DatePointerType.BEGIN = new DatePointerType(1, "BEGIN");
        DatePointerType.mapIntToEnum.put(DatePointerType.BEGIN.value(), DatePointerType.BEGIN); 
        DatePointerType.mapStringToEnum.put(DatePointerType.BEGIN.m_str.toUpperCase(), DatePointerType.BEGIN); 
        DatePointerType.CENTER = new DatePointerType(2, "CENTER");
        DatePointerType.mapIntToEnum.put(DatePointerType.CENTER.value(), DatePointerType.CENTER); 
        DatePointerType.mapStringToEnum.put(DatePointerType.CENTER.m_str.toUpperCase(), DatePointerType.CENTER); 
        DatePointerType.END = new DatePointerType(3, "END");
        DatePointerType.mapIntToEnum.put(DatePointerType.END.value(), DatePointerType.END); 
        DatePointerType.mapStringToEnum.put(DatePointerType.END.m_str.toUpperCase(), DatePointerType.END); 
        DatePointerType.TODAY = new DatePointerType(4, "TODAY");
        DatePointerType.mapIntToEnum.put(DatePointerType.TODAY.value(), DatePointerType.TODAY); 
        DatePointerType.mapStringToEnum.put(DatePointerType.TODAY.m_str.toUpperCase(), DatePointerType.TODAY); 
        DatePointerType.WINTER = new DatePointerType(5, "WINTER");
        DatePointerType.mapIntToEnum.put(DatePointerType.WINTER.value(), DatePointerType.WINTER); 
        DatePointerType.mapStringToEnum.put(DatePointerType.WINTER.m_str.toUpperCase(), DatePointerType.WINTER); 
        DatePointerType.SPRING = new DatePointerType(6, "SPRING");
        DatePointerType.mapIntToEnum.put(DatePointerType.SPRING.value(), DatePointerType.SPRING); 
        DatePointerType.mapStringToEnum.put(DatePointerType.SPRING.m_str.toUpperCase(), DatePointerType.SPRING); 
        DatePointerType.SUMMER = new DatePointerType(7, "SUMMER");
        DatePointerType.mapIntToEnum.put(DatePointerType.SUMMER.value(), DatePointerType.SUMMER); 
        DatePointerType.mapStringToEnum.put(DatePointerType.SUMMER.m_str.toUpperCase(), DatePointerType.SUMMER); 
        DatePointerType.AUTUMN = new DatePointerType(8, "AUTUMN");
        DatePointerType.mapIntToEnum.put(DatePointerType.AUTUMN.value(), DatePointerType.AUTUMN); 
        DatePointerType.mapStringToEnum.put(DatePointerType.AUTUMN.m_str.toUpperCase(), DatePointerType.AUTUMN); 
        DatePointerType.ABOUT = new DatePointerType(9, "ABOUT");
        DatePointerType.mapIntToEnum.put(DatePointerType.ABOUT.value(), DatePointerType.ABOUT); 
        DatePointerType.mapStringToEnum.put(DatePointerType.ABOUT.m_str.toUpperCase(), DatePointerType.ABOUT); 
        DatePointerType.UNDEFINED = new DatePointerType(10, "UNDEFINED");
        DatePointerType.mapIntToEnum.put(DatePointerType.UNDEFINED.value(), DatePointerType.UNDEFINED); 
        DatePointerType.mapStringToEnum.put(DatePointerType.UNDEFINED.m_str.toUpperCase(), DatePointerType.UNDEFINED); 
        DatePointerType.m_Values = Array.from(DatePointerType.mapIntToEnum.values);
        DatePointerType.m_Keys = Array.from(DatePointerType.mapIntToEnum.keys);
    }
}


DatePointerType.static_constructor();

module.exports = DatePointerType