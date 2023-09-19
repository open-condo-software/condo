/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");
const StringBuilder = require("./../../unisharp/StringBuilder");

const TextAnnotation = require("./../TextAnnotation");
const MorphWordForm = require("./../../morph/MorphWordForm");
const MorphLang = require("./../../morph/MorphLang");
const ReferentToken = require("./../ReferentToken");
const SourceOfAnalysis = require("./../SourceOfAnalysis");
const Referent = require("./../Referent");
const GeneralRelationHelper = require("./internal/GeneralRelationHelper");
const StatisticCollection = require("./StatisticCollection");
const ProcessorService = require("./../ProcessorService");
const Token = require("./../Token");
const MorphologyService = require("./../../morph/MorphologyService");
const TextToken = require("./../TextToken");
const SerializerHelper = require("./internal/SerializerHelper");
const MetaToken = require("./../MetaToken");
const NumberToken = require("./../NumberToken");
const NumberHelper = require("./NumberHelper");

/**
 * Внутренний аналитический контейнер данных. Создаётся автоматически внутри при вызове Processor.Process(...). 
 * Все токены Token ссылаются через поле Kit на экземпляр контейнера, связанного с обрабатываемым текстом.
 * 
 * Контейнер данных
 */
class AnalysisKit {
    
    constructor(_sofa = null, onlyTokenizing = false, lang = null, progress = null) {
        this.startDate = new Date(1, 1 - 1, 1, 0, 0, 0);
        this.correctedTokens = null;
        this.firstToken = null;
        this.m_Entities = new Array();
        this.ontology = null;
        this.baseLanguage = new MorphLang();
        this.m_Sofa = null;
        this.statistics = null;
        this.m_Datas = new Hashtable();
        this.miscData = new Hashtable();
        this.processor = null;
        this.level = 0;
        this.m_AnalyzerStack = new Array();
        this.ontoRegime = false;
        this.msgs = new Array();
        if (_sofa === null) 
            return;
        this.m_Sofa = _sofa;
        this.startDate = Utils.now();
        let tokens = MorphologyService.process(_sofa.text, lang, null);
        let t0 = null;
        if (tokens !== null) {
            for (let ii = 0; ii < tokens.length; ii++) {
                let mt = tokens[ii];
                if (mt.beginChar === 733860) {
                }
                let tt = new TextToken(mt, this);
                if (_sofa.correctionDict !== null) {
                    let corw = null;
                    let wrapcorw774 = new RefOutArgWrapper();
                    let inoutres775 = _sofa.correctionDict.tryGetValue(mt.term, wrapcorw774);
                    corw = wrapcorw774.value;
                    if (inoutres775) {
                        let ccc = MorphologyService.process(corw, lang, null);
                        if (ccc !== null && ccc.length === 1) {
                            let tt1 = TextToken._new773(ccc[0], this, tt.beginChar, tt.endChar, tt.term);
                            tt1.chars = tt.chars;
                            tt = tt1;
                            if (this.correctedTokens === null) 
                                this.correctedTokens = new Hashtable();
                            this.correctedTokens.put(tt, tt.getSourceText());
                        }
                    }
                }
                if (t0 === null) 
                    this.firstToken = tt;
                else 
                    t0.next = tt;
                t0 = tt;
                let www = t0.whitespacesBeforeCount;
            }
        }
        if (_sofa.clearDust) 
            this.clearDust();
        if (_sofa.doWordsMergingByMorph) 
            this.correctWordsByMerging(lang);
        if (_sofa.doWordCorrectionByMorph) 
            this.correctWordsByMorph(lang);
        this.mergeLetters();
        this.defineBaseLanguage();
        if (_sofa.createNumberTokens) {
            for (let t = this.firstToken; t !== null; t = t.next) {
                let nt = NumberHelper.tryParseNumber(t);
                if (nt === null) 
                    continue;
                this.embedToken(nt);
                t = nt;
            }
        }
        if (onlyTokenizing) 
            return;
        for (let t = this.firstToken; t !== null; t = t.next) {
            if (t.morph._class.isPreposition) 
                continue;
            let mc = t.getMorphClassInDictionary();
            if (mc.isUndefined && t.chars.isCyrillicLetter && t.lengthChar > 4) {
                let tail = _sofa.text.substring(t.endChar - 1, t.endChar - 1 + 2);
                let tte = null;
                let tt = t.previous;
                if (tt !== null && ((tt.isCommaAnd || tt.morph._class.isPreposition || tt.morph._class.isConjunction))) 
                    tt = tt.previous;
                if ((tt !== null && !tt.getMorphClassInDictionary().isUndefined && (((tt.morph._class.value) & (t.morph._class.value))) !== 0) && tt.lengthChar > 4) {
                    let tail2 = _sofa.text.substring(tt.endChar - 1, tt.endChar - 1 + 2);
                    if (tail2 === tail) 
                        tte = tt;
                }
                if (tte === null) {
                    tt = t.next;
                    if (tt !== null && ((tt.isCommaAnd || tt.morph._class.isPreposition || tt.morph._class.isConjunction))) 
                        tt = tt.next;
                    if ((tt !== null && !tt.getMorphClassInDictionary().isUndefined && (((tt.morph._class.value) & (t.morph._class.value))) !== 0) && tt.lengthChar > 4) {
                        let tail2 = _sofa.text.substring(tt.endChar - 1, tt.endChar - 1 + 2);
                        if (tail2 === tail) 
                            tte = tt;
                    }
                }
                if (tte !== null) 
                    t.morph.removeItemsEx(tte.morph, tte.getMorphClassInDictionary());
            }
            continue;
        }
        this.createStatistics();
    }
    
