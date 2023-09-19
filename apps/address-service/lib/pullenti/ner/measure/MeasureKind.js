/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Что измеряется этой величиной
 */
class MeasureKind {

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
        if(val instanceof MeasureKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(MeasureKind.mapStringToEnum.containsKey(val))
                return MeasureKind.mapStringToEnum.get(val);
            return null;
        }
        if(MeasureKind.mapIntToEnum.containsKey(val))
            return MeasureKind.mapIntToEnum.get(val);
        let it = new MeasureKind(val, val.toString());
        MeasureKind.mapIntToEnum.put(val, it);
        MeasureKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return MeasureKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return MeasureKind.m_Values;
    }
    static static_constructor() {
        MeasureKind.mapIntToEnum = new Hashtable();
        MeasureKind.mapStringToEnum = new Hashtable();
        MeasureKind.UNDEFINED = new MeasureKind(0, "UNDEFINED");
        MeasureKind.mapIntToEnum.put(MeasureKind.UNDEFINED.value(), MeasureKind.UNDEFINED); 
        MeasureKind.mapStringToEnum.put(MeasureKind.UNDEFINED.m_str.toUpperCase(), MeasureKind.UNDEFINED); 
        MeasureKind.TIME = new MeasureKind(1, "TIME");
        MeasureKind.mapIntToEnum.put(MeasureKind.TIME.value(), MeasureKind.TIME); 
        MeasureKind.mapStringToEnum.put(MeasureKind.TIME.m_str.toUpperCase(), MeasureKind.TIME); 
        MeasureKind.LENGTH = new MeasureKind(2, "LENGTH");
        MeasureKind.mapIntToEnum.put(MeasureKind.LENGTH.value(), MeasureKind.LENGTH); 
        MeasureKind.mapStringToEnum.put(MeasureKind.LENGTH.m_str.toUpperCase(), MeasureKind.LENGTH); 
        MeasureKind.AREA = new MeasureKind(3, "AREA");
        MeasureKind.mapIntToEnum.put(MeasureKind.AREA.value(), MeasureKind.AREA); 
        MeasureKind.mapStringToEnum.put(MeasureKind.AREA.m_str.toUpperCase(), MeasureKind.AREA); 
        MeasureKind.VOLUME = new MeasureKind(4, "VOLUME");
        MeasureKind.mapIntToEnum.put(MeasureKind.VOLUME.value(), MeasureKind.VOLUME); 
        MeasureKind.mapStringToEnum.put(MeasureKind.VOLUME.m_str.toUpperCase(), MeasureKind.VOLUME); 
        MeasureKind.WEIGHT = new MeasureKind(5, "WEIGHT");
        MeasureKind.mapIntToEnum.put(MeasureKind.WEIGHT.value(), MeasureKind.WEIGHT); 
        MeasureKind.mapStringToEnum.put(MeasureKind.WEIGHT.m_str.toUpperCase(), MeasureKind.WEIGHT); 
        MeasureKind.SPEED = new MeasureKind(6, "SPEED");
        MeasureKind.mapIntToEnum.put(MeasureKind.SPEED.value(), MeasureKind.SPEED); 
        MeasureKind.mapStringToEnum.put(MeasureKind.SPEED.m_str.toUpperCase(), MeasureKind.SPEED); 
        MeasureKind.TEMPERATURE = new MeasureKind(7, "TEMPERATURE");
        MeasureKind.mapIntToEnum.put(MeasureKind.TEMPERATURE.value(), MeasureKind.TEMPERATURE); 
        MeasureKind.mapStringToEnum.put(MeasureKind.TEMPERATURE.m_str.toUpperCase(), MeasureKind.TEMPERATURE); 
        MeasureKind.IP = new MeasureKind(8, "IP");
        MeasureKind.mapIntToEnum.put(MeasureKind.IP.value(), MeasureKind.IP); 
        MeasureKind.mapStringToEnum.put(MeasureKind.IP.m_str.toUpperCase(), MeasureKind.IP); 
        MeasureKind.PERCENT = new MeasureKind(9, "PERCENT");
        MeasureKind.mapIntToEnum.put(MeasureKind.PERCENT.value(), MeasureKind.PERCENT); 
        MeasureKind.mapStringToEnum.put(MeasureKind.PERCENT.m_str.toUpperCase(), MeasureKind.PERCENT); 
        MeasureKind.MONEY = new MeasureKind(10, "MONEY");
        MeasureKind.mapIntToEnum.put(MeasureKind.MONEY.value(), MeasureKind.MONEY); 
        MeasureKind.mapStringToEnum.put(MeasureKind.MONEY.m_str.toUpperCase(), MeasureKind.MONEY); 
        MeasureKind.COUNT = new MeasureKind(11, "COUNT");
        MeasureKind.mapIntToEnum.put(MeasureKind.COUNT.value(), MeasureKind.COUNT); 
        MeasureKind.mapStringToEnum.put(MeasureKind.COUNT.m_str.toUpperCase(), MeasureKind.COUNT); 
        MeasureKind.m_Values = Array.from(MeasureKind.mapIntToEnum.values);
        MeasureKind.m_Keys = Array.from(MeasureKind.mapIntToEnum.keys);
    }
}


MeasureKind.static_constructor();

module.exports = MeasureKind