/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../unisharp/StringBuilder");

const MorphNumber = require("./../morph/MorphNumber");
const MorphGender = require("./../morph/MorphGender");
const CharsInfo = require("./../morph/CharsInfo");
const Token = require("./Token");
const GetTextAttr = require("./core/GetTextAttr");

/**
 * Метатокен - надстройка над диапазоном других токенов. Базовый класс для подавляющего числа всех токенов: 
 * NumberToken, ReferentToken, NounPhraseToken и пр.
 * Метатокен
 */
class MetaToken extends Token {
    
    constructor(begin, end, _kit = null) {
        super((_kit !== null ? _kit : (begin !== null ? begin.kit : null)), (begin === null ? 0 : begin.beginChar), (end === null ? 0 : end.endChar));
        this.m_BeginToken = null;
        this.m_EndToken = null;
        if (begin === this || end === this) {
        }
        this.m_BeginToken = begin;
        this.m_EndToken = end;
        if (begin === null || end === null) 
            return;
        this.chars = CharsInfo._new2650(begin.chars.value);
        if (begin !== end) {
            for (let t = begin.next; t !== null && t.endChar <= end.endChar; t = t.next) {
                if (t.chars.isLetter) {
                    if (this.chars.isCapitalUpper && t.chars.isAllLower) {
                    }
                    else 
                        this.chars.value = ((this.chars.value) & (t.chars.value));
                }
            }
        }
    }
    
    _RefreshCharsInfo() {
        if (this.m_BeginToken === null) 
            return;
        this.chars = new CharsInfo();
        this.chars.value = this.m_BeginToken.chars.value;
        let cou = 0;
        if (this.m_BeginToken !== this.m_EndToken && this.m_EndToken !== null) {
            for (let t = this.m_BeginToken.next; t !== null; t = t.next) {
                if ((++cou) > 100) 
                    break;
                if (t.endChar > this.m_EndToken.endChar) 
                    break;
                if (t.chars.isLetter) 
                    this.chars.value = ((this.chars.value) & (t.chars.value));
                if (t === this.m_EndToken) 
                    break;
            }
        }
    }
    
    get beginToken() {
        return this.m_BeginToken;
    }
    set beginToken(value) {
        if (this.m_BeginToken !== value) {
            if (this.m_BeginToken === this) {
            }
            else {
                this.m_BeginToken = value;
                this._RefreshCharsInfo();
            }
        }
        return value;
    }
    
    get endToken() {
        return this.m_EndToken;
    }
    set endToken(value) {
        if (this.m_EndToken !== value) {
            if (this.m_EndToken === this) {
            }
            else {
                this.m_EndToken = value;
                this._RefreshCharsInfo();
            }
        }
        return value;
    }
    
    get beginChar() {
        let bt = this.beginToken;
        return (bt === null ? 0 : bt.beginChar);
    }
    
    get endChar() {
        let et = this.endToken;
        return (et === null ? 0 : et.endChar);
    }
    
    get tokensCount() {
        let count = 1;
        for (let t = this.m_BeginToken; t !== this.m_EndToken && t !== null; t = t.next) {
            if (count > 1 && t === this.m_BeginToken) 
                break;
            count++;
        }
        return count;
    }
    
    get isWhitespaceBefore() {
        return this.m_BeginToken.isWhitespaceBefore;
    }
    
    get isWhitespaceAfter() {
        return this.m_EndToken.isWhitespaceAfter;
    }
    
    get isNewlineBefore() {
        return this.m_BeginToken.isNewlineBefore;
    }
    
    get isNewlineAfter() {
        return this.m_EndToken.isNewlineAfter;
    }
    
    get whitespacesBeforeCount() {
        return this.m_BeginToken.whitespacesBeforeCount;
    }
    
    get whitespacesAfterCount() {
        return this.m_EndToken.whitespacesAfterCount;
    }
    
    toString() {
        let res = new StringBuilder();
        for (let t = this.m_BeginToken; t !== null; t = t.next) {
            if (res.length > 0 && t.isWhitespaceBefore) 
                res.append(' ');
            res.append(t.getSourceText());
            if (t === this.m_EndToken) 
                break;
        }
        return res.toString();
    }
    
    isValue(term, termUA = null) {
        return this.beginToken.isValue(term, termUA);
    }
    
    getReferents() {
        let res = null;
        for (let t = this.beginToken; t !== null && t.endChar <= this.endChar; t = t.next) {
            let li = t.getReferents();
            if (li === null) 
                continue;
            if (res === null) 
                res = li;
            else 
                for (const r of li) {
                    if (!res.includes(r)) 
                        res.push(r);
                }
        }
        return res;
    }
    
    static check(li) {
        if (li === null || (li.length < 1)) 
            return false;
        let i = 0;
        for (i = 0; i < (li.length - 1); i++) {
            if (li[i].beginChar > li[i].endChar) 
                return false;
            if (li[i].endChar >= li[i + 1].beginChar) 
                return false;
        }
        if (li[i].beginChar > li[i].endChar) 
            return false;
        return true;
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        const MiscHelper = require("./core/MiscHelper");
        let attr = GetTextAttr.NO;
        if (num === MorphNumber.SINGULAR) 
            attr = GetTextAttr.of((attr.value()) | (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()));
        else 
            attr = GetTextAttr.of((attr.value()) | (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()));
        if (keepChars) 
            attr = GetTextAttr.of((attr.value()) | (GetTextAttr.KEEPREGISTER.value()));
        if (this.beginToken === this.endToken) 
            return this.beginToken.getNormalCaseText(mc, num, gender, keepChars);
        else 
            return MiscHelper.getTextValue(this.beginToken, this.endToken, attr);
    }
    
    static _new806(_arg1, _arg2, _arg3) {
        let res = new MetaToken(_arg1, _arg2);
        res.tag = _arg3;
        return res;
    }
    
    static _new823(_arg1, _arg2, _arg3) {
        let res = new MetaToken(_arg1, _arg2);
        res.morph = _arg3;
        return res;
    }
    
    static _new2433(_arg1, _arg2, _arg3, _arg4) {
        let res = new MetaToken(_arg1, _arg2);
        res.tag = _arg3;
        res.morph = _arg4;
        return res;
    }
}


module.exports = MetaToken