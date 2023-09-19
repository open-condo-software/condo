/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const KeyBaseTable = require("./../../../util/repository/KeyBaseTable");
const FiasHelper = require("./../FiasHelper");
const GarStatus = require("./../../GarStatus");

class FiasAddrTable extends KeyBaseTable {
    
    constructor(rep, _name = "areaobjects") {
        super(rep, _name, null);
    }
    
    add(id, doc, onlyAttrs) {
        let dat = this._store(doc);
        this.writeKeyData(id, dat);
    }
    
    _store(ao) {
        let res = new Array();
        let attr = (ao.actual ? 0 : 1);
        if (ao.status === GarStatus.WARNING) 
            attr |= (2);
        else if (ao.status === GarStatus.ERROR) 
            attr |= (4);
        else if (ao.status === GarStatus.OK2) 
            attr |= (8);
        res.push(attr);
        res.splice(res.length, 0, ...Utils.objectToBytes((ao.typ === null ? 0 : ao.typ.id), 'short'));
        res.splice(res.length, 0, ...Utils.objectToBytes((ao.oldTyp === null ? 0 : ao.oldTyp.id), 'short'));
        res.splice(res.length, 0, ...Utils.objectToBytes(ao.parentIds.length, 'short'));
        if (ao.parentIds.length > 0) {
            for (const id of ao.parentIds) {
                res.splice(res.length, 0, ...Utils.objectToBytes(id, 'int'));
            }
            res.push((ao.parentParentIds === null ? 0 : ao.parentParentIds.length));
            if (ao.parentParentIds !== null) {
                for (const id of ao.parentParentIds) {
                    res.splice(res.length, 0, ...Utils.objectToBytes(id, 'int'));
                }
            }
        }
        res.splice(res.length, 0, ...Utils.objectToBytes(ao.level, 'short'));
        res.splice(res.length, 0, ...Utils.objectToBytes(ao.names.length, 'short'));
        for (const n of ao.names) {
            FiasAddrTable.getBytesForString1251(res, n);
        }
        res.splice(res.length, 0, ...Utils.objectToBytes(ao.childrenIds.length, 'int'));
        for (const id of ao.childrenIds) {
            res.splice(res.length, 0, ...Utils.objectToBytes(id, 'uint'));
        }
        res.splice(res.length, 0, ...Utils.objectToBytes(0, 'int'));
        res.push(ao.region);
        FiasAddrTable.getBytesForString1251(res, ao.guid);
        return res;
    }
    
    get(id, ao, typs) {
        let dat = this.readKeyData(id, 0);
        if (dat === null) 
            return false;
        ao.id = id;
        return FiasAddrTable._restore(dat, ao, typs);
    }
    
    getParentId(id) {
        let data = this.readKeyData(id, 11);
        if (data === null) 
            return 0;
        let ind = 5;
        let cou = Utils.bytesToObject(data, ind, 'short', 2);
        ind += 2;
        if (cou === 0) 
            return 0;
        return Utils.bytesToObject(data, ind, 'int', 4);
    }
    
    getActual(id) {
        let data = this.readKeyData(id, 1);
        if (data === null) 
            return -1;
        return ((((data[0]) & 1)) !== 0 ? 0 : 1);
    }
    
    getStatus(id) {
        let data = this.readKeyData(id, 1);
        if (data === null) 
            return GarStatus.ERROR;
        if ((((data[0]) & 2)) !== 0) 
            return GarStatus.WARNING;
        if ((((data[0]) & 4)) !== 0) 
            return GarStatus.ERROR;
        if ((((data[0]) & 8)) !== 0) 
            return GarStatus.OK2;
        return GarStatus.OK;
    }
    
    static _restore(data, ao, typs) {
        if ((((data[0]) & 1)) !== 0) 
            ao.actual = false;
        else 
            ao.actual = true;
        if ((((data[0]) & 2)) !== 0) 
            ao.status = GarStatus.WARNING;
        if ((((data[0]) & 4)) !== 0) 
            ao.status = GarStatus.ERROR;
        if ((((data[0]) & 8)) !== 0) 
            ao.status = GarStatus.OK2;
        let ind = 1;
        let id = Utils.bytesToObject(data, ind, 'short', 2);
        ind += 2;
        let ty = null;
        let wrapty27 = new RefOutArgWrapper();
        let inoutres28 = typs.tryGetValue(id, wrapty27);
        ty = wrapty27.value;
        if (inoutres28) 
            ao.typ = ty;
        id = Utils.bytesToObject(data, ind, 'short', 2);
        ind += 2;
        if (id !== 0) {
            let wrapty23 = new RefOutArgWrapper();
            let inoutres24 = typs.tryGetValue(id, wrapty23);
            ty = wrapty23.value;
            if (inoutres24) 
                ao.oldTyp = ty;
        }
        let cou = Utils.bytesToObject(data, ind, 'short', 2);
        ind += 2;
        if (cou > 0) {
            for (; cou > 0; cou--) {
                ao.parentIds.push(Utils.bytesToObject(data, ind, 'int', 4));
                ind += 4;
            }
            cou = data[ind];
            ind += 1;
            if (cou > 0) {
                ao.parentParentIds = new Array();
                for (; cou > 0; cou--) {
                    ao.parentParentIds.push(Utils.bytesToObject(data, ind, 'int', 4));
                    ind += 4;
                }
            }
        }
        ao.level = Utils.bytesToObject(data, ind, 'short', 2);
        ind += 2;
        cou = Utils.bytesToObject(data, ind, 'short', 2);
        ind += 2;
        for (; cou > 0; cou--) {
            let wrapind25 = new RefOutArgWrapper(ind);
            ao.names.push(FiasAddrTable.toString1251(data, wrapind25));
            ind = wrapind25.value;
        }
        cou = Utils.bytesToObject(data, ind, 'int', 4);
        ind += 4;
        for (; cou > 0; cou--) {
            ao.childrenIds.push(Utils.bytesToObject(data, ind, 'uint', 4));
            ind += 4;
        }
        ind += 4;
        ao.region = data[ind];
        ind++;
        if (ind < data.length) {
            let wrapind26 = new RefOutArgWrapper(ind);
            ao.guid = FiasAddrTable.toString1251(data, wrapind26);
            ind = wrapind26.value;
        }
        return true;
    }
    
    static toString1251(data, ind) {
        if ((ind.value + 2) > data.length) 
            return null;
        let len = Utils.bytesToObject(data, ind.value, 'short', 2);
        ind.value += 2;
        if (len <= (0)) 
            return null;
        if ((ind.value + (len)) > data.length) 
            return null;
        let res = FiasHelper.decodeString1251(data, ind.value, len, false);
        ind.value += (len);
        return res;
    }
    
    static getBytesForString1251(res, str) {
        if (Utils.isNullOrEmpty(str)) 
            res.splice(res.length, 0, ...Utils.objectToBytes(0, 'short'));
        else {
            let b = FiasHelper.encodeString1251(str);
            res.splice(res.length, 0, ...Utils.objectToBytes(b.length, 'short'));
            res.splice(res.length, 0, ...b);
        }
    }
}


module.exports = FiasAddrTable