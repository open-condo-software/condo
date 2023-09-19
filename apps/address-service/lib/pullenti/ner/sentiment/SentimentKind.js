/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Тип сентимента
 */
class SentimentKind {

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
        if(val instanceof SentimentKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(SentimentKind.mapStringToEnum.containsKey(val))
                return SentimentKind.mapStringToEnum.get(val);
            return null;
        }
        if(SentimentKind.mapIntToEnum.containsKey(val))
            return SentimentKind.mapIntToEnum.get(val);
        let it = new SentimentKind(val, val.toString());
        SentimentKind.mapIntToEnum.put(val, it);
        SentimentKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return SentimentKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return SentimentKind.m_Values;
    }
    static static_constructor() {
        SentimentKind.mapIntToEnum = new Hashtable();
        SentimentKind.mapStringToEnum = new Hashtable();
        SentimentKind.UNDEFINED = new SentimentKind(0, "UNDEFINED");
        SentimentKind.mapIntToEnum.put(SentimentKind.UNDEFINED.value(), SentimentKind.UNDEFINED); 
        SentimentKind.mapStringToEnum.put(SentimentKind.UNDEFINED.m_str.toUpperCase(), SentimentKind.UNDEFINED); 
        SentimentKind.POSITIVE = new SentimentKind(1, "POSITIVE");
        SentimentKind.mapIntToEnum.put(SentimentKind.POSITIVE.value(), SentimentKind.POSITIVE); 
        SentimentKind.mapStringToEnum.put(SentimentKind.POSITIVE.m_str.toUpperCase(), SentimentKind.POSITIVE); 
        SentimentKind.NEGATIVE = new SentimentKind(2, "NEGATIVE");
        SentimentKind.mapIntToEnum.put(SentimentKind.NEGATIVE.value(), SentimentKind.NEGATIVE); 
        SentimentKind.mapStringToEnum.put(SentimentKind.NEGATIVE.m_str.toUpperCase(), SentimentKind.NEGATIVE); 
        SentimentKind.m_Values = Array.from(SentimentKind.mapIntToEnum.values);
        SentimentKind.m_Keys = Array.from(SentimentKind.mapIntToEnum.keys);
    }
}


SentimentKind.static_constructor();

module.exports = SentimentKind