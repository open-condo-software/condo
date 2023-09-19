/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class OrgItemTypeTyp {

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
        if(val instanceof OrgItemTypeTyp) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(OrgItemTypeTyp.mapStringToEnum.containsKey(val))
                return OrgItemTypeTyp.mapStringToEnum.get(val);
            return null;
        }
        if(OrgItemTypeTyp.mapIntToEnum.containsKey(val))
            return OrgItemTypeTyp.mapIntToEnum.get(val);
        let it = new OrgItemTypeTyp(val, val.toString());
        OrgItemTypeTyp.mapIntToEnum.put(val, it);
        OrgItemTypeTyp.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return OrgItemTypeTyp.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return OrgItemTypeTyp.m_Values;
    }
    static static_constructor() {
        OrgItemTypeTyp.mapIntToEnum = new Hashtable();
        OrgItemTypeTyp.mapStringToEnum = new Hashtable();
        OrgItemTypeTyp.UNDEFINED = new OrgItemTypeTyp(0, "UNDEFINED");
        OrgItemTypeTyp.mapIntToEnum.put(OrgItemTypeTyp.UNDEFINED.value(), OrgItemTypeTyp.UNDEFINED); 
        OrgItemTypeTyp.mapStringToEnum.put(OrgItemTypeTyp.UNDEFINED.m_str.toUpperCase(), OrgItemTypeTyp.UNDEFINED); 
        OrgItemTypeTyp.ORG = new OrgItemTypeTyp(1, "ORG");
        OrgItemTypeTyp.mapIntToEnum.put(OrgItemTypeTyp.ORG.value(), OrgItemTypeTyp.ORG); 
        OrgItemTypeTyp.mapStringToEnum.put(OrgItemTypeTyp.ORG.m_str.toUpperCase(), OrgItemTypeTyp.ORG); 
        OrgItemTypeTyp.PREFIX = new OrgItemTypeTyp(2, "PREFIX");
        OrgItemTypeTyp.mapIntToEnum.put(OrgItemTypeTyp.PREFIX.value(), OrgItemTypeTyp.PREFIX); 
        OrgItemTypeTyp.mapStringToEnum.put(OrgItemTypeTyp.PREFIX.m_str.toUpperCase(), OrgItemTypeTyp.PREFIX); 
        OrgItemTypeTyp.DEP = new OrgItemTypeTyp(3, "DEP");
        OrgItemTypeTyp.mapIntToEnum.put(OrgItemTypeTyp.DEP.value(), OrgItemTypeTyp.DEP); 
        OrgItemTypeTyp.mapStringToEnum.put(OrgItemTypeTyp.DEP.m_str.toUpperCase(), OrgItemTypeTyp.DEP); 
        OrgItemTypeTyp.DEPADD = new OrgItemTypeTyp(4, "DEPADD");
        OrgItemTypeTyp.mapIntToEnum.put(OrgItemTypeTyp.DEPADD.value(), OrgItemTypeTyp.DEPADD); 
        OrgItemTypeTyp.mapStringToEnum.put(OrgItemTypeTyp.DEPADD.m_str.toUpperCase(), OrgItemTypeTyp.DEPADD); 
        OrgItemTypeTyp.m_Values = Array.from(OrgItemTypeTyp.mapIntToEnum.values);
        OrgItemTypeTyp.m_Keys = Array.from(OrgItemTypeTyp.mapIntToEnum.keys);
    }
}


OrgItemTypeTyp.static_constructor();

module.exports = OrgItemTypeTyp