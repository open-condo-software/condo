/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Род (мужской-средний-женский)
 * Род
 */
class MorphGender {

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
        if(val instanceof MorphGender) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphGender.mapStringToEnum.containsKey(val))
                return MorphGender.mapStringToEnum.get(val);
            return null;
        }
        if(MorphGender.mapIntToEnum.containsKey(val))
            return MorphGender.mapIntToEnum.get(val);
        let it = new MorphGender(val, val.toString());
        MorphGender.mapIntToEnum.put(val, it);
        MorphGender.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphGender.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphGender.m_Values;
    }
    static static_constructor() {
        MorphGender.mapIntToEnum = new Hashtable();
        MorphGender.mapStringToEnum = new Hashtable();
        MorphGender.UNDEFINED = new MorphGender(0, "UNDEFINED");
        MorphGender.mapIntToEnum.put(MorphGender.UNDEFINED.value(), MorphGender.UNDEFINED); 
        MorphGender.mapStringToEnum.put(MorphGender.UNDEFINED.m_str.toUpperCase(), MorphGender.UNDEFINED); 
        MorphGender.MASCULINE = new MorphGender(1, "MASCULINE");
        MorphGender.mapIntToEnum.put(MorphGender.MASCULINE.value(), MorphGender.MASCULINE); 
        MorphGender.mapStringToEnum.put(MorphGender.MASCULINE.m_str.toUpperCase(), MorphGender.MASCULINE); 
        MorphGender.FEMINIE = new MorphGender(2, "FEMINIE");
        MorphGender.mapIntToEnum.put(MorphGender.FEMINIE.value(), MorphGender.FEMINIE); 
        MorphGender.mapStringToEnum.put(MorphGender.FEMINIE.m_str.toUpperCase(), MorphGender.FEMINIE); 
        MorphGender.NEUTER = new MorphGender(4, "NEUTER");
        MorphGender.mapIntToEnum.put(MorphGender.NEUTER.value(), MorphGender.NEUTER); 
        MorphGender.mapStringToEnum.put(MorphGender.NEUTER.m_str.toUpperCase(), MorphGender.NEUTER); 
        MorphGender.m_Values = Array.from(MorphGender.mapIntToEnum.values);
        MorphGender.m_Keys = Array.from(MorphGender.mapIntToEnum.keys);
    }
}


MorphGender.static_constructor();

module.exports = MorphGender