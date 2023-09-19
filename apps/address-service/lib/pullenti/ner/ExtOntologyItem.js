/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ProcessorService = require("./ProcessorService");
const SerializerHelper = require("./core/internal/SerializerHelper");

/**
 * Элемент внешней онтологии
 */
class ExtOntologyItem {
    
    constructor(caption = null) {
        this.extId = null;
        this.typeName = null;
        this.referent = null;
        this.tag = null;
        this.refs = null;
        this.m_Caption = null;
        this.m_Caption = caption;
    }
    
    toString() {
        if (this.m_Caption !== null) 
            return this.m_Caption;
        else if (this.referent === null) 
            return (((this.typeName != null ? this.typeName : "?")) + ": ?");
        else {
            let res = this.referent.toString();
            if (this.referent.parentReferent !== null) {
                let str1 = this.referent.parentReferent.toString();
                if (!res.includes(str1)) 
                    res = res + "; " + str1;
            }
            return res;
        }
    }
    
    serialize(stream) {
        SerializerHelper.serializeString(stream, (this.extId === null ? null : this.extId.toString()));
        SerializerHelper.serializeString(stream, this.m_Caption);
        if (this.refs === null) 
            SerializerHelper.serializeInt(stream, 0);
        else {
            SerializerHelper.serializeInt(stream, this.refs.length);
            let id = 1;
            for (const r of this.refs) {
                r.tag = id++;
            }
            for (const r of this.refs) {
                r.occurrence.splice(0, r.occurrence.length);
                SerializerHelper.serializeString(stream, r.typeName);
                r.serialize(stream, false);
            }
        }
        this.referent.occurrence.splice(0, this.referent.occurrence.length);
        SerializerHelper.serializeString(stream, this.typeName);
        this.referent.serialize(stream, false);
    }
    
    deserialize(stream) {
        this.extId = SerializerHelper.deserializeString(stream);
        this.m_Caption = SerializerHelper.deserializeString(stream);
        let cou = SerializerHelper.deserializeInt(stream);
        if (cou > 0) {
            this.refs = new Array();
            for (; cou > 0; cou--) {
                let typ = SerializerHelper.deserializeString(stream);
                let r = ProcessorService.createReferent(typ);
                r.deserialize(stream, this.refs, null, false);
                this.refs.push(r);
            }
        }
        this.typeName = SerializerHelper.deserializeString(stream);
        this.referent = ProcessorService.createReferent(this.typeName);
        this.referent.deserialize(stream, this.refs, null, false);
    }
    
    static _new2906(_arg1, _arg2, _arg3) {
        let res = new ExtOntologyItem();
        res.extId = _arg1;
        res.referent = _arg2;
        res.typeName = _arg3;
        return res;
    }
}


module.exports = ExtOntologyItem