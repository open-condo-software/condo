/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const ControlModelQuestion = require("./ControlModelQuestion");
const SemanticRole = require("./../core/SemanticRole");
const ControlModelItemType = require("./ControlModelItemType");
const ControlModelItem = require("./ControlModelItem");

/**
 * Модель управления
 */
class ControlModel {
    
    constructor() {
        this.items = new Array();
        this.pacients = new Array();
    }
    
    toString() {
        let res = new StringBuilder();
        for (const it of this.items) {
            if (it.ignorable) 
                continue;
            if (res.length > 0) 
                res.append("; ");
            if (it.typ === ControlModelItemType.WORD) 
                res.append(it.word).append(" = ").append(it.links.length);
            else 
                res.append(it.typ.toString()).append(" = ").append(it.links.length);
        }
        for (const p of this.pacients) {
            res.append(" (").append(p).append(")");
        }
        return res.toString();
    }
    
    findItemByTyp(typ) {
        for (const it of this.items) {
            if (it.typ === typ) 
                return it;
        }
        return null;
    }
    
    deserialize(str, pos) {
        let cou = str.deserializeShort(pos);
        for (; cou > 0; cou--) {
            let it = new ControlModelItem();
            let b = str.deserializeByte(pos);
            if ((((b) & 0x80)) !== 0) 
                it.nominativeCanBeAgentAndPacient = true;
            it.typ = ControlModelItemType.of(((b) & 0x7F));
            if (it.typ === ControlModelItemType.WORD) 
                it.word = str.deserializeString(pos);
            let licou = str.deserializeShort(pos);
            for (; licou > 0; licou--) {
                let bi = str.deserializeByte(pos);
                let i = bi;
                b = str.deserializeByte(pos);
                if (i >= 0 && (i < ControlModelQuestion.ITEMS.length)) 
                    it.links.put(ControlModelQuestion.ITEMS[i], SemanticRole.of(b));
            }
            this.items.push(it);
        }
        cou = str.deserializeShort(pos);
        for (; cou > 0; cou--) {
            let p = str.deserializeString(pos);
            if (p !== null) 
                this.pacients.push(p);
        }
    }
}


module.exports = ControlModel