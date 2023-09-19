/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const Termin = require("./../../core/Termin");
const PersonAttrTerminType2 = require("./PersonAttrTerminType2");
const PersonAttrTerminType = require("./PersonAttrTerminType");

class PersonAttrTermin extends Termin {
    
    constructor(v, _lang = null) {
        super(null, _lang, false);
        this.typ = PersonAttrTerminType.OTHER;
        this.typ2 = PersonAttrTerminType2.UNDEFINED;
        this.canBeUniqueIdentifier = false;
        this.canHasPersonAfter = 0;
        this.canBeSameSurname = false;
        this.canBeIndependant = false;
        this.isBoss = false;
        this.isKin = false;
        this.isMilitaryRank = false;
        this.isNation = false;
        this.isPost = false;
        this.isProfession = false;
        this.isDoubt = false;
        this.initByNormalText(v, _lang);
    }
    
    static _new2488(_arg1, _arg2, _arg3) {
        let res = new PersonAttrTermin(_arg1, _arg2);
        res.typ = _arg3;
        return res;
    }
    
    static _new2519(_arg1, _arg2) {
        let res = new PersonAttrTermin(_arg1);
        res.typ = _arg2;
        return res;
    }
    
    static _new2521(_arg1, _arg2, _arg3) {
        let res = new PersonAttrTermin(_arg1);
        res.typ = _arg2;
        res.gender = _arg3;
        return res;
    }
    
    static _new2522(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrTermin(_arg1, _arg2);
        res.typ = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new2530(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrTermin(_arg1);
        res.canonicText = _arg2;
        res.typ2 = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new2531(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new PersonAttrTermin(_arg1, _arg2);
        res.canonicText = _arg3;
        res.typ2 = _arg4;
        res.typ = _arg5;
        return res;
    }
    
    static _new2536(_arg1, _arg2, _arg3) {
        let res = new PersonAttrTermin(_arg1);
        res.typ2 = _arg2;
        res.typ = _arg3;
        return res;
    }
    
    static _new2537(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrTermin(_arg1, _arg2);
        res.typ2 = _arg3;
        res.typ = _arg4;
        return res;
    }
    
    static _new2556(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrTermin(_arg1);
        res.canonicText = _arg2;
        res.typ = _arg3;
        res.typ2 = _arg4;
        return res;
    }
    
    static _new2558(_arg1, _arg2, _arg3, _arg4) {
        let res = new PersonAttrTermin(_arg1);
        res.typ2 = _arg2;
        res.typ = _arg3;
        res.lang = _arg4;
        return res;
    }
    
    static _new2563(_arg1, _arg2, _arg3) {
        let res = new PersonAttrTermin(_arg1);
        res.typ = _arg2;
        res.lang = _arg3;
        return res;
    }
}


module.exports = PersonAttrTermin