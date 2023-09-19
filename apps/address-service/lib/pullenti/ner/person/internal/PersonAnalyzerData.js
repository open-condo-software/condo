/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const Hashtable = require("./../../../unisharp/Hashtable");

const ReferentsEqualType = require("./../../core/ReferentsEqualType");
const Referent = require("./../../Referent");
const AnalyzerData = require("./../../core/AnalyzerData");
const AnalyzerDataWithOntology = require("./../../core/AnalyzerDataWithOntology");
const PersonPropertyReferent = require("./../PersonPropertyReferent");
const PersonReferent = require("./../PersonReferent");
const ReferentToken = require("./../../ReferentToken");
const PersonAttrToken = require("./PersonAttrToken");

class PersonAnalyzerData extends AnalyzerDataWithOntology {
    
    constructor() {
        super();
        this.nominativeCaseAlways = false;
        this.textStartsWithLastnameFirstnameMiddlename = false;
        this.needSecondStep = false;
        this.canBePersonPropBeginChars = new Hashtable();
        this.aRegime = false;
    }
    
    registerReferent(referent) {
        if (referent instanceof PersonReferent) {
            let existProps = null;
            for (let i = 0; i < referent.slots.length; i++) {
                let a = referent.slots[i];
                if (a.typeName === PersonReferent.ATTR_ATTR) {
                    let pat = Utils.as(a.value, PersonAttrToken);
                    if (pat === null || pat.propRef === null) {
                        if (a.value instanceof PersonPropertyReferent) {
                            if (existProps === null) 
                                existProps = new Array();
                            existProps.push(Utils.as(a.value, PersonPropertyReferent));
                        }
                        continue;
                    }
                    if (pat.propRef !== null) {
                        for (const ss of pat.propRef.slots) {
                            if (ss.typeName === PersonPropertyReferent.ATTR_REF) {
                                if (ss.value instanceof ReferentToken) {
                                    if (ss.value.referent === referent) {
                                        Utils.removeItem(pat.propRef.slots, ss);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (existProps !== null) {
                        for (const pp of existProps) {
                            if (pp.canBeEquals(pat.propRef, ReferentsEqualType.WITHINONETEXT)) {
                                if (pat.propRef.canBeGeneralFor(pp)) {
                                    pat.propRef.mergeSlots(pp, true);
                                    break;
                                }
                            }
                        }
                    }
                    pat.data = this;
                    pat.saveToLocalOntology();
                    if (pat.propRef !== null) {
                        if (referent.findSlot(a.typeName, pat.propRef, true) !== null) {
                            if (i >= 0 && (i < referent.slots.length)) {
                                referent.slots.splice(i, 1);
                                i--;
                            }
                        }
                        else 
                            referent.uploadSlot(a, pat.referent);
                    }
                }
            }
        }
        if (referent instanceof PersonPropertyReferent) {
            for (let i = 0; i < referent.slots.length; i++) {
                let a = referent.slots[i];
                if (a.typeName === PersonPropertyReferent.ATTR_REF || a.typeName === PersonPropertyReferent.ATTR_HIGHER) {
                    let pat = Utils.as(a.value, ReferentToken);
                    if (pat !== null) {
                        pat.data = this;
                        pat.saveToLocalOntology();
                        if (pat.referent !== null) 
                            referent.uploadSlot(a, pat.referent);
                    }
                    else if (a.value instanceof PersonPropertyReferent) {
                        if (a.value === referent) {
                            referent.slots.splice(i, 1);
                            i--;
                            continue;
                        }
                        referent.uploadSlot(a, this.registerReferent(Utils.as(a.value, PersonPropertyReferent)));
                    }
                }
            }
        }
        let res = super.registerReferent(referent);
        return res;
    }
}


module.exports = PersonAnalyzerData