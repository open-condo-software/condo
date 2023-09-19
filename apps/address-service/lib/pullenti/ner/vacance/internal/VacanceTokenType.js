/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class VacanceTokenType {

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
        if(val instanceof VacanceTokenType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(VacanceTokenType.mapStringToEnum.containsKey(val))
                return VacanceTokenType.mapStringToEnum.get(val);
            return null;
        }
        if(VacanceTokenType.mapIntToEnum.containsKey(val))
            return VacanceTokenType.mapIntToEnum.get(val);
        let it = new VacanceTokenType(val, val.toString());
        VacanceTokenType.mapIntToEnum.put(val, it);
        VacanceTokenType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return VacanceTokenType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return VacanceTokenType.m_Values;
    }
    static static_constructor() {
        VacanceTokenType.mapIntToEnum = new Hashtable();
        VacanceTokenType.mapStringToEnum = new Hashtable();
        VacanceTokenType.UNDEFINED = new VacanceTokenType(0, "UNDEFINED");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.UNDEFINED.value(), VacanceTokenType.UNDEFINED); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.UNDEFINED.m_str.toUpperCase(), VacanceTokenType.UNDEFINED); 
        VacanceTokenType.DUMMY = new VacanceTokenType(1, "DUMMY");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.DUMMY.value(), VacanceTokenType.DUMMY); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.DUMMY.m_str.toUpperCase(), VacanceTokenType.DUMMY); 
        VacanceTokenType.STOP = new VacanceTokenType(2, "STOP");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.STOP.value(), VacanceTokenType.STOP); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.STOP.m_str.toUpperCase(), VacanceTokenType.STOP); 
        VacanceTokenType.EXPIRED = new VacanceTokenType(3, "EXPIRED");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.EXPIRED.value(), VacanceTokenType.EXPIRED); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.EXPIRED.m_str.toUpperCase(), VacanceTokenType.EXPIRED); 
        VacanceTokenType.NAME = new VacanceTokenType(4, "NAME");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.NAME.value(), VacanceTokenType.NAME); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.NAME.m_str.toUpperCase(), VacanceTokenType.NAME); 
        VacanceTokenType.DATE = new VacanceTokenType(5, "DATE");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.DATE.value(), VacanceTokenType.DATE); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.DATE.m_str.toUpperCase(), VacanceTokenType.DATE); 
        VacanceTokenType.SKILL = new VacanceTokenType(6, "SKILL");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.SKILL.value(), VacanceTokenType.SKILL); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.SKILL.m_str.toUpperCase(), VacanceTokenType.SKILL); 
        VacanceTokenType.PLUS = new VacanceTokenType(7, "PLUS");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.PLUS.value(), VacanceTokenType.PLUS); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.PLUS.m_str.toUpperCase(), VacanceTokenType.PLUS); 
        VacanceTokenType.EXPIERENCE = new VacanceTokenType(8, "EXPIERENCE");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.EXPIERENCE.value(), VacanceTokenType.EXPIERENCE); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.EXPIERENCE.m_str.toUpperCase(), VacanceTokenType.EXPIERENCE); 
        VacanceTokenType.EDUCATION = new VacanceTokenType(9, "EDUCATION");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.EDUCATION.value(), VacanceTokenType.EDUCATION); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.EDUCATION.m_str.toUpperCase(), VacanceTokenType.EDUCATION); 
        VacanceTokenType.MONEY = new VacanceTokenType(10, "MONEY");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.MONEY.value(), VacanceTokenType.MONEY); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.MONEY.m_str.toUpperCase(), VacanceTokenType.MONEY); 
        VacanceTokenType.LANGUAGE = new VacanceTokenType(11, "LANGUAGE");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.LANGUAGE.value(), VacanceTokenType.LANGUAGE); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.LANGUAGE.m_str.toUpperCase(), VacanceTokenType.LANGUAGE); 
        VacanceTokenType.MORAL = new VacanceTokenType(12, "MORAL");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.MORAL.value(), VacanceTokenType.MORAL); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.MORAL.m_str.toUpperCase(), VacanceTokenType.MORAL); 
        VacanceTokenType.DRIVING = new VacanceTokenType(13, "DRIVING");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.DRIVING.value(), VacanceTokenType.DRIVING); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.DRIVING.m_str.toUpperCase(), VacanceTokenType.DRIVING); 
        VacanceTokenType.LICENSE = new VacanceTokenType(14, "LICENSE");
        VacanceTokenType.mapIntToEnum.put(VacanceTokenType.LICENSE.value(), VacanceTokenType.LICENSE); 
        VacanceTokenType.mapStringToEnum.put(VacanceTokenType.LICENSE.m_str.toUpperCase(), VacanceTokenType.LICENSE); 
        VacanceTokenType.m_Values = Array.from(VacanceTokenType.mapIntToEnum.values);
        VacanceTokenType.m_Keys = Array.from(VacanceTokenType.mapIntToEnum.keys);
    }
}


VacanceTokenType.static_constructor();

module.exports = VacanceTokenType