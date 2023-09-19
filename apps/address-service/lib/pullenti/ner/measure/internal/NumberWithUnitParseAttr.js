/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class NumberWithUnitParseAttr {

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
        if(val instanceof NumberWithUnitParseAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(NumberWithUnitParseAttr.mapStringToEnum.containsKey(val))
                return NumberWithUnitParseAttr.mapStringToEnum.get(val);
            return null;
        }
        if(NumberWithUnitParseAttr.mapIntToEnum.containsKey(val))
            return NumberWithUnitParseAttr.mapIntToEnum.get(val);
        let it = new NumberWithUnitParseAttr(val, val.toString());
        NumberWithUnitParseAttr.mapIntToEnum.put(val, it);
        NumberWithUnitParseAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return NumberWithUnitParseAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return NumberWithUnitParseAttr.m_Values;
    }
    static static_constructor() {
        NumberWithUnitParseAttr.mapIntToEnum = new Hashtable();
        NumberWithUnitParseAttr.mapStringToEnum = new Hashtable();
        NumberWithUnitParseAttr.NO = new NumberWithUnitParseAttr(0, "NO");
        NumberWithUnitParseAttr.mapIntToEnum.put(NumberWithUnitParseAttr.NO.value(), NumberWithUnitParseAttr.NO); 
        NumberWithUnitParseAttr.mapStringToEnum.put(NumberWithUnitParseAttr.NO.m_str.toUpperCase(), NumberWithUnitParseAttr.NO); 
        NumberWithUnitParseAttr.CANOMITNUMBER = new NumberWithUnitParseAttr(1, "CANOMITNUMBER");
        NumberWithUnitParseAttr.mapIntToEnum.put(NumberWithUnitParseAttr.CANOMITNUMBER.value(), NumberWithUnitParseAttr.CANOMITNUMBER); 
        NumberWithUnitParseAttr.mapStringToEnum.put(NumberWithUnitParseAttr.CANOMITNUMBER.m_str.toUpperCase(), NumberWithUnitParseAttr.CANOMITNUMBER); 
        NumberWithUnitParseAttr.NOT = new NumberWithUnitParseAttr(2, "NOT");
        NumberWithUnitParseAttr.mapIntToEnum.put(NumberWithUnitParseAttr.NOT.value(), NumberWithUnitParseAttr.NOT); 
        NumberWithUnitParseAttr.mapStringToEnum.put(NumberWithUnitParseAttr.NOT.m_str.toUpperCase(), NumberWithUnitParseAttr.NOT); 
        NumberWithUnitParseAttr.CANBENON = new NumberWithUnitParseAttr(4, "CANBENON");
        NumberWithUnitParseAttr.mapIntToEnum.put(NumberWithUnitParseAttr.CANBENON.value(), NumberWithUnitParseAttr.CANBENON); 
        NumberWithUnitParseAttr.mapStringToEnum.put(NumberWithUnitParseAttr.CANBENON.m_str.toUpperCase(), NumberWithUnitParseAttr.CANBENON); 
        NumberWithUnitParseAttr.ISSECOND = new NumberWithUnitParseAttr(8, "ISSECOND");
        NumberWithUnitParseAttr.mapIntToEnum.put(NumberWithUnitParseAttr.ISSECOND.value(), NumberWithUnitParseAttr.ISSECOND); 
        NumberWithUnitParseAttr.mapStringToEnum.put(NumberWithUnitParseAttr.ISSECOND.m_str.toUpperCase(), NumberWithUnitParseAttr.ISSECOND); 
        NumberWithUnitParseAttr.m_Values = Array.from(NumberWithUnitParseAttr.mapIntToEnum.values);
        NumberWithUnitParseAttr.m_Keys = Array.from(NumberWithUnitParseAttr.mapIntToEnum.keys);
    }
}


NumberWithUnitParseAttr.static_constructor();

module.exports = NumberWithUnitParseAttr