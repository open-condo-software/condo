/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");

const Token = require("./../Token");
const MetaToken = require("./../MetaToken");
const ReferentToken = require("./../ReferentToken");
const MorphClass = require("./../../morph/MorphClass");
const GetTextAttr = require("./../core/GetTextAttr");
const DerivateService = require("./../../semantic/utils/DerivateService");
const Referent = require("./../Referent");
const UriReferent = require("./../uri/UriReferent");
const BankDataReferent = require("./../bank/BankDataReferent");
const Termin = require("./../core/Termin");
const PhoneReferent = require("./../phone/PhoneReferent");
const AutoannoSentToken = require("./internal/AutoannoSentToken");
const DenominationReferent = require("./../denomination/DenominationReferent");
const KeywordMeta = require("./internal/KeywordMeta");
const PullentiNerCoreInternalResourceHelper = require("./../core/internal/PullentiNerCoreInternalResourceHelper");
const Analyzer = require("./../Analyzer");
const KeywordReferent = require("./KeywordReferent");
const MorphGender = require("./../../morph/MorphGender");
const AnalyzerDataWithOntology = require("./../core/AnalyzerDataWithOntology");
const MorphNumber = require("./../../morph/MorphNumber");
const ProcessorService = require("./../ProcessorService");
const DenominationAnalyzer = require("./../denomination/DenominationAnalyzer");
const KeywordType = require("./KeywordType");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const TextToken = require("./../TextToken");
const MiscHelper = require("./../core/MiscHelper");
const NounPhraseHelper = require("./../core/NounPhraseHelper");
const MoneyReferent = require("./../money/MoneyReferent");

/**
 * Анализатор ключевых комбинаций. 
 * Специфический анализатор, то есть нужно явно создавать процессор через функцию CreateSpecificProcessor, 
 * указав имя анализатора.
 */
class KeywordAnalyzer extends Analyzer {
    
    get name() {
        return KeywordAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Ключевые комбинации";
    }
    
    get description() {
        return "Ключевые слова для различных аналитических систем";
    }
    
    clone() {
        return new KeywordAnalyzer();
    }
    
    get usedExternObjectTypes() {
        return ["ALL"];
    }
    
    get isSpecific() {
        return true;
    }
    
    createAnalyzerData() {
        return new AnalyzerDataWithOntology();
    }
    
