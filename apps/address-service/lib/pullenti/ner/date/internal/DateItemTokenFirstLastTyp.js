/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class DateItemTokenFirstLastTyp {

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
        if(val instanceof DateItemTokenFirstLastTyp) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(DateItemTokenFirstLastTyp.mapStringToEnum.containsKey(val))
                return DateItemTokenFirstLastTyp.mapStringToEnum.get(val);
            return null;
        }
        if(DateItemTokenFirstLastTyp.mapIntToEnum.containsKey(val))
            return DateItemTokenFirstLastTyp.mapIntToEnum.get(val);
        let it = new DateItemTokenFirstLastTyp(val, val.toString());
        DateItemTokenFirstLastTyp.mapIntToEnum.put(val, it);
        DateItemTokenFirstLastTyp.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return DateItemTokenFirstLastTyp.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return DateItemTokenFirstLastTyp.m_Values;
    }
    static static_constructor() {
        DateItemTokenFirstLastTyp.mapIntToEnum = new Hashtable();
        DateItemTokenFirstLastTyp.mapStringToEnum = new Hashtable();
        DateItemTokenFirstLastTyp.NO = new DateItemTokenFirstLastTyp(0, "NO");
        DateItemTokenFirstLastTyp.mapIntToEnum.put(DateItemTokenFirstLastTyp.NO.value(), DateItemTokenFirstLastTyp.NO); 
        DateItemTokenFirstLastTyp.mapStringToEnum.put(DateItemTokenFirstLastTyp.NO.m_str.toUpperCase(), DateItemTokenFirstLastTyp.NO); 
        DateItemTokenFirstLastTyp.FIRST = new DateItemTokenFirstLastTyp(1, "FIRST");
        DateItemTokenFirstLastTyp.mapIntToEnum.put(DateItemTokenFirstLastTyp.FIRST.value(), DateItemTokenFirstLastTyp.FIRST); 
        DateItemTokenFirstLastTyp.mapStringToEnum.put(DateItemTokenFirstLastTyp.FIRST.m_str.toUpperCase(), DateItemTokenFirstLastTyp.FIRST); 
        DateItemTokenFirstLastTyp.LAST = new DateItemTokenFirstLastTyp(2, "LAST");
        DateItemTokenFirstLastTyp.mapIntToEnum.put(DateItemTokenFirstLastTyp.LAST.value(), DateItemTokenFirstLastTyp.LAST); 
        DateItemTokenFirstLastTyp.mapStringToEnum.put(DateItemTokenFirstLastTyp.LAST.m_str.toUpperCase(), DateItemTokenFirstLastTyp.LAST); 
        DateItemTokenFirstLastTyp.m_Values = Array.from(DateItemTokenFirstLastTyp.mapIntToEnum.values);
        DateItemTokenFirstLastTyp.m_Keys = Array.from(DateItemTokenFirstLastTyp.mapIntToEnum.keys);
    }
}


DateItemTokenFirstLastTyp.static_constructor();

module.exports = DateItemTokenFirstLastTyp