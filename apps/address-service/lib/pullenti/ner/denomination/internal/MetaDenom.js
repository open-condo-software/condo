/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaDenom extends ReferentClass {
    
    static initialize() {
        const DenominationReferent = require("./../DenominationReferent");
        MetaDenom.globalMeta = new MetaDenom();
        MetaDenom.globalMeta.addFeature(DenominationReferent.ATTR_VALUE, "Значение", 0, 1);
    }
    
    get name() {
        const DenominationReferent = require("./../DenominationReferent");
        return DenominationReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Обозначение";
    }
    
    getImageId(obj = null) {
        return MetaDenom.DENOM_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaDenom.DENOM_IMAGE_ID = "denom";
        MetaDenom.globalMeta = null;
    }
}


MetaDenom.static_constructor();

module.exports = MetaDenom