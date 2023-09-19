/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

// Ввели для оптимизации на Питоне.
class UnicodeInfo {
    
    static getChar(ch) {
        let ii = ch.charCodeAt(0);
        if (ii >= 0x10000) 
            ii = '?'.charCodeAt(0);
        return UnicodeInfo.allChars[ii];
    }
    
    static initialize() {
        if (UnicodeInfo.m_Inited) 
            return;
        UnicodeInfo.m_Inited = true;
        UnicodeInfo.allChars = new Array();
        let cyrvowel = "АЕЁИОУЮЯЫЭЄІЇЎӘӨҰҮІ";
        cyrvowel += cyrvowel.toLowerCase();
        for (let i = 0; i < 0x10000; i++) {
            let ch = String.fromCharCode(i);
            let ui = new UnicodeInfo(i);
            if (Utils.isWhitespace(ch)) 
                ui.isWhitespace = true;
            else if (Utils.isDigit(ch)) 
                ui.isDigit = true;
            else if (ch === 'º' || ch === '°') {
            }
            else if (Utils.isLetter(ch)) {
                ui.isLetter = true;
                if (i >= 0x400 && (i < 0x500)) {
                    ui.isCyrillic = true;
                    if (cyrvowel.indexOf(ch) >= 0) 
                        ui.isVowel = true;
                }
                else if (i < 0x200) {
                    ui.isLatin = true;
                    if ("AEIOUYaeiouy".indexOf(ch) >= 0) 
                        ui.isVowel = true;
                }
                if (Utils.isUpperCase(ch)) 
                    ui.isUpper = true;
                if (Utils.isLowerCase(ch)) 
                    ui.isLower = true;
            }
            else {
                if (((((ch === '-' || ch === '–' || ch === '¬') || ch === '-' || ch === (String.fromCharCode(0x00AD))) || ch === (String.fromCharCode(0x2011)) || ch === '-') || ch === '—' || ch === '–') || ch === '−' || ch === '-') 
                    ui.isHiphen = true;
                if ("\"'`“”’".indexOf(ch) >= 0) 
                    ui.isQuot = true;
                if ("'`’".indexOf(ch) >= 0) {
                    ui.isApos = true;
                    ui.isQuot = true;
                }
            }
            if (i >= 0x300 && (i < 0x370)) 
                ui.isUdaren = true;
            UnicodeInfo.allChars.push(ui);
        }
    }
    
    _clone() {
        let res = new UnicodeInfo();
        res.uniChar = this.uniChar;
        res.m_Value = this.m_Value;
        res.code = this.code;
        return res;
    }
    
    constructor(v = 0) {
        this.m_Value = 0;
        this.uniChar = '\0';
        this.code = 0;
        this.uniChar = String.fromCharCode(v);
        this.code = v;
        this.m_Value = 0;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append("'").append(this.uniChar).append("'(").append(this.code).append(")");
        if (this.isWhitespace) 
            res.append(", whitespace");
        if (this.isDigit) 
            res.append(", digit");
        if (this.isLetter) 
            res.append(", letter");
        if (this.isLatin) 
            res.append(", latin");
        if (this.isCyrillic) 
            res.append(", cyrillic");
        if (this.isUpper) 
            res.append(", upper");
        if (this.isLower) 
            res.append(", lower");
        if (this.isHiphen) 
            res.append(", hiphen");
        if (this.isQuot) 
            res.append(", quot");
        if (this.isApos) 
            res.append(", apos");
        if (this.isVowel) 
            res.append(", vowel");
        if (this.isUdaren) 
            res.append(", udaren");
        return res.toString();
    }
    
    getValue(i) {
        return (((((this.m_Value) >> i)) & 1)) !== 0;
    }
    
    setValue(i, val) {
        if (val) 
            this.m_Value |= (1 << i);
        else 
            this.m_Value &= (~(1 << i));
    }
    
    get isWhitespace() {
        return (((this.m_Value) & 0x1)) !== 0;
    }
    set isWhitespace(value) {
        this.setValue(0, value);
        return value;
    }
    
    get isDigit() {
        return (((this.m_Value) & 0x2)) !== 0;
    }
    set isDigit(value) {
        this.setValue(1, value);
        return value;
    }
    
    get isLetter() {
        return (((this.m_Value) & 0x4)) !== 0;
    }
    set isLetter(value) {
        this.setValue(2, value);
        return value;
    }
    
    get isUpper() {
        return (((this.m_Value) & 0x8)) !== 0;
    }
    set isUpper(value) {
        this.setValue(3, value);
        return value;
    }
    
    get isLower() {
        return (((this.m_Value) & 0x10)) !== 0;
    }
    set isLower(value) {
        this.setValue(4, value);
        return value;
    }
    
    get isLatin() {
        return (((this.m_Value) & 0x20)) !== 0;
    }
    set isLatin(value) {
        this.setValue(5, value);
        return value;
    }
    
    get isCyrillic() {
        return (((this.m_Value) & 0x40)) !== 0;
    }
    set isCyrillic(value) {
        this.setValue(6, value);
        return value;
    }
    
    get isHiphen() {
        return (((this.m_Value) & 0x80)) !== 0;
    }
    set isHiphen(value) {
        this.setValue(7, value);
        return value;
    }
    
    get isVowel() {
        return (((this.m_Value) & 0x100)) !== 0;
    }
    set isVowel(value) {
        this.setValue(8, value);
        return value;
    }
    
    get isQuot() {
        return (((this.m_Value) & 0x200)) !== 0;
    }
    set isQuot(value) {
        this.setValue(9, value);
        return value;
    }
    
    get isApos() {
        return (((this.m_Value) & 0x400)) !== 0;
    }
    set isApos(value) {
        this.setValue(10, value);
        return value;
    }
    
    get isUdaren() {
        return (((this.m_Value) & 0x800)) !== 0;
    }
    set isUdaren(value) {
        this.setValue(11, value);
        return value;
    }
    
    static static_constructor() {
        UnicodeInfo.allChars = null;
        UnicodeInfo.m_Inited = false;
    }
}


UnicodeInfo.static_constructor();

module.exports = UnicodeInfo