/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../unisharp/StringBuilder");

const MorphGender = require("./../morph/MorphGender");
const MorphNumber = require("./../morph/MorphNumber");
const MetaToken = require("./MetaToken");
const NumberSpellingType = require("./NumberSpellingType");
const SerializerHelper = require("./core/internal/SerializerHelper");

/**
 * Метатокен - число (числительное). Причём задаваемое не только цифрами, но и словами, возможно, римская запись и др. 
 * Для получения см. методы NumberHelper.
 * 
 * Числовой токен
 */
class NumberToken extends MetaToken {
    
    constructor(begin, end, val, _typ, _kit = null) {
        super(begin, end, _kit);
        this.m_Value = null;
        this.m_IntVal = null;
        this.m_RealVal = 0;
        this.typ = NumberSpellingType.DIGIT;
        this.value = val;
        this.typ = _typ;
    }
    
    get value() {
        return this.m_Value;
    }
    set value(_value) {
        const NumberHelper = require("./core/NumberHelper");
        this.m_Value = (_value != null ? _value : "");
        if (this.m_Value.length > 2 && this.m_Value.endsWith(".0")) 
            this.m_Value = this.m_Value.substring(0, 0 + this.m_Value.length - 2);
        while (this.m_Value.length > 1 && this.m_Value[0] === '0' && this.m_Value[1] !== '.') {
            this.m_Value = this.m_Value.substring(1);
        }
        let n = 0;
        let wrapn2934 = new RefOutArgWrapper();
        let inoutres2935 = Utils.tryParseInt(this.m_Value, wrapn2934);
        n = wrapn2934.value;
        if (inoutres2935) 
            this.m_IntVal = n;
        else 
            this.m_IntVal = null;
        let d = NumberHelper.stringToDouble(this.m_Value);
        if (d === null) 
            this.m_RealVal = Number.NaN;
        else 
            this.m_RealVal = d;
        return _value;
    }
    
    get intValue() {
        return this.m_IntVal;
    }
    set intValue(_value) {
        this.value = _value.toString();
        return _value;
    }
    
    get realValue() {
        return this.m_RealVal;
    }
    set realValue(_value) {
        const NumberHelper = require("./core/NumberHelper");
        this.value = NumberHelper.doubleToString(_value);
        return _value;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(this.value).append(" ").append(this.typ.toString());
        if (this.morph !== null) 
            res.append(" ").append(this.morph.toString());
        return res.toString();
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        return this.value.toString();
    }
    
    serialize(stream) {
        super.serialize(stream);
        SerializerHelper.serializeString(stream, this.m_Value);
        SerializerHelper.serializeInt(stream, this.typ.value());
    }
    
    deserialize(stream, _kit, vers) {
        super.deserialize(stream, _kit, vers);
        this.value = SerializerHelper.deserializeString(stream);
        this.typ = NumberSpellingType.of(SerializerHelper.deserializeInt(stream));
    }
    
    _corrDrob(val) {
        let t = this.endToken.next;
        if (t === null) 
            return;
        if (t.isValue("ДЕСЯТИ", null) && t.next !== null && t.next.isValue("ТЫСЯЧНЫЙ", "ТИСЯЧНИЙ")) {
            this.endToken = t.next;
            this.realValue = (((val) / (10000))) + this.realValue;
            return;
        }
        if (t.isValue("ДЕСЯТИ", null) && t.next !== null && t.next.isValue("МИЛЛИОННЫЙ", "МІЛЬЙОННИЙ")) {
            this.endToken = t.next;
            this.realValue = (((val) / (10000000))) + this.realValue;
            return;
        }
        if (t.isValue("ДЕСЯТЫЙ", "ДЕСЯТИЙ")) {
            this.endToken = t;
            this.realValue = (((val) / (10))) + this.realValue;
            return;
        }
        if (t.isValue("СТО", null) && t.next !== null && t.next.isValue("ТЫСЯЧНЫЙ", "ТИСЯЧНИЙ")) {
            this.endToken = t.next;
            this.realValue = (((val) / (100000))) + this.realValue;
            return;
        }
        if (t.isValue("СТО", null) && t.next !== null && t.next.isValue("МИЛЛИОННЫЙ", "МІЛЬЙОННИЙ")) {
            this.endToken = t.next;
            this.realValue = (((val) / (100000000))) + this.realValue;
            return;
        }
        if (t.isValue("СОТЫЙ", "СОТИЙ")) {
            this.endToken = t;
            this.realValue = (((val) / (100))) + this.realValue;
            return;
        }
        if (t.isValue("ТЫСЯЧНЫЙ", "ТИСЯЧНИЙ")) {
            this.endToken = t;
            this.realValue = (((val) / (1000))) + this.realValue;
            return;
        }
        if (t.isValue("ДЕСЯТИТЫСЯЧНЫЙ", "ДЕСЯТИТИСЯЧНИЙ") || (((t instanceof NumberToken) && t.value === "10000"))) {
            this.endToken = t;
            this.realValue = (((val) / (10000))) + this.realValue;
            return;
        }
        if (t.isValue("СТОТЫСЯЧНЫЙ", "СТОТИСЯЧНИЙ") || (((t instanceof NumberToken) && t.value === "100000"))) {
            this.endToken = t;
            this.realValue = (((val) / (100000))) + this.realValue;
            return;
        }
        if (t.isValue("МИЛЛИОННЫЙ", "МІЛЬЙОННИЙ")) {
            this.endToken = t;
            this.realValue = (((val) / (1000000))) + this.realValue;
            return;
        }
        if (t.isValue("ДЕСЯТИМИЛЛИОННЫЙ", "ДЕСЯТИМІЛЬЙОННИЙ") || (((t instanceof NumberToken) && t.value === "10000000"))) {
            this.endToken = t;
            this.realValue = (((val) / (10000000))) + this.realValue;
            return;
        }
        if (t.isValue("СТОМИЛЛИОННЫЙ", "СТОМІЛЬЙОННИЙ") || (((t instanceof NumberToken) && t.value === "100000000"))) {
            this.endToken = t;
            this.realValue = (((val) / (10000000))) + this.realValue;
            return;
        }
    }
    
    static _new815(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new NumberToken(_arg1, _arg2, _arg3, _arg4);
        res.morph = _arg5;
        return res;
    }
}


module.exports = NumberToken