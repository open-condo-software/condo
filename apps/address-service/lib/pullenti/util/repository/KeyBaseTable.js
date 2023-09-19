/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const path = require('path');
const fs = require('fs');
const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const Stopwatch = require("./../../unisharp/Stopwatch");
const Stream = require("./../../unisharp/Stream");
const FileStream = require("./../../unisharp/FileStream");
const FileInfo = require("./../../unisharp/FileInfo");

const ConsoleHelper = require("./../ConsoleHelper");
const BaseTable = require("./BaseTable");

class KeyBaseTable extends BaseTable {
    
    constructor(_index, _name, baseDir = null) {
        super(_index);
        this.autoZipData = false;
        this.loadAllInMemory = false;
        this.indexStreamBufSize = -1;
        this.dataStreamBufSize = -1;
        this.m_UniqueKeyPosition = 0;
        this.m_IndexFileName = null;
        this.m_DataFileName = null;
        this.m_Index = null;
        this.m_IndexBuf = null;
        this.m_Data = null;
        this.m_DataBuf = null;
        this.m_ReadIndBuf = null;
        this.m_FetchPos = 0;
        if (this.index !== null) {
            this.m_IndexFileName = path.join(this.index.baseDir, _name + ".ind");
            this.m_DataFileName = path.join(this.index.baseDir, _name + ".dat");
        }
        else if (baseDir !== null) {
            this.m_IndexFileName = path.join(baseDir, _name + ".ind");
            this.m_DataFileName = path.join(baseDir, _name + ".dat");
        }
        this.name = _name;
    }
    
    get isExists() {
        if (!fs.existsSync(this.m_DataFileName) && fs.statSync(this.m_DataFileName).isFile()) 
            return false;
        if (!fs.existsSync(this.m_IndexFileName) && fs.statSync(this.m_IndexFileName).isFile()) 
            return false;
        return true;
    }
    
    remove() {
        this._Close();
        if (fs.existsSync(this.m_DataFileName) && fs.statSync(this.m_DataFileName).isFile()) 
            fs.unlinkSync(this.m_DataFileName);
        if (fs.existsSync(this.m_IndexFileName) && fs.statSync(this.m_IndexFileName).isFile()) 
            fs.unlinkSync(this.m_IndexFileName);
    }
    
    backup(path) {
        this._Close();
        if (!BaseTable.backupFile(this.m_IndexFileName, path)) 
            return false;
        if (!BaseTable.backupFile(this.m_DataFileName, path)) 
            return false;
        return super.backup(path);
    }
    
    restore(path, _remove) {
        this._Close();
        if (!BaseTable.restoreFile(this.m_IndexFileName, path, _remove)) 
            return false;
        if (!BaseTable.restoreFile(this.m_DataFileName, path, _remove)) 
            return false;
        return super.restore(path, _remove);
    }
    
    _Close() {
        if (this.m_Data !== null) {
            this.m_Data.close();
            this.m_Data = null;
        }
        if (this.m_Index !== null) {
            this.m_Index.close();
            this.m_Index = null;
        }
        this.m_IndexBuf = null;
        this.m_DataBuf = null;
    }
    
    flush() {
        super.flush();
        if (this.m_Data !== null) 
            this.m_Data.flush();
        if (this.m_Index !== null) 
            this.m_Index.flush();
    }
    
    get recordsCount() {
        return this.getMaxKey();
    }
    
    get size() {
        if (this.m_Data !== null) 
            return this.m_Data.length + this.m_Index.length;
        let res = 0;
        let fi = new FileInfo(this.m_DataFileName);
        if (fi.exists()) 
            res += fi.length;
        fi = new FileInfo(this.m_IndexFileName);
        if (fi.exists()) 
            res += fi.length;
        return res;
    }
    
    getMaxKey() {
        let res = 0;
        if (this.m_Index !== null) 
            res = Utils.intDiv(this.m_Index.length, KeyBaseTable.indexRecordSize);
        else {
            let fi = new FileInfo(this.m_IndexFileName);
            if (!fi.exists()) 
                return 0;
            res = Utils.intDiv(fi.length, KeyBaseTable.indexRecordSize);
        }
        if (res > (0)) 
            res--;
        return res;
    }
    
    resetUniqueKeyPointer() {
        this.m_UniqueKeyPosition = 0;
    }
    
