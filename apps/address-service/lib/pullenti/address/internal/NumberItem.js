/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");

const LanguageHelper = require("./../../morph/LanguageHelper");
const NumberItemClass = require("./NumberItemClass");

class NumberItem {
    
    constructor() {
        this.cla = NumberItemClass.UNDEFINED;
        this.value = null;
        this.typ = null;
        this.slash = false;
        this.canBeFlat = false;
        this.twix = null;
    }
    
    toString() {
        return (((this.typ != null ? this.typ : "?")) + " (" + String(this.cla) + "): " + ((this.value != null ? this.value : "")) + (this.slash ? " (after slash)" : "") + (this.canBeFlat ? " (flat?)" : ""));
    }
    
    equalCoef(it) {
        if (this.cla !== it.cla && this.cla !== NumberItemClass.UNDEFINED) {
            if (this.cla === NumberItemClass.FLAT && it.cla === NumberItemClass.SPACE) {
            }
            else if (this.cla === NumberItemClass.SPACE && it.cla === NumberItemClass.FLAT) {
            }
            else 
                return 0;
        }
        let res = 0;
        if (this.value !== it.value) {
            if (this.value === "1" && it.value === "А") 
                res += 0.1;
            else if (this.value === "А" && it.value === "1") 
                res += 0.1;
            else 
                return 0;
        }
        else 
            res += (1);
        if (this.typ !== it.typ || this.typ === null) {
            res /= (2);
            if (this.cla === NumberItemClass.UNDEFINED) {
                if (it.cla === NumberItemClass.PLOT) 
                    res *= 0.3;
                else if (it.cla !== NumberItemClass.HOUSE) 
                    return 0;
            }
        }
        return res;
    }
    
    static parse(val, _typ, _cla) {
        if (Utils.isNullOrEmpty(val)) 
            val = "0";
        if (Utils.compareStrings(val, "Б/Н", true) === 0) 
            val = "0";
        let res = new Array();
        for (let i = 0; i < val.length; i++) {
            let ch = val[i];
            if (!Utils.isLetterOrDigit(ch)) 
                continue;
            let dig = Utils.isDigit(ch);
            let j = 0;
            for (j = i + 1; j < val.length; j++) {
                if (dig !== Utils.isDigit(val[j])) 
                    break;
            }
            let num = new NumberItem();
            if (i === 0 && j === val.length) 
                num.value = val;
            else {
                num.value = val.substring(i, i + j - i);
                while (num.value.length > 1 && num.value[0] === '0') {
                    num.value = num.value.substring(1);
                }
            }
            if (!dig) {
                num.value = num.value.toUpperCase();
                if ((num.value.charCodeAt(0)) < 0x80) {
                    let tmp = new StringBuilder();
                    tmp.append(num.value);
                    for (let k = 0; k < tmp.length; k++) {
                        ch = LanguageHelper.getCyrForLat(tmp.charAt(k));
                        if (ch !== (String.fromCharCode(0))) 
                            tmp.setCharAt(k, ch);
                    }
                    num.value = tmp.toString();
                }
            }
            if (i > 0 && ((val[i - 1] === '/' || val[i - 1] === '\\'))) 
                num.slash = true;
            res.push(num);
            i = j - 1;
        }
        if (_typ !== null && res.length > 0 && res[0].typ === null) 
            res[0].typ = _typ;
        for (const r of res) {
            r.cla = _cla;
        }
        return res;
    }
}


module.exports = NumberItem