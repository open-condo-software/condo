/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Семантические роли
 */
class SemanticRole {

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
        if(val instanceof SemanticRole) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(SemanticRole.mapStringToEnum.containsKey(val))
                return SemanticRole.mapStringToEnum.get(val);
            return null;
        }
        if(SemanticRole.mapIntToEnum.containsKey(val))
            return SemanticRole.mapIntToEnum.get(val);
        let it = new SemanticRole(val, val.toString());
        SemanticRole.mapIntToEnum.put(val, it);
        SemanticRole.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return SemanticRole.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return SemanticRole.m_Values;
    }
    static static_constructor() {
        SemanticRole.mapIntToEnum = new Hashtable();
        SemanticRole.mapStringToEnum = new Hashtable();
        SemanticRole.COMMON = new SemanticRole(0, "COMMON");
        SemanticRole.mapIntToEnum.put(SemanticRole.COMMON.value(), SemanticRole.COMMON); 
        SemanticRole.mapStringToEnum.put(SemanticRole.COMMON.m_str.toUpperCase(), SemanticRole.COMMON); 
        SemanticRole.AGENT = new SemanticRole(1, "AGENT");
        SemanticRole.mapIntToEnum.put(SemanticRole.AGENT.value(), SemanticRole.AGENT); 
        SemanticRole.mapStringToEnum.put(SemanticRole.AGENT.m_str.toUpperCase(), SemanticRole.AGENT); 
        SemanticRole.PACIENT = new SemanticRole(2, "PACIENT");
        SemanticRole.mapIntToEnum.put(SemanticRole.PACIENT.value(), SemanticRole.PACIENT); 
        SemanticRole.mapStringToEnum.put(SemanticRole.PACIENT.m_str.toUpperCase(), SemanticRole.PACIENT); 
        SemanticRole.STRONG = new SemanticRole(3, "STRONG");
        SemanticRole.mapIntToEnum.put(SemanticRole.STRONG.value(), SemanticRole.STRONG); 
        SemanticRole.mapStringToEnum.put(SemanticRole.STRONG.m_str.toUpperCase(), SemanticRole.STRONG); 
        SemanticRole.m_Values = Array.from(SemanticRole.mapIntToEnum.values);
        SemanticRole.m_Keys = Array.from(SemanticRole.mapIntToEnum.keys);
    }
}


SemanticRole.static_constructor();

module.exports = SemanticRole