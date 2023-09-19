/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

const CharsInfo = require("./../morph/CharsInfo");
const MorphGender = require("./../morph/MorphGender");
const MorphNumber = require("./../morph/MorphNumber");
const LanguageHelper = require("./../morph/LanguageHelper");
const MorphCollection = require("./MorphCollection");

/**
 * Базовый класс для всех токенов. Наследные классы - TextToken (конечная словоформа) и MetaToken (связный фрагмент других токенов).
 * 
 * Токен
 */
class Token {
    
    constructor(_kit, begin, end) {
        this.kit = null;
        this.m_BeginChar = 0;
        this.m_EndChar = 0;
        this.tag = null;
        this.m_Previous = null;
        this.m_Next = null;
        this.m_Morph = null;
        this.chars = null;
        this.m_Attrs = 0;
        this.kit = _kit;
        this.m_BeginChar = begin;
        this.m_EndChar = end;
    }
    
    get beginChar() {
        return this.m_BeginChar;
    }
    
    get endChar() {
        return this.m_EndChar;
    }
    
    get lengthChar() {
        return (this.endChar - this.beginChar) + 1;
    }
    
    get isIgnored() {
        if (this.kit.sofa.ignoredEndChar > 0) {
            if (this.beginChar >= this.kit.sofa.ignoredBeginChar && this.endChar <= this.kit.sofa.ignoredEndChar) 
                return true;
        }
        return false;
    }
    
    get previous() {
        return this.m_Previous;
    }
    set previous(value) {
        this.m_Previous = value;
        if (value !== null) 
            value.m_Next = this;
        this.m_Attrs = 0;
        return value;
    }
    
    get next() {
        return this.m_Next;
    }
    set next(value) {
        this.m_Next = value;
        if (value !== null) 
            value.m_Previous = this;
        else {
        }
        this.m_Attrs = 0;
        return value;
    }
    
    get morph() {
        if (this.m_Morph === null) 
            this.m_Morph = new MorphCollection();
        return this.m_Morph;
    }
    set morph(value) {
        this.m_Morph = value;
        return value;
    }
    
    toString() {
        return this.kit.sofa.text.substring(this.beginChar, this.beginChar + (this.endChar + 1) - this.beginChar);
    }
    
    getAttr(i) {
        let ch = '\0';
        if ((((this.m_Attrs) & 1)) === 0) {
            this.m_Attrs = 1;
            if (this.m_Previous === null) {
                this.setAttr(1, true);
                this.setAttr(3, true);
            }
            else 
                for (let j = this.m_Previous.endChar + 1; j < this.beginChar; j++) {
                    if (Utils.isWhitespace(((ch = this.kit.sofa.text[j])))) {
                        this.setAttr(1, true);
                        if (((ch.charCodeAt(0)) === 0xD || (ch.charCodeAt(0)) === 0xA || ch === '\f') || (ch.charCodeAt(0)) === 0x2028) 
                            this.setAttr(3, true);
                    }
                }
            if (this.m_Next === null) {
                this.setAttr(2, true);
                this.setAttr(4, true);
            }
            else 
                for (let j = this.endChar + 1; j < this.m_Next.beginChar; j++) {
                    if (Utils.isWhitespace((ch = this.kit.sofa.text[j]))) {
                        this.setAttr(2, true);
                        if (((ch.charCodeAt(0)) === 0xD || (ch.charCodeAt(0)) === 0xA || ch === '\f') || (ch.charCodeAt(0)) === 0x2028) 
                            this.setAttr(4, true);
                    }
                }
        }
        return (((((this.m_Attrs) >> i)) & 1)) !== 0;
    }
    
    setAttr(i, val) {
        if (val) 
            this.m_Attrs |= (1 << i);
        else 
            this.m_Attrs &= (~(1 << i));
    }
    
    get isWhitespaceBefore() {
        return this.getAttr(1);
    }
    set isWhitespaceBefore(value) {
        this.setAttr(1, value);
        return value;
    }
    
    get isWhitespaceAfter() {
        return this.getAttr(2);
    }
    set isWhitespaceAfter(value) {
        this.setAttr(2, value);
        return value;
    }
    
