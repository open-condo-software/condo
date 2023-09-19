/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Атрибуты привязки токена к термину словаря TerminCollection методом TryParse. Битовая маска.
 * Атрибуты привязки к словарю
 */
class TerminParseAttr {

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
        if(val instanceof TerminParseAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(TerminParseAttr.mapStringToEnum.containsKey(val))
                return TerminParseAttr.mapStringToEnum.get(val);
            return null;
        }
        if(TerminParseAttr.mapIntToEnum.containsKey(val))
            return TerminParseAttr.mapIntToEnum.get(val);
        let it = new TerminParseAttr(val, val.toString());
        TerminParseAttr.mapIntToEnum.put(val, it);
        TerminParseAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return TerminParseAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return TerminParseAttr.m_Values;
    }
    static static_constructor() {
        TerminParseAttr.mapIntToEnum = new Hashtable();
        TerminParseAttr.mapStringToEnum = new Hashtable();
        TerminParseAttr.NO = new TerminParseAttr(0, "NO");
        TerminParseAttr.mapIntToEnum.put(TerminParseAttr.NO.value(), TerminParseAttr.NO); 
        TerminParseAttr.mapStringToEnum.put(TerminParseAttr.NO.m_str.toUpperCase(), TerminParseAttr.NO); 
        TerminParseAttr.FULLWORDSONLY = new TerminParseAttr(1, "FULLWORDSONLY");
        TerminParseAttr.mapIntToEnum.put(TerminParseAttr.FULLWORDSONLY.value(), TerminParseAttr.FULLWORDSONLY); 
        TerminParseAttr.mapStringToEnum.put(TerminParseAttr.FULLWORDSONLY.m_str.toUpperCase(), TerminParseAttr.FULLWORDSONLY); 
        TerminParseAttr.INDICTIONARYONLY = new TerminParseAttr(2, "INDICTIONARYONLY");
        TerminParseAttr.mapIntToEnum.put(TerminParseAttr.INDICTIONARYONLY.value(), TerminParseAttr.INDICTIONARYONLY); 
        TerminParseAttr.mapStringToEnum.put(TerminParseAttr.INDICTIONARYONLY.m_str.toUpperCase(), TerminParseAttr.INDICTIONARYONLY); 
        TerminParseAttr.TERMONLY = new TerminParseAttr(4, "TERMONLY");
        TerminParseAttr.mapIntToEnum.put(TerminParseAttr.TERMONLY.value(), TerminParseAttr.TERMONLY); 
        TerminParseAttr.mapStringToEnum.put(TerminParseAttr.TERMONLY.m_str.toUpperCase(), TerminParseAttr.TERMONLY); 
        TerminParseAttr.CANBEGEOOBJECT = new TerminParseAttr(8, "CANBEGEOOBJECT");
        TerminParseAttr.mapIntToEnum.put(TerminParseAttr.CANBEGEOOBJECT.value(), TerminParseAttr.CANBEGEOOBJECT); 
        TerminParseAttr.mapStringToEnum.put(TerminParseAttr.CANBEGEOOBJECT.m_str.toUpperCase(), TerminParseAttr.CANBEGEOOBJECT); 
        TerminParseAttr.IGNOREBRACKETS = new TerminParseAttr(0x10, "IGNOREBRACKETS");
        TerminParseAttr.mapIntToEnum.put(TerminParseAttr.IGNOREBRACKETS.value(), TerminParseAttr.IGNOREBRACKETS); 
        TerminParseAttr.mapStringToEnum.put(TerminParseAttr.IGNOREBRACKETS.m_str.toUpperCase(), TerminParseAttr.IGNOREBRACKETS); 
        TerminParseAttr.IGNORESTOPWORDS = new TerminParseAttr(0x20, "IGNORESTOPWORDS");
        TerminParseAttr.mapIntToEnum.put(TerminParseAttr.IGNORESTOPWORDS.value(), TerminParseAttr.IGNORESTOPWORDS); 
        TerminParseAttr.mapStringToEnum.put(TerminParseAttr.IGNORESTOPWORDS.m_str.toUpperCase(), TerminParseAttr.IGNORESTOPWORDS); 
        TerminParseAttr.m_Values = Array.from(TerminParseAttr.mapIntToEnum.values);
        TerminParseAttr.m_Keys = Array.from(TerminParseAttr.mapIntToEnum.keys);
    }
}


TerminParseAttr.static_constructor();

module.exports = TerminParseAttr