/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class PersonItemTokenItemType {

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
        if(val instanceof PersonItemTokenItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PersonItemTokenItemType.mapStringToEnum.containsKey(val))
                return PersonItemTokenItemType.mapStringToEnum.get(val);
            return null;
        }
        if(PersonItemTokenItemType.mapIntToEnum.containsKey(val))
            return PersonItemTokenItemType.mapIntToEnum.get(val);
        let it = new PersonItemTokenItemType(val, val.toString());
        PersonItemTokenItemType.mapIntToEnum.put(val, it);
        PersonItemTokenItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PersonItemTokenItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PersonItemTokenItemType.m_Values;
    }
    static static_constructor() {
        PersonItemTokenItemType.mapIntToEnum = new Hashtable();
        PersonItemTokenItemType.mapStringToEnum = new Hashtable();
        PersonItemTokenItemType.VALUE = new PersonItemTokenItemType(0, "VALUE");
        PersonItemTokenItemType.mapIntToEnum.put(PersonItemTokenItemType.VALUE.value(), PersonItemTokenItemType.VALUE); 
        PersonItemTokenItemType.mapStringToEnum.put(PersonItemTokenItemType.VALUE.m_str.toUpperCase(), PersonItemTokenItemType.VALUE); 
        PersonItemTokenItemType.INITIAL = new PersonItemTokenItemType(1, "INITIAL");
        PersonItemTokenItemType.mapIntToEnum.put(PersonItemTokenItemType.INITIAL.value(), PersonItemTokenItemType.INITIAL); 
        PersonItemTokenItemType.mapStringToEnum.put(PersonItemTokenItemType.INITIAL.m_str.toUpperCase(), PersonItemTokenItemType.INITIAL); 
        PersonItemTokenItemType.REFERENT = new PersonItemTokenItemType(2, "REFERENT");
        PersonItemTokenItemType.mapIntToEnum.put(PersonItemTokenItemType.REFERENT.value(), PersonItemTokenItemType.REFERENT); 
        PersonItemTokenItemType.mapStringToEnum.put(PersonItemTokenItemType.REFERENT.m_str.toUpperCase(), PersonItemTokenItemType.REFERENT); 
        PersonItemTokenItemType.SUFFIX = new PersonItemTokenItemType(3, "SUFFIX");
        PersonItemTokenItemType.mapIntToEnum.put(PersonItemTokenItemType.SUFFIX.value(), PersonItemTokenItemType.SUFFIX); 
        PersonItemTokenItemType.mapStringToEnum.put(PersonItemTokenItemType.SUFFIX.m_str.toUpperCase(), PersonItemTokenItemType.SUFFIX); 
        PersonItemTokenItemType.m_Values = Array.from(PersonItemTokenItemType.mapIntToEnum.values);
        PersonItemTokenItemType.m_Keys = Array.from(PersonItemTokenItemType.mapIntToEnum.keys);
    }
}


PersonItemTokenItemType.static_constructor();

module.exports = PersonItemTokenItemType