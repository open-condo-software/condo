/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

class OrganizationAnalyzerAttachType {

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
        if(val instanceof OrganizationAnalyzerAttachType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(OrganizationAnalyzerAttachType.mapStringToEnum.containsKey(val))
                return OrganizationAnalyzerAttachType.mapStringToEnum.get(val);
            return null;
        }
        if(OrganizationAnalyzerAttachType.mapIntToEnum.containsKey(val))
            return OrganizationAnalyzerAttachType.mapIntToEnum.get(val);
        let it = new OrganizationAnalyzerAttachType(val, val.toString());
        OrganizationAnalyzerAttachType.mapIntToEnum.put(val, it);
        OrganizationAnalyzerAttachType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return OrganizationAnalyzerAttachType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return OrganizationAnalyzerAttachType.m_Values;
    }
    static static_constructor() {
        OrganizationAnalyzerAttachType.mapIntToEnum = new Hashtable();
        OrganizationAnalyzerAttachType.mapStringToEnum = new Hashtable();
        OrganizationAnalyzerAttachType.NORMAL = new OrganizationAnalyzerAttachType(0, "NORMAL");
        OrganizationAnalyzerAttachType.mapIntToEnum.put(OrganizationAnalyzerAttachType.NORMAL.value(), OrganizationAnalyzerAttachType.NORMAL); 
        OrganizationAnalyzerAttachType.mapStringToEnum.put(OrganizationAnalyzerAttachType.NORMAL.m_str.toUpperCase(), OrganizationAnalyzerAttachType.NORMAL); 
        OrganizationAnalyzerAttachType.NORMALAFTERDEP = new OrganizationAnalyzerAttachType(1, "NORMALAFTERDEP");
        OrganizationAnalyzerAttachType.mapIntToEnum.put(OrganizationAnalyzerAttachType.NORMALAFTERDEP.value(), OrganizationAnalyzerAttachType.NORMALAFTERDEP); 
        OrganizationAnalyzerAttachType.mapStringToEnum.put(OrganizationAnalyzerAttachType.NORMALAFTERDEP.m_str.toUpperCase(), OrganizationAnalyzerAttachType.NORMALAFTERDEP); 
        OrganizationAnalyzerAttachType.MULTIPLE = new OrganizationAnalyzerAttachType(2, "MULTIPLE");
        OrganizationAnalyzerAttachType.mapIntToEnum.put(OrganizationAnalyzerAttachType.MULTIPLE.value(), OrganizationAnalyzerAttachType.MULTIPLE); 
        OrganizationAnalyzerAttachType.mapStringToEnum.put(OrganizationAnalyzerAttachType.MULTIPLE.m_str.toUpperCase(), OrganizationAnalyzerAttachType.MULTIPLE); 
        OrganizationAnalyzerAttachType.HIGH = new OrganizationAnalyzerAttachType(3, "HIGH");
        OrganizationAnalyzerAttachType.mapIntToEnum.put(OrganizationAnalyzerAttachType.HIGH.value(), OrganizationAnalyzerAttachType.HIGH); 
        OrganizationAnalyzerAttachType.mapStringToEnum.put(OrganizationAnalyzerAttachType.HIGH.m_str.toUpperCase(), OrganizationAnalyzerAttachType.HIGH); 
        OrganizationAnalyzerAttachType.EXTONTOLOGY = new OrganizationAnalyzerAttachType(4, "EXTONTOLOGY");
        OrganizationAnalyzerAttachType.mapIntToEnum.put(OrganizationAnalyzerAttachType.EXTONTOLOGY.value(), OrganizationAnalyzerAttachType.EXTONTOLOGY); 
        OrganizationAnalyzerAttachType.mapStringToEnum.put(OrganizationAnalyzerAttachType.EXTONTOLOGY.m_str.toUpperCase(), OrganizationAnalyzerAttachType.EXTONTOLOGY); 
        OrganizationAnalyzerAttachType.m_Values = Array.from(OrganizationAnalyzerAttachType.mapIntToEnum.values);
        OrganizationAnalyzerAttachType.m_Keys = Array.from(OrganizationAnalyzerAttachType.mapIntToEnum.keys);
    }
}


OrganizationAnalyzerAttachType.static_constructor();

module.exports = OrganizationAnalyzerAttachType