    get typeSystem() {
        return [KeywordMeta.GLOBAL_META];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(KeywordMeta.IMAGE_OBJ, PullentiNerCoreInternalResourceHelper.getBytes("kwobject.png"));
        res.put(KeywordMeta.IMAGE_PRED, PullentiNerCoreInternalResourceHelper.getBytes("kwpredicate.png"));
        res.put(KeywordMeta.IMAGE_REF, PullentiNerCoreInternalResourceHelper.getBytes("kwreferent.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === KeywordReferent.OBJ_TYPENAME) 
            return new KeywordReferent();
        return null;
    }
    
    get progressWeight() {
        return 1;
    }
    
    // Основная функция выделения телефонов
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        let hasDenoms = false;
        for (const a of kit.processor.analyzers) {
            if ((a instanceof DenominationAnalyzer) && !a.ignoreThisAnalyzer) 
                hasDenoms = true;
        }
        if (!hasDenoms) {
            let a = new DenominationAnalyzer();
            a.process(kit);
        }
        let li = new Array();
        let tmp = new StringBuilder();
        let tmp2 = new Array();
        let max = 0;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            max++;
        }
        let cur = 0;
        for (let t = kit.firstToken; t !== null; t = t.next,cur++) {
            if (t.isIgnored) 
                continue;
            let r = t.getReferent();
            if (r !== null) {
                t = this._addReferents(ad, t, cur, max);
                continue;
            }
            if (!(t instanceof TextToken)) 
                continue;
            if (!t.chars.isLetter || (t.lengthChar < 3)) 
                continue;
            let term = t.term;
            if (term === "ЕСТЬ") {
                if ((t.previous instanceof TextToken) && t.previous.morph._class.isVerb) {
                }
                else 
                    continue;
            }
            let npt = null;
            npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.of((NounPhraseParseAttr.ADJECTIVECANBELAST.value()) | (NounPhraseParseAttr.PARSEPREPOSITION.value())), 0, null);
            if (npt === null) {
                let mc = t.getMorphClassInDictionary();
                if (mc.isVerb && !mc.isPreposition) {
                    if (t.isVerbBe) 
                        continue;
                    if (t.isValue("МОЧЬ", null) || t.isValue("WOULD", null)) 
                        continue;
                    let kref = KeywordReferent._new1578(KeywordType.PREDICATE);
                    let norm = t.getNormalCaseText(MorphClass.VERB, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                    if (norm === null) 
                        norm = t.lemma;
                    if (norm.endsWith("ЬСЯ")) 
                        norm = norm.substring(0, 0 + norm.length - 2);
                    kref.addSlot(KeywordReferent.ATTR_VALUE, norm, false, 0);
                    let drv = DerivateService.findDerivates(norm, true, t.morph.language);
                    KeywordAnalyzer._addNormals(kref, drv, norm);
                    kref = Utils.as(ad.registerReferent(kref), KeywordReferent);
                    KeywordAnalyzer._setRank(kref, cur, max);
                    let rt1 = ReferentToken._new1092(ad.registerReferent(kref), t, t, t.morph);
                    kit.embedToken(rt1);
                    t = rt1;
                    continue;
                }
                continue;
            }
            if (npt.internalNoun !== null) 
                continue;
            if (npt.endToken.isValue("ЦЕЛОМ", null) || npt.endToken.isValue("ЧАСТНОСТИ", null)) {
                if (npt.preposition !== null) {
                    t = npt.endToken;
                    continue;
                }
            }
            if (npt.endToken.isValue("СТОРОНЫ", null) && npt.preposition !== null && npt.preposition.normal === "С") {
                t = npt.endToken;
                continue;
            }
            if (npt.beginToken === npt.endToken) {
                let mc = t.getMorphClassInDictionary();
                if (mc.isPreposition) 
                    continue;
                else if (mc.isAdverb) {
                    if (t.isValue("ПОТОМ", null)) 
                        continue;
                }
            }
            else {
            }
            li.splice(0, li.length);
            let t0 = t;
            for (let tt = t; tt !== null && tt.endChar <= npt.endChar; tt = tt.next) {
                if (!(tt instanceof TextToken)) 
                    continue;
                if (tt.isValue("NATURAL", null)) {
                }
                if ((tt.lengthChar < 3) || !tt.chars.isLetter) 
                    continue;
                let mc = tt.getMorphClassInDictionary();
                if ((mc.isPreposition || mc.isPronoun || mc.isPersonalPronoun) || mc.isConjunction) {
                    if (tt.isValue("ОТНОШЕНИЕ", null)) {
                    }
                    else 
                        continue;
                }
                if (mc.isMisc) {
                    if (MiscHelper.isEngArticle(tt)) 
                        continue;
                }
                let kref = KeywordReferent._new1578(KeywordType.OBJECT);
                let norm = tt.lemma;
                kref.addSlot(KeywordReferent.ATTR_VALUE, norm, false, 0);
                if (norm !== "ЕСТЬ") {
                    let drv = DerivateService.findDerivates(norm, true, tt.morph.language);
                    KeywordAnalyzer._addNormals(kref, drv, norm);
                }
                kref = Utils.as(ad.registerReferent(kref), KeywordReferent);
                KeywordAnalyzer._setRank(kref, cur, max);
                let rt1 = ReferentToken._new1092(kref, tt, tt, tt.morph);
                kit.embedToken(rt1);
                if (tt === t && li.length === 0) 
                    t0 = rt1;
                t = rt1;
                li.push(kref);
            }
            if (li.length > 1) {
                let kref = KeywordReferent._new1578(KeywordType.OBJECT);
                tmp.length = 0;
                tmp2.splice(0, tmp2.length);
                let hasNorm = false;
                for (const kw of li) {
                    let s = kw.getStringValue(KeywordReferent.ATTR_VALUE);
                    if (tmp.length > 0) 
                        tmp.append(' ');
                    tmp.append(s);
                    let n = kw.getStringValue(KeywordReferent.ATTR_NORMAL);
                    if (n !== null) {
                        hasNorm = true;
                        tmp2.push(n);
                    }
                    else 
                        tmp2.push(s);
                    kref.addSlot(KeywordReferent.ATTR_REF, kw, false, 0);
                }
                let val = npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                kref.addSlot(KeywordReferent.ATTR_VALUE, val, false, 0);
                tmp.length = 0;
                tmp2.sort();
                for (const s of tmp2) {
                    if (tmp.length > 0) 
                        tmp.append(' ');
                    tmp.append(s);
                }
                let norm = tmp.toString();
                if (norm !== val) 
                    kref.addSlot(KeywordReferent.ATTR_NORMAL, norm, false, 0);
                kref = Utils.as(ad.registerReferent(kref), KeywordReferent);
                KeywordAnalyzer._setRank(kref, cur, max);
                let rt1 = ReferentToken._new1092(kref, t0, t, npt.morph);
                kit.embedToken(rt1);
                t = rt1;
            }
        }
        cur = 0;
        for (let t = kit.firstToken; t !== null; t = t.next,cur++) {
            if (t.isIgnored) 
                continue;
            let kw = Utils.as(t.getReferent(), KeywordReferent);
            if (kw === null || kw.typ !== KeywordType.OBJECT) 
                continue;
            if (t.next === null || kw.childWords > 2) 
                continue;
            let t1 = t.next;
            if (t1.isValue("OF", null) && (t1.whitespacesAfterCount < 3) && t1.next !== null) {
                t1 = t1.next;
                if ((t1 instanceof TextToken) && MiscHelper.isEngArticle(t1) && t1.next !== null) 
                    t1 = t1.next;
            }
            else if (!t1.morph._case.isGenitive || t.whitespacesAfterCount > 1) 
                continue;
            let kw2 = Utils.as(t1.getReferent(), KeywordReferent);
            if (kw2 === null) 
                continue;
            if (kw === kw2) 
                continue;
            if (kw2.typ !== KeywordType.OBJECT || (kw.childWords + kw2.childWords) > 3) 
                continue;
            let kwUn = new KeywordReferent();
            kwUn.union(kw, kw2, MiscHelper.getTextValue(t1, t1, GetTextAttr.NO));
            kwUn = Utils.as(ad.registerReferent(kwUn), KeywordReferent);
            KeywordAnalyzer._setRank(kwUn, cur, max);
            let rt1 = ReferentToken._new1092(kwUn, t, t1, t.morph);
            kit.embedToken(rt1);
            t = rt1;
        }
        if (KeywordAnalyzer.SORT_KEYWORDS_BY_RANK) {
            let all = Array.from(ad.referents);
            // PYTHON: sort(key=attrgetter('rank'), reverse=True)
            all.sort((new KeywordAnalyzer.CompByRank()).compare);
            ad.referents = all;
        }
        if (KeywordAnalyzer.ANNOTATION_MAX_SENTENCES > 0) {
            let ano = AutoannoSentToken.createAnnotation(kit, KeywordAnalyzer.ANNOTATION_MAX_SENTENCES);
            if (ano !== null) 
                ad.registerReferent(ano);
        }
    }
    
