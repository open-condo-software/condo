/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Аспект (для глаголов)
 * Аспект
 */
class MorphAspect {

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
        if(val instanceof MorphAspect) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphAspect.mapStringToEnum.containsKey(val))
                return MorphAspect.mapStringToEnum.get(val);
            return null;
        }
        if(MorphAspect.mapIntToEnum.containsKey(val))
            return MorphAspect.mapIntToEnum.get(val);
        let it = new MorphAspect(val, val.toString());
        MorphAspect.mapIntToEnum.put(val, it);
        MorphAspect.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphAspect.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphAspect.m_Values;
    }
    static static_constructor() {
        MorphAspect.mapIntToEnum = new Hashtable();
        MorphAspect.mapStringToEnum = new Hashtable();
        MorphAspect.UNDEFINED = new MorphAspect(0, "UNDEFINED");
        MorphAspect.mapIntToEnum.put(MorphAspect.UNDEFINED.value(), MorphAspect.UNDEFINED); 
        MorphAspect.mapStringToEnum.put(MorphAspect.UNDEFINED.m_str.toUpperCase(), MorphAspect.UNDEFINED); 
        MorphAspect.PERFECTIVE = new MorphAspect(1, "PERFECTIVE");
        MorphAspect.mapIntToEnum.put(MorphAspect.PERFECTIVE.value(), MorphAspect.PERFECTIVE); 
        MorphAspect.mapStringToEnum.put(MorphAspect.PERFECTIVE.m_str.toUpperCase(), MorphAspect.PERFECTIVE); 
        MorphAspect.IMPERFECTIVE = new MorphAspect(2, "IMPERFECTIVE");
        MorphAspect.mapIntToEnum.put(MorphAspect.IMPERFECTIVE.value(), MorphAspect.IMPERFECTIVE); 
        MorphAspect.mapStringToEnum.put(MorphAspect.IMPERFECTIVE.m_str.toUpperCase(), MorphAspect.IMPERFECTIVE); 
        MorphAspect.m_Values = Array.from(MorphAspect.mapIntToEnum.values);
        MorphAspect.m_Keys = Array.from(MorphAspect.mapIntToEnum.keys);
    }
}


MorphAspect.static_constructor();

module.exports = MorphAspect