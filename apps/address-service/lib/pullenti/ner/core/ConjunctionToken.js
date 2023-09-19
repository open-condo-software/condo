/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MorphNumber = require("./../../morph/MorphNumber");
const MorphGender = require("./../../morph/MorphGender");
const MiscHelper = require("./MiscHelper");
const ConjunctionType = require("./ConjunctionType");
const MetaToken = require("./../MetaToken");

/**
 * Метатокен - представление союзов и других служебных слов. Они могут быть из нескольких токенов, например, "из-за того что". 
 * Получить можно с помощью ConjunctionHelper.TryParse(t)
 * Союзная группа
 */
class ConjunctionToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.normal = null;
        this.typ = ConjunctionType.UNDEFINED;
        this.isSimple = false;
    }
    
    toString() {
        return this.normal;
    }
    
    getNormalCaseText(mc = null, num = MorphNumber.UNDEFINED, gender = MorphGender.UNDEFINED, keepChars = false) {
        let res = this.normal;
        if (keepChars) {
            if (this.chars.isAllLower) 
                res = res.toLowerCase();
            else if (this.chars.isAllUpper) {
            }
            else if (this.chars.isCapitalUpper) 
                res = MiscHelper.convertFirstCharUpperAndOtherLower(res);
        }
        return res;
    }
    
    static _new781(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new ConjunctionToken(_arg1, _arg2);
        res.typ = _arg3;
        res.isSimple = _arg4;
        res.normal = _arg5;
        return res;
    }
    
    static _new782(_arg1, _arg2, _arg3, _arg4) {
        let res = new ConjunctionToken(_arg1, _arg2);
        res.normal = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new783(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new ConjunctionToken(_arg1, _arg2);
        res.normal = _arg3;
        res.isSimple = _arg4;
        res.typ = _arg5;
        return res;
    }
}


module.exports = ConjunctionToken