    getUniqueKey() {
        let max = this.getMaxKey();
        if (this.m_UniqueKeyPosition < 0) 
            return max + 1;
        let disp = 0;
        let len = 0;
        if (this.m_UniqueKeyPosition === 0) 
            this.m_UniqueKeyPosition = 1;
        for (; this.m_UniqueKeyPosition < max; this.m_UniqueKeyPosition++) {
            let wrapdisp3002 = new RefOutArgWrapper();
            let wraplen3003 = new RefOutArgWrapper();
            let inoutres3004 = this._readIndexInfo(this.m_UniqueKeyPosition, wrapdisp3002, wraplen3003);
            disp = wrapdisp3002.value;
            len = wraplen3003.value;
            if (!inoutres3004) 
                continue;
            if (disp === (0) && len === 0) 
                return this.m_UniqueKeyPosition++;
        }
        this.m_UniqueKeyPosition = -1;
        return max + 1;
    }
    
    setMaxKey(maxKey) {
        let delta = maxKey - this.getMaxKey();
        if (delta <= 0) 
            return;
        let buf = new Uint8Array(((delta + 1)) * KeyBaseTable.indexRecordSize);
        for (let i = 0; i < buf.length; i++) {
            buf[i] = 0;
        }
        if (this.m_Index === null) {
            this.m_Index = this.createFileStream(this.m_IndexFileName, false, -1);
            this.m_Index.position = this.m_Index.length;
            this.m_Index.write(buf, 0, buf.length);
            this.m_Index.close();
        }
        else {
            this.m_Index.position = this.m_Index.length;
            this.m_Index.write(buf, 0, buf.length);
        }
    }
    
    clear() {
        this._Close();
        if (fs.existsSync(this.m_IndexFileName) && fs.statSync(this.m_IndexFileName).isFile()) 
            fs.unlinkSync(this.m_IndexFileName);
        if (fs.existsSync(this.m_DataFileName) && fs.statSync(this.m_DataFileName).isFile()) 
            fs.unlinkSync(this.m_DataFileName);
    }
    
    open(readOnly, indexInMemoryMaxLength = 0) {
        if (this.m_Data !== null) {
            if (readOnly || this.m_Data.canWrite()) 
                return true;
        }
        this._Close();
        this.m_UniqueKeyPosition = 0;
        if (readOnly) {
            if (!fs.existsSync(this.m_IndexFileName) && fs.statSync(this.m_IndexFileName).isFile() || !fs.existsSync(this.m_DataFileName) && fs.statSync(this.m_DataFileName).isFile()) 
                return false;
        }
        this.m_Index = this.createFileStream(this.m_IndexFileName, readOnly, this.indexStreamBufSize);
        this.m_Data = this.createFileStream(this.m_DataFileName, readOnly, this.dataStreamBufSize);
        if (((indexInMemoryMaxLength > 0 && this.m_Index.length <= indexInMemoryMaxLength)) || this.loadAllInMemory) {
            this.m_IndexBuf = new Uint8Array(this.m_Index.length);
            this.m_Index.position = 0;
            this.m_Index.read(this.m_IndexBuf, 0, this.m_IndexBuf.length);
        }
        if (this.loadAllInMemory) {
            this.m_DataBuf = new Uint8Array(this.m_Data.length);
            this.m_Data.position = 0;
            this.m_Data.read(this.m_DataBuf, 0, this.m_DataBuf.length);
        }
        return true;
    }
    
    calcDataOptimizedLength() {
        let res = 0;
        if (this.m_Index !== null) {
            let buf = new Uint8Array(10000 * KeyBaseTable.indexRecordSize);
            this.m_Index.position = 0;
            while (true) {
                let i = this.m_Index.read(buf, 0, buf.length);
                if (i < KeyBaseTable.indexRecordSize) 
                    break;
                for (let j = 0; j < i; j += KeyBaseTable.indexRecordSize) {
                    let lo = Utils.bytesToObject(buf, j, 'int', 4);
                    if (lo > 0) {
                        let le = Utils.bytesToObject(buf, j + 8, 'int', 4);
                        if (le > 0) 
                            res += (le);
                    }
                }
            }
        }
        else if (this.m_IndexBuf !== null) {
            for (let i = 0; (i + KeyBaseTable.indexRecordSize) <= this.m_IndexBuf.length; i += KeyBaseTable.indexRecordSize) {
                let lo = Utils.bytesToObject(this.m_IndexBuf, i, 'int', 4);
                if (lo > 0) {
                    let le = Utils.bytesToObject(this.m_IndexBuf, i + 8, 'int', 4);
                    if (le > 0) 
                        res += (le);
                }
            }
        }
        return res;
    }
    
