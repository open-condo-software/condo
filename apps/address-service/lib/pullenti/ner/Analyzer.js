/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const ProgressEventArgs = require("./../unisharp/ProgressEventArgs");
const CancelEventArgs = require("./../unisharp/CancelEventArgs");

const AnalyzerData = require("./core/AnalyzerData");

/**
 * Базовый класс для всех лингвистических анализаторов. Игнорируйте, если не собираетесь делать свой анализатор.
 * Анализатор процессора
 */
class Analyzer {
    
    constructor() {
        this.progress = new Array();
        this.cancel = new Array();
        this.lastPercent = 0;
        this._persistreferentsregim = false;
        this._ignorethisanalyzer = false;
        this.persistAnalizerData = null;
    }
    
    /**
     * Запустить анализ
     * @param kit контейнер с данными
     */
    process(kit) {
        
    }
    
    get name() {
        return null;
    }
    
    get caption() {
        return null;
    }
    
    get description() {
        return null;
    }
    
    toString() {
        return (this.caption + " (" + this.name + ")");
    }
    
    clone() {
        return null;
    }
    
    get typeSystem() {
        return new Array();
    }
    
    get images() {
        return null;
    }
    
    get isSpecific() {
        return false;
    }
    
    /**
     * Создать сущность указанного типа
     * @param type тип сущности
     * @return экземпляр
     */
    createReferent(type) {
        return null;
    }
    
    get usedExternObjectTypes() {
        return Analyzer.emptyList;
    }
    
    get progressWeight() {
        return 0;
    }
    
    onProgress(pos, max, kit) {
        let ret = true;
        if (this.progress.length > 0) {
            if (pos >= 0 && pos <= max && max > 0) {
                let percent = pos;
                if (max > 1000000) 
                    percent = Utils.intDiv(percent, (Utils.intDiv(max, 1000)));
                else 
                    percent = Utils.intDiv((100 * percent), max);
                if (percent !== this.lastPercent) {
                    let arg = new ProgressEventArgs(percent, null);
                    for(const eventitem of this.progress) eventitem.call(this, arg);
                    if (this.cancel.length > 0) {
                        let cea = new CancelEventArgs();
                        for(const eventitem of this.cancel) eventitem.call(kit, cea);
                        ret = !cea.cancel;
                    }
                }
                this.lastPercent = percent;
            }
        }
        return ret;
    }
    
    onMessage(message) {
        if (this.progress.length > 0) 
            for(const eventitem of this.progress) eventitem.call(this, new ProgressEventArgs(-1, message));
        return true;
    }
    
    get persistReferentsRegim() {
        return this._persistreferentsregim;
    }
    set persistReferentsRegim(value) {
        this._persistreferentsregim = value;
        return this._persistreferentsregim;
    }
    
    get ignoreThisAnalyzer() {
        return this._ignorethisanalyzer;
    }
    set ignoreThisAnalyzer(value) {
        this._ignorethisanalyzer = value;
        return this._ignorethisanalyzer;
    }
    
    /**
     * Используется внутренним образом
     * @return 
     */
    createAnalyzerData() {
        return new AnalyzerData();
    }
    
    /**
     * Попытаться выделить сущность с указанного токена. 
     * (выделенная сущность не сохраняется в локальной онтологии - её нужно потом явно сохранять)
     * @param t токен
     * @param param параметр, поддерживаемый анализатором (если есть)
     * @return результат
     */
    processReferent(t, param = null) {
        return null;
    }
    
    /**
     * Это используется внутренним образом для обработки внешних онтологий
     * @param begin 
     * @return 
     */
    processOntologyItem(begin) {
        return null;
    }
    
    static static_constructor() {
        Analyzer.emptyList = new Array();
    }
}


Analyzer.static_constructor();

module.exports = Analyzer