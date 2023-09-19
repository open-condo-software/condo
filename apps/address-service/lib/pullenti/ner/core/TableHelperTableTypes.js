/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

class TableHelperTableTypes {

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
        if(val instanceof TableHelperTableTypes) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(TableHelperTableTypes.mapStringToEnum.containsKey(val))
                return TableHelperTableTypes.mapStringToEnum.get(val);
            return null;
        }
        if(TableHelperTableTypes.mapIntToEnum.containsKey(val))
            return TableHelperTableTypes.mapIntToEnum.get(val);
        let it = new TableHelperTableTypes(val, val.toString());
        TableHelperTableTypes.mapIntToEnum.put(val, it);
        TableHelperTableTypes.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return TableHelperTableTypes.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return TableHelperTableTypes.m_Values;
    }
    static static_constructor() {
        TableHelperTableTypes.mapIntToEnum = new Hashtable();
        TableHelperTableTypes.mapStringToEnum = new Hashtable();
        TableHelperTableTypes.UNDEFINED = new TableHelperTableTypes(0, "UNDEFINED");
        TableHelperTableTypes.mapIntToEnum.put(TableHelperTableTypes.UNDEFINED.value(), TableHelperTableTypes.UNDEFINED); 
        TableHelperTableTypes.mapStringToEnum.put(TableHelperTableTypes.UNDEFINED.m_str.toUpperCase(), TableHelperTableTypes.UNDEFINED); 
        TableHelperTableTypes.TABLESTART = new TableHelperTableTypes(1, "TABLESTART");
        TableHelperTableTypes.mapIntToEnum.put(TableHelperTableTypes.TABLESTART.value(), TableHelperTableTypes.TABLESTART); 
        TableHelperTableTypes.mapStringToEnum.put(TableHelperTableTypes.TABLESTART.m_str.toUpperCase(), TableHelperTableTypes.TABLESTART); 
        TableHelperTableTypes.TABLEEND = new TableHelperTableTypes(2, "TABLEEND");
        TableHelperTableTypes.mapIntToEnum.put(TableHelperTableTypes.TABLEEND.value(), TableHelperTableTypes.TABLEEND); 
        TableHelperTableTypes.mapStringToEnum.put(TableHelperTableTypes.TABLEEND.m_str.toUpperCase(), TableHelperTableTypes.TABLEEND); 
        TableHelperTableTypes.ROWEND = new TableHelperTableTypes(3, "ROWEND");
        TableHelperTableTypes.mapIntToEnum.put(TableHelperTableTypes.ROWEND.value(), TableHelperTableTypes.ROWEND); 
        TableHelperTableTypes.mapStringToEnum.put(TableHelperTableTypes.ROWEND.m_str.toUpperCase(), TableHelperTableTypes.ROWEND); 
        TableHelperTableTypes.CELLEND = new TableHelperTableTypes(4, "CELLEND");
        TableHelperTableTypes.mapIntToEnum.put(TableHelperTableTypes.CELLEND.value(), TableHelperTableTypes.CELLEND); 
        TableHelperTableTypes.mapStringToEnum.put(TableHelperTableTypes.CELLEND.m_str.toUpperCase(), TableHelperTableTypes.CELLEND); 
        TableHelperTableTypes.m_Values = Array.from(TableHelperTableTypes.mapIntToEnum.values);
        TableHelperTableTypes.m_Keys = Array.from(TableHelperTableTypes.mapIntToEnum.keys);
    }
}


TableHelperTableTypes.static_constructor();

module.exports = TableHelperTableTypes