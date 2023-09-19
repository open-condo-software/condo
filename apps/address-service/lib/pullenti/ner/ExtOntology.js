/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const Hashtable = require("./../unisharp/Hashtable");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");

const ProcessorService = require("./ProcessorService");
const SerializerHelper = require("./core/internal/SerializerHelper");
const Referent = require("./Referent");
const IntOntologyCollection = require("./core/IntOntologyCollection");
const ExtOntologyItem = require("./ExtOntologyItem");
const SourceOfAnalysis = require("./SourceOfAnalysis");

/**
 * Внешняя "онтология". Содержит дополнительтную информацию для обработки (сущностей) - 
 * это список элементов, связанных с внешними сущностями. 
 * Подаётся необязательным параметром на вход методу Process() класса Processor.
 * Внешняя онтология
 */
class ExtOntology {
    
    /**
     * Добавить элемент
     * @param extId произвольный объект
     * @param typeName имя типа сущности
     * @param _definition текстовое определение. Определение может содержать несколько 
     * отдельных фрагментов, которые разделяются точкой с запятой. 
     * Например, Министерство Обороны России; Минобороны
     * @return если null, то не получилось...
     */
    add(extId, typeName, _definition) {
        if (typeName === null || _definition === null) 
            return null;
        let rs = this._createReferent(typeName, _definition);
        if (rs === null) 
            return null;
        this.m_Hash = null;
        let res = ExtOntologyItem._new2906(extId, rs[0], typeName);
        if (rs.length > 1) {
            rs.splice(0, 1);
            res.refs = rs;
        }
        this.items.push(res);
        return res;
    }
    
    /**
     * Добавить готовую сущность
     * @param extId произвольный объект
     * @param referent готовая сущность (например, сфомированная явно)
     * @return новая запись словаря
     */
    addReferent(extId, referent) {
        if (referent === null) 
            return null;
        this.m_Hash = null;
        let res = ExtOntologyItem._new2906(extId, referent, referent.typeName);
        this.items.push(res);
        return res;
    }
    
    _createReferent(typeName, _definition) {
        let analyzer = null;
        let wrapanalyzer2908 = new RefOutArgWrapper();
        let inoutres2909 = this.m_AnalByType.tryGetValue(typeName, wrapanalyzer2908);
        analyzer = wrapanalyzer2908.value;
        if (!inoutres2909) 
            return null;
        let sf = new SourceOfAnalysis(_definition);
        let ar = this.m_Processor._process(sf, true, true, null, null);
        if (ar === null || ar.firstToken === null) 
            return null;
        let r0 = ar.firstToken.getReferent();
        let t = null;
        if (r0 !== null) {
            if (r0.typeName !== typeName) 
                r0 = null;
        }
        if (r0 !== null) 
            t = ar.firstToken;
        else {
            let rt = analyzer.processOntologyItem(ar.firstToken);
            if (rt === null) 
                return null;
            r0 = rt.referent;
            t = rt.endToken;
        }
        for (t = t.next; t !== null; t = t.next) {
            if (t.isChar(';') && t.next !== null) {
                let r1 = t.next.getReferent();
                if (r1 === null) {
                    let rt = analyzer.processOntologyItem(t.next);
                    if (rt === null) 
                        continue;
                    t = rt.endToken;
                    r1 = rt.referent;
                }
                if (r1.typeName === typeName) {
                    r0.mergeSlots(r1, true);
                    r1.tag = r0;
                }
            }
        }
        if (r0 === null) 
            return null;
        r0.tag = r0;
        r0 = analyzer.persistAnalizerData.registerReferent(r0);
        this.m_Processor._createRes(ar.firstToken.kit, ar, null, true);
        let res = new Array();
        res.push(r0);
        for (const e of ar.entities) {
            if (e.tag === null) 
                res.push(e);
        }
        return res;
    }
    
    /**
     * Обновить существующий элемент онтологии
     * @param item обновляемый элемент
     * @param _definition новое определение
     * @return признак успешности обновления
     */
    refresh(item, _definition) {
        if (item === null) 
            return false;
        let newReferent = Utils.as(_definition, Referent);
        if ((typeof _definition === 'string' || _definition instanceof String)) 
            newReferent = this._createReferent(item.typeName, Utils.asString(_definition));
        let analyzer = null;
        let wrapanalyzer2910 = new RefOutArgWrapper();
        let inoutres2911 = this.m_AnalByType.tryGetValue(item.typeName, wrapanalyzer2910);
        analyzer = wrapanalyzer2910.value;
        if (!inoutres2911) 
            return false;
        if (analyzer.persistAnalizerData === null) 
            return true;
        if (item.referent !== null) 
            analyzer.persistAnalizerData.removeReferent(item.referent);
        let oldReferent = item.referent;
        newReferent = analyzer.persistAnalizerData.registerReferent(newReferent);
        item.referent = newReferent;
        this.m_Hash = null;
        if (oldReferent !== null && newReferent !== null) {
            for (const a of this.m_Processor.analyzers) {
                if (a.persistAnalizerData !== null) {
                    for (const rr of a.persistAnalizerData.referents) {
                        for (const s of newReferent.slots) {
                            if (s.value === oldReferent) 
                                newReferent.uploadSlot(s, rr);
                        }
                        for (const s of rr.slots) {
                            if (s.value === oldReferent) 
                                rr.uploadSlot(s, newReferent);
                        }
                    }
                }
            }
        }
        return true;
    }
    
