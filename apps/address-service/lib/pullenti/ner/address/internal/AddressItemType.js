/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class AddressItemType {

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
        if(val instanceof AddressItemType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(AddressItemType.mapStringToEnum.containsKey(val))
                return AddressItemType.mapStringToEnum.get(val);
            return null;
        }
        if(AddressItemType.mapIntToEnum.containsKey(val))
            return AddressItemType.mapIntToEnum.get(val);
        let it = new AddressItemType(val, val.toString());
        AddressItemType.mapIntToEnum.put(val, it);
        AddressItemType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return AddressItemType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return AddressItemType.m_Values;
    }
    static static_constructor() {
        AddressItemType.mapIntToEnum = new Hashtable();
        AddressItemType.mapStringToEnum = new Hashtable();
        AddressItemType.PREFIX = new AddressItemType(0, "PREFIX");
        AddressItemType.mapIntToEnum.put(AddressItemType.PREFIX.value(), AddressItemType.PREFIX); 
        AddressItemType.mapStringToEnum.put(AddressItemType.PREFIX.m_str.toUpperCase(), AddressItemType.PREFIX); 
        AddressItemType.STREET = new AddressItemType(1, "STREET");
        AddressItemType.mapIntToEnum.put(AddressItemType.STREET.value(), AddressItemType.STREET); 
        AddressItemType.mapStringToEnum.put(AddressItemType.STREET.m_str.toUpperCase(), AddressItemType.STREET); 
        AddressItemType.HOUSE = new AddressItemType(2, "HOUSE");
        AddressItemType.mapIntToEnum.put(AddressItemType.HOUSE.value(), AddressItemType.HOUSE); 
        AddressItemType.mapStringToEnum.put(AddressItemType.HOUSE.m_str.toUpperCase(), AddressItemType.HOUSE); 
        AddressItemType.BUILDING = new AddressItemType(3, "BUILDING");
        AddressItemType.mapIntToEnum.put(AddressItemType.BUILDING.value(), AddressItemType.BUILDING); 
        AddressItemType.mapStringToEnum.put(AddressItemType.BUILDING.m_str.toUpperCase(), AddressItemType.BUILDING); 
        AddressItemType.CORPUS = new AddressItemType(4, "CORPUS");
        AddressItemType.mapIntToEnum.put(AddressItemType.CORPUS.value(), AddressItemType.CORPUS); 
        AddressItemType.mapStringToEnum.put(AddressItemType.CORPUS.m_str.toUpperCase(), AddressItemType.CORPUS); 
        AddressItemType.POTCH = new AddressItemType(5, "POTCH");
        AddressItemType.mapIntToEnum.put(AddressItemType.POTCH.value(), AddressItemType.POTCH); 
        AddressItemType.mapStringToEnum.put(AddressItemType.POTCH.m_str.toUpperCase(), AddressItemType.POTCH); 
        AddressItemType.FLOOR = new AddressItemType(6, "FLOOR");
        AddressItemType.mapIntToEnum.put(AddressItemType.FLOOR.value(), AddressItemType.FLOOR); 
        AddressItemType.mapStringToEnum.put(AddressItemType.FLOOR.m_str.toUpperCase(), AddressItemType.FLOOR); 
        AddressItemType.FLAT = new AddressItemType(7, "FLAT");
        AddressItemType.mapIntToEnum.put(AddressItemType.FLAT.value(), AddressItemType.FLAT); 
        AddressItemType.mapStringToEnum.put(AddressItemType.FLAT.m_str.toUpperCase(), AddressItemType.FLAT); 
        AddressItemType.CORPUSORFLAT = new AddressItemType(8, "CORPUSORFLAT");
        AddressItemType.mapIntToEnum.put(AddressItemType.CORPUSORFLAT.value(), AddressItemType.CORPUSORFLAT); 
        AddressItemType.mapStringToEnum.put(AddressItemType.CORPUSORFLAT.m_str.toUpperCase(), AddressItemType.CORPUSORFLAT); 
        AddressItemType.OFFICE = new AddressItemType(9, "OFFICE");
        AddressItemType.mapIntToEnum.put(AddressItemType.OFFICE.value(), AddressItemType.OFFICE); 
        AddressItemType.mapStringToEnum.put(AddressItemType.OFFICE.m_str.toUpperCase(), AddressItemType.OFFICE); 
        AddressItemType.ROOM = new AddressItemType(10, "ROOM");
        AddressItemType.mapIntToEnum.put(AddressItemType.ROOM.value(), AddressItemType.ROOM); 
        AddressItemType.mapStringToEnum.put(AddressItemType.ROOM.m_str.toUpperCase(), AddressItemType.ROOM); 
        AddressItemType.PLOT = new AddressItemType(11, "PLOT");
        AddressItemType.mapIntToEnum.put(AddressItemType.PLOT.value(), AddressItemType.PLOT); 
        AddressItemType.mapStringToEnum.put(AddressItemType.PLOT.m_str.toUpperCase(), AddressItemType.PLOT); 
        AddressItemType.FIELD = new AddressItemType(12, "FIELD");
        AddressItemType.mapIntToEnum.put(AddressItemType.FIELD.value(), AddressItemType.FIELD); 
        AddressItemType.mapStringToEnum.put(AddressItemType.FIELD.m_str.toUpperCase(), AddressItemType.FIELD); 
        AddressItemType.GENPLAN = new AddressItemType(13, "GENPLAN");
        AddressItemType.mapIntToEnum.put(AddressItemType.GENPLAN.value(), AddressItemType.GENPLAN); 
        AddressItemType.mapStringToEnum.put(AddressItemType.GENPLAN.m_str.toUpperCase(), AddressItemType.GENPLAN); 
        AddressItemType.PAVILION = new AddressItemType(14, "PAVILION");
        AddressItemType.mapIntToEnum.put(AddressItemType.PAVILION.value(), AddressItemType.PAVILION); 
        AddressItemType.mapStringToEnum.put(AddressItemType.PAVILION.m_str.toUpperCase(), AddressItemType.PAVILION); 
        AddressItemType.BLOCK = new AddressItemType(15, "BLOCK");
        AddressItemType.mapIntToEnum.put(AddressItemType.BLOCK.value(), AddressItemType.BLOCK); 
        AddressItemType.mapStringToEnum.put(AddressItemType.BLOCK.m_str.toUpperCase(), AddressItemType.BLOCK); 
        AddressItemType.BOX = new AddressItemType(16, "BOX");
        AddressItemType.mapIntToEnum.put(AddressItemType.BOX.value(), AddressItemType.BOX); 
        AddressItemType.mapStringToEnum.put(AddressItemType.BOX.m_str.toUpperCase(), AddressItemType.BOX); 
        AddressItemType.PANTRY = new AddressItemType(17, "PANTRY");
        AddressItemType.mapIntToEnum.put(AddressItemType.PANTRY.value(), AddressItemType.PANTRY); 
        AddressItemType.mapStringToEnum.put(AddressItemType.PANTRY.m_str.toUpperCase(), AddressItemType.PANTRY); 
        AddressItemType.WELL = new AddressItemType(18, "WELL");
        AddressItemType.mapIntToEnum.put(AddressItemType.WELL.value(), AddressItemType.WELL); 
        AddressItemType.mapStringToEnum.put(AddressItemType.WELL.m_str.toUpperCase(), AddressItemType.WELL); 
        AddressItemType.CARPLACE = new AddressItemType(19, "CARPLACE");
        AddressItemType.mapIntToEnum.put(AddressItemType.CARPLACE.value(), AddressItemType.CARPLACE); 
        AddressItemType.mapStringToEnum.put(AddressItemType.CARPLACE.m_str.toUpperCase(), AddressItemType.CARPLACE); 
        AddressItemType.PART = new AddressItemType(20, "PART");
        AddressItemType.mapIntToEnum.put(AddressItemType.PART.value(), AddressItemType.PART); 
        AddressItemType.mapStringToEnum.put(AddressItemType.PART.m_str.toUpperCase(), AddressItemType.PART); 
        AddressItemType.SPACE = new AddressItemType(21, "SPACE");
        AddressItemType.mapIntToEnum.put(AddressItemType.SPACE.value(), AddressItemType.SPACE); 
        AddressItemType.mapStringToEnum.put(AddressItemType.SPACE.m_str.toUpperCase(), AddressItemType.SPACE); 
        AddressItemType.CITY = new AddressItemType(22, "CITY");
        AddressItemType.mapIntToEnum.put(AddressItemType.CITY.value(), AddressItemType.CITY); 
        AddressItemType.mapStringToEnum.put(AddressItemType.CITY.m_str.toUpperCase(), AddressItemType.CITY); 
        AddressItemType.REGION = new AddressItemType(23, "REGION");
        AddressItemType.mapIntToEnum.put(AddressItemType.REGION.value(), AddressItemType.REGION); 
        AddressItemType.mapStringToEnum.put(AddressItemType.REGION.m_str.toUpperCase(), AddressItemType.REGION); 
        AddressItemType.COUNTRY = new AddressItemType(24, "COUNTRY");
        AddressItemType.mapIntToEnum.put(AddressItemType.COUNTRY.value(), AddressItemType.COUNTRY); 
        AddressItemType.mapStringToEnum.put(AddressItemType.COUNTRY.m_str.toUpperCase(), AddressItemType.COUNTRY); 
        AddressItemType.NUMBER = new AddressItemType(25, "NUMBER");
        AddressItemType.mapIntToEnum.put(AddressItemType.NUMBER.value(), AddressItemType.NUMBER); 
        AddressItemType.mapStringToEnum.put(AddressItemType.NUMBER.m_str.toUpperCase(), AddressItemType.NUMBER); 
        AddressItemType.NONUMBER = new AddressItemType(26, "NONUMBER");
        AddressItemType.mapIntToEnum.put(AddressItemType.NONUMBER.value(), AddressItemType.NONUMBER); 
        AddressItemType.mapStringToEnum.put(AddressItemType.NONUMBER.m_str.toUpperCase(), AddressItemType.NONUMBER); 
        AddressItemType.KILOMETER = new AddressItemType(27, "KILOMETER");
        AddressItemType.mapIntToEnum.put(AddressItemType.KILOMETER.value(), AddressItemType.KILOMETER); 
        AddressItemType.mapStringToEnum.put(AddressItemType.KILOMETER.m_str.toUpperCase(), AddressItemType.KILOMETER); 
        AddressItemType.ZIP = new AddressItemType(28, "ZIP");
        AddressItemType.mapIntToEnum.put(AddressItemType.ZIP.value(), AddressItemType.ZIP); 
        AddressItemType.mapStringToEnum.put(AddressItemType.ZIP.m_str.toUpperCase(), AddressItemType.ZIP); 
        AddressItemType.POSTOFFICEBOX = new AddressItemType(29, "POSTOFFICEBOX");
        AddressItemType.mapIntToEnum.put(AddressItemType.POSTOFFICEBOX.value(), AddressItemType.POSTOFFICEBOX); 
        AddressItemType.mapStringToEnum.put(AddressItemType.POSTOFFICEBOX.m_str.toUpperCase(), AddressItemType.POSTOFFICEBOX); 
        AddressItemType.DELIVERYAREA = new AddressItemType(30, "DELIVERYAREA");
        AddressItemType.mapIntToEnum.put(AddressItemType.DELIVERYAREA.value(), AddressItemType.DELIVERYAREA); 
        AddressItemType.mapStringToEnum.put(AddressItemType.DELIVERYAREA.m_str.toUpperCase(), AddressItemType.DELIVERYAREA); 
        AddressItemType.CSP = new AddressItemType(31, "CSP");
        AddressItemType.mapIntToEnum.put(AddressItemType.CSP.value(), AddressItemType.CSP); 
        AddressItemType.mapStringToEnum.put(AddressItemType.CSP.m_str.toUpperCase(), AddressItemType.CSP); 
        AddressItemType.DETAIL = new AddressItemType(32, "DETAIL");
        AddressItemType.mapIntToEnum.put(AddressItemType.DETAIL.value(), AddressItemType.DETAIL); 
        AddressItemType.mapStringToEnum.put(AddressItemType.DETAIL.m_str.toUpperCase(), AddressItemType.DETAIL); 
        AddressItemType.m_Values = Array.from(AddressItemType.mapIntToEnum.values);
        AddressItemType.m_Keys = Array.from(AddressItemType.mapIntToEnum.keys);
    }
}


AddressItemType.static_constructor();

module.exports = AddressItemType