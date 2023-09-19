/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../unisharp/StringBuilder");

/**
 * Информация о символах токена
 * 
 * Символьная информация
 */
class CharsInfo {
    
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
    
    get isAllUpper() {
        return this.getValue(0);
    }
    set isAllUpper(_value) {
        this.setValue(0, _value);
        return _value;
    }
    
    get isAllLower() {
        return this.getValue(1);
    }
    set isAllLower(_value) {
        this.setValue(1, _value);
        return _value;
    }
    
    get isCapitalUpper() {
        return this.getValue(2);
    }
    set isCapitalUpper(_value) {
        this.setValue(2, _value);
        return _value;
    }
    
    get isLastLower() {
        return this.getValue(3);
    }
    set isLastLower(_value) {
        this.setValue(3, _value);
        return _value;
    }
    
    get isLetter() {
        return this.getValue(4);
    }
    set isLetter(_value) {
        this.setValue(4, _value);
        return _value;
    }
    
    get isLatinLetter() {
        return this.getValue(5);
    }
    set isLatinLetter(_value) {
        this.setValue(5, _value);
        return _value;
    }
    
    get isCyrillicLetter() {
        return this.getValue(6);
    }
    set isCyrillicLetter(_value) {
        this.setValue(6, _value);
        return _value;
    }
    
    toString() {
        if (!this.isLetter) 
            return "Nonletter";
        let tmpStr = new StringBuilder();
        if (this.isAllUpper) 
            tmpStr.append("AllUpper");
        else if (this.isAllLower) 
            tmpStr.append("AllLower");
        else if (this.isCapitalUpper) 
            tmpStr.append("CapitalUpper");
        else if (this.isLastLower) 
            tmpStr.append("LastLower");
        else 
            tmpStr.append("Nonstandard");
        if (this.isLatinLetter) 
            tmpStr.append(" Latin");
        else if (this.isCyrillicLetter) 
            tmpStr.append(" Cyrillic");
        else if (this.isLetter) 
            tmpStr.append(" Letter");
        return tmpStr.toString();
    }
    
    /**
     * Сравнение на совпадение значений всех полей
     * @param obj сравниваемый объект
     * @return 
     */
    equals(obj) {
        if (!(obj instanceof CharsInfo)) 
            return false;
        return this.value === obj.value;
    }
    
    static _new2429(_arg1) {
        let res = new CharsInfo();
        res.isCapitalUpper = _arg1;
        return res;
    }
    
    static _new2634(_arg1) {
        let res = new CharsInfo();
        res.isCyrillicLetter = _arg1;
        return res;
    }
    
    static _new2640(_arg1, _arg2) {
        let res = new CharsInfo();
        res.isCyrillicLetter = _arg1;
        res.isCapitalUpper = _arg2;
        return res;
    }
    
    static _new2645(_arg1, _arg2, _arg3, _arg4) {
        let res = new CharsInfo();
        res.isCapitalUpper = _arg1;
        res.isCyrillicLetter = _arg2;
        res.isLatinLetter = _arg3;
        res.isLetter = _arg4;
        return res;
    }
    
    static _new2650(_arg1) {
        let res = new CharsInfo();
        res.value = _arg1;
        return res;
    }
    
    static _new2671(_arg1) {
        let res = new CharsInfo();
        res.isLatinLetter = _arg1;
        return res;
    }
}


module.exports = CharsInfo