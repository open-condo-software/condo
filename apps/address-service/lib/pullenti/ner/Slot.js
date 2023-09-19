/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

const TextAnnotation = require("./TextAnnotation");
const Referent = require("./Referent");
const MorphLang = require("./../morph/MorphLang");
const Token = require("./Token");

/**
 * Значение атрибута в конкретном экземпляре сущности
 * 
 * Атрибут сущности
 */
class Slot {
    
    constructor() {
        this._typename = null;
        this._owner = null;
        this.m_Value = null;
        this._count = 0;
        this.occurrence = null;
        this._tag = null;
    }
    
    get typeName() {
        return this._typename;
    }
    set typeName(_value) {
        this._typename = _value;
        return this._typename;
    }
    
    get isInternal() {
        return this.typeName !== null && this.typeName[0] === '@';
    }
    
    get owner() {
        return this._owner;
    }
    set owner(_value) {
        this._owner = _value;
        return this._owner;
    }
    
    get value() {
        return this.m_Value;
    }
    set value(_value) {
        this.m_Value = _value;
        if (this.m_Value !== null) {
            if (this.m_Value instanceof Referent) {
            }
            else if (this.m_Value instanceof Token) {
            }
            else if ((typeof this.m_Value === 'string' || this.m_Value instanceof String)) {
            }
            else 
                this.m_Value = this.m_Value.toString();
        }
        else {
        }
        return _value;
    }
    
    get count() {
        return this._count;
    }
    set count(_value) {
        this._count = _value;
        return this._count;
    }
    
    addAnnotation(a) {
        if (a === null) 
            return;
        if (this.occurrence === null) 
            this.occurrence = new Array();
        for (const o of this.occurrence) {
            if (o.beginChar === a.beginChar && o.endChar === a.endChar) 
                return;
        }
        this.occurrence.push(new TextAnnotation(a.beginToken, a.endToken));
    }
    
    mergeOccurence(s) {
        if (s.occurrence !== null) {
            if (this.occurrence === null) 
                this.occurrence = new Array();
            this.occurrence.splice(this.occurrence.length, 0, ...s.occurrence);
        }
    }
    
    get definingFeature() {
        if (this.owner === null) 
            return null;
        if (this.owner.instanceOf === null) 
            return null;
        return this.owner.instanceOf.findFeature(this.typeName);
    }
    
    toString() {
        return this.toStringEx(MorphLang.UNKNOWN);
    }
    
    toStringEx(lang) {
        let res = new StringBuilder();
        let attr = this.definingFeature;
        if (attr !== null) {
            if (this.count > 0) 
                res.append(attr.caption).append(" (").append(this.count).append("): ");
            else 
                res.append(attr.caption).append(": ");
        }
        else 
            res.append(this.typeName).append(": ");
        if (this.value !== null) {
            if (this.value instanceof Referent) 
                res.append(this.value.toStringEx(false, lang, 0));
            else if (attr === null) 
                res.append(this.value.toString());
            else 
                res.append(attr.convertInnerValueToOuterValue(this.value.toString(), null));
        }
        return res.toString();
    }
    
    /**
     * Преобразовать внутреннее значение в строку указанного языка
     * @param lang язык
     * @return значение
     */
    convertValueToString(lang) {
        if (this.value === null) 
            return null;
        let attr = this.definingFeature;
        if (attr === null) 
            return this.value.toString();
        let v = attr.convertInnerValueToOuterValue(this.value.toString(), lang);
        if (v === null) 
            return null;
        if ((typeof v === 'string' || v instanceof String)) 
            return Utils.asString(v);
        else 
            return v.toString();
    }
    
    get tag() {
        return this._tag;
    }
    set tag(_value) {
        this._tag = _value;
        return this._tag;
    }
    
    static _new2953(_arg1, _arg2, _arg3) {
        let res = new Slot();
        res.typeName = _arg1;
        res.value = _arg2;
        res.count = _arg3;
        return res;
    }
}


module.exports = Slot