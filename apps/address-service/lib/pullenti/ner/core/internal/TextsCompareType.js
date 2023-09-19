/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class TextsCompareType {

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
        if(val instanceof TextsCompareType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(TextsCompareType.mapStringToEnum.containsKey(val))
                return TextsCompareType.mapStringToEnum.get(val);
            return null;
        }
        if(TextsCompareType.mapIntToEnum.containsKey(val))
            return TextsCompareType.mapIntToEnum.get(val);
        let it = new TextsCompareType(val, val.toString());
        TextsCompareType.mapIntToEnum.put(val, it);
        TextsCompareType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return TextsCompareType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return TextsCompareType.m_Values;
    }
    static static_constructor() {
        TextsCompareType.mapIntToEnum = new Hashtable();
        TextsCompareType.mapStringToEnum = new Hashtable();
        TextsCompareType.NONCOMPARABLE = new TextsCompareType(0, "NONCOMPARABLE");
        TextsCompareType.mapIntToEnum.put(TextsCompareType.NONCOMPARABLE.value(), TextsCompareType.NONCOMPARABLE); 
        TextsCompareType.mapStringToEnum.put(TextsCompareType.NONCOMPARABLE.m_str.toUpperCase(), TextsCompareType.NONCOMPARABLE); 
        TextsCompareType.EQUIVALENT = new TextsCompareType(1, "EQUIVALENT");
        TextsCompareType.mapIntToEnum.put(TextsCompareType.EQUIVALENT.value(), TextsCompareType.EQUIVALENT); 
        TextsCompareType.mapStringToEnum.put(TextsCompareType.EQUIVALENT.m_str.toUpperCase(), TextsCompareType.EQUIVALENT); 
        TextsCompareType.EARLY = new TextsCompareType(2, "EARLY");
        TextsCompareType.mapIntToEnum.put(TextsCompareType.EARLY.value(), TextsCompareType.EARLY); 
        TextsCompareType.mapStringToEnum.put(TextsCompareType.EARLY.m_str.toUpperCase(), TextsCompareType.EARLY); 
        TextsCompareType.LATER = new TextsCompareType(3, "LATER");
        TextsCompareType.mapIntToEnum.put(TextsCompareType.LATER.value(), TextsCompareType.LATER); 
        TextsCompareType.mapStringToEnum.put(TextsCompareType.LATER.m_str.toUpperCase(), TextsCompareType.LATER); 
        TextsCompareType.IN = new TextsCompareType(4, "IN");
        TextsCompareType.mapIntToEnum.put(TextsCompareType.IN.value(), TextsCompareType.IN); 
        TextsCompareType.mapStringToEnum.put(TextsCompareType.IN.m_str.toUpperCase(), TextsCompareType.IN); 
        TextsCompareType.CONTAINS = new TextsCompareType(5, "CONTAINS");
        TextsCompareType.mapIntToEnum.put(TextsCompareType.CONTAINS.value(), TextsCompareType.CONTAINS); 
        TextsCompareType.mapStringToEnum.put(TextsCompareType.CONTAINS.m_str.toUpperCase(), TextsCompareType.CONTAINS); 
        TextsCompareType.INTERSECT = new TextsCompareType(6, "INTERSECT");
        TextsCompareType.mapIntToEnum.put(TextsCompareType.INTERSECT.value(), TextsCompareType.INTERSECT); 
        TextsCompareType.mapStringToEnum.put(TextsCompareType.INTERSECT.m_str.toUpperCase(), TextsCompareType.INTERSECT); 
        TextsCompareType.m_Values = Array.from(TextsCompareType.mapIntToEnum.values);
        TextsCompareType.m_Keys = Array.from(TextsCompareType.mapIntToEnum.keys);
    }
}


TextsCompareType.static_constructor();

module.exports = TextsCompareType