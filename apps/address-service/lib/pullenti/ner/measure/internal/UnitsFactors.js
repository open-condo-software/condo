/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

// Степени десяток
class UnitsFactors {

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
        if(val instanceof UnitsFactors) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(UnitsFactors.mapStringToEnum.containsKey(val))
                return UnitsFactors.mapStringToEnum.get(val);
            return null;
        }
        if(UnitsFactors.mapIntToEnum.containsKey(val))
            return UnitsFactors.mapIntToEnum.get(val);
        let it = new UnitsFactors(val, val.toString());
        UnitsFactors.mapIntToEnum.put(val, it);
        UnitsFactors.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return UnitsFactors.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return UnitsFactors.m_Values;
    }
    static static_constructor() {
        UnitsFactors.mapIntToEnum = new Hashtable();
        UnitsFactors.mapStringToEnum = new Hashtable();
        UnitsFactors.NO = new UnitsFactors(0, "NO");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.NO.value(), UnitsFactors.NO); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.NO.m_str.toUpperCase(), UnitsFactors.NO); 
        UnitsFactors.KILO = new UnitsFactors(3, "KILO");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.KILO.value(), UnitsFactors.KILO); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.KILO.m_str.toUpperCase(), UnitsFactors.KILO); 
        UnitsFactors.MEGA = new UnitsFactors(6, "MEGA");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.MEGA.value(), UnitsFactors.MEGA); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.MEGA.m_str.toUpperCase(), UnitsFactors.MEGA); 
        UnitsFactors.GIGA = new UnitsFactors(9, "GIGA");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.GIGA.value(), UnitsFactors.GIGA); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.GIGA.m_str.toUpperCase(), UnitsFactors.GIGA); 
        UnitsFactors.TERA = new UnitsFactors(12, "TERA");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.TERA.value(), UnitsFactors.TERA); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.TERA.m_str.toUpperCase(), UnitsFactors.TERA); 
        UnitsFactors.DECI = new UnitsFactors(-1, "DECI");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.DECI.value(), UnitsFactors.DECI); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.DECI.m_str.toUpperCase(), UnitsFactors.DECI); 
        UnitsFactors.CENTI = new UnitsFactors(-2, "CENTI");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.CENTI.value(), UnitsFactors.CENTI); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.CENTI.m_str.toUpperCase(), UnitsFactors.CENTI); 
        UnitsFactors.MILLI = new UnitsFactors(-3, "MILLI");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.MILLI.value(), UnitsFactors.MILLI); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.MILLI.m_str.toUpperCase(), UnitsFactors.MILLI); 
        UnitsFactors.MICRO = new UnitsFactors(-6, "MICRO");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.MICRO.value(), UnitsFactors.MICRO); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.MICRO.m_str.toUpperCase(), UnitsFactors.MICRO); 
        UnitsFactors.NANO = new UnitsFactors(-9, "NANO");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.NANO.value(), UnitsFactors.NANO); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.NANO.m_str.toUpperCase(), UnitsFactors.NANO); 
        UnitsFactors.PICO = new UnitsFactors(-12, "PICO");
        UnitsFactors.mapIntToEnum.put(UnitsFactors.PICO.value(), UnitsFactors.PICO); 
        UnitsFactors.mapStringToEnum.put(UnitsFactors.PICO.m_str.toUpperCase(), UnitsFactors.PICO); 
        UnitsFactors.m_Values = Array.from(UnitsFactors.mapIntToEnum.values);
        UnitsFactors.m_Keys = Array.from(UnitsFactors.mapIntToEnum.keys);
    }
}


UnitsFactors.static_constructor();

module.exports = UnitsFactors