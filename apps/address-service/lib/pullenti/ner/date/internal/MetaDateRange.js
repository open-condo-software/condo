/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaDateRange extends ReferentClass {
    
    static initialize() {
        const DateRangeReferent = require("./../DateRangeReferent");
        MetaDateRange.GLOBAL_META = new MetaDateRange();
        MetaDateRange.GLOBAL_META.addFeature(DateRangeReferent.ATTR_FROM, "Начало периода", 0, 1);
        MetaDateRange.GLOBAL_META.addFeature(DateRangeReferent.ATTR_TO, "Конец периода", 0, 1);
    }
    
    get name() {
        const DateRangeReferent = require("./../DateRangeReferent");
        return DateRangeReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Период";
    }
    
    getImageId(obj = null) {
        const DateRangeReferent = require("./../DateRangeReferent");
        if (obj instanceof DateRangeReferent) {
            if (obj.isRelative) 
                return MetaDateRange.DATE_RANGE_REL_IMAGE_ID;
        }
        return MetaDateRange.DATE_RANGE_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaDateRange.DATE_RANGE_IMAGE_ID = "daterange";
        MetaDateRange.DATE_RANGE_REL_IMAGE_ID = "daterangerel";
        MetaDateRange.GLOBAL_META = null;
    }
}


MetaDateRange.static_constructor();

module.exports = MetaDateRange