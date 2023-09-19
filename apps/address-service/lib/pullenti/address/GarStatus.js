/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../unisharp/Hashtable");

/**
 * Статус анализа наименования ГАР-объекта
 */
class GarStatus {

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
        if(val instanceof GarStatus) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(GarStatus.mapStringToEnum.containsKey(val))
                return GarStatus.mapStringToEnum.get(val);
            return null;
        }
        if(GarStatus.mapIntToEnum.containsKey(val))
            return GarStatus.mapIntToEnum.get(val);
        let it = new GarStatus(val, val.toString());
        GarStatus.mapIntToEnum.put(val, it);
        GarStatus.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return GarStatus.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return GarStatus.m_Values;
    }
    static static_constructor() {
        GarStatus.mapIntToEnum = new Hashtable();
        GarStatus.mapStringToEnum = new Hashtable();
        GarStatus.OK = new GarStatus(0, "OK");
        GarStatus.mapIntToEnum.put(GarStatus.OK.value(), GarStatus.OK); 
        GarStatus.mapStringToEnum.put(GarStatus.OK.m_str.toUpperCase(), GarStatus.OK); 
        GarStatus.WARNING = new GarStatus(1, "WARNING");
        GarStatus.mapIntToEnum.put(GarStatus.WARNING.value(), GarStatus.WARNING); 
        GarStatus.mapStringToEnum.put(GarStatus.WARNING.m_str.toUpperCase(), GarStatus.WARNING); 
        GarStatus.ERROR = new GarStatus(2, "ERROR");
        GarStatus.mapIntToEnum.put(GarStatus.ERROR.value(), GarStatus.ERROR); 
        GarStatus.mapStringToEnum.put(GarStatus.ERROR.m_str.toUpperCase(), GarStatus.ERROR); 
        GarStatus.OK2 = new GarStatus(3, "OK2");
        GarStatus.mapIntToEnum.put(GarStatus.OK2.value(), GarStatus.OK2); 
        GarStatus.mapStringToEnum.put(GarStatus.OK2.m_str.toUpperCase(), GarStatus.OK2); 
        GarStatus.m_Values = Array.from(GarStatus.mapIntToEnum.values);
        GarStatus.m_Keys = Array.from(GarStatus.mapIntToEnum.keys);
    }
}


GarStatus.static_constructor();

module.exports = GarStatus