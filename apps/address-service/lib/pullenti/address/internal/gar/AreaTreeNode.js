/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");

const FiasHelper = require("./../FiasHelper");

class AreaTreeNode {
    
    constructor() {
        this.objIds = null;
        this.parent = null;
        this.children = null;
        this.lazyPos = 0;
        this.loaded = false;
    }
    
    toString() {
        return ("Objs=" + (this.objIds === null ? 0 : this.objIds.length) + ", Chils=" + (this.children === null ? 0 : this.children.length) + (this.loaded ? " (loaded)" : ""));
    }
    
    serialize(f) {
        FiasHelper.serializeInt(f, (this.objIds === null ? 0 : this.objIds.length));
        if (this.objIds !== null) {
            for (const v of this.objIds) {
                FiasHelper.serializeInt(f, v);
            }
        }
        FiasHelper.serializeShort(f, (this.children === null ? 0 : this.children.length));
        if (this.children !== null) {
            for (const kp of this.children.entries) {
                FiasHelper.serializeShort(f, kp.key.charCodeAt(0));
                let p0 = f.position;
                FiasHelper.serializeInt(f, 0);
                kp.value.serialize(f);
                let p1 = f.position;
                f.position = p0;
                FiasHelper.serializeInt(f, p1);
                f.position = p1;
            }
        }
    }
    
    deserialize(dat, pos) {
        let cou = Utils.bytesToObject(dat, pos, 'int', 4);
        pos += 4;
        if (cou > 0x7000 || (cou < 0)) {
        }
        if (cou > 0) {
            this.objIds = new Array();
            for (let i = 0; i < cou; i++,pos += 4) {
                this.objIds.push(Utils.bytesToObject(dat, pos, 'int', 4));
            }
        }
        cou = Utils.bytesToObject(dat, pos, 'short', 2);
        pos += 2;
        if (cou === 0) 
            return pos;
        if (cou > 0x1000 || (cou < 0)) {
        }
        for (let i = 0; i < cou; i++) {
            let ch = String.fromCharCode(Utils.bytesToObject(dat, pos, 'short', 2));
            pos += 2;
            let p1 = Utils.bytesToObject(dat, pos, 'int', 4);
            pos += 4;
            let tn = new AreaTreeNode();
            tn.lazyPos = pos;
            tn.loaded = false;
            if (this.children === null) 
                this.children = new Hashtable();
            this.children.put(ch, tn);
            tn.parent = this;
            pos = p1;
        }
        this.loaded = true;
        return pos;
    }
    
    static _new2(_arg1) {
        let res = new AreaTreeNode();
        res.parent = _arg1;
        return res;
    }
}


module.exports = AreaTreeNode