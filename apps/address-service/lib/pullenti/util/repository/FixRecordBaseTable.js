/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const StringBuilder = require("./../../unisharp/StringBuilder");
const FileInfo = require("./../../unisharp/FileInfo");

const KeyBaseTable = require("./KeyBaseTable");

class FixRecordBaseTable extends KeyBaseTable {
    
    constructor(_index, _name) {
        super(_index, _name, null);
        this.maxCount = 0;
        this.maxCountFloatIndex = 0;
        this.m_FixRecordFields = new Array();
        this.m_AddBuffer = null;
        this.m_LastReadedFixRecords = null;
        this.m_FetchLastId = 0;
    }
    
    get recordSize() {
        return this.m_FixRecordFields.length * 4;
    }
    
    get recordsCount() {
        if (this.m_Data !== null) 
            return Utils.intDiv(this.m_Data.length, this.recordSize);
        let fi = new FileInfo(this.m_DataFileName);
        if (fi.exists()) 
            return Utils.intDiv(fi.length, this.recordSize);
        return 0;
    }
    
    _Close() {
        this.m_LastReadedFixRecords = null;
        try {
            this._saveBuffer();
        } catch (ex) {
        }
        super._Close();
    }
    
    flush() {
        try {
            this._saveBuffer();
        } catch (ex) {
        }
        super.flush();
    }
    
    addFixRecord(key, i1, i2, i3, f1, f2, f3, i4 = 0) {
        if (this.m_LastReadedFixRecords !== null && this.m_LastReadedFixRecords.baseKey === key) 
            this.m_LastReadedFixRecords = null;
        if (this.m_AddBuffer !== null && this.m_AddBuffer.baseKey !== key) 
            this._saveBuffer();
        if (this.m_AddBuffer === null) 
            this.m_AddBuffer = new FixRecordBaseTable.FixRecordsBuffer(key, this.m_FixRecordFields);
        if (!this.m_AddBuffer.add(i1, i2, i3, f1, f2, f3, i4)) {
            this._saveBuffer();
            this.m_AddBuffer = new FixRecordBaseTable.FixRecordsBuffer(key, this.m_FixRecordFields);
            this.m_AddBuffer.add(i1, i2, i3, f1, f2, f3, i4);
        }
    }
    
    getFixRecords(key) {
        if (this.m_AddBuffer !== null) {
            if (key === this.m_AddBuffer.baseKey) 
                this._saveBuffer();
        }
        if (this.m_LastReadedFixRecords !== null && this.m_LastReadedFixRecords.baseKey === key) 
            return this.m_LastReadedFixRecords;
        let res = new FixRecordBaseTable.FixRecordsBuffer(key, this.m_FixRecordFields);
        let data = this.readKeyData(key, 0);
        if (data !== null) 
            res.restore(data);
        this.m_LastReadedFixRecords = res;
        return res;
    }
    
    saveFixRecords(buf) {
        this.m_LastReadedFixRecords = null;
        this.writeKeyData(buf.baseKey, buf.getBytesArray());
    }
    
    _saveBuffer() {
        if (this.m_AddBuffer === null) 
            return;
        let exData = this.readKeyData(this.m_AddBuffer.baseKey, 0);
        if (exData === null || exData.length === 0) {
            if (this.maxCount > 0 && (this.maxCount < this.m_AddBuffer.count)) 
                this.m_AddBuffer.cut(this.maxCount, this.maxCountFloatIndex);
            this.writeKeyData(this.m_AddBuffer.baseKey, this.m_AddBuffer.getBytesArray());
            this.m_AddBuffer = null;
            return;
        }
        let exRecs = new FixRecordBaseTable.FixRecordsBuffer(this.m_AddBuffer.baseKey, this.m_FixRecordFields);
        exRecs.restore(exData);
        let res = exRecs.mergeWith(this.m_AddBuffer);
        let bytes = null;
        if (this.maxCount > 0) {
            let cou = Utils.intDiv(res.length, exRecs.recordSize);
            if (cou > this.maxCount) {
                let tmp = new FixRecordBaseTable.FixRecordsBuffer(this.m_AddBuffer.baseKey, this.m_FixRecordFields);
                tmp.restore(res);
                tmp.cut(this.maxCount, this.maxCountFloatIndex);
                bytes = tmp.getBytesArray();
            }
        }
        if (bytes === null) 
            bytes = res;
        this.writeKeyData(this.m_AddBuffer.baseKey, bytes);
        this.m_AddBuffer = null;
    }
    
    beginFetchAllFixRecordsBuffer(firstId = 1) {
        this.m_FetchLastId = firstId - 1;
    }
    
    fetchFixRecordsBuffer(_maxCount = 1000) {
        this.m_FetchLastId++;
        if (this.m_FetchLastId > this.getMaxKey()) 
            return null;
        let dats = this.readKeysData(this.m_FetchLastId, _maxCount, 10000000);
        let res = new Array();
        if (dats === null) {
            this.m_FetchLastId += _maxCount;
            return res;
        }
        for (const kp of dats.entries) {
            if (kp.value !== null) {
                let buf = new FixRecordBaseTable.FixRecordsBuffer(kp.key, this.m_FixRecordFields);
                buf.restore(kp.value);
                res.push(buf);
                this.m_FetchLastId = kp.key;
            }
        }
        return res;
    }
}


