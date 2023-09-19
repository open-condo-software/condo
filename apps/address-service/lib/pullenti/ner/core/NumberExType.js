/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

// Единицы измерения для NumberExToken
class NumberExType {

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
        if(val instanceof NumberExType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(NumberExType.mapStringToEnum.containsKey(val))
                return NumberExType.mapStringToEnum.get(val);
            return null;
        }
        if(NumberExType.mapIntToEnum.containsKey(val))
            return NumberExType.mapIntToEnum.get(val);
        let it = new NumberExType(val, val.toString());
        NumberExType.mapIntToEnum.put(val, it);
        NumberExType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return NumberExType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return NumberExType.m_Values;
    }
    static static_constructor() {
        NumberExType.mapIntToEnum = new Hashtable();
        NumberExType.mapStringToEnum = new Hashtable();
        NumberExType.UNDEFINED = new NumberExType(0, "UNDEFINED");
        NumberExType.mapIntToEnum.put(NumberExType.UNDEFINED.value(), NumberExType.UNDEFINED); 
        NumberExType.mapStringToEnum.put(NumberExType.UNDEFINED.m_str.toUpperCase(), NumberExType.UNDEFINED); 
        NumberExType.PERCENT = new NumberExType(1, "PERCENT");
        NumberExType.mapIntToEnum.put(NumberExType.PERCENT.value(), NumberExType.PERCENT); 
        NumberExType.mapStringToEnum.put(NumberExType.PERCENT.m_str.toUpperCase(), NumberExType.PERCENT); 
        NumberExType.METER = new NumberExType(2, "METER");
        NumberExType.mapIntToEnum.put(NumberExType.METER.value(), NumberExType.METER); 
        NumberExType.mapStringToEnum.put(NumberExType.METER.m_str.toUpperCase(), NumberExType.METER); 
        NumberExType.MILLIMETER = new NumberExType(3, "MILLIMETER");
        NumberExType.mapIntToEnum.put(NumberExType.MILLIMETER.value(), NumberExType.MILLIMETER); 
        NumberExType.mapStringToEnum.put(NumberExType.MILLIMETER.m_str.toUpperCase(), NumberExType.MILLIMETER); 
        NumberExType.KILOMETER = new NumberExType(4, "KILOMETER");
        NumberExType.mapIntToEnum.put(NumberExType.KILOMETER.value(), NumberExType.KILOMETER); 
        NumberExType.mapStringToEnum.put(NumberExType.KILOMETER.m_str.toUpperCase(), NumberExType.KILOMETER); 
        NumberExType.SANTIMETER = new NumberExType(5, "SANTIMETER");
        NumberExType.mapIntToEnum.put(NumberExType.SANTIMETER.value(), NumberExType.SANTIMETER); 
        NumberExType.mapStringToEnum.put(NumberExType.SANTIMETER.m_str.toUpperCase(), NumberExType.SANTIMETER); 
        NumberExType.SANTIMETER2 = new NumberExType(6, "SANTIMETER2");
        NumberExType.mapIntToEnum.put(NumberExType.SANTIMETER2.value(), NumberExType.SANTIMETER2); 
        NumberExType.mapStringToEnum.put(NumberExType.SANTIMETER2.m_str.toUpperCase(), NumberExType.SANTIMETER2); 
        NumberExType.SANTIMETER3 = new NumberExType(7, "SANTIMETER3");
        NumberExType.mapIntToEnum.put(NumberExType.SANTIMETER3.value(), NumberExType.SANTIMETER3); 
        NumberExType.mapStringToEnum.put(NumberExType.SANTIMETER3.m_str.toUpperCase(), NumberExType.SANTIMETER3); 
        NumberExType.METER2 = new NumberExType(8, "METER2");
        NumberExType.mapIntToEnum.put(NumberExType.METER2.value(), NumberExType.METER2); 
        NumberExType.mapStringToEnum.put(NumberExType.METER2.m_str.toUpperCase(), NumberExType.METER2); 
        NumberExType.AR = new NumberExType(9, "AR");
        NumberExType.mapIntToEnum.put(NumberExType.AR.value(), NumberExType.AR); 
        NumberExType.mapStringToEnum.put(NumberExType.AR.m_str.toUpperCase(), NumberExType.AR); 
        NumberExType.GEKTAR = new NumberExType(10, "GEKTAR");
        NumberExType.mapIntToEnum.put(NumberExType.GEKTAR.value(), NumberExType.GEKTAR); 
        NumberExType.mapStringToEnum.put(NumberExType.GEKTAR.m_str.toUpperCase(), NumberExType.GEKTAR); 
        NumberExType.KILOMETER2 = new NumberExType(11, "KILOMETER2");
        NumberExType.mapIntToEnum.put(NumberExType.KILOMETER2.value(), NumberExType.KILOMETER2); 
        NumberExType.mapStringToEnum.put(NumberExType.KILOMETER2.m_str.toUpperCase(), NumberExType.KILOMETER2); 
        NumberExType.METER3 = new NumberExType(12, "METER3");
        NumberExType.mapIntToEnum.put(NumberExType.METER3.value(), NumberExType.METER3); 
        NumberExType.mapStringToEnum.put(NumberExType.METER3.m_str.toUpperCase(), NumberExType.METER3); 
        NumberExType.MILE = new NumberExType(13, "MILE");
        NumberExType.mapIntToEnum.put(NumberExType.MILE.value(), NumberExType.MILE); 
        NumberExType.mapStringToEnum.put(NumberExType.MILE.m_str.toUpperCase(), NumberExType.MILE); 
        NumberExType.GRAMM = new NumberExType(14, "GRAMM");
        NumberExType.mapIntToEnum.put(NumberExType.GRAMM.value(), NumberExType.GRAMM); 
        NumberExType.mapStringToEnum.put(NumberExType.GRAMM.m_str.toUpperCase(), NumberExType.GRAMM); 
        NumberExType.MILLIGRAM = new NumberExType(15, "MILLIGRAM");
        NumberExType.mapIntToEnum.put(NumberExType.MILLIGRAM.value(), NumberExType.MILLIGRAM); 
        NumberExType.mapStringToEnum.put(NumberExType.MILLIGRAM.m_str.toUpperCase(), NumberExType.MILLIGRAM); 
        NumberExType.KILOGRAM = new NumberExType(16, "KILOGRAM");
        NumberExType.mapIntToEnum.put(NumberExType.KILOGRAM.value(), NumberExType.KILOGRAM); 
        NumberExType.mapStringToEnum.put(NumberExType.KILOGRAM.m_str.toUpperCase(), NumberExType.KILOGRAM); 
        NumberExType.TONNA = new NumberExType(17, "TONNA");
        NumberExType.mapIntToEnum.put(NumberExType.TONNA.value(), NumberExType.TONNA); 
        NumberExType.mapStringToEnum.put(NumberExType.TONNA.m_str.toUpperCase(), NumberExType.TONNA); 
        NumberExType.LITR = new NumberExType(18, "LITR");
        NumberExType.mapIntToEnum.put(NumberExType.LITR.value(), NumberExType.LITR); 
        NumberExType.mapStringToEnum.put(NumberExType.LITR.m_str.toUpperCase(), NumberExType.LITR); 
        NumberExType.MILLILITR = new NumberExType(19, "MILLILITR");
        NumberExType.mapIntToEnum.put(NumberExType.MILLILITR.value(), NumberExType.MILLILITR); 
        NumberExType.mapStringToEnum.put(NumberExType.MILLILITR.m_str.toUpperCase(), NumberExType.MILLILITR); 
        NumberExType.HOUR = new NumberExType(20, "HOUR");
        NumberExType.mapIntToEnum.put(NumberExType.HOUR.value(), NumberExType.HOUR); 
        NumberExType.mapStringToEnum.put(NumberExType.HOUR.m_str.toUpperCase(), NumberExType.HOUR); 
        NumberExType.MINUTE = new NumberExType(21, "MINUTE");
        NumberExType.mapIntToEnum.put(NumberExType.MINUTE.value(), NumberExType.MINUTE); 
        NumberExType.mapStringToEnum.put(NumberExType.MINUTE.m_str.toUpperCase(), NumberExType.MINUTE); 
        NumberExType.SECOND = new NumberExType(22, "SECOND");
        NumberExType.mapIntToEnum.put(NumberExType.SECOND.value(), NumberExType.SECOND); 
        NumberExType.mapStringToEnum.put(NumberExType.SECOND.m_str.toUpperCase(), NumberExType.SECOND); 
        NumberExType.YEAR = new NumberExType(23, "YEAR");
        NumberExType.mapIntToEnum.put(NumberExType.YEAR.value(), NumberExType.YEAR); 
        NumberExType.mapStringToEnum.put(NumberExType.YEAR.m_str.toUpperCase(), NumberExType.YEAR); 
        NumberExType.MONTH = new NumberExType(24, "MONTH");
        NumberExType.mapIntToEnum.put(NumberExType.MONTH.value(), NumberExType.MONTH); 
        NumberExType.mapStringToEnum.put(NumberExType.MONTH.m_str.toUpperCase(), NumberExType.MONTH); 
        NumberExType.WEEK = new NumberExType(25, "WEEK");
        NumberExType.mapIntToEnum.put(NumberExType.WEEK.value(), NumberExType.WEEK); 
        NumberExType.mapStringToEnum.put(NumberExType.WEEK.m_str.toUpperCase(), NumberExType.WEEK); 
        NumberExType.DAY = new NumberExType(26, "DAY");
        NumberExType.mapIntToEnum.put(NumberExType.DAY.value(), NumberExType.DAY); 
        NumberExType.mapStringToEnum.put(NumberExType.DAY.m_str.toUpperCase(), NumberExType.DAY); 
        NumberExType.MONEY = new NumberExType(27, "MONEY");
        NumberExType.mapIntToEnum.put(NumberExType.MONEY.value(), NumberExType.MONEY); 
        NumberExType.mapStringToEnum.put(NumberExType.MONEY.m_str.toUpperCase(), NumberExType.MONEY); 
        NumberExType.SHUK = new NumberExType(28, "SHUK");
        NumberExType.mapIntToEnum.put(NumberExType.SHUK.value(), NumberExType.SHUK); 
        NumberExType.mapStringToEnum.put(NumberExType.SHUK.m_str.toUpperCase(), NumberExType.SHUK); 
        NumberExType.UPAK = new NumberExType(29, "UPAK");
        NumberExType.mapIntToEnum.put(NumberExType.UPAK.value(), NumberExType.UPAK); 
        NumberExType.mapStringToEnum.put(NumberExType.UPAK.m_str.toUpperCase(), NumberExType.UPAK); 
        NumberExType.RULON = new NumberExType(30, "RULON");
        NumberExType.mapIntToEnum.put(NumberExType.RULON.value(), NumberExType.RULON); 
        NumberExType.mapStringToEnum.put(NumberExType.RULON.m_str.toUpperCase(), NumberExType.RULON); 
        NumberExType.NABOR = new NumberExType(31, "NABOR");
        NumberExType.mapIntToEnum.put(NumberExType.NABOR.value(), NumberExType.NABOR); 
        NumberExType.mapStringToEnum.put(NumberExType.NABOR.m_str.toUpperCase(), NumberExType.NABOR); 
        NumberExType.KOMPLEKT = new NumberExType(32, "KOMPLEKT");
        NumberExType.mapIntToEnum.put(NumberExType.KOMPLEKT.value(), NumberExType.KOMPLEKT); 
        NumberExType.mapStringToEnum.put(NumberExType.KOMPLEKT.m_str.toUpperCase(), NumberExType.KOMPLEKT); 
        NumberExType.PARA = new NumberExType(33, "PARA");
        NumberExType.mapIntToEnum.put(NumberExType.PARA.value(), NumberExType.PARA); 
        NumberExType.mapStringToEnum.put(NumberExType.PARA.m_str.toUpperCase(), NumberExType.PARA); 
        NumberExType.FLAKON = new NumberExType(34, "FLAKON");
        NumberExType.mapIntToEnum.put(NumberExType.FLAKON.value(), NumberExType.FLAKON); 
        NumberExType.mapStringToEnum.put(NumberExType.FLAKON.m_str.toUpperCase(), NumberExType.FLAKON); 
        NumberExType.m_Values = Array.from(NumberExType.mapIntToEnum.values);
        NumberExType.m_Keys = Array.from(NumberExType.mapIntToEnum.keys);
    }
}


NumberExType.static_constructor();

module.exports = NumberExType