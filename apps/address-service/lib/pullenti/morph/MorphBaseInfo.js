/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const StringBuilder = require("./../unisharp/StringBuilder");

const MorphGender = require("./MorphGender");
const MorphNumber = require("./MorphNumber");
const MorphLang = require("./MorphLang");
const MorphClass = require("./MorphClass");
const MorphCase = require("./MorphCase");

/**
 * Базовая часть морфологической информации
 * 
 * основная морф.информация
 */
class MorphBaseInfo {
    
    constructor() {
        this.m_Cla = new MorphClass();
        this._gender = MorphGender.UNDEFINED;
        this._number = MorphNumber.UNDEFINED;
        this.m_Cas = new MorphCase();
        this.m_Lang = new MorphLang();
    }
    
    get _class() {
        return this.m_Cla;
    }
    set _class(value) {
        this.m_Cla = value;
        return value;
    }
    
    get gender() {
        return this._gender;
    }
    set gender(value) {
        this._gender = value;
        return this._gender;
    }
    
    get number() {
        return this._number;
    }
    set number(value) {
        this._number = value;
        return this._number;
    }
    
    get _case() {
        return this.m_Cas;
    }
    set _case(value) {
        this.m_Cas = value;
        return value;
    }
    
    get language() {
        return this.m_Lang;
    }
    set language(value) {
        this.m_Lang = value;
        return value;
    }
    
    toString() {
        let res = new StringBuilder();
        if (!this._class.isUndefined) 
            res.append(this._class.toString()).append(" ");
        if (this.number !== MorphNumber.UNDEFINED) {
            if (this.number === MorphNumber.SINGULAR) 
                res.append("ед.ч. ");
            else if (this.number === MorphNumber.PLURAL) 
                res.append("мн.ч. ");
            else 
                res.append("ед.мн.ч. ");
        }
        if (this.gender !== MorphGender.UNDEFINED) {
            if (this.gender === MorphGender.MASCULINE) 
                res.append("муж.р. ");
            else if (this.gender === MorphGender.NEUTER) 
                res.append("ср.р. ");
            else if (this.gender === MorphGender.FEMINIE) 
                res.append("жен.р. ");
            else if ((this.gender.value()) === ((MorphGender.MASCULINE.value()) | (MorphGender.NEUTER.value()))) 
                res.append("муж.ср.р. ");
            else if ((this.gender.value()) === ((MorphGender.FEMINIE.value()) | (MorphGender.NEUTER.value()))) 
                res.append("жен.ср.р. ");
            else if ((this.gender.value()) === 7) 
                res.append("муж.жен.ср.р. ");
            else if ((this.gender.value()) === ((MorphGender.FEMINIE.value()) | (MorphGender.MASCULINE.value()))) 
                res.append("муж.жен.р. ");
        }
        if (!this._case.isUndefined) 
            res.append(this._case.toString()).append(" ");
        if (!this.language.isUndefined && !this.language.equals(MorphLang.RU)) 
            res.append(this.language.toString()).append(" ");
        return Utils.trimEndString(res.toString());
    }
    
    copyFrom(src) {
        let cla = new MorphClass();
        cla.value = src._class.value;
        this._class = cla;
        this.gender = src.gender;
        this.number = src.number;
        let cas = new MorphCase();
        cas.value = src._case.value;
        this._case = cas;
        let lng = new MorphLang();
        lng.value = src.language.value;
        this.language = lng;
    }
    
    containsAttr(attrValue, cla = null) {
        return false;
    }
    
