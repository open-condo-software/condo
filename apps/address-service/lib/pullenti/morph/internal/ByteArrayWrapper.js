/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Stream = require("./../../unisharp/Stream");

// Сделан специально для Питона - а то стандартым способом через Memory Stream
// жутко тормозит, придётся делать самим
class ByteArrayWrapper {
    
    constructor(arr) {
        this.m_Array = null;
        this.m_Len = 0;
        this.m_Array = arr;
        this.m_Len = this.m_Array.length;
    }
    
    isEOF(pos) {
        return pos >= this.m_Len;
    }
    
    deserializeByte(pos) {
        if (pos.value >= this.m_Len) 
            return 0;
        return this.m_Array[pos.value++];
    }
    
    deserializeShort(pos) {
        if ((pos.value + 1) >= this.m_Len) 
            return 0;
        let b0 = this.m_Array[pos.value++];
        let b1 = this.m_Array[pos.value++];
        let res = b1;
        res <<= 8;
        return (res | (b0));
    }
    
    deserializeInt(pos) {
        if ((pos.value + 1) >= this.m_Len) 
            return 0;
        let b0 = this.m_Array[pos.value++];
        let b1 = this.m_Array[pos.value++];
        let b2 = this.m_Array[pos.value++];
        let b3 = this.m_Array[pos.value++];
        let res = b3;
        res <<= 8;
        res |= (b2);
        res <<= 8;
        res |= (b1);
        res <<= 8;
        return (res | (b0));
    }
    
    deserializeString(pos) {
        if (pos.value >= this.m_Len) 
            return null;
        let len = this.m_Array[pos.value++];
        if (len === (0xFF)) 
            return null;
        if (len === (0)) 
            return "";
        if ((pos.value + (len)) > this.m_Len) 
            return null;
        let res = Utils.decodeString("UTF-8", this.m_Array, pos.value, len);
        pos.value += (len);
        return res;
    }
    
    deserializeStringEx(pos) {
        if (pos.value >= this.m_Len) 
            return null;
        let len = this.deserializeShort(pos);
        if (len === 0xFFFF || (len < 0)) 
            return null;
        if (len === 0) 
            return "";
        if ((pos.value + len) > this.m_Len) 
            return null;
        let res = Utils.decodeString("UTF-8", this.m_Array, pos.value, len);
        pos.value += len;
        return res;
    }
}


module.exports = ByteArrayWrapper