/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

/**
 * Язык
 */
class MorphLang {
    
    constructor() {
        this.value = 0;
    }
    
    getValue(i) {
        return (((((this.value) >> i)) & 1)) !== 0;
    }
    
    setValue(i, val) {
        if (val) 
            this.value |= (1 << i);
        else 
            this.value &= (~(1 << i));
    }
    
    get isUndefined() {
        return this.value === (0);
    }
    set isUndefined(_value) {
        this.value = 0;
        return _value;
    }
    
    get isRu() {
        return this.getValue(0);
    }
    set isRu(_value) {
        this.setValue(0, _value);
        return _value;
    }
    
    get isUa() {
        return this.getValue(1);
    }
    set isUa(_value) {
        this.setValue(1, _value);
        return _value;
    }
    
    get isBy() {
        return this.getValue(2);
    }
    set isBy(_value) {
        this.setValue(2, _value);
        return _value;
    }
    
    get isCyrillic() {
        return (this.isRu | this.isUa | this.isBy) | this.isKz;
    }
    
    get isEn() {
        return this.getValue(3);
    }
    set isEn(_value) {
        this.setValue(3, _value);
        return _value;
    }
    
    get isIt() {
        return this.getValue(4);
    }
    set isIt(_value) {
        this.setValue(4, _value);
        return _value;
    }
    
    get isKz() {
        return this.getValue(5);
    }
    set isKz(_value) {
        this.setValue(5, _value);
        return _value;
    }
    
    toString() {
        let tmpStr = new StringBuilder();
        if (this.isRu) 
            tmpStr.append("RU;");
        if (this.isUa) 
            tmpStr.append("UA;");
        if (this.isBy) 
            tmpStr.append("BY;");
        if (this.isEn) 
            tmpStr.append("EN;");
        if (this.isIt) 
            tmpStr.append("IT;");
        if (this.isKz) 
            tmpStr.append("KZ;");
        if (tmpStr.length > 0) 
            tmpStr.length = tmpStr.length - 1;
        return tmpStr.toString();
    }
    
    /**
     * Сравнение значение (полное совпадение)
     * @param obj 
     * @return 
     */
    equals(obj) {
        if (!(obj instanceof MorphLang)) 
            return false;
        return this.value === obj.value;
    }
    
    GetHashCode() {
        return this.value;
    }
    
    /**
     * Преобразовать из строки
     * @param str 
     * @param lang 
     * @return 
     */
    static tryParse(str, lang) {
        lang.value = new MorphLang();
        while (!Utils.isNullOrEmpty(str)) {
            let i = 0;
            for (i = 0; i < MorphLang.m_Names.length; i++) {
                if (Utils.startsWithString(str, MorphLang.m_Names[i], true)) 
                    break;
            }
            if (i >= MorphLang.m_Names.length) 
                break;
            lang.value.value |= (1 << i);
            for (i = 2; i < str.length; i++) {
                if (Utils.isLetter(str[i])) 
                    break;
            }
            if (i >= str.length) 
                break;
            str = str.substring(i);
        }
        if (lang.value.isUndefined) 
            return false;
        return true;
    }
    
    /**
     * Моделирование побитного "AND"
     * @param arg1 первый аргумент
     * @param arg2 второй аргумент
     * @return arg1 & arg2
     */
    static ooBitand(arg1, arg2) {
        let val1 = 0;
        let val2 = 0;
        if (arg1 !== null) 
            val1 = arg1.value;
        if (arg2 !== null) 
            val2 = arg2.value;
        return MorphLang._new269(((val1) & (val2)));
    }
    
    /**
     * Моделирование побитного "OR"
     * @param arg1 первый аргумент
     * @param arg2 второй аргумент
     * @return arg1 | arg2
     */
    static ooBitor(arg1, arg2) {
        let val1 = 0;
        let val2 = 0;
        if (arg1 !== null) 
            val1 = arg1.value;
        if (arg2 !== null) 
            val2 = arg2.value;
        return MorphLang._new269(((val1) | (val2)));
    }
    
    static _new269(_arg1) {
        let res = new MorphLang();
        res.value = _arg1;
        return res;
    }
    
    static _new271(_arg1) {
        let res = new MorphLang();
        res.isRu = _arg1;
        return res;
    }
    
    static _new272(_arg1) {
        let res = new MorphLang();
        res.isUa = _arg1;
        return res;
    }
    
    static _new273(_arg1) {
        let res = new MorphLang();
        res.isBy = _arg1;
        return res;
    }
    
    static _new274(_arg1) {
        let res = new MorphLang();
        res.isEn = _arg1;
        return res;
    }
    
    static _new275(_arg1) {
        let res = new MorphLang();
        res.isIt = _arg1;
        return res;
    }
    
    static _new276(_arg1) {
        let res = new MorphLang();
        res.isKz = _arg1;
        return res;
    }
    
    static static_constructor() {
        MorphLang.m_Names = ["RU", "UA", "BY", "EN", "IT", "KZ"];
        MorphLang.UNKNOWN = new MorphLang();
        MorphLang.RU = MorphLang._new271(true);
        MorphLang.UA = MorphLang._new272(true);
        MorphLang.BY = MorphLang._new273(true);
        MorphLang.EN = MorphLang._new274(true);
        MorphLang.IT = MorphLang._new275(true);
        MorphLang.KZ = MorphLang._new276(true);
    }
}


MorphLang.static_constructor();

module.exports = MorphLang