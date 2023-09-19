/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

class AbbrTreeNode {
    
    constructor() {
        this.children = null;
        this.len = 0;
        this.corrs = null;
    }
    
    toString() {
        if (this.corrs !== null) {
            for (const kp of this.corrs.entries) {
                return (kp.key + "->" + kp.value);
            }
        }
        return "?";
    }
    
    find(str, i) {
        let tn = this;
        for (let j = i; j < str.length; j++) {
            if (tn.children === null) 
                break;
            let tn1 = null;
            let wraptn178 = new RefOutArgWrapper();
            let inoutres79 = tn.children.tryGetValue(str[j], wraptn178);
            tn1 = wraptn178.value;
            if (!inoutres79) 
                break;
            tn = tn1;
        }
        if (tn.corrs !== null) 
            return tn;
        return null;
    }
    
    add(str, i, corr, ty) {
        if (i < str.length) {
            let tn = null;
            if (this.children !== null) {
                let wraptn80 = new RefOutArgWrapper();
                let inoutres81 = this.children.tryGetValue(str[i], wraptn80);
                tn = wraptn80.value;
                if (!inoutres81) 
                    tn = null;
            }
            if (tn === null) {
                if (this.children === null) 
                    this.children = new Hashtable();
                this.children.put(str[i], (tn = AbbrTreeNode._new82(i + 1)));
            }
            tn.add(str, i + 1, corr, ty);
        }
        else {
            if (this.corrs === null) 
                this.corrs = new Hashtable();
            if (!this.corrs.containsKey(ty)) 
                this.corrs.put(ty, corr);
        }
    }
    
    static _new82(_arg1) {
        let res = new AbbrTreeNode();
        res.len = _arg1;
        return res;
    }
}


module.exports = AbbrTreeNode