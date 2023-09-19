/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");

const Referent = require("./../Referent");
const GetTextAttr = require("./../core/GetTextAttr");
const SentimentKind = require("./SentimentKind");
const ProcessorService = require("./../ProcessorService");
const Token = require("./../Token");
const ReferentToken = require("./../ReferentToken");
const TerminParseAttr = require("./../core/TerminParseAttr");
const PullentiNerBusinessInternalResourceHelper = require("./../business/internal/PullentiNerBusinessInternalResourceHelper");
const MetaToken = require("./../MetaToken");
const Termin = require("./../core/Termin");
const TerminCollection = require("./../core/TerminCollection");
const MetaSentiment = require("./internal/MetaSentiment");
const TextToken = require("./../TextToken");
const Analyzer = require("./../Analyzer");
const MiscHelper = require("./../core/MiscHelper");
const SentimentReferent = require("./SentimentReferent");
const AnalyzerDataWithOntology = require("./../core/AnalyzerDataWithOntology");

/**
 * Анализатор для сентиментов (эмоциональная оценка)
 */
class SentimentAnalyzer extends Analyzer {
    
    get name() {
        return SentimentAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Сентиментный анализ";
    }
    
    get description() {
        return "Выделение тональных объектов";
    }
    
    clone() {
        return new SentimentAnalyzer();
    }
    
    get typeSystem() {
        return [MetaSentiment.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaSentiment.IMAGE_ID, PullentiNerBusinessInternalResourceHelper.getBytes("neutral.png"));
        res.put(MetaSentiment.IMAGE_ID_GOOD, PullentiNerBusinessInternalResourceHelper.getBytes("good.png"));
        res.put(MetaSentiment.IMAGE_ID_BAD, PullentiNerBusinessInternalResourceHelper.getBytes("bad.png"));
        return res;
    }
    
    get usedExternObjectTypes() {
        return ["ALL"];
    }
    
    createReferent(type) {
        if (type === SentimentReferent.OBJ_TYPENAME) 
            return new SentimentReferent();
        return null;
    }
    
    get isSpecific() {
        return true;
    }
    
    get progressWeight() {
        return 1;
    }
    
    createAnalyzerData() {
        return new AnalyzerDataWithOntology();
    }
    
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (!(t instanceof TextToken)) 
                continue;
            if (!t.chars.isLetter) 
                continue;
            let tok = SentimentAnalyzer.m_Termins.tryParse(t, TerminParseAttr.NO);
            if (tok === null) 
                continue;
            let coef = tok.termin.tag;
            if (coef === 0) 
                continue;
            let t0 = t;
            let t1 = tok.endToken;
            for (let tt = t.previous; tt !== null; tt = tt.previous) {
                let tok0 = SentimentAnalyzer.m_Termins.tryParse(tt, TerminParseAttr.NO);
                if (tok0 !== null) {
                    if ((tok0.termin.tag) === 0) {
                        coef *= 2;
                        t0 = tt;
                        continue;
                    }
                    break;
                }
                if ((tt instanceof TextToken) && tt.term === "НЕ") {
                    coef = -coef;
                    t0 = tt;
                    continue;
                }
                break;
            }
            for (let tt = t1.next; tt !== null; tt = tt.next) {
                if (!(tt instanceof TextToken)) 
                    break;
                if (!tt.chars.isLetter) 
                    continue;
                let tok0 = SentimentAnalyzer.m_Termins.tryParse(tt, TerminParseAttr.NO);
                if (tok0 === null) 
                    break;
                coef += (tok0.termin.tag);
                tt = (t1 = tok0.endToken);
            }
            if (coef === 0) 
                continue;
            let sr = new SentimentReferent();
            sr.kind = (coef > 0 ? SentimentKind.POSITIVE : SentimentKind.NEGATIVE);
            sr.coef = (coef > 0 ? coef : -coef);
            sr.spelling = MiscHelper.getTextValue(t0, t1, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
            sr = Utils.as(ad.registerReferent(sr), SentimentReferent);
            let rt = new ReferentToken(sr, t0, t1);
            kit.embedToken(rt);
            t = rt;
        }
    }
    
    static initialize() {
        if (SentimentAnalyzer.m_Inited) 
            return;
        SentimentAnalyzer.m_Inited = true;
        MetaSentiment.initialize();
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
        try {
            for (let i = 0; i < 2; i++) {
                let str = PullentiNerBusinessInternalResourceHelper.getString((i === 0 ? "Positives.txt" : "Negatives.txt"));
                if (str === null) 
                    continue;
                for (const line0 of Utils.splitString(str, '\n', false)) {
                    let line = line0.trim();
                    if (Utils.isNullOrEmpty(line)) 
                        continue;
                    let coef = (i === 0 ? 1 : -1);
                    SentimentAnalyzer.m_Termins.add(Termin._new170(line, coef));
                }
            }
        } catch (ex) {
        }
        for (const s of ["ОЧЕНЬ", "СИЛЬНО"]) {
            SentimentAnalyzer.m_Termins.add(Termin._new170(s, 0));
        }
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        ProcessorService.registerAnalyzer(new SentimentAnalyzer());
    }
    
    static static_constructor() {
        SentimentAnalyzer.ANALYZER_NAME = "SENTIMENT";
        SentimentAnalyzer.m_Termins = new TerminCollection();
        SentimentAnalyzer.m_Inited = false;
    }
}


SentimentAnalyzer.static_constructor();

module.exports = SentimentAnalyzer