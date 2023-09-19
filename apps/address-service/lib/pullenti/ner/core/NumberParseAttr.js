/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

class NumberParseAttr {

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
        if(val instanceof NumberParseAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(NumberParseAttr.mapStringToEnum.containsKey(val))
                return NumberParseAttr.mapStringToEnum.get(val);
            return null;
        }
        if(NumberParseAttr.mapIntToEnum.containsKey(val))
            return NumberParseAttr.mapIntToEnum.get(val);
        let it = new NumberParseAttr(val, val.toString());
        NumberParseAttr.mapIntToEnum.put(val, it);
        NumberParseAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return NumberParseAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return NumberParseAttr.m_Values;
    }
    static static_constructor() {
        NumberParseAttr.mapIntToEnum = new Hashtable();
        NumberParseAttr.mapStringToEnum = new Hashtable();
        NumberParseAttr.NO = new NumberParseAttr(0, "NO");
        NumberParseAttr.mapIntToEnum.put(NumberParseAttr.NO.value(), NumberParseAttr.NO); 
        NumberParseAttr.mapStringToEnum.put(NumberParseAttr.NO.m_str.toUpperCase(), NumberParseAttr.NO); 
        NumberParseAttr.CANNOTBEINTEGER = new NumberParseAttr(1, "CANNOTBEINTEGER");
        NumberParseAttr.mapIntToEnum.put(NumberParseAttr.CANNOTBEINTEGER.value(), NumberParseAttr.CANNOTBEINTEGER); 
        NumberParseAttr.mapStringToEnum.put(NumberParseAttr.CANNOTBEINTEGER.m_str.toUpperCase(), NumberParseAttr.CANNOTBEINTEGER); 
        NumberParseAttr.NOWHITESPACES = new NumberParseAttr(2, "NOWHITESPACES");
        NumberParseAttr.mapIntToEnum.put(NumberParseAttr.NOWHITESPACES.value(), NumberParseAttr.NOWHITESPACES); 
        NumberParseAttr.mapStringToEnum.put(NumberParseAttr.NOWHITESPACES.m_str.toUpperCase(), NumberParseAttr.NOWHITESPACES); 
        NumberParseAttr.COMMAISFLOATPOINT = new NumberParseAttr(4, "COMMAISFLOATPOINT");
        NumberParseAttr.mapIntToEnum.put(NumberParseAttr.COMMAISFLOATPOINT.value(), NumberParseAttr.COMMAISFLOATPOINT); 
        NumberParseAttr.mapStringToEnum.put(NumberParseAttr.COMMAISFLOATPOINT.m_str.toUpperCase(), NumberParseAttr.COMMAISFLOATPOINT); 
        NumberParseAttr.m_Values = Array.from(NumberParseAttr.mapIntToEnum.values);
        NumberParseAttr.m_Keys = Array.from(NumberParseAttr.mapIntToEnum.keys);
    }
}


NumberParseAttr.static_constructor();

module.exports = NumberParseAttr