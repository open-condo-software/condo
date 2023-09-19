/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");
const StringBuilder = require("./../../../unisharp/StringBuilder");

const Referent = require("./../../Referent");
const AnalyzerDataWithOntology = require("./../../core/AnalyzerDataWithOntology");
const LanguageHelper = require("./../../../morph/LanguageHelper");
const MorphGender = require("./../../../morph/MorphGender");
const GeoReferent = require("./../GeoReferent");

class GeoAnalyzerData extends AnalyzerDataWithOntology {
    
    constructor() {
        super();
        this.allRegime = false;
        this.tRegime = false;
        this.cRegime = false;
        this.oRegime = false;
        this.oTRegime = false;
        this.sRegime = false;
        this.aRegime = false;
        this.checkRegime = false;
        this.tLevel = 0;
        this.cLevel = 0;
        this.oLevel = 0;
        this.sLevel = 0;
        this.aLevel = 0;
        this.geoBefore = 0;
        this.step = 0;
    }
    
    toString() {
        let tmp = new StringBuilder();
        if (this.allRegime) 
            tmp.append("AllRegime ");
        if (this.tRegime) 
            tmp.append("TRegime ");
        if (this.cRegime) 
            tmp.append("CRegime ");
        if (this.oRegime) 
            tmp.append("ORegime ");
        if (this.oTRegime) 
            tmp.append("OTRegime ");
        if (this.sRegime) 
            tmp.append("SRegime ");
        if (this.aRegime) 
            tmp.append("ARegime ");
        if (this.checkRegime) 
            tmp.append("CheckRegime ");
        if (this.tLevel > 0) 
            tmp.append("TLev=").append(this.tLevel).append(" ");
        if (this.cLevel > 0) 
            tmp.append("CLev=").append(this.cLevel).append(" ");
        if (this.oLevel > 0) 
            tmp.append("OLev=").append(this.oLevel).append(" ");
        if (this.sLevel > 0) 
            tmp.append("SLev=").append(this.sLevel).append(" ");
        if (this.aLevel > 0) 
            tmp.append("ALev=").append(this.aLevel).append(" ");
        tmp.append(this.referents.length).append(" referents");
        return tmp.toString();
    }
    
    registerReferent(referent) {
        let g = Utils.as(referent, GeoReferent);
        if (g !== null) {
            if (g.isState) {
            }
            else if (g.isRegion || ((g.isCity && !g.isBigCity))) {
                let names = new Array();
                let gen = MorphGender.UNDEFINED;
                let basNam = null;
                for (const s of g.slots) {
                    if (s.typeName === GeoReferent.ATTR_NAME) 
                        names.push(Utils.asString(s.value));
                    else if (s.typeName === GeoReferent.ATTR_TYPE) {
                        let typ = Utils.asString(s.value);
                        if (LanguageHelper.endsWithEx(typ, "район", "край", "округ", "улус")) 
                            gen = MorphGender.of((gen.value()) | (MorphGender.MASCULINE.value()));
                        else if (LanguageHelper.endsWithEx(typ, "область", "территория", null, null)) 
                            gen = MorphGender.of((gen.value()) | (MorphGender.FEMINIE.value()));
                    }
                }
                for (let i = 0; i < names.length; i++) {
                    let n = names[i];
                    let ii = n.indexOf(' ');
                    if (ii > 0) {
                        if (g.getSlotValue(GeoReferent.ATTR_REF) instanceof Referent) 
                            continue;
                        let nn = (n.substring(ii + 1) + " " + n.substring(0, 0 + ii));
                        if (!names.includes(nn)) {
                            names.push(nn);
                            g.addSlot(GeoReferent.ATTR_NAME, nn, false, 0);
                            continue;
                        }
                        continue;
                    }
                    for (const end of GeoAnalyzerData.ends) {
                        if (LanguageHelper.endsWith(n, end)) {
                            let nn = n.substring(0, 0 + n.length - 3);
                            for (const end2 of GeoAnalyzerData.ends) {
                                if (end2 !== end) {
                                    if (!names.includes(nn + end2)) {
                                        names.push(nn + end2);
                                        g.addSlot(GeoReferent.ATTR_NAME, nn + end2, false, 0);
                                    }
                                }
                            }
                            if (gen === MorphGender.MASCULINE) {
                                for (const na of names) {
                                    if (LanguageHelper.endsWith(na, "ИЙ")) 
                                        basNam = na;
                                }
                            }
                            else if (gen === MorphGender.FEMINIE) {
                                for (const na of names) {
                                    if (LanguageHelper.endsWith(na, "АЯ")) 
                                        basNam = na;
                                }
                            }
                            else if (gen === MorphGender.NEUTER) {
                                for (const na of names) {
                                    if (LanguageHelper.endsWith(na, "ОЕ")) 
                                        basNam = na;
                                }
                            }
                            break;
                        }
                    }
                }
                if (basNam !== null && names.length > 0 && names[0] !== basNam) {
                    let sl = g.findSlot(GeoReferent.ATTR_NAME, basNam, true);
                    if (sl !== null) {
                        Utils.removeItem(g.slots, sl);
                        g.slots.splice(0, 0, sl);
                    }
                }
            }
        }
        return super.registerReferent(referent);
    }
    
    static static_constructor() {
        GeoAnalyzerData.ends = ["КИЙ", "КОЕ", "КАЯ"];
    }
}


GeoAnalyzerData.static_constructor();

module.exports = GeoAnalyzerData