    get isNewlineBefore() {
        return this.getAttr(3);
    }
    set isNewlineBefore(value) {
        this.setAttr(3, value);
        return value;
    }
    
    get isNewlineAfter() {
        return this.getAttr(4);
    }
    set isNewlineAfter(value) {
        this.setAttr(4, value);
        return value;
    }
    
    get innerBool() {
        return this.getAttr(5);
    }
    set innerBool(value) {
        this.setAttr(5, value);
        return value;
    }
    
    get notNounPhrase() {
        return this.getAttr(6);
    }
    set notNounPhrase(value) {
        this.setAttr(6, value);
        return value;
    }
    
    get whitespacesBeforeCount() {
        if (this.previous === null) 
            return 100;
        if ((this.previous.endChar + 1) === this.beginChar) 
            return 0;
        return this.calcWhitespaces(this.previous.endChar + 1, this.beginChar - 1);
    }
    
    get newlinesBeforeCount() {
        let ch0 = String.fromCharCode(0);
        let res = 0;
        let txt = this.kit.sofa.text;
        for (let p = this.beginChar - 1; p >= 0; p--) {
            let ch = txt[p];
            if ((ch.charCodeAt(0)) === 0xA || (ch.charCodeAt(0)) === 0x2028) 
                res++;
            else if ((ch.charCodeAt(0)) === 0xD && (ch0.charCodeAt(0)) !== 0xA) 
                res++;
            else if (ch === '\f') 
                res += 10;
            else if (!Utils.isWhitespace(ch)) 
                break;
            ch0 = ch;
        }
        return res;
    }
    
    get newlinesAfterCount() {
        let ch0 = String.fromCharCode(0);
        let res = 0;
        let txt = this.kit.sofa.text;
        for (let p = this.endChar + 1; p < txt.length; p++) {
            let ch = txt[p];
            if ((ch.charCodeAt(0)) === 0xD || (ch.charCodeAt(0)) === 0x2028) 
                res++;
            else if ((ch.charCodeAt(0)) === 0xA && (ch0.charCodeAt(0)) !== 0xD) 
                res++;
            else if (ch === '\f') 
                res += 10;
            else if (!Utils.isWhitespace(ch)) 
                break;
            ch0 = ch;
        }
        return res;
    }
    
    get whitespacesAfterCount() {
        if (this.next === null) 
            return 100;
        if ((this.endChar + 1) === this.next.beginChar) 
            return 0;
        return this.calcWhitespaces(this.endChar + 1, this.next.beginChar - 1);
    }
    
    calcWhitespaces(p0, p1) {
        if ((p0 < 0) || p0 > p1 || p1 >= this.kit.sofa.text.length) 
            return -1;
        let res = 0;
        for (let i = p0; i <= p1; i++) {
            let ch = this.kit.getTextCharacter(i);
            if (ch === '\r' || ch === '\n' || (ch.charCodeAt(0)) === 0x2028) {
                res += 10;
                let ch1 = this.kit.getTextCharacter(i + 1);
                if (ch !== ch1 && ((ch1 === '\r' || ch1 === '\n'))) 
                    i++;
            }
            else if (ch === '\t') 
                res += 5;
            else if (ch === '\u0007') 
                res += 100;
            else if (ch === '\f') 
                res += 100;
            else 
                res++;
        }
        return res;
    }
    
    get isHiphen() {
        let ch = this.kit.sofa.text[this.beginChar];
        return LanguageHelper.isHiphen(ch);
    }
    
    get isTableControlChar() {
        let ch = this.kit.sofa.text[this.beginChar];
        return (ch.charCodeAt(0)) === 7 || (ch.charCodeAt(0)) === 0x1F || (ch.charCodeAt(0)) === 0x1E;
    }
    
    get isAnd() {
        return false;
    }
    
    get isOr() {
        return false;
    }
    
    get isComma() {
        return this.isChar(',');
    }
    
    get isCommaAnd() {
        return this.isComma || this.isAnd;
    }
    
