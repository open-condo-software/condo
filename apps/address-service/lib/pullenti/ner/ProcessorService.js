/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const Hashtable = require("./../unisharp/Hashtable");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");

const ImageWrapper = require("./metadata/ImageWrapper");
const PullentiNerCoreInternalResourceHelper = require("./core/internal/PullentiNerCoreInternalResourceHelper");
const MorphologyService = require("./../morph/MorphologyService");
const DerivateService = require("./../semantic/utils/DerivateService");

/**
 * Служба лингвистических процессоров
 * 
 * Служба процессоров
 */
class ProcessorService {
    
    static getVersion() {
        return "4.20";
    }
    
    static getVersionDate() {
        return "2023.08.13";
    }
    
    /**
     * Инициализация сервиса. Каждый анализатор нужно инициализировать отдельно. 
     * Если вызывается Sdk.Initialize(), то там инициализация сервиса и всех анализаторов делается.
     * @param lang необходимые языки (по умолчанию, русский и английский)
     * 
     */
    static initialize(lang = null) {
        const Termin = require("./core/Termin");
        const NumberHelper = require("./core/NumberHelper");
        const BlockLine = require("./core/internal/BlockLine");
        const NumberExHelper = require("./core/internal/NumberExHelper");
        const PrepositionHelper = require("./core/PrepositionHelper");
        const ConjunctionHelper = require("./core/ConjunctionHelper");
        const NounPhraseItem = require("./core/internal/NounPhraseItem");
        if (ProcessorService.m_Inited) 
            return;
        ProcessorService.m_Inited = true;
        MorphologyService.initialize(lang);
        DerivateService.initialize(lang);
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = true;
        PrepositionHelper.initialize();
        ConjunctionHelper.initialize();
        NounPhraseItem.initialize();
        NumberHelper.initialize();
        NumberExHelper.initialize();
        BlockLine.initialize();
        Termin.ASSIGN_ALL_TEXTS_AS_NORMAL = false;
    }
    
    static isInitialized() {
        return ProcessorService.m_Inited;
    }
    
    /**
     * Создать процессор со стандартным списком анализаторов (у которых свойство IsSpecific = false)
     * @return экземпляр процессора
     * 
     */
    static createProcessor() {
        const Processor = require("./Processor");
        if (!ProcessorService.m_Inited) 
            return null;
        let proc = new Processor();
        for (const t of ProcessorService.m_AnalizerInstances) {
            let a = t.clone();
            if (a !== null && !a.isSpecific) 
                proc.addAnalyzer(a);
        }
        return proc;
    }
    
    /**
     * Создать процессор с набором стандартных и указанных параметром специфических 
     * анализаторов.
     * @param specAnalyzerNames можно несколько, разделённые запятой или точкой с запятой. 
     * Если список пустой, то эквивалентно CreateProcessor()
     * @return Экземпляр процессора
     * 
     */
    static createSpecificProcessor(specAnalyzerNames) {
        const Processor = require("./Processor");
        if (!ProcessorService.m_Inited) 
            return null;
        let proc = new Processor();
        let names = Array.from(Utils.splitString(((specAnalyzerNames != null ? specAnalyzerNames : "")), ',' + ';' + ' ', false));
        for (const t of ProcessorService.m_AnalizerInstances) {
            let a = t.clone();
            if (a !== null) {
                if (!a.isSpecific || names.includes(a.name)) 
                    proc.addAnalyzer(a);
            }
        }
        return proc;
    }
    
    /**
     * Создать экземпляр процессора с пустым списком анализаторов
     * @return Процессор без выделения сущностей
     * 
     */
    static createEmptyProcessor() {
        const Processor = require("./Processor");
        return new Processor();
    }
    
    // Регистрация анализатора. Вызывается при инициализации из инициализируемой сборки
    // (она сама знает, какие содержит анализаторы, и регистрирует их)
    static registerAnalyzer(analyzer) {
        try {
            ProcessorService.m_AnalizerInstances.push(analyzer);
            let img = analyzer.images;
            if (img !== null) {
                for (const kp of img.entries) {
                    if (!ProcessorService.m_Images.containsKey(kp.key)) 
                        ProcessorService.m_Images.put(kp.key, ImageWrapper._new2944(kp.key, kp.value));
                }
            }
        } catch (ex) {
        }
        ProcessorService._reorderCartridges();
    }
    
