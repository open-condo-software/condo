/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип элемента вакансии
 */
class VacanceItemType {

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
        if(val instanceof VacanceItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(VacanceItemType.mapStringToEnum.containsKey(val))
                return VacanceItemType.mapStringToEnum.get(val);
            return null;
        }
        if(VacanceItemType.mapIntToEnum.containsKey(val))
            return VacanceItemType.mapIntToEnum.get(val);
        let it = new VacanceItemType(val, val.toString());
        VacanceItemType.mapIntToEnum.put(val, it);
        VacanceItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return VacanceItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return VacanceItemType.m_Values;
    }
    static static_constructor() {
        VacanceItemType.mapIntToEnum = new Hashtable();
        VacanceItemType.mapStringToEnum = new Hashtable();
        VacanceItemType.UNDEFINED = new VacanceItemType(0, "UNDEFINED");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.UNDEFINED.value(), VacanceItemType.UNDEFINED); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.UNDEFINED.m_str.toUpperCase(), VacanceItemType.UNDEFINED); 
        VacanceItemType.NAME = new VacanceItemType(1, "NAME");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.NAME.value(), VacanceItemType.NAME); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.NAME.m_str.toUpperCase(), VacanceItemType.NAME); 
        VacanceItemType.DATE = new VacanceItemType(2, "DATE");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.DATE.value(), VacanceItemType.DATE); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.DATE.m_str.toUpperCase(), VacanceItemType.DATE); 
        VacanceItemType.MONEY = new VacanceItemType(3, "MONEY");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.MONEY.value(), VacanceItemType.MONEY); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.MONEY.m_str.toUpperCase(), VacanceItemType.MONEY); 
        VacanceItemType.EDUCATION = new VacanceItemType(4, "EDUCATION");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.EDUCATION.value(), VacanceItemType.EDUCATION); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.EDUCATION.m_str.toUpperCase(), VacanceItemType.EDUCATION); 
        VacanceItemType.EXPERIENCE = new VacanceItemType(5, "EXPERIENCE");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.EXPERIENCE.value(), VacanceItemType.EXPERIENCE); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.EXPERIENCE.m_str.toUpperCase(), VacanceItemType.EXPERIENCE); 
        VacanceItemType.LANGUAGE = new VacanceItemType(6, "LANGUAGE");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.LANGUAGE.value(), VacanceItemType.LANGUAGE); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.LANGUAGE.m_str.toUpperCase(), VacanceItemType.LANGUAGE); 
        VacanceItemType.DRIVINGLICENSE = new VacanceItemType(7, "DRIVINGLICENSE");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.DRIVINGLICENSE.value(), VacanceItemType.DRIVINGLICENSE); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.DRIVINGLICENSE.m_str.toUpperCase(), VacanceItemType.DRIVINGLICENSE); 
        VacanceItemType.LICENSE = new VacanceItemType(8, "LICENSE");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.LICENSE.value(), VacanceItemType.LICENSE); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.LICENSE.m_str.toUpperCase(), VacanceItemType.LICENSE); 
        VacanceItemType.MORAL = new VacanceItemType(9, "MORAL");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.MORAL.value(), VacanceItemType.MORAL); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.MORAL.m_str.toUpperCase(), VacanceItemType.MORAL); 
        VacanceItemType.SKILL = new VacanceItemType(10, "SKILL");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.SKILL.value(), VacanceItemType.SKILL); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.SKILL.m_str.toUpperCase(), VacanceItemType.SKILL); 
        VacanceItemType.PLUS = new VacanceItemType(11, "PLUS");
        VacanceItemType.mapIntToEnum.put(VacanceItemType.PLUS.value(), VacanceItemType.PLUS); 
        VacanceItemType.mapStringToEnum.put(VacanceItemType.PLUS.m_str.toUpperCase(), VacanceItemType.PLUS); 
        VacanceItemType.m_Values = Array.from(VacanceItemType.mapIntToEnum.values);
        VacanceItemType.m_Keys = Array.from(VacanceItemType.mapIntToEnum.keys);
    }
}


VacanceItemType.static_constructor();

module.exports = VacanceItemType