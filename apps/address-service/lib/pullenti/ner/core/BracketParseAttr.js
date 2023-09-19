/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Атрибуты выделения последовательности между скобок-кавычек. Битовая маска.
 * Атрибуты выделения скобок и кавычек
 */
class BracketParseAttr {

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
        if(val instanceof BracketParseAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(BracketParseAttr.mapStringToEnum.containsKey(val))
                return BracketParseAttr.mapStringToEnum.get(val);
            return null;
        }
        if(BracketParseAttr.mapIntToEnum.containsKey(val))
            return BracketParseAttr.mapIntToEnum.get(val);
        let it = new BracketParseAttr(val, val.toString());
        BracketParseAttr.mapIntToEnum.put(val, it);
        BracketParseAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return BracketParseAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return BracketParseAttr.m_Values;
    }
    static static_constructor() {
        BracketParseAttr.mapIntToEnum = new Hashtable();
        BracketParseAttr.mapStringToEnum = new Hashtable();
        BracketParseAttr.NO = new BracketParseAttr(0, "NO");
        BracketParseAttr.mapIntToEnum.put(BracketParseAttr.NO.value(), BracketParseAttr.NO); 
        BracketParseAttr.mapStringToEnum.put(BracketParseAttr.NO.m_str.toUpperCase(), BracketParseAttr.NO); 
        BracketParseAttr.CANCONTAINSVERBS = new BracketParseAttr(2, "CANCONTAINSVERBS");
        BracketParseAttr.mapIntToEnum.put(BracketParseAttr.CANCONTAINSVERBS.value(), BracketParseAttr.CANCONTAINSVERBS); 
        BracketParseAttr.mapStringToEnum.put(BracketParseAttr.CANCONTAINSVERBS.m_str.toUpperCase(), BracketParseAttr.CANCONTAINSVERBS); 
        BracketParseAttr.NEARCLOSEBRACKET = new BracketParseAttr(4, "NEARCLOSEBRACKET");
        BracketParseAttr.mapIntToEnum.put(BracketParseAttr.NEARCLOSEBRACKET.value(), BracketParseAttr.NEARCLOSEBRACKET); 
        BracketParseAttr.mapStringToEnum.put(BracketParseAttr.NEARCLOSEBRACKET.m_str.toUpperCase(), BracketParseAttr.NEARCLOSEBRACKET); 
        BracketParseAttr.CANBEMANYLINES = new BracketParseAttr(8, "CANBEMANYLINES");
        BracketParseAttr.mapIntToEnum.put(BracketParseAttr.CANBEMANYLINES.value(), BracketParseAttr.CANBEMANYLINES); 
        BracketParseAttr.mapStringToEnum.put(BracketParseAttr.CANBEMANYLINES.m_str.toUpperCase(), BracketParseAttr.CANBEMANYLINES); 
        BracketParseAttr.INTERNALUSAGE = new BracketParseAttr(0x10, "INTERNALUSAGE");
        BracketParseAttr.mapIntToEnum.put(BracketParseAttr.INTERNALUSAGE.value(), BracketParseAttr.INTERNALUSAGE); 
        BracketParseAttr.mapStringToEnum.put(BracketParseAttr.INTERNALUSAGE.m_str.toUpperCase(), BracketParseAttr.INTERNALUSAGE); 
        BracketParseAttr.m_Values = Array.from(BracketParseAttr.mapIntToEnum.values);
        BracketParseAttr.m_Keys = Array.from(BracketParseAttr.mapIntToEnum.keys);
    }
}


BracketParseAttr.static_constructor();

module.exports = BracketParseAttr