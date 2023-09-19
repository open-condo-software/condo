/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const Hashtable = require("./../unisharp/Hashtable");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");
const EventHandler = require("./../unisharp/EventHandler");
const ProgressEventArgs = require("./../unisharp/ProgressEventArgs");
const Stopwatch = require("./../unisharp/Stopwatch");

const GeneralRelationHelper = require("./core/internal/GeneralRelationHelper");
const MetaToken = require("./MetaToken");
const ProgressPeace = require("./core/internal/ProgressPeace");
const ProcessorService = require("./ProcessorService");
const AnalysisKit = require("./core/AnalysisKit");
const AnalysisResult = require("./AnalysisResult");

/**
 * Лингвистический процессор
 * 
 * Процессор
 */
class Processor {
    
    constructor() {
        this.m_Analyzers = new Array();
        this.m_AnalyzersHash = new Hashtable();
        this.progress = new Array();
        this.m_ProgressPeaces = new Hashtable();
        this.m_ProgressPeacesLock = new Object();
        this.m_Breaked = false;
        this.timeoutSeconds = 0;
        this.lastPercent = 0;
        this.tag = null;
        this._ProgressChangedEventHandler_OnProgressHandler = new Processor.ProgressChangedEventHandler_OnProgressHandler(this);
        this._CancelEventHandler_OnCancel = new Processor.CancelEventHandler_OnCancel(this);
    }
    
    /**
     * Добавить анализатор, если его ещё нет
     * @param a экземпляр анализатора
     */
    addAnalyzer(a) {
        if (a === null || a.name === null || this.m_AnalyzersHash.containsKey(a.name)) 
            return;
        this.m_AnalyzersHash.put(a.name, a);
        this.m_Analyzers.push(a);
        a.progress.push(this._ProgressChangedEventHandler_OnProgressHandler);
        a.cancel.push(this._CancelEventHandler_OnCancel);
    }
    
    /**
     * Удалить анализатор
     * @param a 
     */
    delAnalyzer(a) {
        if (!this.m_AnalyzersHash.containsKey(a.name)) 
            return;
        this.m_AnalyzersHash.remove(a.name);
        Utils.removeItem(this.m_Analyzers, a);
        Utils.removeItem(a.progress, this._ProgressChangedEventHandler_OnProgressHandler);
        Utils.removeItem(a.cancel, this._CancelEventHandler_OnCancel);
    }
    
    close() {
        for (const w of this.analyzers) {
            Utils.removeItem(w.progress, this._ProgressChangedEventHandler_OnProgressHandler);
            Utils.removeItem(w.cancel, this._CancelEventHandler_OnCancel);
        }
    }
    
    get analyzers() {
        return this.m_Analyzers;
    }
    
    /**
     * Найти анализатор по его имени
     * @param name 
     * @return 
     */
    findAnalyzer(name) {
        let a = null;
        let wrapa2936 = new RefOutArgWrapper();
        let inoutres2937 = this.m_AnalyzersHash.tryGetValue((name != null ? name : ""), wrapa2936);
        a = wrapa2936.value;
        if (inoutres2937) 
            return a;
        if (Utils.isNullOrEmpty(name)) 
            return null;
        for (const aa of ProcessorService.getAnalyzers()) {
            if (aa.name === name) {
                a = aa.clone();
                a.ignoreThisAnalyzer = true;
                this.m_Analyzers.push(a);
                this.m_AnalyzersHash.put(name, a);
                return a;
            }
        }
        return null;
    }
    
    /**
     * Обработать текст
     * @param text входной контейнер текста
     * @param extOntology внешняя онтология (null - не используется)
     * @param lang язык (если не задан, то будет определён автоматически)
     * @return аналитический контейнер с результатом
     * 
     */
    process(text, extOntology = null, lang = null) {
        return this._process(text, false, false, extOntology, lang);
    }
    
    /**
     * Доделать результат, который был сделан другим процессором
     * @param ar то, что было сделано другим процессором
     */
    processNext(ar) {
        if (ar === null) 
            return;
        let kit = AnalysisKit._new2938(this, ar.ontology);
        kit.initFrom(ar);
        this._process2(kit, ar, false);
        this._createRes(kit, ar, ar.ontology, false);
        ar.firstToken = kit.firstToken;
    }
    
