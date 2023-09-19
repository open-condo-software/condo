/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../unisharp/StringBuilder");

/**
 * Часть речи
 */
class MorphClass {
    
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
    
    get isNoun() {
        return this.getValue(0);
    }
    set isNoun(_value) {
        if (_value) 
            this.value = 0;
        this.setValue(0, _value);
        return _value;
    }
    
    get isAdjective() {
        return this.getValue(1);
    }
    set isAdjective(_value) {
        if (_value) 
            this.value = 0;
        this.setValue(1, _value);
        return _value;
    }
    
    get isVerb() {
        return this.getValue(2);
    }
    set isVerb(_value) {
        if (_value) 
            this.value = 0;
        this.setValue(2, _value);
        return _value;
    }
    
    get isAdverb() {
        return this.getValue(3);
    }
    set isAdverb(_value) {
        if (_value) 
            this.value = 0;
        this.setValue(3, _value);
        return _value;
    }
    
    get isPronoun() {
        return this.getValue(4);
    }
    set isPronoun(_value) {
        if (_value) 
            this.value = 0;
        this.setValue(4, _value);
        return _value;
    }
    
    get isMisc() {
        return this.getValue(5);
    }
    set isMisc(_value) {
        if (_value) 
            this.value = 0;
        this.setValue(5, _value);
        return _value;
    }
    
    get isPreposition() {
        return this.getValue(6);
    }
    set isPreposition(_value) {
        this.setValue(6, _value);
        return _value;
    }
    
    get isConjunction() {
        return this.getValue(7);
    }
    set isConjunction(_value) {
        this.setValue(7, _value);
        return _value;
    }
    
    get isProper() {
        return this.getValue(8);
    }
    set isProper(_value) {
        this.setValue(8, _value);
        return _value;
    }
    
    get isProperSurname() {
        return this.getValue(9);
    }
    set isProperSurname(_value) {
        if (_value) 
            this.isProper = true;
        this.setValue(9, _value);
        return _value;
    }
    
    get isProperName() {
        return this.getValue(10);
    }
    set isProperName(_value) {
        if (_value) 
            this.isProper = true;
        this.setValue(10, _value);
        return _value;
    }
    
    get isProperSecname() {
        return this.getValue(11);
    }
    set isProperSecname(_value) {
        if (_value) 
            this.isProper = true;
        this.setValue(11, _value);
        return _value;
    }
    
    get isProperGeo() {
        return this.getValue(12);
    }
    set isProperGeo(_value) {
        if (_value) 
            this.isProper = true;
        this.setValue(12, _value);
        return _value;
    }
    
    get isPersonalPronoun() {
        return this.getValue(13);
    }
    set isPersonalPronoun(_value) {
        this.setValue(13, _value);
        return _value;
    }
    
    toString() {
        let tmpStr = new StringBuilder();
        if (this.isNoun) 
            tmpStr.append("существ.|");
        if (this.isAdjective) 
            tmpStr.append("прилаг.|");
        if (this.isVerb) 
            tmpStr.append("глагол|");
        if (this.isAdverb) 
            tmpStr.append("наречие|");
        if (this.isPronoun) 
            tmpStr.append("местоим.|");
        if (this.isMisc) {
            if (this.isConjunction || this.isPreposition || this.isProper) {
            }
            else 
                tmpStr.append("разное|");
        }
        if (this.isPreposition) 
            tmpStr.append("предлог|");
        if (this.isConjunction) 
            tmpStr.append("союз|");
        if (this.isProper) 
            tmpStr.append("собств.|");
        if (this.isProperSurname) 
            tmpStr.append("фамилия|");
        if (this.isProperName) 
            tmpStr.append("имя|");
        if (this.isProperSecname) 
            tmpStr.append("отч.|");
        if (this.isProperGeo) 
            tmpStr.append("геогр.|");
        if (this.isPersonalPronoun) 
            tmpStr.append("личн.местоим.|");
        if (tmpStr.length > 0) 
            tmpStr.length = tmpStr.length - 1;
        return tmpStr.toString();
    }
    
    /**
     * Проверка на полное совпадение значений
     * @param obj 
     * @return 
     */
    equals(obj) {
        if (!(obj instanceof MorphClass)) 
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
        return MorphClass._new266(((val1) & (val2)));
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
        return MorphClass._new266(((val1) | (val2)));
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
        return MorphClass._new266(((val1) ^ (val2)));
    }
    
    static _new257(_arg1) {
        let res = new MorphClass();
        res.isUndefined = _arg1;
        return res;
    }
    
    static _new258(_arg1) {
        let res = new MorphClass();
        res.isNoun = _arg1;
        return res;
    }
    
    static _new259(_arg1) {
        let res = new MorphClass();
        res.isPronoun = _arg1;
        return res;
    }
    
    static _new260(_arg1) {
        let res = new MorphClass();
        res.isPersonalPronoun = _arg1;
        return res;
    }
    
    static _new261(_arg1) {
        let res = new MorphClass();
        res.isVerb = _arg1;
        return res;
    }
    
    static _new262(_arg1) {
        let res = new MorphClass();
        res.isAdjective = _arg1;
        return res;
    }
    
    static _new263(_arg1) {
        let res = new MorphClass();
        res.isAdverb = _arg1;
        return res;
    }
    
    static _new264(_arg1) {
        let res = new MorphClass();
        res.isPreposition = _arg1;
        return res;
    }
    
    static _new265(_arg1) {
        let res = new MorphClass();
        res.isConjunction = _arg1;
        return res;
    }
    
    static _new266(_arg1) {
        let res = new MorphClass();
        res.value = _arg1;
        return res;
    }
    
    static _new2662(_arg1) {
        let res = new MorphClass();
        res.isProperSurname = _arg1;
        return res;
    }
    
    static static_constructor() {
        MorphClass.m_Names = ["существ.", "прилаг.", "глагол", "наречие", "местоим.", "разное", "предлог", "союз", "собств.", "фамилия", "имя", "отч.", "геогр.", "личн.местоим."];
        MorphClass.UNDEFINED = MorphClass._new257(true);
        MorphClass.NOUN = MorphClass._new258(true);
        MorphClass.PRONOUN = MorphClass._new259(true);
        MorphClass.PERSONAL_PRONOUN = MorphClass._new260(true);
        MorphClass.VERB = MorphClass._new261(true);
        MorphClass.ADJECTIVE = MorphClass._new262(true);
        MorphClass.ADVERB = MorphClass._new263(true);
        MorphClass.PREPOSITION = MorphClass._new264(true);
        MorphClass.CONJUNCTION = MorphClass._new265(true);
    }
}


MorphClass.static_constructor();

module.exports = MorphClass