/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const LanguageHelper = require("./../../morph/LanguageHelper");

// Элемент внутреннего онтологического словаря
class IntOntologyItem {
    
    constructor(r) {
        this.termins = new Array();
        this.m_CanonicText = null;
        this.typ = null;
        this.miscAttr = null;
        this.owner = null;
        this.referent = null;
        this.tag = null;
        this.referent = r;
    }
    
    get canonicText() {
        if (this.m_CanonicText === null && this.termins.length > 0) 
            this.m_CanonicText = this.termins[0].canonicText;
        return (this.m_CanonicText != null ? this.m_CanonicText : "?");
    }
    set canonicText(value) {
        this.m_CanonicText = value;
        return value;
    }
    
    setShortestCanonicalText(ignoreTerminsWithNotnullTags = false) {
        this.m_CanonicText = null;
        for (const t of this.termins) {
            if (ignoreTerminsWithNotnullTags && t.tag !== null) 
                continue;
            if (t.terms.length === 0) 
                continue;
            let s = t.canonicText;
            if (!LanguageHelper.isCyrillicChar(s[0])) 
                continue;
            if (this.m_CanonicText === null) 
                this.m_CanonicText = s;
            else if (s.length < this.m_CanonicText.length) 
                this.m_CanonicText = s;
        }
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.typ !== null) 
            res.append(this.typ).append(": ");
        res.append(this.canonicText);
        for (const t of this.termins) {
            let tt = t.toString();
            if (tt === this.canonicText) 
                continue;
            res.append("; ");
            res.append(tt);
        }
        if (this.referent !== null) 
            res.append(" [").append(this.referent).append("]");
        return res.toString();
    }
}


module.exports = IntOntologyItem