    _process(text, ontoRegine, noLog, extOntology = null, lang = null) {
        this.m_Breaked = false;
        this.prepareProgress();
        let sw0 = new Stopwatch();
        if (!noLog) 
            this.onProgressHandler(this, new ProgressEventArgs(0, "Морфологический анализ"));
        let kit = AnalysisKit._new2939(text, false, lang, this._ProgressChangedEventHandler_OnProgressHandler, extOntology, this, ontoRegine);
        let ar = new AnalysisResult();
        sw0.stop();
        let msg = null;
        this.onProgressHandler(this, new ProgressEventArgs(100, "Морфологический анализ завершён"));
        let k = 0;
        for (let t = kit.firstToken; t !== null; t = t.next) {
            k++;
        }
        if (!noLog) {
            msg = ("Из " + text.text.length + " символов текста выделено " + k + " термов за " + sw0.elapsedMilliseconds + " ms");
            if (!kit.baseLanguage.isUndefined) 
                msg += (", базовый язык " + kit.baseLanguage.toString());
            this.onMessage(msg);
            ar.log.push(msg);
            if (text.crlfCorrectedCount > 0) 
                ar.log.push((String(text.crlfCorrectedCount) + " переходов на новую строку заменены на пробел"));
            if (kit.firstToken === null) 
                ar.log.push("Пустой текст");
        }
        sw0.start();
        if (kit.firstToken !== null) 
            this._process2(kit, ar, noLog);
        if (!ontoRegine) 
            this._createRes(kit, ar, extOntology, noLog);
        sw0.stop();
        if (!noLog) {
            if (sw0.elapsedMilliseconds > (5000)) {
                let f = text.text.length;
                f /= (sw0.elapsedMilliseconds);
                msg = ("Обработка " + text.text.length + " знаков выполнена за " + Processor.outSecs(sw0.elapsedMilliseconds) + " (" + f + " Kb/sec)");
            }
            else 
                msg = ("Обработка " + text.text.length + " знаков выполнена за " + Processor.outSecs(sw0.elapsedMilliseconds));
            this.onMessage(msg);
            ar.log.push(msg);
        }
        ar.sofa = text;
        if (!ontoRegine) 
            ar.entities.splice(ar.entities.length, 0, ...kit.entities);
        ar.firstToken = kit.firstToken;
        ar.ontology = extOntology;
        ar.baseLanguage = kit.baseLanguage;
        ar.tag = kit;
        if (kit.msgs.length > 0) 
            ar.log.splice(ar.log.length, 0, ...kit.msgs);
        return ar;
    }
    
    _process2(kit, ar, noLog) {
        let msg = null;
        let sw = new Stopwatch();
        let stopByTimeout = false;
        let anals = Array.from(this.m_Analyzers);
        for (let ii = 0; ii < anals.length; ii++) {
            let c = anals[ii];
            if (c.ignoreThisAnalyzer) 
                continue;
            if (this.m_Breaked) {
                if (!noLog) {
                    msg = "Процесс прерван пользователем";
                    this.onMessage(msg);
                    ar.log.push(msg);
                }
                break;
            }
            if (!noLog) 
                this.onProgressHandler(c, new ProgressEventArgs(0, ("Работа \"" + c.caption + "\"")));
            kit.m_AnalyzerStack.push(c.name);
            sw.reset();
            sw.start();
            c.process(kit);
            sw.stop();
            Utils.removeItem(kit.m_AnalyzerStack, c.name);
            let dat = kit.getAnalyzerData(c);
            if (!noLog) {
                msg = ("Анализатор \"" + c.caption + "\" выделил " + (dat === null ? 0 : dat.referents.length) + " объект(ов) за " + Processor.outSecs(sw.elapsedMilliseconds));
                this.onMessage(msg);
                ar.log.push(msg);
            }
        }
        if (!noLog) 
            this.onProgressHandler(null, new ProgressEventArgs(0, "Пересчёт отношений обобщения"));
        try {
            sw.reset();
            sw.start();
            GeneralRelationHelper.refreshGenerals(this, kit);
            sw.stop();
            if (!noLog) {
                msg = ("Отношение обобщение пересчитано за " + Processor.outSecs(sw.elapsedMilliseconds));
                this.onMessage(msg);
                ar.log.push(msg);
            }
        } catch (ex) {
            if (!noLog) {
                ex = new Error("Ошибка пересчёта отношения обобщения");
                this.onMessage(ex);
                ar.addException(ex);
            }
        }
    }
    
