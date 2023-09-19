/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../../unisharp/RefOutArgWrapper");

const ReferentToken = require("./../../ReferentToken");
const Referent = require("./../../Referent");

class GeneralRelationHelper {
    
    static refreshGenerals(proc, kit) {
        let all = new Hashtable();
        let allRefs = new Array();
        for (const a of proc.analyzers) {
            let ad = kit.getAnalyzerData(a);
            if (ad === null) 
                continue;
            for (const r of ad.referents) {
                let nod = GeneralRelationHelper.Node._new697(r, ad);
                allRefs.push(nod);
                r.tag = nod;
                let si = null;
                let wrapsi700 = new RefOutArgWrapper();
                let inoutres701 = all.tryGetValue(a.name, wrapsi700);
                si = wrapsi700.value;
                if (!inoutres701) 
                    all.put(a.name, (si = new Hashtable()));
                let strs = r.getCompareStrings();
                if (strs === null || strs.length === 0) 
                    continue;
                for (const s of strs) {
                    if (s === null) 
                        continue;
                    let li = [ ];
                    let wrapli698 = new RefOutArgWrapper();
                    let inoutres699 = si.tryGetValue(s, wrapli698);
                    li = wrapli698.value;
                    if (!inoutres699) 
                        si.put(s, (li = new Array()));
                    li.push(r);
                }
            }
        }
        for (const r of allRefs) {
            for (const s of r.ref.slots) {
                if (s.value instanceof Referent) {
                    let to = Utils.as(s.value, Referent);
                    let tn = Utils.as(to.tag, GeneralRelationHelper.Node);
                    if (tn === null) 
                        continue;
                    if (tn.refsFrom === null) 
                        tn.refsFrom = new Array();
                    tn.refsFrom.push(r);
                    if (r.refsTo === null) 
                        r.refsTo = new Array();
                    r.refsTo.push(tn);
                }
            }
        }
        for (const ty of all.values) {
            for (const li of ty.values) {
                if (li.length < 2) 
                    continue;
                if (li.length > 3000) 
                    continue;
                for (let i = 0; i < li.length; i++) {
                    for (let j = i + 1; j < li.length; j++) {
                        let n1 = null;
                        let n2 = null;
                        if (li[i].canBeGeneralFor(li[j]) && !li[j].canBeGeneralFor(li[i])) {
                            n1 = Utils.as(li[i].tag, GeneralRelationHelper.Node);
                            n2 = Utils.as(li[j].tag, GeneralRelationHelper.Node);
                        }
                        else if (li[j].canBeGeneralFor(li[i]) && !li[i].canBeGeneralFor(li[j])) {
                            n1 = Utils.as(li[j].tag, GeneralRelationHelper.Node);
                            n2 = Utils.as(li[i].tag, GeneralRelationHelper.Node);
                        }
                        if (n1 !== null && n2 !== null) {
                            if (n1.genFrom === null) 
                                n1.genFrom = new Array();
                            if (!n1.genFrom.includes(n2)) 
                                n1.genFrom.push(n2);
                            if (n2.genTo === null) 
                                n2.genTo = new Array();
                            if (!n2.genTo.includes(n1)) 
                                n2.genTo.push(n1);
                        }
                    }
                }
            }
        }
        for (const n of allRefs) {
            if (n.genTo !== null && n.genTo.length > 1) {
                for (let i = n.genTo.length - 1; i >= 0; i--) {
                    let p = n.genTo[i];
                    let del = false;
                    for (let j = 0; j < n.genTo.length; j++) {
                        if (j !== i && n.genTo[j].isInGenParentsOrHigher(p)) 
                            del = true;
                    }
                    if (del) {
                        Utils.removeItem(p.genFrom, n);
                        n.genTo.splice(i, 1);
                    }
                }
            }
        }
        for (const n of allRefs) {
            if (!n.deleted && n.genTo !== null && n.genTo.length === 1) {
                let p = n.genTo[0];
                if (p.genFrom.length === 1) {
                    n.ref.mergeSlots(p.ref, true);
                    p.ref.tag = n.ref;
                    if (n.ref.generalReferent === p.ref) 
                        n.ref.generalReferent = null;
                    p.replaceValues(n);
                    for (const o of p.ref.occurrence) {
                        n.ref.addOccurence(o);
                    }
                    p.deleted = true;
                }
                else 
                    n.ref.generalReferent = p.ref;
            }
        }
        for (let t = kit.firstToken; t !== null; t = t.next) {
            GeneralRelationHelper._correctReferents(t);
        }
        for (const n of allRefs) {
            if (n.deleted) 
                n.ad.removeReferent(n.ref);
            n.ref.tag = null;
        }
    }
    
    static _correctReferents(t) {
        let rt = Utils.as(t, ReferentToken);
        if (rt === null) 
            return;
        if (rt.referent !== null && (rt.referent.tag instanceof Referent)) 
            rt.referent = Utils.as(rt.referent.tag, Referent);
        for (let tt = rt.beginToken; tt !== null && tt.endChar <= rt.endChar; tt = tt.next) {
            GeneralRelationHelper._correctReferents(tt);
        }
    }
}


GeneralRelationHelper.Node = class  {
    
    constructor() {
        this.ref = null;
        this.ad = null;
        this.refsTo = null;
        this.refsFrom = null;
        this.genTo = null;
        this.genFrom = null;
        this.deleted = false;
    }
    
    toString() {
        return this.ref.toString();
    }
    
    isInGenParentsOrHigher(n) {
        if (this.genTo === null) 
            return false;
        for (const p of this.genTo) {
            if (p === n) 
                return true;
            else if (p.isInGenParentsOrHigher(n)) 
                return true;
        }
        return false;
    }
    
    replaceValues(newNode) {
        if (this.refsFrom !== null) {
            for (const fr of this.refsFrom) {
                let ch = false;
                for (const s of fr.ref.slots) {
                    if (s.value === this.ref) {
                        fr.ref.uploadSlot(s, newNode.ref);
                        ch = true;
                    }
                }
                if (!ch) 
                    continue;
                for (let i = 0; i < (fr.ref.slots.length - 1); i++) {
                    for (let j = i + 1; j < fr.ref.slots.length; j++) {
                        if (fr.ref.slots[i].typeName === fr.ref.slots[j].typeName && fr.ref.slots[i].value === fr.ref.slots[j].value) {
                            fr.ref.slots.splice(j, 1);
                            j--;
                        }
                    }
                }
            }
        }
    }
    
    static _new697(_arg1, _arg2) {
        let res = new GeneralRelationHelper.Node();
        res.ref = _arg1;
        res.ad = _arg2;
        return res;
    }
}


module.exports = GeneralRelationHelper