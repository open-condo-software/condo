/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class FioTemplateType {

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
        if(val instanceof FioTemplateType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(FioTemplateType.mapStringToEnum.containsKey(val))
                return FioTemplateType.mapStringToEnum.get(val);
            return null;
        }
        if(FioTemplateType.mapIntToEnum.containsKey(val))
            return FioTemplateType.mapIntToEnum.get(val);
        let it = new FioTemplateType(val, val.toString());
        FioTemplateType.mapIntToEnum.put(val, it);
        FioTemplateType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return FioTemplateType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return FioTemplateType.m_Values;
    }
    static static_constructor() {
        FioTemplateType.mapIntToEnum = new Hashtable();
        FioTemplateType.mapStringToEnum = new Hashtable();
        FioTemplateType.UNDEFINED = new FioTemplateType(0, "UNDEFINED");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.UNDEFINED.value(), FioTemplateType.UNDEFINED); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.UNDEFINED.m_str.toUpperCase(), FioTemplateType.UNDEFINED); 
        FioTemplateType.SURNAMEII = new FioTemplateType(1, "SURNAMEII");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.SURNAMEII.value(), FioTemplateType.SURNAMEII); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.SURNAMEII.m_str.toUpperCase(), FioTemplateType.SURNAMEII); 
        FioTemplateType.IISURNAME = new FioTemplateType(2, "IISURNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.IISURNAME.value(), FioTemplateType.IISURNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.IISURNAME.m_str.toUpperCase(), FioTemplateType.IISURNAME); 
        FioTemplateType.SURNAMEI = new FioTemplateType(3, "SURNAMEI");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.SURNAMEI.value(), FioTemplateType.SURNAMEI); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.SURNAMEI.m_str.toUpperCase(), FioTemplateType.SURNAMEI); 
        FioTemplateType.ISURNAME = new FioTemplateType(4, "ISURNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.ISURNAME.value(), FioTemplateType.ISURNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.ISURNAME.m_str.toUpperCase(), FioTemplateType.ISURNAME); 
        FioTemplateType.SURNAMENAME = new FioTemplateType(5, "SURNAMENAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.SURNAMENAME.value(), FioTemplateType.SURNAMENAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.SURNAMENAME.m_str.toUpperCase(), FioTemplateType.SURNAMENAME); 
        FioTemplateType.SURNAMENAMESECNAME = new FioTemplateType(6, "SURNAMENAMESECNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.SURNAMENAMESECNAME.value(), FioTemplateType.SURNAMENAMESECNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.SURNAMENAMESECNAME.m_str.toUpperCase(), FioTemplateType.SURNAMENAMESECNAME); 
        FioTemplateType.NAMESURNAME = new FioTemplateType(7, "NAMESURNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.NAMESURNAME.value(), FioTemplateType.NAMESURNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.NAMESURNAME.m_str.toUpperCase(), FioTemplateType.NAMESURNAME); 
        FioTemplateType.NAMESECNAMESURNAME = new FioTemplateType(8, "NAMESECNAMESURNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.NAMESECNAMESURNAME.value(), FioTemplateType.NAMESECNAMESURNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.NAMESECNAMESURNAME.m_str.toUpperCase(), FioTemplateType.NAMESECNAMESURNAME); 
        FioTemplateType.NAMEISURNAME = new FioTemplateType(9, "NAMEISURNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.NAMEISURNAME.value(), FioTemplateType.NAMEISURNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.NAMEISURNAME.m_str.toUpperCase(), FioTemplateType.NAMEISURNAME); 
        FioTemplateType.NAMESECNAME = new FioTemplateType(10, "NAMESECNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.NAMESECNAME.value(), FioTemplateType.NAMESECNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.NAMESECNAME.m_str.toUpperCase(), FioTemplateType.NAMESECNAME); 
        FioTemplateType.KING = new FioTemplateType(11, "KING");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.KING.value(), FioTemplateType.KING); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.KING.m_str.toUpperCase(), FioTemplateType.KING); 
        FioTemplateType.ASIANNAME = new FioTemplateType(12, "ASIANNAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.ASIANNAME.value(), FioTemplateType.ASIANNAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.ASIANNAME.m_str.toUpperCase(), FioTemplateType.ASIANNAME); 
        FioTemplateType.ASIANSURNAMENAME = new FioTemplateType(13, "ASIANSURNAMENAME");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.ASIANSURNAMENAME.value(), FioTemplateType.ASIANSURNAMENAME); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.ASIANSURNAMENAME.m_str.toUpperCase(), FioTemplateType.ASIANSURNAMENAME); 
        FioTemplateType.ARABICLONG = new FioTemplateType(14, "ARABICLONG");
        FioTemplateType.mapIntToEnum.put(FioTemplateType.ARABICLONG.value(), FioTemplateType.ARABICLONG); 
        FioTemplateType.mapStringToEnum.put(FioTemplateType.ARABICLONG.m_str.toUpperCase(), FioTemplateType.ARABICLONG); 
        FioTemplateType.m_Values = Array.from(FioTemplateType.mapIntToEnum.values);
        FioTemplateType.m_Keys = Array.from(FioTemplateType.mapIntToEnum.keys);
    }
}


FioTemplateType.static_constructor();

module.exports = FioTemplateType