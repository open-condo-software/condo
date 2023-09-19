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
const BracketParseAttr = require("./../core/BracketParseAttr");
const Referent = require("./../Referent");
const MetaToken = require("./../MetaToken");
const TransItemTokenTyps = require("./internal/TransItemTokenTyps");
const ProcessorService = require("./../ProcessorService");
const TerminParseAttr = require("./../core/TerminParseAttr");
const TextToken = require("./../TextToken");
const GeoReferent = require("./../geo/GeoReferent");
const TransportKind = require("./TransportKind");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const ReferentToken = require("./../ReferentToken");
const BracketHelper = require("./../core/BracketHelper");
const Termin = require("./../core/Termin");
const TerminCollection = require("./../core/TerminCollection");
const MetaTransport = require("./internal/MetaTransport");
const Analyzer = require("./../Analyzer");
const TransItemToken = require("./internal/TransItemToken");
const TransportReferent = require("./TransportReferent");

/**
 * Анализатор транспортных стредств
 */
class TransportAnalyzer extends Analyzer {
    
    get name() {
        return TransportAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Транспорт";
    }
    
    get description() {
        return "Техника, автомобили, самолёты, корабли...";
    }
    
    clone() {
        return new TransportAnalyzer();
    }
    
    get typeSystem() {
        return [MetaTransport.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(TransportKind.FLY.toString(), PullentiNerCoreInternalResourceHelper.getBytes("fly.png"));
        res.put(TransportKind.SHIP.toString(), PullentiNerCoreInternalResourceHelper.getBytes("ship.png"));
        res.put(TransportKind.SPACE.toString(), PullentiNerCoreInternalResourceHelper.getBytes("space.png"));
        res.put(TransportKind.TRAIN.toString(), PullentiNerCoreInternalResourceHelper.getBytes("train.png"));
        res.put(TransportKind.AUTO.toString(), PullentiNerCoreInternalResourceHelper.getBytes("auto.png"));
        res.put(MetaTransport.IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("transport.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === TransportReferent.OBJ_TYPENAME) 
            return new TransportReferent();
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
            let its = TransItemToken.tryParseList(t, 10);
            if (its === null) 
                continue;
            let rts = this.tryAttach(its, false);
            if (rts !== null) {
                for (const rt of rts) {
                    let cou = 0;
                    for (let tt = t.previous; tt !== null && (cou < 1000); tt = tt.previous,cou++) {
                        let tr = Utils.as(tt.getReferent(), TransportReferent);
                        if (tr === null) 
                            continue;
                        let ok = true;
                        for (const s of rt.referent.slots) {
                            if (tr.findSlot(s.typeName, s.value, true) === null) {
                                ok = false;
                                break;
                            }
                        }
                        if (ok) {
                            rt.referent = tr;
                            break;
                        }
                    }
                    rt.referent = ad.registerReferent(rt.referent);
                    kit.embedToken(rt);
                    t = rt;
                    for (const s of rt.referent.slots) {
                        if (s.typeName === TransportReferent.ATTR_MODEL) {
                            let mod = s.value.toString();
                            for (let k = 0; k < 2; k++) {
                                if (!Utils.isDigit(mod[0])) {
                                    let li = [ ];
                                    let wrapli2786 = new RefOutArgWrapper();
                                    let inoutres2787 = objsByModel.tryGetValue(mod, wrapli2786);
                                    li = wrapli2786.value;
                                    if (!inoutres2787) 
                                        objsByModel.put(mod, (li = new Array()));
                                    if (!li.includes(rt.referent)) 
                                        li.push(rt.referent);
                                    models.addString(mod, li, null, false);
                                }
                                if (k > 0) 
                                    break;
                                let brand = rt.referent.getStringValue(TransportReferent.ATTR_BRAND);
                                if (brand === null) 
                                    break;
                                mod = (brand + " " + mod);
                            }
                        }
                        else if (s.typeName === TransportReferent.ATTR_NAME) 
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
                let tit = TransItemToken.tryParse(tok.beginToken.previous, null, false, true);
                if (tit !== null && tit.typ === TransItemTokenTyps.BRAND) {
                    tr.addSlot(TransportReferent.ATTR_BRAND, tit.value, false, 0);
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
        let its = TransItemToken.tryParseList(begin, 10);
        if (its === null) 
            return null;
        let rr = this.tryAttach(its, true);
        if (rr !== null && rr.length > 0) 
            return rr[0];
        return null;
    }
    
    tryAttach(its, attach) {
        let tr = new TransportReferent();
        let i = 0;
        let t1 = null;
        let brandIsDoubt = false;
        for (i = 0; i < its.length; i++) {
            if (its[i].typ === TransItemTokenTyps.NOUN) {
                if (tr.findSlot(TransportReferent.ATTR_TYPE, null, true) !== null) 
                    break;
                if (its[i].kind !== TransportKind.UNDEFINED) {
                    if (tr.kind !== TransportKind.UNDEFINED && its[i].kind !== tr.kind) 
                        break;
                    else 
                        tr.kind = its[i].kind;
                }
                tr.addSlot(TransportReferent.ATTR_TYPE, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(TransportReferent.ATTR_TYPE, its[i].altValue, false, 0);
                if (its[i].state !== null) 
                    tr.addGeo(its[i].state);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.GEO) {
                if (its[i].state !== null) 
                    tr.addGeo(its[i].state);
                else if (its[i].ref !== null) 
                    tr.addGeo(its[i].ref);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.BRAND) {
                if (tr.findSlot(TransportReferent.ATTR_BRAND, null, true) !== null) {
                    if (tr.findSlot(TransportReferent.ATTR_BRAND, its[i].value, true) === null) 
                        break;
                }
                if (its[i].kind !== TransportKind.UNDEFINED) {
                    if (tr.kind !== TransportKind.UNDEFINED && its[i].kind !== tr.kind) 
                        break;
                    else 
                        tr.kind = its[i].kind;
                }
                tr.addSlot(TransportReferent.ATTR_BRAND, its[i].value, false, 0);
                t1 = its[i].endToken;
                brandIsDoubt = its[i].isDoubt;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.MODEL) {
                if (tr.findSlot(TransportReferent.ATTR_MODEL, null, true) !== null) 
                    break;
                tr.addSlot(TransportReferent.ATTR_MODEL, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(TransportReferent.ATTR_MODEL, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.CLASS) {
                if (tr.findSlot(TransportReferent.ATTR_CLASS, null, true) !== null) 
                    break;
                tr.addSlot(TransportReferent.ATTR_CLASS, its[i].value, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.NAME) {
                if (tr.findSlot(TransportReferent.ATTR_NAME, null, true) !== null) 
                    break;
                tr.addSlot(TransportReferent.ATTR_NAME, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(TransportReferent.ATTR_NAME, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.NUMBER) {
                if (tr.findSlot(TransportReferent.ATTR_NUMBER, null, true) !== null) 
                    break;
                if (its[i].kind !== TransportKind.UNDEFINED) {
                    if (tr.kind !== TransportKind.UNDEFINED && its[i].kind !== tr.kind) 
                        break;
                    else 
                        tr.kind = its[i].kind;
                }
                tr.addSlot(TransportReferent.ATTR_NUMBER, its[i].value, false, 0);
                if (its[i].altValue !== null) 
                    tr.addSlot(TransportReferent.ATTR_NUMBER_REGION, its[i].altValue, false, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.ORG) {
                if (tr.findSlot(TransportReferent.ATTR_ORG, null, true) !== null) 
                    break;
                if (!its[i].morph._case.isUndefined && !its[i].morph._case.isGenitive) 
                    break;
                tr.addSlot(TransportReferent.ATTR_ORG, its[i].ref, true, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.DATE) {
                if (tr.findSlot(TransportReferent.ATTR_DATE, null, true) !== null) 
                    break;
                tr.addSlot(TransportReferent.ATTR_DATE, its[i].ref, true, 0);
                t1 = its[i].endToken;
                continue;
            }
            if (its[i].typ === TransItemTokenTyps.ROUTE) {
                if (tr.findSlot(TransportReferent.ATTR_ROUTEPOINT, null, true) !== null) 
                    break;
                for (const o of its[i].routeItems) {
                    tr.addSlot(TransportReferent.ATTR_ROUTEPOINT, o, false, 0);
                }
                t1 = its[i].endToken;
                continue;
            }
        }
        if (!tr.check(attach, brandIsDoubt)) 
            return null;
        let res = new Array();
        res.push(new ReferentToken(tr, its[0].beginToken, t1));
        if ((i < its.length) && tr.kind === TransportKind.SHIP && its[i - 1].typ === TransItemTokenTyps.NAME) {
            for (; i < its.length; i++) {
                if (its[i].typ !== TransItemTokenTyps.NAME || !its[i].isAfterConjunction) 
                    break;
                let tr1 = new TransportReferent();
                tr1.mergeSlots(tr, true);
                tr1.addSlot(TransportReferent.ATTR_NAME, its[i].value, true, 0);
                res.push(new ReferentToken(tr1, its[i].beginToken, its[i].endToken));
            }
        }
        else if (i === its.length && its[its.length - 1].typ === TransItemTokenTyps.NUMBER) {
            for (let tt = t1.next; tt !== null; tt = tt.next) {
                if (!tt.isCommaAnd) 
                    break;
                let nn = TransItemToken._attachRusAutoNumber(tt.next);
                if (nn === null) 
                    nn = TransItemToken._attachNumber(tt.next, false);
                if (nn === null || nn.typ !== TransItemTokenTyps.NUMBER) 
                    break;
                let tr1 = new TransportReferent();
                for (const s of tr.slots) {
                    if (s.typeName !== TransportReferent.ATTR_NUMBER) {
                        if (s.typeName === TransportReferent.ATTR_NUMBER_REGION && nn.altValue !== null) 
                            continue;
                        tr1.addSlot(s.typeName, s.value, false, 0);
                    }
                }
                tr1.addSlot(TransportReferent.ATTR_NUMBER, nn.value, true, 0);
                if (nn.altValue !== null) 
                    tr1.addSlot(TransportReferent.ATTR_NUMBER_REGION, nn.altValue, true, 0);
                res.push(new ReferentToken(tr1, nn.beginToken, nn.endToken));
                tt = nn.endToken;
            }
        }
        return res;
    }
    
    static initialize() {
        if (TransportAnalyzer.m_Inited) 
            return;
        TransportAnalyzer.m_Inited = true;
        MetaTransport.initialize();
        try {
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            TransItemToken.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new TransportAnalyzer());
    }
    
    static static_constructor() {
        TransportAnalyzer.ANALYZER_NAME = "TRANSPORT";
        TransportAnalyzer.m_Inited = false;
    }
}


TransportAnalyzer.static_constructor();

module.exports = TransportAnalyzer