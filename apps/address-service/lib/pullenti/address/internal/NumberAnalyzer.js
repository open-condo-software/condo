/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const AddressBuildingType = require("./../../ner/address/AddressBuildingType");
const RoomType = require("./../RoomType");
const AddressHelper = require("./../AddressHelper");
const NumberItemClass = require("./NumberItemClass");
const HouseRoomHelper = require("./HouseRoomHelper");
const NumberItem = require("./NumberItem");
const AddressHouseType = require("./../../ner/address/AddressHouseType");

class NumberAnalyzer {
    
    constructor() {
        this.items = new Array();
    }
    
    toString() {
        if (this.items.length === 0) 
            return "?";
        if (this.items.length === 1) 
            return this.items[0].toString();
        let res = new StringBuilder();
        res.append(this.items[0].toString());
        for (let i = 1; i < this.items.length; i++) {
            res.append(", ").append(this.items[i].toString());
        }
        return res.toString();
    }
    
    calcCoef(num) {
        let res = 0;
        for (const it of num.items) {
            it.twix = null;
        }
        for (const it of this.items) {
            it.twix = null;
            let best = null;
            let max = 0;
            for (const it1 of num.items) {
                if (it1.twix === null) {
                    let co = it.equalCoef(it1);
                    if (co > max) {
                        best = it1;
                        max = co;
                    }
                }
            }
            if (best === null) 
                continue;
            if (best.twix !== null) 
                continue;
            it.twix = best;
            best.twix = it;
            res += max;
        }
        if (res === 0) 
            return 0;
        let cou = 0;
        for (const it of this.items) {
            if (it.value === "0") 
                continue;
            cou++;
            if (it.twix === null) {
                if (it === this.items[0]) 
                    return 0;
                res /= (2);
            }
            else if (this.items.indexOf(it) !== num.items.indexOf(it.twix)) 
                res /= (2);
        }
        for (const it of num.items) {
            if (it.value === "0") 
                continue;
            cou++;
            if (it.twix === null) {
                if (it === num.items[0]) 
                    return 0;
                res /= (2);
            }
        }
        if (cou === 0) 
            cou = 1;
        return res;
    }
    
    static tryParseReferent(ar, house) {
        let res = new NumberAnalyzer();
        if (house) {
            if (ar.houseOrPlot !== null) {
                let nums = NumberItem.parse(ar.houseOrPlot, null, NumberItemClass.UNDEFINED);
                if (nums !== null) 
                    res.items.splice(res.items.length, 0, ...nums);
            }
            else if (ar.plot !== null) {
                let nums = NumberItem.parse(ar.plot, "уч.", NumberItemClass.PLOT);
                if (nums !== null) 
                    res.items.splice(res.items.length, 0, ...nums);
            }
            else if (ar.box !== null) {
                let nums = NumberItem.parse(ar.box, "гар.", NumberItemClass.GARAGE);
                if (nums !== null) 
                    res.items.splice(res.items.length, 0, ...nums);
            }
            else {
                if (ar.house !== null) {
                    let ty = ar.houseType;
                    let nums = NumberItem.parse(ar.house, (ty === AddressHouseType.ESTATE ? "влад." : (ty === AddressHouseType.HOUSEESTATE ? "дмвлд." : "д.")), NumberItemClass.HOUSE);
                    if (nums !== null) 
                        res.items.splice(res.items.length, 0, ...nums);
                }
                if (ar.corpus !== null) {
                    let nums = NumberItem.parse(ar.corpus, "корп.", NumberItemClass.HOUSE);
                    if (nums !== null) 
                        res.items.splice(res.items.length, 0, ...nums);
                }
                if (ar.corpusOrFlat !== null) {
                    let nums = NumberItem.parse(ar.corpusOrFlat, "корп.", NumberItemClass.HOUSE);
                    if (nums !== null) {
                        nums[0].canBeFlat = true;
                        res.items.splice(res.items.length, 0, ...nums);
                    }
                }
                if (ar.building !== null) {
                    let ty = ar.buildingType;
                    let nums = NumberItem.parse(ar.building, (ty === AddressBuildingType.CONSTRUCTION ? "сооруж." : (ty === AddressBuildingType.LITER ? "лит." : "стр.")), NumberItemClass.HOUSE);
                    if (nums !== null) 
                        res.items.splice(res.items.length, 0, ...nums);
                }
            }
        }
        else {
            let attr = HouseRoomHelper.createApartmentAttrs(ar, null);
            if (attr !== null) {
                let nums = NumberItem.parse(attr.number, AddressHelper.getRoomTypeString(attr.typ, true), (attr.typ === RoomType.CARPLACE ? NumberItemClass.CARPLACE : (attr.typ === RoomType.FLAT ? NumberItemClass.FLAT : NumberItemClass.SPACE)));
                if (nums === null) 
                    return null;
                res.items.splice(res.items.length, 0, ...nums);
            }
        }
        if (res.items.length === 0) 
            return null;
        return res;
    }
    
    static tryParseHO(ho) {
        let res = new NumberAnalyzer();
        if (ho.houseNumber !== null) {
            let nums = NumberItem.parse(ho.houseNumber, (ho.houseTyp === (1) ? "влад." : (ho.houseTyp === (2) ? "д." : (ho.houseTyp === (3) ? "дмвлд." : (ho.houseTyp === (4) ? "гар." : (ho.houseTyp === (5) ? "уч." : "д."))))), (ho.houseTyp === (4) ? NumberItemClass.GARAGE : (ho.houseTyp === (5) ? NumberItemClass.PLOT : NumberItemClass.HOUSE)));
            if (nums !== null) 
                res.items.splice(res.items.length, 0, ...nums);
        }
        if (ho.buildNumber !== null) {
            let nums = NumberItem.parse(ho.buildNumber, "корп.", NumberItemClass.HOUSE);
            if (nums !== null) 
                res.items.splice(res.items.length, 0, ...nums);
        }
        if (ho.strucNumber !== null) {
            let nums = NumberItem.parse(ho.strucNumber, (ho.strucTyp === (2) ? "сооруж." : (ho.houseTyp === (3) ? "лит." : "стр.")), NumberItemClass.HOUSE);
            if (nums !== null) 
                res.items.splice(res.items.length, 0, ...nums);
        }
        return res;
    }
    
    static tryParseRO(ro) {
        let nums = NumberItem.parse(ro.number, AddressHelper.getRoomTypeString(ro.typ, true), (ro.typ === RoomType.CARPLACE ? NumberItemClass.CARPLACE : (ro.typ === RoomType.FLAT ? NumberItemClass.FLAT : NumberItemClass.SPACE)));
        if (nums === null) 
            return null;
        let res = new NumberAnalyzer();
        res.items.splice(res.items.length, 0, ...nums);
        return res;
    }
}


module.exports = NumberAnalyzer