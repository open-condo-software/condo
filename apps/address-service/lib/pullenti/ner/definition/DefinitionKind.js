/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип тезиса
 */
class DefinitionKind {

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
        if(val instanceof DefinitionKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(DefinitionKind.mapStringToEnum.containsKey(val))
                return DefinitionKind.mapStringToEnum.get(val);
            return null;
        }
        if(DefinitionKind.mapIntToEnum.containsKey(val))
            return DefinitionKind.mapIntToEnum.get(val);
        let it = new DefinitionKind(val, val.toString());
        DefinitionKind.mapIntToEnum.put(val, it);
        DefinitionKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return DefinitionKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return DefinitionKind.m_Values;
    }
    static static_constructor() {
        DefinitionKind.mapIntToEnum = new Hashtable();
        DefinitionKind.mapStringToEnum = new Hashtable();
        DefinitionKind.UNDEFINED = new DefinitionKind(0, "UNDEFINED");
        DefinitionKind.mapIntToEnum.put(DefinitionKind.UNDEFINED.value(), DefinitionKind.UNDEFINED); 
        DefinitionKind.mapStringToEnum.put(DefinitionKind.UNDEFINED.m_str.toUpperCase(), DefinitionKind.UNDEFINED); 
        DefinitionKind.ASSERTATION = new DefinitionKind(1, "ASSERTATION");
        DefinitionKind.mapIntToEnum.put(DefinitionKind.ASSERTATION.value(), DefinitionKind.ASSERTATION); 
        DefinitionKind.mapStringToEnum.put(DefinitionKind.ASSERTATION.m_str.toUpperCase(), DefinitionKind.ASSERTATION); 
        DefinitionKind.DEFINITION = new DefinitionKind(2, "DEFINITION");
        DefinitionKind.mapIntToEnum.put(DefinitionKind.DEFINITION.value(), DefinitionKind.DEFINITION); 
        DefinitionKind.mapStringToEnum.put(DefinitionKind.DEFINITION.m_str.toUpperCase(), DefinitionKind.DEFINITION); 
        DefinitionKind.NEGATION = new DefinitionKind(3, "NEGATION");
        DefinitionKind.mapIntToEnum.put(DefinitionKind.NEGATION.value(), DefinitionKind.NEGATION); 
        DefinitionKind.mapStringToEnum.put(DefinitionKind.NEGATION.m_str.toUpperCase(), DefinitionKind.NEGATION); 
        DefinitionKind.m_Values = Array.from(DefinitionKind.mapIntToEnum.values);
        DefinitionKind.m_Keys = Array.from(DefinitionKind.mapIntToEnum.keys);
    }
}


DefinitionKind.static_constructor();

module.exports = DefinitionKind