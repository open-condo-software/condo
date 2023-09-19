/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../../unisharp/StringBuilder");
const Stream = require("./../../../unisharp/Stream");
const FileStream = require("./../../../unisharp/FileStream");

const FiasHelper = require("./../FiasHelper");
const FileHelper = require("./../../../util/FileHelper");
const AreaTreeNode = require("./AreaTreeNode");
const GarLevel = require("./../../GarLevel");
const AreaTreeObject = require("./AreaTreeObject");

class AreaTree {
    
    constructor() {
        this.m_ObjPos = new Array();
        this.m_Objs = new Array();
        this.m_Strings = new Array();
        this.children = new Hashtable();
        this.m_Lock = new Object();
        this.m_Data = null;
    }
    
    getStringId(str) {
        if (str === null) 
            return 0;
        let i = this.m_Strings.indexOf(str);
        if (i < 0) {
            this.m_Strings.push(str);
            i = this.m_Strings.length;
        }
        else 
            i++;
        return i;
    }
    
    getString(id) {
        if (id > 0 && id <= this.m_Strings.length) 
            return this.m_Strings[id - 1];
        return null;
    }
    
    close() {
        this.children.clear();
        this.m_ObjPos.splice(0, this.m_ObjPos.length);
        this.m_Objs.splice(0, this.m_Objs.length);
        this.m_Strings.splice(0, this.m_Strings.length);
    }
    
    collect() {
        for (const ch of this.children.entries) {
            ch.value.children.clear();
            ch.value.loaded = false;
        }
    }
    
    loadAllObjects() {
        for (let id = 1; id <= this.m_Objs.length; id++) {
            this.getObj(id);
        }
    }
    
    loadAllData() {
        this.loadAllObjects();
        for (const ch of this.children.entries) {
            this._loadAllNodes(ch.value);
        }
    }
    
    _loadAllNodes(node) {
        if (!node.loaded) 
            this._loadNode(node);
        if (node.children !== null) {
            for (const ch of node.children.entries) {
                this._loadAllNodes(ch.value);
            }
        }
    }
    
    getObj(id) {
        if ((id < 1) || id >= this.m_Objs.length) 
            return null;
        if (this.m_Objs[id] !== null) 
            return this.m_Objs[id];
        if (this.m_ObjPos[id] === 0) 
            return null;
        let ao = new AreaTreeObject();
        ao.deserialize(this.m_Data, this.m_ObjPos[id], this);
        this.m_Objs[id] = ao;
        return ao;
    }
    
    add(path, ao, na) {
        if (Utils.isNullOrEmpty(path)) 
            return null;
        while (this.m_ObjPos.length <= ao.id) {
            this.m_ObjPos.push(0);
            this.m_Objs.push(null);
        }
        if (ao.id === 49599) {
        }
        let o = this.m_Objs[ao.id];
        if (o === null) {
            o = AreaTreeObject._new1(ao.id);
            this.m_Objs[ao.id] = o;
        }
        o.region = ao.region;
        o.parentIds = ao.parentIds;
        o.parentParentIds = ao.parentParentIds;
        o.level = na.level;
        o.expired = !ao.actual;
        o.status = ao.status;
        o.gLevel = GarLevel.of(ao.level);
        o.chCount = (ao.childrenIds === null ? 0 : ao.childrenIds.length);
        o.typId = ao.typ.id;
        if (ao.oldTyp !== null) 
            o.altTypId = ao.oldTyp.id;
        if (na.miscs !== null && na.miscs.length > 0) 
            o.miscs = na.miscs;
        if (na.types !== null) 
            o.typs = na.types;
        let res = null;
        let wrapres5 = new RefOutArgWrapper();
        let inoutres6 = this.children.tryGetValue(path[0], wrapres5);
        res = wrapres5.value;
        if (!inoutres6) 
            this.children.put(path[0], (res = new AreaTreeNode()));
        for (let i = 1; i < path.length; i++) {
            let rr = null;
            if (res.children === null) 
                res.children = new Hashtable();
            let wraprr3 = new RefOutArgWrapper();
            let inoutres4 = res.children.tryGetValue(path[i], wraprr3);
            rr = wraprr3.value;
            if (!inoutres4) 
                res.children.put(path[i], (rr = AreaTreeNode._new2(res)));
            res = rr;
        }
        if (res.objIds === null) 
            res.objIds = new Array();
        if (!res.objIds.includes(ao.id)) 
            res.objIds.push(ao.id);
        return res;
    }
    
