/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../unisharp/StringBuilder");

/**
 * Параметры обработки текста
 */
class ProcessTextParams {
    
    constructor() {
        this.defaultRegions = new Array();
        this.defaultObject = null;
    }
    
    toString() {
        let tmp = new StringBuilder();
        if (this.defaultRegions.length === 1) 
            tmp.append("Регион: ").append(this.defaultRegions[0]);
        else if (this.defaultRegions.length > 0) {
            tmp.append("Регионы: ").append(this.defaultRegions[0]);
            for (let i = 1; i < this.defaultRegions.length; i++) {
                tmp.append(",").append(this.defaultRegions[i]);
            }
        }
        if (this.defaultObject !== null) 
            tmp.append(" Объект: ").append(this.defaultObject.toString());
        if (tmp.length === 0) 
            tmp.append("Нет");
        return tmp.toString();
    }
}


module.exports = ProcessTextParams