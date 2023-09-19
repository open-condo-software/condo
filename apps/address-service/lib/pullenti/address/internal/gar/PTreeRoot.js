/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");
const Stream = require("./../../../unisharp/Stream");
const FileStream = require("./../../../unisharp/FileStream");

const FiasHelper = require("./../FiasHelper");
const PTreeNode = require("./PTreeNode");

class PTreeRoot {
    
    constructor() {
        this.maxLength = 6;
        this.children = new Hashtable();
        this.m_Lock = new Object();
        this.m_Data = null;
    }
    
    close() {
        this.children.clear();
        if (this.m_Data !== null) {
            this.m_Data.close();
            this.m_Data = null;
        }
    }
    
    collect() {
        /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
            for (const ch of this.children.entries) {
                ch.value.children.clear();
                ch.value.loaded = false;
            }
        }
    }
    
    add(path, id) {
        if (Utils.isNullOrEmpty(path)) 
            return null;
        let res = null;
        let wrapres65 = new RefOutArgWrapper();
        let inoutres66 = this.children.tryGetValue(path[0], wrapres65);
        res = wrapres65.value;
        if (!inoutres66) 
            this.children.put(path[0], (res = new PTreeNode()));
        let j = 1;
        for (let i = 1; (i < path.length) && (j < this.maxLength); i++) {
            if (!Utils.isLetterOrDigit(path[i]) || path[i] === '0') 
                continue;
            let rr = null;
            if (res.children === null) 
                res.children = new Hashtable();
            let wraprr63 = new RefOutArgWrapper();
            let inoutres64 = res.children.tryGetValue(path[i], wraprr63);
            rr = wraprr63.value;
            if (!inoutres64) 
                res.children.put(path[i], (rr = new PTreeNode()));
            j++;
            res = rr;
        }
        if (res.ids === null) 
            res.ids = new Array();
        if (res.ids.length >= 10000) {
        }
        else if (!res.ids.includes(id)) 
            res.ids.push(id);
        return res;
    }
    
    find(path) {
        if (Utils.isNullOrEmpty(path)) 
            return null;
        let res = null;
        let wrapres69 = new RefOutArgWrapper();
        let inoutres70 = this.children.tryGetValue(path[0], wrapres69);
        res = wrapres69.value;
        if (!inoutres70) 
            return null;
        let j = 1;
        for (let i = 1; (i < path.length) && (j < this.maxLength); i++) {
            if (!Utils.isLetterOrDigit(path[i]) || path[i] === '0') 
                continue;
            if (!res.loaded) 
                this.loadNode(res);
            let rr = null;
            if (res.children === null) 
                return null;
            let wraprr67 = new RefOutArgWrapper();
            let inoutres68 = res.children.tryGetValue(path[i], wraprr67);
            rr = wraprr67.value;
            if (!inoutres68) 
                return null;
            res = rr;
            j++;
        }
        if (!res.loaded) 
            this.loadNode(res);
        return res;
    }
    
    loadNode(res) {
        /* this is synchronized block by this.m_Lock, but this feature isn't supported in JS */ {
            if (!res.loaded && res.lazyPos > 0) {
                this.m_Data.position = res.lazyPos;
                this._deserializeNode(res);
            }
            res.loaded = true;
        }
    }
    
    save(fname) {
        if (this.m_Data !== null) {
            this.m_Data.close();
            this.m_Data = null;
        }
        let f = new FileStream(fname, "w+", false); 
        try {
            FiasHelper.serializeInt(f, this.children.length);
            for (const kp of this.children.entries) {
                FiasHelper.serializeShort(f, kp.key.charCodeAt(0));
                PTreeRoot._serializeNode(f, kp.value);
            }
        }
        finally {
            f.close();
        }
        this.close();
        ;
    }
    
    static _serializeNode(f, nod) {
        FiasHelper.serializeShort(f, (nod.ids === null ? 0 : nod.ids.length));
        if (nod.ids !== null) {
            nod.ids.sort((a, b) => a - b);
            for (const v of nod.ids) {
                FiasHelper.serializeInt(f, v);
            }
        }
        FiasHelper.serializeInt(f, (nod.children === null ? 0 : nod.children.length));
        if (nod.children !== null) {
            if (nod.children.length > 0x1000) {
            }
            for (const kp of nod.children.entries) {
                FiasHelper.serializeShort(f, kp.key.charCodeAt(0));
                let p0 = f.position;
                FiasHelper.serializeInt(f, 0);
                PTreeRoot._serializeNode(f, kp.value);
                let p1 = f.position;
                f.position = p0;
                FiasHelper.serializeInt(f, p1);
                f.position = p1;
            }
        }
    }
    
    load(fname) {
        this.m_Data = new FileStream(fname, "r", false);
        this.m_Data.position = 0;
        let cou = FiasHelper.deserializeInt(this.m_Data);
        if (cou === 0) 
            return;
        for (let i = 0; i < cou; i++) {
            let ch = String.fromCharCode(FiasHelper.deserializeShort(this.m_Data));
            let tn = new PTreeNode();
            this._deserializeNode(tn);
            this.children.put(ch, tn);
        }
    }
    
    _deserializeNode(res) {
        let cou = FiasHelper.deserializeShort(this.m_Data);
        if (cou > 0x1000 || (cou < 0)) {
        }
        if (cou > 0) {
            res.ids = new Array();
            for (let i = 0; i < cou; i++) {
                let id = FiasHelper.deserializeInt(this.m_Data);
                res.ids.push(id);
            }
        }
        cou = FiasHelper.deserializeInt(this.m_Data);
        if (cou === 0) 
            return;
        if (cou > 0x1000 || (cou < 0)) {
        }
        for (let i = 0; i < cou; i++) {
            let ch = String.fromCharCode(FiasHelper.deserializeShort(this.m_Data));
            let p1 = FiasHelper.deserializeInt(this.m_Data);
            let tn = new PTreeNode();
            tn.lazyPos = this.m_Data.position;
            tn.loaded = false;
            if (res.children === null) 
                res.children = new Hashtable();
            res.children.put(ch, tn);
            this.m_Data.position = p1;
        }
        res.loaded = true;
    }
}


module.exports = PTreeRoot