/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../unisharp/Utils");
const Hashtable = require("./../../unisharp/Hashtable");
const RefOutArgWrapper = require("./../../unisharp/RefOutArgWrapper");

const Feature = require("./Feature");

/**
 * Описатель класса сущностей
 */
class ReferentClass {
    
    constructor() {
        this.hideInGraph = false;
        this.m_Features = new Array();
        this.m_Hash = new Hashtable();
    }
    
    get name() {
        return "?";
    }
    
    get caption() {
        return null;
    }
    
    toString() {
        return Utils.notNull(this.caption, this.name);
    }
    
    get features() {
        return this.m_Features;
    }
    
    /**
     * Добавить атрибут
     * @param attrName 
     * @param attrCaption 
     * @param lowBound 
     * @param upBound 
     * @return 
     */
    addFeature(attrName, attrCaption, lowBound = 0, upBound = 0) {
        let res = Feature._new1750(attrName, attrCaption, lowBound, upBound);
        let ind = this.m_Features.length;
        this.m_Features.push(res);
        if (!this.m_Hash.containsKey(attrName)) 
            this.m_Hash.put(attrName, ind);
        else 
            this.m_Hash.put(attrName, ind);
        return this.m_Features[ind];
    }
    
    /**
     * Найти атрибут по его системному имени
     * @param _name 
     * @return 
     */
    findFeature(_name) {
        let ind = 0;
        let wrapind1751 = new RefOutArgWrapper();
        let inoutres1752 = this.m_Hash.tryGetValue(_name, wrapind1751);
        ind = wrapind1751.value;
        if (!inoutres1752) 
            return null;
        else 
            return this.m_Features[ind];
    }
    
    /**
     * Вычислить картинку
     * @param obj если null, то общая картинка для типа
     * @return идентификатор картинки, саму картинку можно будет получить через ProcessorService.GetImageById
     */
    getImageId(obj = null) {
        return null;
    }
}


module.exports = ReferentClass