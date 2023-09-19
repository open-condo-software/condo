/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");
const TransportKind = require("./../TransportKind");

class MetaTransport extends ReferentClass {
    
    static initialize() {
        const TransportReferent = require("./../TransportReferent");
        MetaTransport.globalMeta = new MetaTransport();
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_TYPE, "Тип", 0, 0);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_NAME, "Название", 0, 0);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_NUMBER, "Номер", 0, 1);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_NUMBER_REGION, "Регион номера", 0, 1);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_BRAND, "Марка", 0, 0);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_MODEL, "Модель", 0, 0);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_CLASS, "Класс", 0, 1);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_KIND, "Категория", 1, 1);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_GEO, "География", 0, 0);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_ORG, "Организация", 0, 1);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_DATE, "Дата создания", 0, 1);
        MetaTransport.globalMeta.addFeature(TransportReferent.ATTR_ROUTEPOINT, "Пункт маршрута", 0, 1);
    }
    
    get name() {
        const TransportReferent = require("./../TransportReferent");
        return TransportReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Транспорт";
    }
    
    getImageId(obj = null) {
        const TransportReferent = require("./../TransportReferent");
        if (obj instanceof TransportReferent) {
            let ok = obj.kind;
            if (ok !== TransportKind.UNDEFINED) 
                return ok.toString();
        }
        return MetaTransport.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaTransport.IMAGE_ID = "tansport";
        MetaTransport.globalMeta = null;
    }
}


MetaTransport.static_constructor();

module.exports = MetaTransport