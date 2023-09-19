/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const fs = require('fs');
const path = require('path');
const Utils = require("./../../unisharp/Utils");
const Stream = require("./../../unisharp/Stream");
const FileStream = require("./../../unisharp/FileStream");

class BaseTable {
    
    constructor(_index) {
        this.index = null;
        this.name = null;
        this.m_Lock = new Object();
        this.index = _index;
    }
    
    toString() {
        return (this.name != null ? this.name : super.toString());
    }
    
    get recordsCount() {
        return 0;
    }
    
    get size() {
        return 0;
    }
    
    close() {
        this._Close();
    }
    
    open(readOnly, indexInMemoryMaxLength = 0) {
        return false;
    }
    
    _Close() {
        
    }
    
    clear() {
        
    }
    
    flush() {
        
    }
    
    optimize(minPercent = 10) {
        return false;
    }
    
    needOptimize(minPercent = 10, analyzeDiskSpace = true) {
        return false;
    }
    
    static backupFile(fname, path) {
        try {
            if (!fs.existsSync(fname) && fs.statSync(fname).isFile()) 
                return true;
            fs.copyFile(fname, path.join(path, path.basename(fname)));
            return true;
        } catch (ex) {
            return false;
        }
    }
    
    static restoreFile(fname, path, remove) {
        try {
            let src = path.join(path, path.basename(fname));
            if (!fs.existsSync(src) && fs.statSync(src).isFile()) 
                return true;
            fs.copyFile(src, fname);
            if (remove) 
                fs.unlinkSync(src);
            return true;
        } catch (ex) {
            return false;
        }
    }
    
    backup(path) {
        return true;
    }
    
    restore(path, remove) {
        return true;
    }
    
    createFileStream(fileName, readOnly, bufLen = -1) {
        let resEx = null;
        for (let k = 0; k < 5; k++) {
            try {
                if (readOnly) {
                    if (bufLen > 0) 
                        return new FileStream(fileName, "r", false);
                    else 
                        return new FileStream(fileName, "r", false);
                }
                else if (bufLen > 0) 
                    return new FileStream(fileName, "r+", false);
                else 
                    return new FileStream(fileName, "r+", false);
            } catch (ex) {
                resEx = ex;
            }
            if (k === 0) {
                if (!fs.existsSync(fileName) && fs.statSync(fileName).isFile()) {
                    if (bufLen > 0) 
                        return new FileStream(fileName, "r+", false);
                    else 
                        return new FileStream(fileName, "r+", false);
                }
            }
        }
        throw resEx;
    }
    
    static getBytesForString(res, str, enc = null) {
        if (Utils.isNullOrEmpty(str)) 
            res.splice(res.length, 0, ...Utils.objectToBytes(0, 'short'));
        else {
            let b = (enc === null ? Utils.encodeString("UTF-8", str) : Utils.encodeString(enc, str));
            res.splice(res.length, 0, ...Utils.objectToBytes(b.length, 'short'));
            res.splice(res.length, 0, ...b);
        }
    }
    
    static getStringForBytes(data, ind, dontCreate = false, enc = null) {
        if ((ind.value + 2) > data.length) 
            return null;
        let len = Utils.bytesToObject(data, ind.value, 'short', 2);
        ind.value += 2;
        if (len <= (0)) 
            return null;
        if ((ind.value + (len)) > data.length) 
            return null;
        let res = null;
        if (!dontCreate) {
            if (enc === null) 
                res = Utils.decodeString("UTF-8", data, ind.value, len);
            else 
                res = Utils.decodeString(enc, data, ind.value, len);
        }
        ind.value += (len);
        return res;
    }
    
    static getBytesForDate0(res, dt) {
        if (dt !== null) 
            BaseTable.getBytesForDate(res, dt);
        else 
            res.splice(res.length, 0, ...Utils.objectToBytes(0, 'short'));
    }
    
    static getBytesForDate(res, dt) {
        res.splice(res.length, 0, ...Utils.objectToBytes(dt.getFullYear(), 'short'));
        res.push(Utils.getMonth(dt));
        res.push(dt.getDate());
        res.push(dt.getHours());
        res.push(dt.getMinutes());
        res.push(dt.getSeconds());
        res.push(0);
    }
    
    static toDate(data, ind) {
        if ((ind.value + 2) > data.length) 
            return null;
        let year = Utils.bytesToObject(data, ind.value, 'short', 2);
        ind.value += 2;
        if (year === 0) 
            return null;
        if ((ind.value + 8) > data.length) 
            return null;
        let mon = data[ind.value++];
        let day = data[ind.value++];
        let hour = data[ind.value++];
        let min = data[ind.value++];
        let sec = data[ind.value++];
        ind.value++;
        if (year === 0) 
            return null;
        try {
            return new Date(year, mon - 1, day, hour, min, sec);
        } catch (ex3000) {
            return null;
        }
    }
}


module.exports = BaseTable