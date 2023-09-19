/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Время (для глаголов)
 * Время
 */
class MorphTense {

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
        if(val instanceof MorphTense) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphTense.mapStringToEnum.containsKey(val))
                return MorphTense.mapStringToEnum.get(val);
            return null;
        }
        if(MorphTense.mapIntToEnum.containsKey(val))
            return MorphTense.mapIntToEnum.get(val);
        let it = new MorphTense(val, val.toString());
        MorphTense.mapIntToEnum.put(val, it);
        MorphTense.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphTense.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphTense.m_Values;
    }
    static static_constructor() {
        MorphTense.mapIntToEnum = new Hashtable();
        MorphTense.mapStringToEnum = new Hashtable();
        MorphTense.UNDEFINED = new MorphTense(0, "UNDEFINED");
        MorphTense.mapIntToEnum.put(MorphTense.UNDEFINED.value(), MorphTense.UNDEFINED); 
        MorphTense.mapStringToEnum.put(MorphTense.UNDEFINED.m_str.toUpperCase(), MorphTense.UNDEFINED); 
        MorphTense.PAST = new MorphTense(1, "PAST");
        MorphTense.mapIntToEnum.put(MorphTense.PAST.value(), MorphTense.PAST); 
        MorphTense.mapStringToEnum.put(MorphTense.PAST.m_str.toUpperCase(), MorphTense.PAST); 
        MorphTense.PRESENT = new MorphTense(2, "PRESENT");
        MorphTense.mapIntToEnum.put(MorphTense.PRESENT.value(), MorphTense.PRESENT); 
        MorphTense.mapStringToEnum.put(MorphTense.PRESENT.m_str.toUpperCase(), MorphTense.PRESENT); 
        MorphTense.FUTURE = new MorphTense(4, "FUTURE");
        MorphTense.mapIntToEnum.put(MorphTense.FUTURE.value(), MorphTense.FUTURE); 
        MorphTense.mapStringToEnum.put(MorphTense.FUTURE.m_str.toUpperCase(), MorphTense.FUTURE); 
        MorphTense.m_Values = Array.from(MorphTense.mapIntToEnum.values);
        MorphTense.m_Keys = Array.from(MorphTense.mapIntToEnum.keys);
    }
}


MorphTense.static_constructor();

module.exports = MorphTense