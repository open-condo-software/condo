/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const KeyBaseTable = require("./../../util/repository/KeyBaseTable");

class RepTypTable extends KeyBaseTable {
    
    constructor(baseDir, _name = "typs") {
        super(null, _name, baseDir);
        this.m_TypesByName = new Hashtable();
        this.m_TypesById = new Hashtable();
        let max = this.getMaxKey();
        for (let id = 1; id <= max; id++) {
            let dat = this.readKeyData(id, 0);
            if (dat === null) 
                continue;
            let typ = Utils.decodeString("UTF-8", dat, 0, -1);
            if (this.m_TypesByName.containsKey(typ)) 
                continue;
            this.m_TypesByName.put(typ, id);
            this.m_TypesById.put(id, typ);
        }
    }
    
    getId(typ) {
        if (Utils.isNullOrEmpty(typ)) 
            return 0;
        let id = 0;
        let wrapid190 = new RefOutArgWrapper();
        let inoutres191 = this.m_TypesByName.tryGetValue(typ, wrapid190);
        id = wrapid190.value;
        if (inoutres191) 
            return id;
        id = this.getMaxKey() + 1;
        this.writeKeyData(id, Utils.encodeString("UTF-8", typ));
        this.flush();
        this.m_TypesById.put(id, typ);
        this.m_TypesByName.put(typ, id);
        return id;
    }
    
    getTyp(id) {
        let typ = null;
        let wraptyp192 = new RefOutArgWrapper();
        let inoutres193 = this.m_TypesById.tryGetValue(id, wraptyp192);
        typ = wraptyp192.value;
        if (inoutres193) 
            return typ;
        return null;
    }
}


module.exports = RepTypTable