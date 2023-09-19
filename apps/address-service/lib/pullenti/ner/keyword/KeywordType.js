/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип ключевой комбинации
 */
class KeywordType {

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
        if(val instanceof KeywordType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(KeywordType.mapStringToEnum.containsKey(val))
                return KeywordType.mapStringToEnum.get(val);
            return null;
        }
        if(KeywordType.mapIntToEnum.containsKey(val))
            return KeywordType.mapIntToEnum.get(val);
        let it = new KeywordType(val, val.toString());
        KeywordType.mapIntToEnum.put(val, it);
        KeywordType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return KeywordType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return KeywordType.m_Values;
    }
    static static_constructor() {
        KeywordType.mapIntToEnum = new Hashtable();
        KeywordType.mapStringToEnum = new Hashtable();
        KeywordType.UNDEFINED = new KeywordType(0, "UNDEFINED");
        KeywordType.mapIntToEnum.put(KeywordType.UNDEFINED.value(), KeywordType.UNDEFINED); 
        KeywordType.mapStringToEnum.put(KeywordType.UNDEFINED.m_str.toUpperCase(), KeywordType.UNDEFINED); 
        KeywordType.OBJECT = new KeywordType(1, "OBJECT");
        KeywordType.mapIntToEnum.put(KeywordType.OBJECT.value(), KeywordType.OBJECT); 
        KeywordType.mapStringToEnum.put(KeywordType.OBJECT.m_str.toUpperCase(), KeywordType.OBJECT); 
        KeywordType.REFERENT = new KeywordType(2, "REFERENT");
        KeywordType.mapIntToEnum.put(KeywordType.REFERENT.value(), KeywordType.REFERENT); 
        KeywordType.mapStringToEnum.put(KeywordType.REFERENT.m_str.toUpperCase(), KeywordType.REFERENT); 
        KeywordType.PREDICATE = new KeywordType(3, "PREDICATE");
        KeywordType.mapIntToEnum.put(KeywordType.PREDICATE.value(), KeywordType.PREDICATE); 
        KeywordType.mapStringToEnum.put(KeywordType.PREDICATE.m_str.toUpperCase(), KeywordType.PREDICATE); 
        KeywordType.ANNOTATION = new KeywordType(4, "ANNOTATION");
        KeywordType.mapIntToEnum.put(KeywordType.ANNOTATION.value(), KeywordType.ANNOTATION); 
        KeywordType.mapStringToEnum.put(KeywordType.ANNOTATION.m_str.toUpperCase(), KeywordType.ANNOTATION); 
        KeywordType.m_Values = Array.from(KeywordType.mapIntToEnum.values);
        KeywordType.m_Keys = Array.from(KeywordType.mapIntToEnum.keys);
    }
}


KeywordType.static_constructor();

module.exports = KeywordType