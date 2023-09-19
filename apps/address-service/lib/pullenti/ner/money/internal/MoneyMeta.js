/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");

class MoneyMeta extends ReferentClass {
    
    static initialize() {
        const MoneyReferent = require("./../MoneyReferent");
        MoneyMeta.GLOBAL_META = new MoneyMeta();
        MoneyMeta.GLOBAL_META.addFeature(MoneyReferent.ATTR_CURRENCY, "Валюта", 1, 1);
        MoneyMeta.GLOBAL_META.addFeature(MoneyReferent.ATTR_VALUE, "Значение", 1, 1);
        MoneyMeta.GLOBAL_META.addFeature(MoneyReferent.ATTR_REST, "Остаток (100)", 0, 1);
        MoneyMeta.GLOBAL_META.addFeature(MoneyReferent.ATTR_ALTVALUE, "Другое значение", 1, 1);
        MoneyMeta.GLOBAL_META.addFeature(MoneyReferent.ATTR_ALTREST, "Другой остаток (100)", 0, 1);
    }
    
    get name() {
        const MoneyReferent = require("./../MoneyReferent");
        return MoneyReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Денежная сумма";
    }
    
    getImageId(obj = null) {
        const MoneyReferent = require("./../MoneyReferent");
        let m = Utils.as(obj, MoneyReferent);
        if (m !== null) {
            if (m.altValue !== null || m.altRest !== null) 
                return MoneyMeta.IMAGE2ID;
        }
        return MoneyMeta.IMAGE_ID;
    }
    
    static static_constructor() {
        MoneyMeta.IMAGE_ID = "sum";
        MoneyMeta.IMAGE2ID = "sumerr";
        MoneyMeta.GLOBAL_META = null;
    }
}


MoneyMeta.static_constructor();

module.exports = MoneyMeta