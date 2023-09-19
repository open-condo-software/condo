/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../../unisharp/StringBuilder");

const GarStatus = require("./../../GarStatus");
const HouseObject = require("./HouseObject");

/**
 * Адресный объект ГАР ФИАС
 */
class AreaObject {
    
    constructor() {
        this.id = 0;
        this.parentIds = new Array();
        this.parentParentIds = null;
        this.typ = null;
        this.names = new Array();
        this.oldTyp = null;
        this.level = 0;
        this.actual = false;
        this.region = 0;
        this.status = GarStatus.OK;
        this.guid = null;
        this.childrenIds = new Array();
        this.tag = null;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.id > 0) 
            res.append(this.id).append(": ");
        if (!this.actual) 
            res.append("(*) ");
        res.append("[").append(this.level).append("] ");
        if (this.typ !== null) 
            res.append(this.typ.name).append(" ");
        if (this.oldTyp !== null) 
            res.append("(уст. ").append(this.oldTyp.name).append(") ");
        if (this.status !== GarStatus.OK) 
            res.append(String(this.status)).append(" ");
        for (let i = 0; i < this.names.length; i++) {
            res.append((i > 0 ? "/" : "")).append(this.names[i]);
        }
        return res.toString();
    }
    
    mergeWith(ao) {
        if (ao.actual === this.actual || ((this.actual && !ao.actual))) {
            for (const n of ao.names) {
                if (!this.names.includes(n)) 
                    this.names.push(n);
            }
            if (ao.oldTyp !== null && this.oldTyp === null) 
                this.oldTyp = ao.oldTyp;
            else if (this.typ !== null && ao.typ !== this.typ && this.oldTyp === null) 
                this.oldTyp = ao.typ;
            if (ao.level > (0) && this.level === (0)) 
                this.level = ao.level;
        }
        else if (!this.actual && ao.actual) {
            this.actual = true;
            let nams = Array.from(ao.names);
            for (const n of this.names) {
                if (!nams.includes(n)) 
                    nams.push(n);
            }
            this.names = nams;
            if (this.typ !== ao.typ) {
                this.oldTyp = this.typ;
                this.typ = ao.typ;
            }
            this.level = ao.level;
        }
        else {
        }
    }
    
    compareTo(other) {
        if (this.level < other.level) 
            return -1;
        if (this.level > other.level) 
            return 1;
        if (this.names.length > 0 && other.names.length > 0) {
            let i = HouseObject._compNums(this.names[0], other.names[0]);
            if (i !== 0) 
                return i;
        }
        return 0;
    }
    
    static _new45(_arg1) {
        let res = new AreaObject();
        res.id = _arg1;
        return res;
    }
    
    static static_constructor() {
        AreaObject.HOUSEMASK = 0x80000000;
        AreaObject.ROOMMASK = 0xC0000000;
    }
}


AreaObject.static_constructor();

module.exports = AreaObject