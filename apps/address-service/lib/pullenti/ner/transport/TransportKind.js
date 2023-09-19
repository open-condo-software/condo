/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Категории транспортных средств
 */
class TransportKind {

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
        if(val instanceof TransportKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(TransportKind.mapStringToEnum.containsKey(val))
                return TransportKind.mapStringToEnum.get(val);
            return null;
        }
        if(TransportKind.mapIntToEnum.containsKey(val))
            return TransportKind.mapIntToEnum.get(val);
        let it = new TransportKind(val, val.toString());
        TransportKind.mapIntToEnum.put(val, it);
        TransportKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return TransportKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return TransportKind.m_Values;
    }
    static static_constructor() {
        TransportKind.mapIntToEnum = new Hashtable();
        TransportKind.mapStringToEnum = new Hashtable();
        TransportKind.UNDEFINED = new TransportKind(0, "UNDEFINED");
        TransportKind.mapIntToEnum.put(TransportKind.UNDEFINED.value(), TransportKind.UNDEFINED); 
        TransportKind.mapStringToEnum.put(TransportKind.UNDEFINED.m_str.toUpperCase(), TransportKind.UNDEFINED); 
        TransportKind.AUTO = new TransportKind(1, "AUTO");
        TransportKind.mapIntToEnum.put(TransportKind.AUTO.value(), TransportKind.AUTO); 
        TransportKind.mapStringToEnum.put(TransportKind.AUTO.m_str.toUpperCase(), TransportKind.AUTO); 
        TransportKind.TRAIN = new TransportKind(2, "TRAIN");
        TransportKind.mapIntToEnum.put(TransportKind.TRAIN.value(), TransportKind.TRAIN); 
        TransportKind.mapStringToEnum.put(TransportKind.TRAIN.m_str.toUpperCase(), TransportKind.TRAIN); 
        TransportKind.SHIP = new TransportKind(3, "SHIP");
        TransportKind.mapIntToEnum.put(TransportKind.SHIP.value(), TransportKind.SHIP); 
        TransportKind.mapStringToEnum.put(TransportKind.SHIP.m_str.toUpperCase(), TransportKind.SHIP); 
        TransportKind.FLY = new TransportKind(4, "FLY");
        TransportKind.mapIntToEnum.put(TransportKind.FLY.value(), TransportKind.FLY); 
        TransportKind.mapStringToEnum.put(TransportKind.FLY.m_str.toUpperCase(), TransportKind.FLY); 
        TransportKind.SPACE = new TransportKind(5, "SPACE");
        TransportKind.mapIntToEnum.put(TransportKind.SPACE.value(), TransportKind.SPACE); 
        TransportKind.mapStringToEnum.put(TransportKind.SPACE.m_str.toUpperCase(), TransportKind.SPACE); 
        TransportKind.m_Values = Array.from(TransportKind.mapIntToEnum.values);
        TransportKind.m_Keys = Array.from(TransportKind.mapIntToEnum.keys);
    }
}


TransportKind.static_constructor();

module.exports = TransportKind