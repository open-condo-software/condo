/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const Stopwatch = require("./../../unisharp/Stopwatch");

const AddressItemType = require("./internal/AddressItemType");
const StreetKind = require("./StreetKind");
const ProcessorService = require("./../ProcessorService");
const ReferentToken = require("./../ReferentToken");
const GetTextAttr = require("./../core/GetTextAttr");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const StreetItemToken = require("./internal/StreetItemToken");
const AddressDefineHelper = require("./internal/AddressDefineHelper");
const Analyzer = require("./../Analyzer");
const MiscHelper = require("./../core/MiscHelper");
const MetaStreet = require("./internal/MetaStreet");
const MetaAddress = require("./internal/MetaAddress");
const Referent = require("./../Referent");
const GeoReferent = require("./../geo/GeoReferent");
const StreetReferent = require("./StreetReferent");
const AnalyzerData = require("./../core/AnalyzerData");
const StreetDefineHelper = require("./internal/StreetDefineHelper");
const AddressItemToken = require("./internal/AddressItemToken");
const AnalyzerDataWithOntology = require("./../core/AnalyzerDataWithOntology");
const AddressReferent = require("./AddressReferent");
const GeoAnalyzer = require("./../geo/GeoAnalyzer");

/**
 * Анализатор адресов
 */
class AddressAnalyzer extends Analyzer {
    
    get name() {
        return AddressAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Адреса";
    }
    
    get description() {
        return "Адреса (улицы, дома ...)";
    }
    
    clone() {
        return new AddressAnalyzer();
    }
    
    get typeSystem() {
        return [MetaAddress.globalMeta, MetaStreet.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaAddress.ADDRESS_IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("address.png"));
        res.put(MetaStreet.IMAGE_ID, PullentiNerCoreInternalResourceHelper.getBytes("street.png"));
        res.put(MetaStreet.IMAGE_TERR_ORG_ID, PullentiNerCoreInternalResourceHelper.getBytes("terrorg.png"));
        res.put(MetaStreet.IMAGE_TERR_SPEC_ID, PullentiNerCoreInternalResourceHelper.getBytes("terrspec.png"));
        res.put(MetaStreet.IMAGE_TERR_ID, PullentiNerCoreInternalResourceHelper.getBytes("territory.png"));
        return res;
    }
    
    get progressWeight() {
        return 4;
    }
    
    createReferent(type) {
        if (type === AddressReferent.OBJ_TYPENAME) 
            return new AddressReferent();
        if (type === StreetReferent.OBJ_TYPENAME) 
            return new StreetReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return [GeoReferent.OBJ_TYPENAME, "PHONE", "URI"];
    }
    
    createAnalyzerData() {
        return new AddressAnalyzer.AddressAnalyzerData();
    }
    
