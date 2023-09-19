/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Дополнительные параметры адреса
 */
class ParamType {

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
        if(val instanceof ParamType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(ParamType.mapStringToEnum.containsKey(val))
                return ParamType.mapStringToEnum.get(val);
            return null;
        }
        if(ParamType.mapIntToEnum.containsKey(val))
            return ParamType.mapIntToEnum.get(val);
        let it = new ParamType(val, val.toString());
        ParamType.mapIntToEnum.put(val, it);
        ParamType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return ParamType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return ParamType.m_Values;
    }
    static static_constructor() {
        ParamType.mapIntToEnum = new Hashtable();
        ParamType.mapStringToEnum = new Hashtable();
        ParamType.UNDEFINED = new ParamType(0, "UNDEFINED");
        ParamType.mapIntToEnum.put(ParamType.UNDEFINED.value(), ParamType.UNDEFINED); 
        ParamType.mapStringToEnum.put(ParamType.UNDEFINED.m_str.toUpperCase(), ParamType.UNDEFINED); 
        ParamType.ORDER = new ParamType(1, "ORDER");
        ParamType.mapIntToEnum.put(ParamType.ORDER.value(), ParamType.ORDER); 
        ParamType.mapStringToEnum.put(ParamType.ORDER.m_str.toUpperCase(), ParamType.ORDER); 
        ParamType.PART = new ParamType(2, "PART");
        ParamType.mapIntToEnum.put(ParamType.PART.value(), ParamType.PART); 
        ParamType.mapStringToEnum.put(ParamType.PART.m_str.toUpperCase(), ParamType.PART); 
        ParamType.FLOOR = new ParamType(3, "FLOOR");
        ParamType.mapIntToEnum.put(ParamType.FLOOR.value(), ParamType.FLOOR); 
        ParamType.mapStringToEnum.put(ParamType.FLOOR.m_str.toUpperCase(), ParamType.FLOOR); 
        ParamType.GENPLAN = new ParamType(4, "GENPLAN");
        ParamType.mapIntToEnum.put(ParamType.GENPLAN.value(), ParamType.GENPLAN); 
        ParamType.mapStringToEnum.put(ParamType.GENPLAN.m_str.toUpperCase(), ParamType.GENPLAN); 
        ParamType.DELIVERYAREA = new ParamType(5, "DELIVERYAREA");
        ParamType.mapIntToEnum.put(ParamType.DELIVERYAREA.value(), ParamType.DELIVERYAREA); 
        ParamType.mapStringToEnum.put(ParamType.DELIVERYAREA.m_str.toUpperCase(), ParamType.DELIVERYAREA); 
        ParamType.ZIP = new ParamType(6, "ZIP");
        ParamType.mapIntToEnum.put(ParamType.ZIP.value(), ParamType.ZIP); 
        ParamType.mapStringToEnum.put(ParamType.ZIP.m_str.toUpperCase(), ParamType.ZIP); 
        ParamType.SUBSCRIBERBOX = new ParamType(7, "SUBSCRIBERBOX");
        ParamType.mapIntToEnum.put(ParamType.SUBSCRIBERBOX.value(), ParamType.SUBSCRIBERBOX); 
        ParamType.mapStringToEnum.put(ParamType.SUBSCRIBERBOX.m_str.toUpperCase(), ParamType.SUBSCRIBERBOX); 
        ParamType.m_Values = Array.from(ParamType.mapIntToEnum.values);
        ParamType.m_Keys = Array.from(ParamType.mapIntToEnum.keys);
    }
}


ParamType.static_constructor();

module.exports = ParamType