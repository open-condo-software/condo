/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Типы союзов и служебных слов
 */
class ConjunctionType {

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
        if(val instanceof ConjunctionType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(ConjunctionType.mapStringToEnum.containsKey(val))
                return ConjunctionType.mapStringToEnum.get(val);
            return null;
        }
        if(ConjunctionType.mapIntToEnum.containsKey(val))
            return ConjunctionType.mapIntToEnum.get(val);
        let it = new ConjunctionType(val, val.toString());
        ConjunctionType.mapIntToEnum.put(val, it);
        ConjunctionType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return ConjunctionType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return ConjunctionType.m_Values;
    }
    static static_constructor() {
        ConjunctionType.mapIntToEnum = new Hashtable();
        ConjunctionType.mapStringToEnum = new Hashtable();
        ConjunctionType.UNDEFINED = new ConjunctionType(0, "UNDEFINED");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.UNDEFINED.value(), ConjunctionType.UNDEFINED); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.UNDEFINED.m_str.toUpperCase(), ConjunctionType.UNDEFINED); 
        ConjunctionType.COMMA = new ConjunctionType(1, "COMMA");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.COMMA.value(), ConjunctionType.COMMA); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.COMMA.m_str.toUpperCase(), ConjunctionType.COMMA); 
        ConjunctionType.AND = new ConjunctionType(2, "AND");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.AND.value(), ConjunctionType.AND); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.AND.m_str.toUpperCase(), ConjunctionType.AND); 
        ConjunctionType.OR = new ConjunctionType(3, "OR");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.OR.value(), ConjunctionType.OR); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.OR.m_str.toUpperCase(), ConjunctionType.OR); 
        ConjunctionType.NOT = new ConjunctionType(4, "NOT");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.NOT.value(), ConjunctionType.NOT); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.NOT.m_str.toUpperCase(), ConjunctionType.NOT); 
        ConjunctionType.BUT = new ConjunctionType(5, "BUT");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.BUT.value(), ConjunctionType.BUT); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.BUT.m_str.toUpperCase(), ConjunctionType.BUT); 
        ConjunctionType.IF = new ConjunctionType(6, "IF");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.IF.value(), ConjunctionType.IF); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.IF.m_str.toUpperCase(), ConjunctionType.IF); 
        ConjunctionType.THEN = new ConjunctionType(7, "THEN");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.THEN.value(), ConjunctionType.THEN); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.THEN.m_str.toUpperCase(), ConjunctionType.THEN); 
        ConjunctionType.ELSE = new ConjunctionType(8, "ELSE");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.ELSE.value(), ConjunctionType.ELSE); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.ELSE.m_str.toUpperCase(), ConjunctionType.ELSE); 
        ConjunctionType.WHEN = new ConjunctionType(9, "WHEN");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.WHEN.value(), ConjunctionType.WHEN); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.WHEN.m_str.toUpperCase(), ConjunctionType.WHEN); 
        ConjunctionType.BECAUSE = new ConjunctionType(10, "BECAUSE");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.BECAUSE.value(), ConjunctionType.BECAUSE); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.BECAUSE.m_str.toUpperCase(), ConjunctionType.BECAUSE); 
        ConjunctionType.INCLUDE = new ConjunctionType(11, "INCLUDE");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.INCLUDE.value(), ConjunctionType.INCLUDE); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.INCLUDE.m_str.toUpperCase(), ConjunctionType.INCLUDE); 
        ConjunctionType.EXCEPT = new ConjunctionType(12, "EXCEPT");
        ConjunctionType.mapIntToEnum.put(ConjunctionType.EXCEPT.value(), ConjunctionType.EXCEPT); 
        ConjunctionType.mapStringToEnum.put(ConjunctionType.EXCEPT.m_str.toUpperCase(), ConjunctionType.EXCEPT); 
        ConjunctionType.m_Values = Array.from(ConjunctionType.mapIntToEnum.values);
        ConjunctionType.m_Keys = Array.from(ConjunctionType.mapIntToEnum.keys);
    }
}


ConjunctionType.static_constructor();

module.exports = ConjunctionType