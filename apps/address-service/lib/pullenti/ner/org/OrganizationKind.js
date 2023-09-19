/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Категории организаций. Не хранятся, а вычисляются на основе других атрибутов.
 */
class OrganizationKind {

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
        if(val instanceof OrganizationKind) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(OrganizationKind.mapStringToEnum.containsKey(val))
                return OrganizationKind.mapStringToEnum.get(val);
            return null;
        }
        if(OrganizationKind.mapIntToEnum.containsKey(val))
            return OrganizationKind.mapIntToEnum.get(val);
        let it = new OrganizationKind(val, val.toString());
        OrganizationKind.mapIntToEnum.put(val, it);
        OrganizationKind.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return OrganizationKind.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return OrganizationKind.m_Values;
    }
    static static_constructor() {
        OrganizationKind.mapIntToEnum = new Hashtable();
        OrganizationKind.mapStringToEnum = new Hashtable();
        OrganizationKind.UNDEFINED = new OrganizationKind(0, "UNDEFINED");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.UNDEFINED.value(), OrganizationKind.UNDEFINED); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.UNDEFINED.m_str.toUpperCase(), OrganizationKind.UNDEFINED); 
        OrganizationKind.GOVENMENT = new OrganizationKind(1, "GOVENMENT");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.GOVENMENT.value(), OrganizationKind.GOVENMENT); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.GOVENMENT.m_str.toUpperCase(), OrganizationKind.GOVENMENT); 
        OrganizationKind.PARTY = new OrganizationKind(2, "PARTY");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.PARTY.value(), OrganizationKind.PARTY); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.PARTY.m_str.toUpperCase(), OrganizationKind.PARTY); 
        OrganizationKind.STUDY = new OrganizationKind(3, "STUDY");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.STUDY.value(), OrganizationKind.STUDY); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.STUDY.m_str.toUpperCase(), OrganizationKind.STUDY); 
        OrganizationKind.SCIENCE = new OrganizationKind(4, "SCIENCE");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.SCIENCE.value(), OrganizationKind.SCIENCE); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.SCIENCE.m_str.toUpperCase(), OrganizationKind.SCIENCE); 
        OrganizationKind.PRESS = new OrganizationKind(5, "PRESS");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.PRESS.value(), OrganizationKind.PRESS); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.PRESS.m_str.toUpperCase(), OrganizationKind.PRESS); 
        OrganizationKind.MEDIA = new OrganizationKind(6, "MEDIA");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.MEDIA.value(), OrganizationKind.MEDIA); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.MEDIA.m_str.toUpperCase(), OrganizationKind.MEDIA); 
        OrganizationKind.FACTORY = new OrganizationKind(7, "FACTORY");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.FACTORY.value(), OrganizationKind.FACTORY); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.FACTORY.m_str.toUpperCase(), OrganizationKind.FACTORY); 
        OrganizationKind.BANK = new OrganizationKind(8, "BANK");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.BANK.value(), OrganizationKind.BANK); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.BANK.m_str.toUpperCase(), OrganizationKind.BANK); 
        OrganizationKind.CULTURE = new OrganizationKind(9, "CULTURE");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.CULTURE.value(), OrganizationKind.CULTURE); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.CULTURE.m_str.toUpperCase(), OrganizationKind.CULTURE); 
        OrganizationKind.MEDICAL = new OrganizationKind(10, "MEDICAL");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.MEDICAL.value(), OrganizationKind.MEDICAL); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.MEDICAL.m_str.toUpperCase(), OrganizationKind.MEDICAL); 
        OrganizationKind.TRADE = new OrganizationKind(11, "TRADE");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.TRADE.value(), OrganizationKind.TRADE); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.TRADE.m_str.toUpperCase(), OrganizationKind.TRADE); 
        OrganizationKind.HOLDING = new OrganizationKind(12, "HOLDING");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.HOLDING.value(), OrganizationKind.HOLDING); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.HOLDING.m_str.toUpperCase(), OrganizationKind.HOLDING); 
        OrganizationKind.DEPARTMENT = new OrganizationKind(13, "DEPARTMENT");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.DEPARTMENT.value(), OrganizationKind.DEPARTMENT); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.DEPARTMENT.m_str.toUpperCase(), OrganizationKind.DEPARTMENT); 
        OrganizationKind.FEDERATION = new OrganizationKind(14, "FEDERATION");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.FEDERATION.value(), OrganizationKind.FEDERATION); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.FEDERATION.m_str.toUpperCase(), OrganizationKind.FEDERATION); 
        OrganizationKind.HOTEL = new OrganizationKind(15, "HOTEL");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.HOTEL.value(), OrganizationKind.HOTEL); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.HOTEL.m_str.toUpperCase(), OrganizationKind.HOTEL); 
        OrganizationKind.JUSTICE = new OrganizationKind(16, "JUSTICE");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.JUSTICE.value(), OrganizationKind.JUSTICE); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.JUSTICE.m_str.toUpperCase(), OrganizationKind.JUSTICE); 
        OrganizationKind.CHURCH = new OrganizationKind(17, "CHURCH");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.CHURCH.value(), OrganizationKind.CHURCH); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.CHURCH.m_str.toUpperCase(), OrganizationKind.CHURCH); 
        OrganizationKind.MILITARY = new OrganizationKind(18, "MILITARY");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.MILITARY.value(), OrganizationKind.MILITARY); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.MILITARY.m_str.toUpperCase(), OrganizationKind.MILITARY); 
        OrganizationKind.AIRPORT = new OrganizationKind(19, "AIRPORT");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.AIRPORT.value(), OrganizationKind.AIRPORT); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.AIRPORT.m_str.toUpperCase(), OrganizationKind.AIRPORT); 
        OrganizationKind.SEAPORT = new OrganizationKind(20, "SEAPORT");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.SEAPORT.value(), OrganizationKind.SEAPORT); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.SEAPORT.m_str.toUpperCase(), OrganizationKind.SEAPORT); 
        OrganizationKind.FESTIVAL = new OrganizationKind(21, "FESTIVAL");
        OrganizationKind.mapIntToEnum.put(OrganizationKind.FESTIVAL.value(), OrganizationKind.FESTIVAL); 
        OrganizationKind.mapStringToEnum.put(OrganizationKind.FESTIVAL.m_str.toUpperCase(), OrganizationKind.FESTIVAL); 
        OrganizationKind.m_Values = Array.from(OrganizationKind.mapIntToEnum.values);
        OrganizationKind.m_Keys = Array.from(OrganizationKind.mapIntToEnum.keys);
    }
}


OrganizationKind.static_constructor();

module.exports = OrganizationKind