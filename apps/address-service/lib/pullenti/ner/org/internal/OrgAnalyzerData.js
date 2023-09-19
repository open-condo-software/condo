/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const Termin = require("./../../core/Termin");
const AnalyzerDataWithOntology = require("./../../core/AnalyzerDataWithOntology");
const OrganizationReferent = require("./../OrganizationReferent");
const TerminCollection = require("./../../core/TerminCollection");
const IntOntologyCollection = require("./../../core/IntOntologyCollection");

class OrgAnalyzerData extends AnalyzerDataWithOntology {
    
    constructor() {
        super();
        this.locOrgs = new IntOntologyCollection();
        this.orgPureNames = new TerminCollection();
        this.aliases = new TerminCollection();
        this.largeTextRegim = false;
        this.tRegime = false;
        this.tLevel = 0;
    }
    
    registerReferent(referent) {
        if (referent instanceof OrganizationReferent) 
            referent.finalCorrection();
        let slots = referent.slots.length;
        let res = super.registerReferent(referent);
        if (!this.largeTextRegim && (res instanceof OrganizationReferent) && (res === referent)) {
            let ioi = res.createOntologyItemEx(2, true, false);
            if (ioi !== null) 
                this.locOrgs.addItem(ioi);
            let names = res._getPureNames();
            if (names !== null) {
                for (const n of names) {
                    this.orgPureNames.add(new Termin(n));
                }
            }
        }
        return res;
    }
}


module.exports = OrgAnalyzerData