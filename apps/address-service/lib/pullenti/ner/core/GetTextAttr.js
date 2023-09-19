/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Атрибуты получения текста методами GetTextValue и GetTextValueOfMetaToken класса MiscHelper. Битовая маска.
 * Атрибуты получения текста
 */
class GetTextAttr {

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
        if(val instanceof GetTextAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(GetTextAttr.mapStringToEnum.containsKey(val))
                return GetTextAttr.mapStringToEnum.get(val);
            return null;
        }
        if(GetTextAttr.mapIntToEnum.containsKey(val))
            return GetTextAttr.mapIntToEnum.get(val);
        let it = new GetTextAttr(val, val.toString());
        GetTextAttr.mapIntToEnum.put(val, it);
        GetTextAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return GetTextAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return GetTextAttr.m_Values;
    }
    static static_constructor() {
        GetTextAttr.mapIntToEnum = new Hashtable();
        GetTextAttr.mapStringToEnum = new Hashtable();
        GetTextAttr.NO = new GetTextAttr(0, "NO");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.NO.value(), GetTextAttr.NO); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.NO.m_str.toUpperCase(), GetTextAttr.NO); 
        GetTextAttr.KEEPREGISTER = new GetTextAttr(1, "KEEPREGISTER");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.KEEPREGISTER.value(), GetTextAttr.KEEPREGISTER); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.KEEPREGISTER.m_str.toUpperCase(), GetTextAttr.KEEPREGISTER); 
        GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE = new GetTextAttr(2, "FIRSTNOUNGROUPTONOMINATIVE");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value(), GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.m_str.toUpperCase(), GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE); 
        GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE = new GetTextAttr(4, "FIRSTNOUNGROUPTONOMINATIVESINGLE");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value(), GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.m_str.toUpperCase(), GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE); 
        GetTextAttr.KEEPQUOTES = new GetTextAttr(8, "KEEPQUOTES");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.KEEPQUOTES.value(), GetTextAttr.KEEPQUOTES); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.KEEPQUOTES.m_str.toUpperCase(), GetTextAttr.KEEPQUOTES); 
        GetTextAttr.IGNOREGEOREFERENT = new GetTextAttr(0x10, "IGNOREGEOREFERENT");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.IGNOREGEOREFERENT.value(), GetTextAttr.IGNOREGEOREFERENT); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.IGNOREGEOREFERENT.m_str.toUpperCase(), GetTextAttr.IGNOREGEOREFERENT); 
        GetTextAttr.NORMALIZENUMBERS = new GetTextAttr(0x20, "NORMALIZENUMBERS");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.NORMALIZENUMBERS.value(), GetTextAttr.NORMALIZENUMBERS); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.NORMALIZENUMBERS.m_str.toUpperCase(), GetTextAttr.NORMALIZENUMBERS); 
        GetTextAttr.RESTOREREGISTER = new GetTextAttr(0x40, "RESTOREREGISTER");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.RESTOREREGISTER.value(), GetTextAttr.RESTOREREGISTER); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.RESTOREREGISTER.m_str.toUpperCase(), GetTextAttr.RESTOREREGISTER); 
        GetTextAttr.IGNOREARTICLES = new GetTextAttr(0x80, "IGNOREARTICLES");
        GetTextAttr.mapIntToEnum.put(GetTextAttr.IGNOREARTICLES.value(), GetTextAttr.IGNOREARTICLES); 
        GetTextAttr.mapStringToEnum.put(GetTextAttr.IGNOREARTICLES.m_str.toUpperCase(), GetTextAttr.IGNOREARTICLES); 
        GetTextAttr.m_Values = Array.from(GetTextAttr.mapIntToEnum.values);
        GetTextAttr.m_Keys = Array.from(GetTextAttr.mapIntToEnum.keys);
    }
}


GetTextAttr.static_constructor();

module.exports = GetTextAttr