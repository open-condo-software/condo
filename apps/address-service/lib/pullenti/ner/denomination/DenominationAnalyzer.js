/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Referent = require("./../Referent");
const Token = require("./../Token");
const MetaToken = require("./../MetaToken");
const ProcessorService = require("./../ProcessorService");
const NumberSpellingType = require("./../NumberSpellingType");
const TextToken = require("./../TextToken");
const NumberToken = require("./../NumberToken");
const DenominationReferent = require("./DenominationReferent");
const MetaDenom = require("./internal/MetaDenom");
const PullentiNerBankInternalResourceHelper = require("./../bank/internal/PullentiNerBankInternalResourceHelper");
const Analyzer = require("./../Analyzer");
const BracketHelper = require("./../core/BracketHelper");
const ReferentToken = require("./../ReferentToken");
const AnalyzerDataWithOntology = require("./../core/AnalyzerDataWithOntology");

/**
 * Анализатор деноминаций и обозначений (типа C#, A-320) 
 * Специфический анализатор, то есть нужно явно создавать процессор через функцию CreateSpecificProcessor, 
 * указав имя анализатора.
 * Анализатор деноминаций
 */
class DenominationAnalyzer extends Analyzer {
    
    get name() {
        return DenominationAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Деноминации";
    }
    
    get description() {
        return "Деноминации и обозначения типа СС-300, АН-24, С++";
    }
    
    clone() {
        return new DenominationAnalyzer();
    }
    
    get progressWeight() {
        return 5;
    }
    
    get isSpecific() {
        return true;
    }
    
