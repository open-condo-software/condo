/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");
const KeywordType = require("./../KeywordType");

class KeywordMeta extends ReferentClass {
    
    static initialize() {
        const KeywordReferent = require("./../KeywordReferent");
        KeywordMeta.GLOBAL_META = new KeywordMeta();
        KeywordMeta.GLOBAL_META.addFeature(KeywordReferent.ATTR_TYPE, "Тип", 1, 1);
        KeywordMeta.GLOBAL_META.addFeature(KeywordReferent.ATTR_VALUE, "Значение", 1, 0);
        KeywordMeta.GLOBAL_META.addFeature(KeywordReferent.ATTR_NORMAL, "Нормализация", 1, 0);
        KeywordMeta.GLOBAL_META.addFeature(KeywordReferent.ATTR_REF, "Ссылка", 0, 0);
    }
    
    get name() {
        const KeywordReferent = require("./../KeywordReferent");
        return KeywordReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Ключевое слово";
    }
    
    getImageId(obj = null) {
        const KeywordReferent = require("./../KeywordReferent");
        let m = Utils.as(obj, KeywordReferent);
        if (m !== null) {
            if (m.typ === KeywordType.PREDICATE) 
                return KeywordMeta.IMAGE_PRED;
            if (m.typ === KeywordType.REFERENT) 
                return KeywordMeta.IMAGE_REF;
        }
        return KeywordMeta.IMAGE_OBJ;
    }
    
    static static_constructor() {
        KeywordMeta.IMAGE_OBJ = "kwobject";
        KeywordMeta.IMAGE_PRED = "kwpredicate";
        KeywordMeta.IMAGE_REF = "kwreferent";
        KeywordMeta.GLOBAL_META = null;
    }
}


KeywordMeta.static_constructor();

module.exports = KeywordMeta