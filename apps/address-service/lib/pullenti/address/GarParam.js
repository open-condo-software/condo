/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Типы параметров ГАР
 */
class GarParam {

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
        if(val instanceof GarParam) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(GarParam.mapStringToEnum.containsKey(val))
                return GarParam.mapStringToEnum.get(val);
            return null;
        }
        if(GarParam.mapIntToEnum.containsKey(val))
            return GarParam.mapIntToEnum.get(val);
        let it = new GarParam(val, val.toString());
        GarParam.mapIntToEnum.put(val, it);
        GarParam.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return GarParam.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return GarParam.m_Values;
    }
    static static_constructor() {
        GarParam.mapIntToEnum = new Hashtable();
        GarParam.mapStringToEnum = new Hashtable();
        GarParam.UNDEFINED = new GarParam(0, "UNDEFINED");
        GarParam.mapIntToEnum.put(GarParam.UNDEFINED.value(), GarParam.UNDEFINED); 
        GarParam.mapStringToEnum.put(GarParam.UNDEFINED.m_str.toUpperCase(), GarParam.UNDEFINED); 
        GarParam.GUID = new GarParam(1, "GUID");
        GarParam.mapIntToEnum.put(GarParam.GUID.value(), GarParam.GUID); 
        GarParam.mapStringToEnum.put(GarParam.GUID.m_str.toUpperCase(), GarParam.GUID); 
        GarParam.KLADRCODE = new GarParam(2, "KLADRCODE");
        GarParam.mapIntToEnum.put(GarParam.KLADRCODE.value(), GarParam.KLADRCODE); 
        GarParam.mapStringToEnum.put(GarParam.KLADRCODE.m_str.toUpperCase(), GarParam.KLADRCODE); 
        GarParam.POSTINDEX = new GarParam(3, "POSTINDEX");
        GarParam.mapIntToEnum.put(GarParam.POSTINDEX.value(), GarParam.POSTINDEX); 
        GarParam.mapStringToEnum.put(GarParam.POSTINDEX.m_str.toUpperCase(), GarParam.POSTINDEX); 
        GarParam.OKATO = new GarParam(4, "OKATO");
        GarParam.mapIntToEnum.put(GarParam.OKATO.value(), GarParam.OKATO); 
        GarParam.mapStringToEnum.put(GarParam.OKATO.m_str.toUpperCase(), GarParam.OKATO); 
        GarParam.OKTMO = new GarParam(5, "OKTMO");
        GarParam.mapIntToEnum.put(GarParam.OKTMO.value(), GarParam.OKTMO); 
        GarParam.mapStringToEnum.put(GarParam.OKTMO.m_str.toUpperCase(), GarParam.OKTMO); 
        GarParam.KADASTERNUMBER = new GarParam(6, "KADASTERNUMBER");
        GarParam.mapIntToEnum.put(GarParam.KADASTERNUMBER.value(), GarParam.KADASTERNUMBER); 
        GarParam.mapStringToEnum.put(GarParam.KADASTERNUMBER.m_str.toUpperCase(), GarParam.KADASTERNUMBER); 
        GarParam.REESTERNUMBER = new GarParam(7, "REESTERNUMBER");
        GarParam.mapIntToEnum.put(GarParam.REESTERNUMBER.value(), GarParam.REESTERNUMBER); 
        GarParam.mapStringToEnum.put(GarParam.REESTERNUMBER.m_str.toUpperCase(), GarParam.REESTERNUMBER); 
        GarParam.m_Values = Array.from(GarParam.mapIntToEnum.values);
        GarParam.m_Keys = Array.from(GarParam.mapIntToEnum.keys);
    }
}


GarParam.static_constructor();

module.exports = GarParam