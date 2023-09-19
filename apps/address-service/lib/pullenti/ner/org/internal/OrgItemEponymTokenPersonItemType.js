/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class OrgItemEponymTokenPersonItemType {

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
        if(val instanceof OrgItemEponymTokenPersonItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(OrgItemEponymTokenPersonItemType.mapStringToEnum.containsKey(val))
                return OrgItemEponymTokenPersonItemType.mapStringToEnum.get(val);
            return null;
        }
        if(OrgItemEponymTokenPersonItemType.mapIntToEnum.containsKey(val))
            return OrgItemEponymTokenPersonItemType.mapIntToEnum.get(val);
        let it = new OrgItemEponymTokenPersonItemType(val, val.toString());
        OrgItemEponymTokenPersonItemType.mapIntToEnum.put(val, it);
        OrgItemEponymTokenPersonItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return OrgItemEponymTokenPersonItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return OrgItemEponymTokenPersonItemType.m_Values;
    }
    static static_constructor() {
        OrgItemEponymTokenPersonItemType.mapIntToEnum = new Hashtable();
        OrgItemEponymTokenPersonItemType.mapStringToEnum = new Hashtable();
        OrgItemEponymTokenPersonItemType.SURNAME = new OrgItemEponymTokenPersonItemType(0, "SURNAME");
        OrgItemEponymTokenPersonItemType.mapIntToEnum.put(OrgItemEponymTokenPersonItemType.SURNAME.value(), OrgItemEponymTokenPersonItemType.SURNAME); 
        OrgItemEponymTokenPersonItemType.mapStringToEnum.put(OrgItemEponymTokenPersonItemType.SURNAME.m_str.toUpperCase(), OrgItemEponymTokenPersonItemType.SURNAME); 
        OrgItemEponymTokenPersonItemType.NAME = new OrgItemEponymTokenPersonItemType(1, "NAME");
        OrgItemEponymTokenPersonItemType.mapIntToEnum.put(OrgItemEponymTokenPersonItemType.NAME.value(), OrgItemEponymTokenPersonItemType.NAME); 
        OrgItemEponymTokenPersonItemType.mapStringToEnum.put(OrgItemEponymTokenPersonItemType.NAME.m_str.toUpperCase(), OrgItemEponymTokenPersonItemType.NAME); 
        OrgItemEponymTokenPersonItemType.INITIAL = new OrgItemEponymTokenPersonItemType(2, "INITIAL");
        OrgItemEponymTokenPersonItemType.mapIntToEnum.put(OrgItemEponymTokenPersonItemType.INITIAL.value(), OrgItemEponymTokenPersonItemType.INITIAL); 
        OrgItemEponymTokenPersonItemType.mapStringToEnum.put(OrgItemEponymTokenPersonItemType.INITIAL.m_str.toUpperCase(), OrgItemEponymTokenPersonItemType.INITIAL); 
        OrgItemEponymTokenPersonItemType.AND = new OrgItemEponymTokenPersonItemType(3, "AND");
        OrgItemEponymTokenPersonItemType.mapIntToEnum.put(OrgItemEponymTokenPersonItemType.AND.value(), OrgItemEponymTokenPersonItemType.AND); 
        OrgItemEponymTokenPersonItemType.mapStringToEnum.put(OrgItemEponymTokenPersonItemType.AND.m_str.toUpperCase(), OrgItemEponymTokenPersonItemType.AND); 
        OrgItemEponymTokenPersonItemType.LOCASEWORD = new OrgItemEponymTokenPersonItemType(4, "LOCASEWORD");
        OrgItemEponymTokenPersonItemType.mapIntToEnum.put(OrgItemEponymTokenPersonItemType.LOCASEWORD.value(), OrgItemEponymTokenPersonItemType.LOCASEWORD); 
        OrgItemEponymTokenPersonItemType.mapStringToEnum.put(OrgItemEponymTokenPersonItemType.LOCASEWORD.m_str.toUpperCase(), OrgItemEponymTokenPersonItemType.LOCASEWORD); 
        OrgItemEponymTokenPersonItemType.m_Values = Array.from(OrgItemEponymTokenPersonItemType.mapIntToEnum.values);
        OrgItemEponymTokenPersonItemType.m_Keys = Array.from(OrgItemEponymTokenPersonItemType.mapIntToEnum.keys);
    }
}


OrgItemEponymTokenPersonItemType.static_constructor();

module.exports = OrgItemEponymTokenPersonItemType