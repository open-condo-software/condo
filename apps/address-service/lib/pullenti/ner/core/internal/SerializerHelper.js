/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const NumberSpellingType = require("./../../NumberSpellingType");
const Token = require("./../../Token");
const TextToken = require("./../../TextToken");

class SerializerHelper {
    
    static serializeInt(stream, val) {
        stream.write(Utils.objectToBytes(val, 'int'), 0, 4);
    }
    
    static deserializeInt(stream) {
        let buf = new Uint8Array(4);
        stream.read(buf, 0, 4);
        return Utils.bytesToObject(buf, 0, 'int', 4);
    }
    
    static serializeShort(stream, val) {
        stream.write(Utils.objectToBytes(val, 'short'), 0, 2);
    }
    
    static deserializeShort(stream) {
        let buf = new Uint8Array(2);
        stream.read(buf, 0, 2);
        return Utils.bytesToObject(buf, 0, 'short', 2);
    }
    
    static serializeString(stream, val) {
        if (val === null) {
            SerializerHelper.serializeInt(stream, -1);
            return;
        }
        if (Utils.isNullOrEmpty(val)) {
            SerializerHelper.serializeInt(stream, 0);
            return;
        }
        let data = Utils.encodeString("UTF-8", val);
        SerializerHelper.serializeInt(stream, data.length);
        stream.write(data, 0, data.length);
    }
    
    static deserializeString(stream) {
        let len = SerializerHelper.deserializeInt(stream);
        if ((len < 0) || len > 0x7FFFFFFF) 
            return null;
        if (len === 0) 
            return "";
        let data = new Uint8Array(len);
        stream.read(data, 0, data.length);
        return Utils.decodeString("UTF-8", data, 0, -1);
    }
    
    static serializeTokens(stream, t, maxChar) {
        let cou = 0;
        for (let tt = t; tt !== null; tt = tt.next) {
            if (maxChar > 0 && tt.endChar > maxChar) 
                break;
            cou++;
        }
        SerializerHelper.serializeInt(stream, cou);
        for (; cou > 0; cou--,t = t.next) {
            SerializerHelper.serializeToken(stream, t);
        }
    }
    
    static deserializeTokens(stream, kit, vers) {
        const MetaToken = require("./../../MetaToken");
        let cou = SerializerHelper.deserializeInt(stream);
        if (cou === 0) 
            return null;
        let res = null;
        let prev = null;
        for (; cou > 0; cou--) {
            let t = SerializerHelper.deserializeToken(stream, kit, vers);
            if (t === null) 
                continue;
            if (res === null) 
                res = t;
            if (prev !== null) 
                t.previous = prev;
            prev = t;
        }
        for (let t = res; t !== null; t = t.next) {
            if (t instanceof MetaToken) 
                SerializerHelper._corrPrevNext(Utils.as(t, MetaToken), t.previous, t.next);
        }
        return res;
    }
    
    static _corrPrevNext(mt, prev, next) {
        const MetaToken = require("./../../MetaToken");
        mt.beginToken.m_Previous = prev;
        mt.endToken.m_Next = next;
        for (let t = mt.beginToken; t !== null && t.endChar <= mt.endChar; t = t.next) {
            if (t instanceof MetaToken) 
                SerializerHelper._corrPrevNext(Utils.as(t, MetaToken), t.previous, t.next);
        }
    }
    
    static serializeToken(stream, t) {
        const MetaToken = require("./../../MetaToken");
        const NumberToken = require("./../../NumberToken");
        const ReferentToken = require("./../../ReferentToken");
        let typ = 0;
        if (t instanceof TextToken) 
            typ = 1;
        else if (t instanceof NumberToken) 
            typ = 2;
        else if (t instanceof ReferentToken) 
            typ = 3;
        else if (t instanceof MetaToken) 
            typ = 4;
        SerializerHelper.serializeShort(stream, typ);
        if (typ === (0)) 
            return;
        t.serialize(stream);
        if (t instanceof MetaToken) 
            SerializerHelper.serializeTokens(stream, t.beginToken, t.endChar);
    }
    
    static deserializeToken(stream, kit, vers) {
        const MetaToken = require("./../../MetaToken");
        const NumberToken = require("./../../NumberToken");
        const ReferentToken = require("./../../ReferentToken");
        let typ = SerializerHelper.deserializeShort(stream);
        if (typ === (0)) 
            return null;
        let t = null;
        if (typ === (1)) 
            t = new TextToken(null, kit);
        else if (typ === (2)) 
            t = new NumberToken(null, null, null, NumberSpellingType.DIGIT, kit);
        else if (typ === (3)) 
            t = new ReferentToken(null, null, null, kit);
        else 
            t = new MetaToken(null, null, kit);
        t.deserialize(stream, kit, vers);
        if (t instanceof MetaToken) {
            let tt = SerializerHelper.deserializeTokens(stream, kit, vers);
            if (tt !== null) {
                t.m_BeginToken = tt;
                for (; tt !== null; tt = tt.next) {
                    t.m_EndToken = tt;
                }
            }
        }
        return t;
    }
}


module.exports = SerializerHelper