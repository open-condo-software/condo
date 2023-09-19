/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class PersonAttrTerminType {

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
        if(val instanceof PersonAttrTerminType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PersonAttrTerminType.mapStringToEnum.containsKey(val))
                return PersonAttrTerminType.mapStringToEnum.get(val);
            return null;
        }
        if(PersonAttrTerminType.mapIntToEnum.containsKey(val))
            return PersonAttrTerminType.mapIntToEnum.get(val);
        let it = new PersonAttrTerminType(val, val.toString());
        PersonAttrTerminType.mapIntToEnum.put(val, it);
        PersonAttrTerminType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PersonAttrTerminType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PersonAttrTerminType.m_Values;
    }
    static static_constructor() {
        PersonAttrTerminType.mapIntToEnum = new Hashtable();
        PersonAttrTerminType.mapStringToEnum = new Hashtable();
        PersonAttrTerminType.PREFIX = new PersonAttrTerminType(0, "PREFIX");
        PersonAttrTerminType.mapIntToEnum.put(PersonAttrTerminType.PREFIX.value(), PersonAttrTerminType.PREFIX); 
        PersonAttrTerminType.mapStringToEnum.put(PersonAttrTerminType.PREFIX.m_str.toUpperCase(), PersonAttrTerminType.PREFIX); 
        PersonAttrTerminType.BESTREGARDS = new PersonAttrTerminType(1, "BESTREGARDS");
        PersonAttrTerminType.mapIntToEnum.put(PersonAttrTerminType.BESTREGARDS.value(), PersonAttrTerminType.BESTREGARDS); 
        PersonAttrTerminType.mapStringToEnum.put(PersonAttrTerminType.BESTREGARDS.m_str.toUpperCase(), PersonAttrTerminType.BESTREGARDS); 
        PersonAttrTerminType.POSITION = new PersonAttrTerminType(2, "POSITION");
        PersonAttrTerminType.mapIntToEnum.put(PersonAttrTerminType.POSITION.value(), PersonAttrTerminType.POSITION); 
        PersonAttrTerminType.mapStringToEnum.put(PersonAttrTerminType.POSITION.m_str.toUpperCase(), PersonAttrTerminType.POSITION); 
        PersonAttrTerminType.KING = new PersonAttrTerminType(3, "KING");
        PersonAttrTerminType.mapIntToEnum.put(PersonAttrTerminType.KING.value(), PersonAttrTerminType.KING); 
        PersonAttrTerminType.mapStringToEnum.put(PersonAttrTerminType.KING.m_str.toUpperCase(), PersonAttrTerminType.KING); 
        PersonAttrTerminType.OTHER = new PersonAttrTerminType(4, "OTHER");
        PersonAttrTerminType.mapIntToEnum.put(PersonAttrTerminType.OTHER.value(), PersonAttrTerminType.OTHER); 
        PersonAttrTerminType.mapStringToEnum.put(PersonAttrTerminType.OTHER.m_str.toUpperCase(), PersonAttrTerminType.OTHER); 
        PersonAttrTerminType.m_Values = Array.from(PersonAttrTerminType.mapIntToEnum.values);
        PersonAttrTerminType.m_Keys = Array.from(PersonAttrTerminType.mapIntToEnum.keys);
    }
}


PersonAttrTerminType.static_constructor();

module.exports = PersonAttrTerminType