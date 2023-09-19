/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Число (единственное-множественное)
 * Число
 */
class MorphNumber {

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
        if(val instanceof MorphNumber) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphNumber.mapStringToEnum.containsKey(val))
                return MorphNumber.mapStringToEnum.get(val);
            return null;
        }
        if(MorphNumber.mapIntToEnum.containsKey(val))
            return MorphNumber.mapIntToEnum.get(val);
        let it = new MorphNumber(val, val.toString());
        MorphNumber.mapIntToEnum.put(val, it);
        MorphNumber.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphNumber.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphNumber.m_Values;
    }
    static static_constructor() {
        MorphNumber.mapIntToEnum = new Hashtable();
        MorphNumber.mapStringToEnum = new Hashtable();
        MorphNumber.UNDEFINED = new MorphNumber(0, "UNDEFINED");
        MorphNumber.mapIntToEnum.put(MorphNumber.UNDEFINED.value(), MorphNumber.UNDEFINED); 
        MorphNumber.mapStringToEnum.put(MorphNumber.UNDEFINED.m_str.toUpperCase(), MorphNumber.UNDEFINED); 
        MorphNumber.SINGULAR = new MorphNumber(1, "SINGULAR");
        MorphNumber.mapIntToEnum.put(MorphNumber.SINGULAR.value(), MorphNumber.SINGULAR); 
        MorphNumber.mapStringToEnum.put(MorphNumber.SINGULAR.m_str.toUpperCase(), MorphNumber.SINGULAR); 
        MorphNumber.PLURAL = new MorphNumber(2, "PLURAL");
        MorphNumber.mapIntToEnum.put(MorphNumber.PLURAL.value(), MorphNumber.PLURAL); 
        MorphNumber.mapStringToEnum.put(MorphNumber.PLURAL.m_str.toUpperCase(), MorphNumber.PLURAL); 
        MorphNumber.m_Values = Array.from(MorphNumber.mapIntToEnum.values);
        MorphNumber.m_Keys = Array.from(MorphNumber.mapIntToEnum.keys);
    }
}


MorphNumber.static_constructor();

module.exports = MorphNumber