/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Для английских глаголов
 * 
 */
class MorphFinite {

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
        if(val instanceof MorphFinite) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphFinite.mapStringToEnum.containsKey(val))
                return MorphFinite.mapStringToEnum.get(val);
            return null;
        }
        if(MorphFinite.mapIntToEnum.containsKey(val))
            return MorphFinite.mapIntToEnum.get(val);
        let it = new MorphFinite(val, val.toString());
        MorphFinite.mapIntToEnum.put(val, it);
        MorphFinite.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphFinite.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphFinite.m_Values;
    }
    static static_constructor() {
        MorphFinite.mapIntToEnum = new Hashtable();
        MorphFinite.mapStringToEnum = new Hashtable();
        MorphFinite.UNDEFINED = new MorphFinite(0, "UNDEFINED");
        MorphFinite.mapIntToEnum.put(MorphFinite.UNDEFINED.value(), MorphFinite.UNDEFINED); 
        MorphFinite.mapStringToEnum.put(MorphFinite.UNDEFINED.m_str.toUpperCase(), MorphFinite.UNDEFINED); 
        MorphFinite.FINITE = new MorphFinite(1, "FINITE");
        MorphFinite.mapIntToEnum.put(MorphFinite.FINITE.value(), MorphFinite.FINITE); 
        MorphFinite.mapStringToEnum.put(MorphFinite.FINITE.m_str.toUpperCase(), MorphFinite.FINITE); 
        MorphFinite.INFINITIVE = new MorphFinite(2, "INFINITIVE");
        MorphFinite.mapIntToEnum.put(MorphFinite.INFINITIVE.value(), MorphFinite.INFINITIVE); 
        MorphFinite.mapStringToEnum.put(MorphFinite.INFINITIVE.m_str.toUpperCase(), MorphFinite.INFINITIVE); 
        MorphFinite.PARTICIPLE = new MorphFinite(4, "PARTICIPLE");
        MorphFinite.mapIntToEnum.put(MorphFinite.PARTICIPLE.value(), MorphFinite.PARTICIPLE); 
        MorphFinite.mapStringToEnum.put(MorphFinite.PARTICIPLE.m_str.toUpperCase(), MorphFinite.PARTICIPLE); 
        MorphFinite.GERUND = new MorphFinite(8, "GERUND");
        MorphFinite.mapIntToEnum.put(MorphFinite.GERUND.value(), MorphFinite.GERUND); 
        MorphFinite.mapStringToEnum.put(MorphFinite.GERUND.m_str.toUpperCase(), MorphFinite.GERUND); 
        MorphFinite.m_Values = Array.from(MorphFinite.mapIntToEnum.values);
        MorphFinite.m_Keys = Array.from(MorphFinite.mapIntToEnum.keys);
    }
}


MorphFinite.static_constructor();

module.exports = MorphFinite