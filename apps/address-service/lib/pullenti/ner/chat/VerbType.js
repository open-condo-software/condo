/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип глагольной формы
 */
class VerbType {

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
        if(val instanceof VerbType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(VerbType.mapStringToEnum.containsKey(val))
                return VerbType.mapStringToEnum.get(val);
            return null;
        }
        if(VerbType.mapIntToEnum.containsKey(val))
            return VerbType.mapIntToEnum.get(val);
        let it = new VerbType(val, val.toString());
        VerbType.mapIntToEnum.put(val, it);
        VerbType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return VerbType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return VerbType.m_Values;
    }
    static static_constructor() {
        VerbType.mapIntToEnum = new Hashtable();
        VerbType.mapStringToEnum = new Hashtable();
        VerbType.UNDEFINED = new VerbType(0, "UNDEFINED");
        VerbType.mapIntToEnum.put(VerbType.UNDEFINED.value(), VerbType.UNDEFINED); 
        VerbType.mapStringToEnum.put(VerbType.UNDEFINED.m_str.toUpperCase(), VerbType.UNDEFINED); 
        VerbType.BE = new VerbType(1, "BE");
        VerbType.mapIntToEnum.put(VerbType.BE.value(), VerbType.BE); 
        VerbType.mapStringToEnum.put(VerbType.BE.m_str.toUpperCase(), VerbType.BE); 
        VerbType.HAVE = new VerbType(2, "HAVE");
        VerbType.mapIntToEnum.put(VerbType.HAVE.value(), VerbType.HAVE); 
        VerbType.mapStringToEnum.put(VerbType.HAVE.m_str.toUpperCase(), VerbType.HAVE); 
        VerbType.CAN = new VerbType(3, "CAN");
        VerbType.mapIntToEnum.put(VerbType.CAN.value(), VerbType.CAN); 
        VerbType.mapStringToEnum.put(VerbType.CAN.m_str.toUpperCase(), VerbType.CAN); 
        VerbType.MUST = new VerbType(4, "MUST");
        VerbType.mapIntToEnum.put(VerbType.MUST.value(), VerbType.MUST); 
        VerbType.mapStringToEnum.put(VerbType.MUST.m_str.toUpperCase(), VerbType.MUST); 
        VerbType.SAY = new VerbType(5, "SAY");
        VerbType.mapIntToEnum.put(VerbType.SAY.value(), VerbType.SAY); 
        VerbType.mapStringToEnum.put(VerbType.SAY.m_str.toUpperCase(), VerbType.SAY); 
        VerbType.CALL = new VerbType(6, "CALL");
        VerbType.mapIntToEnum.put(VerbType.CALL.value(), VerbType.CALL); 
        VerbType.mapStringToEnum.put(VerbType.CALL.m_str.toUpperCase(), VerbType.CALL); 
        VerbType.m_Values = Array.from(VerbType.mapIntToEnum.values);
        VerbType.m_Keys = Array.from(VerbType.mapIntToEnum.keys);
    }
}


VerbType.static_constructor();

module.exports = VerbType