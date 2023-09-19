/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

const MorphPerson = require("./MorphPerson");
const MorphGender = require("./MorphGender");
const MorphBaseInfo = require("./MorphBaseInfo");
const MorphNumber = require("./MorphNumber");
const LanguageHelper = require("./LanguageHelper");
const MorphCase = require("./MorphCase");
const MorphMiscInfo = require("./MorphMiscInfo");

/**
 * Словоформа (вариант морфанализа лексемы)
 * 
 * словоформа
 */
class MorphWordForm extends MorphBaseInfo {
    
    get isInDictionary() {
        return this.undefCoef === (0);
    }
    
    copyFromWordForm(src) {
        super.copyFrom(src);
        this.undefCoef = src.undefCoef;
        this.normalCase = src.normalCase;
        this.normalFull = src.normalFull;
        this.misc = src.misc;
    }
    
    constructor(v = null, word = null, mi = null) {
        super();
        this.normalFull = null;
        this.normalCase = null;
        this.misc = null;
        this.undefCoef = 0;
        this.tag = null;
        if (v === null) 
            return;
        this.copyFrom(v);
        this.misc = mi;
        if (v.normalTail !== null && word !== null) {
            let wordBegin = word;
            if (LanguageHelper.endsWith(word, v.tail)) 
                wordBegin = word.substring(0, 0 + word.length - v.tail.length);
            if (v.normalTail.length > 0) 
                this.normalCase = wordBegin + v.normalTail;
            else 
                this.normalCase = wordBegin;
        }
        if (v.fullNormalTail !== null && word !== null) {
            let wordBegin = word;
            if (LanguageHelper.endsWith(word, v.tail)) 
                wordBegin = word.substring(0, 0 + word.length - v.tail.length);
            if (v.fullNormalTail.length > 0) 
                this.normalFull = wordBegin + v.fullNormalTail;
            else 
                this.normalFull = wordBegin;
        }
    }
    
    toString() {
        return this.toStringEx(false);
    }
    
    toStringEx(ignoreNormals) {
        let res = new StringBuilder();
        if (!ignoreNormals) {
            res.append((this.normalCase != null ? this.normalCase : ""));
            if (this.normalFull !== null && this.normalFull !== this.normalCase) 
                res.append("\\").append(this.normalFull);
            if (res.length > 0) 
                res.append(' ');
        }
        res.append(super.toString());
        let s = (this.misc === null ? null : this.misc.toString());
        if (!Utils.isNullOrEmpty(s)) 
            res.append(" ").append(s);
        if (this.undefCoef > (0)) 
            res.append(" (? ").append(this.undefCoef).append(")");
        return res.toString();
    }
    
    containsAttr(attrValue, cla = null) {
        if (this.misc !== null && this.misc.attrs !== null) 
            return this.misc.attrs.includes(attrValue);
        return false;
    }
    
    hasMorphEquals(list) {
        for (const mr of list) {
            if ((this._class.equals(mr._class) && this.number === mr.number && this.gender === mr.gender) && this.normalCase === mr.normalCase && this.normalFull === mr.normalFull) {
                mr._case = MorphCase.ooBitor(mr._case, this._case);
                let p = this.misc.person;
                if (p !== MorphPerson.UNDEFINED && p !== mr.misc.person) {
                    let mi = new MorphMiscInfo();
                    mi.copyFrom(mr.misc);
                    mi.person = MorphPerson.of((mr.misc.person.value()) | (this.misc.person.value()));
                    mr.misc = mi;
                }
                return true;
            }
        }
        for (const mr of list) {
            if ((this._class.equals(mr._class) && this.number === mr.number && this._case.equals(mr._case)) && this.normalCase === mr.normalCase && this.normalFull === mr.normalFull) {
                mr.gender = MorphGender.of((mr.gender.value()) | (this.gender.value()));
                return true;
            }
        }
        for (const mr of list) {
            if ((this._class.equals(mr._class) && this.gender === mr.gender && this._case.equals(mr._case)) && this.normalCase === mr.normalCase && this.normalFull === mr.normalFull) {
                mr.number = MorphNumber.of((mr.number.value()) | (this.number.value()));
                return true;
            }
        }
        return false;
    }
    
    static _new218(_arg1, _arg2, _arg3) {
        let res = new MorphWordForm();
        res.normalCase = _arg1;
        res._class = _arg2;
        res.undefCoef = _arg3;
        return res;
    }
    
    static _new928(_arg1, _arg2, _arg3) {
        let res = new MorphWordForm();
        res._case = _arg1;
        res.number = _arg2;
        res.gender = _arg3;
        return res;
    }
    
    static _new931(_arg1, _arg2) {
        let res = new MorphWordForm();
        res._class = _arg1;
        res.misc = _arg2;
        return res;
    }
}


module.exports = MorphWordForm