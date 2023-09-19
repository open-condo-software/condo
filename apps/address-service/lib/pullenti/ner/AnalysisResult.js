/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const StringBuilder = require("./../unisharp/StringBuilder");

/**
 * Результат анализа
 * 
 */
class AnalysisResult {
    
    constructor() {
        this.m_Sofa = null;
        this.m_Entities = new Array();
        this.firstToken = null;
        this.ontology = null;
        this.baseLanguage = null;
        this.m_Log = new Array();
        this.exceptions = new Array();
        this.isTimeoutBreaked = false;
        this.tag = null;
    }
    
    get sofa() {
        return this.m_Sofa;
    }
    set sofa(value) {
        this.m_Sofa = value;
        return value;
    }
    
    get entities() {
        return this.m_Entities;
    }
    
    get log() {
        return this.m_Log;
    }
    
    addException(ex) {
        let str = ex.toString();
        for (const e of this.exceptions) {
            if (e.toString() === str) 
                return;
        }
        this.exceptions.push(ex);
    }
    
    toString() {
        let res = new StringBuilder();
        res.append("Общая длина ").append(this.sofa.text.length).append(" знаков");
        if (this.baseLanguage !== null) 
            res.append(", базовый язык ").append(this.baseLanguage.toString());
        res.append(", найдено ").append(this.entities.length).append(" сущностей");
        if (this.isTimeoutBreaked) 
            res.append(", прервано по таймауту");
        return res.toString();
    }
    
    serialize(stream) {
        
    }
}


module.exports = AnalysisResult