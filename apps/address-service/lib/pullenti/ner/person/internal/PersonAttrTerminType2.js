/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class PersonAttrTerminType2 {

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
        if(val instanceof PersonAttrTerminType2) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PersonAttrTerminType2.mapStringToEnum.containsKey(val))
                return PersonAttrTerminType2.mapStringToEnum.get(val);
            return null;
        }
        if(PersonAttrTerminType2.mapIntToEnum.containsKey(val))
            return PersonAttrTerminType2.mapIntToEnum.get(val);
        let it = new PersonAttrTerminType2(val, val.toString());
        PersonAttrTerminType2.mapIntToEnum.put(val, it);
        PersonAttrTerminType2.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PersonAttrTerminType2.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PersonAttrTerminType2.m_Values;
    }
    static static_constructor() {
        PersonAttrTerminType2.mapIntToEnum = new Hashtable();
        PersonAttrTerminType2.mapStringToEnum = new Hashtable();
        PersonAttrTerminType2.UNDEFINED = new PersonAttrTerminType2(0, "UNDEFINED");
        PersonAttrTerminType2.mapIntToEnum.put(PersonAttrTerminType2.UNDEFINED.value(), PersonAttrTerminType2.UNDEFINED); 
        PersonAttrTerminType2.mapStringToEnum.put(PersonAttrTerminType2.UNDEFINED.m_str.toUpperCase(), PersonAttrTerminType2.UNDEFINED); 
        PersonAttrTerminType2.IO = new PersonAttrTerminType2(1, "IO");
        PersonAttrTerminType2.mapIntToEnum.put(PersonAttrTerminType2.IO.value(), PersonAttrTerminType2.IO); 
        PersonAttrTerminType2.mapStringToEnum.put(PersonAttrTerminType2.IO.m_str.toUpperCase(), PersonAttrTerminType2.IO); 
        PersonAttrTerminType2.GRADE = new PersonAttrTerminType2(2, "GRADE");
        PersonAttrTerminType2.mapIntToEnum.put(PersonAttrTerminType2.GRADE.value(), PersonAttrTerminType2.GRADE); 
        PersonAttrTerminType2.mapStringToEnum.put(PersonAttrTerminType2.GRADE.m_str.toUpperCase(), PersonAttrTerminType2.GRADE); 
        PersonAttrTerminType2.ABBR = new PersonAttrTerminType2(3, "ABBR");
        PersonAttrTerminType2.mapIntToEnum.put(PersonAttrTerminType2.ABBR.value(), PersonAttrTerminType2.ABBR); 
        PersonAttrTerminType2.mapStringToEnum.put(PersonAttrTerminType2.ABBR.m_str.toUpperCase(), PersonAttrTerminType2.ABBR); 
        PersonAttrTerminType2.ADJ = new PersonAttrTerminType2(4, "ADJ");
        PersonAttrTerminType2.mapIntToEnum.put(PersonAttrTerminType2.ADJ.value(), PersonAttrTerminType2.ADJ); 
        PersonAttrTerminType2.mapStringToEnum.put(PersonAttrTerminType2.ADJ.m_str.toUpperCase(), PersonAttrTerminType2.ADJ); 
        PersonAttrTerminType2.IGNOREDADJ = new PersonAttrTerminType2(5, "IGNOREDADJ");
        PersonAttrTerminType2.mapIntToEnum.put(PersonAttrTerminType2.IGNOREDADJ.value(), PersonAttrTerminType2.IGNOREDADJ); 
        PersonAttrTerminType2.mapStringToEnum.put(PersonAttrTerminType2.IGNOREDADJ.m_str.toUpperCase(), PersonAttrTerminType2.IGNOREDADJ); 
        PersonAttrTerminType2.IO2 = new PersonAttrTerminType2(6, "IO2");
        PersonAttrTerminType2.mapIntToEnum.put(PersonAttrTerminType2.IO2.value(), PersonAttrTerminType2.IO2); 
        PersonAttrTerminType2.mapStringToEnum.put(PersonAttrTerminType2.IO2.m_str.toUpperCase(), PersonAttrTerminType2.IO2); 
        PersonAttrTerminType2.m_Values = Array.from(PersonAttrTerminType2.mapIntToEnum.values);
        PersonAttrTerminType2.m_Keys = Array.from(PersonAttrTerminType2.mapIntToEnum.keys);
    }
}


PersonAttrTerminType2.static_constructor();

module.exports = PersonAttrTerminType2