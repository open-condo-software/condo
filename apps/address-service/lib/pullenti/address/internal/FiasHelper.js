/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

class FiasHelper {
    
    static serializeByte(res, val) {
        res.writeByte(val);
    }
    
    static serializeShort(res, val) {
        res.writeByte(val);
        res.writeByte((val >> 8));
    }
    
    static serializeInt(res, val) {
        res.writeByte(val);
        res.writeByte((val >> 8));
        res.writeByte((val >> 16));
        res.writeByte((val >> 24));
    }
    
    static deserializeByte(str) {
        return str.readByte();
    }
    
    static deserializeShort(str) {
        let b0 = str.readByte();
        let b1 = str.readByte();
        let res = b1;
        res <<= 8;
        return (res | b0);
    }
    
    static deserializeInt(str) {
        let b0 = str.readByte();
        let b1 = str.readByte();
        let b2 = str.readByte();
        let b3 = str.readByte();
        let res = b3;
        res <<= 8;
        res |= b2;
        res <<= 8;
        res |= b1;
        res <<= 8;
        return (res | b0);
    }
    
    static serializeString(res, s, utf8 = false) {
        if (s === null) 
            res.writeByte(0xFF);
        else if (s.length === 0) 
            res.writeByte(0);
        else {
            let data = (utf8 ? Utils.encodeString("UTF-8", s) : FiasHelper.encodeString1251(s));
            res.writeByte(data.length);
            res.write(data, 0, data.length);
        }
    }
    
    static deserializeStringFromBytes(dat, ind, utf8 = false) {
        let len = dat[ind.value];
        ind.value++;
        if (len === (0xFF)) 
            return null;
        if (len === (0)) 
            return "";
        let res = (utf8 ? Utils.decodeString("UTF-8", dat, ind.value, len) : FiasHelper.decodeString1251(dat, ind.value, len, false));
        ind.value += (len);
        return res;
    }
    
    static deserializeString(str) {
        let len = str.readByte();
        if (len === (0xFF)) 
            return null;
        if (len === (0)) 
            return "";
        let buf = new Uint8Array(len);
        str.read(buf, 0, len);
        return FiasHelper.decodeString1251(buf, 0, -1, false);
    }
    
    static encodeString1251(str) {
        if (str === null) 
            return new Uint8Array(0);
        let res = new Uint8Array(str.length);
        for (let j = 0; j < str.length; j++) {
            let i = str.charCodeAt(j);
            if (i < 0x80) 
                res[j] = i;
            else {
                let b = 0;
                let wrapb124 = new RefOutArgWrapper();
                let inoutres125 = FiasHelper.m_utf_1251.tryGetValue(i, wrapb124);
                b = wrapb124.value;
                if (inoutres125) 
                    res[j] = b;
                else 
                    res[j] = '?'.charCodeAt(0);
            }
        }
        return res;
    }
    
    static decodeString1251(dat, pos = 0, len = -1, zeroTerm = false) {
        if (dat === null) 
            return null;
        if (dat.length === 0) 
            return "";
        if (len < 0) {
            len = dat.length - pos;
            if (zeroTerm && len > 300) 
                len = 300;
        }
        let tmp = new StringBuilder();
        for (let j = pos; (j < (pos + len)) && (j < dat.length); j++) {
            let i = dat[j];
            if (zeroTerm && i === 0) 
                break;
            if (i < 0x80) 
                tmp.append(String.fromCharCode(i));
            else if (FiasHelper.m_1251_utf[i] === 0) 
                tmp.append('?');
            else 
                tmp.append(String.fromCharCode(FiasHelper.m_1251_utf[i]));
        }
        return tmp.toString();
    }
    
    static static_constructor() {
        FiasHelper.m_1251_utf = null;
        FiasHelper.m_utf_1251 = null;
        FiasHelper.m_1251_utf = new Int32Array(256);
        FiasHelper.m_utf_1251 = new Hashtable();
        for (let i = 0; i < 0x80; i++) {
            FiasHelper.m_1251_utf[i] = i;
        }
        let m_1251_80_BF = new Int32Array([0x0402, 0x0403, 0x201A, 0x0453, 0x201E, 0x2026, 0x2020, 0x2021, 0x20AC, 0x2030, 0x0409, 0x2039, 0x040A, 0x040C, 0x040B, 0x040F, 0x0452, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x0000, 0x2122, 0x0459, 0x203A, 0x045A, 0x045C, 0x045B, 0x045F, 0x00A0, 0x040E, 0x045E, 0x0408, 0x00A4, 0x0490, 0x00A6, 0x00A7, 0x0401, 0x00A9, 0x0404, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x0407, 0x00B0, 0x00B1, 0x0406, 0x0456, 0x0491, 0x00B5, 0x00B6, 0x00B7, 0x0451, 0x2116, 0x0454, 0x00BB, 0x0458, 0x0405, 0x0455, 0x0457]);
        for (let i = 0; i < 0x40; i++) {
            FiasHelper.m_1251_utf[i + 0x80] = m_1251_80_BF[i];
            FiasHelper.m_utf_1251.put(m_1251_80_BF[i], (i + 0x80));
        }
        for (let i = 0; i < 0x20; i++) {
            FiasHelper.m_1251_utf[i + 0xC0] = ('А'.charCodeAt(0)) + i;
            FiasHelper.m_utf_1251.put(('А'.charCodeAt(0)) + i, (i + 0xC0));
        }
        for (let i = 0; i < 0x20; i++) {
            FiasHelper.m_1251_utf[i + 0xE0] = ('а'.charCodeAt(0)) + i;
            FiasHelper.m_utf_1251.put(('а'.charCodeAt(0)) + i, (i + 0xE0));
        }
    }
}


FiasHelper.static_constructor();

module.exports = FiasHelper