    static _calcRank(gr) {
        if (gr.isDummy) 
            return 0;
        let res = 0;
        for (const w of gr.words) {
            if (w.lang.isRu && w._class !== null) {
                if (w._class.isVerb && w._class.isAdjective) {
                }
                else 
                    res++;
            }
        }
        if (gr.prefix === null) 
            res += 3;
        return res;
    }
    
    static _addNormals(kref, grs, norm) {
        if (grs === null || grs.length === 0) 
            return;
        for (let k = 0; k < grs.length; k++) {
            let ch = false;
            for (let i = 0; i < (grs.length - 1); i++) {
                if (KeywordAnalyzer._calcRank(grs[i]) < KeywordAnalyzer._calcRank(grs[i + 1])) {
                    let gr = grs[i];
                    grs[i] = grs[i + 1];
                    grs[i + 1] = gr;
                    ch = true;
                }
            }
            if (!ch) 
                break;
        }
        for (let i = 0; (i < 3) && (i < grs.length); i++) {
            if (!grs[i].isDummy && grs[i].words.length > 0) {
                if (grs[i].words[0].spelling !== norm) 
                    kref.addSlot(KeywordReferent.ATTR_NORMAL, grs[i].words[0].spelling, false, 0);
            }
        }
    }
    
    _addReferents(ad, t, cur, max) {
        if (!(t instanceof ReferentToken)) 
            return t;
        let r = t.getReferent();
        if (r === null) 
            return t;
        if (r instanceof DenominationReferent) {
            let dr = Utils.as(r, DenominationReferent);
            let kref0 = KeywordReferent._new1578(KeywordType.REFERENT);
            for (const s of dr.slots) {
                if (s.typeName === DenominationReferent.ATTR_VALUE) 
                    kref0.addSlot(KeywordReferent.ATTR_NORMAL, s.value, false, 0);
            }
            kref0.addSlot(KeywordReferent.ATTR_REF, dr, false, 0);
            let rt0 = new ReferentToken(ad.registerReferent(kref0), t, t);
            t.kit.embedToken(rt0);
            return rt0;
        }
        if ((r instanceof PhoneReferent) || (r instanceof UriReferent) || (r instanceof BankDataReferent)) 
            return t;
        if (r instanceof MoneyReferent) {
            let mr = Utils.as(r, MoneyReferent);
            let kref0 = KeywordReferent._new1578(KeywordType.OBJECT);
            kref0.addSlot(KeywordReferent.ATTR_NORMAL, mr.currency, false, 0);
            let rt0 = new ReferentToken(ad.registerReferent(kref0), t, t);
            t.kit.embedToken(rt0);
            return rt0;
        }
        if (r.typeName === "DATE" || r.typeName === "DATERANGE" || r.typeName === "BOOKLINKREF") 
            return t;
        for (let tt = t.beginToken; tt !== null && tt.endChar <= t.endChar; tt = tt.next) {
            if (tt instanceof ReferentToken) 
                this._addReferents(ad, tt, cur, max);
        }
        let kref = KeywordReferent._new1578(KeywordType.REFERENT);
        let norm = null;
        if (r.typeName === "GEO") 
            norm = r.getStringValue("ALPHA2");
        if (norm === null) 
            norm = r.toStringEx(true, null, 0);
        if (norm !== null) 
            kref.addSlot(KeywordReferent.ATTR_NORMAL, norm.toUpperCase(), false, 0);
        kref.addSlot(KeywordReferent.ATTR_REF, t.getReferent(), false, 0);
        KeywordAnalyzer._setRank(kref, cur, max);
        let rt1 = new ReferentToken(ad.registerReferent(kref), t, t);
        t.kit.embedToken(rt1);
        return rt1;
    }
    
