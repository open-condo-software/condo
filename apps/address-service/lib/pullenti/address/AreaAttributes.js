/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");

const BaseAttributes = require("./BaseAttributes");
const MiscHelper = require("./../ner/core/MiscHelper");
const AddrLevel = require("./AddrLevel");

/**
 * Атрибуты города, региона, района, квартала, улиц и т.п.
 */
class AreaAttributes extends BaseAttributes {
    
    constructor() {
        super();
        this.types = new Array();
        this.names = new Array();
        this.number = null;
        this.miscs = new Array();
    }
    
    toString() {
        return this.toStringEx(AddrLevel.UNDEFINED, false);
    }
    
    toStringEx(lev, isGar) {
        let res = (this.types.length > 0 ? this.types[0] : "");
        let outNum = false;
        if ((lev === AddrLevel.STREET && this.types.length > 1 && this.types[1] !== "улица") && res === "улица") 
            res = this.types[1];
        let br = false;
        if (res === "территория" || lev === AddrLevel.TERRITORY) {
            if (this.miscs.length > 0 && !isGar && this.miscs[0] !== "дорога") {
                if (this.names.length > 0 && this.names[0].includes(this.miscs[0])) {
                }
                else if (this.names.length > 0 || this.number !== null) {
                    res = (res + " " + this.miscs[0]);
                    if (this.names.length > 0) 
                        br = true;
                }
            }
        }
        if (this.number !== null && lev === AddrLevel.STREET && !this.number.endsWith("км")) {
            res = (res + " " + this.number);
            outNum = true;
        }
        if (this.names.length > 0) {
            if (res === "километр" && !Utils.isDigit(this.names[0][0])) 
                res = (this.names[0] + " километр");
            else if (br) {
                if (this.number !== null && !outNum) {
                    res = (res + " \"" + this.names[0] + "-" + this.number + "\"");
                    outNum = true;
                }
                else 
                    res = (res + " \"" + this.names[0] + "\"");
            }
            else {
                res = (res + " " + this.names[0]);
                if (lev === AddrLevel.LOCALITY || lev === AddrLevel.SETTLEMENT) {
                    if (this.miscs.length > 0 && !this.types.includes(this.miscs[0])) 
                        res = (res + " " + MiscHelper.convertFirstCharUpperAndOtherLower(this.miscs[0]));
                }
            }
        }
        else if (((lev === AddrLevel.STREET || lev === AddrLevel.TERRITORY)) && this.types.length > 1) {
            if (this.types[1] !== "улица") 
                res = (res + " " + MiscHelper.convertFirstCharUpperAndOtherLower(this.types[1]));
            else {
                res = this.types[1];
                if (this.number !== null && lev === AddrLevel.STREET) {
                    res = (res + " " + this.number);
                    outNum = true;
                }
                res = (res + " " + MiscHelper.convertFirstCharUpperAndOtherLower(this.types[0]));
            }
        }
        if (this.number !== null && !outNum) {
            if (res === "километр") 
                res = (this.number + " километр");
            else {
                let nnn = 0;
                if (lev === AddrLevel.TERRITORY) {
                    if (this.number.length > 3) 
                        res = (res + " №" + this.number);
                    else 
                        res = (res + "-" + this.number);
                }
                else {
                    let wrapnnn203 = new RefOutArgWrapper();
                    let inoutres204 = Utils.tryParseInt(this.number, wrapnnn203);
                    nnn = wrapnnn203.value;
                    if (inoutres204) 
                        res = (res + "-" + this.number);
                    else 
                        res = (res + " " + this.number);
                }
            }
        }
        if (this.names.length === 0 && this.number === null && this.miscs.length > 0) 
            res = (res + " " + MiscHelper.convertFirstCharUpperAndOtherLower(this.miscs[0]));
        return res.trim();
    }
    
    outInfo(res) {
        if (this.types.length > 0) {
            res.append("Тип: ").append(this.types[0]);
            for (let i = 1; i < this.types.length; i++) {
                res.append(" / ").append(this.types[i]);
            }
            res.append("\r\n");
        }
        if (this.names.length > 0) {
            res.append("Наименование: ").append(this.names[0]);
            for (let i = 1; i < this.names.length; i++) {
                res.append(" / ").append(this.names[i]);
            }
            res.append("\r\n");
        }
        if (this.number !== null) 
            res.append("Номер: ").append(this.number).append("\r\n");
        if (this.miscs.length > 0) {
            res.append("Дополнительно: ").append(this.miscs[0]);
            for (let i = 1; i < this.miscs.length; i++) {
                res.append(" / ").append(this.miscs[i]);
            }
            res.append("\r\n");
        }
    }
    
    serialize(xml) {
        xml.writeStartElement("area");
        for (const ty of this.types) {
            xml.writeElementString("type", ty);
        }
        for (const nam of this.names) {
            xml.writeElementString("name", nam);
        }
        for (const misc of this.miscs) {
            xml.writeElementString("misc", misc);
        }
        if (this.number !== null) 
            xml.writeElementString("num", this.number);
        xml.writeEndElement();
    }
    
    deserialize(xml) {
        for (const x of xml.child_nodes) {
            if (x.local_name === "type") 
                this.types.push(x.inner_text);
            else if (x.local_name === "name") 
                this.names.push(x.inner_text);
            else if (x.local_name === "misc") 
                this.miscs.push(x.inner_text);
            else if (x.local_name === "num") 
                this.number = x.inner_text;
        }
    }
    
    hasEqualType(typs) {
        if (typs === null) 
            return false;
        for (const ty of this.types) {
            if (typs.includes(ty)) 
                return true;
            if (ty.includes("поселок")) {
                for (const tyy of typs) {
                    if (tyy.includes("поселок")) 
                        return true;
                }
            }
        }
        return false;
    }
    
    findMisc(_miscs) {
        if (_miscs !== null) {
            for (const m of _miscs) {
                if (this.miscs.includes(m)) 
                    return m;
            }
        }
        return null;
    }
    
    containsName(subName) {
        for (const n of this.names) {
            if (n.includes(subName)) 
                return true;
            else if (Utils.compareStrings(n, subName, true) === 0) 
                return true;
        }
        return false;
    }
    
    clone() {
        let res = new AreaAttributes();
        res.types.splice(res.types.length, 0, ...this.types);
        res.names.splice(res.names.length, 0, ...this.names);
        res.miscs.splice(res.miscs.length, 0, ...this.miscs);
        res.number = this.number;
        return res;
    }
}


module.exports = AreaAttributes