    checkAccord(v, ignoreGender = false, ignoreNumber = false) {
        if (!v.language.equals(this.language)) {
            if (v.language.isUndefined && this.language.isUndefined) 
                return false;
        }
        let num = (v.number.value()) & (this.number.value());
        if ((num) === (MorphNumber.UNDEFINED.value()) && !ignoreNumber) {
            if (v.number !== MorphNumber.UNDEFINED && this.number !== MorphNumber.UNDEFINED) {
                if (v.number === MorphNumber.SINGULAR && v._case.isGenitive) {
                    if (this.number === MorphNumber.PLURAL && this._case.isGenitive) {
                        if (((v.gender.value()) & (MorphGender.MASCULINE.value())) === (MorphGender.MASCULINE.value())) 
                            return true;
                    }
                }
                return false;
            }
        }
        if (!ignoreGender && (num) !== (MorphNumber.PLURAL.value())) {
            if (((v.gender.value()) & (this.gender.value())) === (MorphGender.UNDEFINED.value())) {
                if (v.gender !== MorphGender.UNDEFINED && this.gender !== MorphGender.UNDEFINED) 
                    return false;
            }
        }
        if ((MorphCase.ooBitand(v._case, this._case)).isUndefined) {
            if (!v._case.isUndefined && !this._case.isUndefined) 
                return false;
        }
        return true;
    }
    
    static _new444(_arg1, _arg2) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        res.number = _arg2;
        return res;
    }
    
    static _new446(_arg1, _arg2) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        res.gender = _arg2;
        return res;
    }
    
    static _new593(_arg1, _arg2, _arg3, _arg4) {
        let res = new MorphBaseInfo();
        res._case = _arg1;
        res._class = _arg2;
        res.number = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new703(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        res.gender = _arg2;
        res.number = _arg3;
        res._case = _arg4;
        res.language = _arg5;
        return res;
    }
    
    static _new795(_arg1, _arg2, _arg3, _arg4) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        res.gender = _arg2;
        res.number = _arg3;
        res.language = _arg4;
        return res;
    }
    
    static _new798(_arg1, _arg2, _arg3) {
        let res = new MorphBaseInfo();
        res.gender = _arg1;
        res._case = _arg2;
        res.number = _arg3;
        return res;
    }
    
    static _new801(_arg1, _arg2, _arg3, _arg4) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        res._case = _arg2;
        res.number = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new802(_arg1, _arg2, _arg3) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        res._case = _arg2;
        res.number = _arg3;
        return res;
    }
    
    static _new808(_arg1, _arg2) {
        let res = new MorphBaseInfo();
        res._case = _arg1;
        res.language = _arg2;
        return res;
    }
    
    static _new826(_arg1) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        return res;
    }
    
    static _new1823(_arg1, _arg2, _arg3) {
        let res = new MorphBaseInfo();
        res._case = _arg1;
        res.gender = _arg2;
        res.number = _arg3;
        return res;
    }
    
    static _new2464(_arg1, _arg2, _arg3) {
        let res = new MorphBaseInfo();
        res._class = _arg1;
        res.gender = _arg2;
        res.language = _arg3;
        return res;
    }
    
    static _new2511(_arg1) {
        let res = new MorphBaseInfo();
        res._case = _arg1;
        return res;
    }
    
    static _new2569(_arg1, _arg2) {
        let res = new MorphBaseInfo();
        res._case = _arg1;
        res.gender = _arg2;
        return res;
    }
    
    static _new2588(_arg1, _arg2) {
        let res = new MorphBaseInfo();
        res.gender = _arg1;
        res._case = _arg2;
        return res;
    }
    
    static _new2614(_arg1) {
        let res = new MorphBaseInfo();
        res.gender = _arg1;
        return res;
    }
    
    static _new2663(_arg1, _arg2, _arg3) {
        let res = new MorphBaseInfo();
        res._case = _arg1;
        res.gender = _arg2;
        res._class = _arg3;
        return res;
    }
    
    static _new2703(_arg1, _arg2) {
        let res = new MorphBaseInfo();
        res.number = _arg1;
        res.language = _arg2;
        return res;
    }
    
    static _new2709(_arg1, _arg2, _arg3) {
        let res = new MorphBaseInfo();
        res.gender = _arg1;
        res.number = _arg2;
        res.language = _arg3;
        return res;
    }
    
    static _new2712(_arg1, _arg2, _arg3) {
        let res = new MorphBaseInfo();
        res.number = _arg1;
        res.gender = _arg2;
        res.language = _arg3;
        return res;
    }
}


module.exports = MorphBaseInfo