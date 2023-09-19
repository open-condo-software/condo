/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");
const BusinessFactKind = require("./../BusinessFactKind");

class MetaBusinessFact extends ReferentClass {
    
    constructor() {
        super();
        this.kindFeature = null;
    }
    
    static initialize() {
        const BusinessFactReferent = require("./../BusinessFactReferent");
        MetaBusinessFact.GLOBAL_META = new MetaBusinessFact();
        let f = MetaBusinessFact.GLOBAL_META.addFeature(BusinessFactReferent.ATTR_KIND, "Класс", 0, 1);
        MetaBusinessFact.GLOBAL_META.kindFeature = f;
        f.addValue(BusinessFactKind.CREATE.toString(), "Создавать", null, null);
        f.addValue(BusinessFactKind.DELETE.toString(), "Удалять", null, null);
        f.addValue(BusinessFactKind.HAVE.toString(), "Иметь", null, null);
        f.addValue(BusinessFactKind.GET.toString(), "Приобретать", null, null);
        f.addValue(BusinessFactKind.SELL.toString(), "Продавать", null, null);
        f.addValue(BusinessFactKind.PROFIT.toString(), "Доход", null, null);
        f.addValue(BusinessFactKind.DAMAGES.toString(), "Убытки", null, null);
        f.addValue(BusinessFactKind.AGREEMENT.toString(), "Соглашение", null, null);
        f.addValue(BusinessFactKind.SUBSIDIARY.toString(), "Дочернее предприятие", null, null);
        f.addValue(BusinessFactKind.FINANCE.toString(), "Финансировать", null, null);
        f.addValue(BusinessFactKind.LAWSUIT.toString(), "Судебный иск", null, null);
        MetaBusinessFact.GLOBAL_META.addFeature(BusinessFactReferent.ATTR_TYPE, "Тип", 0, 1);
        MetaBusinessFact.GLOBAL_META.addFeature(BusinessFactReferent.ATTR_WHO, "Кто", 0, 1).showAsParent = true;
        MetaBusinessFact.GLOBAL_META.addFeature(BusinessFactReferent.ATTR_WHOM, "Кого\\Кому", 0, 1).showAsParent = true;
        MetaBusinessFact.GLOBAL_META.addFeature(BusinessFactReferent.ATTR_WHEN, "Когда", 0, 1).showAsParent = true;
        MetaBusinessFact.GLOBAL_META.addFeature(BusinessFactReferent.ATTR_WHAT, "Что", 0, 0).showAsParent = true;
        MetaBusinessFact.GLOBAL_META.addFeature(BusinessFactReferent.ATTR_MISC, "Дополнительная информация", 0, 0).showAsParent = true;
    }
    
    get name() {
        const BusinessFactReferent = require("./../BusinessFactReferent");
        return BusinessFactReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Бизнес-факт";
    }
    
    getImageId(obj = null) {
        return MetaBusinessFact.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaBusinessFact.IMAGE_ID = "businessfact";
        MetaBusinessFact.GLOBAL_META = null;
    }
}


MetaBusinessFact.static_constructor();

module.exports = MetaBusinessFact