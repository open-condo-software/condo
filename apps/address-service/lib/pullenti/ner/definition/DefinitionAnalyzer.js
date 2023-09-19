/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const StringBuilder = require("./../../unisharp/StringBuilder");

const TerminParseAttr = require("./../core/TerminParseAttr");
const MorphGender = require("./../../morph/MorphGender");
const MorphNumber = require("./../../morph/MorphNumber");
const DefinitionKind = require("./DefinitionKind");
const NumberSpellingType = require("./../NumberSpellingType");
const NounPhraseParseAttr = require("./../core/NounPhraseParseAttr");
const ParenthesisToken = require("./internal/ParenthesisToken");
const SourceOfAnalysis = require("./../SourceOfAnalysis");
const MorphLang = require("./../../morph/MorphLang");
const MorphCase = require("./../../morph/MorphCase");
const DerivateService = require("./../../semantic/utils/DerivateService");
const NumberToken = require("./../NumberToken");
const NounPhraseHelper = require("./../core/NounPhraseHelper");
const MetaToken = require("./../MetaToken");
const ProcessorService = require("./../ProcessorService");
const NumberHelper = require("./../core/NumberHelper");
const ReferentToken = require("./../ReferentToken");
const DefinitionReferent = require("./DefinitionReferent");
const MorphClass = require("./../../morph/MorphClass");
const MiscHelper = require("./../core/MiscHelper");
const BracketParseAttr = require("./../core/BracketParseAttr");
const AnalyzerData = require("./../core/AnalyzerData");
const GetTextAttr = require("./../core/GetTextAttr");
const TextToken = require("./../TextToken");
const PullentiNerBankInternalResourceHelper = require("./../bank/internal/PullentiNerBankInternalResourceHelper");
const MetaDefin = require("./internal/MetaDefin");
const BracketHelper = require("./../core/BracketHelper");
const Analyzer = require("./../Analyzer");
const Termin = require("./../core/Termin");
const DefinitionAnalyzerEn = require("./internal/DefinitionAnalyzerEn");
const Referent = require("./../Referent");
const TerminCollection = require("./../core/TerminCollection");

/**
 * Анализатор определений. 
 * Специфический анализатор, то есть нужно явно создавать процессор через функцию CreateSpecificProcessor, 
 * указав имя анализатора.
 */
class DefinitionAnalyzer extends Analyzer {
    
    get name() {
        return DefinitionAnalyzer.ANALYZER_NAME;
    }
    
    get caption() {
        return "Тезисы";
    }
    
    get description() {
        return "Утверждения и определения";
    }
    
    clone() {
        return new DefinitionAnalyzer();
    }
    
    get progressWeight() {
        return 1;
    }
    
    get typeSystem() {
        return [MetaDefin.globalMeta];
    }
    
    get images() {
        let res = new Hashtable();
        res.put(MetaDefin.IMAGE_DEF_ID, PullentiNerBankInternalResourceHelper.getBytes("defin.png"));
        res.put(MetaDefin.IMAGE_ASS_ID, PullentiNerBankInternalResourceHelper.getBytes("assert.png"));
        return res;
    }
    
    createReferent(type) {
        if (type === DefinitionReferent.OBJ_TYPENAME) 
            return new DefinitionReferent();
        return null;
    }
    
    get usedExternObjectTypes() {
        return ["ALL"];
    }
    
    get isSpecific() {
        return true;
    }
    
    createAnalyzerData() {
        return new AnalyzerData();
    }
    
