/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const RoomType = require("./../../RoomType");
const KeyBaseTable = require("./../../../util/repository/KeyBaseTable");
const BaseTable = require("./../../../util/repository/BaseTable");
const RoomObject = require("./RoomObject");

class FiasRoomTable extends KeyBaseTable {
    
    constructor(rep, _name = "roomobjects") {
        super(rep, _name, null);
    }
    
    add(id, r) {
        let res = new Array();
        FiasRoomTable._store(res, r);
        let dat = res;
        this.writeKeyData(id, dat);
    }
    
    static _store(res, ao) {
        let attr = (ao.actual ? 0 : 1);
        res.push(attr);
        res.splice(res.length, 0, ...Utils.objectToBytes(ao.houseId, 'uint'));
        res.push(ao.typ.value());
        BaseTable.getBytesForString(res, ao.number, null);
        res.splice(res.length, 0, ...Utils.objectToBytes((ao.childrenIds === null ? 0 : ao.childrenIds.length), 'int'));
        if (ao.childrenIds !== null) {
            for (const id of ao.childrenIds) {
                res.splice(res.length, 0, ...Utils.objectToBytes(id, 'uint'));
            }
        }
    }
    
    get(id) {
        let dat = this.readKeyData(id, 0);
        if (dat === null) 
            return null;
        let r = new RoomObject();
        r.id = id;
        let ind = 0;
        let wrapind53 = new RefOutArgWrapper(ind);
        FiasRoomTable._restore(dat, r, wrapind53);
        ind = wrapind53.value;
        return r;
    }
    
    getParentId(id) {
        let data = this.readKeyData(id, 11);
        if (data === null) 
            return 0;
        let ind = 1;
        return Utils.bytesToObject(data, ind, 'int', 4);
    }
    
    getActual(id) {
        let data = this.readKeyData(id, 1);
        if (data === null) 
            return -1;
        return ((((data[0]) & 1)) !== 0 ? 0 : 1);
    }
    
    static _getRoomTyp(data, ind) {
        ind += 5;
        return RoomType.of(data[ind]);
    }
    
    static _restore(data, ao, ind) {
        if ((((data[ind.value]) & 1)) !== 0) 
            ao.actual = false;
        else 
            ao.actual = true;
        ind.value++;
        ao.houseId = Utils.bytesToObject(data, ind.value, 'uint', 4);
        ind.value += 4;
        let typ = data[ind.value++];
        ao.typ = RoomType.of(typ);
        ao.number = BaseTable.getStringForBytes(data, ind, false, null);
        let cou = Utils.bytesToObject(data, ind.value, 'int', 4);
        ind.value += 4;
        for (; cou > 0; cou--) {
            if (ao.childrenIds === null) 
                ao.childrenIds = new Array();
            ao.childrenIds.push(Utils.bytesToObject(data, ind.value, 'uint', 4));
            ind.value += 4;
        }
        let dat = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            dat[i] = data[ind.value + i];
        }
        let gg = Utils.bytesToUUID(dat);
        ao.guid = gg.toString();
        return true;
    }
}


module.exports = FiasRoomTable