/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MeasureMeta extends ReferentClass {
    
    static initialize() {
        const MeasureReferent = require("./../MeasureReferent");
        MeasureMeta.GLOBAL_META = new MeasureMeta();
        MeasureMeta.GLOBAL_META.addFeature(MeasureReferent.ATTR_TEMPLATE, "Шаблон", 1, 1);
        MeasureMeta.GLOBAL_META.addFeature(MeasureReferent.ATTR_VALUE, "Значение", 1, 0);
        MeasureMeta.GLOBAL_META.addFeature(MeasureReferent.ATTR_UNIT, "Единица измерения", 1, 2);
        MeasureMeta.GLOBAL_META.addFeature(MeasureReferent.ATTR_REF, "Ссылка на уточняющее измерение", 0, 0);
        MeasureMeta.GLOBAL_META.addFeature(MeasureReferent.ATTR_NAME, "Наименование", 0, 0);
        MeasureMeta.GLOBAL_META.addFeature(MeasureReferent.ATTR_KIND, "Тип", 0, 1);
    }
    
    get name() {
        const MeasureReferent = require("./../MeasureReferent");
        return MeasureReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Измеряемые величины";
    }
    
    getImageId(obj = null) {
        return MeasureMeta.IMAGE_ID;
    }
    
    static static_constructor() {
        MeasureMeta.IMAGE_ID = "measure";
        MeasureMeta.GLOBAL_META = null;
    }
}


MeasureMeta.static_constructor();

module.exports = MeasureMeta