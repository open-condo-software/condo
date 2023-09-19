/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class PersonIdTokenTyps {

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
        if(val instanceof PersonIdTokenTyps) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PersonIdTokenTyps.mapStringToEnum.containsKey(val))
                return PersonIdTokenTyps.mapStringToEnum.get(val);
            return null;
        }
        if(PersonIdTokenTyps.mapIntToEnum.containsKey(val))
            return PersonIdTokenTyps.mapIntToEnum.get(val);
        let it = new PersonIdTokenTyps(val, val.toString());
        PersonIdTokenTyps.mapIntToEnum.put(val, it);
        PersonIdTokenTyps.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PersonIdTokenTyps.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PersonIdTokenTyps.m_Values;
    }
    static static_constructor() {
        PersonIdTokenTyps.mapIntToEnum = new Hashtable();
        PersonIdTokenTyps.mapStringToEnum = new Hashtable();
        PersonIdTokenTyps.KEYWORD = new PersonIdTokenTyps(0, "KEYWORD");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.KEYWORD.value(), PersonIdTokenTyps.KEYWORD); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.KEYWORD.m_str.toUpperCase(), PersonIdTokenTyps.KEYWORD); 
        PersonIdTokenTyps.SERIA = new PersonIdTokenTyps(1, "SERIA");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.SERIA.value(), PersonIdTokenTyps.SERIA); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.SERIA.m_str.toUpperCase(), PersonIdTokenTyps.SERIA); 
        PersonIdTokenTyps.NUMBER = new PersonIdTokenTyps(2, "NUMBER");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.NUMBER.value(), PersonIdTokenTyps.NUMBER); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.NUMBER.m_str.toUpperCase(), PersonIdTokenTyps.NUMBER); 
        PersonIdTokenTyps.DATE = new PersonIdTokenTyps(3, "DATE");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.DATE.value(), PersonIdTokenTyps.DATE); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.DATE.m_str.toUpperCase(), PersonIdTokenTyps.DATE); 
        PersonIdTokenTyps.ORG = new PersonIdTokenTyps(4, "ORG");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.ORG.value(), PersonIdTokenTyps.ORG); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.ORG.m_str.toUpperCase(), PersonIdTokenTyps.ORG); 
        PersonIdTokenTyps.VIDAN = new PersonIdTokenTyps(5, "VIDAN");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.VIDAN.value(), PersonIdTokenTyps.VIDAN); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.VIDAN.m_str.toUpperCase(), PersonIdTokenTyps.VIDAN); 
        PersonIdTokenTyps.CODE = new PersonIdTokenTyps(6, "CODE");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.CODE.value(), PersonIdTokenTyps.CODE); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.CODE.m_str.toUpperCase(), PersonIdTokenTyps.CODE); 
        PersonIdTokenTyps.ADDRESS = new PersonIdTokenTyps(7, "ADDRESS");
        PersonIdTokenTyps.mapIntToEnum.put(PersonIdTokenTyps.ADDRESS.value(), PersonIdTokenTyps.ADDRESS); 
        PersonIdTokenTyps.mapStringToEnum.put(PersonIdTokenTyps.ADDRESS.m_str.toUpperCase(), PersonIdTokenTyps.ADDRESS); 
        PersonIdTokenTyps.m_Values = Array.from(PersonIdTokenTyps.mapIntToEnum.values);
        PersonIdTokenTyps.m_Keys = Array.from(PersonIdTokenTyps.mapIntToEnum.keys);
    }
}


PersonIdTokenTyps.static_constructor();

module.exports = PersonIdTokenTyps