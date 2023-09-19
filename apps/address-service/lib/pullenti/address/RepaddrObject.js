/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");

const AddrLevel = require("./AddrLevel");
const AddressHelper = require("./AddressHelper");

/**
 * Адресный элемент из Адрессария
 * 
 */
class RepaddrObject {
    
    constructor() {
        this.id = 0;
        this.parents = null;
        this.children = null;
        this.spelling = null;
        this.level = AddrLevel.UNDEFINED;
        this.types = new Array();
        this.garGuids = null;
    }
    
    toString() {
        return this.spelling;
    }
    
    outInfo(res) {
        res.append("Уникальный ID: ").append(this.id).append("\r\n");
        res.append("Нормализация: ").append(this.spelling).append("\r\n");
        if (this.level !== AddrLevel.UNDEFINED) 
            res.append("Уровень: ").append((this.level.value())).append(" - ").append(AddressHelper.getAddrLevelString(this.level)).append("\r\n");
        if (this.garGuids !== null) {
            for (const g of this.garGuids) {
                res.append("ГАР-объект: ").append(g).append("\r\n");
            }
        }
    }
    
    compareTo(other) {
        let l1 = this.level.value();
        if (this.level === AddrLevel.COUNTRY) 
            l1 = 0;
        let l2 = other.level.value();
        if (other.level === AddrLevel.COUNTRY) 
            l2 = 0;
        if (l1 < l2) 
            return -1;
        if (l1 > l2) 
            return 1;
        return Utils.compareStrings(this.spelling, other.spelling, false);
    }
}


module.exports = RepaddrObject