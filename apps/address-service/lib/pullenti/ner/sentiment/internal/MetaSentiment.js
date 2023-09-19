/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */

const Utils = require("./../../../unisharp/Utils");

const ReferentClass = require("./../../metadata/ReferentClass");
const SentimentKind = require("./../SentimentKind");

class MetaSentiment extends ReferentClass {
    
    static initialize() {
        const SentimentReferent = require("./../SentimentReferent");
        MetaSentiment.globalMeta = new MetaSentiment();
        let f = MetaSentiment.globalMeta.addFeature(SentimentReferent.ATTR_KIND, "Тип", 1, 1);
        MetaSentiment.FTYP = f;
        f.addValue(SentimentKind.UNDEFINED.toString(), "Неизвестно", null, null);
        f.addValue(SentimentKind.POSITIVE.toString(), "Положительно", null, null);
        f.addValue(SentimentKind.NEGATIVE.toString(), "Отрицательно", null, null);
        MetaSentiment.globalMeta.addFeature(SentimentReferent.ATTR_SPELLING, "Текст", 0, 0);
        MetaSentiment.globalMeta.addFeature(SentimentReferent.ATTR_REF, "Ссылка", 0, 0);
        MetaSentiment.globalMeta.addFeature(SentimentReferent.ATTR_COEF, "Коэффициент", 0, 0);
    }
    
    get name() {
        const SentimentReferent = require("./../SentimentReferent");
        return SentimentReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Сентимент";
    }
    
    getImageId(obj = null) {
        const SentimentReferent = require("./../SentimentReferent");
        let sy = Utils.as(obj, SentimentReferent);
        if (sy !== null) {
            if (sy.kind === SentimentKind.POSITIVE) 
                return MetaSentiment.IMAGE_ID_GOOD;
            if (sy.kind === SentimentKind.NEGATIVE) 
                return MetaSentiment.IMAGE_ID_BAD;
        }
        return MetaSentiment.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaSentiment.FTYP = null;
        MetaSentiment.IMAGE_ID_GOOD = "good";
        MetaSentiment.IMAGE_ID_BAD = "bad";
        MetaSentiment.IMAGE_ID = "unknown";
        MetaSentiment.globalMeta = null;
    }
}


MetaSentiment.static_constructor();

module.exports = MetaSentiment