    _shiftIndex(deltaKey) {
        if (this.m_Index.length <= KeyBaseTable.indexRecordSize) 
            return;
        this.m_IndexBuf = null;
        let len = (this.m_Index.length - (KeyBaseTable.indexRecordSize));
        let buf = new Uint8Array(len);
        this.m_Index.position = KeyBaseTable.indexRecordSize;
        this.m_Index.read(buf, 0, buf.length);
        let empty = new Uint8Array(deltaKey * KeyBaseTable.indexRecordSize);
        for (let i = 0; i < empty.length; i++) {
            empty[i] = 0;
        }
        this.m_Index.position = KeyBaseTable.indexRecordSize;
        this.m_Index.write(empty, 0, empty.length);
        this.m_Index.write(buf, 0, buf.length);
    }
    
    _readIndex0() {
        let res = new Uint8Array(KeyBaseTable.indexRecordSize);
        this.m_Index.position = 0;
        if (this.m_Index.read(res, 0, res.length) !== res.length) 
            return null;
        return res;
    }
    
    _writeIndex0(info) {
        let len = info.length;
        if (len > KeyBaseTable.indexRecordSize) 
            len = KeyBaseTable.indexRecordSize;
        this.m_Index.position = 0;
        this.m_Index.write(info, 0, len);
    }
    
    _readIndexInfo(key, disp, len) {
        disp.value = 0;
        len.value = 0;
        let p = key;
        p *= (KeyBaseTable.indexRecordSize);
        if (this.m_IndexBuf !== null) {
            if ((p + (KeyBaseTable.indexRecordSize)) > this.m_IndexBuf.length) 
                return false;
            disp.value = Utils.bytesToObject(this.m_IndexBuf, p, 'int', 4);
            len.value = Utils.bytesToObject(this.m_IndexBuf, (p + (8)), 'int', 4);
        }
        else if (this.m_Index !== null) {
            if ((p + (KeyBaseTable.indexRecordSize)) > this.m_Index.length) 
                return false;
            this.m_Index.position = p;
            let buf = new Uint8Array(KeyBaseTable.indexRecordSize);
            if (this.m_Index.read(buf, 0, KeyBaseTable.indexRecordSize) !== KeyBaseTable.indexRecordSize) 
                return false;
            disp.value = Utils.bytesToObject(buf, 0, 'int', 4);
            len.value = Utils.bytesToObject(buf, 8, 'int', 4);
        }
        else 
            return false;
        if (len.value < 0) 
            return false;
        return true;
    }
    
    _writeIndexInfo(key, disp, len) {
        let dbuf = Utils.objectToBytes(disp, 'long');
        let lbuf = Utils.objectToBytes(len, 'int');
        let p = key;
        p *= (KeyBaseTable.indexRecordSize);
        if (this.m_IndexBuf !== null && (p + (KeyBaseTable.indexRecordSize)) <= this.m_IndexBuf.length) {
            for (let i = 0; i < 8; i++) {
                this.m_IndexBuf[p + (i)] = dbuf[i];
            }
            for (let i = 0; i < 4; i++) {
                this.m_IndexBuf[p + (8) + (i)] = lbuf[i];
            }
        }
        if (p > this.m_Index.length) {
            let buf = new Uint8Array(p - this.m_Index.length);
            for (let i = 0; i < buf.length; i++) {
                buf[i] = 0;
            }
            this.m_Index.position = this.m_Index.length;
            this.m_Index.write(buf, 0, buf.length);
        }
        this.m_Index.position = p;
        this.m_Index.write(dbuf, 0, 8);
        this.m_Index.write(lbuf, 0, 4);
    }
    
    readKeyDataLen(key) {
        if (this.m_Data === null) {
            if (!this.open(true, 0)) 
                return -1;
        }
        let disp = 0;
        let len = 0;
        let wrapdisp3005 = new RefOutArgWrapper();
        let wraplen3006 = new RefOutArgWrapper();
        let inoutres3007 = this._readIndexInfo(key, wrapdisp3005, wraplen3006);
        disp = wrapdisp3005.value;
        len = wraplen3006.value;
        if (!inoutres3007) 
            return -1;
        else 
            return len;
    }
    
