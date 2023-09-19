/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../unisharp/StringBuilder");

const SerializerHelper = require("./core/internal/SerializerHelper");
const MetaToken = require("./MetaToken");
const MorphCollection = require("./MorphCollection");
const TextAnnotation = require("./TextAnnotation");

/**
 * Токен, соответствующий сущности
 * Токен сущности
 */
class ReferentToken extends MetaToken {
    
    constructor(entity, begin, end, _kit = null) {
        super(begin, end, _kit);
        this.referent = null;
        this.data = null;
        this.miscAttrs = 0;
        this.referent = entity;
        if (this.morph === null) 
            this.morph = new MorphCollection();
    }
    
    toString() {
        let res = new StringBuilder((this.referent === null ? "Null" : this.referent.toString()));
        if (this.morph !== null) 
            res.append(" ").append(this.morph.toString());
        return res.toString();
    }
    
    getReferent() {
        return this.referent;
    }
    
    getReferents() {
        let res = new Array();
        if (this.referent !== null) 
            res.push(this.referent);
        let ri = super.getReferents();
        if (ri !== null) 
            res.splice(res.length, 0, ...ri);
        return res;
    }
    
    saveToLocalOntology() {
        if (this.data === null) 
            return;
        if (this.kit.level > 5) 
            return;
        this.kit.level++;
        let r = this.data.registerReferent(this.referent);
        this.kit.level--;
        this.data = null;
        if (r !== null) {
            this.referent = r;
            let anno = new TextAnnotation();
            anno.sofa = this.kit.sofa;
            anno.occurenceOf = this.referent;
            anno.beginChar = this.beginChar;
            anno.endChar = this.endChar;
            this.referent.addOccurence(anno);
        }
    }
    
    setDefaultLocalOnto(proc) {
        if (this.referent === null || this.kit === null || proc === null) 
            return;
        for (const a of proc.analyzers) {
            if (a.createReferent(this.referent.typeName) !== null) {
                this.data = this.kit.getAnalyzerData(a);
                break;
            }
        }
    }
    
    replaceReferent(oldReferent, newReferent) {
        if (this.referent === oldReferent) 
            this.referent = newReferent;
        if (this.endToken === null) 
            return;
        for (let t = this.beginToken; t !== null; t = t.next) {
            if (t.endChar > this.endChar) 
                break;
            if (t instanceof ReferentToken) 
                t.replaceReferent(oldReferent, newReferent);
            if (t === this.endToken) 
                break;
        }
    }
    
    serialize(stream) {
        super.serialize(stream);
        let id = 0;
        if (this.referent !== null && ((typeof this.referent.tag === 'number' || this.referent.tag instanceof Number))) 
            id = this.referent.tag;
        SerializerHelper.serializeInt(stream, id);
    }
    
    deserialize(stream, _kit, vers) {
        super.deserialize(stream, _kit, vers);
        let id = SerializerHelper.deserializeInt(stream);
        if (id > 0) 
            this.referent = _kit.entities[id - 1];
    }
    
    static _new1092(_arg1, _arg2, _arg3, _arg4) {
        let res = new ReferentToken(_arg1, _arg2, _arg3);
        res.morph = _arg4;
        return res;
    }
    
    static _new1094(_arg1, _arg2, _arg3, _arg4) {
        let res = new ReferentToken(_arg1, _arg2, _arg3);
        res.tag = _arg4;
        return res;
    }
    
    static _new1572(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new ReferentToken(_arg1, _arg2, _arg3);
        res.morph = _arg4;
        res.data = _arg5;
        return res;
    }
    
    static _new1573(_arg1, _arg2, _arg3, _arg4) {
        let res = new ReferentToken(_arg1, _arg2, _arg3);
        res.data = _arg4;
        return res;
    }
    
    static _new2564(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new ReferentToken(_arg1, _arg2, _arg3);
        res.morph = _arg4;
        res.miscAttrs = _arg5;
        return res;
    }
    
    static _new2676(_arg1, _arg2, _arg3, _arg4) {
        let res = new ReferentToken(_arg1, _arg2, _arg3);
        res.miscAttrs = _arg4;
        return res;
    }
    
    static _new2687(_arg1, _arg2, _arg3, _arg4, _arg5) {
        let res = new ReferentToken(_arg1, _arg2, _arg3);
        res.morph = _arg4;
        res.tag = _arg5;
        return res;
    }
}


module.exports = ReferentToken