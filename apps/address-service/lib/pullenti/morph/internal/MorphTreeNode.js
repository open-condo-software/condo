/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

const MorphRuleVariantRef = require("./MorphRuleVariantRef");

class MorphTreeNode {
    
    constructor() {
        this.nodes = null;
        this.ruleIds = null;
        this.reverceVariants = null;
        this.lazyPos = 0;
    }
    
    calcTotalNodes() {
        let res = 0;
        if (this.nodes !== null) {
            for (const v of this.nodes.entries) {
                res += (v.value.calcTotalNodes() + 1);
            }
        }
        return res;
    }
    
    toString() {
        let cou = (this.ruleIds === null ? 0 : this.ruleIds.length);
        return ("?" + " (" + this.calcTotalNodes() + ", " + cou + ")");
    }
    
    _deserializeBase(str, pos) {
        let cou = str.deserializeShort(pos);
        if (cou > 0) {
            this.ruleIds = new Array();
            for (; cou > 0; cou--) {
                let id = str.deserializeShort(pos);
                if (id === 0) {
                }
                this.ruleIds.push(id);
            }
        }
        cou = str.deserializeShort(pos);
        if (cou > 0) {
            this.reverceVariants = new Array();
            for (; cou > 0; cou--) {
                let rid = str.deserializeShort(pos);
                if (rid === 0) {
                }
                let id = str.deserializeShort(pos);
                let co = str.deserializeShort(pos);
                this.reverceVariants.push(new MorphRuleVariantRef(rid, id, co));
            }
        }
    }
    
    deserialize(str, pos) {
        let res = 0;
        this._deserializeBase(str, pos);
        let cou = str.deserializeShort(pos);
        if (cou > 0) {
            this.nodes = new Hashtable();
            for (; cou > 0; cou--) {
                let i = str.deserializeShort(pos);
                let pp = str.deserializeInt(pos);
                let child = new MorphTreeNode();
                let res1 = child.deserialize(str, pos);
                res += (1 + res1);
                this.nodes.put(i, child);
            }
        }
        return res;
    }
    
    deserializeLazy(str, me, pos) {
        this._deserializeBase(str, pos);
        let cou = str.deserializeShort(pos);
        if (cou > 0) {
            this.nodes = new Hashtable();
            for (; cou > 0; cou--) {
                let i = str.deserializeShort(pos);
                let pp = str.deserializeInt(pos);
                let child = new MorphTreeNode();
                child.lazyPos = pos.value;
                this.nodes.put(i, child);
                pos.value = pp;
            }
        }
        let p = pos.value;
        if (this.ruleIds !== null) {
            for (const rid of this.ruleIds) {
                let r = me.getMutRule(rid);
                if (r.lazyPos > 0) {
                    pos.value = r.lazyPos;
                    r.deserialize(str, pos);
                    r.lazyPos = 0;
                }
            }
            pos.value = p;
        }
        if (this.reverceVariants !== null) {
            for (const rv of this.reverceVariants) {
                let r = me.getMutRule(rv.ruleId);
                if (r.lazyPos > 0) {
                    pos.value = r.lazyPos;
                    r.deserialize(str, pos);
                    r.lazyPos = 0;
                }
            }
            pos.value = p;
        }
    }
}


module.exports = MorphTreeNode