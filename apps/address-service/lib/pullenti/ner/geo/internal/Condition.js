/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../../unisharp/StringBuilder");

const MiscLocationHelper = require("./MiscLocationHelper");

class Condition {
    
    constructor() {
        this.geoBeforeToken = null;
        this.pureGeoBefore = false;
    }
    
    toString() {
        let tmp = new StringBuilder();
        if (this.geoBeforeToken !== null) 
            tmp.append("GeoBefore=").append(this.geoBeforeToken);
        return tmp.toString();
    }
    
    check() {
        if (this.geoBeforeToken !== null) {
            if (MiscLocationHelper.checkGeoObjectBefore(this.geoBeforeToken, this.pureGeoBefore)) 
                return true;
        }
        return false;
    }
    
    static _new583(_arg1, _arg2) {
        let res = new Condition();
        res.geoBeforeToken = _arg1;
        res.pureGeoBefore = _arg2;
        return res;
    }
    
    static _new1218(_arg1) {
        let res = new Condition();
        res.geoBeforeToken = _arg1;
        return res;
    }
}


module.exports = Condition