    static _setRank(kr, cur, max) {
        let rank = 1;
        let ty = kr.typ;
        if (ty === KeywordType.PREDICATE) 
            rank = 1;
        else if (ty === KeywordType.OBJECT) {
            let v = Utils.notNull(kr.getStringValue(KeywordReferent.ATTR_VALUE), kr.getStringValue(KeywordReferent.ATTR_NORMAL));
            if (v !== null) {
                for (let i = 0; i < v.length; i++) {
                    if (v[i] === ' ' || v[i] === '-') 
                        rank++;
                }
            }
        }
        else if (ty === KeywordType.REFERENT) {
            rank = 3;
            let r = Utils.as(kr.getSlotValue(KeywordReferent.ATTR_REF), Referent);
            if (r !== null) {
                if (r.typeName === "PERSON") 
                    rank = 4;
            }
        }
        if (max > 0) 
            rank *= (((1) - (((0.5 * (cur)) / (max)))));
        kr.rank += rank;
    }
    
    static initialize() {
        if (KeywordAnalyzer.m_Initialized) 
            return;
        KeywordAnalyzer.m_Initialized = true;
        try {
            KeywordMeta.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            DenominationAnalyzer.initialize();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
            ProcessorService.registerAnalyzer(new KeywordAnalyzer());
        } catch (ex) {
            throw new Error(ex.message);
        }
    }
    
    static static_constructor() {
        KeywordAnalyzer.ANALYZER_NAME = "KEYWORD";
        KeywordAnalyzer.SORT_KEYWORDS_BY_RANK = true;
        KeywordAnalyzer.ANNOTATION_MAX_SENTENCES = 3;
        KeywordAnalyzer.m_Initialized = false;
    }
}


KeywordAnalyzer.CompByRank = class  {
    
    compare(x, y) {
        const KeywordReferent = require("./KeywordReferent");
        let d1 = x.rank;
        let d2 = y.rank;
        if (d1 > d2) 
            return -1;
        if (d1 < d2) 
            return 1;
        return 0;
    }
}


KeywordAnalyzer.static_constructor();

module.exports = KeywordAnalyzer