    readKeyData(key, maxLen = 0) {
        let log = false;
        if (this.m_Data === null) {
            if (log) 
                ConsoleHelper.write(" m_Data = null ");
            if (!this.open(true, 0)) {
                if (log) 
                    ConsoleHelper.write(" Can't open ");
                return null;
            }
        }
        let disp = 0;
        let len = 0;
        let wrapdisp3008 = new RefOutArgWrapper();
        let wraplen3009 = new RefOutArgWrapper();
        let inoutres3010 = this._readIndexInfo(key, wrapdisp3008, wraplen3009);
        disp = wrapdisp3008.value;
        len = wraplen3009.value;
        if (!inoutres3010) {
            if (log) 
                ConsoleHelper.write(" Can't read IndexInfo ");
            return null;
        }
        if (log) 
            ConsoleHelper.write((" Disp=" + disp + "; Len = " + len + " "));
        if (len < 1) 
            return null;
        if (disp >= this.m_Data.length) {
            if (log) 
                ConsoleHelper.write((" disp (" + disp + ") >= length (" + this.m_Data.length + ") "));
            return null;
        }
        if (maxLen > 0 && len > maxLen) 
            len = maxLen;
        let res = new Uint8Array(len);
        if (this.m_DataBuf !== null) {
            for (let i = 0; i < len; i++) {
                res[i] = this.m_DataBuf[disp + (i)];
            }
        }
        else {
            this.m_Data.position = disp;
            this.m_Data.read(res, 0, res.length);
        }
        if (this.autoZipData) 
            return KeyBaseTable.decompressDeflate(res);
        return res;
    }
    