    find(path, correct = false, forSearch = false, ignoreNonCorrect = false) {
        if (Utils.isNullOrEmpty(path)) 
            return null;
        let res = null;
        if (!ignoreNonCorrect) {
            res = this._find(null, path, 0);
            if (res !== null) {
                if (((res.objIds !== null && res.objIds.length > 0)) || forSearch) 
                    return res;
            }
            if (!correct || (path.length < 4)) 
                return null;
        }
        let wrapres9 = new RefOutArgWrapper();
        let inoutres10 = this.children.tryGetValue(path[0], wrapres9);
        res = wrapres9.value;
        if (!inoutres10) 
            return null;
        let j = 1;
        let res1 = null;
        for (; j < path.length; j++) {
            let rr = null;
            if (!res.loaded) 
                this._loadNode(res);
            if (res.children === null) 
                break;
            if (Utils.isLetter(path[j]) && !Utils.isLowerCase(path[j]) && ((j + 1) < path.length)) {
                for (const ch of res.children.entries) {
                    if (!Utils.isLetter(ch.key)) 
                        continue;
                    if (Utils.isLowerCase(ch.key)) 
                        continue;
                    rr = this._find(ch.value, path, j);
                    if (rr === null || rr.objIds === null || rr.objIds.length === 0) {
                        if (j >= 2) 
                            rr = this._find(ch.value, path, j - 1);
                    }
                    if (rr === null || rr.objIds === null || rr.objIds.length === 0) 
                        continue;
                    if (res1 === null) 
                        res1 = rr;
                    else {
                        let res2 = new AreaTreeNode();
                        res2.objIds = Array.from(res1.objIds);
                        for (const id of rr.objIds) {
                            if (!res1.objIds.includes(id)) 
                                res2.objIds.push(id);
                        }
                        res1 = res2;
                    }
                }
            }
            if (path[j] === '$' && path[j - 1] !== '@') {
                if (res.children.containsKey('@')) {
                    rr = this._find(res.children.get('@'), path, j - 1);
                    if (rr !== null && rr.objIds !== null && rr.objIds.length > 0) {
                        if (res1 === null) 
                            res1 = rr;
                        else {
                            let res2 = new AreaTreeNode();
                            res2.objIds = Array.from(res1.objIds);
                            for (const id of rr.objIds) {
                                if (!res1.objIds.includes(id)) 
                                    res2.objIds.push(id);
                            }
                            res1 = res2;
                        }
                    }
                }
            }
            let wraprr7 = new RefOutArgWrapper();
            let inoutres8 = res.children.tryGetValue(path[j], wraprr7);
            rr = wraprr7.value;
            if (!inoutres8) 
                break;
            res = rr;
        }
        if (res1 !== null) 
            return res1;
        let tmp = new StringBuilder();
        for (let i = 0; i < path.length; i++) {
            if (!Utils.isLetter(path[i])) 
                continue;
            if (Utils.isLowerCase(path[i])) 
                continue;
            if (i === 0 || (i + 1) === path.length) 
                continue;
            tmp.length = 0;
            tmp.append(path);
            tmp.remove(i, 1);
            res = this._find(null, tmp.toString(), 0);
            if (res !== null && res.objIds !== null && res.objIds.length > 0) 
                return res;
        }
        return null;
    }
    
    _find(tn, path, i) {
        let res = null;
        if (tn === null) {
            let wrapres11 = new RefOutArgWrapper();
            let inoutres12 = this.children.tryGetValue(path[i], wrapres11);
            res = wrapres11.value;
            if (!inoutres12) 
                return null;
        }
        else 
            res = tn;
        for (let j = i + 1; j < path.length; j++) {
            let rr = null;
            if (!res.loaded) 
                this._loadNode(res);
            if (res.children === null) 
                return null;
            let wraprr13 = new RefOutArgWrapper();
            let inoutres14 = res.children.tryGetValue(path[j], wraprr13);
            rr = wraprr13.value;
            if (!inoutres14) 
                return null;
            res = rr;
        }
        if (!res.loaded) 
            this._loadNode(res);
        return res;
    }
    
    _getAllObjIdsTotal(n, res) {
        if (!n.loaded) 
            this._loadNode(n);
        if (n.objIds !== null) 
            res.splice(res.length, 0, ...n.objIds);
        if (n.children !== null) {
            for (const kp of n.children.entries) {
                this._getAllObjIdsTotal(kp.value, res);
            }
        }
    }
    
    getAllObjIds(n, suffix, street, res) {
        if (!n.loaded) 
            this._loadNode(n);
        if (n.children === null) {
            if (n.objIds !== null) 
                res.splice(res.length, 0, ...n.objIds);
        }
        else 
            for (const kp of n.children.entries) {
                if (suffix !== null) {
                    if (kp.key === '$') 
                        continue;
                    if (kp.key === '_') {
                        if (!Utils.isDigit(suffix[0])) 
                            this._getAllObjIdsAfterSuffix(kp.value, suffix, street, res);
                        continue;
                    }
                    if (Utils.isDigit(kp.key) && Utils.isDigit(suffix[0])) {
                        if (kp.key === suffix[0]) 
                            this._getAllObjIdsAfterSuffix(kp.value, suffix.substring(1), street, res);
                        continue;
                    }
                }
                else if (kp.key === '$') {
                    this._getAllObjIdsTotal(kp.value, res);
                    continue;
                }
                else if (kp.key === '@') {
                    if (!kp.value.loaded) 
                        this._loadNode(kp.value);
                    if (kp.value.objIds !== null) 
                        res.splice(res.length, 0, ...kp.value.objIds);
                }
                this.getAllObjIds(kp.value, suffix, street, res);
            }
    }
    
