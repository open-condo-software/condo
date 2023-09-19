/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class WeaponItemTokenTyps {

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
        if(val instanceof WeaponItemTokenTyps) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(WeaponItemTokenTyps.mapStringToEnum.containsKey(val))
                return WeaponItemTokenTyps.mapStringToEnum.get(val);
            return null;
        }
        if(WeaponItemTokenTyps.mapIntToEnum.containsKey(val))
            return WeaponItemTokenTyps.mapIntToEnum.get(val);
        let it = new WeaponItemTokenTyps(val, val.toString());
        WeaponItemTokenTyps.mapIntToEnum.put(val, it);
        WeaponItemTokenTyps.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return WeaponItemTokenTyps.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return WeaponItemTokenTyps.m_Values;
    }
    static static_constructor() {
        WeaponItemTokenTyps.mapIntToEnum = new Hashtable();
        WeaponItemTokenTyps.mapStringToEnum = new Hashtable();
        WeaponItemTokenTyps.NOUN = new WeaponItemTokenTyps(0, "NOUN");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.NOUN.value(), WeaponItemTokenTyps.NOUN); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.NOUN.m_str.toUpperCase(), WeaponItemTokenTyps.NOUN); 
        WeaponItemTokenTyps.BRAND = new WeaponItemTokenTyps(1, "BRAND");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.BRAND.value(), WeaponItemTokenTyps.BRAND); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.BRAND.m_str.toUpperCase(), WeaponItemTokenTyps.BRAND); 
        WeaponItemTokenTyps.MODEL = new WeaponItemTokenTyps(2, "MODEL");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.MODEL.value(), WeaponItemTokenTyps.MODEL); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.MODEL.m_str.toUpperCase(), WeaponItemTokenTyps.MODEL); 
        WeaponItemTokenTyps.NUMBER = new WeaponItemTokenTyps(3, "NUMBER");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.NUMBER.value(), WeaponItemTokenTyps.NUMBER); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.NUMBER.m_str.toUpperCase(), WeaponItemTokenTyps.NUMBER); 
        WeaponItemTokenTyps.NAME = new WeaponItemTokenTyps(4, "NAME");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.NAME.value(), WeaponItemTokenTyps.NAME); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.NAME.m_str.toUpperCase(), WeaponItemTokenTyps.NAME); 
        WeaponItemTokenTyps.CLASS = new WeaponItemTokenTyps(5, "CLASS");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.CLASS.value(), WeaponItemTokenTyps.CLASS); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.CLASS.m_str.toUpperCase(), WeaponItemTokenTyps.CLASS); 
        WeaponItemTokenTyps.DATE = new WeaponItemTokenTyps(6, "DATE");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.DATE.value(), WeaponItemTokenTyps.DATE); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.DATE.m_str.toUpperCase(), WeaponItemTokenTyps.DATE); 
        WeaponItemTokenTyps.CALIBER = new WeaponItemTokenTyps(7, "CALIBER");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.CALIBER.value(), WeaponItemTokenTyps.CALIBER); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.CALIBER.m_str.toUpperCase(), WeaponItemTokenTyps.CALIBER); 
        WeaponItemTokenTyps.DEVELOPER = new WeaponItemTokenTyps(8, "DEVELOPER");
        WeaponItemTokenTyps.mapIntToEnum.put(WeaponItemTokenTyps.DEVELOPER.value(), WeaponItemTokenTyps.DEVELOPER); 
        WeaponItemTokenTyps.mapStringToEnum.put(WeaponItemTokenTyps.DEVELOPER.m_str.toUpperCase(), WeaponItemTokenTyps.DEVELOPER); 
        WeaponItemTokenTyps.m_Values = Array.from(WeaponItemTokenTyps.mapIntToEnum.values);
        WeaponItemTokenTyps.m_Keys = Array.from(WeaponItemTokenTyps.mapIntToEnum.keys);
    }
}


WeaponItemTokenTyps.static_constructor();

module.exports = WeaponItemTokenTyps