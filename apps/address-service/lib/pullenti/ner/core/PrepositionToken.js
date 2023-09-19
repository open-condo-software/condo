/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const MetaToken = require("./../MetaToken");
const MiscHelper = require("./MiscHelper");

/**
 * Метатокен - предлог (они могут быть из нескольких токенов, например, 
 * "несмотря на", "в соответствии с"). 
 * Создаётся методом PrepositionHelper.TryParse(t).
 * Предложная группа
 */
class PrepositionToken extends MetaToken {
    
    constructor(b, e) {
        super(b, e, null);
        this.normal = null;
        this.nextCase = null;
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
    
    static _new849(_arg1, _arg2, _arg3, _arg4) {
        let res = new PrepositionToken(_arg1, _arg2);
        res.normal = _arg3;
        res.nextCase = _arg4;
        return res;
    }
}


module.exports = PrepositionToken