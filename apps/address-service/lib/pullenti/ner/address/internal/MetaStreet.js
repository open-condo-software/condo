/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");
const StreetKind = require("./../StreetKind");

class MetaStreet extends ReferentClass {
    
    static initialize() {
        const StreetReferent = require("./../StreetReferent");
        MetaStreet.globalMeta = new MetaStreet();
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_TYPE, "Тип", 0, 0);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_KIND, "Класс", 0, 1);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_NAME, "Наименование", 0, 0);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_NUMBER, "Номер", 0, 1);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_HIGHER, "Вышележащая улица", 0, 1);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_GEO, "Географический объект", 0, 1);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_REF, "Ссылка на связанную сущность", 0, 0);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_MISC, "Дополнительно", 0, 0);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_FIAS, "Объект ФИАС", 0, 1);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_BTI, "Объект БТИ", 0, 1);
        MetaStreet.globalMeta.addFeature(StreetReferent.ATTR_OKM, "Код ОКМ УМ", 0, 1);
    }
    
    get name() {
        const StreetReferent = require("./../StreetReferent");
        return StreetReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Улица";
    }
    
    getImageId(obj = null) {
        const StreetReferent = require("./../StreetReferent");
        let s = Utils.as(obj, StreetReferent);
        if (s !== null) {
            if (s.kind === StreetKind.ORG) 
                return MetaStreet.IMAGE_TERR_ORG_ID;
            if (s.kind === StreetKind.AREA) 
                return MetaStreet.IMAGE_TERR_ID;
            if (s.kind === StreetKind.SPEC) 
                return MetaStreet.IMAGE_TERR_SPEC_ID;
        }
        return MetaStreet.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaStreet.IMAGE_ID = "street";
        MetaStreet.IMAGE_TERR_ID = "territory";
        MetaStreet.IMAGE_TERR_ORG_ID = "terrorg";
        MetaStreet.IMAGE_TERR_SPEC_ID = "terrspec";
        MetaStreet.globalMeta = null;
    }
}


MetaStreet.static_constructor();

module.exports = MetaStreet