    get typeSystem() {
        return [MetaDenom.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaDenom.DENOM_IMAGE_ID, PullentiNerBankInternalResourceHelper.getBytes("denom.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === DenominationReferent.OBJ_TYPENAME) 
            return new DenominationReferent();
        return null;
    }
    
    createAnalyzerData() {
        return new AnalyzerDataWithOntology();
    }
    
    // Основная функция выделения объектов
    process(kit) {
        let ad = Utils.as(kit.getAnalyzerData(this), AnalyzerDataWithOntology);
        for (let k = 0; k < 2; k++) {
            let detectNewDenoms = false;
            let dt = Utils.now();
            for (let t = kit.firstToken; t !== null; t = t.next) {
                if (t.isIgnored) 
                    continue;
                if (t.isWhitespaceBefore) {
                }
                else if (t.previous !== null && ((t.previous.isCharOf(",") || BracketHelper.canBeStartOfSequence(t.previous, false, false)))) {
                }
                else 
                    continue;
                let rt0 = this.tryAttachSpec(t);
                if (rt0 !== null) {
                    rt0.referent = ad.registerReferent(rt0.referent);
                    kit.embedToken(rt0);
                    t = rt0;
                    continue;
                }
                if (!t.chars.isLetter) 
                    continue;
                if (!this.canBeStartOfDenom(t)) 
                    continue;
                let ot = null;
                ot = ad.localOntology.tryAttach(t, null, false);
                if (ot !== null && (ot[0].item.referent instanceof DenominationReferent)) {
                    if (this.checkAttach(ot[0].beginToken, ot[0].endToken)) {
                        let cl = Utils.as(ot[0].item.referent.clone(), DenominationReferent);
                        cl.occurrence.splice(0, cl.occurrence.length);
                        let rt = new ReferentToken(cl, ot[0].beginToken, ot[0].endToken);
                        kit.embedToken(rt);
                        t = rt;
                        continue;
                    }
                }
                if (k > 0) 
                    continue;
                if (t !== null && t.kit.ontology !== null) {
                    if ((((ot = t.kit.ontology.attachToken(DenominationReferent.OBJ_TYPENAME, t)))) !== null) {
                        if (this.checkAttach(ot[0].beginToken, ot[0].endToken)) {
                            let dr = new DenominationReferent();
                            dr.mergeSlots(ot[0].item.referent, true);
                            let rt = new ReferentToken(ad.registerReferent(dr), ot[0].beginToken, ot[0].endToken);
                            kit.embedToken(rt);
                            t = rt;
                            continue;
                        }
                    }
                }
                rt0 = this.tryAttach(t, false);
                if (rt0 !== null) {
                    rt0.referent = ad.registerReferent(rt0.referent);
                    kit.embedToken(rt0);
                    detectNewDenoms = true;
                    t = rt0;
                    if (ad.localOntology.items.length > 1000) 
                        break;
                }
            }
            if (!detectNewDenoms) 
                break;
        }
    }
    
    canBeStartOfDenom(t) {
        if ((t === null || !t.chars.isLetter || t.next === null) || t.isNewlineAfter) 
            return false;
        if (!(t instanceof TextToken)) 
            return false;
        if (t.lengthChar > 4) 
            return false;
        t = t.next;
        if (t.chars.isLetter) 
            return false;
        if (t instanceof NumberToken) 
            return true;
        if (t.isCharOf("/\\") || t.isHiphen) 
            return t.next instanceof NumberToken;
        if (t.isCharOf("+*&^#@!_")) 
            return true;
        return false;
    }
    
    processReferent(begin, param) {
        return this.tryAttach(begin, false);
    }
    
    tryAttach(t, forOntology = false) {
        if (t === null) 
            return null;
        let rt0 = this.tryAttachSpec(t);
        if (rt0 !== null) 
            return rt0;
        if (t.chars.isAllLower) {
            if (!t.isWhitespaceAfter && (t.next instanceof NumberToken)) {
                if (t.previous === null || t.isWhitespaceBefore || t.previous.isCharOf(",:")) {
                }
                else 
                    return null;
            }
            else 
                return null;
        }
        let tmp = new StringBuilder();
        let t1 = t;
        let hiph = false;
        let ok = true;
        let nums = 0;
        let chars = 0;
        for (let w = t1.next; w !== null; w = w.next) {
            if (w.isWhitespaceBefore && !forOntology) 
                break;
            if (w.isCharOf("/\\_") || w.isHiphen) {
                hiph = true;
                tmp.append('-');
                continue;
            }
            hiph = false;
            let nt = Utils.as(w, NumberToken);
            if (nt !== null) {
                if (nt.typ !== NumberSpellingType.DIGIT) 
                    break;
                t1 = nt;
                tmp.append(nt.getSourceText());
                nums++;
                continue;
            }
            let tt = Utils.as(w, TextToken);
            if (tt === null) 
                break;
            if (tt.lengthChar > 3) {
                ok = false;
                break;
            }
            if (!Utils.isLetter(tt.term[0])) {
                if (tt.isCharOf(",:") || BracketHelper.canBeEndOfSequence(tt, false, null, false)) 
                    break;
                if (!tt.isCharOf("+*&^#@!")) {
                    ok = false;
                    break;
                }
                chars++;
            }
            t1 = tt;
            tmp.append(tt.getSourceText());
        }
        if (!forOntology) {
            if ((tmp.length < 1) || !ok || hiph) 
                return null;
            if (tmp.length > 12) 
                return null;
            let last = tmp.charAt(tmp.length - 1);
            if (last === '!') 
                return null;
            if ((nums + chars) === 0) 
                return null;
            if (!this.checkAttach(t, t1)) 
                return null;
        }
        let newDr = new DenominationReferent();
        newDr.addValue(t, t1);
        return new ReferentToken(newDr, t, t1);
    }
    
    // Некоторые специфические случаи
    tryAttachSpec(t) {
        if (t === null) 
            return null;
        let t0 = t;
        let nt = Utils.as(t, NumberToken);
        if (nt !== null && nt.typ === NumberSpellingType.DIGIT && nt.value === "1") {
            if (t.next !== null && t.next.isHiphen) 
                t = t.next;
            if ((t.next instanceof TextToken) && !t.next.isWhitespaceBefore) {
                if (t.next.isValue("C", null) || t.next.isValue("С", null)) {
                    let dr = new DenominationReferent();
                    dr.addSlot(DenominationReferent.ATTR_VALUE, "1С", false, 0);
                    dr.addSlot(DenominationReferent.ATTR_VALUE, "1C", false, 0);
                    return new ReferentToken(dr, t0, t.next);
                }
            }
        }
        if (((nt !== null && nt.typ === NumberSpellingType.DIGIT && (t.next instanceof TextToken)) && !t.isWhitespaceAfter && !t.next.chars.isAllLower) && t.next.chars.isLetter) {
            let dr = new DenominationReferent();
            dr.addSlot(DenominationReferent.ATTR_VALUE, (nt.getSourceText() + t.next.term), false, 0);
            return new ReferentToken(dr, t0, t.next);
        }
        return null;
    }
    
    checkAttach(begin, end) {
        for (let t = begin; t !== null && t !== end.next; t = t.next) {
            if (t !== begin) {
                let co = t.whitespacesBeforeCount;
                if (co > 0) {
                    if (co > 1) 
                        return false;
                    if (t.chars.isAllLower) 
                        return false;
                    if (t.previous.chars.isAllLower) 
                        return false;
                }
            }
        }
        if (!end.isWhitespaceAfter && end.next !== null) {
            if (!end.next.isCharOf(",;") && !BracketHelper.canBeEndOfSequence(end.next, false, null, false)) 
                return false;
        }
        return true;
    }
    
    static initialize() {
        if (DenominationAnalyzer.m_Inites) 
            return;
        DenominationAnalyzer.m_Inites = true;
        MetaDenom.initialize();
        ProcessorService.registerAnalyzer(new DenominationAnalyzer());
    }
    
    static static_constructor() {
        DenominationAnalyzer.ANALYZER_NAME = "DENOMINATION";
        DenominationAnalyzer.m_Inites = false;
    }
}


DenominationAnalyzer.static_constructor();

module.exports = DenominationAnalyzer