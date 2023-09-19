/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../metadata/ReferentClass");
const VacanceItemType = require("./VacanceItemType");

class MetaVacance extends ReferentClass {
    
    static initialize() {
        const VacanceItemReferent = require("./VacanceItemReferent");
        MetaVacance.GLOBAL_META = new MetaVacance();
        MetaVacance.TYPES = MetaVacance.GLOBAL_META.addFeature(VacanceItemReferent.ATTR_TYPE, "Тип", 1, 1);
        MetaVacance.TYPES.addValue(VacanceItemType.NAME.toString().toLowerCase(), "Наименование", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.DATE.toString().toLowerCase(), "Дата", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.EDUCATION.toString().toLowerCase(), "Образование", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.EXPERIENCE.toString().toLowerCase(), "Опыт работы", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.LANGUAGE.toString().toLowerCase(), "Язык", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.MONEY.toString().toLowerCase(), "Зарплата", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.DRIVINGLICENSE.toString().toLowerCase(), "Водительские права", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.LICENSE.toString().toLowerCase(), "Лицензия", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.MORAL.toString().toLowerCase(), "Моральное требование", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.SKILL.toString().toLowerCase(), "Требование", null, null);
        MetaVacance.TYPES.addValue(VacanceItemType.PLUS.toString().toLowerCase(), "Пожелание", null, null);
        MetaVacance.GLOBAL_META.addFeature(VacanceItemReferent.ATTR_VALUE, "Значение", 0, 1);
        MetaVacance.GLOBAL_META.addFeature(VacanceItemReferent.ATTR_REF, "Ссылка", 0, 0);
        MetaVacance.GLOBAL_META.addFeature(VacanceItemReferent.ATTR_EXPIRED, "Признак неактуальности", 0, 1);
    }
    
    get name() {
        const VacanceItemReferent = require("./VacanceItemReferent");
        return VacanceItemReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Вакансия";
    }
    
    getImageId(obj = null) {
        return MetaVacance.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaVacance.TYPES = null;
        MetaVacance.IMAGE_ID = "vacance";
        MetaVacance.GLOBAL_META = null;
    }
}


MetaVacance.static_constructor();

module.exports = MetaVacance