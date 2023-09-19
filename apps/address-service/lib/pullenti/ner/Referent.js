/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../unisharp/Utils");
const RefOutArgWrapper = require("./../unisharp/RefOutArgWrapper");

const TextsCompareType = require("./core/internal/TextsCompareType");
const ProcessorService = require("./ProcessorService");
const SerializerHelper = require("./core/internal/SerializerHelper");
const MorphLang = require("./../morph/MorphLang");
const ReferentsEqualType = require("./core/ReferentsEqualType");
const TextAnnotation = require("./TextAnnotation");

/**
 * Базовый класс для всех именованных сущностей
 * 
 * Именованная сущность
 */
class Referent {
    
    constructor(typ) {
        this.m_ObjectType = null;
        this._instanceof = null;
        this.ontologyItems = null;
        this.m_Slots = new Array();
        this.m_Level = 0;
        this.m_Occurrence = null;
        this.tag = null;
        this.intOntologyItem = null;
        this.m_ExtReferents = null;
        this.m_ObjectType = typ;
    }
    
    get typeName() {
        return this.m_ObjectType;
    }
    
    toString() {
        return this.toStringEx(false, MorphLang.UNKNOWN, 0);
    }
    
    /**
     * Специализированное строковое представление сущности
     * @param shortVariant Сокращённый вариант
     * @param lang Язык
     * @return 
     */
    toStringEx(shortVariant, lang = null, lev = 0) {
        return this.typeName;
    }
    
    // По этой строке можно осуществлять сортировку среди сущностей одного типа
    toSortString() {
        return this.toStringEx(false, MorphLang.UNKNOWN, 0);
    }
    
    get instanceOf() {
        return this._instanceof;
    }
    set instanceOf(value) {
        this._instanceof = value;
        return this._instanceof;
    }
    
    get slots() {
        return this.m_Slots;
    }
    
    /**
     * Добавить значение атрибута
     * @param attrName имя
     * @param attrValue значение
     * @param clearOldValue если true и слот существует, то значение перезапишется
     * @return слот(атрибут)
     */
    addSlot(attrName, attrValue, clearOldValue, statCount = 0) {
        const Slot = require("./Slot");
        if ((Utils.asString(attrValue)) === "СЕН") {
        }
        if (clearOldValue) {
            for (let i = this.slots.length - 1; i >= 0; i--) {
                if (this.slots[i].typeName === attrName) 
                    this.slots.splice(i, 1);
            }
        }
        if (attrValue === null) 
            return null;
        for (const r of this.slots) {
            if (r.typeName === attrName) {
                if (this.compareValues(r.value, attrValue, true)) {
                    r.count = r.count + statCount;
                    return r;
                }
            }
        }
        let res = new Slot();
        res.owner = this;
        res.value = attrValue;
        res.typeName = attrName;
        res.count = statCount;
        this.slots.push(res);
        return res;
    }
    
    uploadSlot(slot, newVal) {
        if (slot !== null) 
            slot.value = newVal;
    }
    
    /**
     * Найти слот (атрибут)
     * @param attrName имя атрибута
     * @param val возможное значение
     * @param useCanBeEqualsForReferents для значений-сущностей использовать метод CanBeEquals для сравнения
     * @return подходящий слот или null
     * 
     */
    findSlot(attrName, val = null, useCanBeEqualsForReferents = true) {
        if (this.m_Level > 10) 
            return null;
        if (attrName === null) {
            if (val === null) 
                return null;
            this.m_Level++;
            for (const r of this.slots) {
                if (this.compareValues(val, r.value, useCanBeEqualsForReferents)) {
                    this.m_Level--;
                    return r;
                }
            }
            this.m_Level--;
            return null;
        }
        for (const r of this.slots) {
            if (r.typeName === attrName) {
                if (val === null) 
                    return r;
                this.m_Level++;
                if (this.compareValues(val, r.value, useCanBeEqualsForReferents)) {
                    this.m_Level--;
                    return r;
                }
                this.m_Level--;
            }
        }
        return null;
    }
    
