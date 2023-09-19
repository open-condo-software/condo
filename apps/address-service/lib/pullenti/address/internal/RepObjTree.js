/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const FiasHelper = require("./FiasHelper");
const RepObjTreeNode = require("./RepObjTreeNode");

class RepObjTree {
    
    constructor() {
        this.m_Data = null;
        this.children = new Hashtable();
        this.modified = false;
        this.maxLength = 8;
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
            let ch = String.fromCharCode(Utils.bytesToObject(this.m_Data, ind, 'short', 2));
            ind += 2;
            let tn = new RepObjTreeNode();
            let wrapind182 = new RefOutArgWrapper(ind);
            this._deserializeNode(tn, wrapind182);
            ind = wrapind182.value;
            this.children.put(ch, tn);
        }
        this.modified = false;
    }
    
    _deserializeNode(res, ind) {
        let cou = Utils.bytesToObject(this.m_Data, ind.value, 'short', 2);
        ind.value += 2;
        if (cou > 0) {
            res.objs = new Hashtable();
            for (; cou > 0; cou--) {
                let id = Utils.bytesToObject(this.m_Data, ind.value, 'int', 4);
                ind.value += 4;
                let rest = FiasHelper.deserializeStringFromBytes(this.m_Data, ind, true);
                res.objs.put(rest, id);
            }
        }
        cou = Utils.bytesToObject(this.m_Data, ind.value, 'short', 2);
        ind.value += 2;
        for (; cou > 0; cou--) {
            let ch = String.fromCharCode(Utils.bytesToObject(this.m_Data, ind.value, 'short', 2));
            ind.value += 2;
            let tn = new RepObjTreeNode();
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
            let wrapind183 = new RefOutArgWrapper(ind);
            this._deserializeNode(res, wrapind183);
            ind = wrapind183.value;
        }
        res.loaded = true;
    }
    
    save(f) {
        FiasHelper.serializeInt(f, this.children.length);
        for (const kp of this.children.entries) {
            FiasHelper.serializeShort(f, kp.key.charCodeAt(0));
            this._serializeNode(f, kp.value);
        }
        this.modified = false;
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
            for (const o of tn.objs.entries) {
                FiasHelper.serializeInt(s, o.value);
                FiasHelper.serializeString(s, o.key, true);
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
    
    find(str) {
        let dic = this.children;
        let gtn = null;
        let i = 0;
        for (i = 0; i < str.length; i++) {
            if (dic === null) 
                return 0;
            let tn = null;
            let ch = str[i];
            let wraptn184 = new RefOutArgWrapper();
            let inoutres185 = dic.tryGetValue(ch, wraptn184);
            tn = wraptn184.value;
            if (!inoutres185) 
                return 0;
            if (!tn.loaded) 
                this._loadNode(tn);
            gtn = tn;
            if (tn.children === null || tn.children.length === 0) {
                i++;
                break;
            }
            dic = tn.children;
        }
        if (gtn === null || gtn.objs === null) 
            return 0;
        let rest = (i >= str.length ? "" : str.substring(i));
        let res = 0;
        let wrapres186 = new RefOutArgWrapper();
        let inoutres187 = gtn.objs.tryGetValue(rest, wrapres186);
        res = wrapres186.value;
        if (inoutres187) 
            return res;
        return 0;
    }
    
    add(str, id) {
        let dic = this.children;
        let gtn = null;
        let i = 0;
        for (i = 0; (i < str.length) && (i < this.maxLength); i++) {
            let tn = null;
            let ch = str[i];
            let wraptn188 = new RefOutArgWrapper();
            let inoutres189 = dic.tryGetValue(ch, wraptn188);
            tn = wraptn188.value;
            if (!inoutres189) {
                tn = new RepObjTreeNode();
                tn.loaded = true;
                dic.put(ch, tn);
            }
            else if (!tn.loaded) 
                this._loadNode(tn);
            gtn = tn;
            if (tn.children === null) 
                tn.children = new Hashtable();
            dic = tn.children;
        }
        if (gtn.objs === null) 
            gtn.objs = new Hashtable();
        let rest = (i >= str.length ? "" : str.substring(i));
        if (!gtn.objs.containsKey(rest)) {
            gtn.objs.put(rest, id);
            this.modified = true;
        }
        else if (gtn.objs.get(rest) !== id) {
            gtn.objs.put(rest, id);
            this.modified = true;
        }
        return true;
    }
}


module.exports = RepObjTree