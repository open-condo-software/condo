/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

/**
 * Атрибуты слова дериватной группы DerivateWord
 * Атрибуты слова группы
 */
class ExplanWordAttr {
    
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
    
    get isAnimated() {
        return this.getValue(0);
    }
    set isAnimated(_value) {
        this.setValue(0, _value);
        return _value;
    }
    
    get isNamed() {
        return this.getValue(1);
    }
    set isNamed(_value) {
        this.setValue(1, _value);
        return _value;
    }
    
    get isNumbered() {
        return this.getValue(2);
    }
    set isNumbered(_value) {
        this.setValue(2, _value);
        return _value;
    }
    
    get isMeasured() {
        return this.getValue(3);
    }
    set isMeasured(_value) {
        this.setValue(3, _value);
        return _value;
    }
    
    get isEmoPositive() {
        return this.getValue(4);
    }
    set isEmoPositive(_value) {
        this.setValue(4, _value);
        return _value;
    }
    
    get isEmoNegative() {
        return this.getValue(5);
    }
    set isEmoNegative(_value) {
        this.setValue(5, _value);
        return _value;
    }
    
    get isAnimal() {
        return this.getValue(6);
    }
    set isAnimal(_value) {
        this.setValue(6, _value);
        return _value;
    }
    
    get isMan() {
        return this.getValue(7);
    }
    set isMan(_value) {
        this.setValue(7, _value);
        return _value;
    }
    
    get isCanPersonAfter() {
        return this.getValue(8);
    }
    set isCanPersonAfter(_value) {
        this.setValue(8, _value);
        return _value;
    }
    
    get isSpaceObject() {
        return this.getValue(9);
    }
    set isSpaceObject(_value) {
        this.setValue(9, _value);
        return _value;
    }
    
    get isTimeObject() {
        return this.getValue(10);
    }
    set isTimeObject(_value) {
        this.setValue(10, _value);
        return _value;
    }
    
    get isVerbNoun() {
        return this.getValue(11);
    }
    set isVerbNoun(_value) {
        this.setValue(11, _value);
        return _value;
    }
    
    toString() {
        let tmpStr = new StringBuilder();
        if (this.isAnimated) 
            tmpStr.append("одуш.");
        if (this.isAnimal) 
            tmpStr.append("животн.");
        if (this.isMan) 
            tmpStr.append("чел.");
        if (this.isSpaceObject) 
            tmpStr.append("простр.");
        if (this.isTimeObject) 
            tmpStr.append("времен.");
        if (this.isNamed) 
            tmpStr.append("именов.");
        if (this.isNumbered) 
            tmpStr.append("нумеруем.");
        if (this.isMeasured) 
            tmpStr.append("измеряем.");
        if (this.isEmoPositive) 
            tmpStr.append("позитив.");
        if (this.isEmoNegative) 
            tmpStr.append("негатив.");
        if (this.isCanPersonAfter) 
            tmpStr.append("персона_за_родит.");
        if (this.isVerbNoun) 
            tmpStr.append("глаг.сущ.");
        return tmpStr.toString();
    }
    
    equals(obj) {
        if (!(obj instanceof ExplanWordAttr)) 
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
        return ExplanWordAttr._new2998(((val1) & (val2)));
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
        return ExplanWordAttr._new2998(((val1) | (val2)));
    }
    
    static _new2998(_arg1) {
        let res = new ExplanWordAttr();
        res.value = _arg1;
        return res;
    }
    
    static static_constructor() {
        ExplanWordAttr.UNDEFINED = new ExplanWordAttr();
    }
}


ExplanWordAttr.static_constructor();

module.exports = ExplanWordAttr