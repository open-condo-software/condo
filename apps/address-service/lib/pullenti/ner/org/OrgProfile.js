/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Профили организации, хранятся в атрибутах ATTR_PROFILE, может быть несколько.
 */
class OrgProfile {

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
        if(val instanceof OrgProfile) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(OrgProfile.mapStringToEnum.containsKey(val))
                return OrgProfile.mapStringToEnum.get(val);
            return null;
        }
        if(OrgProfile.mapIntToEnum.containsKey(val))
            return OrgProfile.mapIntToEnum.get(val);
        let it = new OrgProfile(val, val.toString());
        OrgProfile.mapIntToEnum.put(val, it);
        OrgProfile.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return OrgProfile.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return OrgProfile.m_Values;
    }
    static static_constructor() {
        OrgProfile.mapIntToEnum = new Hashtable();
        OrgProfile.mapStringToEnum = new Hashtable();
        OrgProfile.UNDEFINED = new OrgProfile(0, "UNDEFINED");
        OrgProfile.mapIntToEnum.put(OrgProfile.UNDEFINED.value(), OrgProfile.UNDEFINED); 
        OrgProfile.mapStringToEnum.put(OrgProfile.UNDEFINED.m_str.toUpperCase(), OrgProfile.UNDEFINED); 
        OrgProfile.UNIT = new OrgProfile(1, "UNIT");
        OrgProfile.mapIntToEnum.put(OrgProfile.UNIT.value(), OrgProfile.UNIT); 
        OrgProfile.mapStringToEnum.put(OrgProfile.UNIT.m_str.toUpperCase(), OrgProfile.UNIT); 
        OrgProfile.UNION = new OrgProfile(2, "UNION");
        OrgProfile.mapIntToEnum.put(OrgProfile.UNION.value(), OrgProfile.UNION); 
        OrgProfile.mapStringToEnum.put(OrgProfile.UNION.m_str.toUpperCase(), OrgProfile.UNION); 
        OrgProfile.COMPETITION = new OrgProfile(3, "COMPETITION");
        OrgProfile.mapIntToEnum.put(OrgProfile.COMPETITION.value(), OrgProfile.COMPETITION); 
        OrgProfile.mapStringToEnum.put(OrgProfile.COMPETITION.m_str.toUpperCase(), OrgProfile.COMPETITION); 
        OrgProfile.HOLDING = new OrgProfile(4, "HOLDING");
        OrgProfile.mapIntToEnum.put(OrgProfile.HOLDING.value(), OrgProfile.HOLDING); 
        OrgProfile.mapStringToEnum.put(OrgProfile.HOLDING.m_str.toUpperCase(), OrgProfile.HOLDING); 
        OrgProfile.STATE = new OrgProfile(5, "STATE");
        OrgProfile.mapIntToEnum.put(OrgProfile.STATE.value(), OrgProfile.STATE); 
        OrgProfile.mapStringToEnum.put(OrgProfile.STATE.m_str.toUpperCase(), OrgProfile.STATE); 
        OrgProfile.BUSINESS = new OrgProfile(6, "BUSINESS");
        OrgProfile.mapIntToEnum.put(OrgProfile.BUSINESS.value(), OrgProfile.BUSINESS); 
        OrgProfile.mapStringToEnum.put(OrgProfile.BUSINESS.m_str.toUpperCase(), OrgProfile.BUSINESS); 
        OrgProfile.FINANCE = new OrgProfile(7, "FINANCE");
        OrgProfile.mapIntToEnum.put(OrgProfile.FINANCE.value(), OrgProfile.FINANCE); 
        OrgProfile.mapStringToEnum.put(OrgProfile.FINANCE.m_str.toUpperCase(), OrgProfile.FINANCE); 
        OrgProfile.EDUCATION = new OrgProfile(8, "EDUCATION");
        OrgProfile.mapIntToEnum.put(OrgProfile.EDUCATION.value(), OrgProfile.EDUCATION); 
        OrgProfile.mapStringToEnum.put(OrgProfile.EDUCATION.m_str.toUpperCase(), OrgProfile.EDUCATION); 
        OrgProfile.SCIENCE = new OrgProfile(9, "SCIENCE");
        OrgProfile.mapIntToEnum.put(OrgProfile.SCIENCE.value(), OrgProfile.SCIENCE); 
        OrgProfile.mapStringToEnum.put(OrgProfile.SCIENCE.m_str.toUpperCase(), OrgProfile.SCIENCE); 
        OrgProfile.INDUSTRY = new OrgProfile(10, "INDUSTRY");
        OrgProfile.mapIntToEnum.put(OrgProfile.INDUSTRY.value(), OrgProfile.INDUSTRY); 
        OrgProfile.mapStringToEnum.put(OrgProfile.INDUSTRY.m_str.toUpperCase(), OrgProfile.INDUSTRY); 
        OrgProfile.TRADE = new OrgProfile(11, "TRADE");
        OrgProfile.mapIntToEnum.put(OrgProfile.TRADE.value(), OrgProfile.TRADE); 
        OrgProfile.mapStringToEnum.put(OrgProfile.TRADE.m_str.toUpperCase(), OrgProfile.TRADE); 
        OrgProfile.MEDICINE = new OrgProfile(12, "MEDICINE");
        OrgProfile.mapIntToEnum.put(OrgProfile.MEDICINE.value(), OrgProfile.MEDICINE); 
        OrgProfile.mapStringToEnum.put(OrgProfile.MEDICINE.m_str.toUpperCase(), OrgProfile.MEDICINE); 
        OrgProfile.POLICY = new OrgProfile(13, "POLICY");
        OrgProfile.mapIntToEnum.put(OrgProfile.POLICY.value(), OrgProfile.POLICY); 
        OrgProfile.mapStringToEnum.put(OrgProfile.POLICY.m_str.toUpperCase(), OrgProfile.POLICY); 
        OrgProfile.JUSTICE = new OrgProfile(14, "JUSTICE");
        OrgProfile.mapIntToEnum.put(OrgProfile.JUSTICE.value(), OrgProfile.JUSTICE); 
        OrgProfile.mapStringToEnum.put(OrgProfile.JUSTICE.m_str.toUpperCase(), OrgProfile.JUSTICE); 
        OrgProfile.ENFORCEMENT = new OrgProfile(15, "ENFORCEMENT");
        OrgProfile.mapIntToEnum.put(OrgProfile.ENFORCEMENT.value(), OrgProfile.ENFORCEMENT); 
        OrgProfile.mapStringToEnum.put(OrgProfile.ENFORCEMENT.m_str.toUpperCase(), OrgProfile.ENFORCEMENT); 
        OrgProfile.ARMY = new OrgProfile(16, "ARMY");
        OrgProfile.mapIntToEnum.put(OrgProfile.ARMY.value(), OrgProfile.ARMY); 
        OrgProfile.mapStringToEnum.put(OrgProfile.ARMY.m_str.toUpperCase(), OrgProfile.ARMY); 
        OrgProfile.SPORT = new OrgProfile(17, "SPORT");
        OrgProfile.mapIntToEnum.put(OrgProfile.SPORT.value(), OrgProfile.SPORT); 
        OrgProfile.mapStringToEnum.put(OrgProfile.SPORT.m_str.toUpperCase(), OrgProfile.SPORT); 
        OrgProfile.RELIGION = new OrgProfile(18, "RELIGION");
        OrgProfile.mapIntToEnum.put(OrgProfile.RELIGION.value(), OrgProfile.RELIGION); 
        OrgProfile.mapStringToEnum.put(OrgProfile.RELIGION.m_str.toUpperCase(), OrgProfile.RELIGION); 
        OrgProfile.CULTURE = new OrgProfile(19, "CULTURE");
        OrgProfile.mapIntToEnum.put(OrgProfile.CULTURE.value(), OrgProfile.CULTURE); 
        OrgProfile.mapStringToEnum.put(OrgProfile.CULTURE.m_str.toUpperCase(), OrgProfile.CULTURE); 
        OrgProfile.MUSIC = new OrgProfile(20, "MUSIC");
        OrgProfile.mapIntToEnum.put(OrgProfile.MUSIC.value(), OrgProfile.MUSIC); 
        OrgProfile.mapStringToEnum.put(OrgProfile.MUSIC.m_str.toUpperCase(), OrgProfile.MUSIC); 
        OrgProfile.SHOW = new OrgProfile(21, "SHOW");
        OrgProfile.mapIntToEnum.put(OrgProfile.SHOW.value(), OrgProfile.SHOW); 
        OrgProfile.mapStringToEnum.put(OrgProfile.SHOW.m_str.toUpperCase(), OrgProfile.SHOW); 
        OrgProfile.MEDIA = new OrgProfile(22, "MEDIA");
        OrgProfile.mapIntToEnum.put(OrgProfile.MEDIA.value(), OrgProfile.MEDIA); 
        OrgProfile.mapStringToEnum.put(OrgProfile.MEDIA.m_str.toUpperCase(), OrgProfile.MEDIA); 
        OrgProfile.PRESS = new OrgProfile(23, "PRESS");
        OrgProfile.mapIntToEnum.put(OrgProfile.PRESS.value(), OrgProfile.PRESS); 
        OrgProfile.mapStringToEnum.put(OrgProfile.PRESS.m_str.toUpperCase(), OrgProfile.PRESS); 
        OrgProfile.HOTEL = new OrgProfile(24, "HOTEL");
        OrgProfile.mapIntToEnum.put(OrgProfile.HOTEL.value(), OrgProfile.HOTEL); 
        OrgProfile.mapStringToEnum.put(OrgProfile.HOTEL.m_str.toUpperCase(), OrgProfile.HOTEL); 
        OrgProfile.FOOD = new OrgProfile(25, "FOOD");
        OrgProfile.mapIntToEnum.put(OrgProfile.FOOD.value(), OrgProfile.FOOD); 
        OrgProfile.mapStringToEnum.put(OrgProfile.FOOD.m_str.toUpperCase(), OrgProfile.FOOD); 
        OrgProfile.TRANSPORT = new OrgProfile(26, "TRANSPORT");
        OrgProfile.mapIntToEnum.put(OrgProfile.TRANSPORT.value(), OrgProfile.TRANSPORT); 
        OrgProfile.mapStringToEnum.put(OrgProfile.TRANSPORT.m_str.toUpperCase(), OrgProfile.TRANSPORT); 
        OrgProfile.m_Values = Array.from(OrgProfile.mapIntToEnum.values);
        OrgProfile.m_Keys = Array.from(OrgProfile.mapIntToEnum.keys);
    }
}


OrgProfile.static_constructor();

module.exports = OrgProfile