    /**
     * Токен состоит из конкретного символа
     * @param ch проверяемый символ
     * @return 
     */
    isChar(ch) {
        if (this.beginChar !== this.endChar) 
            return false;
        return this.kit.sofa.text[this.beginChar] === ch;
    }
    
    /**
     * Токен состоит из одного символа, который есть в указанной строке
     * @param _chars строка возможных символов
     * @return 
     */
    isCharOf(_chars) {
        if (this.beginChar !== this.endChar) 
            return false;
        return _chars.indexOf(this.kit.sofa.text[this.beginChar]) >= 0;
    }
    
    /**
     * Проверка конкретного значения слова (с учётом морф.вариантов)
     * @param term слово (проверяется значение TextToken.Term и все морфварианты)
     * @param termUA слово для проверки на украинском языке
     * @return да-нет
     */
    isValue(term, termUA = null) {
        return false;
    }
    
    /**
     * Проверка двух подряд идущих слов (с учётом морф.вариантов)
     * @param term слово (проверяется значение TextToken.Term и все морфварианты)
     * @param nextTerm слово в следующем токене
     * @return да или нет
     */
    isValue2(term, nextTerm) {
        if (this.next === null) 
            return false;
        if (!this.isValue(term, null)) 
            return false;
        return this.next.isValue(nextTerm, null);
    }
    
    /**
     * Проверка трёх подряд идущих слова (с учётом морф.вариантов)
     * @param term1 первое слово
     * @param term2 слово в след. токене
     * @param term3 слово в третьем токене
     * @return да или нет
     */
    isValue3(term1, term2, term3) {
        if (this.next === null || this.next.next === null) 
            return false;
        if (!this.isValue(term1, null)) 
            return false;
        if (!this.next.isValue(term2, null)) 
            return false;
        return this.next.next.isValue(term3, null);
    }
    
    get isLetters() {
        return false;
    }
    
    /**
     * Получить ссылку на сущность (не null только для ReferentToken)
     * 
     */
    getReferent() {
        return null;
    }
    
    /**
     * Получить список ссылок на все сущности, скрывающиеся под элементом. 
     * Дело в том, что одни сущности могут накрывать другие (например, адрес накроет город).
     * @return 
     */
    getReferents() {
        return null;
    }
    
    /**
     * Получить связанный с токеном текст в именительном падеже
     * @param mc желательная часть речи
     * @param num желательное число
     * @param gender желательный пол
     * @param keepChars сохранять регистр символов (по умолчанию, всё в верхний)
     * @return строка текста
     */
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        return this.toString();
    }
    
    /**
     * Получить фрагмент исходного текста, связанный с токеном
     * @return фрагмент исходного текста
     */
    getSourceText() {
        let len = (this.endChar + 1) - this.beginChar;
        if ((len < 1) || (this.beginChar < 0)) 
            return null;
        if ((this.beginChar + len) > this.kit.sofa.text.length) 
            return null;
        return this.kit.sofa.text.substring(this.beginChar, this.beginChar + len);
    }
    
    /**
     * Проверка, что слово есть в словаре соответствующего языка
     * @return части речи, если не из словаря, то IsUndefined
     */
    getMorphClassInDictionary() {
        return this.morph._class;
    }
    
    serialize(stream) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        SerializerHelper.serializeInt(stream, this.beginChar);
        SerializerHelper.serializeInt(stream, this.endChar);
        SerializerHelper.serializeInt(stream, this.m_Attrs);
        SerializerHelper.serializeInt(stream, this.chars.value);
        if (this.m_Morph === null) 
            this.m_Morph = new MorphCollection();
        this.m_Morph.serialize(stream);
    }
    
    deserialize(stream, _kit, vers) {
        const SerializerHelper = require("./core/internal/SerializerHelper");
        this.kit = _kit;
        this.m_BeginChar = SerializerHelper.deserializeInt(stream);
        this.m_EndChar = SerializerHelper.deserializeInt(stream);
        this.m_Attrs = SerializerHelper.deserializeInt(stream);
        this.chars = CharsInfo._new2650(SerializerHelper.deserializeInt(stream));
        this.m_Morph = new MorphCollection();
        this.m_Morph.deserialize(stream);
    }
}


module.exports = Token