/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class PhoneItemTokenPhoneItemType {

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
        if(val instanceof PhoneItemTokenPhoneItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PhoneItemTokenPhoneItemType.mapStringToEnum.containsKey(val))
                return PhoneItemTokenPhoneItemType.mapStringToEnum.get(val);
            return null;
        }
        if(PhoneItemTokenPhoneItemType.mapIntToEnum.containsKey(val))
            return PhoneItemTokenPhoneItemType.mapIntToEnum.get(val);
        let it = new PhoneItemTokenPhoneItemType(val, val.toString());
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(val, it);
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PhoneItemTokenPhoneItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PhoneItemTokenPhoneItemType.m_Values;
    }
    static static_constructor() {
        PhoneItemTokenPhoneItemType.mapIntToEnum = new Hashtable();
        PhoneItemTokenPhoneItemType.mapStringToEnum = new Hashtable();
        PhoneItemTokenPhoneItemType.NUMBER = new PhoneItemTokenPhoneItemType(0, "NUMBER");
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(PhoneItemTokenPhoneItemType.NUMBER.value(), PhoneItemTokenPhoneItemType.NUMBER); 
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(PhoneItemTokenPhoneItemType.NUMBER.m_str.toUpperCase(), PhoneItemTokenPhoneItemType.NUMBER); 
        PhoneItemTokenPhoneItemType.CITYCODE = new PhoneItemTokenPhoneItemType(1, "CITYCODE");
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(PhoneItemTokenPhoneItemType.CITYCODE.value(), PhoneItemTokenPhoneItemType.CITYCODE); 
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(PhoneItemTokenPhoneItemType.CITYCODE.m_str.toUpperCase(), PhoneItemTokenPhoneItemType.CITYCODE); 
        PhoneItemTokenPhoneItemType.DELIM = new PhoneItemTokenPhoneItemType(2, "DELIM");
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(PhoneItemTokenPhoneItemType.DELIM.value(), PhoneItemTokenPhoneItemType.DELIM); 
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(PhoneItemTokenPhoneItemType.DELIM.m_str.toUpperCase(), PhoneItemTokenPhoneItemType.DELIM); 
        PhoneItemTokenPhoneItemType.PREFIX = new PhoneItemTokenPhoneItemType(3, "PREFIX");
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(PhoneItemTokenPhoneItemType.PREFIX.value(), PhoneItemTokenPhoneItemType.PREFIX); 
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(PhoneItemTokenPhoneItemType.PREFIX.m_str.toUpperCase(), PhoneItemTokenPhoneItemType.PREFIX); 
        PhoneItemTokenPhoneItemType.ADDNUMBER = new PhoneItemTokenPhoneItemType(4, "ADDNUMBER");
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(PhoneItemTokenPhoneItemType.ADDNUMBER.value(), PhoneItemTokenPhoneItemType.ADDNUMBER); 
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(PhoneItemTokenPhoneItemType.ADDNUMBER.m_str.toUpperCase(), PhoneItemTokenPhoneItemType.ADDNUMBER); 
        PhoneItemTokenPhoneItemType.COUNTRYCODE = new PhoneItemTokenPhoneItemType(5, "COUNTRYCODE");
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(PhoneItemTokenPhoneItemType.COUNTRYCODE.value(), PhoneItemTokenPhoneItemType.COUNTRYCODE); 
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(PhoneItemTokenPhoneItemType.COUNTRYCODE.m_str.toUpperCase(), PhoneItemTokenPhoneItemType.COUNTRYCODE); 
        PhoneItemTokenPhoneItemType.ALT = new PhoneItemTokenPhoneItemType(6, "ALT");
        PhoneItemTokenPhoneItemType.mapIntToEnum.put(PhoneItemTokenPhoneItemType.ALT.value(), PhoneItemTokenPhoneItemType.ALT); 
        PhoneItemTokenPhoneItemType.mapStringToEnum.put(PhoneItemTokenPhoneItemType.ALT.m_str.toUpperCase(), PhoneItemTokenPhoneItemType.ALT); 
        PhoneItemTokenPhoneItemType.m_Values = Array.from(PhoneItemTokenPhoneItemType.mapIntToEnum.values);
        PhoneItemTokenPhoneItemType.m_Keys = Array.from(PhoneItemTokenPhoneItemType.mapIntToEnum.keys);
    }
}


PhoneItemTokenPhoneItemType.static_constructor();

module.exports = PhoneItemTokenPhoneItemType