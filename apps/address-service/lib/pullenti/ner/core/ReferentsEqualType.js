/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Атрибут сравнения сущностей (методом Referent.CanBeEquals)
 * Атрибут сравнения сущностей
 */
class ReferentsEqualType {

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
        if(val instanceof ReferentsEqualType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(ReferentsEqualType.mapStringToEnum.containsKey(val))
                return ReferentsEqualType.mapStringToEnum.get(val);
            return null;
        }
        if(ReferentsEqualType.mapIntToEnum.containsKey(val))
            return ReferentsEqualType.mapIntToEnum.get(val);
        let it = new ReferentsEqualType(val, val.toString());
        ReferentsEqualType.mapIntToEnum.put(val, it);
        ReferentsEqualType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return ReferentsEqualType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return ReferentsEqualType.m_Values;
    }
    static static_constructor() {
        ReferentsEqualType.mapIntToEnum = new Hashtable();
        ReferentsEqualType.mapStringToEnum = new Hashtable();
        ReferentsEqualType.WITHINONETEXT = new ReferentsEqualType(0, "WITHINONETEXT");
        ReferentsEqualType.mapIntToEnum.put(ReferentsEqualType.WITHINONETEXT.value(), ReferentsEqualType.WITHINONETEXT); 
        ReferentsEqualType.mapStringToEnum.put(ReferentsEqualType.WITHINONETEXT.m_str.toUpperCase(), ReferentsEqualType.WITHINONETEXT); 
        ReferentsEqualType.DIFFERENTTEXTS = new ReferentsEqualType(1, "DIFFERENTTEXTS");
        ReferentsEqualType.mapIntToEnum.put(ReferentsEqualType.DIFFERENTTEXTS.value(), ReferentsEqualType.DIFFERENTTEXTS); 
        ReferentsEqualType.mapStringToEnum.put(ReferentsEqualType.DIFFERENTTEXTS.m_str.toUpperCase(), ReferentsEqualType.DIFFERENTTEXTS); 
        ReferentsEqualType.FORMERGING = new ReferentsEqualType(2, "FORMERGING");
        ReferentsEqualType.mapIntToEnum.put(ReferentsEqualType.FORMERGING.value(), ReferentsEqualType.FORMERGING); 
        ReferentsEqualType.mapStringToEnum.put(ReferentsEqualType.FORMERGING.m_str.toUpperCase(), ReferentsEqualType.FORMERGING); 
        ReferentsEqualType.m_Values = Array.from(ReferentsEqualType.mapIntToEnum.values);
        ReferentsEqualType.m_Keys = Array.from(ReferentsEqualType.mapIntToEnum.keys);
    }
}


ReferentsEqualType.static_constructor();

module.exports = ReferentsEqualType