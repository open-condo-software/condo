/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип элемента модели управления
 */
class ControlModelItemType {

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
        if(val instanceof ControlModelItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(ControlModelItemType.mapStringToEnum.containsKey(val))
                return ControlModelItemType.mapStringToEnum.get(val);
            return null;
        }
        if(ControlModelItemType.mapIntToEnum.containsKey(val))
            return ControlModelItemType.mapIntToEnum.get(val);
        let it = new ControlModelItemType(val, val.toString());
        ControlModelItemType.mapIntToEnum.put(val, it);
        ControlModelItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return ControlModelItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return ControlModelItemType.m_Values;
    }
    static static_constructor() {
        ControlModelItemType.mapIntToEnum = new Hashtable();
        ControlModelItemType.mapStringToEnum = new Hashtable();
        ControlModelItemType.UNDEFINED = new ControlModelItemType(0, "UNDEFINED");
        ControlModelItemType.mapIntToEnum.put(ControlModelItemType.UNDEFINED.value(), ControlModelItemType.UNDEFINED); 
        ControlModelItemType.mapStringToEnum.put(ControlModelItemType.UNDEFINED.m_str.toUpperCase(), ControlModelItemType.UNDEFINED); 
        ControlModelItemType.WORD = new ControlModelItemType(1, "WORD");
        ControlModelItemType.mapIntToEnum.put(ControlModelItemType.WORD.value(), ControlModelItemType.WORD); 
        ControlModelItemType.mapStringToEnum.put(ControlModelItemType.WORD.m_str.toUpperCase(), ControlModelItemType.WORD); 
        ControlModelItemType.VERB = new ControlModelItemType(2, "VERB");
        ControlModelItemType.mapIntToEnum.put(ControlModelItemType.VERB.value(), ControlModelItemType.VERB); 
        ControlModelItemType.mapStringToEnum.put(ControlModelItemType.VERB.m_str.toUpperCase(), ControlModelItemType.VERB); 
        ControlModelItemType.REFLEXIVE = new ControlModelItemType(3, "REFLEXIVE");
        ControlModelItemType.mapIntToEnum.put(ControlModelItemType.REFLEXIVE.value(), ControlModelItemType.REFLEXIVE); 
        ControlModelItemType.mapStringToEnum.put(ControlModelItemType.REFLEXIVE.m_str.toUpperCase(), ControlModelItemType.REFLEXIVE); 
        ControlModelItemType.NOUN = new ControlModelItemType(4, "NOUN");
        ControlModelItemType.mapIntToEnum.put(ControlModelItemType.NOUN.value(), ControlModelItemType.NOUN); 
        ControlModelItemType.mapStringToEnum.put(ControlModelItemType.NOUN.m_str.toUpperCase(), ControlModelItemType.NOUN); 
        ControlModelItemType.m_Values = Array.from(ControlModelItemType.mapIntToEnum.values);
        ControlModelItemType.m_Keys = Array.from(ControlModelItemType.mapIntToEnum.keys);
    }
}


ControlModelItemType.static_constructor();

module.exports = ControlModelItemType