    initFrom(ar) {
        this.m_Sofa = ar.sofa;
        this.firstToken = ar.firstToken;
        this.baseLanguage = ar.baseLanguage;
        this.createStatistics();
    }
    
    clearDust() {
        for (let t = this.firstToken; t !== null; t = t.next) {
            let cou = AnalysisKit.calcAbnormalCoef(t);
            let norm = 0;
            if (cou < 1) 
                continue;
            let t1 = t;
            for (let tt = t; tt !== null; tt = tt.next) {
                let co = AnalysisKit.calcAbnormalCoef(tt);
                if (co === 0) 
                    continue;
                if (co < 0) {
                    norm++;
                    if (norm > 1) 
                        break;
                }
                else {
                    norm = 0;
                    cou += co;
                    t1 = tt;
                }
            }
            let len = t1.endChar - t.beginChar;
            if (cou > 20 && len > 500) {
                for (let p = t.beginChar; p < t1.endChar; p++) {
                    if (this.sofa.text[p] === this.sofa.text[p + 1]) 
                        len--;
                }
                if (len > 500) {
                    if (t.previous !== null) 
                        t.previous.next = t1.next;
                    else 
                        this.firstToken = t1.next;
                    t = t1;
                }
                else 
                    t = t1;
            }
            else 
                t = t1;
        }
    }
    
    static calcAbnormalCoef(t) {
        if (t instanceof NumberToken) 
            return 0;
        let tt = Utils.as(t, TextToken);
        if (tt === null) 
            return 0;
        if (!tt.chars.isLetter) 
            return 0;
        if (!tt.chars.isLatinLetter && !tt.chars.isCyrillicLetter) 
            return 2;
        if (tt.lengthChar < 4) 
            return 0;
        for (const wf of tt.morph.items) {
            if (wf.isInDictionary) 
                return -1;
        }
        if (tt.lengthChar > 15) 
            return 2;
        return 1;
    }
    
    correctWordsByMerging(lang) {
        for (let t = this.firstToken; t !== null && t.next !== null; t = t.next) {
            if (!t.chars.isLetter || (t.lengthChar < 2)) 
                continue;
            let mc0 = t.getMorphClassInDictionary();
            if (t.morph.containsAttr("прдктв.", null)) 
                continue;
            let t1 = t.next;
            if (t1.isHiphen && t1.next !== null && !t1.isNewlineAfter) 
                t1 = t1.next;
            if (t1.lengthChar === 1) 
                continue;
            if (!t1.chars.isLetter || !t.chars.isLetter || t1.chars.isLatinLetter !== t.chars.isLatinLetter) 
                continue;
            if (t1.chars.isAllUpper && !t.chars.isAllUpper) 
                continue;
            else if (!t1.chars.isAllLower) 
                continue;
            else if (t.chars.isAllUpper) 
                continue;
            if (t1.morph.containsAttr("прдктв.", null)) 
                continue;
            let mc1 = t1.getMorphClassInDictionary();
            if (!mc1.isUndefined && !mc0.isUndefined) 
                continue;
            if ((t.term.length + t1.term.length) < 6) 
                continue;
            let corw = t.term + t1.term;
            let ccc = MorphologyService.process(corw, lang, null);
            if (ccc === null || ccc.length !== 1) 
                continue;
            if (corw === "ПОСТ" || corw === "ВРЕД") 
                continue;
            let tt = new TextToken(ccc[0], this, t.beginChar, t1.endChar);
            if (tt.getMorphClassInDictionary().isUndefined) 
                continue;
            tt.chars = t.chars;
            if (t === this.firstToken) 
                this.firstToken = tt;
            else 
                t.previous.next = tt;
            if (t1.next !== null) 
                tt.next = t1.next;
            t = tt;
        }
    }
    
