/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Атрибуты выделения именных групп NounPhraseHelper.TryParse(). Битовая маска.
 * Атрибуты выделения именной группы
 */
class NounPhraseParseAttr {

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
        if(val instanceof NounPhraseParseAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(NounPhraseParseAttr.mapStringToEnum.containsKey(val))
                return NounPhraseParseAttr.mapStringToEnum.get(val);
            return null;
        }
        if(NounPhraseParseAttr.mapIntToEnum.containsKey(val))
            return NounPhraseParseAttr.mapIntToEnum.get(val);
        let it = new NounPhraseParseAttr(val, val.toString());
        NounPhraseParseAttr.mapIntToEnum.put(val, it);
        NounPhraseParseAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return NounPhraseParseAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return NounPhraseParseAttr.m_Values;
    }
    static static_constructor() {
        NounPhraseParseAttr.mapIntToEnum = new Hashtable();
        NounPhraseParseAttr.mapStringToEnum = new Hashtable();
        NounPhraseParseAttr.NO = new NounPhraseParseAttr(0, "NO");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.NO.value(), NounPhraseParseAttr.NO); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.NO.m_str.toUpperCase(), NounPhraseParseAttr.NO); 
        NounPhraseParseAttr.PARSEPRONOUNS = new NounPhraseParseAttr(1, "PARSEPRONOUNS");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.PARSEPRONOUNS.value(), NounPhraseParseAttr.PARSEPRONOUNS); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.PARSEPRONOUNS.m_str.toUpperCase(), NounPhraseParseAttr.PARSEPRONOUNS); 
        NounPhraseParseAttr.PARSEPREPOSITION = new NounPhraseParseAttr(2, "PARSEPREPOSITION");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.PARSEPREPOSITION.value(), NounPhraseParseAttr.PARSEPREPOSITION); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.PARSEPREPOSITION.m_str.toUpperCase(), NounPhraseParseAttr.PARSEPREPOSITION); 
        NounPhraseParseAttr.IGNOREADJBEST = new NounPhraseParseAttr(4, "IGNOREADJBEST");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.IGNOREADJBEST.value(), NounPhraseParseAttr.IGNOREADJBEST); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.IGNOREADJBEST.m_str.toUpperCase(), NounPhraseParseAttr.IGNOREADJBEST); 
        NounPhraseParseAttr.IGNOREPARTICIPLES = new NounPhraseParseAttr(8, "IGNOREPARTICIPLES");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.IGNOREPARTICIPLES.value(), NounPhraseParseAttr.IGNOREPARTICIPLES); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.IGNOREPARTICIPLES.m_str.toUpperCase(), NounPhraseParseAttr.IGNOREPARTICIPLES); 
        NounPhraseParseAttr.REFERENTCANBENOUN = new NounPhraseParseAttr(0x10, "REFERENTCANBENOUN");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.REFERENTCANBENOUN.value(), NounPhraseParseAttr.REFERENTCANBENOUN); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.REFERENTCANBENOUN.m_str.toUpperCase(), NounPhraseParseAttr.REFERENTCANBENOUN); 
        NounPhraseParseAttr.CANNOTHASCOMMAAND = new NounPhraseParseAttr(0x20, "CANNOTHASCOMMAAND");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.CANNOTHASCOMMAAND.value(), NounPhraseParseAttr.CANNOTHASCOMMAAND); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.CANNOTHASCOMMAAND.m_str.toUpperCase(), NounPhraseParseAttr.CANNOTHASCOMMAAND); 
        NounPhraseParseAttr.ADJECTIVECANBELAST = new NounPhraseParseAttr(0x40, "ADJECTIVECANBELAST");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.ADJECTIVECANBELAST.value(), NounPhraseParseAttr.ADJECTIVECANBELAST); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.ADJECTIVECANBELAST.m_str.toUpperCase(), NounPhraseParseAttr.ADJECTIVECANBELAST); 
        NounPhraseParseAttr.PARSEADVERBS = new NounPhraseParseAttr(0x80, "PARSEADVERBS");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.PARSEADVERBS.value(), NounPhraseParseAttr.PARSEADVERBS); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.PARSEADVERBS.m_str.toUpperCase(), NounPhraseParseAttr.PARSEADVERBS); 
        NounPhraseParseAttr.PARSEVERBS = new NounPhraseParseAttr(0x100, "PARSEVERBS");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.PARSEVERBS.value(), NounPhraseParseAttr.PARSEVERBS); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.PARSEVERBS.m_str.toUpperCase(), NounPhraseParseAttr.PARSEVERBS); 
        NounPhraseParseAttr.PARSENUMERICASADJECTIVE = new NounPhraseParseAttr(0x200, "PARSENUMERICASADJECTIVE");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value(), NounPhraseParseAttr.PARSENUMERICASADJECTIVE); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.PARSENUMERICASADJECTIVE.m_str.toUpperCase(), NounPhraseParseAttr.PARSENUMERICASADJECTIVE); 
        NounPhraseParseAttr.MULTILINES = new NounPhraseParseAttr(0x400, "MULTILINES");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.MULTILINES.value(), NounPhraseParseAttr.MULTILINES); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.MULTILINES.m_str.toUpperCase(), NounPhraseParseAttr.MULTILINES); 
        NounPhraseParseAttr.IGNOREBRACKETS = new NounPhraseParseAttr(0x800, "IGNOREBRACKETS");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.IGNOREBRACKETS.value(), NounPhraseParseAttr.IGNOREBRACKETS); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.IGNOREBRACKETS.m_str.toUpperCase(), NounPhraseParseAttr.IGNOREBRACKETS); 
        NounPhraseParseAttr.MULTINOUNS = new NounPhraseParseAttr(0x1000, "MULTINOUNS");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.MULTINOUNS.value(), NounPhraseParseAttr.MULTINOUNS); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.MULTINOUNS.m_str.toUpperCase(), NounPhraseParseAttr.MULTINOUNS); 
        NounPhraseParseAttr.PARSENOT = new NounPhraseParseAttr(0x2000, "PARSENOT");
        NounPhraseParseAttr.mapIntToEnum.put(NounPhraseParseAttr.PARSENOT.value(), NounPhraseParseAttr.PARSENOT); 
        NounPhraseParseAttr.mapStringToEnum.put(NounPhraseParseAttr.PARSENOT.m_str.toUpperCase(), NounPhraseParseAttr.PARSENOT); 
        NounPhraseParseAttr.m_Values = Array.from(NounPhraseParseAttr.mapIntToEnum.values);
        NounPhraseParseAttr.m_Keys = Array.from(NounPhraseParseAttr.mapIntToEnum.keys);
    }
}


NounPhraseParseAttr.static_constructor();

module.exports = NounPhraseParseAttr