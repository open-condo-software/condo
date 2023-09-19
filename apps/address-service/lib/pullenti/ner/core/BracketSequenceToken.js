/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const GetTextAttr = require("./GetTextAttr");
const MetaToken = require("./../MetaToken");
const MiscHelper = require("./MiscHelper");

/**
 * Метатокен - представление последовательности, обрамлённой кавычками (скобками)
 * Кавычки и скобки
 */
class BracketSequenceToken extends MetaToken {
    
    constructor(begin, end) {
        super(begin, end, null);
        this.internal = new Array();
    }
    
    get isQuoteType() {
        return "{([".indexOf(this.openChar) < 0;
    }
    
    get openChar() {
        return this.beginToken.kit.getTextCharacter(this.beginToken.beginChar);
    }
    
    get closeChar() {
        return this.endToken.kit.getTextCharacter(this.endToken.beginChar);
    }
    
    toString() {
        return super.toString();
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        let attr = GetTextAttr.NO;
        if (num === MorphNumber.SINGULAR) 
            attr = GetTextAttr.of((attr.value()) | (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE.value()));
        else 
            attr = GetTextAttr.of((attr.value()) | (GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE.value()));
        if (keepChars) 
            attr = GetTextAttr.of((attr.value()) | (GetTextAttr.KEEPREGISTER.value()));
        return MiscHelper.getTextValue(this.beginToken, this.endToken, attr);
    }
}


module.exports = BracketSequenceToken