    correctWordByMorph(tt, lang) {
        if (!(tt instanceof TextToken)) 
            return null;
        if (tt.morph.containsAttr("прдктв.", null)) 
            return null;
        let dd = tt.getMorphClassInDictionary();
        if (!dd.isUndefined || (tt.lengthChar < 4)) 
            return null;
        if (tt.morph._class.isProperSurname && !tt.chars.isAllLower) 
            return null;
        if (tt.chars.isAllUpper) 
            return null;
        let corw = MorphologyService.correctWord(tt.term, (tt.morph.language.isUndefined ? lang : tt.morph.language));
        if (corw === null) 
            return null;
        let ccc = MorphologyService.process(corw, lang, null);
        if (ccc === null || ccc.length !== 1) 
            return null;
        let tt1 = TextToken._new776(ccc[0], this, tt.beginChar, tt.endChar, tt.chars, tt.term);
        let mc = tt1.getMorphClassInDictionary();
        if (mc.isProperSurname) 
            return null;
        if (tt === this.firstToken) 
            this.firstToken = tt1;
        else 
            tt.previous.next = tt1;
        tt1.next = tt.next;
        tt = tt1;
        if (this.correctedTokens === null) 
            this.correctedTokens = new Hashtable();
        this.correctedTokens.put(tt, tt.getSourceText());
        return tt;
    }
    
    correctWordsByMorph(lang) {
        for (let tt = this.firstToken; tt !== null; tt = tt.next) {
            let t = this.correctWordByMorph(tt, lang);
            if (t !== null) 
                tt = t;
        }
    }
    
    mergeLetters() {
        let beforeWord = false;
        let tmp = new StringBuilder();
        for (let t = this.firstToken; t !== null; t = t.next) {
            let tt = Utils.as(t, TextToken);
            if (!tt.chars.isLetter || tt.lengthChar !== 1) {
                beforeWord = false;
                continue;
            }
            let i = t.whitespacesBeforeCount;
            if (i > 2 || ((i === 2 && beforeWord))) {
            }
            else {
                beforeWord = false;
                continue;
            }
            i = 0;
            let t1 = null;
            tmp.length = 0;
            tmp.append(tt.getSourceText());
            for (t1 = t; t1.next !== null; t1 = t1.next) {
                tt = Utils.as(t1.next, TextToken);
                if (tt.lengthChar !== 1 || tt.whitespacesBeforeCount !== 1) 
                    break;
                i++;
                tmp.append(tt.getSourceText());
            }
            if (i > 3 || ((i > 1 && beforeWord))) {
            }
            else {
                beforeWord = false;
                continue;
            }
            beforeWord = false;
            let mt = MorphologyService.process(tmp.toString(), null, null);
            if (mt === null || mt.length !== 1) {
                t = t1;
                continue;
            }
            for (const wf of mt[0].wordForms) {
                if (wf.isInDictionary) {
                    beforeWord = true;
                    break;
                }
            }
            if (!beforeWord) {
                t = t1;
                continue;
            }
            tt = new TextToken(mt[0], this, t.beginChar, t1.endChar);
            if (t === this.firstToken) 
                this.firstToken = tt;
            else 
                tt.previous = t.previous;
            tt.next = t1.next;
            t = tt;
        }
    }
    
    /**
     * Встроить токен в основную цепочку токенов
     * @param mt встраиваемый метатокен
     * 
     */
    embedToken(mt) {
        if (mt === null) 
            return;
        if (mt.beginChar > mt.endChar) {
            let bg = mt.beginToken;
            mt.beginToken = mt.endToken;
            mt.endToken = bg;
        }
        if (mt.beginChar > mt.endChar) 
            return;
        if (mt.beginToken.beginChar === this.firstToken.beginChar) 
            this.firstToken = mt;
        else {
            let tp = mt.beginToken.previous;
            mt.previous = tp;
        }
        let tn = mt.endToken.next;
        mt.next = tn;
        if (mt instanceof ReferentToken) {
            if (mt.referent !== null) 
                mt.referent.addOccurence(TextAnnotation._new777(this.sofa, mt.beginChar, mt.endChar));
        }
    }
    