    compareValues(val1, val2, useCanBeEqualsForReferents) {
        if (val1 === null) 
            return val2 === null;
        if (val2 === null) 
            return val1 === null;
        if (val1 === val2) 
            return true;
        if ((val1 instanceof Referent) && (val2 instanceof Referent)) {
            if (useCanBeEqualsForReferents) 
                return val1.canBeEquals(Utils.as(val2, Referent), ReferentsEqualType.DIFFERENTTEXTS);
            else 
                return false;
        }
        if ((typeof val1 === 'string' || val1 instanceof String)) {
            if (!((typeof val2 === 'string' || val2 instanceof String))) 
                return false;
            let s1 = String(val1);
            let s2 = String(val2);
            let i = Utils.compareStrings(s1, s2, true);
            return i === 0;
        }
        return val1 === val2;
    }
    
    /**
     * Получить значение слота-атрибута (если их несколько, то вернёт первое)
     * @param attrName имя слота
     * @return значение (поле Value)
     * 
     */
    getSlotValue(attrName) {
        for (const v of this.slots) {
            if (v.typeName === attrName) 
                return v.value;
        }
        return null;
    }
    
    /**
     * Получить строковое значение (если их несколько, то вернёт первое)
     * @param attrName имя атрибута
     * @return значение или null
     * 
     */
    getStringValue(attrName) {
        for (const v of this.slots) {
            if (v.typeName === attrName) 
                return (v.value === null ? null : v.value.toString());
        }
        return null;
    }
    
    /**
     * Получить все строовые значения заданного атрибута
     * @param attrName имя атрибута
     * @return список значений string
     * 
     */
    getStringValues(attrName) {
        let res = new Array();
        for (const v of this.slots) {
            if (v.typeName === attrName && v.value !== null) {
                if ((typeof v.value === 'string' || v.value instanceof String)) 
                    res.push(Utils.asString(v.value));
                else 
                    res.push(v.toString());
            }
        }
        return res;
    }
    
    /**
     * Получить числовое значение (если их несколько, то вернёт первое)
     * @param attrName имя атрибута
     * @param defValue дефолтовое значение, если не найдено
     * @return число
     */
    getIntValue(attrName, defValue) {
        let str = this.getStringValue(attrName);
        if (Utils.isNullOrEmpty(str)) 
            return defValue;
        let res = 0;
        let wrapres2949 = new RefOutArgWrapper();
        let inoutres2950 = Utils.tryParseInt(str, wrapres2949);
        res = wrapres2949.value;
        if (!inoutres2950) 
            return defValue;
        return res;
    }
    
    get occurrence() {
        if (this.m_Occurrence === null) 
            this.m_Occurrence = new Array();
        return this.m_Occurrence;
    }
    
    /**
     * Найти ближайшую к токену аннотацию
     * @param t токен
     * @return ближайшая аннотация
     */
    findNearOccurence(t) {
        let min = -1;
        let res = null;
        for (const oc of this.occurrence) {
            if (oc.sofa === t.kit.sofa) {
                let len = oc.beginChar - t.beginChar;
                if (len < 0) 
                    len = -len;
                if ((min < 0) || (len < min)) {
                    min = len;
                    res = oc;
                }
            }
        }
        return res;
    }
    
    addOccurenceOfRefTok(rt) {
        this.addOccurence(TextAnnotation._new1070(rt.kit.sofa, rt.beginChar, rt.endChar, rt.referent));
    }
    
    /**
     * Добавить аннотацию
     * @param anno аннотация
     */
    addOccurence(anno) {
        for (const l of this.occurrence) {
            let typ = l.compareWith(anno);
            if (typ === TextsCompareType.NONCOMPARABLE) 
                continue;
            if (typ === TextsCompareType.EQUIVALENT || typ === TextsCompareType.CONTAINS) 
                return;
            if (typ === TextsCompareType.IN || typ === TextsCompareType.INTERSECT) {
                l.merge(anno);
                return;
            }
        }
        if (anno.occurenceOf !== this && anno.occurenceOf !== null) 
            anno = TextAnnotation._new2952(anno.beginChar, anno.endChar, anno.sofa);
        if (this.m_Occurrence === null) 
            this.m_Occurrence = new Array();
        anno.occurenceOf = this;
        if (this.m_Occurrence.length === 0) {
            anno.essentialForOccurence = true;
            this.m_Occurrence.push(anno);
            return;
        }
        if (anno.beginChar < this.m_Occurrence[0].beginChar) {
            this.m_Occurrence.splice(0, 0, anno);
            return;
        }
        if (anno.beginChar >= this.m_Occurrence[this.m_Occurrence.length - 1].beginChar) {
            this.m_Occurrence.push(anno);
            return;
        }
        for (let i = 0; i < (this.m_Occurrence.length - 1); i++) {
            if (anno.beginChar >= this.m_Occurrence[i].beginChar && anno.beginChar <= this.m_Occurrence[i + 1].beginChar) {
                this.m_Occurrence.splice(i + 1, 0, anno);
                return;
            }
        }
        this.m_Occurrence.push(anno);
    }
    
