/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Атрибуты функции CanBeEqualsEx класса MiscHelper. Битовая маска.
 * Атрибуты сравнения
 */
class CanBeEqualsAttr {

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
        if(val instanceof CanBeEqualsAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(CanBeEqualsAttr.mapStringToEnum.containsKey(val))
                return CanBeEqualsAttr.mapStringToEnum.get(val);
            return null;
        }
        if(CanBeEqualsAttr.mapIntToEnum.containsKey(val))
            return CanBeEqualsAttr.mapIntToEnum.get(val);
        let it = new CanBeEqualsAttr(val, val.toString());
        CanBeEqualsAttr.mapIntToEnum.put(val, it);
        CanBeEqualsAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return CanBeEqualsAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return CanBeEqualsAttr.m_Values;
    }
    static static_constructor() {
        CanBeEqualsAttr.mapIntToEnum = new Hashtable();
        CanBeEqualsAttr.mapStringToEnum = new Hashtable();
        CanBeEqualsAttr.NO = new CanBeEqualsAttr(0, "NO");
        CanBeEqualsAttr.mapIntToEnum.put(CanBeEqualsAttr.NO.value(), CanBeEqualsAttr.NO); 
        CanBeEqualsAttr.mapStringToEnum.put(CanBeEqualsAttr.NO.m_str.toUpperCase(), CanBeEqualsAttr.NO); 
        CanBeEqualsAttr.IGNORENONLETTERS = new CanBeEqualsAttr(1, "IGNORENONLETTERS");
        CanBeEqualsAttr.mapIntToEnum.put(CanBeEqualsAttr.IGNORENONLETTERS.value(), CanBeEqualsAttr.IGNORENONLETTERS); 
        CanBeEqualsAttr.mapStringToEnum.put(CanBeEqualsAttr.IGNORENONLETTERS.m_str.toUpperCase(), CanBeEqualsAttr.IGNORENONLETTERS); 
        CanBeEqualsAttr.IGNOREUPPERCASE = new CanBeEqualsAttr(2, "IGNOREUPPERCASE");
        CanBeEqualsAttr.mapIntToEnum.put(CanBeEqualsAttr.IGNOREUPPERCASE.value(), CanBeEqualsAttr.IGNOREUPPERCASE); 
        CanBeEqualsAttr.mapStringToEnum.put(CanBeEqualsAttr.IGNOREUPPERCASE.m_str.toUpperCase(), CanBeEqualsAttr.IGNOREUPPERCASE); 
        CanBeEqualsAttr.CHECKMORPHEQUAFTERFIRSTNOUN = new CanBeEqualsAttr(4, "CHECKMORPHEQUAFTERFIRSTNOUN");
        CanBeEqualsAttr.mapIntToEnum.put(CanBeEqualsAttr.CHECKMORPHEQUAFTERFIRSTNOUN.value(), CanBeEqualsAttr.CHECKMORPHEQUAFTERFIRSTNOUN); 
        CanBeEqualsAttr.mapStringToEnum.put(CanBeEqualsAttr.CHECKMORPHEQUAFTERFIRSTNOUN.m_str.toUpperCase(), CanBeEqualsAttr.CHECKMORPHEQUAFTERFIRSTNOUN); 
        CanBeEqualsAttr.USEBRACKETS = new CanBeEqualsAttr(8, "USEBRACKETS");
        CanBeEqualsAttr.mapIntToEnum.put(CanBeEqualsAttr.USEBRACKETS.value(), CanBeEqualsAttr.USEBRACKETS); 
        CanBeEqualsAttr.mapStringToEnum.put(CanBeEqualsAttr.USEBRACKETS.m_str.toUpperCase(), CanBeEqualsAttr.USEBRACKETS); 
        CanBeEqualsAttr.IGNOREUPPERCASEFIRSTWORD = new CanBeEqualsAttr(0x10, "IGNOREUPPERCASEFIRSTWORD");
        CanBeEqualsAttr.mapIntToEnum.put(CanBeEqualsAttr.IGNOREUPPERCASEFIRSTWORD.value(), CanBeEqualsAttr.IGNOREUPPERCASEFIRSTWORD); 
        CanBeEqualsAttr.mapStringToEnum.put(CanBeEqualsAttr.IGNOREUPPERCASEFIRSTWORD.m_str.toUpperCase(), CanBeEqualsAttr.IGNOREUPPERCASEFIRSTWORD); 
        CanBeEqualsAttr.FIRSTCANBESHORTER = new CanBeEqualsAttr(0x20, "FIRSTCANBESHORTER");
        CanBeEqualsAttr.mapIntToEnum.put(CanBeEqualsAttr.FIRSTCANBESHORTER.value(), CanBeEqualsAttr.FIRSTCANBESHORTER); 
        CanBeEqualsAttr.mapStringToEnum.put(CanBeEqualsAttr.FIRSTCANBESHORTER.m_str.toUpperCase(), CanBeEqualsAttr.FIRSTCANBESHORTER); 
        CanBeEqualsAttr.m_Values = Array.from(CanBeEqualsAttr.mapIntToEnum.values);
        CanBeEqualsAttr.m_Keys = Array.from(CanBeEqualsAttr.mapIntToEnum.keys);
    }
}


CanBeEqualsAttr.static_constructor();

module.exports = CanBeEqualsAttr