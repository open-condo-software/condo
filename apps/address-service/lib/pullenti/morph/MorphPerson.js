/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Лицо (1, 2, 3)
 * Лицо
 */
class MorphPerson {

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
        if(val instanceof MorphPerson) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphPerson.mapStringToEnum.containsKey(val))
                return MorphPerson.mapStringToEnum.get(val);
            return null;
        }
        if(MorphPerson.mapIntToEnum.containsKey(val))
            return MorphPerson.mapIntToEnum.get(val);
        let it = new MorphPerson(val, val.toString());
        MorphPerson.mapIntToEnum.put(val, it);
        MorphPerson.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphPerson.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphPerson.m_Values;
    }
    static static_constructor() {
        MorphPerson.mapIntToEnum = new Hashtable();
        MorphPerson.mapStringToEnum = new Hashtable();
        MorphPerson.UNDEFINED = new MorphPerson(0, "UNDEFINED");
        MorphPerson.mapIntToEnum.put(MorphPerson.UNDEFINED.value(), MorphPerson.UNDEFINED); 
        MorphPerson.mapStringToEnum.put(MorphPerson.UNDEFINED.m_str.toUpperCase(), MorphPerson.UNDEFINED); 
        MorphPerson.FIRST = new MorphPerson(1, "FIRST");
        MorphPerson.mapIntToEnum.put(MorphPerson.FIRST.value(), MorphPerson.FIRST); 
        MorphPerson.mapStringToEnum.put(MorphPerson.FIRST.m_str.toUpperCase(), MorphPerson.FIRST); 
        MorphPerson.SECOND = new MorphPerson(2, "SECOND");
        MorphPerson.mapIntToEnum.put(MorphPerson.SECOND.value(), MorphPerson.SECOND); 
        MorphPerson.mapStringToEnum.put(MorphPerson.SECOND.m_str.toUpperCase(), MorphPerson.SECOND); 
        MorphPerson.THIRD = new MorphPerson(4, "THIRD");
        MorphPerson.mapIntToEnum.put(MorphPerson.THIRD.value(), MorphPerson.THIRD); 
        MorphPerson.mapStringToEnum.put(MorphPerson.THIRD.m_str.toUpperCase(), MorphPerson.THIRD); 
        MorphPerson.m_Values = Array.from(MorphPerson.mapIntToEnum.values);
        MorphPerson.m_Keys = Array.from(MorphPerson.mapIntToEnum.keys);
    }
}


MorphPerson.static_constructor();

module.exports = MorphPerson