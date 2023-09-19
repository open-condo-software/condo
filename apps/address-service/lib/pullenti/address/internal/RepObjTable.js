/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const AddrLevel = require("./../AddrLevel");
const KeyBaseTable = require("./../../util/repository/KeyBaseTable");
const BaseTable = require("./../../util/repository/BaseTable");
const RepaddrObject = require("./../RepaddrObject");

class RepObjTable extends KeyBaseTable {
    
    constructor(typs, baseDir, _name = "objs") {
        super(null, _name, baseDir);
        this.m_Typs = null;
        this.m_Typs = typs;
    }
    
    add(id, r) {
        r.id = id;
        let res = new Array();
        this._store(res, r);
        let dat = res;
        this.writeKeyData(id, dat);
    }
    
    _store(res, ao) {
        let attr = 0;
        res.push(attr);
        res.push(ao.level.value());
        BaseTable.getBytesForString(res, ao.spelling, null);
        res.splice(res.length, 0, ...Utils.objectToBytes(ao.types.length, 'short'));
        for (const ty of ao.types) {
            res.splice(res.length, 0, ...Utils.objectToBytes(this.m_Typs.getId(ty), 'short'));
        }
        if (ao.parents === null || ao.parents.length === 0) 
            res.splice(res.length, 0, ...Utils.objectToBytes(0, 'short'));
        else {
            res.splice(res.length, 0, ...Utils.objectToBytes(ao.parents.length, 'short'));
            for (const p of ao.parents) {
                res.splice(res.length, 0, ...Utils.objectToBytes(p, 'int'));
            }
        }
        if (ao.garGuids === null || ao.garGuids.length === 0) 
            res.splice(res.length, 0, ...Utils.objectToBytes(0, 'short'));
        else {
            res.splice(res.length, 0, ...Utils.objectToBytes(ao.garGuids.length, 'short'));
            for (const p of ao.garGuids) {
                BaseTable.getBytesForString(res, p, null);
            }
        }
    }
    
    get(id) {
        let dat = this.readKeyData(id, 0);
        if (dat === null) 
            return null;
        let r = new RepaddrObject();
        r.id = id;
        let ind = 0;
        let wrapind181 = new RefOutArgWrapper(ind);
        this._restore(dat, r, wrapind181);
        ind = wrapind181.value;
        return r;
    }
    
    _restore(data, ao, ind) {
        let attr = data[ind.value];
        ind.value++;
        let cou = data[ind.value];
        ind.value++;
        ao.level = AddrLevel.of(cou);
        ao.spelling = BaseTable.getStringForBytes(data, ind, false, null);
        cou = Utils.bytesToObject(data, ind.value, 'short', 2);
        ind.value += 2;
        for (; cou > 0; cou--) {
            let id = Utils.bytesToObject(data, ind.value, 'short', 2);
            ind.value += 2;
            let ty = this.m_Typs.getTyp(id);
            if (ty !== null) 
                ao.types.push(ty);
        }
        cou = Utils.bytesToObject(data, ind.value, 'short', 2);
        ind.value += 2;
        for (; cou > 0; cou--) {
            if (ao.parents === null) 
                ao.parents = new Array();
            ao.parents.push(Utils.bytesToObject(data, ind.value, 'int', 4));
            ind.value += 4;
        }
        cou = Utils.bytesToObject(data, ind.value, 'short', 2);
        ind.value += 2;
        for (; cou > 0; cou--) {
            if (ao.garGuids === null) 
                ao.garGuids = new Array();
            let s = BaseTable.getStringForBytes(data, ind, false, null);
            ao.garGuids.push(s);
        }
        return true;
    }
}


module.exports = RepObjTable