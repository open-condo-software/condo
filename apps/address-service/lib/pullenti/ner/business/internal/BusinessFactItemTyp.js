/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class BusinessFactItemTyp {

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
        if(val instanceof BusinessFactItemTyp) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(BusinessFactItemTyp.mapStringToEnum.containsKey(val))
                return BusinessFactItemTyp.mapStringToEnum.get(val);
            return null;
        }
        if(BusinessFactItemTyp.mapIntToEnum.containsKey(val))
            return BusinessFactItemTyp.mapIntToEnum.get(val);
        let it = new BusinessFactItemTyp(val, val.toString());
        BusinessFactItemTyp.mapIntToEnum.put(val, it);
        BusinessFactItemTyp.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return BusinessFactItemTyp.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return BusinessFactItemTyp.m_Values;
    }
    static static_constructor() {
        BusinessFactItemTyp.mapIntToEnum = new Hashtable();
        BusinessFactItemTyp.mapStringToEnum = new Hashtable();
        BusinessFactItemTyp.BASE = new BusinessFactItemTyp(0, "BASE");
        BusinessFactItemTyp.mapIntToEnum.put(BusinessFactItemTyp.BASE.value(), BusinessFactItemTyp.BASE); 
        BusinessFactItemTyp.mapStringToEnum.put(BusinessFactItemTyp.BASE.m_str.toUpperCase(), BusinessFactItemTyp.BASE); 
        BusinessFactItemTyp.m_Values = Array.from(BusinessFactItemTyp.mapIntToEnum.values);
        BusinessFactItemTyp.m_Keys = Array.from(BusinessFactItemTyp.mapIntToEnum.keys);
    }
}


BusinessFactItemTyp.static_constructor();

module.exports = BusinessFactItemTyp