    /**
     * Проверка, что ссылки на элемент имеются на заданном участке текста
     * @param beginChar начальная позиция
     * @param endChar конечная позиция
     * @return да или нет
     */
    checkOccurence(beginChar, endChar) {
        for (const loc of this.occurrence) {
            let cmp = loc.compare(beginChar, endChar);
            if (cmp !== TextsCompareType.EARLY && cmp !== TextsCompareType.LATER && cmp !== TextsCompareType.NONCOMPARABLE) 
                return true;
        }
        return false;
    }
    
    clone() {
        const Slot = require("./Slot");
        let res = ProcessorService.createReferent(this.typeName);
        if (res === null) 
            res = new Referent(this.typeName);
        res.occurrence.splice(res.occurrence.length, 0, ...this.occurrence);
        res.ontologyItems = this.ontologyItems;
        for (const r of this.slots) {
            let rr = Slot._new2953(r.typeName, r.value, r.count);
            rr.owner = res;
            res.slots.push(rr);
        }
        return res;
    }
    
    /**
     * Проверка возможной тождественности сущностей
     * @param obj другая сущность
     * @param typ тип сравнения
     * @return результат
     * 
     */
    canBeEquals(obj, typ = ReferentsEqualType.WITHINONETEXT) {
        if (obj === null || obj.typeName !== this.typeName) 
            return false;
        for (const r of this.slots) {
            if (r.value !== null && obj.findSlot(r.typeName, r.value, false) === null) 
                return false;
        }
        for (const r of obj.slots) {
            if (r.value !== null && this.findSlot(r.typeName, r.value, true) === null) 
                return false;
        }
        return true;
    }
    
    /**
     * Объединение значений атрибутов со значениями атрибутов другой сущности
     * @param obj Другая сущшность, считающаяся эквивалентной
     * @param mergeStatistic Объединять ли вместе со статистикой
     */
    mergeSlots(obj, mergeStatistic = true) {
        if (obj === null) 
            return;
        for (const r of obj.slots) {
            let s = this.findSlot(r.typeName, r.value, true);
            if (s === null && r.value !== null) 
                s = this.addSlot(r.typeName, r.value, false, 0);
            if (s !== null && mergeStatistic) {
                s.count = s.count + r.count;
                if (r.occurrence !== null) {
                    if (s.occurrence === null) 
                        s.occurrence = new Array();
                    for (const o of r.occurrence) {
                        s.occurrence.push(o);
                    }
                }
            }
        }
        this._mergeExtReferents(obj);
    }
    
    get parentReferent() {
        return null;
    }
    
    /**
     * Получить идентификатор иконки. Саму иконку ImageWrapper можно получить через функцию 
     * GetImageById(imageId) статического класса ProcessorService.
     * @return идентификатор иконки
     */
    getImageId() {
        if (this.instanceOf === null) 
            return null;
        return this.instanceOf.getImageId(this);
    }
    
    /**
     * Проверка, может ли текущая сущность быть обобщением для другой сущности
     * @param obj более частная сущность
     * @return да-нет
     */
    canBeGeneralFor(obj) {
        return false;
    }
    
    get generalReferent() {
        let res = Utils.as(this.getSlotValue(Referent.ATTR_GENERAL), Referent);
        if (res === null || res === this) 
            return null;
        return res;
    }
    set generalReferent(value) {
        if (value === this.generalReferent) 
            return value;
        if (value === this) 
            return value;
        this.addSlot(Referent.ATTR_GENERAL, value, true, 0);
        return value;
    }
    
    // Создать элемент онтологии
    createOntologyItem() {
        return null;
    }
    
    // Используется внутренним образом
    getCompareStrings() {
        let res = new Array();
        res.push(this.toString());
        let s = this.toStringEx(true, MorphLang.UNKNOWN, 0);
        if (s !== res[0]) 
            res.push(s);
        return res;
    }
    