    constructor(specNames = null) {
        this.items = new Array();
        this.m_Processor = null;
        this.m_Specs = null;
        this.m_AnalByType = null;
        this.m_Hash = null;
        this.tag = null;
        this.m_Specs = specNames;
        this._init();
    }
    
    _init() {
        this.m_Processor = ProcessorService.createSpecificProcessor(this.m_Specs);
        this.m_AnalByType = new Hashtable();
        for (const a of this.m_Processor.analyzers) {
            a.persistReferentsRegim = true;
            for (const t of a.typeSystem) {
                if (!this.m_AnalByType.containsKey(t.name)) 
                    this.m_AnalByType.put(t.name, a);
            }
        }
    }
    
    /**
     * Сериализовать весь словарь в поток
     * @param stream поток для сериализации
     */
    serialize(stream) {
        SerializerHelper.serializeString(stream, this.m_Specs);
        SerializerHelper.serializeInt(stream, this.items.length);
        for (const it of this.items) {
            it.serialize(stream);
        }
    }
    
    /**
     * Восстановить словарь из потока
     * @param stream поток для десериализации
     */
    deserialize(stream) {
        this.m_Specs = SerializerHelper.deserializeString(stream);
        this._init();
        let cou = SerializerHelper.deserializeInt(stream);
        for (; cou > 0; cou--) {
            let it = new ExtOntologyItem();
            it.deserialize(stream);
            this.items.push(it);
        }
        this._initHash();
    }
    
    _getAnalyzerData(typeName) {
        let a = null;
        let wrapa2912 = new RefOutArgWrapper();
        let inoutres2913 = this.m_AnalByType.tryGetValue(typeName, wrapa2912);
        a = wrapa2912.value;
        if (!inoutres2913) 
            return null;
        return a.persistAnalizerData;
    }
    
    _initHash() {
        this.m_Hash = new Hashtable();
        for (const it of this.items) {
            if (it.referent !== null) 
                it.referent.ontologyItems = null;
        }
        for (const it of this.items) {
            if (it.referent !== null) {
                let ont = null;
                let wrapont2915 = new RefOutArgWrapper();
                let inoutres2916 = this.m_Hash.tryGetValue(it.referent.typeName, wrapont2915);
                ont = wrapont2915.value;
                if (!inoutres2916) 
                    this.m_Hash.put(it.referent.typeName, (ont = IntOntologyCollection._new2914(true)));
                if (it.referent.ontologyItems === null) 
                    it.referent.ontologyItems = new Array();
                it.referent.ontologyItems.push(it);
                it.referent.intOntologyItem = null;
                ont.addReferent(it.referent);
            }
        }
    }
    
    /**
     * Привязать сущность к существующей записи
     * @param r внешняя сущность
     * @return null или список подходящих элементов
     */
    attachReferent(r) {
        if (this.m_Hash === null) 
            this._initHash();
        let onto = null;
        let wraponto2917 = new RefOutArgWrapper();
        let inoutres2918 = this.m_Hash.tryGetValue(r.typeName, wraponto2917);
        onto = wraponto2917.value;
        if (!inoutres2918) 
            return null;
        let li = onto.tryAttachByReferent(r, null, false);
        if (li === null || li.length === 0) 
            return null;
        let res = null;
        for (const rr of li) {
            if (rr.ontologyItems !== null) {
                if (res === null) 
                    res = new Array();
                res.splice(res.length, 0, ...rr.ontologyItems);
            }
        }
        return res;
    }
    
    // Используется внутренним образом
    attachToken(typeName, t) {
        if (this.m_Hash === null) 
            this._initHash();
        let onto = null;
        let wraponto2919 = new RefOutArgWrapper();
        let inoutres2920 = this.m_Hash.tryGetValue(typeName, wraponto2919);
        onto = wraponto2919.value;
        if (!inoutres2920) 
            return null;
        return onto.tryAttach(t, null, false);
    }
}


module.exports = ExtOntology