/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");
const Referent = require("./../../Referent");

class MetaPerson extends ReferentClass {
    
    static initialize() {
        const PersonReferent = require("./../PersonReferent");
        MetaPerson.globalMeta = new MetaPerson();
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_IDENTITY, "Идентификация", 0, 0);
        let sex = MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_SEX, "Пол", 0, 0);
        sex.addValue(MetaPerson.ATTR_SEXMALE, "мужской", null, null);
        sex.addValue(MetaPerson.ATTR_SEXFEMALE, "женский", null, null);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_LASTNAME, "Фамилия", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_FIRSTNAME, "Имя", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_MIDDLENAME, "Отчество", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_NICKNAME, "Псевдоним", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_UNDEFNAME, "Непонятно что", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_NAMETYPE, "Тип именования", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_ATTR, "Свойство", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_AGE, "Возраст", 0, 1);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_BORN, "Родился", 0, 1);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_DIE, "Умер", 0, 1);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_CONTACT, "Контактные данные", 0, 0);
        MetaPerson.globalMeta.addFeature(PersonReferent.ATTR_IDDOC, "Удостоверение личности", 0, 0).showAsParent = true;
        MetaPerson.globalMeta.addFeature(Referent.ATTR_GENERAL, "Обобщающая персона", 0, 1);
    }
    
    get name() {
        const PersonReferent = require("./../PersonReferent");
        return PersonReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Персона";
    }
    
    getImageId(obj = null) {
        const PersonReferent = require("./../PersonReferent");
        let pers = Utils.as(obj, PersonReferent);
        if (pers !== null) {
            if (pers.findSlot("@GENERAL", null, true) !== null) 
                return MetaPerson.GENERAL_IMAGE_ID;
            if (pers.isMale) 
                return MetaPerson.MAN_IMAGE_ID;
            if (pers.isFemale) 
                return MetaPerson.WOMEN_IMAGE_ID;
        }
        return MetaPerson.PERSON_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaPerson.ATTR_SEXMALE = "MALE";
        MetaPerson.ATTR_SEXFEMALE = "FEMALE";
        MetaPerson.MAN_IMAGE_ID = "man";
        MetaPerson.WOMEN_IMAGE_ID = "women";
        MetaPerson.PERSON_IMAGE_ID = "person";
        MetaPerson.GENERAL_IMAGE_ID = "general";
        MetaPerson.globalMeta = null;
    }
}


MetaPerson.static_constructor();

module.exports = MetaPerson