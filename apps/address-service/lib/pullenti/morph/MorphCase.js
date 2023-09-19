/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

/**
 * Падеж
 */
class MorphCase {
    
    constructor() {
        this.value = 0;
    }
    
    get isUndefined() {
        return this.value === (0);
    }
    set isUndefined(_value) {
        this.value = 0;
        return _value;
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
    
    get count() {
        if (this.value === (0)) 
            return 0;
        let cou = 0;
        for (let i = 0; i < 12; i++) {
            if ((((this.value) & (1 << i))) !== 0) 
                cou++;
        }
        return cou;
    }
    
    get isNominative() {
        return this.getValue(0);
    }
    set isNominative(_value) {
        this.setValue(0, _value);
        return _value;
    }
    
    get isGenitive() {
        return this.getValue(1);
    }
    set isGenitive(_value) {
        this.setValue(1, _value);
        return _value;
    }
    
    get isDative() {
        return this.getValue(2);
    }
    set isDative(_value) {
        this.setValue(2, _value);
        return _value;
    }
    
    get isAccusative() {
        return this.getValue(3);
    }
    set isAccusative(_value) {
        this.setValue(3, _value);
        return _value;
    }
    
    get isInstrumental() {
        return this.getValue(4);
    }
    set isInstrumental(_value) {
        this.setValue(4, _value);
        return _value;
    }
    
    get isPrepositional() {
        return this.getValue(5);
    }
    set isPrepositional(_value) {
        this.setValue(5, _value);
        return _value;
    }
    
    get isVocative() {
        return this.getValue(6);
    }
    set isVocative(_value) {
        this.setValue(6, _value);
        return _value;
    }
    
    get isPartial() {
        return this.getValue(7);
    }
    set isPartial(_value) {
        this.setValue(7, _value);
        return _value;
    }
    
    get isCommon() {
        return this.getValue(8);
    }
    set isCommon(_value) {
        this.setValue(8, _value);
        return _value;
    }
    
    get isPossessive() {
        return this.getValue(9);
    }
    set isPossessive(_value) {
        this.setValue(9, _value);
        return _value;
    }
    
    toString() {
        let tmpStr = new StringBuilder();
        if (this.isNominative) 
            tmpStr.append("именит.|");
        if (this.isGenitive) 
            tmpStr.append("родит.|");
        if (this.isDative) 
            tmpStr.append("дател.|");
        if (this.isAccusative) 
            tmpStr.append("винит.|");
        if (this.isInstrumental) 
            tmpStr.append("творит.|");
        if (this.isPrepositional) 
            tmpStr.append("предлож.|");
        if (this.isVocative) 
            tmpStr.append("зват.|");
        if (this.isPartial) 
            tmpStr.append("частич.|");
        if (this.isCommon) 
            tmpStr.append("общ.|");
        if (this.isPossessive) 
            tmpStr.append("притяж.|");
        if (tmpStr.length > 0) 
            tmpStr.length = tmpStr.length - 1;
        return tmpStr.toString();
    }
    
    /**
     * Восстановить падежи из строки, полученной ToString
     * @param str 
     * @return 
     */
    static parse(str) {
        let res = new MorphCase();
        if (Utils.isNullOrEmpty(str)) 
            return res;
        for (const s of Utils.splitString(str, '|', false)) {
            for (let i = 0; i < MorphCase.m_Names.length; i++) {
                if (s === MorphCase.m_Names[i]) {
                    res.setValue(i, true);
                    break;
                }
            }
        }
        return res;
    }
    
    /**
     * Проверка на полное совпадение значений
     * @param obj 
     * @return 
     */
    equals(obj) {
        if (!(obj instanceof MorphCase)) 
            return false;
        return this.value === obj.value;
    }
    
    GetHashCode() {
        return this.value;
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
        return MorphCase._new242(((val1) & (val2)));
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
        return MorphCase._new242(((val1) | (val2)));
    }
    
    /**
     * Моделирование побитного "XOR"
     * @param arg1 первый аргумент
     * @param arg2 второй аргумент
     * @return arg1 ^ arg2
     */
    static ooBitxor(arg1, arg2) {
        let val1 = 0;
        let val2 = 0;
        if (arg1 !== null) 
            val1 = arg1.value;
        if (arg2 !== null) 
            val2 = arg2.value;
        return MorphCase._new242(((val1) ^ (val2)));
    }
    
    static _new242(_arg1) {
        let res = new MorphCase();
        res.value = _arg1;
        return res;
    }
    
    static static_constructor() {
        MorphCase.UNDEFINED = MorphCase._new242(0);
        MorphCase.NOMINATIVE = MorphCase._new242(1);
        MorphCase.GENITIVE = MorphCase._new242(2);
        MorphCase.DATIVE = MorphCase._new242(4);
        MorphCase.ACCUSATIVE = MorphCase._new242(8);
        MorphCase.INSTRUMENTAL = MorphCase._new242(0x10);
        MorphCase.PREPOSITIONAL = MorphCase._new242(0x20);
        MorphCase.VOCATIVE = MorphCase._new242(0x40);
        MorphCase.PARTIAL = MorphCase._new242(0x80);
        MorphCase.COMMON = MorphCase._new242(0x100);
        MorphCase.POSSESSIVE = MorphCase._new242(0x200);
        MorphCase.ALL_CASES = MorphCase._new242(0x3FF);
        MorphCase.m_Names = ["именит.", "родит.", "дател.", "винит.", "творит.", "предлож.", "зват.", "частич.", "общ.", "притяж."];
    }
}


MorphCase.static_constructor();

module.exports = MorphCase