    // Основная функция выделения объектов
    process(kit) {
        let ad = kit.getAnalyzerData(this);
        if (kit.baseLanguage.equals(MorphLang.EN)) {
            DefinitionAnalyzerEn.process(kit, ad);
            return;
        }
        let glosRegime = false;
        let onto = null;
        let oh = new Hashtable();
        if (kit.ontology !== null) {
            onto = new TerminCollection();
            for (const it of kit.ontology.items) {
                if (it.referent instanceof DefinitionReferent) {
                    let termin = it.referent.getStringValue(DefinitionReferent.ATTR_TERMIN);
                    if (!oh.containsKey(termin)) {
                        oh.put(termin, true);
                        onto.add(Termin._new1174(termin, termin));
                    }
                }
            }
            if (onto.termins.length === 0) 
                onto = null;
        }
        for (let t = kit.firstToken; t !== null; t = t.next) {
            if (t.isIgnored) 
                continue;
            if (!glosRegime && t.isNewlineBefore) {
                let tt = DefinitionAnalyzer._tryAttachGlossary(t);
                if (tt !== null) {
                    t = tt;
                    glosRegime = true;
                    continue;
                }
            }
            let maxChar = 0;
            let ok = false;
            if (MiscHelper.canBeStartOfSentence(t)) 
                ok = true;
            else if (((t.isValue("ЧТО", null) && t.next !== null && t.previous !== null) && t.previous.isComma && t.previous.previous !== null) && t.previous.previous.morph._class.equals(MorphClass.VERB)) {
                ok = true;
                t = t.next;
                if (BracketHelper.canBeStartOfSequence(t, true, false)) 
                    t = t.next;
            }
            else if (t.isNewlineBefore && glosRegime) 
                ok = true;
            else if (BracketHelper.canBeStartOfSequence(t, true, false) && t.previous !== null && t.previous.isChar(':')) {
                ok = true;
                t = t.next;
                for (let tt = t.next; tt !== null; tt = tt.next) {
                    if (BracketHelper.canBeEndOfSequence(tt, true, t, false)) {
                        maxChar = tt.previous.endChar;
                        break;
                    }
                }
            }
            else if (t.isNewlineBefore && t.previous !== null && t.previous.isCharOf(";:")) 
                ok = true;
            if (!ok) 
                continue;
            let prs = DefinitionAnalyzer.tryAttach(t, glosRegime, onto, maxChar, false);
            if (prs === null) 
                prs = this.tryAttachEnd(t, onto, maxChar);
            if (prs !== null) {
                for (const pr of prs) {
                    if (pr.referent !== null) {
                        pr.referent = ad.registerReferent(pr.referent);
                        pr.referent.addOccurenceOfRefTok(pr);
                    }
                    t = pr.endToken;
                }
            }
            else {
                if (t.isChar('(')) {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null) {
                        t = br.endToken;
                        continue;
                    }
                }
                let ign = false;
                for (let tt = t.next; tt !== null; tt = tt.next) {
                    if (MiscHelper.canBeStartOfSentence(tt)) {
                        if (tt.previous.isChar(';')) 
                            ign = true;
                        break;
                    }
                }
                if (glosRegime && !t.isNewlineBefore) {
                }
                else if (!ign) 
                    glosRegime = false;
            }
        }
    }
    
    static _tryAttachGlossary(t) {
        if (t === null || !t.isNewlineBefore) 
            return null;
        for (; t !== null; t = t.next) {
            if ((t instanceof TextToken) && t.chars.isLetter) 
                break;
        }
        if (t === null) 
            return null;
        if (t.isValue("ГЛОССАРИЙ", null) || t.isValue("ОПРЕДЕЛЕНИЕ", null)) 
            t = t.next;
        else if (t.isValue("СПИСОК", null) && t.next !== null && t.next.isValue("ОПРЕДЕЛЕНИЕ", null)) 
            t = t.next.next;
        else {
            let use = false;
            let ponat = false;
            let t0 = t;
            for (; t !== null; t = t.next) {
                if (t.isValue("ИСПОЛЬЗОВАТЬ", null)) 
                    use = true;
                else if (t.isValue("ПОНЯТИЕ", null) || t.isValue("ОПРЕДЕЛЕНИЕ", null)) 
                    ponat = true;
                else if (t.isChar(':')) {
                    if (use && ponat && t.isNewlineAfter) 
                        return t;
                }
                else if (t !== t0 && MiscHelper.canBeStartOfSentence(t)) 
                    break;
            }
            return null;
        }
        if (t === null) 
            return null;
        if (t.isAnd && t.next !== null && t.next.isValue("СОКРАЩЕНИЕ", null)) 
            t = t.next.next;
        if (t !== null && t.isCharOf(":.")) 
            t = t.next;
        if (t !== null && t.isNewlineBefore) 
            return t.previous;
        return null;
    }
    
    processReferent(begin, param) {
        let li = DefinitionAnalyzer.tryAttach(begin, false, null, 0, false);
        if (li === null || li.length === 0) 
            return null;
        return li[0];
    }
    
    processOntologyItem(begin) {
        if (begin === null) 
            return null;
        let t1 = null;
        for (let t = begin; t !== null; t = t.next) {
            if (t.isHiphen && ((t.isWhitespaceBefore || t.isWhitespaceAfter))) 
                break;
            else 
                t1 = t;
        }
        if (t1 === null) 
            return null;
        let dre = new DefinitionReferent();
        dre.addSlot(DefinitionReferent.ATTR_TERMIN, MiscHelper.getTextValue(begin, t1, GetTextAttr.NO), false, 0);
        return new ReferentToken(dre, begin, t1);
    }
    
    static _ignoreListPrefix(t) {
        for (; t !== null; t = t.next) {
            if (t.isNewlineAfter) 
                break;
            if (t instanceof NumberToken) {
                if (t.typ === NumberSpellingType.WORDS) 
                    break;
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSENUMERICASADJECTIVE, 0, null);
                if (npt !== null && npt.endChar > t.endChar) 
                    break;
                continue;
            }
            if (!(t instanceof TextToken)) 
                break;
            if (!t.chars.isLetter) {
                if (BracketHelper.canBeStartOfSequence(t, true, false)) 
                    break;
                continue;
            }
            if (t.lengthChar === 1 && t.next !== null && t.next.isCharOf(").")) 
                continue;
            break;
        }
        return t;
    }
    
    static tryAttach(t, glosRegime, onto, maxChar, thisIsDef = false) {
        if (t === null) 
            return null;
        let t0 = t;
        t = DefinitionAnalyzer._ignoreListPrefix(t);
        if (t === null) 
            return null;
        let hasPrefix = false;
        if (t0 !== t) 
            hasPrefix = true;
        t0 = t;
        let decree = null;
        let pt = ParenthesisToken.tryAttach(t);
        if (pt !== null) {
            decree = pt.ref;
            t = pt.endToken.next;
            if (t !== null && t.isChar(',')) 
                t = t.next;
        }
        if (t === null) 
            return null;
        let l0 = null;
        let l1 = null;
        let altName = null;
        let name0 = null;
        let normalLeft = false;
        let canNextSent = false;
        let coef = DefinitionKind.UNDEFINED;
        if (glosRegime) 
            coef = DefinitionKind.DEFINITION;
        let isOntoTermin = false;
        let ontoPrefix = null;
        if (t.isValue("ПОД", null)) {
            t = t.next;
            normalLeft = true;
        }
        else if (t.isValue("ИМЕННО", null)) 
            t = t.next;
        if ((t !== null && t.isValue("УТРАТИТЬ", null) && t.next !== null) && t.next.isValue("СИЛА", null)) {
            for (; t !== null; t = t.next) {
                if (t.isNewlineAfter) {
                    let re0 = new Array();
                    re0.push(new ReferentToken(null, t0, t));
                    return re0;
                }
            }
            return null;
        }
        let miscToken = null;
        for (; t !== null; t = t.next) {
            if (t !== t0 && MiscHelper.canBeStartOfSentence(t)) 
                break;
            if (maxChar > 0 && t.endChar > maxChar) 
                break;
            let mt = DefinitionAnalyzer._tryAttachMiscToken(t);
            if (mt !== null) {
                miscToken = mt;
                t = mt.endToken;
                normalLeft = mt.morph._case.isNominative;
                continue;
            }
            if (!(t instanceof TextToken)) {
                let r = t.getReferent();
                if (r !== null && ((r.typeName === "DECREE" || r.typeName === "DECREEPART"))) {
                    decree = r;
                    if (l0 === null) {
                        if ((t.next !== null && t.next.getMorphClassInDictionary().equals(MorphClass.VERB) && t.next.next !== null) && t.next.next.isComma) {
                            t = t.next.next;
                            if (t.next !== null && t.next.isValue("ЧТО", null)) 
                                t = t.next;
                            continue;
                        }
                        l0 = t;
                    }
                    l1 = t;
                    continue;
                }
                if (r !== null && (((r.typeName === "ORGANIZATION" || r.typeName === "PERSONPROPERTY" || r.typeName === "STREET") || r.typeName === "GEO"))) {
                    if (l0 === null) 
                        l0 = t;
                    l1 = t;
                    continue;
                }
                if ((t instanceof NumberToken) && NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null) !== null) {
                }
                else 
                    break;
            }
            pt = ParenthesisToken.tryAttach(t);
            if (pt !== null && pt.ref !== null) {
                if (pt.ref.typeName === "DECREE" || pt.ref.typeName === "DECREEPART") 
                    decree = pt.ref;
                t = pt.endToken.next;
                if (l0 === null) 
                    continue;
                break;
            }
            if (!t.chars.isLetter) {
                if (t.isHiphen) {
                    if (t.isWhitespaceAfter || t.isWhitespaceBefore) 
                        break;
                    continue;
                }
                if (t.isChar('(')) {
                    if (l1 === null) 
                        break;
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br === null) 
                        break;
                    let tt1 = t.next;
                    if (tt1.isValue("ДАЛЕЕ", null)) {
                        tt1 = tt1.next;
                        if (!tt1.chars.isLetter) 
                            tt1 = tt1.next;
                        if (tt1 === null) 
                            return null;
                    }
                    altName = MiscHelper.getTextValue(tt1, br.endToken.previous, GetTextAttr.NO);
                    if (br.beginToken.next === br.endToken.previous) {
                        t = br.endToken;
                        continue;
                    }
                    t = br.endToken.next;
                    break;
                }
                if (BracketHelper.canBeStartOfSequence(t, true, false)) {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null && l0 === null && NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null) !== null) {
                        l0 = t.next;
                        l1 = br.endToken.previous;
                        altName = null;
                        t = br.endToken.next;
                    }
                    else if (br !== null && l0 !== null) {
                        l1 = br.endToken;
                        altName = null;
                        t = br.endToken;
                        continue;
                    }
                }
                break;
            }
            if (t.isValue("ЭТО", null)) 
                break;
            if (t.morph._class.isConjunction) {
                if (!glosRegime || !t.isAnd) 
                    break;
                continue;
            }
            let npt = null;
            if (t.isValue("ДАВАТЬ", null) || t.isValue("ДАТЬ", null) || t.isValue("ФОРМУЛИРОВАТЬ", null)) {
                npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.noun.isValue("ОПРЕДЕЛЕНИЕ", null)) {
                    t = npt.endToken;
                    if (t.next !== null && t.next.isValue("ПОНЯТИЕ", null)) 
                        t = t.next;
                    l0 = null;
                    l1 = null;
                    normalLeft = true;
                    canNextSent = true;
                    coef = DefinitionKind.DEFINITION;
                    continue;
                }
            }
            altName = null;
            if (onto !== null) {
                let took = onto.tryParse(t, TerminParseAttr.NO);
                if (took !== null) {
                    if (l0 !== null) {
                        if (ontoPrefix !== null) 
                            break;
                        ontoPrefix = MiscHelper.getTextValue(l0, l1, GetTextAttr.KEEPREGISTER);
                    }
                    if (!isOntoTermin) {
                        isOntoTermin = true;
                        l0 = t;
                    }
                    name0 = took.termin.canonicText;
                    t = (l1 = took.endToken);
                    continue;
                }
            }
            npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSEPREPOSITION, 0, null);
            if (npt !== null && npt.internalNoun !== null) 
                break;
            if (npt === null) {
                if (l0 !== null) 
                    break;
                if (t.morph._class.isPreposition || t.morph._class.isVerb) 
                    break;
                if (t.morph._class.isAdjective) {
                    let tt = null;
                    let ve = 0;
                    for (tt = t.next; tt !== null; tt = tt.next) {
                        if (tt.getMorphClassInDictionary().isVerb) 
                            ve++;
                        else 
                            break;
                    }
                    if ((ve > 0 && tt !== null && tt.isValue("ТАКОЙ", null)) && NounPhraseHelper.tryParse(tt.next, NounPhraseParseAttr.NO, 0, null) !== null) {
                        l0 = (l1 = t);
                        t = t.next;
                        break;
                    }
                }
                if (!t.chars.isAllLower && t.lengthChar > 2 && t.getMorphClassInDictionary().isUndefined) {
                }
                else 
                    continue;
            }
            if (l0 === null) {
                if (t.morph._class.isPreposition) 
                    break;
                if (DefinitionAnalyzer.m_VerbotFirstWords.tryParse(t, TerminParseAttr.NO) !== null && onto === null) 
                    break;
                l0 = t;
            }
            else if (t.morph._class.isPreposition) {
                if (DefinitionAnalyzer.m_VerbotLastWords.tryParse(npt.noun.beginToken, TerminParseAttr.NO) !== null || DefinitionAnalyzer.m_VerbotLastWords.tryParse(npt.beginToken, TerminParseAttr.NO) !== null) {
                    t = npt.endToken.next;
                    break;
                }
            }
            if (npt !== null) {
                if (DefinitionAnalyzer.m_VerbotFirstWords.tryParse(npt.noun.beginToken, TerminParseAttr.NO) !== null && onto === null) 
                    break;
                let ok1 = true;
                if (!glosRegime) {
                    for (let tt = npt.beginToken; tt !== null && tt.endChar <= npt.endChar; tt = tt.next) {
                        if (tt.morph._class.isPronoun || tt.morph._class.isPersonalPronoun) {
                            if (tt.isValue("ИНОЙ", null)) {
                            }
                            else {
                                ok1 = false;
                                break;
                            }
                        }
                    }
                }
                if (!ok1) 
                    break;
                t = (l1 = npt.endToken);
            }
            else 
                l1 = t;
        }
        if (!(t instanceof TextToken) || ((l1 === null && !isOntoTermin)) || t.next === null) 
            return null;
        if (onto !== null && name0 === null) 
            return null;
        let isNot = false;
        let r0 = t;
        let r1 = null;
        if (t.isValue("НЕ", null)) {
            t = t.next;
            if (t === null) 
                return null;
            isNot = true;
        }
        let normalRight = false;
        let ok = 0;
        let hasthis = false;
        if (t.isHiphen || t.isCharOf(":") || ((canNextSent && t.isChar('.')))) {
            if ((t.next instanceof TextToken) && t.next.term === "ЭТО") {
                ok = 2;
                t = t.next.next;
                hasthis = true;
            }
            else if (glosRegime) {
                ok = 2;
                t = t.next;
            }
            else if (isOntoTermin) {
                ok = 1;
                t = t.next;
            }
            else if (t.isHiphen && t.isWhitespaceBefore && t.isWhitespaceAfter) {
                let tt = t.next;
                if (tt !== null && tt.isValue("НЕ", null)) {
                    isNot = true;
                    tt = tt.next;
                }
                let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.morph._case.isNominative) {
                    ok = 2;
                    t = tt;
                }
                else if ((tt !== null && tt.morph._case.isNominative && tt.morph._class.isVerb) && tt.morph._class.isAdjective) {
                    ok = 2;
                    t = tt;
                }
            }
            else {
                let rt0 = DefinitionAnalyzer.tryAttach(t.next, false, null, maxChar, false);
                if (rt0 !== null) {
                    for (const rt of rt0) {
                        if (coef === DefinitionKind.DEFINITION && rt.referent.kind === DefinitionKind.ASSERTATION) 
                            rt.referent.kind = coef;
                    }
                    return rt0;
                }
            }
        }
        else if (t.term === "ЭТО") {
            let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                ok = 1;
                t = t.next;
                hasthis = true;
            }
        }
        else if (t.isValue("ЯВЛЯТЬСЯ", null) || t.isValue("ПРИЗНАВАТЬСЯ", null) || t.isValue("ЕСТЬ", null)) {
            if (t.isValue("ЯВЛЯТЬСЯ", null)) 
                normalRight = true;
            let t11 = t.next;
            for (; t11 !== null; t11 = t11.next) {
                if (t11.isComma || t11.morph._class.isPreposition || t11.morph._class.isConjunction) {
                }
                else 
                    break;
            }
            let npt = NounPhraseHelper.tryParse(t11, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null || t11.getMorphClassInDictionary().isAdjective) {
                ok = 1;
                t = t11;
                normalLeft = true;
            }
            else if ((t11 !== null && t11.isValue("ОДИН", null) && t11.next !== null) && t11.next.isValue("ИЗ", null)) {
                ok = 1;
                t = t11;
                normalLeft = true;
            }
            if (isOntoTermin) 
                ok = 1;
            else if (l0 === l1 && npt !== null && l0.morph._class.isAdjective) {
                if (((l0.morph.gender.value()) & (npt.morph.gender.value())) !== (MorphGender.UNDEFINED.value()) || ((l0.morph.number.value()) & (npt.morph.number.value())) === (MorphNumber.PLURAL.value())) 
                    name0 = (l0.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, npt.morph.gender, false) + " " + npt.noun.getNormalCaseText(MorphClass.NOUN, MorphNumber.SINGULAR, npt.morph.gender, false));
                else 
                    ok = 0;
            }
        }
        else if (t.isValue("ОЗНАЧАТЬ", null) || t.isValue("НЕСТИ", null)) {
            let t11 = t.next;
            if (t11 !== null && t11.isChar(':')) 
                t11 = t11.next;
            if (t11.isValue("НЕ", null) && t11.next !== null) {
                isNot = true;
                t11 = t11.next;
            }
            let npt = NounPhraseHelper.tryParse(t11, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null || isOntoTermin) {
                ok = 1;
                t = t11;
            }
        }
        else if (t.isValue("ВЫРАЖАТЬ", null)) {
            let t11 = t.next;
            for (; t11 !== null; t11 = t11.next) {
                if ((t11.morph._class.isPronoun || t11.isComma || t11.morph._class.isPreposition) || t11.morph._class.isConjunction) {
                }
                else 
                    break;
            }
            let npt = NounPhraseHelper.tryParse(t11, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null || isOntoTermin) {
                ok = 1;
                t = t11;
            }
        }
        else if (((t.isValue("СЛЕДОВАТЬ", null) || t.isValue("МОЖНО", null))) && t.next !== null && ((t.next.isValue("ПОНИМАТЬ", null) || t.next.isValue("ОПРЕДЕЛИТЬ", null) || t.next.isValue("СЧИТАТЬ", null)))) {
            let t11 = t.next.next;
            if (t11 === null) 
                return null;
            if (t11.isValue("КАК", null)) 
                t11 = t11.next;{
                    ok = 2;
                    t = t11;
                }
        }
        else if (t.isValue("ПРЕДСТАВЛЯТЬ", null) && t.next !== null && t.next.isValue("СОБОЙ", null)) {
            let t11 = t.next.next;
            if (t11 === null) 
                return null;
            let npt = NounPhraseHelper.tryParse(t11, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null || t11.morph._class.isAdjective || isOntoTermin) {
                ok = 1;
                t = t11;
            }
        }
        else if ((((t.isValue("ДОЛЖЕН", null) || t.isValue("ДОЛЖНЫЙ", null))) && t.next !== null && t.next.isValue("ПРЕДСТАВЛЯТЬ", null)) && t.next.next !== null && t.next.next.isValue("СОБОЙ", null)) {
            let t11 = t.next.next.next;
            if (t11 === null) 
                return null;
            let npt = NounPhraseHelper.tryParse(t11, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null || t11.morph._class.isAdjective || isOntoTermin) {
                ok = 1;
                t = t11;
            }
        }
        else if (t.isValue("ДОЛЖНЫЙ", null)) {
            if (t.next !== null && t.next.morph._class.isVerb) 
                t = t.next;
            ok = 1;
        }
        else if (((((((((t.isValue("МОЖЕТ", null) || t.isValue("МОЧЬ", null) || t.isValue("ВПРАВЕ", null)) || t.isValue("ЗАПРЕЩЕНО", null) || t.isValue("РАЗРЕШЕНО", null)) || t.isValue("ОТВЕЧАТЬ", null) || t.isValue("ПРИЗНАВАТЬ", null)) || t.isValue("ОСВОБОЖДАТЬ", null) || t.isValue("ОСУЩЕСТВЛЯТЬ", null)) || t.isValue("ПРОИЗВОДИТЬ", null) || t.isValue("ПОДЛЕЖАТЬ", null)) || t.isValue("ПРИНИМАТЬ", null) || t.isValue("СЧИТАТЬ", null)) || t.isValue("ИМЕТЬ", null) || t.isValue("ВПРАВЕ", null)) || t.isValue("ОБЯЗАН", null) || t.isValue("ОБЯЗАТЬ", null))) 
            ok = 1;
        if (ok === 0) 
            return null;
        if (t === null) 
            return null;
        if (t.isValue("НЕ", null)) {
            if (!isOntoTermin) 
                return null;
        }
        let dr = new DefinitionReferent();
        normalLeft = true;
        let nam = (name0 != null ? name0 : MiscHelper.getTextValue(l0, l1, (normalLeft ? GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE : GetTextAttr.NO)));
        if (nam === null) 
            return null;
        if (name0 === null) {
        }
        if (name0 === null) 
            dr.tag = MetaToken._new806(l0, l1, normalLeft);
        if (l0 === l1 && l0.morph._class.isAdjective && l0.morph._case.isInstrumental) {
            if (t !== null && t.isValue("ТАКОЙ", null)) {
                let npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
                if (npt !== null && npt.morph._case.isNominative) {
                    let str = l0.getNormalCaseText(MorphClass.ADJECTIVE, (npt.morph.number === MorphNumber.PLURAL ? MorphNumber.SINGULAR : MorphNumber.UNDEFINED), npt.morph.gender, false);
                    if (str === null) 
                        str = l0.getNormalCaseText(MorphClass.ADJECTIVE, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                    nam = (str + " " + npt.getNormalCaseText(null, MorphNumber.UNDEFINED, MorphGender.UNDEFINED, false));
                }
            }
        }
        if (decree !== null) {
            for (let tt = l0; tt !== null && tt.endChar <= l1.endChar; tt = tt.next) {
                if (tt.getReferent() === decree) {
                    decree = null;
                    break;
                }
            }
        }
        if (nam.endsWith(")") && altName === null) {
            let ii = nam.lastIndexOf('(');
            if (ii > 0) {
                altName = nam.substring(ii + 1, ii + 1 + nam.length - ii - 2).trim();
                nam = nam.substring(0, 0 + ii).trim();
            }
        }
        dr.addSlot(DefinitionReferent.ATTR_TERMIN, nam, false, 0);
        if (altName !== null) 
            dr.addSlot(DefinitionReferent.ATTR_TERMIN, altName, false, 0);
        if (!isOntoTermin) {
            let npt2 = NounPhraseHelper.tryParse(l0, NounPhraseParseAttr.NO, 0, null);
            if (npt2 !== null && npt2.morph.number === MorphNumber.PLURAL) {
                nam = MiscHelper.getTextValue(l0, l1, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE);
                if (nam !== null) 
                    dr.addSlot(DefinitionReferent.ATTR_TERMIN, nam, false, 0);
            }
        }
        if (miscToken !== null) {
            if (miscToken.morph._class.isNoun) 
                dr.addSlot(DefinitionReferent.ATTR_TERMIN_ADD, Utils.asString(miscToken.tag), false, 0);
            else 
                dr.addSlot(DefinitionReferent.ATTR_MISC, Utils.asString(miscToken.tag), false, 0);
        }
        let t1 = null;
        let multiParts = null;
        for (; t !== null; t = t.next) {
            if (MiscHelper.canBeStartOfSentence(t)) 
                break;
            if (maxChar > 0 && t.endChar > maxChar) 
                break;
            t1 = t;
            if (t.isChar('(') && (t.next instanceof ReferentToken)) {
                let r = t.next.getReferent();
                if (r.typeName === "DECREE" || r.typeName === "DECREEPART") {
                    decree = r;
                    t1 = (t = t.next);
                    while (t.next !== null) {
                        if (t.next.isCommaAnd && (t.next.next instanceof ReferentToken) && ((t.next.next.getReferent().typeName === "DECREE" || t.next.next.getReferent().typeName === "DECREEPART"))) 
                            t1 = (t = t.next.next);
                        else 
                            break;
                    }
                    if (t1.next !== null && t1.next.isChar(')')) 
                        t = (t1 = t1.next);
                    continue;
                }
            }
            if (t.isChar('(') && t.next !== null && t.next.isValue("ДАЛЕЕ", null)) {
                let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                if (br !== null) {
                    t = (t1 = br.endToken);
                    continue;
                }
            }
            if (t.isChar(':') && t.isWhitespaceAfter) {
                let mt = DefinitionAnalyzer._tryParseListItem(t.next);
                if (mt !== null) {
                    multiParts = new Array();
                    multiParts.push(mt);
                    for (let tt = mt.endToken.next; tt !== null; tt = tt.next) {
                        if (maxChar > 0 && tt.endChar > maxChar) 
                            break;
                        mt = DefinitionAnalyzer._tryParseListItem(tt);
                        if (mt === null) 
                            break;
                        multiParts.push(mt);
                        tt = mt.endToken;
                    }
                    break;
                }
            }
            if (!t.isCharOf(";.")) 
                r1 = t;
        }
        if (r1 === null) 
            return null;
        if (r0.next !== null && (r0 instanceof TextToken) && !r0.chars.isLetter) 
            r0 = r0.next;
        normalRight = false;
        let df = MiscHelper.getTextValue(r0, r1, GetTextAttr.of(((normalRight ? GetTextAttr.FIRSTNOUNGROUPTONOMINATIVESINGLE : GetTextAttr.NO).value()) | (GetTextAttr.KEEPREGISTER.value())));
        if (multiParts !== null) {
            let res1 = new Array();
            dr.kind = (isNot ? DefinitionKind.NEGATION : DefinitionKind.ASSERTATION);
            for (const mp of multiParts) {
                let dr1 = dr.clone();
                let tmp = new StringBuilder();
                if (df !== null) {
                    tmp.append(df);
                    if (tmp.length > 0 && tmp.charAt(tmp.length - 1) === ':') 
                        tmp.length = tmp.length - 1;
                    tmp.append(": ");
                    tmp.append(MiscHelper.getTextValue(mp.beginToken, mp.endToken, GetTextAttr.KEEPREGISTER));
                }
                dr1.addSlot(DefinitionReferent.ATTR_VALUE, tmp.toString(), false, 0);
                res1.push(new ReferentToken(dr1, (res1.length === 0 ? t0 : mp.beginToken), mp.endToken));
            }
            return res1;
        }
        if (df === null || (df.length < 20)) 
            return null;
        if (ontoPrefix !== null) 
            df = (ontoPrefix + " " + df);
        if ((coef === DefinitionKind.UNDEFINED && ok > 1 && !isNot) && multiParts === null) {
            let allNps = true;
            let couNpt = 0;
            for (let tt = l0; tt !== null && tt.endChar <= l1.endChar; tt = tt.next) {
                let npt = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.REFERENTCANBENOUN, 0, null);
                if (npt === null && tt.morph._class.isPreposition) 
                    npt = NounPhraseHelper.tryParse(tt.next, NounPhraseParseAttr.NO, 0, null);
                if (npt === null) {
                    allNps = false;
                    break;
                }
                couNpt++;
                tt = npt.endToken;
            }
            if (allNps && (couNpt < 5)) {
                if ((Utils.intDiv(df.length, 3)) > nam.length) 
                    coef = DefinitionKind.DEFINITION;
            }
        }
        if ((t1.isChar(';') && t1.isNewlineAfter && onto !== null) && !hasPrefix && multiParts === null) {
            let tmp = new StringBuilder();
            tmp.append(df);
            for (t = t1.next; t !== null; t = t.next) {
                if (t.isChar('(')) {
                    let br = BracketHelper.tryParse(t, BracketParseAttr.NO, 100);
                    if (br !== null) {
                        t = br.endToken;
                        continue;
                    }
                }
                let tt = DefinitionAnalyzer._ignoreListPrefix(t);
                if (tt === null) 
                    break;
                let tt1 = null;
                for (let ttt1 = tt; ttt1 !== null; ttt1 = ttt1.next) {
                    if (ttt1.isNewlineAfter) {
                        tt1 = ttt1;
                        break;
                    }
                }
                if (tt1 === null) 
                    break;
                let df1 = MiscHelper.getTextValue(tt, (tt1.isCharOf(".;") ? tt1.previous : tt1), GetTextAttr.KEEPREGISTER);
                if (df1 === null) 
                    break;
                tmp.append(";\n ").append(df1);
                t = (t1 = tt1);
                if (!tt1.isChar(';')) 
                    break;
            }
            df = tmp.toString();
        }
        dr.addSlot(DefinitionReferent.ATTR_VALUE, df, false, 0);
        if (isNot) 
            coef = DefinitionKind.NEGATION;
        else if (hasthis && thisIsDef) 
            coef = DefinitionKind.DEFINITION;
        else if (miscToken !== null && !miscToken.morph._class.isNoun) 
            coef = DefinitionKind.ASSERTATION;
        if (coef === DefinitionKind.UNDEFINED) 
            coef = DefinitionKind.ASSERTATION;
        if (decree !== null) 
            dr.addSlot(DefinitionReferent.ATTR_DECREE, decree, false, 0);
        dr.kind = coef;
        let res = new Array();
        res.push(new ReferentToken(dr, t0, t1));
        return res;
    }
    
    // Это распознавание случая, когда термин находится в конце
    tryAttachEnd(t, onto, maxChar) {
        if (t === null) 
            return null;
        let t0 = t;
        t = DefinitionAnalyzer._ignoreListPrefix(t);
        if (t === null) 
            return null;
        let hasPrefix = false;
        if (t0 !== t) 
            hasPrefix = true;
        t0 = t;
        let decree = null;
        let pt = ParenthesisToken.tryAttach(t);
        if (pt !== null) {
            decree = pt.ref;
            t = pt.endToken.next;
            if (t !== null && t.isChar(',')) 
                t = t.next;
        }
        if (t === null) 
            return null;
        let r0 = t0;
        let r1 = null;
        let l0 = null;
        for (; t !== null; t = t.next) {
            if (t !== t0 && MiscHelper.canBeStartOfSentence(t)) 
                break;
            if (maxChar > 0 && t.endChar > maxChar) 
                break;
            if (t.isValue("НАЗЫВАТЬ", null) || t.isValue("ИМЕНОВАТЬ", null)) {
            }
            else 
                continue;
            r1 = t.previous;
            for (let tt = r1; tt !== null; tt = tt.previous) {
                if ((tt.isValue("БУДЕМ", null) || tt.isValue("ДАЛЬНЕЙШИЙ", null) || tt.isValue("ДАЛЕЕ", null)) || tt.isValue("В", null)) 
                    r1 = tt.previous;
                else 
                    break;
            }
            l0 = t.next;
            for (let tt = l0; tt !== null; tt = tt.next) {
                if ((tt.isValue("БУДЕМ", null) || tt.isValue("ДАЛЬНЕЙШИЙ", null) || tt.isValue("ДАЛЕЕ", null)) || tt.isValue("В", null)) 
                    l0 = tt.next;
                else 
                    break;
            }
            break;
        }
        if (l0 === null || r1 === null) 
            return null;
        let l1 = null;
        let cou = 0;
        for (t = l0; t !== null; t = t.next) {
            let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
            if (npt === null && t !== l0 && t.morph._class.isPreposition) 
                npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
            if (npt === null) 
                break;
            l1 = (t = npt.endToken);
            cou++;
        }
        if (l1 === null || cou > 3) 
            return null;
        if ((((l1.endChar - l0.endChar)) * 2) > ((r1.endChar - r0.endChar))) 
            return null;
        let dr = DefinitionReferent._new1176(DefinitionKind.DEFINITION);
        let nam = MiscHelper.getTextValue(l0, l1, GetTextAttr.FIRSTNOUNGROUPTONOMINATIVE);
        if (nam === null) 
            return null;
        dr.addSlot(DefinitionReferent.ATTR_TERMIN, nam, false, 0);
        let df = MiscHelper.getTextValue(r0, r1, GetTextAttr.KEEPREGISTER);
        dr.addSlot(DefinitionReferent.ATTR_VALUE, df, false, 0);
        t = l1.next;
        if (t === null) {
        }
        else if (t.isCharOf(".;")) 
            l1 = t;
        else if (t.isComma) 
            l1 = t;
        else if (MiscHelper.canBeStartOfSentence(t)) {
        }
        else 
            return null;
        let res = new Array();
        res.push(new ReferentToken(dr, r0, l1));
        return res;
    }
    
    static _tryAttachMiscToken(t) {
        if (t === null) 
            return null;
        if (t.isChar('(')) {
            let mt = DefinitionAnalyzer._tryAttachMiscToken(t.next);
            if (mt !== null && mt.endToken.next !== null && mt.endToken.next.isChar(')')) {
                mt.beginToken = t;
                mt.endToken = mt.endToken.next;
                return mt;
            }
            return null;
        }
        if (t.isValue("КАК", null)) {
            let t1 = null;
            for (let tt = t.next; tt !== null; tt = tt.next) {
                if (tt.isNewlineBefore) 
                    break;
                let npt1 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.NO, 0, null);
                if (npt1 === null) 
                    break;
                if (t1 === null || npt1.morph._case.isGenitive) {
                    t1 = (tt = npt1.endToken);
                    continue;
                }
                break;
            }
            if (t1 !== null) {
                let res = MetaToken._new806(t, t1, MiscHelper.getTextValue(t, t1, GetTextAttr.KEEPQUOTES));
                res.morph._class = MorphClass.NOUN;
                return res;
            }
            return null;
        }
        let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSENUMERICASADJECTIVE, 0, null);
        if (npt !== null) {
            if (DefinitionAnalyzer.m_MiscFirstWords.tryParse(npt.noun.beginToken, TerminParseAttr.NO) !== null) {
                let res = MetaToken._new806(t, npt.endToken, npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false));
                res.morph._case = MorphCase.NOMINATIVE;
                return res;
            }
        }
        if (t.isValue("В", null)) {
            npt = NounPhraseHelper.tryParse(t.next, NounPhraseParseAttr.NO, 0, null);
            if (npt !== null) {
                if (npt.noun.isValue("СМЫСЛ", null)) {
                    let res = MetaToken._new806(t, npt.endToken, MiscHelper.getTextValue(t, npt.endToken, GetTextAttr.NO));
                    res.morph._class = MorphClass.NOUN;
                    return res;
                }
            }
        }
        return null;
    }
    
    static _tryParseListItem(t) {
        if (t === null || !t.isWhitespaceBefore) 
            return null;
        let tt = null;
        let pr = 0;
        for (tt = t; tt !== null; tt = tt.next) {
            if (tt.isWhitespaceBefore && tt !== t) 
                break;
            if (tt instanceof NumberToken) {
                pr++;
                continue;
            }
            let nex = NumberHelper.tryParseRoman(tt);
            if (nex !== null) {
                pr++;
                tt = nex.endToken;
                continue;
            }
            if (!(tt instanceof TextToken)) 
                break;
            if (!tt.chars.isLetter) {
                if (!tt.isChar('(')) 
                    pr++;
            }
            else if (tt.lengthChar > 1 || tt.isWhitespaceAfter) 
                break;
            else 
                pr++;
        }
        if (tt === null) 
            return null;
        if (pr === 0) {
            if (t.isChar('(')) 
                return null;
            if ((tt instanceof TextToken) && tt.chars.isAllLower) 
                pr++;
        }
        if (pr === 0) 
            return null;
        let res = new MetaToken(tt, tt);
        for (; tt !== null; tt = tt.next) {
            if (tt.isNewlineBefore && tt !== t) 
                break;
            else 
                res.endToken = tt;
        }
        return res;
    }
    
    static initialize() {
        if (DefinitionAnalyzer.m_Proc0 !== null) 
            return;
        MetaDefin.initialize();
        try {
            DefinitionAnalyzer.m_Proc0 = ProcessorService.createEmptyProcessor();
            Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
            DefinitionAnalyzer.m_MiscFirstWords = new TerminCollection();
            for (const s of ["ЧЕРТА", "ХАРАКТЕРИСТИКА", "ОСОБЕННОСТЬ", "СВОЙСТВО", "ПРИЗНАК", "ПРИНЦИП", "РАЗНОВИДНОСТЬ", "ВИД", "ПОКАЗАТЕЛЬ", "ЗНАЧЕНИЕ"]) {
                DefinitionAnalyzer.m_MiscFirstWords.add(new Termin(s, MorphLang.RU, true));
            }
            DefinitionAnalyzer.m_VerbotFirstWords = new TerminCollection();
            for (const s of ["ЦЕЛЬ", "БОЛЬШИНСТВО", "ЧАСТЬ", "ЗАДАЧА", "ИСКЛЮЧЕНИЕ", "ПРИМЕР", "ЭТАП", "ШАГ", "СЛЕДУЮЩИЙ", "ПОДОБНЫЙ", "АНАЛОГИЧНЫЙ", "ПРЕДЫДУЩИЙ", "ПОХОЖИЙ", "СХОЖИЙ", "НАЙДЕННЫЙ", "НАИБОЛЕЕ", "НАИМЕНЕЕ", "ВАЖНЫЙ", "РАСПРОСТРАНЕННЫЙ"]) {
                DefinitionAnalyzer.m_VerbotFirstWords.add(new Termin(s, MorphLang.RU, true));
            }
            DefinitionAnalyzer.m_VerbotLastWords = new TerminCollection();
            for (const s of ["СТАТЬЯ", "ГЛАВА", "РАЗДЕЛ", "КОДЕКС", "ЗАКОН", "ФОРМУЛИРОВКА", "НАСТОЯЩИЙ", "ВЫШЕУКАЗАННЫЙ", "ДАННЫЙ"]) {
                DefinitionAnalyzer.m_VerbotLastWords.add(new Termin(s, MorphLang.RU, true));
            }
            ParenthesisToken.initialize();
        } catch (ex) {
            throw new Error(ex.message);
        }
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
        ProcessorService.registerAnalyzer(new DefinitionAnalyzer());
    }
    
    /**
     * Вычисление коэффициента семантической близости 2-х текстов. 
     * Учитываются именные группы (существительные с возможными прилагательными).
     * @param text1 первый текст
     * @param text2 второй текст
     * @return 0 - ничего общего, 100 - полное соответствие (тождество)
     */
    static calcSemanticCoef(text1, text2) {
        try {
            let ar1 = DefinitionAnalyzer.m_Proc0.process(new SourceOfAnalysis(text1), null, null);
            if (ar1 === null || ar1.firstToken === null) 
                return 0;
            let ar2 = DefinitionAnalyzer.m_Proc0.process(new SourceOfAnalysis(text2), null, null);
            if (ar2 === null || ar2.firstToken === null) 
                return 0;
            let terms1 = new Array();
            let terms2 = new Array();
            for (let k = 0; k < 2; k++) {
                let terms = (k === 0 ? terms1 : terms2);
                for (let t = (k === 0 ? ar1.firstToken : ar2.firstToken); t !== null; t = t.next) {
                    let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.NO, 0, null);
                    if (npt !== null) {
                        let term = npt.getNormalCaseText(null, MorphNumber.SINGULAR, MorphGender.UNDEFINED, false);
                        if (term === null) 
                            continue;
                        if (!terms.includes(term)) 
                            terms.push(term);
                        continue;
                    }
                }
            }
            if (terms2.length === 0 || terms1.length === 0) 
                return 0;
            let coef = 0;
            for (const w of terms1) {
                if (terms2.includes(w)) 
                    coef += 2;
            }
            return Utils.intDiv(coef * 100, (terms1.length + terms2.length));
        } catch (ex) {
            return 0;
        }
    }
    
    /**
     * Выделить ключевые концепты из текста. 
     * Концепт - это нормализованная комбинация ключевых слов, причём дериватная нормализация 
     * (СЛУЖИТЬ -> СЛУЖБА).
     * @param txt текст
     * @param doNormalizeForEnglish делать ли для английского языка нормализацию по дериватам
     * @return список концептов
     */
    static getConcepts(txt, doNormalizeForEnglish = false) {
        let ar = null;
        try {
            ar = DefinitionAnalyzer.m_Proc0.process(new SourceOfAnalysis(txt), null, null);
        } catch (ex) {
            return null;
        }
        let res = new Array();
        let tmp = new Array();
        let tmp2 = new StringBuilder();
        if (ar !== null) {
            for (let t = ar.firstToken; t !== null; t = t.next) {
                let t1 = null;
                let npt = NounPhraseHelper.tryParse(t, NounPhraseParseAttr.PARSENUMERICASADJECTIVE, 0, null);
                if (npt !== null) 
                    t1 = npt.endToken;
                else if ((t instanceof TextToken) && t.isPureVerb) 
                    t1 = t;
                if (t1 === null) 
                    continue;
                for (let tt = t1.next; tt !== null; tt = tt.next) {
                    let npt2 = null;
                    if (tt.isAnd) {
                        npt2 = NounPhraseHelper.tryParse(tt.next, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()) | (NounPhraseParseAttr.PARSEPREPOSITION.value())), 0, null);
                        if (npt2 !== null) {
                            tt = (t1 = npt2.endToken);
                            continue;
                        }
                        break;
                    }
                    npt2 = NounPhraseHelper.tryParse(tt, NounPhraseParseAttr.of((NounPhraseParseAttr.PARSENUMERICASADJECTIVE.value()) | (NounPhraseParseAttr.PARSEPREPOSITION.value())), 0, null);
                    if (npt2 !== null) {
                        if (npt2.preposition !== null) {
                            tt = (t1 = npt2.endToken);
                            continue;
                        }
                        else if (npt2.morph._case.isGenitive || npt2.morph._case.isInstrumental) {
                            tt = (t1 = npt2.endToken);
                            continue;
                        }
                    }
                    break;
                }
                let vars = new Array();
                for (let tt = t; tt !== null && tt.endChar <= t1.endChar; tt = tt.next) {
                    if (!(tt instanceof TextToken)) 
                        continue;
                    if (tt.isCommaAnd || t.morph._class.isPreposition) 
                        continue;
                    let w = tt.lemma;
                    if (w.length < 3) 
                        continue;
                    if (tt.chars.isLatinLetter && !doNormalizeForEnglish) {
                    }
                    else {
                        let dg = DerivateService.findDerivates(w, true, null);
                        if (dg !== null && dg.length === 1) {
                            if (dg[0].words.length > 0) 
                                w = dg[0].words[0].spelling.toUpperCase();
                        }
                    }
                    if (tt.previous !== null && tt.previous.isCommaAnd && vars.length > 0) 
                        vars[vars.length - 1].push(w);
                    else {
                        let li = new Array();
                        li.push(w);
                        vars.push(li);
                    }
                }
                t = t1;
                if (vars.length === 0) 
                    continue;
                let inds = new Int32Array(vars.length);
                while (true) {
                    tmp.splice(0, tmp.length);
                    for (let i = 0; i < vars.length; i++) {
                        let w = vars[i][inds[i]];
                        if (!tmp.includes(w)) 
                            tmp.push(w);
                    }
                    tmp.sort();
                    tmp2.length = 0;
                    for (let i = 0; i < tmp.length; i++) {
                        if (tmp2.length > 0) 
                            tmp2.append(' ');
                        tmp2.append(tmp[i]);
                    }
                    let ww = tmp2.toString();
                    if (!res.includes(ww)) 
                        res.push(ww);
                    let j = 0;
                    for (j = vars.length - 1; j >= 0; j--) {
                        if ((inds[j] + 1) < vars[j].length) {
                            inds[j]++;
                            break;
                        }
                        else 
                            inds[j] = 0;
                    }
                    if (j < 0) 
                        break;
                }
            }
        }
        return res;
    }
    
    static static_constructor() {
        DefinitionAnalyzer.ANALYZER_NAME = "THESIS";
        DefinitionAnalyzer.m_MiscFirstWords = null;
        DefinitionAnalyzer.m_VerbotFirstWords = null;
        DefinitionAnalyzer.m_VerbotLastWords = null;
        DefinitionAnalyzer.m_Proc0 = null;
    }
}


DefinitionAnalyzer.static_constructor();

module.exports = DefinitionAnalyzer