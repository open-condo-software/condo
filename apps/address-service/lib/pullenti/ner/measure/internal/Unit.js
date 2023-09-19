/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const UnitsFactors = require("./UnitsFactors");
const MeasureKind = require("./../MeasureKind");

// Простая единица измерения (для составной единицы используется UnitToken)
class Unit {
    
    constructor(_nameCyr, _nameLat, fnameCyr, fnameLan) {
        this.nameCyr = null;
        this.nameLat = null;
        this.fullnameCyr = null;
        this.fullnameLat = null;
        this.kind = MeasureKind.UNDEFINED;
        this.baseUnit = null;
        this.multUnit = null;
        this.baseMultiplier = 0;
        this.factor = UnitsFactors.NO;
        this.keywords = new Array();
        this.psevdo = new Array();
        this.nameCyr = _nameCyr;
        this.nameLat = _nameLat;
        this.fullnameCyr = fnameCyr;
        this.fullnameLat = fnameLan;
    }
    
    toString() {
        return this.nameCyr;
    }
    
    static _new1631(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new Unit(_arg1, _arg2, _arg3, _arg4);
        res.kind = _arg5;
        return res;
    }
    
    static _new1637(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new Unit(_arg1, _arg2, _arg3, _arg4);
        res.baseUnit = _arg5;
        res.baseMultiplier = _arg6;
        res.kind = _arg7;
        return res;
    }
    
    static _new1687(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Unit(_arg1, _arg2, _arg3, _arg4);
        res.baseUnit = _arg5;
        res.baseMultiplier = _arg6;
        return res;
    }
    
    static _new1696(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6) {
        let res = new Unit(_arg1, _arg2, _arg3, _arg4);
        res.baseUnit = _arg5;
        res.multUnit = _arg6;
        return res;
    }
    
    static _new1735(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7, _arg8, _arg9) {
        let res = new Unit(_arg1, _arg2, _arg3, _arg4);
        res.factor = _arg5;
        res.baseMultiplier = _arg6;
        res.baseUnit = _arg7;
        res.kind = _arg8;
        res.keywords = _arg9;
        return res;
    }
}


module.exports = Unit