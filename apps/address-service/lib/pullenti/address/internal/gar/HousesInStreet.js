/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const Stream = require("./../../../unisharp/Stream");
const MemoryStream = require("./../../../unisharp/MemoryStream");

const FiasHouseTable = require("./FiasHouseTable");
const NumberAnalyzer = require("./../NumberAnalyzer");
const FiasHelper = require("./../FiasHelper");
const HouseObject = require("./HouseObject");

class HousesInStreet {
    
    constructor() {
        this.m_Houses = null;
        this.refs = new Hashtable();
        this.m_Data = null;
        this.m_HousesPos = null;
        this.m_Lock = new Object();
    }
    
    toString() {
        return (String((this.m_Houses !== null ? this.m_Houses.length : (this.m_HousesPos !== null ? this.m_HousesPos.length : 0))) + " houses, " + this.refs.length + " refs");
    }
    
    load(dat) {
        if (dat === null || (dat.length < 8)) 
            return;
        this.m_Data = dat;
        let ind = 4;
        let cou = Utils.bytesToObject(dat, ind, 'int', 4);
        ind += 4;
        let pos0 = Utils.bytesToObject(dat, ind, 'int', 4);
        ind += 4;
        this.m_HousesPos = new Int32Array(cou);
        for (let i = 0; i < cou; i++,ind += 4) {
            this.m_HousesPos[i] = Utils.bytesToObject(dat, ind, 'int', 4);
        }
        ind = pos0;
        cou = Utils.bytesToObject(dat, ind, 'int', 4);
        ind += 4;
        this.refs.clear();
        for (let i = 0; i < cou; i++) {
            let wrapind54 = new RefOutArgWrapper(ind);
            let key = FiasHelper.deserializeStringFromBytes(dat, wrapind54, false);
            ind = wrapind54.value;
            let cou2 = Utils.bytesToObject(dat, ind, 'short', 2);
            ind += 2;
            let li = new Array();
            for (let j = 0; j < cou2; j++,ind += 2) {
                li.push(Utils.bytesToObject(dat, ind, 'short', 2));
            }
            this.refs.put(key, li);
        }
    }
    
    getHouses(na) {
        let inds = new Array();
        for (const it of na.items) {
            let li = [ ];
            let wrapli55 = new RefOutArgWrapper();
            let inoutres56 = this.refs.tryGetValue(it.value, wrapli55);
            li = wrapli55.value;
            if (!inoutres56) 
                continue;
            if (inds.length === 0) 
                inds.splice(inds.length, 0, ...li);
            else 
                for (const v of li) {
                    if (!inds.includes(v)) 
                        inds.push(v);
                }
        }
        if (inds.length === 0) 
            return null;
        let res = new Array();
        for (const i of inds) {
            if ((i < 1) || i > this.m_HousesPos.length) 
                continue;
            let ho = new HouseObject();
            ho.id = Utils.bytesToObject(this.m_Data, this.m_HousesPos[i - 1], 'int', 4);
            if (FiasHouseTable._restore(this.m_Data, ho, this.m_HousesPos[i - 1] + 4)) 
                res.push(ho);
        }
        return res;
    }
    
    save() {
        if (this.m_Houses === null || this.m_Houses.length === 0) 
            return null;
        let mem = new MemoryStream(); 
        try {
            FiasHelper.serializeInt(mem, 0);
            FiasHelper.serializeInt(mem, this.m_Houses.length);
            FiasHelper.serializeInt(mem, 0);
            for (let i = 0; i < this.m_Houses.length; i++) {
                FiasHelper.serializeInt(mem, 0);
            }
            this.m_HousesPos = new Int32Array(this.m_Houses.length);
            for (let i = 0; i < this.m_Houses.length; i++) {
                this.m_HousesPos[i] = mem.position;
                FiasHelper.serializeInt(mem, this.m_Houses[i].id);
                let dat = FiasHouseTable._store(this.m_Houses[i]);
                mem.write(dat, 0, dat.length);
            }
            let pos = mem.position;
            mem.position = 8;
            FiasHelper.serializeInt(mem, pos);
            for (let i = 0; i < this.m_HousesPos.length; i++) {
                FiasHelper.serializeInt(mem, this.m_HousesPos[i]);
            }
            mem.position = mem.length;
            FiasHelper.serializeInt(mem, this.refs.length);
            for (const r of this.refs.entries) {
                FiasHelper.serializeString(mem, r.key, false);
                FiasHelper.serializeShort(mem, r.value.length);
                for (const v of r.value) {
                    FiasHelper.serializeShort(mem, v);
                }
            }
            return mem.toByteArray();
        }
        finally {
            mem.close();
        }
    }
    
    addHO(ho) {
        let num = NumberAnalyzer.tryParseHO(ho);
        if (num === null || num.items.length === 0) 
            return false;
        if (this.m_Houses === null) 
            this.m_Houses = new Array();
        this.m_Houses.push(ho);
        let ind = this.m_Houses.length;
        for (const it of num.items) {
            let li = [ ];
            let wrapli57 = new RefOutArgWrapper();
            let inoutres58 = this.refs.tryGetValue(it.value, wrapli57);
            li = wrapli57.value;
            if (!inoutres58) 
                this.refs.put(it.value, (li = new Array()));
            if (!li.includes(ind)) 
                li.push(ind);
        }
        return true;
    }
}


module.exports = HousesInStreet