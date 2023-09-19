/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class BlkTyps {

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
        if(val instanceof BlkTyps) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(BlkTyps.mapStringToEnum.containsKey(val))
                return BlkTyps.mapStringToEnum.get(val);
            return null;
        }
        if(BlkTyps.mapIntToEnum.containsKey(val))
            return BlkTyps.mapIntToEnum.get(val);
        let it = new BlkTyps(val, val.toString());
        BlkTyps.mapIntToEnum.put(val, it);
        BlkTyps.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return BlkTyps.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return BlkTyps.m_Values;
    }
    static static_constructor() {
        BlkTyps.mapIntToEnum = new Hashtable();
        BlkTyps.mapStringToEnum = new Hashtable();
        BlkTyps.UNDEFINED = new BlkTyps(0, "UNDEFINED");
        BlkTyps.mapIntToEnum.put(BlkTyps.UNDEFINED.value(), BlkTyps.UNDEFINED); 
        BlkTyps.mapStringToEnum.put(BlkTyps.UNDEFINED.m_str.toUpperCase(), BlkTyps.UNDEFINED); 
        BlkTyps.INDEX = new BlkTyps(1, "INDEX");
        BlkTyps.mapIntToEnum.put(BlkTyps.INDEX.value(), BlkTyps.INDEX); 
        BlkTyps.mapStringToEnum.put(BlkTyps.INDEX.m_str.toUpperCase(), BlkTyps.INDEX); 
        BlkTyps.INDEXITEM = new BlkTyps(2, "INDEXITEM");
        BlkTyps.mapIntToEnum.put(BlkTyps.INDEXITEM.value(), BlkTyps.INDEXITEM); 
        BlkTyps.mapStringToEnum.put(BlkTyps.INDEXITEM.m_str.toUpperCase(), BlkTyps.INDEXITEM); 
        BlkTyps.INTRO = new BlkTyps(3, "INTRO");
        BlkTyps.mapIntToEnum.put(BlkTyps.INTRO.value(), BlkTyps.INTRO); 
        BlkTyps.mapStringToEnum.put(BlkTyps.INTRO.m_str.toUpperCase(), BlkTyps.INTRO); 
        BlkTyps.LITERATURE = new BlkTyps(4, "LITERATURE");
        BlkTyps.mapIntToEnum.put(BlkTyps.LITERATURE.value(), BlkTyps.LITERATURE); 
        BlkTyps.mapStringToEnum.put(BlkTyps.LITERATURE.m_str.toUpperCase(), BlkTyps.LITERATURE); 
        BlkTyps.APPENDIX = new BlkTyps(5, "APPENDIX");
        BlkTyps.mapIntToEnum.put(BlkTyps.APPENDIX.value(), BlkTyps.APPENDIX); 
        BlkTyps.mapStringToEnum.put(BlkTyps.APPENDIX.m_str.toUpperCase(), BlkTyps.APPENDIX); 
        BlkTyps.CONSLUSION = new BlkTyps(6, "CONSLUSION");
        BlkTyps.mapIntToEnum.put(BlkTyps.CONSLUSION.value(), BlkTyps.CONSLUSION); 
        BlkTyps.mapStringToEnum.put(BlkTyps.CONSLUSION.m_str.toUpperCase(), BlkTyps.CONSLUSION); 
        BlkTyps.MISC = new BlkTyps(7, "MISC");
        BlkTyps.mapIntToEnum.put(BlkTyps.MISC.value(), BlkTyps.MISC); 
        BlkTyps.mapStringToEnum.put(BlkTyps.MISC.m_str.toUpperCase(), BlkTyps.MISC); 
        BlkTyps.CHAPTER = new BlkTyps(8, "CHAPTER");
        BlkTyps.mapIntToEnum.put(BlkTyps.CHAPTER.value(), BlkTyps.CHAPTER); 
        BlkTyps.mapStringToEnum.put(BlkTyps.CHAPTER.m_str.toUpperCase(), BlkTyps.CHAPTER); 
        BlkTyps.m_Values = Array.from(BlkTyps.mapIntToEnum.values);
        BlkTyps.m_Keys = Array.from(BlkTyps.mapIntToEnum.keys);
    }
}


BlkTyps.static_constructor();

module.exports = BlkTyps