/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип блока письма
 */
class MailKind {

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
        if(val instanceof MailKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MailKind.mapStringToEnum.containsKey(val))
                return MailKind.mapStringToEnum.get(val);
            return null;
        }
        if(MailKind.mapIntToEnum.containsKey(val))
            return MailKind.mapIntToEnum.get(val);
        let it = new MailKind(val, val.toString());
        MailKind.mapIntToEnum.put(val, it);
        MailKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MailKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MailKind.m_Values;
    }
    static static_constructor() {
        MailKind.mapIntToEnum = new Hashtable();
        MailKind.mapStringToEnum = new Hashtable();
        MailKind.UNDEFINED = new MailKind(0, "UNDEFINED");
        MailKind.mapIntToEnum.put(MailKind.UNDEFINED.value(), MailKind.UNDEFINED); 
        MailKind.mapStringToEnum.put(MailKind.UNDEFINED.m_str.toUpperCase(), MailKind.UNDEFINED); 
        MailKind.HEAD = new MailKind(1, "HEAD");
        MailKind.mapIntToEnum.put(MailKind.HEAD.value(), MailKind.HEAD); 
        MailKind.mapStringToEnum.put(MailKind.HEAD.m_str.toUpperCase(), MailKind.HEAD); 
        MailKind.HELLO = new MailKind(2, "HELLO");
        MailKind.mapIntToEnum.put(MailKind.HELLO.value(), MailKind.HELLO); 
        MailKind.mapStringToEnum.put(MailKind.HELLO.m_str.toUpperCase(), MailKind.HELLO); 
        MailKind.BODY = new MailKind(3, "BODY");
        MailKind.mapIntToEnum.put(MailKind.BODY.value(), MailKind.BODY); 
        MailKind.mapStringToEnum.put(MailKind.BODY.m_str.toUpperCase(), MailKind.BODY); 
        MailKind.TAIL = new MailKind(4, "TAIL");
        MailKind.mapIntToEnum.put(MailKind.TAIL.value(), MailKind.TAIL); 
        MailKind.mapStringToEnum.put(MailKind.TAIL.m_str.toUpperCase(), MailKind.TAIL); 
        MailKind.m_Values = Array.from(MailKind.mapIntToEnum.values);
        MailKind.m_Keys = Array.from(MailKind.mapIntToEnum.keys);
    }
}


MailKind.static_constructor();

module.exports = MailKind