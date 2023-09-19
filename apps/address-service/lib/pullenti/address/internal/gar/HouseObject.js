/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const GarStatus = require("./../../GarStatus");

class HouseObject {
    
    constructor() {
        this.id = 0;
        this.parentId = 0;
        this.altParentId = 0;
        this.guid = null;
        this.houseNumber = null;
        this.buildNumber = null;
        this.strucNumber = null;
        this.houseTyp = 0;
        this.strucTyp = 0;
        this.actual = false;
        this.status = GarStatus.OK;
        this.roomIds = null;
        this.tag = null;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.houseNumber !== null) 
            res.append((this.houseTyp === (5) ? "уч." : (this.houseTyp === (2) ? "д." : (this.houseTyp === (1) ? "влад." : (this.houseTyp === (3) ? "дмвлд." : (this.houseTyp === (4) ? "гараж" : "?")))))).append((Utils.isNullOrEmpty(this.houseNumber) ? "б/н" : this.houseNumber));
        if (this.buildNumber !== null) {
            if (res.length > 0) 
                res.append(' ');
            res.append("корп.").append((Utils.isNullOrEmpty(this.buildNumber) ? "б/н" : this.buildNumber));
        }
        if (this.strucNumber !== null) {
            if (res.length > 0) 
                res.append(' ');
            if (this.strucTyp === (2)) 
                res.append("сооруж.");
            else if (this.strucTyp === (3)) 
                res.append("лит.");
            else 
                res.append("стр.");
            res.append((Utils.isNullOrEmpty(this.strucNumber) ? "б/н" : this.strucNumber));
        }
        return res.toString();
    }
    
    static _getInt(str) {
        if (str === null) 
            return 0;
        let res = 0;
        for (let i = 0; i < str.length; i++) {
            if (Utils.isDigit(str[i])) 
                res = ((res * 10) + (str.charCodeAt(i))) - 0x30;
            else 
                break;
        }
        return res;
    }
    
    static _compNums(str1, str2) {
        let n1 = HouseObject._getInt(str1);
        let n2 = HouseObject._getInt(str2);
        if (n1 < n2) 
            return -1;
        if (n1 > n2) 
            return 1;
        if (str1 !== null && str2 !== null) 
            return Utils.compareStrings(str1, str2, false);
        return 0;
    }
    
    compareTo(other) {
        let i = HouseObject._compNums(this.houseNumber, other.houseNumber);
        if (i !== 0) 
            return i;
        if ((((i = HouseObject._compNums(this.buildNumber, other.buildNumber)))) !== 0) 
            return i;
        if ((((i = HouseObject._compNums(this.strucNumber, other.strucNumber)))) !== 0) 
            return i;
        return 0;
    }
    
    static _new49(_arg1) {
        let res = new HouseObject();
        res.id = _arg1;
        return res;
    }
}


module.exports = HouseObject