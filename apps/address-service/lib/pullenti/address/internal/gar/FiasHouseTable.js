/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const BaseTable = require("./../../../util/repository/BaseTable");
const KeyBaseTable = require("./../../../util/repository/KeyBaseTable");
const GarStatus = require("./../../GarStatus");

class FiasHouseTable extends KeyBaseTable {
    
    constructor(rep, _name = "houseobjects") {
        super(rep, _name, null);
    }
    
    add(id, doc) {
        let dat = FiasHouseTable._store(doc);
        this.writeKeyData(id, dat);
    }
    
    static _store(ao) {
        let res = new Array();
        let attr = (ao.actual ? 0 : 1);
        if (ao.altParentId > 0) 
            attr |= (2);
        if (ao.status === GarStatus.WARNING) 
            attr |= (4);
        else if (ao.status === GarStatus.ERROR) 
            attr |= (8);
        else if (ao.status === GarStatus.OK2) 
            attr |= (0x10);
        res.push(attr);
        res.splice(res.length, 0, ...Utils.objectToBytes(ao.parentId, 'int'));
        res.push(ao.houseTyp);
        res.push(ao.strucTyp);
        BaseTable.getBytesForString(res, ao.houseNumber, null);
        BaseTable.getBytesForString(res, ao.buildNumber, null);
        BaseTable.getBytesForString(res, ao.strucNumber, null);
        res.splice(res.length, 0, ...Utils.objectToBytes((ao.roomIds === null ? 0 : ao.roomIds.length), 'int'));
        if (ao.roomIds !== null) {
            for (const ii of ao.roomIds) {
                res.splice(res.length, 0, ...Utils.objectToBytes(ii, 'int'));
            }
        }
        if (ao.altParentId > 0) 
            res.splice(res.length, 0, ...Utils.objectToBytes(ao.altParentId, 'int'));
        return res;
    }
    
    get(id, ao) {
        let dat = this.readKeyData(id, 0);
        if (dat === null) 
            return false;
        ao.id = id;
        return FiasHouseTable._restore(dat, ao, 0);
    }
    
    getParentId(id) {
        let data = this.readKeyData(id, 5);
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
    
    static _restore(data, ao, ind = 0) {
        if ((((data[ind]) & 1)) !== 0) 
            ao.actual = false;
        else 
            ao.actual = true;
        let isUnom = (((data[ind]) & 2)) !== 0;
        if ((((data[ind]) & 4)) !== 0) 
            ao.status = GarStatus.WARNING;
        if ((((data[ind]) & 8)) !== 0) 
            ao.status = GarStatus.ERROR;
        if ((((data[ind]) & 0x10)) !== 0) 
            ao.status = GarStatus.OK2;
        ind++;
        ao.parentId = Utils.bytesToObject(data, ind, 'int', 4);
        ind += 4;
        ao.houseTyp = data[ind++];
        ao.strucTyp = data[ind++];
        let wrapind52 = new RefOutArgWrapper(ind);
        ao.houseNumber = BaseTable.getStringForBytes(data, wrapind52, false, null);
        ind = wrapind52.value;
        let wrapind51 = new RefOutArgWrapper(ind);
        ao.buildNumber = BaseTable.getStringForBytes(data, wrapind51, false, null);
        ind = wrapind51.value;
        let wrapind50 = new RefOutArgWrapper(ind);
        ao.strucNumber = BaseTable.getStringForBytes(data, wrapind50, false, null);
        ind = wrapind50.value;
        let cou = Utils.bytesToObject(data, ind, 'int', 4);
        ind += 4;
        if (cou > 0) {
            ao.roomIds = new Array();
            for (; cou > 0; cou--) {
                ao.roomIds.push(Utils.bytesToObject(data, ind, 'int', 4));
                ind += 4;
            }
        }
        if (isUnom) {
            ao.altParentId = Utils.bytesToObject(data, ind, 'int', 4);
            ind += 4;
        }
        if ((ind + 16) <= data.length) {
            let dat = new Uint8Array(16);
            for (let i = 0; i < 16; i++) {
                dat[i] = data[ind + i];
            }
            let gg = Utils.bytesToUUID(dat);
            ao.guid = gg.toString();
        }
        return true;
    }
}


module.exports = FiasHouseTable