    static _reorderCartridges() {
        if (ProcessorService.m_AnalizerInstances.length === 0) 
            return;
        for (let k = 0; k < ProcessorService.m_AnalizerInstances.length; k++) {
            for (let i = 0; i < (ProcessorService.m_AnalizerInstances.length - 1); i++) {
                let maxInd = -1;
                let li = ProcessorService.m_AnalizerInstances[i].usedExternObjectTypes;
                if (li !== null) {
                    for (const v of ProcessorService.m_AnalizerInstances[i].usedExternObjectTypes) {
                        for (let j = i + 1; j < ProcessorService.m_AnalizerInstances.length; j++) {
                            if (ProcessorService.m_AnalizerInstances[j].typeSystem !== null) {
                                for (const st of ProcessorService.m_AnalizerInstances[j].typeSystem) {
                                    if (st.name === v) {
                                        if ((maxInd < 0) || (maxInd < j)) 
                                            maxInd = j;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                if (maxInd <= i) {
                    if (ProcessorService.m_AnalizerInstances[i].isSpecific && !ProcessorService.m_AnalizerInstances[i + 1].isSpecific) {
                    }
                    else 
                        continue;
                }
                let cart = ProcessorService.m_AnalizerInstances[i];
                ProcessorService.m_AnalizerInstances.splice(i, 1);
                ProcessorService.m_AnalizerInstances.push(cart);
            }
        }
    }
    
    static getAnalyzers() {
        return ProcessorService.m_AnalizerInstances;
    }
    
    /**
     * Создать экземпляр объекта заданного типа
     * @param typeName имя типа
     * @return результат
     */
    static createReferent(typeName) {
        const Referent = require("./Referent");
        for (const cart of ProcessorService.m_AnalizerInstances) {
            let obj = cart.createReferent(typeName);
            if (obj !== null) 
                return obj;
        }
        return new Referent(typeName);
    }
    
    /**
     * Получить иконку по идентификатору иконки
     * @param imageId идентификатор иконки
     * @return обёртка над телом иконки
     */
    static getImageById(imageId) {
        if (imageId !== null) {
            let res = null;
            let wrapres2945 = new RefOutArgWrapper();
            let inoutres2946 = ProcessorService.m_Images.tryGetValue(imageId, wrapres2945);
            res = wrapres2945.value;
            if (inoutres2946) 
                return res;
        }
        if (ProcessorService.m_UnknownImage === null) 
            ProcessorService.m_UnknownImage = ImageWrapper._new2944("unknown", PullentiNerCoreInternalResourceHelper.getBytes("unknown.png"));
        return ProcessorService.m_UnknownImage;
    }
    
    /**
     * Добавить специфическую иконку
     * @param imageId идентификатор (возвращаемый Referent.GetImageId())
     * @param content содержимое иконки
     */
    static addImage(imageId, content) {
        if (imageId === null) 
            return;
        let wr = ImageWrapper._new2944(imageId, content);
        if (ProcessorService.m_Images.containsKey(imageId)) 
            ProcessorService.m_Images.put(imageId, wr);
        else 
            ProcessorService.m_Images.put(imageId, wr);
    }
    
    static getEmptyProcessor() {
        if (ProcessorService.m_EmptyProcessor === null) 
            ProcessorService.m_EmptyProcessor = ProcessorService.createEmptyProcessor();
        return ProcessorService.m_EmptyProcessor;
    }
    
    static getStandardProcessor() {
        if (ProcessorService.m_StandardProcessor === null) 
            ProcessorService.m_StandardProcessor = ProcessorService.createProcessor();
        return ProcessorService.m_StandardProcessor;
    }
    
    static static_constructor() {
        ProcessorService.m_Inited = false;
        ProcessorService.m_AnalizerInstances = new Array();
        ProcessorService.m_Images = new Hashtable();
        ProcessorService.m_UnknownImage = null;
        ProcessorService.m_EmptyProcessor = null;
        ProcessorService.m_StandardProcessor = null;
        ProcessorService.DEBUG_CURRENT_DATE_TIME = null;
    }
}


ProcessorService.static_constructor();

module.exports = ProcessorService