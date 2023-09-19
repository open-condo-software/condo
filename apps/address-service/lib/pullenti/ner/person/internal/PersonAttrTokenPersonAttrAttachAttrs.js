/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class PersonAttrTokenPersonAttrAttachAttrs {

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
        if(val instanceof PersonAttrTokenPersonAttrAttachAttrs) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum.containsKey(val))
                return PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum.get(val);
            return null;
        }
        if(PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.containsKey(val))
            return PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.get(val);
        let it = new PersonAttrTokenPersonAttrAttachAttrs(val, val.toString());
        PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.put(val, it);
        PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PersonAttrTokenPersonAttrAttachAttrs.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PersonAttrTokenPersonAttrAttachAttrs.m_Values;
    }
    static static_constructor() {
        PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum = new Hashtable();
        PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum = new Hashtable();
        PersonAttrTokenPersonAttrAttachAttrs.NO = new PersonAttrTokenPersonAttrAttachAttrs(0, "NO");
        PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.NO.value(), PersonAttrTokenPersonAttrAttachAttrs.NO); 
        PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.NO.m_str.toUpperCase(), PersonAttrTokenPersonAttrAttachAttrs.NO); 
        PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL = new PersonAttrTokenPersonAttrAttachAttrs(1, "AFTERZAMESTITEL");
        PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.value(), PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL); 
        PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL.m_str.toUpperCase(), PersonAttrTokenPersonAttrAttachAttrs.AFTERZAMESTITEL); 
        PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD = new PersonAttrTokenPersonAttrAttachAttrs(2, "ONLYKEYWORD");
        PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD.value(), PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD); 
        PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD.m_str.toUpperCase(), PersonAttrTokenPersonAttrAttachAttrs.ONLYKEYWORD); 
        PersonAttrTokenPersonAttrAttachAttrs.INPROCESS = new PersonAttrTokenPersonAttrAttachAttrs(4, "INPROCESS");
        PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.INPROCESS.value(), PersonAttrTokenPersonAttrAttachAttrs.INPROCESS); 
        PersonAttrTokenPersonAttrAttachAttrs.mapStringToEnum.put(PersonAttrTokenPersonAttrAttachAttrs.INPROCESS.m_str.toUpperCase(), PersonAttrTokenPersonAttrAttachAttrs.INPROCESS); 
        PersonAttrTokenPersonAttrAttachAttrs.m_Values = Array.from(PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.values);
        PersonAttrTokenPersonAttrAttachAttrs.m_Keys = Array.from(PersonAttrTokenPersonAttrAttachAttrs.mapIntToEnum.keys);
    }
}


PersonAttrTokenPersonAttrAttachAttrs.static_constructor();

module.exports = PersonAttrTokenPersonAttrAttachAttrs