/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

/**
 * Абстрактные вопросы модели управления
 */
class QuestionType {

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
        if(val instanceof QuestionType) 
            return val;
        if(typeof val === 'string' || val instanceof String) {
            val = val.toUpperCase();
            if(QuestionType.mapStringToEnum.containsKey(val))
                return QuestionType.mapStringToEnum.get(val);
            return null;
        }
        if(QuestionType.mapIntToEnum.containsKey(val))
            return QuestionType.mapIntToEnum.get(val);
        let it = new QuestionType(val, val.toString());
        QuestionType.mapIntToEnum.put(val, it);
        QuestionType.mapStringToEnum.put(val.toString(), it);
        return it;
    }
    static isDefined(val) {
        return QuestionType.m_Keys.indexOf(val) >= 0;
    }
    static getValues() {
        return QuestionType.m_Values;
    }
    static static_constructor() {
        QuestionType.mapIntToEnum = new Hashtable();
        QuestionType.mapStringToEnum = new Hashtable();
        QuestionType.UNDEFINED = new QuestionType(0, "UNDEFINED");
        QuestionType.mapIntToEnum.put(QuestionType.UNDEFINED.value(), QuestionType.UNDEFINED); 
        QuestionType.mapStringToEnum.put(QuestionType.UNDEFINED.m_str.toUpperCase(), QuestionType.UNDEFINED); 
        QuestionType.WHERE = new QuestionType(1, "WHERE");
        QuestionType.mapIntToEnum.put(QuestionType.WHERE.value(), QuestionType.WHERE); 
        QuestionType.mapStringToEnum.put(QuestionType.WHERE.m_str.toUpperCase(), QuestionType.WHERE); 
        QuestionType.WHEREFROM = new QuestionType(2, "WHEREFROM");
        QuestionType.mapIntToEnum.put(QuestionType.WHEREFROM.value(), QuestionType.WHEREFROM); 
        QuestionType.mapStringToEnum.put(QuestionType.WHEREFROM.m_str.toUpperCase(), QuestionType.WHEREFROM); 
        QuestionType.WHERETO = new QuestionType(4, "WHERETO");
        QuestionType.mapIntToEnum.put(QuestionType.WHERETO.value(), QuestionType.WHERETO); 
        QuestionType.mapStringToEnum.put(QuestionType.WHERETO.m_str.toUpperCase(), QuestionType.WHERETO); 
        QuestionType.WHEN = new QuestionType(8, "WHEN");
        QuestionType.mapIntToEnum.put(QuestionType.WHEN.value(), QuestionType.WHEN); 
        QuestionType.mapStringToEnum.put(QuestionType.WHEN.m_str.toUpperCase(), QuestionType.WHEN); 
        QuestionType.WHATTODO = new QuestionType(0x10, "WHATTODO");
        QuestionType.mapIntToEnum.put(QuestionType.WHATTODO.value(), QuestionType.WHATTODO); 
        QuestionType.mapStringToEnum.put(QuestionType.WHATTODO.m_str.toUpperCase(), QuestionType.WHATTODO); 
        QuestionType.m_Values = Array.from(QuestionType.mapIntToEnum.values);
        QuestionType.m_Keys = Array.from(QuestionType.mapIntToEnum.keys);
    }
}


QuestionType.static_constructor();

module.exports = QuestionType