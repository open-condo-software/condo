/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Типы бизнес-фактов
 */
class BusinessFactKind {

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
        if(val instanceof BusinessFactKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(BusinessFactKind.mapStringToEnum.containsKey(val))
                return BusinessFactKind.mapStringToEnum.get(val);
            return null;
        }
        if(BusinessFactKind.mapIntToEnum.containsKey(val))
            return BusinessFactKind.mapIntToEnum.get(val);
        let it = new BusinessFactKind(val, val.toString());
        BusinessFactKind.mapIntToEnum.put(val, it);
        BusinessFactKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return BusinessFactKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return BusinessFactKind.m_Values;
    }
    static static_constructor() {
        BusinessFactKind.mapIntToEnum = new Hashtable();
        BusinessFactKind.mapStringToEnum = new Hashtable();
        BusinessFactKind.UNDEFINED = new BusinessFactKind(0, "UNDEFINED");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.UNDEFINED.value(), BusinessFactKind.UNDEFINED); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.UNDEFINED.m_str.toUpperCase(), BusinessFactKind.UNDEFINED); 
        BusinessFactKind.CREATE = new BusinessFactKind(1, "CREATE");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.CREATE.value(), BusinessFactKind.CREATE); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.CREATE.m_str.toUpperCase(), BusinessFactKind.CREATE); 
        BusinessFactKind.DELETE = new BusinessFactKind(2, "DELETE");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.DELETE.value(), BusinessFactKind.DELETE); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.DELETE.m_str.toUpperCase(), BusinessFactKind.DELETE); 
        BusinessFactKind.GET = new BusinessFactKind(3, "GET");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.GET.value(), BusinessFactKind.GET); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.GET.m_str.toUpperCase(), BusinessFactKind.GET); 
        BusinessFactKind.SELL = new BusinessFactKind(4, "SELL");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.SELL.value(), BusinessFactKind.SELL); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.SELL.m_str.toUpperCase(), BusinessFactKind.SELL); 
        BusinessFactKind.HAVE = new BusinessFactKind(5, "HAVE");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.HAVE.value(), BusinessFactKind.HAVE); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.HAVE.m_str.toUpperCase(), BusinessFactKind.HAVE); 
        BusinessFactKind.PROFIT = new BusinessFactKind(6, "PROFIT");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.PROFIT.value(), BusinessFactKind.PROFIT); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.PROFIT.m_str.toUpperCase(), BusinessFactKind.PROFIT); 
        BusinessFactKind.DAMAGES = new BusinessFactKind(7, "DAMAGES");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.DAMAGES.value(), BusinessFactKind.DAMAGES); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.DAMAGES.m_str.toUpperCase(), BusinessFactKind.DAMAGES); 
        BusinessFactKind.AGREEMENT = new BusinessFactKind(8, "AGREEMENT");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.AGREEMENT.value(), BusinessFactKind.AGREEMENT); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.AGREEMENT.m_str.toUpperCase(), BusinessFactKind.AGREEMENT); 
        BusinessFactKind.SUBSIDIARY = new BusinessFactKind(9, "SUBSIDIARY");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.SUBSIDIARY.value(), BusinessFactKind.SUBSIDIARY); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.SUBSIDIARY.m_str.toUpperCase(), BusinessFactKind.SUBSIDIARY); 
        BusinessFactKind.FINANCE = new BusinessFactKind(10, "FINANCE");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.FINANCE.value(), BusinessFactKind.FINANCE); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.FINANCE.m_str.toUpperCase(), BusinessFactKind.FINANCE); 
        BusinessFactKind.LAWSUIT = new BusinessFactKind(11, "LAWSUIT");
        BusinessFactKind.mapIntToEnum.put(BusinessFactKind.LAWSUIT.value(), BusinessFactKind.LAWSUIT); 
        BusinessFactKind.mapStringToEnum.put(BusinessFactKind.LAWSUIT.m_str.toUpperCase(), BusinessFactKind.LAWSUIT); 
        BusinessFactKind.m_Values = Array.from(BusinessFactKind.mapIntToEnum.values);
        BusinessFactKind.m_Keys = Array.from(BusinessFactKind.mapIntToEnum.keys);
    }
}


BusinessFactKind.static_constructor();

module.exports = BusinessFactKind