    addExtReferent(rt) {
        if (rt === null) 
            return;
        if (this.m_ExtReferents === null) 
            this.m_ExtReferents = new Array();
        if (!this.m_ExtReferents.includes(rt)) 
            this.m_ExtReferents.push(rt);
        if (this.m_ExtReferents.length > 100) {
        }
    }
    
    moveExtReferent(target, r) {
        if (this.m_ExtReferents !== null) {
            for (const rt of this.m_ExtReferents) {
                if (rt.referent === r || r === null) {
                    target.addExtReferent(rt);
                    Utils.removeItem(this.m_ExtReferents, rt);
                    break;
                }
            }
        }
    }
    
    _mergeExtReferents(obj) {
        if (obj.m_ExtReferents !== null) {
            for (const rt of obj.m_ExtReferents) {
                this.addExtReferent(rt);
            }
        }
    }
    
    serialize(stream, newFormat = false) {
        SerializerHelper.serializeString(stream, this.typeName);
        SerializerHelper.serializeInt(stream, this.m_Slots.length);
        for (const s of this.m_Slots) {
            SerializerHelper.serializeString(stream, s.typeName);
            SerializerHelper.serializeInt(stream, s.count);
            if ((s.value instanceof Referent) && ((typeof s.value.tag === 'number' || s.value.tag instanceof Number))) {
                if (newFormat) {
                    stream.writeByte(2);
                    SerializerHelper.serializeInt(stream, s.value.tag);
                }
                else 
                    SerializerHelper.serializeInt(stream, -(s.value.tag));
            }
            else if ((typeof s.value === 'string' || s.value instanceof String)) {
                if (newFormat) 
                    stream.writeByte(1);
                SerializerHelper.serializeString(stream, Utils.asString(s.value));
            }
            else if (s.value === null) {
                if (newFormat) 
                    stream.writeByte(0);
                else 
                    SerializerHelper.serializeInt(stream, 0);
            }
            else {
                if (newFormat) 
                    stream.writeByte(1);
                SerializerHelper.serializeString(stream, s.value.toString());
            }
        }
        if (this.m_Occurrence === null) 
            SerializerHelper.serializeInt(stream, 0);
        else {
            SerializerHelper.serializeInt(stream, this.m_Occurrence.length);
            for (const o of this.m_Occurrence) {
                SerializerHelper.serializeInt(stream, o.beginChar);
                SerializerHelper.serializeInt(stream, o.endChar);
                let attr = 0;
                if (o.essentialForOccurence) 
                    attr = 1;
                SerializerHelper.serializeInt(stream, attr);
            }
        }
    }
    
    deserialize(stream, all, sofa, newFormat = false) {
        let typ = SerializerHelper.deserializeString(stream);
        let cou = SerializerHelper.deserializeInt(stream);
        for (let i = 0; i < cou; i++) {
            typ = SerializerHelper.deserializeString(stream);
            let c = SerializerHelper.deserializeInt(stream);
            let val = null;
            if (newFormat) {
                let bb = stream.readByte();
                if (bb === (2)) {
                    let id1 = SerializerHelper.deserializeInt(stream);
                    if (id1 > 0 && id1 <= all.length) 
                        val = all[id1 - 1];
                }
                else if (bb === (1)) 
                    val = SerializerHelper.deserializeString(stream);
            }
            else {
                let id = SerializerHelper.deserializeInt(stream);
                if ((id < 0) && all !== null) {
                    let id1 = (-id) - 1;
                    if (id1 < all.length) 
                        val = all[id1];
                }
                else if (id > 0) {
                    stream.position = stream.position - (4);
                    val = SerializerHelper.deserializeString(stream);
                }
            }
            this.addSlot(typ, val, false, c);
        }
        cou = SerializerHelper.deserializeInt(stream);
        this.m_Occurrence = new Array();
        for (let i = 0; i < cou; i++) {
            let a = TextAnnotation._new2954(sofa, this);
            this.m_Occurrence.push(a);
            a.beginChar = SerializerHelper.deserializeInt(stream);
            a.endChar = SerializerHelper.deserializeInt(stream);
            let attr = SerializerHelper.deserializeInt(stream);
            if (((attr & 1)) !== 0) 
                a.essentialForOccurence = true;
        }
    }
    
    static static_constructor() {
        Referent.ATTR_GENERAL = "GENERAL";
    }
}


Referent.static_constructor();

module.exports = Referent