    /**
     * Убрать метатокен из цепочки, восстановив исходное
     * @param t удаляемый из цепочки метатокен
     * @return первый токен удалённого метатокена
     * 
     */
    debedToken(t) {
        let r = t.getReferent();
        if (r !== null) {
            for (const o of r.occurrence) {
                if (o.beginChar === t.beginChar && o.endChar === t.endChar) {
                    Utils.removeItem(r.occurrence, o);
                    break;
                }
            }
        }
        let mt = Utils.as(t, MetaToken);
        if (mt === null) 
            return t;
        if (t.next !== null) 
            t.next.previous = mt.endToken;
        if (t.previous !== null) 
            t.previous.next = mt.beginToken;
        if (mt === this.firstToken) 
            this.firstToken = mt.beginToken;
        if (r !== null && r.occurrence.length === 0) {
            for (const d of this.m_Datas.values) {
                if (d.referents.includes(r)) {
                    d.removeReferent(r);
                    break;
                }
            }
        }
        return mt.beginToken;
    }
    
    get entities() {
        return this.m_Entities;
    }
    
    get sofa() {
        if (this.m_Sofa === null) 
            this.m_Sofa = new SourceOfAnalysis("");
        return this.m_Sofa;
    }
    set sofa(value) {
        this.m_Sofa = value;
        return value;
    }
    
    /**
     * Получить символ из исходного текста
     * @param position позиция
     * @return символ (0, если выход за границу)
     */
    getTextCharacter(position) {
        if ((position < 0) || position >= this.m_Sofa.text.length) 
            return String.fromCharCode(0);
        return this.m_Sofa.text[position];
    }
    
    /**
     * Получить данные, полученные в настоящий момент конкретным анализатором
     * @param analyzerName имя анализатора
     * @return связанные с ним данные
     */
    getAnalyzerDataByAnalyzerName(analyzerName) {
        let a = this.processor.findAnalyzer(analyzerName);
        if (a === null) 
            return null;
        return this.getAnalyzerData(a);
    }
    
    // Получить данные, полученные в настоящий момент конкретным анализатором
    getAnalyzerData(analyzer) {
        if (analyzer === null || analyzer.name === null) 
            return null;
        let d = null;
        let wrapd778 = new RefOutArgWrapper();
        let inoutres779 = this.m_Datas.tryGetValue(analyzer.name, wrapd778);
        d = wrapd778.value;
        if (inoutres779) {
            d.kit = this;
            return d;
        }
        let defaultData = analyzer.createAnalyzerData();
        if (defaultData === null) 
            return null;
        if (analyzer.persistReferentsRegim) {
            if (analyzer.persistAnalizerData === null) 
                analyzer.persistAnalizerData = defaultData;
            else 
                defaultData = analyzer.persistAnalizerData;
        }
        this.m_Datas.put(analyzer.name, defaultData);
        defaultData.kit = this;
        return defaultData;
    }
    
    removeAnalyzerDataByAnalyzerName(analyzerName) {
        if (this.m_Datas.containsKey((analyzerName != null ? analyzerName : ""))) 
            this.m_Datas.remove((analyzerName != null ? analyzerName : ""));
    }
    
    createStatistics() {
        this.statistics = new StatisticCollection();
        this.statistics.prepare(this.firstToken);
    }
    
    defineBaseLanguage() {
        let stat = new Hashtable();
        let total = 0;
        for (let t = this.firstToken; t !== null; t = t.next) {
            let tt = Utils.as(t, TextToken);
            if (tt === null) 
                continue;
            if (tt.morph.language.isUndefined) 
                continue;
            if (!stat.containsKey(tt.morph.language.value)) 
                stat.put(tt.morph.language.value, 1);
            else 
                stat.put(tt.morph.language.value, stat.get(tt.morph.language.value) + 1);
            total++;
        }
        let val = 0;
        for (const kp of stat.entries) {
            if (kp.value > (Utils.intDiv(total, 2))) 
                val |= kp.key;
        }
        this.baseLanguage.value = val;
    }
    
    // Заменить везде, где только возможно, старую сущность на новую (используется при объединении сущностей)
    replaceReferent(oldReferent, newReferent) {
        for (let t = this.firstToken; t !== null; t = t.next) {
            if (t instanceof ReferentToken) 
                t.replaceReferent(oldReferent, newReferent);
        }
        for (const d of this.m_Datas.values) {
            for (const r of d.referents) {
                for (const s of r.slots) {
                    if (s.value === oldReferent) 
                        r.uploadSlot(s, newReferent);
                }
            }
            if (d.referents.includes(oldReferent)) 
                Utils.removeItem(d.referents, oldReferent);
        }
    }
    
