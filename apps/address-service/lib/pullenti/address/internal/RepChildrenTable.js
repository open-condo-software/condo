/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const KeyBaseTable = require("./../../util/repository/KeyBaseTable");

class RepChildrenTable extends KeyBaseTable {
    
    constructor(baseDir, _name = "chils") {
        super(null, _name, baseDir);
    }
    
    add(id, li) {
        if (li === null || li.length === 0) 
            this.writeKeyData(id, null);
        else {
            let res = new Array();
            for (const i of li) {
                res.splice(res.length, 0, ...Utils.objectToBytes(i, 'int'));
            }
            this.writeKeyData(id, res);
        }
    }
    
    get(id) {
        let dat = this.readKeyData(id, 0);
        if (dat === null) 
            return null;
        let res = new Array();
        let ind = 0;
        for (; ind < dat.length; ind += 4) {
            res.push(Utils.bytesToObject(dat, ind, 'int', 4));
        }
        return res;
    }
}


module.exports = RepChildrenTable