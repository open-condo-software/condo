/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип телефонного номера
 */
class PhoneKind {

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
        if(val instanceof PhoneKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PhoneKind.mapStringToEnum.containsKey(val))
                return PhoneKind.mapStringToEnum.get(val);
            return null;
        }
        if(PhoneKind.mapIntToEnum.containsKey(val))
            return PhoneKind.mapIntToEnum.get(val);
        let it = new PhoneKind(val, val.toString());
        PhoneKind.mapIntToEnum.put(val, it);
        PhoneKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PhoneKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PhoneKind.m_Values;
    }
    static static_constructor() {
        PhoneKind.mapIntToEnum = new Hashtable();
        PhoneKind.mapStringToEnum = new Hashtable();
        PhoneKind.UNDEFINED = new PhoneKind(0, "UNDEFINED");
        PhoneKind.mapIntToEnum.put(PhoneKind.UNDEFINED.value(), PhoneKind.UNDEFINED); 
        PhoneKind.mapStringToEnum.put(PhoneKind.UNDEFINED.m_str.toUpperCase(), PhoneKind.UNDEFINED); 
        PhoneKind.HOME = new PhoneKind(1, "HOME");
        PhoneKind.mapIntToEnum.put(PhoneKind.HOME.value(), PhoneKind.HOME); 
        PhoneKind.mapStringToEnum.put(PhoneKind.HOME.m_str.toUpperCase(), PhoneKind.HOME); 
        PhoneKind.MOBILE = new PhoneKind(2, "MOBILE");
        PhoneKind.mapIntToEnum.put(PhoneKind.MOBILE.value(), PhoneKind.MOBILE); 
        PhoneKind.mapStringToEnum.put(PhoneKind.MOBILE.m_str.toUpperCase(), PhoneKind.MOBILE); 
        PhoneKind.WORK = new PhoneKind(3, "WORK");
        PhoneKind.mapIntToEnum.put(PhoneKind.WORK.value(), PhoneKind.WORK); 
        PhoneKind.mapStringToEnum.put(PhoneKind.WORK.m_str.toUpperCase(), PhoneKind.WORK); 
        PhoneKind.FAX = new PhoneKind(4, "FAX");
        PhoneKind.mapIntToEnum.put(PhoneKind.FAX.value(), PhoneKind.FAX); 
        PhoneKind.mapStringToEnum.put(PhoneKind.FAX.m_str.toUpperCase(), PhoneKind.FAX); 
        PhoneKind.m_Values = Array.from(PhoneKind.mapIntToEnum.values);
        PhoneKind.m_Keys = Array.from(PhoneKind.mapIntToEnum.keys);
    }
}


PhoneKind.static_constructor();

module.exports = PhoneKind