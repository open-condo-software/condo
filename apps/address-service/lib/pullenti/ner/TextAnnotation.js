/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const TextsCompareType = require("./core/internal/TextsCompareType");

/**
 * Аннотация слитного фрагмента текста (фрагмент вхождения сущности в текст)
 * 
 * Аннотация
 */
class TextAnnotation {
    
    constructor(begin = null, end = null, r = null) {
        this.sofa = null;
        this.beginChar = 0;
        this.endChar = 0;
        this.m_OccurenceOf = null;
        this.essentialForOccurence = false;
        this.tag = null;
        if (begin !== null) {
            this.sofa = begin.kit.sofa;
            this.beginChar = begin.beginChar;
        }
        if (end !== null) 
            this.endChar = end.endChar;
        this.occurenceOf = r;
    }
    
    get occurenceOf() {
        return this.m_OccurenceOf;
    }
    set occurenceOf(value) {
        this.m_OccurenceOf = value;
        return value;
    }
    
    toString() {
        if (this.sofa === null) 
            return (String(this.beginChar) + ":" + this.endChar);
        return this.getText();
    }
    
    /**
     * Извлечь фрагмент исходного текста, соответствующий аннотации
     * @return фрагмент текста
     */
    getText() {
        if (this.sofa === null || this.sofa.text === null) 
            return null;
        let len = (this.endChar + 1) - this.beginChar;
        if (len <= 0) 
            return null;
        return this.sofa.text.substring(this.beginChar, this.beginChar + len);
    }
    
    compareWith(loc) {
        if (loc.sofa !== this.sofa) 
            return TextsCompareType.NONCOMPARABLE;
        return this.compare(loc.beginChar, loc.endChar);
    }
    
    compare(pos, pos1) {
        if (this.endChar < pos) 
            return TextsCompareType.EARLY;
        if (pos1 < this.beginChar) 
            return TextsCompareType.LATER;
        if (this.beginChar === pos && this.endChar === pos1) 
            return TextsCompareType.EQUIVALENT;
        if (this.beginChar >= pos && this.endChar <= pos1) 
            return TextsCompareType.IN;
        if (pos >= this.beginChar && pos1 <= this.endChar) 
            return TextsCompareType.CONTAINS;
        return TextsCompareType.INTERSECT;
    }
    
    merge(loc) {
        if (loc.sofa !== this.sofa) 
            return;
        if (loc.beginChar < this.beginChar) 
            this.beginChar = loc.beginChar;
        if (this.endChar < loc.endChar) 
            this.endChar = loc.endChar;
        if (loc.essentialForOccurence) 
            this.essentialForOccurence = true;
    }
    
    static _new777(_arg1, _arg2, _arg3) {
        let res = new TextAnnotation();
        res.sofa = _arg1;
        res.beginChar = _arg2;
        res.endChar = _arg3;
        return res;
    }
    
    static _new1070(_arg1, _arg2, _arg3, _arg4) {
        let res = new TextAnnotation();
        res.sofa = _arg1;
        res.beginChar = _arg2;
        res.endChar = _arg3;
        res.occurenceOf = _arg4;
        return res;
    }
    
    static _new1577(_arg1, _arg2, _arg3, _arg4) {
        let res = new TextAnnotation();
        res.beginChar = _arg1;
        res.endChar = _arg2;
        res.occurenceOf = _arg3;
        res.sofa = _arg4;
        return res;
    }
    
    static _new2952(_arg1, _arg2, _arg3) {
        let res = new TextAnnotation();
        res.beginChar = _arg1;
        res.endChar = _arg2;
        res.sofa = _arg3;
        return res;
    }
    
    static _new2954(_arg1, _arg2) {
        let res = new TextAnnotation();
        res.sofa = _arg1;
        res.occurenceOf = _arg2;
        return res;
    }
}


module.exports = TextAnnotation