/*
 * SDK Pullenti Address, version 4.20, august 2023. Copyright (c) 2013, Pullenti. All rights reserved. 
 * Non-Commercial Freeware and Commercial Software.
 * This class is generated using the converter Unisharping (www.unisharping.ru) from Pullenti C# project. 
 * The latest version of the code is available on the site www.pullenti.ru
 */


const ReferentClass = require("./../../metadata/ReferentClass");
const Referent = require("./../../Referent");

class MetaPhone extends ReferentClass {
    
    static initialize() {
        const PhoneReferent = require("./../PhoneReferent");
        MetaPhone.globalMeta = new MetaPhone();
        MetaPhone.globalMeta.addFeature(PhoneReferent.ATTR_NUNBER, "Номер", 1, 1);
        MetaPhone.globalMeta.addFeature(PhoneReferent.ATTR_ADDNUMBER, "Добавочный номер", 0, 1);
        MetaPhone.globalMeta.addFeature(PhoneReferent.ATTR_COUNTRYCODE, "Код страны", 0, 1);
        MetaPhone.globalMeta.addFeature(Referent.ATTR_GENERAL, "Обобщающий номер", 0, 1);
        MetaPhone.globalMeta.addFeature(PhoneReferent.ATTR_KIND, "Тип", 0, 1);
    }
    
    get name() {
        const PhoneReferent = require("./../PhoneReferent");
        return PhoneReferent.OBJ_TYPENAME;
    }
    
    get caption() {
        return "Телефонный номер";
    }
    
    getImageId(obj = null) {
        return MetaPhone.PHONE_IMAGE_ID;
    }
    
    static static_constructor() {
        MetaPhone.PHONE_IMAGE_ID = "phone";
        MetaPhone.globalMeta = null;
    }
}


MetaPhone.static_constructor();

module.exports = MetaPhone