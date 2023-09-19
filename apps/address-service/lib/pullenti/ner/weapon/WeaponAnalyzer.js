/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const Token = require("./../Token");
const TerminParseAttr = require("./../core/TerminParseAttr");
const MetaToken = require("./../MetaToken");
const BracketParseAttr = require("./../core/BracketParseAttr");
const BracketHelper = require("./../core/BracketHelper");
const ProcessorService = require("./../ProcessorService");
const WeaponItemTokenTyps = require("./internal/WeaponItemTokenTyps");
const Referent = require("./../Referent");
const ReferentToken = require("./../ReferentToken");
const TextToken = require("./../TextToken");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const WeaponReferent = require("./WeaponReferent");
const Termin = require("./../core/Termin");
const MetaWeapon = require("./internal/MetaWeapon");
const MeasureAnalyzer = require("./../measure/MeasureAnalyzer");
const TerminCollection = require("./../core/TerminCollection");
const WeaponItemToken = require("./internal/WeaponItemToken");
const GeoReferent = require("./../geo/GeoReferent");
const Analyzer = require("./../Analyzer");

/**
 * Анализатор оружия
 */
class WeaponAnalyzer extends Analyzer {
    
    get name() {
        return WeaponAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Оружие";
    }
    
    get description() {
        return "Оружие (пистолеты, пулемёты)";
    }
    
    clone() {
        return new WeaponAnalyzer();
    }
    
    get typeSystem() {
        return [MetaWeapon.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaWeapon.IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("weapon.jpg"));
        return res;
    }
    
    createReferent(type) {
        if (type === WeaponReferent.OBJ_TYPENAME) 
            return new WeaponReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return [GeoReferent.OBJ_TYPENAME, "ORGANIZATION"];
    }
    
