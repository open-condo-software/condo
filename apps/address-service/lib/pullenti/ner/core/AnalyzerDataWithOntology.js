/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const AnalyzerData = require("./AnalyzerData");
const IntOntologyCollection = require("./IntOntologyCollection");

// Данные, полученные в ходе обработки, причём с поддержкой механизма онтологий
class AnalyzerDataWithOntology extends AnalyzerData {
    
    constructor() {
        super();
        this.localOntology = new IntOntologyCollection();
    }
    
    registerReferent(referent) {
        let res = null;
        let li = this.localOntology.tryAttachByReferent(referent, null, true);
        if (li !== null) {
            for (let i = li.length - 1; i >= 0; i--) {
                if (li[i].canBeGeneralFor(referent) || referent.canBeGeneralFor(li[i])) 
                    li.splice(i, 1);
            }
        }
        if (li !== null && li.length > 0) {
            res = li[0];
            if (res !== referent) 
                res.mergeSlots(referent, true);
            if (li.length > 1 && this.kit !== null) {
                for (let i = 1; i < li.length; i++) {
                    li[0].mergeSlots(li[i], true);
                    for (const ta of li[i].occurrence) {
                        li[0].addOccurence(ta);
                    }
                    this.kit.replaceReferent(li[i], li[0]);
                    this.localOntology.remove(li[i]);
                }
            }
            if (res.m_ExtReferents !== null) 
                res = super.registerReferent(res);
            this.localOntology.addReferent(res);
            return res;
        }
        res = super.registerReferent(referent);
        if (res === null) 
            return null;
        this.localOntology.addReferent(res);
        return res;
    }
    
    removeReferent(r) {
        this.localOntology.remove(r);
        super.removeReferent(r);
    }
}


module.exports = AnalyzerDataWithOntology