/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Типы ценных бумаг
 */
class FundsKind {

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
        if(val instanceof FundsKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(FundsKind.mapStringToEnum.containsKey(val))
                return FundsKind.mapStringToEnum.get(val);
            return null;
        }
        if(FundsKind.mapIntToEnum.containsKey(val))
            return FundsKind.mapIntToEnum.get(val);
        let it = new FundsKind(val, val.toString());
        FundsKind.mapIntToEnum.put(val, it);
        FundsKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return FundsKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return FundsKind.m_Values;
    }
    static static_constructor() {
        FundsKind.mapIntToEnum = new Hashtable();
        FundsKind.mapStringToEnum = new Hashtable();
        FundsKind.UNDEFINED = new FundsKind(0, "UNDEFINED");
        FundsKind.mapIntToEnum.put(FundsKind.UNDEFINED.value(), FundsKind.UNDEFINED); 
        FundsKind.mapStringToEnum.put(FundsKind.UNDEFINED.m_str.toUpperCase(), FundsKind.UNDEFINED); 
        FundsKind.STOCK = new FundsKind(1, "STOCK");
        FundsKind.mapIntToEnum.put(FundsKind.STOCK.value(), FundsKind.STOCK); 
        FundsKind.mapStringToEnum.put(FundsKind.STOCK.m_str.toUpperCase(), FundsKind.STOCK); 
        FundsKind.CAPITAL = new FundsKind(2, "CAPITAL");
        FundsKind.mapIntToEnum.put(FundsKind.CAPITAL.value(), FundsKind.CAPITAL); 
        FundsKind.mapStringToEnum.put(FundsKind.CAPITAL.m_str.toUpperCase(), FundsKind.CAPITAL); 
        FundsKind.m_Values = Array.from(FundsKind.mapIntToEnum.values);
        FundsKind.m_Keys = Array.from(FundsKind.mapIntToEnum.keys);
    }
}


FundsKind.static_constructor();

module.exports = FundsKind