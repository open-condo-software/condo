/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../../unisharp/Hashtable");

class PersonItemTokenParseAttr {

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
        if(val instanceof PersonItemTokenParseAttr) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(PersonItemTokenParseAttr.mapStringToEnum.containsKey(val))
                return PersonItemTokenParseAttr.mapStringToEnum.get(val);
            return null;
        }
        if(PersonItemTokenParseAttr.mapIntToEnum.containsKey(val))
            return PersonItemTokenParseAttr.mapIntToEnum.get(val);
        let it = new PersonItemTokenParseAttr(val, val.toString());
        PersonItemTokenParseAttr.mapIntToEnum.put(val, it);
        PersonItemTokenParseAttr.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return PersonItemTokenParseAttr.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return PersonItemTokenParseAttr.m_Values;
    }
    static static_constructor() {
        PersonItemTokenParseAttr.mapIntToEnum = new Hashtable();
        PersonItemTokenParseAttr.mapStringToEnum = new Hashtable();
        PersonItemTokenParseAttr.NO = new PersonItemTokenParseAttr(0, "NO");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.NO.value(), PersonItemTokenParseAttr.NO); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.NO.m_str.toUpperCase(), PersonItemTokenParseAttr.NO); 
        PersonItemTokenParseAttr.ALTVAR = new PersonItemTokenParseAttr(1, "ALTVAR");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.ALTVAR.value(), PersonItemTokenParseAttr.ALTVAR); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.ALTVAR.m_str.toUpperCase(), PersonItemTokenParseAttr.ALTVAR); 
        PersonItemTokenParseAttr.CANBELATIN = new PersonItemTokenParseAttr(2, "CANBELATIN");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.CANBELATIN.value(), PersonItemTokenParseAttr.CANBELATIN); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.CANBELATIN.m_str.toUpperCase(), PersonItemTokenParseAttr.CANBELATIN); 
        PersonItemTokenParseAttr.CANINITIALBEDIGIT = new PersonItemTokenParseAttr(4, "CANINITIALBEDIGIT");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.CANINITIALBEDIGIT.value(), PersonItemTokenParseAttr.CANINITIALBEDIGIT); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.CANINITIALBEDIGIT.m_str.toUpperCase(), PersonItemTokenParseAttr.CANINITIALBEDIGIT); 
        PersonItemTokenParseAttr.CANBELOWER = new PersonItemTokenParseAttr(8, "CANBELOWER");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.CANBELOWER.value(), PersonItemTokenParseAttr.CANBELOWER); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.CANBELOWER.m_str.toUpperCase(), PersonItemTokenParseAttr.CANBELOWER); 
        PersonItemTokenParseAttr.MUSTBEITEMALWAYS = new PersonItemTokenParseAttr(0x10, "MUSTBEITEMALWAYS");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.MUSTBEITEMALWAYS.value(), PersonItemTokenParseAttr.MUSTBEITEMALWAYS); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.MUSTBEITEMALWAYS.m_str.toUpperCase(), PersonItemTokenParseAttr.MUSTBEITEMALWAYS); 
        PersonItemTokenParseAttr.IGNOREATTRS = new PersonItemTokenParseAttr(0x20, "IGNOREATTRS");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.IGNOREATTRS.value(), PersonItemTokenParseAttr.IGNOREATTRS); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.IGNOREATTRS.m_str.toUpperCase(), PersonItemTokenParseAttr.IGNOREATTRS); 
        PersonItemTokenParseAttr.NOMINATIVECASE = new PersonItemTokenParseAttr(0x40, "NOMINATIVECASE");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.NOMINATIVECASE.value(), PersonItemTokenParseAttr.NOMINATIVECASE); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.NOMINATIVECASE.m_str.toUpperCase(), PersonItemTokenParseAttr.NOMINATIVECASE); 
        PersonItemTokenParseAttr.SURNAMEPREFIXNOTMERGE = new PersonItemTokenParseAttr(0x80, "SURNAMEPREFIXNOTMERGE");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.SURNAMEPREFIXNOTMERGE.value(), PersonItemTokenParseAttr.SURNAMEPREFIXNOTMERGE); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.SURNAMEPREFIXNOTMERGE.m_str.toUpperCase(), PersonItemTokenParseAttr.SURNAMEPREFIXNOTMERGE); 
        PersonItemTokenParseAttr.AFTERATTRIBUTE = new PersonItemTokenParseAttr(0x100, "AFTERATTRIBUTE");
        PersonItemTokenParseAttr.mapIntToEnum.put(PersonItemTokenParseAttr.AFTERATTRIBUTE.value(), PersonItemTokenParseAttr.AFTERATTRIBUTE); 
        PersonItemTokenParseAttr.mapStringToEnum.put(PersonItemTokenParseAttr.AFTERATTRIBUTE.m_str.toUpperCase(), PersonItemTokenParseAttr.AFTERATTRIBUTE); 
        PersonItemTokenParseAttr.m_Values = Array.from(PersonItemTokenParseAttr.mapIntToEnum.values);
        PersonItemTokenParseAttr.m_Keys = Array.from(PersonItemTokenParseAttr.mapIntToEnum.keys);
    }
}


PersonItemTokenParseAttr.static_constructor();

module.exports = PersonItemTokenParseAttr