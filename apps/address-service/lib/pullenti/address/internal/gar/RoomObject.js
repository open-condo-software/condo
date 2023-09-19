/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const RoomType = require("./../../RoomType");
const AddressHelper = require("./../../AddressHelper");

class RoomObject {
    
    constructor() {
        this.id = 0;
        this.houseId = 0;
        this.number = null;
        this.typ = RoomType.UNDEFINED;
        this.actual = false;
        this.guid = null;
        this.childrenIds = null;
    }
    
    toString() {
        let res = new StringBuilder();
        res.append(AddressHelper.getRoomTypeString(this.typ, true)).append(this.number);
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
        let n1 = RoomObject._getInt(str1);
        let n2 = RoomObject._getInt(str2);
        if (n1 < n2) 
            return -1;
        if (n1 > n2) 
            return 1;
        if (str1 !== null && str2 !== null) 
            return Utils.compareStrings(str1, str2, false);
        return 0;
    }
    
    compareTo(other) {
        let i = RoomObject._compNums(this.number, other.number);
        if (i !== 0) 
            return i;
        return 0;
    }
}


module.exports = RoomObject