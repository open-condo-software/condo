/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class UnitMeta extends ReferentClass {
    
    static initialize() {
        const UnitReferent = require("./../UnitReferent");
        UnitMeta.GLOBAL_META = new UnitMeta();
        UnitMeta.GLOBAL_META.addFeature(UnitReferent.ATTR_NAME, "Краткое наименование", 1, 0);
        UnitMeta.GLOBAL_META.addFeature(UnitReferent.ATTR_FULLNAME, "Полное наименование", 1, 0);
        UnitMeta.GLOBAL_META.addFeature(UnitReferent.ATTR_POW, "Степень", 0, 1);
        UnitMeta.GLOBAL_META.addFeature(UnitReferent.ATTR_BASEFACTOR, "Мультипликатор для базовой единицы", 0, 1);
        UnitMeta.GLOBAL_META.addFeature(UnitReferent.ATTR_BASEUNIT, "Базовая единица", 0, 1);
        UnitMeta.GLOBAL_META.addFeature(UnitReferent.ATTR_UNKNOWN, "Неизвестная метрика", 0, 1);
    }
    
    get name() {
        const UnitReferent = require("./../UnitReferent");
        return UnitReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Единицы измерения";
    }
    
    getImageId(obj = null) {
        return UnitMeta.IMAGE_ID;
    }
    
    static static_constructor() {
        UnitMeta.IMAGE_ID = "munit";
        UnitMeta.GLOBAL_META = null;
    }
}


UnitMeta.static_constructor();

module.exports = UnitMeta