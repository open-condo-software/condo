/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaPersonIdentity extends ReferentClass {
    
    static initialize() {
        const PersonIdentityReferent = require("./../PersonIdentityReferent");
        MetaPersonIdentity.globalMeta = new MetaPersonIdentity();
        MetaPersonIdentity.globalMeta.addFeature(PersonIdentityReferent.ATTR_TYPE, "Тип", 1, 1);
        MetaPersonIdentity.globalMeta.addFeature(PersonIdentityReferent.ATTR_NUMBER, "Номер", 1, 1);
        MetaPersonIdentity.globalMeta.addFeature(PersonIdentityReferent.ATTR_DATE, "Дата выдачи", 0, 1);
        MetaPersonIdentity.globalMeta.addFeature(PersonIdentityReferent.ATTR_ORG, "Кто выдал", 0, 1);
        MetaPersonIdentity.globalMeta.addFeature(PersonIdentityReferent.ATTR_ADDRESS, "Адрес регистрации", 0, 1);
    }
    
    get name() {
        const PersonIdentityReferent = require("./../PersonIdentityReferent");
        return PersonIdentityReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Удостоверение личности";
    }
    
    getImageId(obj = null) {
        return MetaPersonIdentity.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaPersonIdentity.IMAGE_ID = "identity";
        MetaPersonIdentity.globalMeta = null;
    }
}


MetaPersonIdentity.static_constructor();

module.exports = MetaPersonIdentity