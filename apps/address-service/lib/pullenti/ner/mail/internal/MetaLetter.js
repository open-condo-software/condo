/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");

class MetaLetter extends ReferentClass {
    
    static initialize() {
        const MailReferent = require("./../MailReferent");
        MetaLetter.globalMeta = new MetaLetter();
        MetaLetter.globalMeta.addFeature(MailReferent.ATTR_KIND, "Тип блока", 1, 1);
        MetaLetter.globalMeta.addFeature(MailReferent.ATTR_TEXT, "Текст блока", 1, 1);
        MetaLetter.globalMeta.addFeature(MailReferent.ATTR_REF, "Ссылка на объект", 0, 0);
    }
    
    get name() {
        const MailReferent = require("./../MailReferent");
        return MailReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Блок письма";
    }
    
    getImageId(obj = null) {
        return MetaLetter.IMAGE_ID;
    }
    
    static static_constructor() {
        MetaLetter.IMAGE_ID = "letter";
        MetaLetter.globalMeta = null;
    }
}


MetaLetter.static_constructor();

module.exports = MetaLetter