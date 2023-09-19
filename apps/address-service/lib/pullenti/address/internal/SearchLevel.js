/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

class SearchLevel {

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
        if(val instanceof SearchLevel) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(SearchLevel.mapStringToEnum.containsKey(val))
                return SearchLevel.mapStringToEnum.get(val);
            return null;
        }
        if(SearchLevel.mapIntToEnum.containsKey(val))
            return SearchLevel.mapIntToEnum.get(val);
        let it = new SearchLevel(val, val.toString());
        SearchLevel.mapIntToEnum.put(val, it);
        SearchLevel.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return SearchLevel.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return SearchLevel.m_Values;
    }
    static static_constructor() {
        SearchLevel.mapIntToEnum = new Hashtable();
        SearchLevel.mapStringToEnum = new Hashtable();
        SearchLevel.UNDEFINED = new SearchLevel(0, "UNDEFINED");
        SearchLevel.mapIntToEnum.put(SearchLevel.UNDEFINED.value(), SearchLevel.UNDEFINED); 
        SearchLevel.mapStringToEnum.put(SearchLevel.UNDEFINED.m_str.toUpperCase(), SearchLevel.UNDEFINED); 
        SearchLevel.REGION = new SearchLevel(1, "REGION");
        SearchLevel.mapIntToEnum.put(SearchLevel.REGION.value(), SearchLevel.REGION); 
        SearchLevel.mapStringToEnum.put(SearchLevel.REGION.m_str.toUpperCase(), SearchLevel.REGION); 
        SearchLevel.DISTRICT = new SearchLevel(2, "DISTRICT");
        SearchLevel.mapIntToEnum.put(SearchLevel.DISTRICT.value(), SearchLevel.DISTRICT); 
        SearchLevel.mapStringToEnum.put(SearchLevel.DISTRICT.m_str.toUpperCase(), SearchLevel.DISTRICT); 
        SearchLevel.CITY = new SearchLevel(3, "CITY");
        SearchLevel.mapIntToEnum.put(SearchLevel.CITY.value(), SearchLevel.CITY); 
        SearchLevel.mapStringToEnum.put(SearchLevel.CITY.m_str.toUpperCase(), SearchLevel.CITY); 
        SearchLevel.STREET = new SearchLevel(4, "STREET");
        SearchLevel.mapIntToEnum.put(SearchLevel.STREET.value(), SearchLevel.STREET); 
        SearchLevel.mapStringToEnum.put(SearchLevel.STREET.m_str.toUpperCase(), SearchLevel.STREET); 
        SearchLevel.m_Values = Array.from(SearchLevel.mapIntToEnum.values);
        SearchLevel.m_Keys = Array.from(SearchLevel.mapIntToEnum.keys);
    }
}


SearchLevel.static_constructor();

module.exports = SearchLevel