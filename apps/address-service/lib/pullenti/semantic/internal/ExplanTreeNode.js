/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Hashtable = require("./../../unisharp/Hashtable");

class ExplanTreeNode {
    
    constructor() {
        this.nodes = null;
        this.groups = null;
        this.lazyPos = 0;
    }
    
    deserialize(str, dic, lazyLoad, pos) {
        let cou = str.deserializeShort(pos);
        let li = (cou > 0 ? new Array() : null);
        for (; cou > 0; cou--) {
            let id = str.deserializeInt(pos);
            if (id > 0 && id <= dic.m_AllGroups.length) {
                let gr = dic.m_AllGroups[id - 1];
                if (gr.lazyPos > 0) {
                    let p0 = pos.value;
                    pos.value = gr.lazyPos;
                    gr.deserialize(str, pos);
                    gr.lazyPos = 0;
                    pos.value = p0;
                }
            }
            li.push(id);
        }
        if (li !== null) 
            this.groups = li;
        cou = str.deserializeShort(pos);
        if (cou === 0) 
            return;
        for (; cou > 0; cou--) {
            let ke = str.deserializeShort(pos);
            let p1 = str.deserializeInt(pos);
            let tn1 = new ExplanTreeNode();
            if (this.nodes === null) 
                this.nodes = new Hashtable();
            let sh = ke;
            if (lazyLoad) {
                tn1.lazyPos = pos.value;
                pos.value = p1;
            }
            else 
                tn1.deserialize(str, dic, false, pos);
            if (!this.nodes.containsKey(sh)) 
                this.nodes.put(sh, tn1);
        }
    }
}


module.exports = ExplanTreeNode