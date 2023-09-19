/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип элемента резюме
 */
class ResumeItemType {

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
        if(val instanceof ResumeItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(ResumeItemType.mapStringToEnum.containsKey(val))
                return ResumeItemType.mapStringToEnum.get(val);
            return null;
        }
        if(ResumeItemType.mapIntToEnum.containsKey(val))
            return ResumeItemType.mapIntToEnum.get(val);
        let it = new ResumeItemType(val, val.toString());
        ResumeItemType.mapIntToEnum.put(val, it);
        ResumeItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return ResumeItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return ResumeItemType.m_Values;
    }
    static static_constructor() {
        ResumeItemType.mapIntToEnum = new Hashtable();
        ResumeItemType.mapStringToEnum = new Hashtable();
        ResumeItemType.UNDEFINED = new ResumeItemType(0, "UNDEFINED");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.UNDEFINED.value(), ResumeItemType.UNDEFINED); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.UNDEFINED.m_str.toUpperCase(), ResumeItemType.UNDEFINED); 
        ResumeItemType.POSITION = new ResumeItemType(1, "POSITION");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.POSITION.value(), ResumeItemType.POSITION); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.POSITION.m_str.toUpperCase(), ResumeItemType.POSITION); 
        ResumeItemType.SEX = new ResumeItemType(2, "SEX");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.SEX.value(), ResumeItemType.SEX); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.SEX.m_str.toUpperCase(), ResumeItemType.SEX); 
        ResumeItemType.AGE = new ResumeItemType(3, "AGE");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.AGE.value(), ResumeItemType.AGE); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.AGE.m_str.toUpperCase(), ResumeItemType.AGE); 
        ResumeItemType.MONEY = new ResumeItemType(4, "MONEY");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.MONEY.value(), ResumeItemType.MONEY); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.MONEY.m_str.toUpperCase(), ResumeItemType.MONEY); 
        ResumeItemType.EDUCATION = new ResumeItemType(5, "EDUCATION");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.EDUCATION.value(), ResumeItemType.EDUCATION); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.EDUCATION.m_str.toUpperCase(), ResumeItemType.EDUCATION); 
        ResumeItemType.EXPERIENCE = new ResumeItemType(6, "EXPERIENCE");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.EXPERIENCE.value(), ResumeItemType.EXPERIENCE); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.EXPERIENCE.m_str.toUpperCase(), ResumeItemType.EXPERIENCE); 
        ResumeItemType.LANGUAGE = new ResumeItemType(7, "LANGUAGE");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.LANGUAGE.value(), ResumeItemType.LANGUAGE); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.LANGUAGE.m_str.toUpperCase(), ResumeItemType.LANGUAGE); 
        ResumeItemType.DRIVINGLICENSE = new ResumeItemType(8, "DRIVINGLICENSE");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.DRIVINGLICENSE.value(), ResumeItemType.DRIVINGLICENSE); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.DRIVINGLICENSE.m_str.toUpperCase(), ResumeItemType.DRIVINGLICENSE); 
        ResumeItemType.LICENSE = new ResumeItemType(9, "LICENSE");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.LICENSE.value(), ResumeItemType.LICENSE); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.LICENSE.m_str.toUpperCase(), ResumeItemType.LICENSE); 
        ResumeItemType.SPECIALITY = new ResumeItemType(10, "SPECIALITY");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.SPECIALITY.value(), ResumeItemType.SPECIALITY); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.SPECIALITY.m_str.toUpperCase(), ResumeItemType.SPECIALITY); 
        ResumeItemType.SKILL = new ResumeItemType(11, "SKILL");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.SKILL.value(), ResumeItemType.SKILL); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.SKILL.m_str.toUpperCase(), ResumeItemType.SKILL); 
        ResumeItemType.MORAL = new ResumeItemType(12, "MORAL");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.MORAL.value(), ResumeItemType.MORAL); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.MORAL.m_str.toUpperCase(), ResumeItemType.MORAL); 
        ResumeItemType.HOBBY = new ResumeItemType(13, "HOBBY");
        ResumeItemType.mapIntToEnum.put(ResumeItemType.HOBBY.value(), ResumeItemType.HOBBY); 
        ResumeItemType.mapStringToEnum.put(ResumeItemType.HOBBY.m_str.toUpperCase(), ResumeItemType.HOBBY); 
        ResumeItemType.m_Values = Array.from(ResumeItemType.mapIntToEnum.values);
        ResumeItemType.m_Keys = Array.from(ResumeItemType.mapIntToEnum.keys);
    }
}


ResumeItemType.static_constructor();

module.exports = ResumeItemType