/**
 * Описание поля фиксированной записи
 */
FixRecordBaseTable.FieldDefinition = class  {
    
    constructor() {
        this.isKey = false;
        this.isFloat = false;
        this.mergeAdd = false;
        this.name = null;
    }
    
    toString() {
        let res = new StringBuilder();
        if (this.name !== null) 
            res.append(this.name).append(" ");
        if (this.isKey) 
            res.append("Key ");
        res.append((this.isFloat ? "Float" : "Int"));
        if (this.mergeAdd) 
            res.append(" MergeAdd");
        return res.toString();
    }
}


FixRecordBaseTable.FixRecordsBuffer = class  {
    
    constructor(_baseKey, _fields) {
        this.baseKey = 0;
        this.recordSize = 0;
        this.keyCount = 0;
        this.fields = null;
        this.m_Ints = null;
        this.m_Floats = null;
        this.baseKey = _baseKey;
        this.keyCount = 0;
        this.recordSize = 0;
        this.fields = _fields;
        for (const f of _fields) {
            if (f.isFloat) {
                if (this.m_Floats === null) 
                    this.m_Floats = new Array();
                this.m_Floats.push(new Array());
            }
            else {
                if (this.m_Ints === null) 
                    this.m_Ints = new Array();
                this.m_Ints.push(new Array());
                if (f.isKey) 
                    this.keyCount++;
            }
            this.recordSize += 4;
        }
    }
    
    get count() {
        return (this.m_Ints === null ? 0 : this.m_Ints[0].length);
    }
    
    find(i1) {
        return (this.m_Ints === null ? -1 : this.m_Ints[0].indexOf(i1));
    }
    
    getFloat(ind, i) {
        if (this.m_Floats === null || (ind < 0) || ind >= this.m_Floats.length) 
            return 0;
        if ((i < 0) || i >= this.m_Floats[ind].length) 
            return 0;
        else 
            return this.m_Floats[ind][i];
    }
    
    getInt(ind, i) {
        if (this.m_Ints === null || (ind < 0) || ind >= this.m_Ints.length) 
            return 0;
        if ((i < 0) || i >= this.m_Ints[ind].length) 
            return 0;
        else 
            return this.m_Ints[ind][i];
    }
    
    setFloat(ind, i, val) {
        if ((this.m_Floats === null || (ind < 0) || ind >= this.m_Floats.length) || (i < 0)) 
            return;
        if (i === this.m_Floats[ind].length) 
            this.m_Floats[ind].push(val);
        else 
            this.m_Floats[ind][i] = val;
    }
    
    setInt(ind, i, val) {
        if ((this.m_Ints === null || (ind < 0) || ind >= this.m_Ints.length) || (i < 0)) 
            return;
        if (i === this.m_Ints[ind].length) 
            this.m_Ints[ind].push(val);
        else 
            this.m_Ints[ind][i] = val;
    }
    
    getBytesArray() {
        let res = new Array();
        for (let i = 0; i < this.count; i++) {
            this.getBytes(i, res);
        }
        return res;
    }
    
    getBytes(i, res) {
        if (this.m_Ints !== null) {
            for (let j = 0; j < this.m_Ints.length; j++) {
                res.splice(res.length, 0, ...Utils.objectToBytes(this.m_Ints[j][i], 'int'));
            }
        }
        if (this.m_Floats !== null) {
            for (let j = 0; j < this.m_Floats.length; j++) {
                res.splice(res.length, 0, ...Utils.objectToBytes(this.m_Floats[j][i], 'float'));
            }
        }
    }
    
    add(i1, i2, i3, f1, f2, f3, i4) {
        if (this.count > 0) {
            if (this.compareWith(this.count - 1, i1, i2) >= 0) 
                return false;
        }
        if (this.m_Ints !== null) {
            this.m_Ints[0].push(i1);
            if (this.m_Ints.length > 1) 
                this.m_Ints[1].push(i2);
            if (this.m_Ints.length > 2) 
                this.m_Ints[2].push(i3);
            if (this.m_Ints.length > 3) 
                this.m_Ints[3].push(i4);
        }
        if (this.m_Floats !== null) {
            this.m_Floats[0].push(f1);
            if (this.m_Floats.length > 1) 
                this.m_Floats[1].push(f2);
            if (this.m_Floats.length > 2) 
                this.m_Floats[2].push(f3);
        }
        return true;
    }
    
    remove(ind) {
        if (this.m_Ints !== null) {
            for (const li of this.m_Ints) {
                li.splice(ind, 1);
            }
        }
        if (this.m_Floats !== null) {
            for (const li of this.m_Floats) {
                li.splice(ind, 1);
            }
        }
    }
    
    restore(data) {
        let cou = Utils.intDiv(data.length, this.recordSize);
        this._Clear(cou);
        let ind = 0;
        for (let i = 0; i < cou; i++) {
            if (this.m_Ints !== null) {
                for (let j = 0; j < this.m_Ints.length; j++) {
                    this.m_Ints[j].push(Utils.bytesToObject(data, ind, 'int', 4));
                    ind += 4;
                }
            }
            if (this.m_Floats !== null) {
                for (let j = 0; j < this.m_Floats.length; j++) {
                    this.m_Floats[j].push(Utils.bytesToObject(data, ind, 'float', 4));
                    ind += 4;
                }
            }
        }
    }
    
    cut(_maxCount, floatInd) {
        if (this.count <= _maxCount) 
            return false;
        if ((floatInd < 0) || floatInd >= this.m_Floats.length) 
            return false;
        let li = new Array();
        for (let i = 0; i < this.m_Floats[floatInd].length; i++) {
            li.push(FixRecordBaseTable.Temp._new3001(i, this.m_Floats[floatInd][i]));
        }
        // PYTHON: sort(key=attrgetter('val'))
        li.sort((a, b) => a.compareTo(b));
        let inds = new Array();
        for (let i = li.length - 1; i >= _maxCount; i--) {
            inds.push(li[i].ind);
        }
        inds.sort((a, b) => a - b);
        for (let i = inds.length - 1; i >= 0; i--) {
            this.remove(inds[i]);
        }
        return true;
    }
    
    _Clear(capacity) {
        if (this.m_Ints !== null) {
            for (const li of this.m_Ints) {
                li.splice(0, li.length);
            }
        }
        if (this.m_Floats !== null) {
            for (const li of this.m_Floats) {
                li.splice(0, li.length);
            }
        }
    }
    
    compareWithBuf(ind, rd, rbInd) {
        if (this.m_Ints === null) 
            return 0;
        if (this.m_Ints[0][ind] < rd.m_Ints[0][rbInd]) 
            return -1;
        if (this.m_Ints[0][ind] > rd.m_Ints[0][rbInd]) 
            return 1;
        if ((this.keyCount < 2) || (this.m_Ints.length < 2)) 
            return 0;
        if (this.m_Ints[1][ind] < rd.m_Ints[1][rbInd]) 
            return -1;
        if (this.m_Ints[1][ind] > rd.m_Ints[1][rbInd]) 
            return 1;
        return 0;
    }
    
    compareWith(ind, i1, i2) {
        if (this.m_Ints === null) 
            return 0;
        if (this.m_Ints[0][ind] < i1) 
            return -1;
        if (this.m_Ints[0][ind] > i1) 
            return 1;
        if ((this.keyCount < 2) || (this.m_Ints.length < 2)) 
            return 0;
        if (this.m_Ints[1][ind] < i2) 
            return -1;
        if (this.m_Ints[1][ind] > i2) 
            return 1;
        return 0;
    }
    
    check() {
        for (let i = 0; i < (this.count - 1); i++) {
            let cmp = this.compareWithBuf(i, this, i + 1);
            if (cmp >= 0) 
                return false;
        }
        return true;
    }
    
    static merge(buf1, buf2) {
        let buf = buf1.mergeWith(buf2);
        let res = new FixRecordBaseTable.FixRecordsBuffer(buf1.baseKey, buf1.fields);
        res.restore(buf);
        return res;
    }
    
    mergeWith(buf) {
        let cou = this.count + ((Utils.intDiv(buf.count, 2)));
        let i = ((Utils.intDiv(this.count, 2))) + buf.count;
        if (cou < i) 
            cou = i;
        let res = new Array();
        i = 0;
        let j = 0;
        while ((i < this.count) || (j < buf.count)) {
            if (i >= this.count) {
                buf.getBytes(j, res);
                j++;
                continue;
            }
            if (j >= buf.count) {
                this.getBytes(i, res);
                i++;
                continue;
            }
            let cmp = this.compareWithBuf(i, buf, j);
            if (cmp < 0) {
                this.getBytes(i, res);
                i++;
                continue;
            }
            if (cmp > 0) {
                buf.getBytes(j, res);
                j++;
                continue;
            }
            let ii = 0;
            let fi = 0;
            for (let ff = 0; ff < this.fields.length; ff++) {
                if (this.fields[ff].isFloat) {
                    let f = buf.getFloat(fi, j);
                    if (this.fields[ff].mergeAdd) 
                        this.setFloat(fi, i, this.getFloat(fi, i) + f);
                    else if (f > 0) 
                        this.setFloat(fi, i, f);
                    fi++;
                }
                else {
                    if (this.fields[ff].mergeAdd) 
                        this.setInt(ii, i, this.getInt(ii, i) + buf.getInt(ii, j));
                    ii++;
                }
            }
            this.getBytes(i, res);
            i++;
            j++;
        }
        return res;
    }
}


FixRecordBaseTable.Temp = class  {
    
    constructor() {
        this.ind = 0;
        this.val = 0;
    }
    
    compareTo(obj) {
        let f = obj.val;
        if (this.val > f) 
            return -1;
        if (this.val < f) 
            return 1;
        return 0;
    }
    
    static _new3001(_arg1, _arg2) {
        let res = new FixRecordBaseTable.Temp();
        res.ind = _arg1;
        res.val = _arg2;
        return res;
    }
}


module.exports = FixRecordBaseTable