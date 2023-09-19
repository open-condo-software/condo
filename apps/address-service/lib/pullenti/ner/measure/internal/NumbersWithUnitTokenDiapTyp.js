/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class NumbersWithUnitTokenDiapTyp {

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
        if(val instanceof NumbersWithUnitTokenDiapTyp) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(NumbersWithUnitTokenDiapTyp.mapStringToEnum.containsKey(val))
                return NumbersWithUnitTokenDiapTyp.mapStringToEnum.get(val);
            return null;
        }
        if(NumbersWithUnitTokenDiapTyp.mapIntToEnum.containsKey(val))
            return NumbersWithUnitTokenDiapTyp.mapIntToEnum.get(val);
        let it = new NumbersWithUnitTokenDiapTyp(val, val.toString());
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(val, it);
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return NumbersWithUnitTokenDiapTyp.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return NumbersWithUnitTokenDiapTyp.m_Values;
    }
    static static_constructor() {
        NumbersWithUnitTokenDiapTyp.mapIntToEnum = new Hashtable();
        NumbersWithUnitTokenDiapTyp.mapStringToEnum = new Hashtable();
        NumbersWithUnitTokenDiapTyp.UNDEFINED = new NumbersWithUnitTokenDiapTyp(0, "UNDEFINED");
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(NumbersWithUnitTokenDiapTyp.UNDEFINED.value(), NumbersWithUnitTokenDiapTyp.UNDEFINED); 
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(NumbersWithUnitTokenDiapTyp.UNDEFINED.m_str.toUpperCase(), NumbersWithUnitTokenDiapTyp.UNDEFINED); 
        NumbersWithUnitTokenDiapTyp.LS = new NumbersWithUnitTokenDiapTyp(1, "LS");
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(NumbersWithUnitTokenDiapTyp.LS.value(), NumbersWithUnitTokenDiapTyp.LS); 
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(NumbersWithUnitTokenDiapTyp.LS.m_str.toUpperCase(), NumbersWithUnitTokenDiapTyp.LS); 
        NumbersWithUnitTokenDiapTyp.LE = new NumbersWithUnitTokenDiapTyp(2, "LE");
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(NumbersWithUnitTokenDiapTyp.LE.value(), NumbersWithUnitTokenDiapTyp.LE); 
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(NumbersWithUnitTokenDiapTyp.LE.m_str.toUpperCase(), NumbersWithUnitTokenDiapTyp.LE); 
        NumbersWithUnitTokenDiapTyp.GT = new NumbersWithUnitTokenDiapTyp(3, "GT");
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(NumbersWithUnitTokenDiapTyp.GT.value(), NumbersWithUnitTokenDiapTyp.GT); 
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(NumbersWithUnitTokenDiapTyp.GT.m_str.toUpperCase(), NumbersWithUnitTokenDiapTyp.GT); 
        NumbersWithUnitTokenDiapTyp.GE = new NumbersWithUnitTokenDiapTyp(4, "GE");
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(NumbersWithUnitTokenDiapTyp.GE.value(), NumbersWithUnitTokenDiapTyp.GE); 
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(NumbersWithUnitTokenDiapTyp.GE.m_str.toUpperCase(), NumbersWithUnitTokenDiapTyp.GE); 
        NumbersWithUnitTokenDiapTyp.FROM = new NumbersWithUnitTokenDiapTyp(5, "FROM");
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(NumbersWithUnitTokenDiapTyp.FROM.value(), NumbersWithUnitTokenDiapTyp.FROM); 
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(NumbersWithUnitTokenDiapTyp.FROM.m_str.toUpperCase(), NumbersWithUnitTokenDiapTyp.FROM); 
        NumbersWithUnitTokenDiapTyp.TO = new NumbersWithUnitTokenDiapTyp(6, "TO");
        NumbersWithUnitTokenDiapTyp.mapIntToEnum.put(NumbersWithUnitTokenDiapTyp.TO.value(), NumbersWithUnitTokenDiapTyp.TO); 
        NumbersWithUnitTokenDiapTyp.mapStringToEnum.put(NumbersWithUnitTokenDiapTyp.TO.m_str.toUpperCase(), NumbersWithUnitTokenDiapTyp.TO); 
        NumbersWithUnitTokenDiapTyp.m_Values = Array.from(NumbersWithUnitTokenDiapTyp.mapIntToEnum.values);
        NumbersWithUnitTokenDiapTyp.m_Keys = Array.from(NumbersWithUnitTokenDiapTyp.mapIntToEnum.keys);
    }
}


NumbersWithUnitTokenDiapTyp.static_constructor();

module.exports = NumbersWithUnitTokenDiapTyp