/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");
const PersonPropertyKind = require("./../PersonPropertyKind");
const Referent = require("./../../Referent");

class MetaPersonProperty extends ReferentClass {
    
    static initialize() {
        const PersonPropertyReferent = require("./../PersonPropertyReferent");
        MetaPersonProperty.globalMeta = new MetaPersonProperty();
        MetaPersonProperty.globalMeta.addFeature(PersonPropertyReferent.ATTR_NAME, "Наименование", 1, 1);
        MetaPersonProperty.globalMeta.addFeature(PersonPropertyReferent.ATTR_HIGHER, "Вышестоящее свойство", 0, 0);
        MetaPersonProperty.globalMeta.addFeature(PersonPropertyReferent.ATTR_ATTR, "Атрибут", 0, 0);
        MetaPersonProperty.globalMeta.addFeature(PersonPropertyReferent.ATTR_REF, "Ссылка на объект", 0, 1);
        MetaPersonProperty.globalMeta.addFeature(Referent.ATTR_GENERAL, "Обобщающее свойство", 1, 0);
    }
    
    get name() {
        const PersonPropertyReferent = require("./../PersonPropertyReferent");
        return PersonPropertyReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Свойство персоны";
    }
    
    getImageId(obj = null) {
        const PersonPropertyReferent = require("./../PersonPropertyReferent");
        let ki = PersonPropertyKind.UNDEFINED;
        if (obj instanceof PersonPropertyReferent) 
            ki = obj.kind;
        if (ki === PersonPropertyKind.BOSS) 
            return MetaPersonProperty.PERSON_PROP_BOSS_IMAGE_ID;
        if (ki === PersonPropertyKind.KING) 
            return MetaPersonProperty.PERSON_PROP_KING_IMAGE_ID;
        if (ki === PersonPropertyKind.KIN) 
            return MetaPersonProperty.PERSON_PROP_KIN_IMAGE_ID;
        if (ki === PersonPropertyKind.MILITARYRANK) 
            return MetaPersonProperty.PERSON_PROP_MILITARY_ID;
        if (ki === PersonPropertyKind.NATIONALITY) 
            return MetaPersonProperty.PERSON_PROP_NATION_ID;
        return MetaPersonProperty.PERSON_PROP_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaPersonProperty.PERSON_PROP_IMAGE_ID = "personprop";
        MetaPersonProperty.PERSON_PROP_KING_IMAGE_ID = "king";
        MetaPersonProperty.PERSON_PROP_BOSS_IMAGE_ID = "boss";
        MetaPersonProperty.PERSON_PROP_KIN_IMAGE_ID = "kin";
        MetaPersonProperty.PERSON_PROP_MILITARY_ID = "militaryrank";
        MetaPersonProperty.PERSON_PROP_NATION_ID = "nationality";
        MetaPersonProperty.globalMeta = null;
    }
}


MetaPersonProperty.static_constructor();

module.exports = MetaPersonProperty