    _getAllObjIdsAfterSuffix(n, suffix, street, res) {
        for (let i = 0; i < suffix.length; i++) {
            if (!n.loaded) 
                this._loadNode(n);
            let tn = null;
            if (n.children === null) 
                return;
            let wraptn15 = new RefOutArgWrapper();
            let inoutres16 = n.children.tryGetValue(suffix[i], wraptn15);
            tn = wraptn15.value;
            if (!inoutres16) 
                return;
            n = tn;
        }
        if (n !== null) 
            this.getAllObjIds(n, null, street, res);
    }
    
    _loadNode(res) {
        if (!res.loaded && res.lazyPos > 0) 
            res.deserialize(this.m_Data, res.lazyPos);
        res.loaded = true;
    }
    
    save(fname) {
        if (this.m_Data !== null) 
            this.m_Data = null;
        this.m_Strings.splice(0, this.m_Strings.length);
        for (const o of this.m_Objs) {
            if (o !== null) {
                if (o.typs !== null) {
                    for (const ty of o.typs) {
                        this.getStringId(ty);
                    }
                }
                if (o.miscs !== null) {
                    for (const mi of o.miscs) {
                        this.getStringId(mi);
                    }
                }
            }
        }
        let f = new FileStream(fname, "w+", false); 
        try {
            FiasHelper.serializeInt(f, 0);
            FiasHelper.serializeInt(f, 0);
            FiasHelper.serializeInt(f, this.m_Strings.length);
            for (const s of this.m_Strings) {
                FiasHelper.serializeString(f, s, false);
            }
            FiasHelper.serializeInt(f, this.m_Objs.length);
            let pos0 = f.position;
            for (let i = 0; i < this.m_Objs.length; i++) {
                FiasHelper.serializeInt(f, 0);
            }
            for (let i = 0; i < this.m_Objs.length; i++) {
                if (this.m_Objs[i] !== null) {
                    this.m_ObjPos[i] = f.position;
                    this.m_Objs[i].serialize(f, this);
                }
            }
            f.position = pos0;
            for (let i = 0; i < this.m_ObjPos.length; i++) {
                FiasHelper.serializeInt(f, this.m_ObjPos[i]);
            }
            f.position = 4;
            FiasHelper.serializeInt(f, f.length);
            f.position = f.length;
            FiasHelper.serializeInt(f, this.children.length);
            for (const kp of this.children.entries) {
                FiasHelper.serializeShort(f, kp.key.charCodeAt(0));
                kp.value.serialize(f);
            }
        }
        finally {
            f.close();
        }
        this.close();
        ;
    }
    
    load(fname) {
        this.m_Data = FileHelper.loadDataFromFile(fname, 0);
        let pos = 0;
        let a0 = Utils.bytesToObject(this.m_Data, pos, 'int', 4);
        pos += 4;
        let pos0 = Utils.bytesToObject(this.m_Data, pos, 'int', 4);
        pos += 4;
        let cou = Utils.bytesToObject(this.m_Data, pos, 'int', 4);
        pos += 4;
        this.m_Strings.splice(0, this.m_Strings.length);
        for (; cou > 0; cou--) {
            let wrappos17 = new RefOutArgWrapper(pos);
            let s = FiasHelper.deserializeStringFromBytes(this.m_Data, wrappos17, false);
            pos = wrappos17.value;
            this.m_Strings.push(s);
        }
        cou = Utils.bytesToObject(this.m_Data, pos, 'int', 4);
        pos += 4;
        if (cou > 0) {
            this.m_Objs = new Array();
            this.m_ObjPos = new Array();
            for (; cou > 0; cou--,pos += 4) {
                this.m_ObjPos.push(Utils.bytesToObject(this.m_Data, pos, 'int', 4));
                this.m_Objs.push(null);
            }
        }
        pos = pos0;
        cou = Utils.bytesToObject(this.m_Data, pos, 'int', 4);
        pos += 4;
        if (cou === 0) 
            return;
        for (let i = 0; i < cou; i++) {
            let ch = String.fromCharCode(Utils.bytesToObject(this.m_Data, pos, 'short', 2));
            pos += 2;
            let tn = new AreaTreeNode();
            pos = tn.deserialize(this.m_Data, pos);
            this.children.put(ch, tn);
        }
    }
}


module.exports = AreaTree