    _createRes(kit, ar, extOntology, noLog) {
        let sw = new Stopwatch();
        let ontoAttached = 0;
        for (let k = 0; k < 2; k++) {
            for (const c of this.analyzers) {
                if (k === 0) {
                    if (!c.isSpecific) 
                        continue;
                }
                else if (c.isSpecific) 
                    continue;
                let dat = kit.getAnalyzerData(c);
                if (dat !== null && dat.referents.length > 0) {
                    if (extOntology !== null) {
                        for (const r of dat.referents) {
                            if (r.ontologyItems === null) {
                                if ((((r.ontologyItems = extOntology.attachReferent(r)))) !== null) 
                                    ontoAttached++;
                            }
                        }
                    }
                    ar.entities.splice(ar.entities.length, 0, ...dat.referents);
                }
            }
        }
        for (let t = kit.firstToken; t !== null; t = t.next) {
            this._clearTags(t, 0);
        }
        sw.stop();
        if (extOntology !== null && !noLog) {
            let msg = ("Привязано " + ontoAttached + " объектов к внешней отнологии (" + extOntology.items.length + " элементов) за " + Processor.outSecs(sw.elapsedMilliseconds));
            this.onMessage(msg);
            ar.log.push(msg);
        }
    }
    
    _clearTags(t, lev) {
        if (lev > 10) 
            return;
        t.tag = null;
        if (t instanceof MetaToken) {
            for (let tt = t.beginToken; tt !== null && tt.endChar <= t.endChar; tt = tt.next) {
                this._clearTags(tt, lev + 1);
            }
        }
    }
    
    static outSecs(ms) {
        if (ms < 4000) 
            return (String(ms) + "ms");
        ms = Utils.intDiv(ms, 1000);
        if (ms < 120) 
            return (String(ms) + "sec");
        return ((String(Utils.intDiv(ms, 60))) + "min " + (ms % 60) + "sec");
    }
    
    /**
     * Прервать процесс анализа
     */
    breakProcess() {
        this.m_Breaked = true;
    }
    
    prepareProgress() {
        /* this is synchronized block by this.m_ProgressPeacesLock, but this feature isn't supported in JS */ {
            this.lastPercent = -1;
            let co = Processor.morphCoef;
            let total = co;
            for (const wf of this.analyzers) {
                if (!wf.ignoreThisAnalyzer) 
                    total += (wf.progressWeight > 0 ? wf.progressWeight : 1);
            }
            this.m_ProgressPeaces.clear();
            let max = co * 100;
            max /= (total);
            this.m_ProgressPeaces.put(this, ProgressPeace._new2940(0, max));
            for (const wf of this.analyzers) {
                if (!wf.ignoreThisAnalyzer) {
                    let min = max;
                    co += (wf.progressWeight > 0 ? wf.progressWeight : 1);
                    max = co * 100;
                    max /= (total);
                    if (!this.m_ProgressPeaces.containsKey(wf)) 
                        this.m_ProgressPeaces.put(wf, ProgressPeace._new2940(min, max));
                }
            }
        }
    }
    
    onProgressHandler(sender, e) {
        if (this.progress.length == 0) 
            return;
        if (e.progressPercentage >= 0) {
            let pi = null;
            /* this is synchronized block by this.m_ProgressPeacesLock, but this feature isn't supported in JS */ {
                let wrappi2942 = new RefOutArgWrapper();
                let inoutres2943 = this.m_ProgressPeaces.tryGetValue((sender != null ? sender : this), wrappi2942);
                pi = wrappi2942.value;
                if (inoutres2943) {
                    let p = ((e.progressPercentage) * ((pi.max - pi.min))) / (100);
                    p += pi.min;
                    let pers = Math.floor(p);
                    if (pers === this.lastPercent && e.userState === null && !this.m_Breaked) 
                        return;
                    e = new ProgressEventArgs(Math.floor(p), e.userState);
                    this.lastPercent = pers;
                }
            }
        }
        for(const eventitem of this.progress) eventitem.call(this, e);
    }
    
    onCancel(sender, e) {
        e.cancel = this.m_Breaked;
    }
    
    onMessage(message) {
        if (this.progress.length > 0) 
            for(const eventitem of this.progress) eventitem.call(this, new ProgressEventArgs(-1, message));
    }
    
    static static_constructor() {
        Processor.morphCoef = 10;
    }
}


Processor.ProgressChangedEventHandler_OnProgressHandler = class  extends EventHandler {
    
    constructor(src) {
        super();
        this.m_Source = null;
        this.m_Source = src;
    }
    
    call(sender, e) {
        this.m_Source.onProgressHandler(sender, e);
    }
}


Processor.CancelEventHandler_OnCancel = class  extends EventHandler {
    
    constructor(src) {
        super();
        this.m_Source = null;
        this.m_Source = src;
    }
    
    call(sender, e) {
        this.m_Source.onCancel(sender, e);
    }
}


Processor.static_constructor();

module.exports = Processor