    get progressWeight() {
        return 5;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        let models = new TerminCollection();
        let objsByModel = new Hashtable();
        let objByNames = new TerminCollection();
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let its = WeaponItemToken.tryParseList(t, 10);
            if (its === null) 
                continue;
            let rts = this.tryAttach(its, false);
            if (rts !== null) {
                for (const rt of rts) {
                    rt.referent = ad.registerReferent(rt.referent);
                    kit.embedToken(rt);
                    t = rt;
                    for (const s of rt.referent.slots) {
                        if (s.typeName === WeaponReferent.ATTR_MODEL) {
                            let mod = s.value.toString();
                            for (let k = 0; k < 2; k++) {
                                if (!Utils.isDigit(mod[0])) {
                                    let li = [ ];
                                    let wrapli2903 = new RefOutArgWrapper();
                                    let inoutres2904 = objsByModel.tryGetValue(mod, wrapli2903);
                                    li = wrapli2903.value;
                                    if (!inoutres2904) 
                                        objsByModel.put(mod, (li = new Array()));
                                    if (!li.includes(rt.referent)) 
                                        li.push(rt.referent);
                                    models.addString(mod, li, null, false);
                                }
                                if (k > 0) 
                                    break;
                                let brand = rt.referent.getStringValue(WeaponReferent.ATTR_BRAND);
                                if (brand === null) 
                                    break;
                                mod = (brand + " " + mod);
                            }
                        }
                        else if (s.typeName === WeaponReferent.ATTR_NAME) 
                            objByNames.add(Termin._new170(s.value.toString(), rt.referent));
                    }
                }
            }
        }
        if (objsByModel.length === 0 && objByNames.termins.length === 0) 
            return;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 10);
            if (br !== null) {
                let toks = objByNames.tryParse(t.next, TerminParseAttr.NO);
                if (toks !== null && toks.endToken.next === br.endToken) {
                    let rt0 = new ReferentToken(Utils.as(toks.termin.tag, Referent), br.beginToken, br.endToken);
                    kit.embedToken(rt0);
                    t = rt0;
                    continue;
                }
            }
            if (!(t instanceof TextToken)) 
                continue;
            if (!t.chars.isLetter) 
                continue;
            let tok = models.tryParse(t, TerminParseAttr.NO);
            if (tok === null) {
                if (!t.chars.isAllLower) 
                    tok = objByNames.tryParse(t, TerminParseAttr.NO);
                if (tok === null) 
                    continue;
            }
            if (!tok.isWhitespaceAfter) {
                if (tok.endToken.next === null || !tok.endToken.next.isCharOf(",.)")) {
                    if (!BracketHelper.isBracket(tok.endToken.next, false)) 
                        continue;
                }
            }
            let tr = null;
            let li = Utils.as(tok.termin.tag, Array);
            if (li !== null && li.length === 1) 
                tr = li[0];
            else 
                tr = Utils.as(tok.termin.tag, Referent);
            if (tr !== null) {
                let tit = WeaponItemToken.tryParse(tok.beginToken.previous, null, false, true);
                if (tit !== null && tit.typ === WeaponItemTokenTyps.BRAND) {
                    tr.addSlot(WeaponReferent.ATTR_BRAND, tit.value, false, 0);
                    tok.beginToken = tit.beginToken;
                }
                let rt0 = new ReferentToken(tr, tok.beginToken, tok.endToken);
                kit.embedToken(rt0);
                t = rt0;
                continue;
            }
        }
    }
    
    processReferent(begin, param) {
        let its = WeaponItemToken.tryParseList(begin, 10);
        if (its === null) 
            return null;
        let rr = this.tryAttach(its, true);
        if (rr !== null && rr.length > 0) 
            return rr[0];
        return null;
    }
    
    tryAttach(its, attach) {
        let tr = new WeaponReferent();
        let i = 0;
        let t1 = null;
        let noun = null;
        let brand = null;
        let model = null;
        for (i = 0; i < its.length; i++) {
            if (its[i].typ === WeaponItemTokenTyps.NOUN) {
                if (its.length === 1) 
                    return null;
                if (tr.findSlot(WeaponReferent.ATTR_TYPE, null, true) !== null) {
                    if (tr.findSlot(WeaponReferent.ATTR_TYPE, its[i].value, true) === null) 
                        break;
                }
                if (!its[i].isInternal) 
                    noun = its[i];
                tr.addSlot(WeaponReferent.ATTR_TYPE, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(WeaponReferent.ATTR_TYPE, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === WeaponItemTokenTyps.BRAND) {
                if (tr.findSlot(WeaponReferent.ATTR_BRAND, null, true) !== null) {
                    if (tr.findSlot(WeaponReferent.ATTR_BRAND, its[i].value, true) === null) 
                        break;
                }
                if (!its[i].isInternal) {
                    if (noun !== null && noun.isDoubt) 
                        noun.isDoubt = false;
                }
                brand = its[i];
                tr.addSlot(WeaponReferent.ATTR_BRAND, its[i].value, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === WeaponItemTokenTyps.MODEL) {
                if (tr.findSlot(WeaponReferent.ATTR_MODEL, null, true) !== null) {
                    if (tr.findSlot(WeaponReferent.ATTR_MODEL, its[i].value, true) === null) 
                        break;
                }
                model = its[i];
                tr.addSlot(WeaponReferent.ATTR_MODEL, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(WeaponReferent.ATTR_MODEL, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === WeaponItemTokenTyps.NAME) {
                if (tr.findSlot(WeaponReferent.ATTR_NAME, null, true) !== null) 
                    break;
                tr.addSlot(WeaponReferent.ATTR_NAME, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(WeaponReferent.ATTR_NAME, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === WeaponItemTokenTyps.NUMBER) {
                if (tr.findSlot(WeaponReferent.ATTR_NUMBER, null, true) !== null) 
                    break;
                tr.addSlot(WeaponReferent.ATTR_NUMBER, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(WeaponReferent.ATTR_NUMBER, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === WeaponItemTokenTyps.CALIBER) {
                if (tr.findSlot(WeaponReferent.ATTR_CALIBER, null, true) !== null) 
                    break;
                tr.addSlot(WeaponReferent.ATTR_CALIBER, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(WeaponReferent.ATTR_CALIBER, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === WeaponItemTokenTyps.DEVELOPER) {
                tr.addSlot(WeaponReferent.ATTR_REF, its[i].ref, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === WeaponItemTokenTyps.DATE) {
                if (tr.findSlot(WeaponReferent.ATTR_DATE, null, true) !== null) 
                    break;
                tr.addSlot(WeaponReferent.ATTR_DATE, its[i].ref, true, 0);
                t1 = its[i].endToken;
                continue;
            }
        }
        let hasGoodNoun = (noun === null ? false : !noun.isDoubt);
        let prev = null;
        if (noun === null) {
            for (let tt = its[0].beginToken.previous; tt !== null; tt = tt.previous) {
                if ((((prev = Utils.as(tt.getReferent(), WeaponReferent)))) !== null) {
                    let addSlots = new Array();
                    for (const s of prev.slots) {
                        if (s.typeName === WeaponReferent.ATTR_TYPE) 
                            tr.addSlot(s.typeName, s.value, false, 0);
                        else if (s.typeName === WeaponReferent.ATTR_BRAND || s.typeName === WeaponReferent.ATTR_BRAND || s.typeName === WeaponReferent.ATTR_MODEL) {
                            if (tr.findSlot(s.typeName, null, true) === null) 
                                addSlots.push(s);
                        }
                    }
                    for (const s of addSlots) {
                        tr.addSlot(s.typeName, s.value, false, 0);
                    }
                    hasGoodNoun = true;
                    break;
                }
                else if ((tt instanceof TextToken) && ((!tt.chars.isLetter || tt.morph._class.isConjunction))) {
                }
                else 
                    break;
            }
        }
        if (noun === null && model !== null) {
            let cou = 0;
            for (let tt = its[0].beginToken.previous; tt !== null && (cou < 100); tt = tt.previous,cou++) {
                if ((((prev = Utils.as(tt.getReferent(), WeaponReferent)))) !== null) {
                    if (prev.findSlot(WeaponReferent.ATTR_MODEL, model.value, true) === null) 
                        continue;
                    let addSlots = new Array();
                    for (const s of prev.slots) {
                        if (s.typeName === WeaponReferent.ATTR_TYPE) 
                            tr.addSlot(s.typeName, s.value, false, 0);
                        else if (s.typeName === WeaponReferent.ATTR_BRAND || s.typeName === WeaponReferent.ATTR_BRAND) {
                            if (tr.findSlot(s.typeName, null, true) === null) 
                                addSlots.push(s);
                        }
                    }
                    for (const s of addSlots) {
                        tr.addSlot(s.typeName, s.value, false, 0);
                    }
                    hasGoodNoun = true;
                    break;
                }
            }
        }
        if (hasGoodNoun) {
        }
        else if (noun !== null) {
            if (model !== null || ((brand !== null && !brand.isDoubt))) {
            }
            else 
                return null;
        }
        else {
            if (model === null) 
                return null;
            let cou = 0;
            let ok = false;
            for (let tt = t1.previous; tt !== null && (cou < 20); tt = tt.previous,cou++) {
                if ((tt.isValue("ОРУЖИЕ", null) || tt.isValue("ВООРУЖЕНИЕ", null) || tt.isValue("ВЫСТРЕЛ", null)) || tt.isValue("ВЫСТРЕЛИТЬ", null)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) 
                return null;
        }
        let res = new Array();
        res.push(new ReferentToken(tr, its[0].beginToken, t1));
        return res;
    }
    
    static initialize() {
        if (WeaponAnalyzer.m_Inited) 
            return;
        WeaponAnalyzer.m_Inited = true;
        MeasureAnalyzer.initialize();
        MetaWeapon.initialize();
        try {
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            WeaponItemToken.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new WeaponAnalyzer());
    }
    
    static static_constructor() {
        WeaponAnalyzer.ANALYZER_NAME = "WEAPON";
        WeaponAnalyzer.m_Inited = false;
    }
}


WeaponAnalyzer.static_constructor();

module.exports = WeaponAnalyzer