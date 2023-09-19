/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const AddrLevel = require("./../AddrLevel");

class RepAddrTreeNodeObj {
    
    constructor() {
        this.id = 0;
        this.parents = null;
        this.lev = AddrLevel.UNDEFINED;
        this.typIds = new Array();
    }
    
    toString() {
        let tmp = new StringBuilder();
        tmp.append(this.id).append(" (").append(String(this.lev));
        for (let i = 0; i < this.typIds.length; i++) {
            tmp.append((i > 0 ? "," : ":")).append(this.typIds[i]);
        }
        tmp.append(")");
        if (this.parents !== null) {
            for (const p of this.parents) {
                tmp.append(", ").append(p);
            }
        }
        return tmp.toString();
    }
    
    correct(o, typs, p) {
        let ret = false;
        for (const ty of o.types) {
            let tid = typs.getId(ty);
            if (tid !== (0) && !this.typIds.includes(tid)) {
                this.typIds.push(tid);
                ret = true;
            }
        }
        for (const _id of this.typIds) {
            let ty = typs.getTyp(_id);
            if (ty !== null && !o.types.includes(ty)) {
                o.types.push(ty);
                ret = true;
            }
        }
        if (p !== null) {
            if (this.parents === null) 
                this.parents = new Array();
            if (!this.parents.includes(p.id)) {
                this.parents.push(p.id);
                ret = true;
            }
            if (o.parents === null) 
                o.parents = new Array();
            if (!o.parents.includes(p.id)) {
                o.parents.push(p.id);
                ret = true;
            }
        }
        return ret;
    }
}


module.exports = RepAddrTreeNodeObj