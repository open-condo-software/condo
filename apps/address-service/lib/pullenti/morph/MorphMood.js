/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Наклонение (для глаголов)
 * Наклонение
 */
class MorphMood {

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
        if(val instanceof MorphMood) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphMood.mapStringToEnum.containsKey(val))
                return MorphMood.mapStringToEnum.get(val);
            return null;
        }
        if(MorphMood.mapIntToEnum.containsKey(val))
            return MorphMood.mapIntToEnum.get(val);
        let it = new MorphMood(val, val.toString());
        MorphMood.mapIntToEnum.put(val, it);
        MorphMood.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphMood.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphMood.m_Values;
    }
    static static_constructor() {
        MorphMood.mapIntToEnum = new Hashtable();
        MorphMood.mapStringToEnum = new Hashtable();
        MorphMood.UNDEFINED = new MorphMood(0, "UNDEFINED");
        MorphMood.mapIntToEnum.put(MorphMood.UNDEFINED.value(), MorphMood.UNDEFINED); 
        MorphMood.mapStringToEnum.put(MorphMood.UNDEFINED.m_str.toUpperCase(), MorphMood.UNDEFINED); 
        MorphMood.INDICATIVE = new MorphMood(1, "INDICATIVE");
        MorphMood.mapIntToEnum.put(MorphMood.INDICATIVE.value(), MorphMood.INDICATIVE); 
        MorphMood.mapStringToEnum.put(MorphMood.INDICATIVE.m_str.toUpperCase(), MorphMood.INDICATIVE); 
        MorphMood.SUBJUNCTIVE = new MorphMood(2, "SUBJUNCTIVE");
        MorphMood.mapIntToEnum.put(MorphMood.SUBJUNCTIVE.value(), MorphMood.SUBJUNCTIVE); 
        MorphMood.mapStringToEnum.put(MorphMood.SUBJUNCTIVE.m_str.toUpperCase(), MorphMood.SUBJUNCTIVE); 
        MorphMood.IMPERATIVE = new MorphMood(4, "IMPERATIVE");
        MorphMood.mapIntToEnum.put(MorphMood.IMPERATIVE.value(), MorphMood.IMPERATIVE); 
        MorphMood.mapStringToEnum.put(MorphMood.IMPERATIVE.m_str.toUpperCase(), MorphMood.IMPERATIVE); 
        MorphMood.m_Values = Array.from(MorphMood.mapIntToEnum.values);
        MorphMood.m_Keys = Array.from(MorphMood.mapIntToEnum.keys);
    }
}


MorphMood.static_constructor();

module.exports = MorphMood