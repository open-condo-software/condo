/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const BaseTable = require("./../../../util/repository/BaseTable");
const KeyBaseTable = require("./../../../util/repository/KeyBaseTable");
const GarParam = require("./../../GarParam");

class ParamsTable extends KeyBaseTable {
    
    constructor(rep, _name) {
        super(rep, _name, null);
    }
    
    getParams(id) {
        let dat = this.readKeyData(id, 0);
        if (dat === null) 
            return null;
        let ind = 0;
        let res = new Hashtable();
        let wrapind59 = new RefOutArgWrapper(ind);
        ParamsTable._toDic(res, dat, wrapind59);
        ind = wrapind59.value;
        return res;
    }
    
    static _toDic(res, dat, ind) {
        let cou = Utils.bytesToObject(dat, ind.value, 'short', 2);
        ind.value += 2;
        for (; cou > (0); cou--) {
            let typ = GarParam.of(dat[ind.value]);
            ind.value++;
            let val = BaseTable.getStringForBytes(dat, ind, false, null);
            if (val !== null && !res.containsKey(typ)) 
                res.put(typ, val);
        }
    }
    
    static _getVal(dat, ty) {
        let ind = 0;
        let cou = Utils.bytesToObject(dat, ind, 'short', 2);
        ind += 2;
        for (; cou > (0); cou--) {
            let typ = GarParam.of(dat[ind]);
            ind++;
            if (ty === typ) {
                let wrapind60 = new RefOutArgWrapper(ind);
                let inoutres61 = BaseTable.getStringForBytes(dat, wrapind60, false, null);
                ind = wrapind60.value;
                return inoutres61;
            }
            let wrapind62 = new RefOutArgWrapper(ind);
            BaseTable.getStringForBytes(dat, wrapind62, true, null);
            ind = wrapind62.value;
        }
        return null;
    }
    
    static _fromDic(dat, dic) {
        dat.splice(dat.length, 0, ...Utils.objectToBytes(dic.length, 'short'));
        for (const kp of dic.entries) {
            dat.push(kp.key.value());
            BaseTable.getBytesForString(dat, kp.value, null);
        }
    }
    
    putParams(id, dic, zip = false) {
        let dat = new Array();
        ParamsTable._fromDic(dat, dic);
        let b = this.autoZipData;
        if (zip) 
            this.autoZipData = true;
        this.writeKeyData(id, dat);
        this.autoZipData = b;
    }
}


module.exports = ParamsTable