    process(kit) {
        let ad = Utils.as(kit.getAnalyzerData(this), AddressAnalyzer.AddressAnalyzerData);
        let gad = GeoAnalyzer.getData(kit.firstToken);
        if (gad === null) 
            return;
        gad.allRegime = true;
        let steps = 1;
        let max = steps;
        let delta = 100000;
        let parts = Utils.intDiv(((kit.sofa.text.length + delta) - 1), delta);
        if (parts === 0) 
            parts = 1;
        max *= parts;
        let cur = 0;
        let nextPos = delta;
        let sw = new Stopwatch();
        sw.reset();
        sw.start();
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.beginChar > nextPos) {
                nextPos += delta;
                cur++;
                if (!this.onProgress(cur, max, kit)) 
                    return;
            }
            let li = AddressItemToken.tryParseList(t, 20);
            if (li === null || li.length === 0) 
                continue;
            if ((li.length === 1 && li[0].typ === AddressItemType.STREET && li[0].referent.kind === StreetKind.RAILWAY) && li[0].referent.numbers === null) {
                t = li[0].endToken;
                continue;
            }
            let tt = AddressDefineHelper.tryDefine(li, t, ad, false);
            if (tt !== null) 
                t = tt;
        }
        sw.stop();
        let sli = new Array();
        for (let t = kit.firstToken; t !== null; t = (t === null ? null : t.next)) {
            let sr = Utils.as(t.getReferent(), StreetReferent);
            if (sr === null) 
                continue;
            if (t.next === null || !t.next.isCommaAnd) 
                continue;
            sli.splice(0, sli.length);
            sli.push(sr);
            for (t = t.next; t !== null; t = t.next) {
                if (t.isCommaAnd) 
                    continue;
                if ((((sr = Utils.as(t.getReferent(), StreetReferent)))) !== null) {
                    sli.push(sr);
                    continue;
                }
                let adr = Utils.as(t.getReferent(), AddressReferent);
                if (adr === null) 
                    break;
                if (adr.streets.length === 0) 
                    break;
                for (const ss of adr.streets) {
                    if (ss instanceof StreetReferent) 
                        sli.push(Utils.as(ss, StreetReferent));
                }
            }
            if (sli.length < 2) 
                continue;
            let ok = true;
            let hi = null;
            for (const s of sli) {
                if (s.geos.length === 0) 
                    continue;
                else if (s.geos.length === 1) {
                    if (hi === null || hi === s.geos[0]) 
                        hi = s.geos[0];
                    else {
                        ok = false;
                        break;
                    }
                }
                else {
                    ok = false;
                    break;
                }
            }
            if (ok && hi !== null) {
                for (const s of sli) {
                    if (s.geos.length === 0) 
                        s.addSlot(StreetReferent.ATTR_GEO, hi, false, 0);
                }
            }
        }
        for (const a of ad.referents) {
            if (a instanceof AddressReferent) 
                a.correct();
        }
        gad.allRegime = false;
    }
    
    processOntologyItem(begin) {
        let li = StreetItemToken.tryParseList(begin, 10, null);
        if (li === null || (li.length < 2)) 
            return null;
        let rt = StreetDefineHelper.tryParseStreet(li, true, false, false, null);
        if (rt === null) 
            return null;
        let street = Utils.as(rt.referent, StreetReferent);
        for (let t = rt.endToken.next; t !== null; t = t.next) {
            if (!t.isChar(';')) 
                continue;
            t = t.next;
            if (t === null) 
                break;
            li = StreetItemToken.tryParseList(begin, 10, null);
            let rt1 = StreetDefineHelper.tryParseStreet(li, true, false, false, null);
            if (rt1 !== null) {
                t = rt.endToken = rt1.endToken;
                street.mergeSlots(rt1.referent, true);
            }
            else {
                let tt = null;
                for (let ttt = t; ttt !== null; ttt = ttt.next) {
                    if (ttt.isChar(';')) 
                        break;
                    else 
                        tt = ttt;
                }
                if (tt !== null) {
                    let str = MiscHelper.getTextValue(t, tt, GetTextAttr.NO);
                    if (str !== null) 
                        street.addSlot(StreetReferent.ATTR_NAME, MiscHelper.convertFirstCharUpperAndOtherLower(str), false, 0);
                    t = rt.endToken = tt;
                }
            }
        }
        return new ReferentToken(street, rt.beginToken, rt.endToken);
    }
    
    static initialize() {
        if (AddressAnalyzer.m_Initialized) 
            return;
        AddressAnalyzer.m_Initialized = true;
        try {
            AddressItemToken.initialize();
        } catch (ex) {
            throw new Error(ex.message);
        }
        ProcessorService.registerAnalyzer(new AddressAnalyzer());
    }
    
    static static_constructor() {
        AddressAnalyzer.ANALYZER_NAME = "ADDRESS";
        AddressAnalyzer.m_Initialized = false;
    }
}


AddressAnalyzer.AddressAnalyzerData = class  extends AnalyzerData {
    
    constructor() {
        const AnalyzerData = require("./../core/AnalyzerData");
        const AnalyzerDataWithOntology = require("./../core/AnalyzerDataWithOntology");
        super();
        this.m_Addresses = new AnalyzerData();
        this.streets = new AnalyzerDataWithOntology();
    }
    
    registerReferent(referent) {
        const StreetReferent = require("./StreetReferent");
        if (referent instanceof StreetReferent) {
            referent.correct();
            return this.streets.registerReferent(referent);
        }
        else 
            return this.m_Addresses.registerReferent(referent);
    }
    
    get referents() {
        if (this.streets.referents.length === 0) 
            return this.m_Addresses.referents;
        else if (this.m_Addresses.referents.length === 0) 
            return this.streets.referents;
        let res = Array.from(this.streets.referents);
        res.splice(res.length, 0, ...this.m_Addresses.referents);
        return res;
    }
}


AddressAnalyzer.static_constructor();

module.exports = AddressAnalyzer