/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../metadata/ReferentClass");
const ResumeItemType = require("./ResumeItemType");

class MetaResume extends ReferentClass {
    
    static initialize() {
        const ResumeItemReferent = require("./ResumeItemReferent");
        MetaResume.GLOBAL_META = new MetaResume();
        MetaResume.TYPES = MetaResume.GLOBAL_META.addFeature(ResumeItemReferent.ATTR_TYPE, "Тип", 1, 1);
        MetaResume.TYPES.addValue(ResumeItemType.POSITION.toString().toLowerCase(), "Позиция", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.AGE.toString().toLowerCase(), "Возраст", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.SEX.toString().toLowerCase(), "Пол", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.EDUCATION.toString().toLowerCase(), "Образование", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.EXPERIENCE.toString().toLowerCase(), "Опыт работы", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.LANGUAGE.toString().toLowerCase(), "Язык", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.MONEY.toString().toLowerCase(), "Зарплата", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.DRIVINGLICENSE.toString().toLowerCase(), "Водительские права", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.LICENSE.toString().toLowerCase(), "Лицензия", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.SPECIALITY.toString().toLowerCase(), "Специальность", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.MORAL.toString().toLowerCase(), "Моральное качество", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.SKILL.toString().toLowerCase(), "Навык", null, null);
        MetaResume.TYPES.addValue(ResumeItemType.HOBBY.toString().toLowerCase(), "Хобби", null, null);
        MetaResume.GLOBAL_META.addFeature(ResumeItemReferent.ATTR_VALUE, "Значение", 0, 1);
        MetaResume.GLOBAL_META.addFeature(ResumeItemReferent.ATTR_REF, "Ссылка", 0, 0);
        MetaResume.GLOBAL_META.addFeature(ResumeItemReferent.ATTR_EXPIRED, "Признак неактуальности", 0, 1);
    }
    
    get name() {
        const ResumeItemReferent = require("./ResumeItemReferent");
        return ResumeItemReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Резюме";
    }
    
    getImageId(obj = null) {
        return MetaResume.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaResume.TYPES = null;
        MetaResume.IMAGE_ID = "resume";
        MetaResume.GLOBAL_META = null;
    }
}


MetaResume.static_constructor();

module.exports = MetaResume