    /**
     * Попытаться выделить с заданного токена сущность указанным анализатором. 
     * Используется, если нужно "забежать вперёд" и проверить гипотезу, есть ли тут сущность конкретного типа или нет.
     * @param analyzerName имя анализатора
     * @param t токен, с которого попробовать выделение
     * @param param параметр, поддерживаемый анализатором
     * @return метатокен с сущностью ReferentToken или null. Отметим, что сущность не сохранена и полученный метатокен никуда не встроен.
     * 
     */
    processReferent(analyzerName, t, param = null) {
        if (this.processor === null) 
            return null;
        if (this.m_AnalyzerStack.includes(analyzerName)) 
            return null;
        let a = this.processor.findAnalyzer(analyzerName);
        if (a === null) 
            return null;
        this.m_AnalyzerStack.push(analyzerName);
        let res = a.processReferent(t, param);
        Utils.removeItem(this.m_AnalyzerStack, analyzerName);
        if (res !== null) {
        }
        return res;
    }
    
    fixAnalyzer(analyzerName, ban) {
        if (ban) 
            this.m_AnalyzerStack.push(analyzerName);
        else if (this.m_AnalyzerStack.includes(analyzerName)) 
            Utils.removeItem(this.m_AnalyzerStack, analyzerName);
    }
    
    /**
     * Создать экземпляр сущности заданного типа
     * @param typeName имя типа сущности
     * @return экземпляр класса, наследного от Referent, или null
     */
    createReferent(typeName) {
        if (this.processor !== null) {
            for (const a of this.processor.analyzers) {
                let res = a.createReferent(typeName);
                if (res !== null) 
                    return res;
            }
        }
        return ProcessorService.createReferent(typeName);
    }
    
    refreshGenerals() {
        GeneralRelationHelper.refreshGenerals(this.processor, this);
    }
    
    serialize(stream, newFormat = false) {
        stream.writeByte(0xAA);
        stream.writeByte((newFormat ? 2 : 1));
        this.m_Sofa.serialize(stream);
        SerializerHelper.serializeInt(stream, this.baseLanguage.value);
        if (this.m_Entities.length === 0) {
            for (const d of this.m_Datas.entries) {
                this.m_Entities.splice(this.m_Entities.length, 0, ...d.value.referents);
            }
        }
        SerializerHelper.serializeInt(stream, this.m_Entities.length);
        for (let i = 0; i < this.m_Entities.length; i++) {
            this.m_Entities[i].tag = i + 1;
            SerializerHelper.serializeString(stream, this.m_Entities[i].typeName);
        }
        for (const e of this.m_Entities) {
            e.serialize(stream, newFormat);
        }
        SerializerHelper.serializeTokens(stream, this.firstToken, 0);
    }
    
    deserialize(stream) {
        let vers = 0;
        let b = stream.readByte();
        if (b === (0xAA)) {
            b = stream.readByte();
            vers = b;
        }
        else 
            stream.position = stream.position - (1);
        this.m_Sofa = new SourceOfAnalysis(null);
        this.m_Sofa.deserialize(stream);
        this.baseLanguage = MorphLang._new269(SerializerHelper.deserializeInt(stream));
        this.m_Entities = new Array();
        let cou = SerializerHelper.deserializeInt(stream);
        for (let i = 0; i < cou; i++) {
            let typ = SerializerHelper.deserializeString(stream);
            let r = ProcessorService.createReferent(typ);
            if (r === null) 
                r = new Referent("UNDEFINED");
            this.m_Entities.push(r);
        }
        for (let i = 0; i < cou; i++) {
            this.m_Entities[i].deserialize(stream, this.m_Entities, this.m_Sofa, (b) > 1);
        }
        this.firstToken = SerializerHelper.deserializeTokens(stream, this, vers);
        this.createStatistics();
        return true;
    }
    
    static _new2938(_arg1, _arg2) {
        let res = new AnalysisKit();
        res.processor = _arg1;
        res.ontology = _arg2;
        return res;
    }
    
    static _new2939(_arg1, _arg2, _arg3, _arg4, _arg5, _arg6, _arg7) {
        let res = new AnalysisKit(_arg1, _arg2, _arg3, _arg4);
        res.ontology = _arg5;
        res.processor = _arg6;
        res.ontoRegime = _arg7;
        return res;
    }
}


module.exports = AnalysisKit