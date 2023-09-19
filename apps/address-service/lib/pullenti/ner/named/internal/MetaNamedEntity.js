/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaNamedEntity extends ReferentClass {
    
    static initialize() {
        const NamedEntityReferent = require("./../NamedEntityReferent");
        MetaNamedEntity.GLOBAL_META = new MetaNamedEntity();
        MetaNamedEntity.GLOBAL_META.addFeature(NamedEntityReferent.ATTR_KIND, "Класс", 1, 1);
        MetaNamedEntity.GLOBAL_META.addFeature(NamedEntityReferent.ATTR_TYPE, "Тип", 0, 0);
        MetaNamedEntity.GLOBAL_META.addFeature(NamedEntityReferent.ATTR_NAME, "Наименование", 0, 0);
        MetaNamedEntity.GLOBAL_META.addFeature(NamedEntityReferent.ATTR_REF, "Ссылка", 0, 1);
    }
    
    get name() {
        const NamedEntityReferent = require("./../NamedEntityReferent");
        return NamedEntityReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Именованная сущность";
    }
    
    getImageId(obj = null) {
        const NamedEntityReferent = require("./../NamedEntityReferent");
        if (obj instanceof NamedEntityReferent) 
            return obj.kind.toString();
        return MetaNamedEntity.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaNamedEntity.IMAGE_ID = "monument";
        MetaNamedEntity.GLOBAL_META = null;
    }
}


MetaNamedEntity.static_constructor();

module.exports = MetaNamedEntity