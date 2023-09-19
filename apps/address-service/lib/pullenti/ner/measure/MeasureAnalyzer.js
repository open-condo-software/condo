/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const Referent = require("./../Referent");
const ReferentToken = require("./../ReferentToken");
const MetaToken = require("./../MetaToken");
const TextToken = require("./../TextToken");
const UnitReferent = require("./UnitReferent");
const ProcessorService = require("./../ProcessorService");
const UnitsHelper = require("./internal/UnitsHelper");
const MeasureReferent = require("./MeasureReferent");
const UnitToken = require("./internal/UnitToken");
const NumbersWithUnitToken = require("./internal/NumbersWithUnitToken");
const Token = require("./../Token");
const PullentiNerBankInternalResourceHelper = require("./../bank/internal/PullentiNerBankInternalResourceHelper");
const UnitMeta = require("./internal/UnitMeta");
const MeasureMeta = require("./internal/MeasureMeta");
const Analyzer = require("./../Analyzer");
const MeasureToken = require("./internal/MeasureToken");
const Termin = require("./../core/Termin");
const TerminCollection = require("./../core/TerminCollection");

/**
 * Анализатор для измеряемых величин. 
 * Специфический анализатор, то есть нужно явно создавать процессор через функцию CreateSpecificProcessor,
 */
class MeasureAnalyzer extends Analyzer {
    
    get name() {
        return MeasureAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Измеряемые величины";
    }
    
    get description() {
        return "Диапазоны и просто значения в некоторых единицах измерения";
    }
    
    clone() {
        return new MeasureAnalyzer();
    }
    
    get isSpecific() {
        return true;
    }
    
    get typeSystem() {
        return [MeasureMeta.GLOBAL_META, UnitMeta.GLOBAL_META];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MeasureMeta.IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("measure.png"));
        res.put(UnitMeta.IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("munit.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === MeasureReferent.OBJ_TYPENAME) 
            return new MeasureReferent();
        if (type === UnitReferent.OBJ_TYPENAME) 
            return new UnitReferent();
        return null;
    }
    
    get progressWeight() {
        return 1;
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        let addunits = null;
        if (kit.ontology !== null) {
            addunits = new TerminCollection();
            for (const r of kit.ontology.items) {
                let uu = Utils.as(r.referent, UnitReferent);
                if (uu === null) 
                    continue;
                if (uu.m_Unit !== null) 
                    continue;
                for (const s of uu.slots) {
                    if (s.typeName === UnitReferent.ATTR_NAME || s.typeName === UnitReferent.ATTR_FULLNAME) 
                        addunits.add(Termin._new170(Utils.asString(s.value), uu));
                }
            }
        }
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (t.isTableControlChar) 
                continue;
            let mt = MeasureToken.tryParseMinimal(t, addunits, false);
            if (mt === null) 
                mt = MeasureToken.tryParse(t, addunits, true, false, false, false);
            if (mt === null) 
                continue;
            let rts = mt.createRefenetsTokensWithRegister(ad, true);
            if (rts === null) 
                continue;
            for (let i = 0; i < rts.length; i++) {
                let rt = rts[i];
                t.kit.embedToken(rt);
                t = rt;
                for (let j = i + 1; j < rts.length; j++) {
                    if (rts[j].beginToken === rt.beginToken) 
                        rts[j].beginToken = t;
                    if (rts[j].endToken === rt.endToken) 
                        rts[j].endToken = t;
                }
            }
        }
        if (kit.ontology !== null) {
            for (const e of ad.referents) {
                let u = Utils.as(e, UnitReferent);
                if (u === null) 
                    continue;
                for (const r of kit.ontology.items) {
                    let uu = Utils.as(r.referent, UnitReferent);
                    if (uu === null) 
                        continue;
                    let ok = false;
                    for (const s of uu.slots) {
                        if (s.typeName === UnitReferent.ATTR_NAME || s.typeName === UnitReferent.ATTR_FULLNAME) {
                            if (u.findSlot(null, s.value, true) !== null) {
                                ok = true;
                                break;
                            }
                        }
                    }
                    if (ok) {
                        u.ontologyItems = new Array();
                        u.ontologyItems.push(r);
                        break;
                    }
                }
            }
        }
    }
    
    processReferent(begin, param) {
        let mt = MeasureToken.tryParseMinimal(begin, null, true);
        if (mt !== null) {
            let rts = mt.createRefenetsTokensWithRegister(null, true);
            if (rts !== null) 
                return rts[rts.length - 1];
        }
        return null;
    }
    
    processOntologyItem(begin) {
        if (!(begin instanceof TextToken)) 
            return null;
        let ut = UnitToken.tryParse(begin, null, null, false);
        if (ut !== null) 
            return new ReferentToken(ut.createReferentWithRegister(null), ut.beginToken, ut.endToken);
        let u = new UnitReferent();
        u.addSlot(UnitReferent.ATTR_NAME, begin.getSourceText(), false, 0);
        return new ReferentToken(u, begin, begin);
    }
    
    static initialize() {
        /* this is synchronized block by MeasureAnalyzer.m_Lock, but this feature isn't supported in JS */ {
            if (MeasureAnalyzer.m_Initialized) 
                return;
            MeasureAnalyzer.m_Initialized = true;
            MeasureMeta.initialize();
            UnitMeta.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            UnitsHelper.initialize();
            NumbersWithUnitToken.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
            ProcessorService.registerAnalyzer(new MeasureAnalyzer());
        }
    }
    
    static static_constructor() {
        MeasureAnalyzer.ANALYZER_NAME = "MEASURE";
        MeasureAnalyzer.m_Initialized = false;
        MeasureAnalyzer.m_Lock = new Object();
    }
}


MeasureAnalyzer.static_constructor();

module.exports = MeasureAnalyzer