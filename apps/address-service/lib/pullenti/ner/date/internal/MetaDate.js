/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");
const DatePointerType = require("./../DatePointerType");

class MetaDate extends ReferentClass {
    
    static initialize() {
        const DateReferent = require("./../DateReferent");
        MetaDate.GLOBAL_META = new MetaDate();
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_ISRELATIVE, "Относительность", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_CENTURY, "Век", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_DECADE, "Декада", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_YEAR, "Год", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_HALFYEAR, "Полугодие", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_QUARTAL, "Квартал", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_SEASON, "Сезон", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_MONTH, "Месяц", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_WEEK, "Неделя", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_DAY, "День", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_HOUR, "Час", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_MINUTE, "Минут", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_SECOND, "Секунд", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_DAYOFWEEK, "День недели", 0, 1);
        MetaDate.POINTER = MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_POINTER, "Указатель", 0, 1);
        MetaDate.POINTER.addValue(DatePointerType.BEGIN.toString(), "в начале", "на початку", "in the beginning");
        MetaDate.POINTER.addValue(DatePointerType.CENTER.toString(), "в середине", "в середині", "in the middle");
        MetaDate.POINTER.addValue(DatePointerType.END.toString(), "в конце", "в кінці", "in the end");
        MetaDate.POINTER.addValue(DatePointerType.TODAY.toString(), "настоящее время", "теперішній час", "today");
        MetaDate.POINTER.addValue(DatePointerType.WINTER.toString(), "зимой", "взимку", "winter");
        MetaDate.POINTER.addValue(DatePointerType.SPRING.toString(), "весной", "навесні", "spring");
        MetaDate.POINTER.addValue(DatePointerType.SUMMER.toString(), "летом", "влітку", "summer");
        MetaDate.POINTER.addValue(DatePointerType.AUTUMN.toString(), "осенью", "восени", "autumn");
        MetaDate.POINTER.addValue(DatePointerType.ABOUT.toString(), "около", "біля", "about");
        MetaDate.POINTER.addValue(DatePointerType.UNDEFINED.toString(), "Не определена", null, null);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_NEWSTYLE, "Дата нового стиля", 0, 1);
        MetaDate.GLOBAL_META.addFeature(DateReferent.ATTR_HIGHER, "Вышестоящая дата", 0, 1);
    }
    
    get name() {
        const DateReferent = require("./../DateReferent");
        return DateReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Дата";
    }
    
    getImageId(obj = null) {
        const DateReferent = require("./../DateReferent");
        let dat = Utils.as(obj, DateReferent);
        if (dat !== null && dat.isRelative) 
            return MetaDate.DATE_REL_IMAGE_ID;
        if (dat !== null && dat.hour >= 0) 
            return MetaDate.DATE_IMAGE_ID;
        else 
            return MetaDate.DATE_FULL_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaDate.POINTER = null;
        MetaDate.DATE_FULL_IMAGE_ID = "datefull";
        MetaDate.DATE_REL_IMAGE_ID = "daterel";
        MetaDate.DATE_IMAGE_ID = "date";
        MetaDate.GLOBAL_META = null;
    }
}


MetaDate.static_constructor();

module.exports = MetaDate