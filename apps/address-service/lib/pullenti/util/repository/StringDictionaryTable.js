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
const Stream = require("./../../unisharp/Stream");
const FileStream = require("./../../unisharp/FileStream");
const FileInfo = require("./../../unisharp/FileInfo");

const BaseTable = require("./BaseTable");

class StringDictionaryTable extends BaseTable {
    
    constructor(_index, _name) {
        super(_index);
        this.m_Hash = new Hashtable();
        this.m_Strings = new Array();
        this.m_New = new Array();
        this.m_FileName = null;
        this.m_Stream = null;
        this.m_FileName = path.join(_index.baseDir, _name + ".dic");
        this.name = _name;
    }
    
    get isExists() {
        if (!fs.existsSync(this.m_FileName) && fs.statSync(this.m_FileName).isFile()) 
            return false;
        return true;
    }
    
    get size() {
        let fi = new FileInfo(this.m_FileName);
        if (fi.exists()) 
            return fi.length;
        else 
            return 0;
    }
    
    backup(path) {
        this._Close();
        if (!BaseTable.backupFile(this.m_FileName, path)) 
            return false;
        return super.backup(path);
    }
    
    restore(path, remove) {
        this._Close();
        if (!BaseTable.restoreFile(this.m_FileName, path, remove)) 
            return false;
        return super.restore(path, remove);
    }
    
    _Close() {
        this._saveNew();
        if (this.m_Stream !== null) {
            this.m_Stream.close();
            this.m_Stream = null;
        }
        this.m_Hash.clear();
        this.m_Strings.splice(0, this.m_Strings.length);
    }
    
    flush() {
        this._saveNew();
        super.flush();
        if (this.m_Stream !== null) 
            this.m_Stream.flush();
    }
    
    _saveNew() {
        if (this.m_New.length < 1) 
            return;
        let buf = new Array();
        for (const s of this.m_New) {
            BaseTable.getBytesForString(buf, s, null);
        }
        this.m_Stream.position = this.m_Stream.length;
        this.m_Stream.write(buf, 0, buf.length);
        this.m_New.splice(0, this.m_New.length);
    }
    
    clear() {
        this._Close();
        if (fs.existsSync(this.m_FileName) && fs.statSync(this.m_FileName).isFile()) 
            fs.unlinkSync(this.m_FileName);
    }
    
    open(readOnly, indexInMemoryMaxLength = 0) {
        if (this.m_Stream !== null) {
            if (readOnly || this.m_Stream.canWrite()) 
                return true;
        }
        this._Close();
        if (readOnly) {
            if (!fs.existsSync(this.m_FileName) && fs.statSync(this.m_FileName).isFile()) 
                return false;
        }
        this.m_Stream = this.createFileStream(this.m_FileName, readOnly, -1);
        if (this.m_Stream.length > (0)) {
            let buf = new Uint8Array(this.m_Stream.length);
            this.m_Stream.position = 0;
            this.m_Stream.read(buf, 0, buf.length);
            this._restore(buf);
        }
        return true;
    }
    
    _restore(data) {
        let ind = 0;
        while (ind < data.length) {
            let wrapind3023 = new RefOutArgWrapper(ind);
            let s = BaseTable.getStringForBytes(data, wrapind3023, false, null);
            ind = wrapind3023.value;
            if (s === null) 
                break;
            if (!this.m_Hash.containsKey(s)) {
                this.m_Hash.put(s, this.m_Hash.length + 1);
                this.m_Strings.push(s);
            }
        }
    }
    
    getCodeByString(val, addIfNotExist) {
        if (Utils.isNullOrEmpty(val)) 
            return 0;
        let id = 0;
        let wrapid3024 = new RefOutArgWrapper();
        let inoutres3025 = this.m_Hash.tryGetValue(val, wrapid3024);
        id = wrapid3024.value;
        if (inoutres3025) 
            return id;
        if (!addIfNotExist) 
            return 0;
        id = this.m_Hash.length + 1;
        this.m_Hash.put(val, id);
        this.m_Strings.push(val);
        this.m_New.push(val);
        return id;
    }
    
    getStringByCode(id) {
        if ((id < 1) || id > this.m_Strings.length) 
            return null;
        else 
            return this.m_Strings[id - 1];
    }
}


module.exports = StringDictionaryTable