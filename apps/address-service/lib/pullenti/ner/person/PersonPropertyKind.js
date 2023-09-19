/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Категории свойств персон
 */
class PersonPropertyKind {

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
        if(val instanceof PersonPropertyKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PersonPropertyKind.mapStringToEnum.containsKey(val))
                return PersonPropertyKind.mapStringToEnum.get(val);
            return null;
        }
        if(PersonPropertyKind.mapIntToEnum.containsKey(val))
            return PersonPropertyKind.mapIntToEnum.get(val);
        let it = new PersonPropertyKind(val, val.toString());
        PersonPropertyKind.mapIntToEnum.put(val, it);
        PersonPropertyKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PersonPropertyKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PersonPropertyKind.m_Values;
    }
    static static_constructor() {
        PersonPropertyKind.mapIntToEnum = new Hashtable();
        PersonPropertyKind.mapStringToEnum = new Hashtable();
        PersonPropertyKind.UNDEFINED = new PersonPropertyKind(0, "UNDEFINED");
        PersonPropertyKind.mapIntToEnum.put(PersonPropertyKind.UNDEFINED.value(), PersonPropertyKind.UNDEFINED); 
        PersonPropertyKind.mapStringToEnum.put(PersonPropertyKind.UNDEFINED.m_str.toUpperCase(), PersonPropertyKind.UNDEFINED); 
        PersonPropertyKind.BOSS = new PersonPropertyKind(1, "BOSS");
        PersonPropertyKind.mapIntToEnum.put(PersonPropertyKind.BOSS.value(), PersonPropertyKind.BOSS); 
        PersonPropertyKind.mapStringToEnum.put(PersonPropertyKind.BOSS.m_str.toUpperCase(), PersonPropertyKind.BOSS); 
        PersonPropertyKind.KING = new PersonPropertyKind(2, "KING");
        PersonPropertyKind.mapIntToEnum.put(PersonPropertyKind.KING.value(), PersonPropertyKind.KING); 
        PersonPropertyKind.mapStringToEnum.put(PersonPropertyKind.KING.m_str.toUpperCase(), PersonPropertyKind.KING); 
        PersonPropertyKind.KIN = new PersonPropertyKind(3, "KIN");
        PersonPropertyKind.mapIntToEnum.put(PersonPropertyKind.KIN.value(), PersonPropertyKind.KIN); 
        PersonPropertyKind.mapStringToEnum.put(PersonPropertyKind.KIN.m_str.toUpperCase(), PersonPropertyKind.KIN); 
        PersonPropertyKind.MILITARYRANK = new PersonPropertyKind(4, "MILITARYRANK");
        PersonPropertyKind.mapIntToEnum.put(PersonPropertyKind.MILITARYRANK.value(), PersonPropertyKind.MILITARYRANK); 
        PersonPropertyKind.mapStringToEnum.put(PersonPropertyKind.MILITARYRANK.m_str.toUpperCase(), PersonPropertyKind.MILITARYRANK); 
        PersonPropertyKind.NATIONALITY = new PersonPropertyKind(5, "NATIONALITY");
        PersonPropertyKind.mapIntToEnum.put(PersonPropertyKind.NATIONALITY.value(), PersonPropertyKind.NATIONALITY); 
        PersonPropertyKind.mapStringToEnum.put(PersonPropertyKind.NATIONALITY.m_str.toUpperCase(), PersonPropertyKind.NATIONALITY); 
        PersonPropertyKind.m_Values = Array.from(PersonPropertyKind.mapIntToEnum.values);
        PersonPropertyKind.m_Keys = Array.from(PersonPropertyKind.mapIntToEnum.keys);
    }
}


PersonPropertyKind.static_constructor();

module.exports = PersonPropertyKind