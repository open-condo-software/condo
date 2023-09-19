/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const Termin = require("./../../core/Termin");

class TerrTermin extends Termin {
    
    constructor(source, _lang = null) {
        super(null, _lang, false);
        this.isState = false;
        this.isRegion = false;
        this.isAdjective = false;
        this.isAlwaysPrefix = false;
        this.isDoubt = false;
        this.isMoscowRegion = false;
        this.isStrong = false;
        this.isSpecificPrefix = false;
        this.isSovet = false;
        this.initByNormalText(source, _lang);
    }
    
    static _new1461(_arg1, _arg2) {
        let res = new TerrTermin(_arg1);
        res.gender = _arg2;
        return res;
    }
    
    static _new1462(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1, _arg2);
        res.gender = _arg3;
        return res;
    }
    
    static _new1463(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isState = _arg2;
        res.gender = _arg3;
        return res;
    }
    
    static _new1464(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isState = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new1466(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isState = _arg2;
        res.isDoubt = _arg3;
        return res;
    }
    
    static _new1467(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isState = _arg3;
        res.isDoubt = _arg4;
        return res;
    }
    
    static _new1468(_arg1, _arg2) {
        let res = new TerrTermin(_arg1);
        res.isState = _arg2;
        return res;
    }
    
    static _new1469(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isState = _arg3;
        return res;
    }
    
    static _new1470(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isState = _arg2;
        res.isAdjective = _arg3;
        return res;
    }
    
    static _new1471(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isState = _arg3;
        res.isAdjective = _arg4;
        return res;
    }
    
    static _new1472(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.gender = _arg3;
        return res;
    }
    
    static _new1474(_arg1, _arg2) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        return res;
    }
    
    static _new1475(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isRegion = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new1476(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.acronym = _arg3;
        return res;
    }
    
    static _new1477(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isRegion = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new1482(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.isAlwaysPrefix = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new1485(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isRegion = _arg3;
        res.isAlwaysPrefix = _arg4;
        res.gender = _arg5;
        return res;
    }
    
    static _new1489(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.gender = _arg3;
        res.isAlwaysPrefix = _arg4;
        return res;
    }
    
    static _new1490(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.isAlwaysPrefix = _arg3;
        return res;
    }
    
    static _new1495(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.gender = _arg3;
        res.acronym = _arg4;
        return res;
    }
    
    static _new1497(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.isStrong = _arg3;
        return res;
    }
    
    static _new1500(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isRegion = _arg3;
        res.isStrong = _arg4;
        return res;
    }
    
    static _new1504(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1);
        res.canonicText = _arg2;
        res.isSovet = _arg3;
        res.gender = _arg4;
        return res;
    }
    
    static _new1507(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.isAdjective = _arg3;
        return res;
    }
    
    static _new1508(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isRegion = _arg3;
        res.isAdjective = _arg4;
        return res;
    }
    
    static _new1509(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1);
        res.isRegion = _arg2;
        res.isSpecificPrefix = _arg3;
        res.isAlwaysPrefix = _arg4;
        return res;
    }
    
    static _new1510(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new TerrTermin(_arg1, _arg2);
        res.isRegion = _arg3;
        res.isSpecificPrefix = _arg4;
        res.isAlwaysPrefix = _arg5;
        return res;
    }
    
    static _new1511(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.acronym = _arg2;
        res.gender = _arg3;
        return res;
    }
    
    static _new1512(_arg1, _arg2, _arg3) {
        let res = new TerrTermin(_arg1);
        res.acronym = _arg2;
        res.isRegion = _arg3;
        return res;
    }
    
    static _new1513(_arg1, _arg2, _arg3, _arg4) {
        let res = new TerrTermin(_arg1);
        res.canonicText = _arg2;
        res.acronym = _arg3;
        res.isRegion = _arg4;
        return res;
    }
    
    static _new1514(_arg1, _arg2) {
        let res = new TerrTermin(_arg1);
        res.isMoscowRegion = _arg2;
        return res;
    }
}


module.exports = TerrTermin