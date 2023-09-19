/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

/**
 * Атрибут класса сущностей
 */
class Feature {
    
    constructor() {
        this._name = null;
        this._caption = null;
        this._lowerbound = 0;
        this._upperbound = 0;
        this._showasparent = false;
        this.innerValues = new Array();
        this.outerValues = new Array();
        this.outerValuesEN = new Array();
        this.outerValuesUA = new Array();
    }
    
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
        return this._name;
    }
    
    get caption() {
        return this._caption;
    }
    set caption(value) {
        this._caption = value;
        return this._caption;
    }
    
    get lowerBound() {
        return this._lowerbound;
    }
    set lowerBound(value) {
        this._lowerbound = value;
        return this._lowerbound;
    }
    
    get upperBound() {
        return this._upperbound;
    }
    set upperBound(value) {
        this._upperbound = value;
        return this._upperbound;
    }
    
    get showAsParent() {
        return this._showasparent;
    }
    set showAsParent(value) {
        this._showasparent = value;
        return this._showasparent;
    }
    
    toString() {
        let res = new StringBuilder(Utils.notNull(this.caption, this.name));
        if (this.upperBound > 0 || this.lowerBound > 0) {
            if (this.upperBound === 0) 
                res.append("[").append(this.lowerBound).append("..*]");
            else if (this.upperBound === this.lowerBound) 
                res.append("[").append(this.upperBound).append("]");
            else 
                res.append("[").append(this.lowerBound).append("..").append(this.upperBound).append("]");
        }
        return res.toString();
    }
    
    convertInnerValueToOuterValue(innerValue, lang = null) {
        if (innerValue === null) 
            return null;
        let val = innerValue.toString();
        for (let i = 0; i < this.innerValues.length; i++) {
            if (Utils.compareStrings(this.innerValues[i], val, true) === 0 && (i < this.outerValues.length)) {
                if (lang !== null) {
                    if (lang.isUa && (i < this.outerValuesUA.length) && this.outerValuesUA[i] !== null) 
                        return this.outerValuesUA[i];
                    if (lang.isEn && (i < this.outerValuesEN.length) && this.outerValuesEN[i] !== null) 
                        return this.outerValuesEN[i];
                }
                return this.outerValues[i];
            }
        }
        return innerValue;
    }
    
    convertOuterValueToInnerValue(outerValue) {
        if (outerValue === null) 
            return null;
        for (let i = 0; i < this.outerValues.length; i++) {
            if (Utils.compareStrings(this.outerValues[i], outerValue, true) === 0 && (i < this.innerValues.length)) 
                return this.innerValues[i];
            else if ((i < this.outerValuesUA.length) && this.outerValuesUA[i] === outerValue) 
                return this.innerValues[i];
        }
        return outerValue;
    }
    
    addValue(intVal, extVal, extValUa = null, extValEng = null) {
        this.innerValues.push(intVal);
        this.outerValues.push(extVal);
        this.outerValuesUA.push(extValUa);
        this.outerValuesEN.push(extValEng);
    }
    
    static _new1750(_arg1, _arg2, _arg3, _arg4) {
        let res = new Feature();
        res.name = _arg1;
        res.caption = _arg2;
        res.lowerBound = _arg3;
        res.upperBound = _arg4;
        return res;
    }
}


module.exports = Feature