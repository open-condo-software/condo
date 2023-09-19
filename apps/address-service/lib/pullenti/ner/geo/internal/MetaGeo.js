/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");

class MetaGeo extends ReferentClass {
    
    static initialize() {
        const GeoReferent = require("./../GeoReferent");
        MetaGeo.globalMeta = new MetaGeo();
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_NAME, "Наименование", 1, 0);
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_TYPE, "Тип", 1, 0);
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_ALPHA2, "Код страны", 0, 1);
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_HIGHER, "Вышестоящий объект", 0, 1);
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_REF, "Ссылка на объект", 0, 1);
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_MISC, "Дополнительно", 0, 0);
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_FIAS, "Объект ФИАС", 0, 1);
        MetaGeo.globalMeta.addFeature(GeoReferent.ATTR_BTI, "Код БТИ", 0, 1);
    }
    
    get name() {
        const GeoReferent = require("./../GeoReferent");
        return GeoReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Территориальное образование";
    }
    
    getImageId(obj = null) {
        const GeoReferent = require("./../GeoReferent");
        let ter = Utils.as(obj, GeoReferent);
        if (ter !== null) {
            if (ter.isUnion) 
                return MetaGeo.UNION_IMAGE_ID;
            if (ter.isCity && ((ter.isState || ter.isRegion))) 
                return MetaGeo.COUNTRY_CITY_IMAGE_ID;
            if (ter.isState) 
                return MetaGeo.COUNTRY_IMAGE_ID;
            if (ter.isCity) 
                return MetaGeo.CITY_IMAGE_ID;
            if (ter.isRegion && ter.higher !== null && ter.higher.isCity) 
                return MetaGeo.DISTRICT_IMAGE_ID;
        }
        return MetaGeo.REGION_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaGeo.COUNTRY_CITY_IMAGE_ID = "countrycity";
        MetaGeo.COUNTRY_IMAGE_ID = "country";
        MetaGeo.CITY_IMAGE_ID = "city";
        MetaGeo.DISTRICT_IMAGE_ID = "district";
        MetaGeo.REGION_IMAGE_ID = "region";
        MetaGeo.UNION_IMAGE_ID = "union";
        MetaGeo.globalMeta = null;
    }
}


MetaGeo.static_constructor();

module.exports = MetaGeo