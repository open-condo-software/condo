/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");

const ReferentsEqualType = require("./ReferentsEqualType");

/**
 * Данные, полученные в ходе обработки одним анализатором. Каждый анализатор сохраняет в своём класса свои данные, 
 * получаемые в ходе анализа. В конце процессор объединяет их все. Получить экземпляр, связанный с анализатором, 
 * можно методом AnalyzerKit.GetAnalyzerDataByAnalyzerName.
 * Данные анализа
 */
class AnalyzerData {
    
    constructor() {
        this.kit = null;
        this.level = 0;
        this.m_Referents = new Array();
        this.m_RegRefLevel = 0;
        this.overflowLevel = 0;
    }
    
    get referents() {
        return this.m_Referents;
    }
    set referents(value) {
        this.m_Referents.splice(0, this.m_Referents.length);
        if (value !== null) 
            this.m_Referents.splice(this.m_Referents.length, 0, ...value);
        return value;
    }
    
    /**
     * Зарегистрировать новую сущность или привязать к существующей сущности. Сущности, получаемые в ходе анализа, 
     * должны сохраняться через эту функцию. Именно здесь решается задача кореференции, то есть объединения 
     * сущностей, соответствующих одному и тому же объекту текста.
     * @param referent сохраняемая сущность
     * @return этот же экземпляр referent или другой, если удалось объединиться с ранее выделенной сущностью
     */
    registerReferent(referent) {
        if (referent === null) 
            return null;
        if (referent.m_ExtReferents !== null) {
            if (this.m_RegRefLevel > 2) {
            }
            else {
                for (const rt of referent.m_ExtReferents) {
                    let oldRef = rt.referent;
                    this.m_RegRefLevel++;
                    rt.saveToLocalOntology();
                    this.m_RegRefLevel--;
                    if (oldRef === rt.referent || rt.referent === null) 
                        continue;
                    for (const s of referent.slots) {
                        if (s.value === oldRef) 
                            referent.uploadSlot(s, rt.referent);
                    }
                    if (referent.m_ExtReferents !== null) {
                        for (const rtt of referent.m_ExtReferents) {
                            for (const s of rtt.referent.slots) {
                                if (s.value === oldRef) 
                                    referent.uploadSlot(s, rt.referent);
                            }
                        }
                    }
                }
                referent.m_ExtReferents = null;
            }
        }
        let eq = null;
        if (this.m_Referents.includes(referent)) 
            return referent;
        for (let i = this.m_Referents.length - 1; i >= 0 && ((this.m_Referents.length - i) < 1000); i--) {
            let p = this.m_Referents[i];
            if (p.canBeEquals(referent, ReferentsEqualType.WITHINONETEXT)) {
                if (!p.canBeGeneralFor(referent) && !referent.canBeGeneralFor(p)) {
                    if (eq === null) 
                        eq = new Array();
                    eq.push(p);
                }
            }
        }
        if (eq !== null) {
            if (eq.length === 1) {
                eq[0].mergeSlots(referent, true);
                return eq[0];
            }
            if (eq.length > 1) {
                for (const e of eq) {
                    if (e.slots.length !== referent.slots.length) 
                        continue;
                    let ok = true;
                    for (const s of referent.slots) {
                        if (e.findSlot(s.typeName, s.value, true) === null) {
                            ok = false;
                            break;
                        }
                    }
                    if (ok) {
                        for (const s of e.slots) {
                            if (referent.findSlot(s.typeName, s.value, true) === null) {
                                ok = false;
                                break;
                            }
                        }
                    }
                    if (ok) 
                        return e;
                }
            }
        }
        this.m_Referents.push(referent);
        return referent;
    }
    
    /**
     * Удалить сущность из списка
     * @param r удаляемая сущность
     */
    removeReferent(r) {
        if (this.m_Referents.includes(r)) 
            Utils.removeItem(this.m_Referents, r);
    }
}


module.exports = AnalyzerData