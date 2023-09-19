/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class FundsItemTyp {

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
        if(val instanceof FundsItemTyp) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(FundsItemTyp.mapStringToEnum.containsKey(val))
                return FundsItemTyp.mapStringToEnum.get(val);
            return null;
        }
        if(FundsItemTyp.mapIntToEnum.containsKey(val))
            return FundsItemTyp.mapIntToEnum.get(val);
        let it = new FundsItemTyp(val, val.toString());
        FundsItemTyp.mapIntToEnum.put(val, it);
        FundsItemTyp.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return FundsItemTyp.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return FundsItemTyp.m_Values;
    }
    static static_constructor() {
        FundsItemTyp.mapIntToEnum = new Hashtable();
        FundsItemTyp.mapStringToEnum = new Hashtable();
        FundsItemTyp.UNDEFINED = new FundsItemTyp(0, "UNDEFINED");
        FundsItemTyp.mapIntToEnum.put(FundsItemTyp.UNDEFINED.value(), FundsItemTyp.UNDEFINED); 
        FundsItemTyp.mapStringToEnum.put(FundsItemTyp.UNDEFINED.m_str.toUpperCase(), FundsItemTyp.UNDEFINED); 
        FundsItemTyp.NOUN = new FundsItemTyp(1, "NOUN");
        FundsItemTyp.mapIntToEnum.put(FundsItemTyp.NOUN.value(), FundsItemTyp.NOUN); 
        FundsItemTyp.mapStringToEnum.put(FundsItemTyp.NOUN.m_str.toUpperCase(), FundsItemTyp.NOUN); 
        FundsItemTyp.COUNT = new FundsItemTyp(2, "COUNT");
        FundsItemTyp.mapIntToEnum.put(FundsItemTyp.COUNT.value(), FundsItemTyp.COUNT); 
        FundsItemTyp.mapStringToEnum.put(FundsItemTyp.COUNT.m_str.toUpperCase(), FundsItemTyp.COUNT); 
        FundsItemTyp.ORG = new FundsItemTyp(3, "ORG");
        FundsItemTyp.mapIntToEnum.put(FundsItemTyp.ORG.value(), FundsItemTyp.ORG); 
        FundsItemTyp.mapStringToEnum.put(FundsItemTyp.ORG.m_str.toUpperCase(), FundsItemTyp.ORG); 
        FundsItemTyp.SUM = new FundsItemTyp(4, "SUM");
        FundsItemTyp.mapIntToEnum.put(FundsItemTyp.SUM.value(), FundsItemTyp.SUM); 
        FundsItemTyp.mapStringToEnum.put(FundsItemTyp.SUM.m_str.toUpperCase(), FundsItemTyp.SUM); 
        FundsItemTyp.PERCENT = new FundsItemTyp(5, "PERCENT");
        FundsItemTyp.mapIntToEnum.put(FundsItemTyp.PERCENT.value(), FundsItemTyp.PERCENT); 
        FundsItemTyp.mapStringToEnum.put(FundsItemTyp.PERCENT.m_str.toUpperCase(), FundsItemTyp.PERCENT); 
        FundsItemTyp.PRICE = new FundsItemTyp(6, "PRICE");
        FundsItemTyp.mapIntToEnum.put(FundsItemTyp.PRICE.value(), FundsItemTyp.PRICE); 
        FundsItemTyp.mapStringToEnum.put(FundsItemTyp.PRICE.m_str.toUpperCase(), FundsItemTyp.PRICE); 
        FundsItemTyp.m_Values = Array.from(FundsItemTyp.mapIntToEnum.values);
        FundsItemTyp.m_Keys = Array.from(FundsItemTyp.mapIntToEnum.keys);
    }
}


FundsItemTyp.static_constructor();

module.exports = FundsItemTyp