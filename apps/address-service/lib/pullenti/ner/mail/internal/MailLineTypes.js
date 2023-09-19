/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class MailLineTypes {

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
        if(val instanceof MailLineTypes) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MailLineTypes.mapStringToEnum.containsKey(val))
                return MailLineTypes.mapStringToEnum.get(val);
            return null;
        }
        if(MailLineTypes.mapIntToEnum.containsKey(val))
            return MailLineTypes.mapIntToEnum.get(val);
        let it = new MailLineTypes(val, val.toString());
        MailLineTypes.mapIntToEnum.put(val, it);
        MailLineTypes.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MailLineTypes.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MailLineTypes.m_Values;
    }
    static static_constructor() {
        MailLineTypes.mapIntToEnum = new Hashtable();
        MailLineTypes.mapStringToEnum = new Hashtable();
        MailLineTypes.UNDEFINED = new MailLineTypes(0, "UNDEFINED");
        MailLineTypes.mapIntToEnum.put(MailLineTypes.UNDEFINED.value(), MailLineTypes.UNDEFINED); 
        MailLineTypes.mapStringToEnum.put(MailLineTypes.UNDEFINED.m_str.toUpperCase(), MailLineTypes.UNDEFINED); 
        MailLineTypes.HELLO = new MailLineTypes(1, "HELLO");
        MailLineTypes.mapIntToEnum.put(MailLineTypes.HELLO.value(), MailLineTypes.HELLO); 
        MailLineTypes.mapStringToEnum.put(MailLineTypes.HELLO.m_str.toUpperCase(), MailLineTypes.HELLO); 
        MailLineTypes.BESTREGARDS = new MailLineTypes(2, "BESTREGARDS");
        MailLineTypes.mapIntToEnum.put(MailLineTypes.BESTREGARDS.value(), MailLineTypes.BESTREGARDS); 
        MailLineTypes.mapStringToEnum.put(MailLineTypes.BESTREGARDS.m_str.toUpperCase(), MailLineTypes.BESTREGARDS); 
        MailLineTypes.FROM = new MailLineTypes(3, "FROM");
        MailLineTypes.mapIntToEnum.put(MailLineTypes.FROM.value(), MailLineTypes.FROM); 
        MailLineTypes.mapStringToEnum.put(MailLineTypes.FROM.m_str.toUpperCase(), MailLineTypes.FROM); 
        MailLineTypes.m_Values = Array.from(MailLineTypes.mapIntToEnum.values);
        MailLineTypes.m_Keys = Array.from(MailLineTypes.mapIntToEnum.keys);
    }
}


MailLineTypes.static_constructor();

module.exports = MailLineTypes