    readKeysData(keyMin, maxCount, maxDataSize = 10000000) {
        if (this.m_ReadIndBuf === null || this.m_ReadIndBuf.length !== (maxCount * KeyBaseTable.indexRecordSize)) 
            this.m_ReadIndBuf = new Uint8Array(maxCount * KeyBaseTable.indexRecordSize);
        let p = keyMin;
        p *= (KeyBaseTable.indexRecordSize);
        this.m_Index.position = p;
        let dlen = this.m_Index.read(this.m_ReadIndBuf, 0, this.m_ReadIndBuf.length);
        if (dlen < KeyBaseTable.indexRecordSize) 
            return null;
        let disp0 = 0;
        let len0 = 0;
        let ind = 0;
        for (; (ind + KeyBaseTable.indexRecordSize) <= this.m_ReadIndBuf.length; ind += KeyBaseTable.indexRecordSize) {
            disp0 = Utils.bytesToObject(this.m_ReadIndBuf, ind, 'int', 4);
            len0 = Utils.bytesToObject(this.m_ReadIndBuf, ind + 8, 'int', 4);
            if (len0 > 0) 
                break;
            keyMin++;
        }
        if (len0 === 0) 
            return null;
        let ind0 = ind;
        let dposMax = disp0 + (len0);
        for (ind += KeyBaseTable.indexRecordSize; (ind + KeyBaseTable.indexRecordSize) <= dlen; ind += KeyBaseTable.indexRecordSize) {
            let disp = Utils.bytesToObject(this.m_ReadIndBuf, ind, 'int', 4);
            let len = Utils.bytesToObject(this.m_ReadIndBuf, ind + 8, 'int', 4);
            if (len === 0) 
                continue;
            if (disp > (dposMax + (100)) || (disp < disp0)) 
                break;
            if ((disp + len) > dposMax) {
                if (((disp + len) - disp0) > maxDataSize) 
                    break;
                dposMax = disp + len;
            }
            else {
            }
        }
        let ind1 = ind;
        let dats = new Uint8Array(dposMax - disp0);
        if (this.m_DataBuf !== null) {
            for (let i = 0; i < dats.length; i++) {
                dats[i] = this.m_DataBuf[disp0 + (i)];
            }
        }
        else {
            this.m_Data.position = disp0;
            this.m_Data.read(dats, 0, dats.length);
        }
        let res = new Hashtable();
        let id = keyMin;
        for (ind = ind0; ind < ind1; ind += KeyBaseTable.indexRecordSize,id++) {
            let disp = Utils.bytesToObject(this.m_ReadIndBuf, ind, 'int', 4);
            let len = Utils.bytesToObject(this.m_ReadIndBuf, ind + 8, 'int', 4);
            if (len === 0) 
                continue;
            let dat = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                dat[i] = dats[((disp) - disp0) + (i)];
            }
            if (this.autoZipData) 
                dat = KeyBaseTable.decompressDeflate(dat);
            res.put(id, dat);
        }
        return res;
    }
    
    removeKeyData(key) {
        if (!this.open(false, 0)) 
            return;
        let disp = 0;
        let len = 0;
        let wrapdisp3011 = new RefOutArgWrapper();
        let wraplen3012 = new RefOutArgWrapper();
        let inoutres3013 = this._readIndexInfo(key, wrapdisp3011, wraplen3012);
        disp = wrapdisp3011.value;
        len = wraplen3012.value;
        if (!inoutres3013) 
            return;
        if (disp === (0)) 
            return;
        this._writeIndexInfo(key, 0, 0);
        this.m_UniqueKeyPosition = key;
    }
    
    beginFetch() {
        if (this.m_Index === null) 
            this.open(true, 0);
        this.m_FetchPos = 0;
    }
    
    fetchDic(res, maxCount) {
        if (this.m_Index === null) 
            return;
        while (this.m_FetchPos < this.m_Index.length) {
            let id = Utils.intDiv(this.m_FetchPos, KeyBaseTable.indexRecordSize);
            let data = this.readKeyData(id, 0);
            this.m_FetchPos += 12;
            if (data !== null) 
                res.put(id, data);
            if (res.length >= maxCount) 
                break;
        }
    }
    
    fetchPercent() {
        if (this.m_Index.length > (100000)) 
            return Utils.intDiv(this.m_FetchPos, (Utils.intDiv(this.m_Index.length, 100)));
        else if ((this.m_Index.length) === 0) 
            return 0;
        else 
            return Utils.intDiv(this.m_FetchPos * 100, this.m_Index.length);
    }
    
    fetch(maxCount) {
        if (this.m_Index === null) 
            return null;
        let res = new Hashtable();
        while (this.m_FetchPos < this.m_Index.length) {
            let id = Utils.intDiv(this.m_FetchPos, KeyBaseTable.indexRecordSize);
            let data = this.readKeyData(id, 0);
            this.m_FetchPos += 12;
            if (data !== null) 
                res.put(id, data);
            if (res.length >= maxCount) 
                break;
        }
        return res;
    }
    
    endFetch() {
        this._Close();
    }
    
    writeKeyData(key, data) {
        if (this.autoZipData) 
            data = KeyBaseTable.compressDeflate(data);
        this._addData(key, data, this.m_Data);
    }
    
    updatePartOfData(key, data, pos) {
        let disp = 0;
        let len = 0;
        let wrapdisp3014 = new RefOutArgWrapper();
        let wraplen3015 = new RefOutArgWrapper();
        let inoutres3016 = this._readIndexInfo(key, wrapdisp3014, wraplen3015);
        disp = wrapdisp3014.value;
        len = wraplen3015.value;
        if (!inoutres3016) 
            return;
        this.m_Data.position = disp + (pos);
        this.m_Data.write(data, 0, data.length);
    }
    
    updateStartOfData(key, data) {
        let disp = 0;
        let len = 0;
        let wrapdisp3017 = new RefOutArgWrapper();
        let wraplen3018 = new RefOutArgWrapper();
        let inoutres3019 = this._readIndexInfo(key, wrapdisp3017, wraplen3018);
        disp = wrapdisp3017.value;
        len = wraplen3018.value;
        if (!inoutres3019) 
            return;
        this.m_Data.position = disp;
        this.m_Data.write(data, 0, data.length);
    }
    
    _addData(key, data, dst) {
        if (data === null || this.m_Index === null || dst === null) 
            return;
        if (dst === this.m_Data) {
            let disp = 0;
            let len = 0;
            let wrapdisp3020 = new RefOutArgWrapper();
            let wraplen3021 = new RefOutArgWrapper();
            let inoutres3022 = this._readIndexInfo(key, wrapdisp3020, wraplen3021);
            disp = wrapdisp3020.value;
            len = wraplen3021.value;
            if (inoutres3022) {
                if (len >= data.length && (disp + (len)) <= dst.length) {
                    dst.position = disp;
                    dst.write(data, 0, data.length);
                    this._writeIndexInfo(key, disp, data.length);
                    return;
                }
            }
        }
        if (dst.length === (0)) {
            dst.writeByte(0xFF);
            dst.writeByte(0xFF);
        }
        let pos = dst.length;
        if (data.length > 0) {
            for (let i = 0; i < 2; i++) {
                try {
                    dst.position = dst.length;
                    dst.write(data, 0, data.length);
                    break;
                } catch (ex) {
                    if (i === 0) {
                    }
                    if (i === 1) 
                        throw ex;
                }
            }
        }
        this._writeIndexInfo(key, pos, (data === null ? 0 : data.length));
    }
    
    needOptimize(minPercent = 10, analyzeDiskSpace = true) {
        if (this.m_Data === null) 
            return false;
        let le0 = this.calcDataOptimizedLength();
        if (le0 === (0)) 
            return false;
        let ration = 100 + minPercent;
        ration /= (100);
        let d = this.m_Data.length;
        d /= (le0);
        if (d > ration) 
            return true;
        if (d < 1.05) 
            return false;
        return false;
    }
    
    optimize(minPercent = 10) {
        let isOpened = this.m_Data !== null && this.m_Data.canWrite();
        if (isOpened) 
            this.flush();
        else if (!this.open(false, 10000000)) 
            return false;
        if (minPercent > 0) {
            if (!this.needOptimize(minPercent, true)) {
                if (!isOpened) 
                    this._Close();
                return false;
            }
        }
        let dir = path.dirname(this.m_IndexFileName);
        let tempDatFile = path.join(dir, "temp.dat");
        if (fs.existsSync(tempDatFile) && fs.statSync(tempDatFile).isFile()) 
            fs.unlinkSync(tempDatFile);
        let tempIndFile = path.join(dir, "temp.ind");
        if (fs.existsSync(tempIndFile) && fs.statSync(tempIndFile).isFile()) 
            fs.unlinkSync(tempIndFile);
        let tmpTable = new KeyBaseTable(this.index, "temp", dir);
        tmpTable.open(false, 0);
        let sw = new Stopwatch();
        let max = this.getMaxKey();
        let id = 1;
        sw.start();
        let p0 = 0;
        let autoZip = this.autoZipData;
        this.autoZipData = false;
        while (id <= max) {
            if (max > 10000) {
                let p = Utils.intDiv(id, (Utils.intDiv(max, 100)));
                if (p !== p0) 
                    process.stdout.write(" " + ((p0 = p)) + "%");
            }
            let datas = this.readKeysData(id, 1000, 10000000);
            if (datas !== null) {
                for (const kp of datas.entries) {
                    tmpTable.writeKeyData(kp.key, kp.value);
                    if (kp.key > id) 
                        id = kp.key;
                }
            }
            id++;
        }
        sw.stop();
        this._Close();
        tmpTable.close();
        this.autoZipData = autoZip;
        fs.unlinkSync(this.m_DataFileName);
        fs.renameSync(tempDatFile, this.m_DataFileName);
        fs.unlinkSync(this.m_IndexFileName);
        fs.renameSync(tempIndFile, this.m_IndexFileName);
        if (isOpened) 
            this.open(false, 0);
        return true;
    }
    
    uploadDataFromOtherDir(dirName, removeAfterCopy) {
        let srcIndexFileName = path.join(dirName, path.basename(this.m_IndexFileName));
        let srcDataFileName = path.join(dirName, path.basename(this.m_DataFileName));
        if (!fs.existsSync(srcIndexFileName) && fs.statSync(srcIndexFileName).isFile() || !fs.existsSync(srcDataFileName) && fs.statSync(srcDataFileName).isFile()) 
            return false;
        let isOpened = this.m_Data !== null && this.m_Data.canWrite();
        this._Close();
        if (removeAfterCopy) {
            if (fs.existsSync(this.m_DataFileName) && fs.statSync(this.m_DataFileName).isFile()) 
                fs.unlinkSync(this.m_DataFileName);
            fs.renameSync(srcDataFileName, this.m_DataFileName);
            if (fs.existsSync(this.m_IndexFileName) && fs.statSync(this.m_IndexFileName).isFile()) 
                fs.unlinkSync(this.m_IndexFileName);
            fs.renameSync(srcIndexFileName, this.m_IndexFileName);
        }
        else {
            fs.copyFile(srcDataFileName, this.m_DataFileName);
            fs.copyFile(srcIndexFileName, this.m_IndexFileName);
        }
        if (isOpened) 
            this.open(false, 0);
        return true;
    }
    
    static compressDeflate(dat) {
        if (dat === null) 
            return null;
        let zip = null;
        zip = Utils.compressDeflate(dat);
        return zip;
    }
    
    static decompressDeflate(zip) {
        if (zip === null || (zip.length < 1)) 
            return null;
        try {
            return Utils.decompressDeflate(zip);
        } catch (ex) {
            return null;
        }
    }
    
    static _new29(_arg1, _arg2, _arg3) {
        let res = new KeyBaseTable(_arg1, _arg2);
        res.autoZipData = _arg3;
        return res;
    }
    
    static static_constructor() {
        KeyBaseTable.indexRecordSize = 12;
    }
}


KeyBaseTable.static_constructor();

module.exports = KeyBaseTable