/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Форма
 */
class MorphForm {

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
        if(val instanceof MorphForm) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MorphForm.mapStringToEnum.containsKey(val))
                return MorphForm.mapStringToEnum.get(val);
            return null;
        }
        if(MorphForm.mapIntToEnum.containsKey(val))
            return MorphForm.mapIntToEnum.get(val);
        let it = new MorphForm(val, val.toString());
        MorphForm.mapIntToEnum.put(val, it);
        MorphForm.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MorphForm.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MorphForm.m_Values;
    }
    static static_constructor() {
        MorphForm.mapIntToEnum = new Hashtable();
        MorphForm.mapStringToEnum = new Hashtable();
        MorphForm.UNDEFINED = new MorphForm(0, "UNDEFINED");
        MorphForm.mapIntToEnum.put(MorphForm.UNDEFINED.value(), MorphForm.UNDEFINED); 
        MorphForm.mapStringToEnum.put(MorphForm.UNDEFINED.m_str.toUpperCase(), MorphForm.UNDEFINED); 
        MorphForm.SHORT = new MorphForm(1, "SHORT");
        MorphForm.mapIntToEnum.put(MorphForm.SHORT.value(), MorphForm.SHORT); 
        MorphForm.mapStringToEnum.put(MorphForm.SHORT.m_str.toUpperCase(), MorphForm.SHORT); 
        MorphForm.SYNONYM = new MorphForm(2, "SYNONYM");
        MorphForm.mapIntToEnum.put(MorphForm.SYNONYM.value(), MorphForm.SYNONYM); 
        MorphForm.mapStringToEnum.put(MorphForm.SYNONYM.m_str.toUpperCase(), MorphForm.SYNONYM); 
        MorphForm.m_Values = Array.from(MorphForm.mapIntToEnum.values);
        MorphForm.m_Keys = Array.from(MorphForm.mapIntToEnum.keys);
    }
}


MorphForm.static_constructor();

module.exports = MorphForm