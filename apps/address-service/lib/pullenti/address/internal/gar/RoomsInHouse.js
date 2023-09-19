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

const RoomType = require("./../../RoomType");
const NumberAnalyzer = require("./../NumberAnalyzer");
const RoomObject = require("./RoomObject");
const FiasHelper = require("./../FiasHelper");
const FiasRoomTable = require("./FiasRoomTable");

class RoomsInHouse {
    
    constructor() {
        this.m_Rooms = null;
        this.refs = new Hashtable();
        this.m_Data = null;
        this.m_RoomsPos = null;
        this.m_Lock = new Object();
    }
    
    get count() {
        return (this.m_Rooms !== null ? this.m_Rooms.length : (this.m_RoomsPos !== null ? this.m_RoomsPos.length : 0));
    }
    
    toString() {
        return (String(this.count) + " Rooms, " + this.refs.length + " refs");
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
        this.m_RoomsPos = new Int32Array(cou);
        for (let i = 0; i < cou; i++,ind += 4) {
            this.m_RoomsPos[i] = Utils.bytesToObject(dat, ind, 'int', 4);
        }
        ind = pos0;
        cou = Utils.bytesToObject(dat, ind, 'int', 4);
        ind += 4;
        this.refs.clear();
        for (let i = 0; i < cou; i++) {
            let wrapind71 = new RefOutArgWrapper(ind);
            let key = FiasHelper.deserializeStringFromBytes(dat, wrapind71, false);
            ind = wrapind71.value;
            let cou2 = Utils.bytesToObject(dat, ind, 'short', 2);
            ind += 2;
            let li = new Array();
            for (let j = 0; j < cou2; j++,ind += 2) {
                li.push(Utils.bytesToObject(dat, ind, 'short', 2));
            }
            this.refs.put(key, li);
        }
    }
    
    getRooms(na) {
        let inds = new Array();
        for (const it of na.items) {
            let li = [ ];
            let wrapli72 = new RefOutArgWrapper();
            let inoutres73 = this.refs.tryGetValue(it.value, wrapli72);
            li = wrapli72.value;
            if (!inoutres73) 
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
            if ((i < 1) || i > this.m_RoomsPos.length) 
                continue;
            let ho = new RoomObject();
            ho.id = Utils.bytesToObject(this.m_Data, this.m_RoomsPos[i - 1], 'int', 4);
            let ii = this.m_RoomsPos[i - 1] + 4;
            let wrapii74 = new RefOutArgWrapper(ii);
            let inoutres75 = FiasRoomTable._restore(this.m_Data, ho, wrapii74);
            ii = wrapii74.value;
            if (inoutres75) 
                res.push(ho);
        }
        return res;
    }
    
    checkHasFlatsAndSpaces() {
        let hasFlats = false;
        let hasSpaces = false;
        for (let k = 0; k < this.m_RoomsPos.length; k++) {
            let ty = FiasRoomTable._getRoomTyp(this.m_Data, this.m_RoomsPos[k] + 4);
            if (ty === RoomType.FLAT) 
                hasFlats = true;
            if (ty === RoomType.SPACE) 
                hasSpaces = true;
            if (hasFlats && hasSpaces) 
                return true;
        }
        return false;
    }
    
    save() {
        if (this.m_Rooms === null || this.m_Rooms.length === 0) 
            return null;
        let mem = new MemoryStream(); 
        try {
            FiasHelper.serializeInt(mem, 0);
            FiasHelper.serializeInt(mem, this.m_Rooms.length);
            FiasHelper.serializeInt(mem, 0);
            for (let i = 0; i < this.m_Rooms.length; i++) {
                FiasHelper.serializeInt(mem, 0);
            }
            this.m_RoomsPos = new Int32Array(this.m_Rooms.length);
            let buf = new Array();
            for (let i = 0; i < this.m_Rooms.length; i++) {
                this.m_RoomsPos[i] = mem.position;
                FiasHelper.serializeInt(mem, this.m_Rooms[i].id);
                buf.splice(0, buf.length);
                FiasRoomTable._store(buf, this.m_Rooms[i]);
                let dat = buf;
                mem.write(dat, 0, dat.length);
            }
            let pos = mem.position;
            mem.position = 8;
            FiasHelper.serializeInt(mem, pos);
            for (let i = 0; i < this.m_RoomsPos.length; i++) {
                FiasHelper.serializeInt(mem, this.m_RoomsPos[i]);
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
    
    addRO(ho) {
        let num = NumberAnalyzer.tryParseRO(ho);
        if (num === null || num.items.length === 0) 
            return false;
        if (this.m_Rooms === null) 
            this.m_Rooms = new Array();
        this.m_Rooms.push(ho);
        let ind = this.m_Rooms.length;
        for (const it of num.items) {
            let li = [ ];
            let wrapli76 = new RefOutArgWrapper();
            let inoutres77 = this.refs.tryGetValue(it.value, wrapli76);
            li = wrapli76.value;
            if (!inoutres77) 
                this.refs.put(it.value, (li = new Array()));
            if (!li.includes(ind)) 
                li.push(ind);
        }
        return true;
    }
}


module.exports = RoomsInHouse