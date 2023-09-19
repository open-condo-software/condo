/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../../unisharp/StringBuilder");

const MorphRuleVariant = require("./MorphRuleVariant");

class MorphRule {
    
    constructor() {
        this.id = 0;
        this.tails = new Array();
        this.morphVars = new Array();
        this.lazyPos = 0;
    }
    
    containsVar(tail) {
        return this.tails.indexOf(tail) >= 0;
    }
    
    getVars(key) {
        let i = this.tails.indexOf(key);
        if (i >= 0) 
            return this.morphVars[i];
        return null;
    }
    
    findVar(_id) {
        for (const li of this.morphVars) {
            for (const v of li) {
                if (v.id === _id) 
                    return v;
            }
        }
        return null;
    }
    
    add(tail, vars) {
        this.tails.push(tail);
        this.morphVars.push(vars);
    }
    
    toString() {
        let res = new StringBuilder();
        for (let i = 0; i < this.tails.length; i++) {
            if (res.length > 0) 
                res.append(", ");
            res.append("-").append(this.tails[i]);
        }
        return res.toString();
    }
    
    deserialize(str, pos) {
        let ii = str.deserializeShort(pos);
        this.id = ii;
        let _id = 1;
        while (!str.isEOF(pos.value)) {
            let b = str.deserializeByte(pos);
            if (b === (0xFF)) 
                break;
            pos.value--;
            let key = str.deserializeString(pos);
            if (key === null) 
                key = "";
            let li = new Array();
            while (!str.isEOF(pos.value)) {
                let mrv = new MorphRuleVariant();
                let inoutres237 = mrv.deserialize(str, pos);
                if (!inoutres237) 
                    break;
                mrv.tail = key;
                mrv.ruleId = ii;
                mrv.id = _id++;
                li.push(mrv);
            }
            this.add(key, li);
        }
    }
}


module.exports = MorphRule