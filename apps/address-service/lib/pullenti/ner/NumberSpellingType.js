/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Тип написания числительного NumberToken
 * Тип числительного
 */
class NumberSpellingType {

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
        if(val instanceof NumberSpellingType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(NumberSpellingType.mapStringToEnum.containsKey(val))
                return NumberSpellingType.mapStringToEnum.get(val);
            return null;
        }
        if(NumberSpellingType.mapIntToEnum.containsKey(val))
            return NumberSpellingType.mapIntToEnum.get(val);
        let it = new NumberSpellingType(val, val.toString());
        NumberSpellingType.mapIntToEnum.put(val, it);
        NumberSpellingType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return NumberSpellingType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return NumberSpellingType.m_Values;
    }
    static static_constructor() {
        NumberSpellingType.mapIntToEnum = new Hashtable();
        NumberSpellingType.mapStringToEnum = new Hashtable();
        NumberSpellingType.UNDEFINED = new NumberSpellingType(0, "UNDEFINED");
        NumberSpellingType.mapIntToEnum.put(NumberSpellingType.UNDEFINED.value(), NumberSpellingType.UNDEFINED); 
        NumberSpellingType.mapStringToEnum.put(NumberSpellingType.UNDEFINED.m_str.toUpperCase(), NumberSpellingType.UNDEFINED); 
        NumberSpellingType.DIGIT = new NumberSpellingType(1, "DIGIT");
        NumberSpellingType.mapIntToEnum.put(NumberSpellingType.DIGIT.value(), NumberSpellingType.DIGIT); 
        NumberSpellingType.mapStringToEnum.put(NumberSpellingType.DIGIT.m_str.toUpperCase(), NumberSpellingType.DIGIT); 
        NumberSpellingType.ROMAN = new NumberSpellingType(2, "ROMAN");
        NumberSpellingType.mapIntToEnum.put(NumberSpellingType.ROMAN.value(), NumberSpellingType.ROMAN); 
        NumberSpellingType.mapStringToEnum.put(NumberSpellingType.ROMAN.m_str.toUpperCase(), NumberSpellingType.ROMAN); 
        NumberSpellingType.WORDS = new NumberSpellingType(3, "WORDS");
        NumberSpellingType.mapIntToEnum.put(NumberSpellingType.WORDS.value(), NumberSpellingType.WORDS); 
        NumberSpellingType.mapStringToEnum.put(NumberSpellingType.WORDS.m_str.toUpperCase(), NumberSpellingType.WORDS); 
        NumberSpellingType.AGE = new NumberSpellingType(4, "AGE");
        NumberSpellingType.mapIntToEnum.put(NumberSpellingType.AGE.value(), NumberSpellingType.AGE); 
        NumberSpellingType.mapStringToEnum.put(NumberSpellingType.AGE.m_str.toUpperCase(), NumberSpellingType.AGE); 
        NumberSpellingType.m_Values = Array.from(NumberSpellingType.mapIntToEnum.values);
        NumberSpellingType.m_Keys = Array.from(NumberSpellingType.mapIntToEnum.keys);
    }
}


NumberSpellingType.static_constructor();

module.exports = NumberSpellingType