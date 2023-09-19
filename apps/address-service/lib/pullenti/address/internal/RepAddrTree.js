/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const AddrLevel = require("./../AddrLevel");
const FiasHelper = require("./FiasHelper");
const RepAddrTreeNode = require("./RepAddrTreeNode");
const RepAddrTreeNodeObj = require("./RepAddrTreeNodeObj");

class RepAddrTree {
    
    constructor() {
        this.m_Data = null;
        this.children = new Hashtable();
    }
    
    clear() {
        for (const kp of this.children.entries) {
            kp.value.unload();
        }
        this.children.clear();
        this.m_Data = null;
    }
    
    open(dat) {
        this.m_Data = dat;
        this.children.clear();
        let ind = 0;
        let cou = Utils.bytesToObject(dat, ind, 'int', 4);
        ind += 4;
        if (cou === 0) 
            return;
        for (let i = 0; i < cou; i++) {
            let ch = String.fromCharCode(Utils.bytesToObject(dat, ind, 'short', 2));
            ind += 2;
            let tn = new RepAddrTreeNode();
            let wrapind175 = new RefOutArgWrapper(ind);
            this._deserializeNode(tn, wrapind175);
            ind = wrapind175.value;
            this.children.put(ch, tn);
        }
    }
    
    _deserializeNode(res, ind) {
        let cou = Utils.bytesToObject(this.m_Data, ind.value, 'short', 2);
        ind.value += 2;
        if (cou > 0) {
            res.objs = new Array();
            for (; cou > 0; cou--) {
                let o = new RepAddrTreeNodeObj();
                o.id = Utils.bytesToObject(this.m_Data, ind.value, 'int', 4);
                ind.value += 4;
                o.lev = AddrLevel.of(this.m_Data[ind.value]);
                ind.value++;
                let tt = this.m_Data[ind.value];
                ind.value++;
                for (; tt > 0; tt--) {
                    o.typIds.push(Utils.bytesToObject(this.m_Data, ind.value, 'short', 2));
                    ind.value += 2;
                }
                let cc = Utils.bytesToObject(this.m_Data, ind.value, 'short', 2);
                ind.value += 2;
                for (; cc > 0; cc--) {
                    if (o.parents === null) 
                        o.parents = new Array();
                    o.parents.push(Utils.bytesToObject(this.m_Data, ind.value, 'int', 4));
                    ind.value += 4;
                }
                res.objs.push(o);
            }
        }
        cou = Utils.bytesToObject(this.m_Data, ind.value, 'short', 2);
        ind.value += 2;
        for (; cou > 0; cou--) {
            let ch = String.fromCharCode(Utils.bytesToObject(this.m_Data, ind.value, 'short', 2));
            ind.value += 2;
            let tn = new RepAddrTreeNode();
            tn.lazyPos = ind.value;
            tn.loaded = false;
            let len = Utils.bytesToObject(this.m_Data, ind.value, 'int', 4);
            ind.value += 4;
            if (res.children === null) 
                res.children = new Hashtable();
            res.children.put(ch, tn);
            ind.value = tn.lazyPos + len;
        }
        res.loaded = true;
    }
    
    _loadNode(res) {
        if (!res.loaded && res.lazyPos > 0) {
            let ind = res.lazyPos + 4;
            let wrapind176 = new RefOutArgWrapper(ind);
            this._deserializeNode(res, wrapind176);
            ind = wrapind176.value;
        }
        res.loaded = true;
    }
    
    save(f) {
        FiasHelper.serializeInt(f, this.children.length);
        for (const kp of this.children.entries) {
            FiasHelper.serializeShort(f, kp.key.charCodeAt(0));
            this._serializeNode(f, kp.value);
        }
    }
    
    _serializeNode(s, tn) {
        if (!tn.loaded) {
            let ind = tn.lazyPos;
            let len = Utils.bytesToObject(this.m_Data, ind, 'int', 4);
            ind += 4;
            len -= 4;
            s.write(this.m_Data, ind, len);
            return;
        }
        if (tn.objs === null || tn.objs.length === 0) 
            FiasHelper.serializeShort(s, 0);
        else {
            FiasHelper.serializeShort(s, tn.objs.length);
            for (const o of tn.objs) {
                FiasHelper.serializeInt(s, o.id);
                FiasHelper.serializeByte(s, o.lev.value());
                FiasHelper.serializeByte(s, o.typIds.length);
                for (const ii of o.typIds) {
                    FiasHelper.serializeShort(s, ii);
                }
                if (o.parents === null || o.parents.length === 0) 
                    FiasHelper.serializeShort(s, 0);
                else {
                    FiasHelper.serializeShort(s, o.parents.length);
                    for (const p of o.parents) {
                        FiasHelper.serializeInt(s, p);
                    }
                }
            }
        }
        FiasHelper.serializeShort(s, (tn.children === null ? 0 : tn.children.length));
        if (tn.children !== null) {
            for (const ch of tn.children.entries) {
                FiasHelper.serializeShort(s, ch.key.charCodeAt(0));
                let p0 = s.position;
                FiasHelper.serializeInt(s, 0);
                this._serializeNode(s, ch.value);
                let p1 = s.position;
                s.position = p0;
                FiasHelper.serializeInt(s, p1 - p0);
                s.position = p1;
            }
        }
    }
    
    find(path) {
        let dic = this.children;
        let gtn = null;
        for (let i = 0; i < path.length; i++) {
            if (dic === null) 
                return null;
            let tn = null;
            let ch = path[i];
            let wraptn177 = new RefOutArgWrapper();
            let inoutres178 = dic.tryGetValue(ch, wraptn177);
            tn = wraptn177.value;
            if (!inoutres178) 
                return null;
            if (!tn.loaded) 
                this._loadNode(tn);
            if ((i + 1) === path.length) {
                gtn = tn;
                break;
            }
            if (tn.children === null || tn.children.length === 0) 
                return null;
            dic = tn.children;
        }
        if (gtn === null) 
            return null;
        return gtn.objs;
    }
    
    add(path, obj) {
        let dic = this.children;
        let gtn = null;
        for (let i = 0; i < path.length; i++) {
            let tn = null;
            let ch = path[i];
            let wraptn179 = new RefOutArgWrapper();
            let inoutres180 = dic.tryGetValue(ch, wraptn179);
            tn = wraptn179.value;
            if (!inoutres180) {
                tn = new RepAddrTreeNode();
                tn.loaded = true;
                dic.put(ch, tn);
            }
            if (!tn.loaded) 
                this._loadNode(tn);
            if ((i + 1) === path.length) {
                gtn = tn;
                break;
            }
            if (tn.children === null) 
                tn.children = new Hashtable();
            dic = tn.children;
        }
        if (gtn.objs === null) 
            gtn.objs = new Array();
        for (const o of gtn.objs) {
            if (o.id === obj.id) {
                let ret = false;
                if (obj.parents !== null) {
                    if (o.parents === null) {
                        o.parents = obj.parents;
                        ret = true;
                    }
                    else 
                        for (const p of obj.parents) {
                            if (!o.parents.includes(p)) {
                                o.parents = obj.parents;
                                ret = true;
                            }
                        }
                }
                return ret;
            }
        }
        gtn.objs.push(obj);
        return true;
    }
}


module.exports = RepAddrTree